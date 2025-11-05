import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const userId = url.searchParams.get("state");

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id (state)" }, { status: 400 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_PROJECT_URL!}api/google/callback`

  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri
  );

  const { tokens } = await oauth2Client.getToken(code!);
  const { access_token, refresh_token, expiry_date } = tokens;

  await supabase
    .from("profiles")
    .update({
      google_access_token: access_token,
      google_refresh_token: refresh_token,
      google_token_expires_at: expiry_date ? new Date(expiry_date).toISOString() : null,
    })
    .eq("id", userId);

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_PROJECT_URL!}dashboard`);
}
