/* ============================================================
   api/send-entry-email.js — sends entry notification email via Resend
   Vercel serverless function (CommonJS)
   ============================================================ */

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { entries, totalEur, sessionId } = req.body;

    if (!entries) {
      return res.status(400).json({ error: 'No entries provided' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'info@nattelysuomi.fi';

    // entries format: "Class / Horse / Rider | Class / Horse / Rider"
    const entryRows = String(entries)
      .split('|')
      .map(function (r) { return r.trim(); })
      .filter(Boolean);

    function safeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    const entryRowsHtml = entryRows.map(function (row) {
      return (
        '<tr>' +
          '<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a">' +
            safeHtml(row) +
          '</td>' +
          '<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;color:#166534">' +
            '€5.00' +
          '</td>' +
        '</tr>'
      );
    }).join('');

    const totalFormatted = typeof totalEur === 'number'
      ? '€' + Number(totalEur).toFixed(2)
      : '€' + (entryRows.length * 5).toFixed(2);

    const sessionLine = sessionId
      ? '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:13px;color:#166534">' +
          '<strong>Stripe session:</strong> ' + safeHtml(String(sessionId)) +
        '</div>'
      : '';

    const html =
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
      '<title>New Entries — Nättely Suomi</title></head>' +
      '<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">' +
      '<div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">' +

        '<div style="background:#166534;padding:24px 32px">' +
          '<div style="color:white;font-size:20px;font-weight:800">🐴 Nättely Suomi</div>' +
          '<div style="color:#bbf7d0;font-size:14px;margin-top:4px">New entries received</div>' +
        '</div>' +

        '<div style="padding:32px">' +
          '<h2 style="margin:0 0 8px;font-size:22px;color:#0f172a">New show entries</h2>' +
          '<p style="margin:0 0 24px;color:#64748b;font-size:14px">A payment was completed on Nättely Suomi. Entry details below.</p>' +

          sessionLine +

          '<table style="width:100%;border-collapse:collapse;margin-bottom:24px">' +
            '<thead>' +
              '<tr style="background:#f8fafc">' +
                '<th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;border-bottom:2px solid #e2e8f0">Entry (Class / Horse / Rider)</th>' +
                '<th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;border-bottom:2px solid #e2e8f0">Fee</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + entryRowsHtml + '</tbody>' +
            '<tfoot>' +
              '<tr style="background:#f8fafc">' +
                '<td style="padding:12px;font-weight:700;font-size:15px;color:#0f172a">Total</td>' +
                '<td style="padding:12px;font-weight:800;font-size:15px;color:#166534">' + totalFormatted + '</td>' +
              '</tr>' +
            '</tfoot>' +
          '</table>' +

          '<p style="margin:0;color:#94a3b8;font-size:12px">This email was sent automatically when a Stripe checkout.session.completed event was received.</p>' +
        '</div>' +

        '<div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8">' +
          '© 2026 Nättely Suomi Oy · <a href="https://nattelysuomi.fi" style="color:#166534">nattelysuomi.fi</a>' +
        '</div>' +
      '</div></body></html>';

    const result = await resend.emails.send({
      from:    'Nättely Suomi <noreply@nattelysuomi.fi>',
      to:      [adminEmail],
      subject: 'New entries: ' + entryRows.length + ' class entr' + (entryRows.length !== 1 ? 'ies' : 'y') + ' · ' + totalFormatted,
      html:    html,
    });

    return res.status(200).json({ success: true, id: result.id });
  } catch (err) {
    console.error('Send email error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
