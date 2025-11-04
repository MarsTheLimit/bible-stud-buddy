import { NextResponse } from "next/server";
import { fetchAllGoogleEvents } from "@/lib/googleApi";
import { createServerClient } from '@supabase/ssr';
import { cookies } from "next/headers";

export async function POST() {
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

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Auth error:', userError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await fetchAllGoogleEvents(supabase, user.id);
    return NextResponse.json({ events });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching Google events:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    } else {
      console.error("Error fetching Google events:", error);
      return NextResponse.json(
        { error: "Unkown Error" },
        { status: 500 }
      );
    }
  }
}