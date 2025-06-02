// Netlify funkce pro proxy k Google Sheets
// Nativní fetch je dostupný v Netlify runtime

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma, Expires',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Type': 'text/csv'
    };

    // Zpracování OPTIONS requestu pro CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Extrahovat parametry z query string
        const { spreadsheetId, gid } = event.queryStringParameters || {};
        
        if (!spreadsheetId) {
            return {
                statusCode: 400,
                headers,
                body: 'Chybí spreadsheetId parametr'
            };
        }

        // Sestavit URL pro Google Sheets CSV export
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        
        const googleSheetsUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid || '0'}&cachebust=${timestamp}&rand=${randomId}&force=1&refresh=1&nocache=1`;
        
        console.log('Načítám data z:', googleSheetsUrl);

        // Fetch dat z Google Sheets s minimálními headers
        const response = await fetch(googleSheetsUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Netlify-Function/1.0)',
                'Accept': 'text/csv, text/plain, */*'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            console.error('Google Sheets odpověď:', response.status, response.statusText);
            return {
                statusCode: response.status,
                headers,
                body: `Chyba při načítání dat: ${response.status} ${response.statusText}`
            };
        }

        const csvData = await response.text();
        console.log('Úspěšně načteno', csvData.length, 'znaků');
        console.log('První 200 znaků:', csvData.substring(0, 200));

        // Kontrola, zda se jedná o CSV nebo HTML
        if (csvData.startsWith('<!DOCTYPE html>') || csvData.includes('<html')) {
            console.error('Received HTML instead of CSV!');
            return {
                statusCode: 500,
                headers,
                body: `Chyba: Google Sheets vrátil HTML místo CSV. Možná je spreadsheet neveřejný.`
            };
        }

        return {
            statusCode: 200,
            headers,
            body: csvData
        };

    } catch (error) {
        console.error('Chyba v proxy funkci:', error);
        return {
            statusCode: 500,
            headers,
            body: `Serverová chyba: ${error.message}`
        };
    }
}; 