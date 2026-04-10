// api/webhook.js
// Vercel Serverless Function — 接收 Stripe 付款成功通知

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 不解析 body（Stripe 需要原始 buffer 来验证签名）
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook 签名验证失败:', err.message);
    return res.status(400).json({ error: 'Webhook signature failed' });
  }

  // 处理付款成功事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const tier = session.metadata?.tier || 'vip';
    const sessionId = session.id;
    const customerEmail = session.customer_details?.email || '';

    // 这里可以把付款记录存到你的数据库
    // 目前用 Stripe session ID 作为凭证，check-access 接口会验证
    console.log(`付款成功: tier=${tier}, session=${sessionId}, email=${customerEmail}`);
  }

  res.status(200).json({ received: true });
};
