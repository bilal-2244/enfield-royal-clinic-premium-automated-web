/**
 * ============================================================
 *  ENFIELD ROYAL — Google Apps Script (GAS)
 *  Paste this ENTIRE file into your Google Apps Script editor
 *  and click "Deploy > Manage Deployments > Update".
 * ============================================================
 *
 *  COLUMNS it will write to your Sheet (in order):
 *  Timestamp | Name | WhatsApp | Procedure | Urgency |
 *  BaseWeight | Multiplier | AIScore | PriorityTier | ResponseETA
 * ============================================================
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Add header row automatically on first run
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Name', 'WhatsApp', 'Procedure', 'Urgency',
        'Base Weight', 'Multiplier', 'AI Score', 'Priority Tier', 'Response ETA'
      ]);
    }

    // Read URL parameters sent by the website
    const p = e.parameter;

    sheet.appendRow([
      p.Timestamp   || new Date().toLocaleString(),
      p.Name        || '',
      p.WhatsApp    || '',
      p.Procedure   || '',
      p.Urgency     || '',
      p.BaseWeight  || '',
      p.Multiplier  || '',
      p.AIScore     || '',
      p.PriorityTier || '',
      p.ResponseETA  || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Keep doPost as a fallback for Vercel deployments
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data  = JSON.parse(e.postData.contents);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Name', 'WhatsApp', 'Procedure', 'Urgency',
        'Base Weight', 'Multiplier', 'AI Score', 'Priority Tier', 'Response ETA'
      ]);
    }

    sheet.appendRow([
      data.Timestamp    || new Date().toLocaleString(),
      data.Name         || '',
      data.WhatsApp     || '',
      data.Procedure    || '',
      data.Urgency      || '',
      data.BaseWeight   || '',
      data.Multiplier   || '',
      data.AIScore      || '',
      data.PriorityTier || '',
      data.ResponseETA  || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
