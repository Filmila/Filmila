import { supabase } from '../config/supabase';
import { stripeSecretKey } from '../config/stripe';
import Stripe from 'stripe';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
});

export const paymentService = {
  async createPaymentSession(filmId: string, price: number, successUrl: string, cancelUrl: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check for existing payment
    const { data: existingPayment } = await supabase
      .from('film_payments')
      .select('*')
      .eq('film_id', filmId)
      .eq('viewer_id', user.id)
      .in('status', ['pending', 'completed'])
      .single();

    if (existingPayment) {
      throw new Error('You have already initiated or completed a payment for this film.');
    }

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Film Access',
              description: 'Access to watch the film',
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        filmId,
        userId: user.id,
      },
    });

    // Create a pending payment record
    const { error } = await supabase
      .from('film_payments')
      .insert({
        film_id: filmId, // filmId is already a UUID string
        viewer_id: user.id,
        stripe_payment_id: session.id,
        amount: price,
        status: 'pending',
      });

    if (error) throw error;

    return session;
  },

  async verifyPayment(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) throw new Error('Payment session not found');

    const { filmId, userId } = session.metadata || {};
    if (!filmId || !userId) throw new Error('Invalid session metadata');

    if (session.payment_status === 'paid') {
      // Update payment status in database
      const { error } = await supabase
        .from('film_payments')
        .update({ status: 'completed' })
        .match({ stripe_payment_id: sessionId });

      if (error) throw error;
      return true;
    }

    return false;
  },

  async hasAccessToFilm(filmId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if user is the filmmaker
    const { data: film } = await supabase
      .from('films')
      .select('filmmaker')
      .eq('id', filmId) // filmId is already a UUID string
      .single();

    if (film?.filmmaker === user.email) return true;

    // Check if user has paid for the film
    const { data: payment } = await supabase
      .from('film_payments')
      .select('status')
      .eq('film_id', filmId) // filmId is already a UUID string
      .eq('viewer_id', user.id)
      .eq('status', 'completed')
      .single();

    return !!payment;
  }
}; 