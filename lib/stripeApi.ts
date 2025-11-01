import { loadStripe } from "@stripe/stripe-js";
import { Stripe } from "@stripe/stripe-js";

// The Stripe Promise you already have
export const stripePromise: Promise<Stripe | null> = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

/**
 * Initiates the Stripe Checkout process for a recurring subscription.
 */
export async function redirectToSubscription(userId: string) {
    if (!userId) {
        console.error("User ID is required for Stripe redirection.");
        alert("Please log in to start a subscription.");
        return;
    }
    const stripe = await stripePromise;
    if (!stripe) {
        console.error("Stripe failed to load.");
        alert("Payment service is unavailable. Please try again later.");
        return;
    }

    // 1. Call the Next.js API route to create the Subscription Checkout Session
    const response = await fetch('/api/stripe/create-subscription-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
            successUrl: `${window.location.origin}/dashboard`,
            cancelUrl: `${window.location.origin}/pricing`,
            userId: userId
        }),
    });

    const data = await response.json();

    if (data.sessionUrl) {
        window.location.assign(data.sessionUrl);
        
    } else {
        console.error('API Error:', data.error);
        alert('Failed to start subscription checkout. Please try again.');
    }
}
/**
 * Sends a request to the server to cancel an existing Stripe subscription.
 * @param currentStripeSubscriptionId The ID of the Stripe subscription to cancel.
 * @returns A promise that resolves to true if cancellation request was successful.
 */
export async function cancelSubscription(currentStripeSubscriptionId: string): Promise<boolean> {
    const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId: currentStripeSubscriptionId }),
    });

    const data = await response.json();

    if (data.success) {
        // // The subscription is now set to cancel at the period end.
        return true;
    } else {
        console.error('Cancellation Error:', data.error);
        alert('Failed to cancel subscription. Please try again.');
        return false;
    }
}