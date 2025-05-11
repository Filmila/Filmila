import { loadStripe } from '@stripe/stripe-js';

export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
export const stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_KEY;

// Validate environment variables
if (!stripePublishableKey) {
  console.error('Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
}

if (!stripeSecretKey) {
  console.error('Missing VITE_STRIPE_SECRET_KEY environment variable');
}

// Initialize Stripe
export const stripePromise = loadStripe(stripePublishableKey || ''); 