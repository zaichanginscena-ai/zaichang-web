// api/check-access.js
// Vercel Serverless Function — 验证用户是否已付款

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
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
      return res.status(200).json({
        access: true,
        tier,
        email: session.customer_details?.email || '',
      });
    } else {
      return res.status(200).json({ access: false, tier: 'free' });
    }
  } catch (err) {
    console.error('Check access error:', err.message);
    return res.status(200).json({ access: false, tier: 'free' });
  }
};
