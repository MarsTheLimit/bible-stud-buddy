import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient"; 

export async function POST(req: Request) {
    try {
        const { name, email, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await supabase.from("contact_messages").insert([{ name, email, message }]);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
