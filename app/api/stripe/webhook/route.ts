import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

// Secure server-side Supabase client (requires SERVICE key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  console.log("Webhook received");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed:`, errorMessage);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  const data = event.data.object as Stripe.Checkout.Session | Stripe.Subscription | Stripe.Invoice;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = data as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) {
          console.error('Missing userId or subscriptionId on checkout.session.completed');
          return new NextResponse('Missing Data', { status: 400 });
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            account_type: 'pro',
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            trial_ends_at: null,
            trial_used: true,
            tokens_left: 25_000,
          })
          .eq('id', userId);

        if (updateError) throw updateError;
        console.log(`User ${userId} upgraded to Pro!`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = data as Stripe.Invoice;

        // Safe type check for optional subscription field
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
        if (!subscriptionId) {
          console.warn("Invoice does not have a subscription ID:", invoice.id);
          break;
        }

        const { data: profile, error: fetchError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (fetchError || !profile) {
          console.warn('No matching user found for payment_succeeded:', subscriptionId);
          break;
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ tokens_left: 25_000, account_type: 'pro' })
          .eq('id', profile.id);

        if (updateError) throw updateError;
        console.log(`Tokens renewed for user ${profile.id}.`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = data as Stripe.Invoice;

        // Safe type check for optional subscription field
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
        if (!subscriptionId) {
          console.warn("Invoice does not have a subscription ID:", invoice.id);
          break;
        }

        const { data: profile, error: fetchError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (fetchError || !profile) {
          console.warn('No matching user found for payment_failed:', subscriptionId);
          break;
        }

        const { error: warnError } = await supabaseAdmin
          .from('profiles')
          .update({ account_type: 'pro_limited' })
          .eq('id', profile.id);

        if (warnError) throw warnError;
        console.log(`Payment failed — user ${profile.id} access temporarily limited.`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = data as Stripe.Subscription;
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (fetchError || !profile) {
          console.warn('Could not find user for canceled subscription:', subscription.id);
          break;
        }

        const { error: downgradeError } = await supabaseAdmin
          .from('profiles')
          .update({
            account_type: 'free',
            stripe_subscription_id: null,
            stripe_customer_id: null,
            tokens_left: 0,
          })
          .eq('id', profile.id);

        if (downgradeError) throw downgradeError;
        console.log(`User ${profile.id} downgraded to Free.`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
