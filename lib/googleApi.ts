// lib/googleApi.ts
import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

interface UserTokens {
  google_access_token: string;
  google_refresh_token: string;
  google_token_expires_at: string;
}

async function saveTokensForUser(
  supabase: SupabaseClient,
  userId: string,
  newAccessToken: string,
  newExpiryDate: Date
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      google_access_token: newAccessToken,
      google_token_expires_at: newExpiryDate.toISOString(),
    })
    .eq("id", userId);
  if (error) console.error("Failed to update tokens in Supabase:", error);
}

async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token || !credentials.expiry_date) {
    throw new Error("Failed to refresh access token");
  }

  return {
    accessToken: credentials.access_token,
    expiryDate: new Date(credentials.expiry_date),
  };
}

export async function fetchAllGoogleEvents(
    supabase: SupabaseClient,
    userId: string,
    // maxDate: Date | null, // Keeping this commented out as in the original
) {
    // --- 1. Fetch token data ---
    const { data: userData, error: fetchError } = await supabase
        .from("profiles")
        .select("google_access_token, google_refresh_token, google_token_expires_at")
        .eq("id", userId)
        .single();

    if (fetchError || !userData)
        throw new Error("User or token data not found in Supabase.");

    let {
        google_access_token: currentAccessToken,
        google_refresh_token: refreshToken,
        google_token_expires_at: tokenExpiryDateStr,
    } = userData as UserTokens;

    const tokenExpiryDate = new Date(tokenExpiryDateStr);
    const now = new Date();
    // Refresh token if it expires in less than 5 minutes
    const isExpired = tokenExpiryDate.getTime() < now.getTime() + 5 * 60 * 1000;

    // --- 2. Refresh if expired ---
    if (isExpired) {
        console.log("Access token expired. Refreshing...");
        const { accessToken: newAccessToken, expiryDate: newExpiryDate } =
            await refreshAccessToken(refreshToken);
        await saveTokensForUser(supabase, userId, newAccessToken, newExpiryDate);
        currentAccessToken = newAccessToken;
    }

    // --- 3. Initialize Google API ---
    const oauth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    );
    oauth2Client.setCredentials({
        access_token: currentAccessToken,
        refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // --- 4. Get all calendars and FILTER OUT HOLIDAYS ---
    const calendarsRes = await calendar.calendarList.list();
    const allCalendars = calendarsRes.data.items || [];

    const filteredCalendars = allCalendars.filter(
        (c) => {
            // 1. Exclude the app's custom calendar
            const isNotAppCalendar = !c.summary?.toLowerCase().includes("bible studdy buddy");
            
            // 2. Exclude the **Holidays** calendar (standard Google identifier format)
            const isNotHolidayCalendar = !c.id?.includes('#holiday@group.v.calendar.google.com');

            // 3. Exclude the 'Contacts' (birthdays/anniversaries) calendar
            const isNotContactsCalendar = !c.id?.includes('contact@group.v.calendar.google.com');

            // Include the calendar only if it passes all exclusion checks
            return isNotAppCalendar && isNotHolidayCalendar && isNotContactsCalendar;
        }
    );
    
    const calendarIds = filteredCalendars.map((c) => c.id).filter((id): id is string => !!id);

    const allEvents: any[] = [];

    // --- 5. Fetch all events ---
    for (const calId of calendarIds) {
        let nextPageToken: string | undefined = undefined;

        do {
            const res = await calendar.events.list({
                calendarId: calId,
                maxResults: 2500, // Fetch up to 2500 per calendar/page
                singleEvents: true,
                orderBy: "startTime",
                pageToken: nextPageToken,
                // Using a wide date range for demonstration, adjust as needed for efficiency
                timeMin: new Date(2000, 0, 1).toISOString(),
                timeMax: new Date(2100, 0, 1).toISOString(),
            });

            if (res.data.items) {
                const timeZone =
                    res.data.timeZone ||
                    calendarsRes.data.items?.find(c => c.id === calId)?.timeZone ||
                    "UTC";

                allEvents.push(
                    ...res.data.items.map((e: any) => {
                        const isAllDay = !!e.start?.date && !e.start?.dateTime;

                        let startDate: Date | null = null;
                        let endDate: Date | null = null;

                        if (isAllDay) {
                            // All-day events are stored as dates only (e.g., "2025-10-31").
                            // We treat them as starting at midnight on the start date.
                            startDate = e.start?.date ? new Date(`${e.start.date}T00:00:00`) : null;
                            endDate = e.end?.date ? new Date(`${e.end.date}T00:00:00`) : null;
                            
                            // Note: Google's all-day event end date is the day *after* the event ends.
                            // The calendar library often needs the actual end day. This logic handles
                            // converting the string date to a proper Date object.
                        } else {
                            // Timed events: Google provides ISO strings with timezone info.
                            startDate = e.start?.dateTime ? new Date(e.start.dateTime) : null;
                            endDate = e.end?.dateTime ? new Date(e.end.dateTime) : null;
                        }

                        return {
                            id: e.id,
                            title: e.summary,
                            start: startDate, // Now a Date object
                            end: endDate,     // Now a Date object
                            isAllDay,
                            timeZone: e.start?.timeZone || e.end?.timeZone || timeZone,
                            calendarId: calId,
                            recurringEventId: e.recurringEventId,
                        };
                    })
                );
            }

            nextPageToken = res.data.nextPageToken || undefined;
        } while (nextPageToken);
    }

    return allEvents;
}

export async function syncEventsToGoogleCalendar(
  supabase: SupabaseClient,
  userId: string,
  events: {
    title: string;
    start: string | Date;
    end: string | Date;
    description?: string;
  }[],
  calendarName: string = "Synced Events"
) {
  // 1. Get stored Google tokens
  const { data: userData, error: fetchError } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token, google_token_expires_at")
    .eq("id", userId)
    .single();

  if (fetchError || !userData)
    throw new Error("User or token data not found in Supabase.");

  let {
    google_access_token: currentAccessToken,
    google_refresh_token: refreshToken,
    google_token_expires_at: tokenExpiryDateStr,
  } = userData as UserTokens;

  // 2. Refresh expired access token if needed
  const tokenExpiryDate = new Date(tokenExpiryDateStr);
  const now = new Date();
  const isExpired = tokenExpiryDate.getTime() < now.getTime() + 5 * 60 * 1000;

  if (isExpired) {
    console.log("Access token expired. Refreshing...");
    const { accessToken: newAccessToken, expiryDate: newExpiryDate } =
      await refreshAccessToken(refreshToken);
    await saveTokensForUser(supabase, userId, newAccessToken, newExpiryDate);
    currentAccessToken = newAccessToken;
  }

  // 3. Init Google Calendar API client
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
  oauth2Client.setCredentials({
    access_token: currentAccessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // 4. Find and DELETE existing calendar with this name
  const { data: calendarList } = await calendar.calendarList.list();
  const existingCalendar = calendarList.items?.find(
    (c) => c.summary === calendarName
  );

  if (existingCalendar) {
    try {
      await calendar.calendars.delete({
        calendarId: existingCalendar.id!,
      });
      console.log(`Deleted existing calendar: ${calendarName}`);
    } catch (error) {
      console.error(`Failed to delete calendar: ${calendarName}`, error);
      throw new Error("Failed to delete existing calendar");
    }
  }

  // 5. Create a NEW calendar
  let targetCalendar;
  try {
    const { data: newCal } = await calendar.calendars.insert({
      requestBody: {
        summary: calendarName,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });
    targetCalendar = newCal!;
    console.log(`Created new calendar: ${calendarName}`);
  } catch (error) {
    console.error("Failed to create new calendar:", error);
    throw new Error("Failed to create new calendar");
  }

  // 6. Push events to the new calendar
  let successCount = 0;
  let failCount = 0;

  for (const ev of events) {
    try {
      await calendar.events.insert({
        calendarId: targetCalendar.id!,
        requestBody: {
          summary: ev.title,
          description: ev.description || "",
          start: {
            dateTime: new Date(ev.start).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: new Date(ev.end).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      });
      successCount++;
    } catch (error) {
      console.error("Failed to insert event:", ev.title, error);
      failCount++;
    }
  }

  console.log(`Synced ${successCount} events to Google Calendar. Failed: ${failCount}`);
  
  return {
    success: true,
    syncedCount: successCount,
    failedCount: failCount,
    calendarId: targetCalendar.id,
  };
}
