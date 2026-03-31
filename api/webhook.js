export default async function handler(req, res) {
  // Enforce POST method configuration
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fullName, countryCode, whatsappNumber, procedure, urgency } = req.body;

  // ML Logic Simulator: Priority Scoring Output Injection
  let priority_score = 5.0; // Default baseline score
  
  // ML Logic: If procedure == 'Hair Transplant' AND Urgency == 'Immediate', set priority_score = 9.8/10.
  if (procedure === 'Hair Transplant' && urgency === 'Immediate') {
    priority_score = 9.8;
  }

  // --- Replace this webhook string with your exact Google Sheet Webhook URL for the video demo ---
  const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxsp48Dd1KP5rFeVDzU86Uo5qTR8mjeLC8efnMgWdWEKSinHbgsX2hXr9lbLAuhAGywjQ/exec";

  // Data mapping logic for Google Sheets column ingestion
  const payloadToSheet = {
    Name: fullName,
    WhatsApp: `${countryCode} ${whatsappNumber}`,
    Service: procedure,
    Timeline: urgency,
    AIScore: `${priority_score}/10`
  };

  try {
    // If you have a valid URL, it will fetch. If left default, we bypass to allow the UI to continue simulating the AI delay.
    if (GOOGLE_SHEETS_WEBHOOK_URL !== "YOUR_GOOGLE_SHEETS_WEBHOOK_URL_HERE") {
        await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadToSheet)
        });
    }

    // Success response formatted for Vercel outputs
    return res.status(200).json({ 
        success: true, 
        message: "High-Priority Status Assigned.",
        computed_score: priority_score
    });

  } catch (error) {
    console.error("Webhook processing failed:", error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
