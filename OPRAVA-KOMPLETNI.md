# Kompletní oprava načítání dat z Google Sheets

## Identifikovaný hlavní problém

**NESPRÁVNÉ GOOGLE SHEETS ID** - aplikace používala nesprávné publikované ID místo skutečného ID tabulky.

### Původní (chybné) ID:
```
2PACX-1vSQyn0JYmE8u7sclbQH9NQyWdgnHP-mUD-whljYrrWy4ipE1Z016AcYeumZnRB5rBfDz0x9THnH7kb8
```

### Správné ID:
```
1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE
```

## Kompletní přepis simple-data-loader.js

### 1. Oprava základní konfigurace
```javascript
// PŘED
this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets/1vSQyn0JYmE8u7sclbQH9NQyWdgnHP-mUD-whljYrrWy4ipE1Z016AcYeumZnRB5rBfDz0x9THnH7kb8/values/';

// PO
this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
this.basePublishedUrl = 'https://docs.google.com/spreadsheets/d/1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE/export?format=csv';
```

### 2. Oprava URL formátu
```javascript
// PŘED
const csvUrl = isMonthly 
    ? `https://docs.google.com/spreadsheets/d/e/2PACX-1vSQyn0JYmE8u7sclbQH9NQyWdgnHP-mUD-whljYrrWy4ipE1Z016AcYeumZnRB5rBfDz0x9THnH7kb8/pub?gid=1829845095&single=true&output=csv&cachebust=${timestamp}`
    : `https://docs.google.com/spreadsheets/d/e/2PACX-1vSQyn0JYmE8u7sclbQH9NQyWdgnHP-mUD-whljYrrWy4ipE1Z016AcYeumZnRB5rBfDz0x9THnH7kb8/pub?single=true&output=csv&cachebust=${timestamp}`;

// PO
const csvUrl = isMonthly 
    ? `${this.basePublishedUrl}&gid=1829845095&cachebust=${timestamp}`
    : `${this.basePublishedUrl}&gid=0&cachebust=${timestamp}`;
```

### 3. Vylepšený 3-stupňový přístup k datům

1. **Přímý přístup** - zkusí se nejprve
2. **CORS proxy (allorigins.win)** - spolehlivý fallback
3. **Alternativní proxy (cors-anywhere)** - záložní řešení

### 4. Lepší validace dat
```javascript
// Kontrola minimální délky dat
if (csvData && csvData.length > 100) {
    // Data jsou validní
} else {
    // Data jsou příliš krátká nebo prázdná
}
```

## Opravené soubory

### 1. `simple-data-loader.js`
- ✅ Kompletně přepsán s správným Google Sheets ID
- ✅ 3-stupňový přístup k datům
- ✅ Lepší error handling a logování
- ✅ Validace délky dat

### 2. `test-url.html`
- ✅ Aktualizováno se správným ID
- ✅ Opraveny všechny test URL

### 3. `majak.html`
- ✅ Aktualizovány debug funkce
- ✅ Opraveny test URL ve funkcích

### 4. `test-correct-sheets.html` (NOVÝ)
- ✅ Specializovaný test pro správné Google Sheets ID
- ✅ Test obou listů (gid=0 a gid=1829845095)
- ✅ Detailní diagnostika

## Mapování listů

### Hlavní list (gid=0) - "List 1"
- **Účel**: Aktuální denní data
- **Aktualizuje**: Apify actor (denní běh)
- **URL**: `...&gid=0&cachebust=${timestamp}`

### Měsíční list (gid=1829845095) - "od 1"
- **Účel**: Data od 1. dne měsíce
- **Aktualizuje**: Apify actor (měsíční běh)
- **URL**: `...&gid=1829845095&cachebust=${timestamp}`

## Testování

### 1. Základní test
```
http://localhost:8000/majak.html
```
- Otevři konzoli (F12)
- Sleduj logy načítání dat
- Měl by se zobrazit status "LIVE DATA STREAM ACTIVE"

### 2. Specializovaný test
```
http://localhost:8000/test-correct-sheets.html
```
- Automaticky testuje oba listy
- Zobrazuje detailní výsledky
- Testuje všechny přístupové metody

### 3. Debug funkce v konzoli
```javascript
testFetch()      // Kompletní test načítání
testUrl()        // Generování test URL
debugLoadData()  // Debug načtení dat
manualRefresh()  // Manuální obnovení
```

## Očekávané výsledky

Po opravách by aplikace měla:

1. ✅ **Načítat skutečná data** z Google Sheets ID `1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE`
2. ✅ **Zobrazovat "LIVE DATA STREAM ACTIVE"** místo "DEMO DATA ACTIVE"
3. ✅ **Aktualizovat čas** v prvním řádku na skutečný čas z tabulky
4. ✅ **Automaticky obnovovat** data každou hodinu
5. ✅ **Rozlišovat** mezi aktuálními (gid=0) a měsíčními (gid=1829845095) daty

## Možné problémy a řešení

### Problém: Stále se zobrazují mock data
**Řešení**: 
1. Zkontroluj konzoli - měly by být logy "=== NAČÍTÁNÍ DAT Z GOOGLE SHEETS ==="
2. Spusť `testFetch()` v konzoli
3. Ověř, že Google Sheets je publikovaný a přístupný

### Problém: CORS chyby
**Řešení**:
1. Aplikace automaticky přejde na proxy servery
2. Zkontroluj dostupnost proxy serverů
3. Zkus jiný proxy server

### Problém: Prázdná data
**Řešení**:
1. Ověř správnost Google Sheets ID
2. Zkontroluj, že listy obsahují data
3. Ověř správnost gid parametrů

## Monitoring a debugging

Aplikace nyní poskytuje detailní logování:

```
=== NAČÍTÁNÍ DAT Z GOOGLE SHEETS ===
Spreadsheet ID: 1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE
Je měsíční: false
CSV URL: https://docs.google.com/spreadsheets/d/1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE/export?format=csv&gid=0&cachebust=1234567890
=== PŘÍSTUP 1: Přímý fetch ===
Přímý přístup - status: 200 ok: true
Přímý přístup ÚSPĚŠNÝ - délka dat: 2543
První 200 znaků: prodejna,prodejce,polozky_nad_100,sluzby_celkem...
=== ÚSPĚCH: Data načtena, zpracovávám ===
=== PARSOVÁNÍ CSV DAT ===
Délka CSV dat: 2543
První 300 znaků: prodejna,prodejce,polozky_nad_100...
Počet řádků po filtrování: 18
Načteno 17 řádků dat
Headers: ["prodejna", "prodejce", "polozky_nad_100", ...]
=== ZOBRAZUJI SKUTEČNÁ DATA ===
```

Všechny logy jsou viditelné v konzoli prohlížeče (F12). 