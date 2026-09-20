/**
 * Nutra Blue — Web App que registra los leads de suscripcion en Google Sheets.
 *
 * Es la via directa entre la API y la planilla: no necesita n8n ni credenciales
 * de Google en el servidor, porque el script corre dentro de la propia planilla.
 *
 * COMO DESPLEGARLO
 * 1. Abrir la planilla de leads de NutraBlue en Google Sheets.
 * 2. Extensiones > Apps Script. Pegar este archivo completo y guardar.
 * 3. Ajustar SHEET_NAME si la hoja no se llama "Leads".
 * 4. Definir un token: Configuracion del proyecto > Propiedades del script >
 *    agregar la propiedad LEADS_TOKEN con un string aleatorio largo.
 *    (Si se deja vacia, el endpoint acepta cualquier POST.)
 * 5. Implementar > Nueva implementacion > tipo "Aplicacion web":
 *      - Ejecutar como: Yo
 *      - Quien tiene acceso: Cualquier persona
 *    Copiar la URL /exec que entrega.
 * 6. En el entorno de la API definir:
 *      GOOGLE_SHEETS_LEADS_WEBHOOK=<la URL /exec>
 *      GOOGLE_SHEETS_LEADS_TOKEN=<el mismo LEADS_TOKEN>
 *
 * Cada vez que se cambia el script hay que crear una implementacion nueva
 * (o actualizar la existente) para que la URL sirva la version nueva.
 */

const SHEET_NAME = 'Leads';
const HEADERS = ['Fecha', 'Email', 'Origen', 'Cupon', 'Descuento'];

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    const expectedToken = PropertiesService.getScriptProperties().getProperty('LEADS_TOKEN');
    if (expectedToken && body.token !== expectedToken) {
      return jsonResponse({ ok: false, error: 'token invalido' });
    }

    const email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      return jsonResponse({ ok: false, error: 'falta el email' });
    }

    const sheet = getSheet();
    const row = findRowByEmail(sheet, email);
    const values = [
      body.date || new Date().toISOString(),
      email,
      body.source || 'website',
      body.coupon_code || '',
      body.discount || '',
    ];

    // Un mismo correo no debe duplicar filas: si ya existe, se actualiza.
    if (row > 0) {
      sheet.getRange(row, 1, 1, values.length).setValues([values]);
      return jsonResponse({ ok: true, action: 'updated', row: row });
    }

    sheet.appendRow(values);
    return jsonResponse({ ok: true, action: 'appended', row: sheet.getLastRow() });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  // Sirve para comprobar desde el navegador que la implementacion quedo publicada.
  return jsonResponse({ ok: true, service: 'nutrablue-leads' });
}

function getSheet() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = doc.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRowByEmail(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const emails = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (let i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).trim().toLowerCase() === email) {
      return i + 2;
    }
  }
  return -1;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
