/**
 * ============================================================
 *  ENFIELD ROYAL — Automated WhatsApp Confirmation
 *  Vercel Serverless Function: api/send-whatsapp.js
 * ============================================================
 *  Accepts POST: { customerName, customerPhone, procedure, aiScore }
 *  Supports BOTH Twilio and UltraMsg — toggle via PROVIDER env var.
 *
 *  ENV VARIABLES (set these in Vercel Dashboard > Settings > Env):
 *
 *  WHATSAPP_PROVIDER       = "ultramsg" | "twilio"
 *
 *  --- UltraMsg ---
 *  ULTRAMSG_INSTANCE_ID    = your instance ID  (e.g. "instance12345")
 *  ULTRAMSG_TOKEN          = your UltraMsg token
 *  WHATSAPP_FROM_NUMBER    = your UltraMsg WhatsApp sender (e.g. "+971500000000")
 *
 *  --- Twilio ---
 *  TWILIO_ACCOUNT_SID      = your Twilio Account SID
 *  TWILIO_AUTH_TOKEN       = your Twilio Auth Token
 *  TWILIO_WHATSAPP_FROM    = your Twilio sandbox/sender (e.g. "whatsapp:+14155238886")
 * ============================================================
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { customerName, customerPhone, procedure, aiScore } = req.body;

  // ── Validate required fields ──────────────────────────────
  if (!customerName || !customerPhone || !procedure || !aiScore) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: customerName, customerPhone, procedure, aiScore',
    });
  }

  // ── Build message template ────────────────────────────────
  const messageBody =
    `Hello ${customerName}, this is the automated concierge at Enfield Royal Clinic. ` +
    `We have received your request for a ${procedure} consultation. ` +
    `Your profile has been assigned a priority score of ${aiScore}/10. ` +
    `Our senior coordinator will call you shortly to confirm your VIP time slot. 👑`;

  const provider = (process.env.WHATSAPP_PROVIDER || 'ultramsg').toLowerCase();

  try {
    if (provider === 'ultramsg') {
      await sendViaUltraMsg(customerPhone, messageBody);
    } else if (provider === 'twilio') {
      await sendViaTwilio(customerPhone, messageBody);
    } else {
      return res.status(400).json({ success: false, message: `Unknown provider: ${provider}` });
    }

    console.log(`✅ WhatsApp sent to ${customerPhone} via ${provider}`);
    return res.status(200).json({ success: true, provider, recipient: customerPhone });

  } catch (error) {
    console.error(`❌ WhatsApp send failed via ${provider}:`, error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─── UltraMsg Provider ────────────────────────────────────────

async function sendViaUltraMsg(toPhone, message) {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token      = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    throw new Error('ULTRAMSG_INSTANCE_ID and ULTRAMSG_TOKEN env vars are required.');
  }

  const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;

  const body = new URLSearchParams({
    token,
    to:      toPhone,    // format: "+971501234567"
    body:    message,
    priority: '1',
  });

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || `UltraMsg API error: HTTP ${response.status}`);
  }

  return data;
}

// ─── Twilio Provider ──────────────────────────────────────────

async function sendViaTwilio(toPhone, message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // "whatsapp:+14155238886"

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM env vars are required.');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const body = new URLSearchParams({
    From: fromNumber,
    To:   `whatsapp:${toPhone}`,
    Body: message,
  });

  const response = await fetch(url, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.status === 'failed') {
    throw new Error(data.message || `Twilio API error: HTTP ${response.status}`);
  }

  return data;
}
