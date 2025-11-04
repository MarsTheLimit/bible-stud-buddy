import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

type UserProfile = {
  id: string;
  email: string;
  created_at: string;
};

type Member = {
  user: UserProfile;
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const groupId = url.searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }

    const { data: members, error } = await supabase
      .from("user_groups")
      .select(`user:profiles (id,email,created_at)`)
      .eq("group_id", groupId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = (members as unknown as Member[])?.map((m) => m.user) ?? [];

    return NextResponse.json({ users });
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
        { error: "Unknown Error" },
        { status: 500 }
      );
    }
  }
}