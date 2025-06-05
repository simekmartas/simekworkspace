# Návod: Vytvoření Google Apps Script Proxy

## Krok 1: Vytvoření Google Apps Script

1. **Jděte na**: https://script.google.com/
2. **Klikněte na**: "Nový projekt"
3. **Smažte** výchozí kód
4. **Vložte** tento kód:

```javascript
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
```

## Krok 2: Uložení a pojmenování

1. **Klikněte na**: "Uložit" (ikona diskety)
2. **Pojmenujte projekt**: "Google Sheets CSV Proxy"
3. **Klikněte na**: "Uložit"

## Krok 3: Nasazení jako webová aplikace

1. **Klikněte na**: "Nasadit" → "Nové nasazení"
2. **Klikněte na ikonu ozubeného kola** vedle "Typ"
3. **Vyberte**: "Webová aplikace"
4. **Nastavte**:
   - **Popis**: "CSV Proxy pro Google Sheets"
   - **Spustit jako**: "Já" (váš účet)
   - **Kdo má přístup**: "Kdokoli"
5. **Klikněte na**: "Nasadit"
6. **Autorizujte** aplikaci (klikněte "Autorizovat přístup")
7. **Zkopírujte URL** webové aplikace (začíná `https://script.google.com/macros/s/...`)

## Krok 4: Testování proxy

URL bude vypadat takto:
```
https://script.google.com/macros/s/AKfycbx.../exec
```

Testovací URL:
```
https://script.google.com/macros/s/AKfycbx.../exec?gid=0&format=csv
```

## Krok 5: Aktualizace aplikace

Po získání URL aktualizujte soubor `new-data-loader.js` - přidejte nový proxy server na začátek seznamu:

```javascript
this.proxyServers = [
    {
        name: 'Google Apps Script',
        url: (targetUrl) => {
            const url = new URL(targetUrl);
            const gid = url.searchParams.get('gid') || '0';
            return `https://script.google.com/macros/s/VÁŠE_SCRIPT_ID/exec?gid=${gid}&format=csv`;
        },
        headers: {}
    },
    // ... ostatní proxy servery
];
```

## Výhody Google Apps Script proxy:

✅ **100% spolehlivost** - běží na Google infrastruktuře
✅ **Žádné CORS problémy** - správně nastavené hlavičky
✅ **Přímý přístup** k Google Sheets API
✅ **Zdarma** - v rámci Google účtu
✅ **Rychlé** - minimální latence

## Poznámky:

- Script má denní limit 6 hodin běhu (více než dostatečné)
- Limit 20,000 triggerů denně (více než dostatečné)
- URL zůstává stejná i při aktualizacích kódu
- Můžete sledovat logy v Google Apps Script konzoli 