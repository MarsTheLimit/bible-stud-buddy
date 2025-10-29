import { NextRequest, NextResponse } from "next/server";
import { fetchAllGoogleEvents } from "@/lib/googleApi";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Get session instead of getUser - this is more reliable
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  console.log('Session in route handler:', !!session);
  console.log('Session error:', sessionError);

  if (sessionError || !session || !session.user) {
    console.error('Auth failed in route handler:', sessionError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await fetchAllGoogleEvents(supabase, session.user.id);
    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Error fetching Google events:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}