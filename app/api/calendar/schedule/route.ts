import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { UserScheduleData } from "@/components/PreferencesPopup";

// --- Interface Definitions ---

export type Event = {
  title: string;
  description: string;
  start: string;
  end: string;
};

// Define the shape of the incoming data
interface StudyPlanData {
    name: string;
    userPrefs: UserScheduleData;
    dateEnds: string;
    studyArea: string | null;
    userEvents: Event[];
}

// Next.js App Router POST handler
export async function POST(request: Request) {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  try {
    const { name, userPrefs, dateEnds, studyArea, userEvents } : StudyPlanData = await request.json();

    // console.log(userEvents)

    const preferenceDetails = `
- **Personal Schedule:** The user is a ${userPrefs.morning_person ? '**MORNING PERSON** (schedule earlier)' : 'night owl (schedule later)'}.
- **Daily Availability:** The user describes their busyness level as **${userPrefs.busyness}**.
- **Optimal Days:** Least busy days: **${userPrefs.least_busy_days?.join(', ') || 'None provided'}**.
- **Wake/Sleep Times:** Sessions must start **NO EARLIER** than **${userPrefs.earliest_awake || '4:00 AM'}** and **NO LATER** than **${userPrefs.latest_asleep || '11:00 PM'}**.
- **Study Session Length:** Each session lasts exactly **${userPrefs.study_session_length} minutes**. The AI should **ONLY choose the start time**. The backend will compute the end time.
- **Other Notes:** ${userPrefs.other_info || 'No additional information.'}
`;

const nowISO = new Date().toISOString();

const prompt = `
You are an expert personal scheduling assistant. You must generate a valid JSON array of Bible study events that meet **all rules** below.

============================================================
### 🔹 TODAY’S ANCHOR (STRICT)
Use this timestamp as the baseline for all scheduling:
**${nowISO}**

Never schedule an event in the past.

### 🔹 DATE WINDOW LIMITS
- Earliest start allowed: **${nowISO}**
- Latest end allowed: **${dateEnds}**
DO NOT schedule outside this window.
============================================================

### STUDY INFORMATION
- Study Name: "${name}"
- Target end date: ${dateEnds}

### EXISTING USER EVENTS (NO OVERLAP + 15-MIN BUFFER)
Events (ISO timestamps):
${JSON.stringify(
  userEvents.map(({ title, start, end }) => ({ title, start, end })),
  null,
  2
)}

Rules:
- No overlaps allowed.
- Add **minimum 15-minute buffer** before and after every existing event.

============================================================
### USER PREFERENCES (FOLLOW STRICTLY)
${preferenceDetails}
============================================================

### TITLE + DESCRIPTION FORMAT
${
  studyArea && studyArea.trim() !== ""
    ? `
- title: "[Book] X:Y-Z - ${name}" — must relate to: **${studyArea}**
- description: actionable Bible study task based on **${studyArea}**
`
    : `
- title: "Bible Study - ${name}"
- description: "" (empty)
`
}

============================================================
### EVENT TIME FORMAT (VERY IMPORTANT)
- You must generate a **start time only**.
- The **end time will be calculated by the backend** using the study session length.
- Therefore, set "end": "" for every event.
- Start times must be valid **ISO 8601 timestamps** with timezone.

============================================================
### FINAL OUTPUT FORMAT (REQUIRED)
Output **ONLY** a JSON array of events.

Each event MUST follow this shape:

{
  "title": string,
  "description": string,
  "start": string (ISO timestamp),
  "end": ""      // leave blank — backend calculates it
}

No wrapper object.
No extra text.
No comments.
Only the JSON array.
============================================================

Generate the schedule now.
`;


    // 3. Call OpenAI with JSON Mode
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional scheduler that outputs ONLY a valid JSON array of structured events. Do not include any preceding or trailing text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }, // Crucial for reliable JSON output
      temperature: 0.5,
    });

    // 4. Extract and Parse the JSON output
    const jsonString = completion.choices[0]?.message.content;
    if (!jsonString) {
      return NextResponse.json({ error: 'OpenAI returned empty content.' }, { status: 500 });
    }
    
    // The expected output is an object containing the array, so we must parse it carefully
    const responseData = JSON.parse(jsonString);
    
    // Assuming the model returns the array directly or inside a property like { events: [] }
    // We'll try to handle the JSON gracefully:
    const scheduleArray: Event[] = Array.isArray(responseData) 
      ? responseData 
      : responseData.schedule || responseData.events || []; // Check common wrapping keys

    if (scheduleArray.length === 0) {
      return NextResponse.json({ error: 'OpenAI returned a JSON object but no events were found.' }, { status: 500 });
    }

    if (!completion.usage) {
      return NextResponse.json({ error: 'OpenAI returned a JSON object with events but no token amount.' }, { status: 500 });
    }

    console.log("Schedule: ", scheduleArray);
    console.log("Tokens Used: ", completion.usage.total_tokens);

    // 5. Success response
    return NextResponse.json({ 
      message: 'Schedule successfully generated and parsed.',
      scheduleEvents: scheduleArray, // Return the structured array
      usage: completion.usage.total_tokens
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while generating schedule.', details: (error as Error).message }, 
      { status: 500 }
    );
  }
}