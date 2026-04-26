/* ============================================================
   api/webhook.js — Stripe webhook handler
   Vercel serverless function (CommonJS)
   bodyParser disabled so Stripe signature can be verified on raw body
   ============================================================ */

module.exports.config = { api: { bodyParser: false } };

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Read raw body for Stripe signature verification
  let rawBody = '';
  try {
    await new Promise(function (resolve, reject) {
      req.on('data', function (chunk) { rawBody += chunk.toString(); });
      req.on('end', resolve);
      req.on('error', reject);
    });
  } catch (err) {
    console.error('Webhook body read error:', err);
    return res.status(400).json({ error: 'Could not read request body' });
  }

  const sig           = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature invalid: ' + err.message });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const entries    = (session.metadata && session.metadata.entries)     || '';
      const entryCount = parseInt((session.metadata && session.metadata.entry_count) || '1', 10);
      const totalEur   = (isNaN(entryCount) ? 1 : entryCount) * 5;
      const sessionId  = session.id;

      // Call send-entry-email handler directly with a mock req/res
      const sendEntryEmail = require('./send-entry-email');

      const mockReq = {
        method: 'POST',
        body:   { entries: entries, totalEur: totalEur, sessionId: sessionId },
      };

      const mockRes = {
        _status: 200,
        status: function (code) { this._status = code; return this; },
        json: function (body) {
          if (this._status >= 400) {
            console.error('send-entry-email returned error:', this._status, body);
          }
          return this;
        },
      };

      await sendEntryEmail(mockReq, mockRes);
    } catch (emailErr) {
      // Log but still return 200 — Stripe retries on non-2xx, avoid duplicate emails
      console.error('Failed to send entry notification email:', emailErr);
    }
  }

  return res.status(200).json({ received: true });
};
