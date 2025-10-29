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
  userId: string
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

  // --- 4. Get all calendars ---
  const calendarsRes = await calendar.calendarList.list();
  const calendarIds = calendarsRes.data.items?.map((c) => c.id) || [];

  const allEvents: any[] = [];

  // --- 5. Fetch all events ---
  for (const calId of calendarIds) {
    let nextPageToken: string | undefined = undefined;

    do {
      const res = await calendar.events.list({
        calendarId: calId,
        maxResults: 2500,
        singleEvents: true,
        orderBy: "startTime",
        pageToken: nextPageToken,
        timeMin: new Date(2000, 0, 1).toISOString(),
        timeMax: new Date(2100, 0, 1).toISOString(),
      });

      if (res.data.items) {
        allEvents.push(
          ...res.data.items.map((e: { id: any; summary: any; start: { dateTime: any; date: any; }; end: { dateTime: any; date: any; }; recurringEventId: any; }) => ({
            id: e.id,
            title: e.summary,
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date,
            calendarId: calId,
            recurringEventId: e.recurringEventId,
          }))
        );
      }

      nextPageToken = res.data.nextPageToken || undefined;
    } while (nextPageToken);
  }

  return allEvents;
}
