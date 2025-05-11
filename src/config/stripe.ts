import { loadStripe } from '@stripe/stripe-js';

export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RNVpdHJXEj8hz9l18SBJDlDTHmcyPlUYl06FJwyefj4nIcYU9EJjJkNSb73WZGxU4HOJPblW3F8C2RXCOCqg0Cl00ElgdN2tB';
export const stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_KEY || 'sk_test_51RNVpdHJXEj8hz9lhcZzsfweNzWjiIz3CooAyjXvme7YwK83UUAG4Vb5J1beqLXtygf10nbd1gFDXcaxC7m1RCEB00P2ZPFxO6';

// Initialize Stripe
export const stripePromise = loadStripe(stripePublishableKey); 