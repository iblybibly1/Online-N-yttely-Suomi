/* ============================================================
   api/checkout.js — Stripe Checkout session creator
   Vercel serverless function (CommonJS)
   ============================================================ */

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://nattelysuomi.fi').replace(/\/$/, '');

    const lineItems = items.map(function (item) {
      const description = [item.horseName, item.riderName, item.competitionName]
        .filter(Boolean)
        .join(' · ')
        .slice(0, 500);

      return {
        price_data: {
          currency: 'eur',
          unit_amount: Math.round((Number(item.priceEur) || 5) * 100),
          product_data: {
            name:        (item.className || 'Class entry').slice(0, 127),
            description: description || undefined,
          },
        },
        quantity: 1,
      };
    });

    const entriesSummary = items
      .map(function (item) {
        return [item.className, item.horseName, item.riderName].filter(Boolean).join(' / ');
      })
      .join(' | ')
      .slice(0, 490);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items:           lineItems,
      mode:                 'payment',
      success_url:          siteUrl + '/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:           siteUrl + '/cancel.html',
      metadata: {
        entries:     entriesSummary,
        entry_count: String(items.length),
        source:      'nattely-suomi',
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
