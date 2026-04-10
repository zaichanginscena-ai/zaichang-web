// api/create-checkout.js
// Vercel Serverless Function — 创建 Stripe 支付链接

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 在 Stripe 后台创建好产品后，把 Price ID 填在这里
const PRICE_IDS = {
  vip:     process.env.STRIPE_PRICE_VIP,     // 例：price_xxxxxxxxxxxxxxxx
  premium: process.env.STRIPE_PRICE_PREMIUM, // 例：price_xxxxxxxxxxxxxxxx
};

module.exports = async (req, res) => {
  // 只接受 POST
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
      line_items: [{
        price: PRICE_IDS[tier],
        quantity: 1,
      }],
      mode: 'payment',
      // 付款成功后跳回网页，带上 session_id 用于验证
      success_url: `${process.env.APP_URL}?payment=success&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url:  `${process.env.APP_URL}?payment=cancelled`,
      metadata: { tier },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: '支付链接创建失败' });
  }
};
