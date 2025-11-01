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
        if (error instanceof Error){
            console.error(error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        } else {
            console.error("Unknown error: ", error);
            return NextResponse.json({ error: error }, { status: 500 });
        }
    }
}
