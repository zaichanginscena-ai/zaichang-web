const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  vip: process.env.STRIPE_PRICE_VIP,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { tier } = req.body;
  if (!tier || !PRICE_IDS[tier]) {
    return res.status(400).json({ error: 'Invalid tier' });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
      mode: 'payment',
      success_url: `${process.env.APP_URL}?payment=success&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${process.env.APP_URL}?payment=cancelled`,
      metadata: { tier },
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: '支付链接创建失败' });
  }
}
