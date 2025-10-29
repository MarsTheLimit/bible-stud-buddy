// app/api/stripe/create-subscription-session/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { priceId, successUrl, cancelUrl, userId } = await req.json() as {
        priceId: string;
        successUrl: string;
        cancelUrl: string;
        userId: string;
    };
    
    if (!priceId || !successUrl || !cancelUrl || !userId) {
      return NextResponse.json({ error: 'Missing required parameters: priceId, successUrl, cancelUrl, or userId' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', 
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId, 
      
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    
    // 🚨 FIX: Return the session URL instead of just the session ID
    return NextResponse.json({ sessionUrl: session.url });

  } catch (error) {
    console.error('Stripe Subscription Session Error:', error);
    return NextResponse.json({ error: 'Failed to create subscription session' }, { status: 500 });
  }
}