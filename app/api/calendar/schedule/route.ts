import OpenAI from "openai";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

export async function POST(req: Request) {
  const { access_token, userId, groupIds } = await req.json();

  // --- 1. Get Google Calendar events ---
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);

  const googleEventsResponse = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: nextMonth.toISOString(),
  });

  const googleEvents = (googleEventsResponse.data.items || []).map(e => ({
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    title: e.summary || "Google Event",
    source: "google",
  }));

  // --- 2. Get Supabase personal events ---
  let personalEvents: any[] = [];
  const personalData = await getGroupEvents(supabase, null); // personal = null
  for (const e of personalData) {
    personalEvents.push({
      start: new Date(e.date).toISOString(),
      end: new Date(e.end_date).toISOString(),
      title: e.title,
      source: "personal",
      groupName: null,
    });
  }

  // --- 3. Get Supabase group events ---
  let groupEvents: any[] = [];
  if (groupIds && groupIds.length > 0) {
    for (const gid of groupIds) {
      const groupData = await getGroupEvents(supabase, gid);
      for (const e of groupData) {
        const groupName = await getGroupFromEvent(supabase, e.id);
        groupEvents.push({
          start: new Date(e.date).toISOString(),
          end: new Date(e.end_date).toISOString(),
          title: groupName ? `${groupName} - ${e.title}` : e.title,
          source: "group",
          groupName,
        });
      }
    }
  }

  // --- 4. Combine all events ---
  const combinedEvents = [...googleEvents, ...personalEvents, ...groupEvents];

  // --- 5. Build GPT prompt ---
  const prompt = `
You are scheduling Bible study sessions for a user. Consider their busy schedule:
${JSON.stringify(combinedEvents, null, 2)}

Schedule 8-12 Bible study sessions over the next month, each 30 minutes long.
Ensure sessions do not conflict with any existing events.
Return as JSON array with "dateTimeStart" and "dateTimeEnd".
`;

  // --- 6. Ask GPT-5 ---
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [{ role: "user", content: prompt }],
  });

  const schedule = JSON.parse(aiResponse.choices[0].message.content);

  // --- 7. Insert Bible study sessions into Google Calendar ---
  for (const study of schedule) {
    await calendar.events.insert({
      calendarId: "primary",
      resource: {
        summary: "Bible Study",
        start: { dateTime: study.dateTimeStart },
        end: { dateTime: study.dateTimeEnd },
      },
    });
  }

  return new Response(JSON.stringify({ success: true, scheduled: schedule }));
}
