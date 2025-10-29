import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// IMPORTANT: Use the Service Role Key for secure server-side operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.SUPABASE_SERVICE_KEY)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    // 1. Construct the Stripe event for security verification
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    // Fails if the signature is invalid (i.e., not from Stripe)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed.`, errorMessage);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // 2. Identify the core data object
  const data = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;
  
  // 3. Process the Event Type
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = data as Stripe.Checkout.Session;
      
      // Get the user ID you passed in client_reference_id
      const userId = session.client_reference_id; 
      
      // Get the subscription ID created by the session
      const subscriptionId = session.subscription as string; 
      
      if (!userId || !subscriptionId) {
        console.error('Missing userId or subscriptionId in completed session.');
        return new NextResponse('Missing Data', { status: 400 });
      }

      // 4. Update Supabase: Successful Subscription Activation
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          account_type: 'pro',
          stripe_subscription_id: subscriptionId,
          // Optional: You can also save the customer ID here for future use
          stripe_customer_id: session.customer as string, 
          trial_ends_at: null, // End the trial immediately if one was active
          trial_used: true,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Supabase update failed on checkout.session.completed:', updateError);
        return new NextResponse(`Database Error: ${updateError.message}`, { status: 500 });
      }
      
      console.log(`User ${userId} successfully upgraded to Pro.`);
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = data as Stripe.Subscription;
      
      // Find the user by their canceled subscription ID
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();
        
      if (fetchError || !profile) {
          console.error('Failed to find user for canceled subscription:', subscription.id);
          break; // Continue, but log the error
      }
      const { error: downgradeError } = await supabaseAdmin
        .from('profiles')
        .update({
          account_type: 'free',
          stripe_subscription_id: null,
          stripe_customer_id: null,
        })
        .eq('id', profile.id);

      if (downgradeError) {
        console.error('Supabase downgrade failed on subscription.deleted:', downgradeError);
        return new NextResponse(`Database Error: ${downgradeError.message}`, { status: 500 });
      }
      
      console.log(`User ${profile.id} downgraded to Free.`);
      break;
    }
    
    // Add other events (e.g., invoice.payment_failed) as needed...
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // 6. Success response to Stripe
  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}