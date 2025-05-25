/**
 * Google Apps Script Proxy pro načítání dat z Google Sheets
 * 
 * Jak nastavit:
 * 1. Jděte na https://script.google.com/
 * 2. Vytvořte nový projekt
 * 3. Vložte tento kód
 * 4. Nasaďte jako webovou aplikaci (Deploy > New deployment)
 * 5. Nastavte přístup na "Anyone" 
 * 6. Zkopírujte URL webové aplikace
 */

function doGet(e) {
  try {
    // ID Google Sheets tabulky
    const SPREADSHEET_ID = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
    
    // Získáme parametry z URL
    const gid = e.parameter.gid || '0'; // Defaultně hlavní list
    const format = e.parameter.format || 'csv';
    
    // Sestavíme URL pro export
    const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=${format}&gid=${gid}`;
    
    // Načteme data
    const response = UrlFetchApp.fetch(exportUrl);
    const csvData = response.getContentText();
    
    // Vrátíme data s CORS hlavičkami
    return ContentService
      .createTextOutput(csvData)
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
  } catch (error) {
    // Vrátíme chybu
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString(),
        message: 'Chyba při načítání dat z Google Sheets'
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

function doOptions(e) {
  // Obsluha preflight CORS požadavků
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
}

/**
 * Testovací funkce pro ověření funkčnosti
 */
function testProxy() {
  const testRequest = {
    parameter: {
      gid: '0',
      format: 'csv'
    }
  };
  
  const result = doGet(testRequest);
  console.log('Test result:', result.getContent());
} 