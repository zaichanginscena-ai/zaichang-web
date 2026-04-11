const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid') {
      const tier = session.metadata?.tier || 'vip';
      return res.status(200).json({ access: true, tier });
    }
    return res.status(200).json({ access: false, tier: 'free' });
  } catch (err) {
    return res.status(200).json({ access: false, tier: 'free' });
  }
}
