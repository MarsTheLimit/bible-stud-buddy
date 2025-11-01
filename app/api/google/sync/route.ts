import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { syncEventsToGoogleCalendar } from "@/lib/googleApi";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { events, calendarName } = await req.json();
  if (!events || !Array.isArray(events))
    return NextResponse.json({ error: "Invalid events payload" }, { status: 400 });

  try {
    await syncEventsToGoogleCalendar(supabase, user.id, events, calendarName);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Google sync error:", error);
    return NextResponse.json({ error: error.message || "Sync failed" }, { status: 500 });
  }
}
