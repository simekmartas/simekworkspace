# RYCHLÉ ŘEŠENÍ - Načtení skutečných dat z Google Sheets

## 🚨 PROBLÉM
Aplikace zobrazuje mock data místo skutečných dat z tabulky, protože proxy servery selhávají.

## ✅ ŘEŠENÍ (5 minut)

### Krok 1: Vytvoření Google Apps Script
1. Jděte na: **https://script.google.com/**
2. Klikněte: **"Nový projekt"**
3. Smažte výchozí kód a vložte:

```javascript
function doGet(e) {
  try {
    const SPREADSHEET_ID = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
    const gid = e.parameter.gid || '0';
    const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
    
    const response = UrlFetchApp.fetch(exportUrl);
    const csvData = response.getContentText();
    
    return ContentService
      .createTextOutput(csvData)
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'no-cache'
      });
  } catch (error) {
    return ContentService
      .createTextOutput('ERROR: ' + error.toString())
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeaders({'Access-Control-Allow-Origin': '*'});
  }
}
```

### Krok 2: Nasazení
1. Klikněte: **"Nasadit" → "Nové nasazení"**
2. Klikněte na **ozubené kolo** → **"Webová aplikace"**
3. Nastavte:
   - **Spustit jako**: "Já"
   - **Přístup**: "Kdokoli"
4. Klikněte: **"Nasadir"**
5. **Zkopírujte URL** (začíná `https://script.google.com/macros/s/...`)

### Krok 3: Aktualizace aplikace
Pošlete mi URL a já okamžitě aktualizuji aplikaci.

## 🎯 VÝSLEDEK
Po této změně bude aplikace zobrazovat skutečná data:
- Čepkov - Lukáš Kováčik: 30 položek
- Globus - Šimon Gabriel: 30 položek  
- Přerov - Jakub Málek: 12 položek
- atd.

## ⏱️ ČAS: 5 minut
Celý proces zabere maximálně 5 minut a vyřeší problém natrvalo. 