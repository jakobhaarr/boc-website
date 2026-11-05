/**
 * Legger en ny Mallorca-påmelding inn som en rad i regnearket «Mallorca 2027». Brukes av nettsiden (lib/trip-sheet.ts).
 *
 * Slik setter du det opp, én gang:
 *  1. Åpne regnearket, velg Utvidelser > Apps Script, og lim inn hele denne filen. Bytt HEMMELIGHET under til en lang, tilfeldig tekst.
 *  2. Velg Distribuer > Ny distribusjon > Type: Nettapp. «Kjør som»: deg. «Hvem har tilgang»: Alle. Trykk Distribuer og godkjenn tilgangen.
 *  3. Kopier nettapp-adressen (slutter på /exec).
 *  4. I Vercel (Settings > Environment Variables, Production) legger du inn:
 *       TRIP_SHEET_URL      = lenken til regnearket (delt slik at alle med lenken kan se)
 *       TRIP_SHEET_WEBHOOK  = nettapp-adressen fra steg 3
 *       TRIP_SHEET_SECRET   = den samme hemmeligheten som under
 *     og kjører Redeploy.
 *
 * Raden får kolonnene i samme rekkefølge som regnearket: WhatsApp (tom), Navn, Ankommer, Retur, Tlf, Mail, Enkeltrom/dobbeltrom,
 * Bor sammen med, Leie/egen sykkel, Nærmeste pårørende, Kontakttelefon. Den legges nederst under siste rad med innhold.
 */
const HEMMELIGHET = "bytt-meg-til-en-lang-tilfeldig-tekst";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== HEMMELIGHET || !Array.isArray(data.row) || data.row.length !== 11) return svar_({ ok: false });
    const ark = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    ark.appendRow(data.row.map((v) => String(v)));
    return svar_({ ok: true });
  } catch (err) {
    return svar_({ ok: false });
  } finally {
    lock.releaseLock();
  }
}

function svar_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
