import { NextResponse } from "next/server";
import { google } from "googleapis";

const redirectUri = `${process.env.NEXT_PUBLIC_PROJECT_URL!}api/google/callback`

console.log(redirectUri)

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    prompt: "consent",
  });

  return NextResponse.redirect(authUrl);
}