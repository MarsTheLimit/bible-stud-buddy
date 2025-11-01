import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

export async function POST(req: Request) {
  try {
    const { priceId, successUrl, cancelUrl, userId } = await req.json();

    if (!priceId || !successUrl || !cancelUrl || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error: unknown) {
    console.error("Stripe session creation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
