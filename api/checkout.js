// api/checkout.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Olé Learning Premium',
              description: 'Unlimited words, quizzes, and AI tools.',
            },
            unit_amount: 999, // £9.99 in pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Or 'subscription' if you want recurring
      success_url: `${req.headers.origin}/?payment=success`,
      cancel_url: `${req.headers.origin}/?payment=cancelled`,
      metadata: {
        userId: userId, // CRITICAL: We pass the Firebase User ID to Stripe
      },
      customer_email: email,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}