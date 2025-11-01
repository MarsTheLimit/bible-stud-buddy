import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

export async function POST(req: Request) {
  try {
    const { subscriptionId } = await req.json() as { subscriptionId: string };

    if (!subscriptionId) {
        return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // The user retains access until the last paid day.
    const subscription = await stripe.subscriptions.update(
        subscriptionId, 
        { cancel_at_period_end: true }
    );
    
    return NextResponse.json({ 
        success: true, 
        message: 'Cancellation scheduled for the end of the current billing period.',
        status: subscription.status,
    });

  } catch (error) {
    console.error('Stripe Cancellation Error:', error);
    // Handle the case where the subscription ID doesn't exist
    if (error instanceof Error && 'rawType' in error && error.rawType === 'invalid_request_error') {
        return NextResponse.json({ error: 'Invalid or missing subscription ID.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to process cancellation request' }, { status: 500 });
  }
}