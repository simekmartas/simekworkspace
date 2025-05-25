# Řešení problému s načítáním dat z Google Sheets

## 🔍 Identifikované problémy

### 1. **CORS politika Google Sheets (hlavní problém)**
- Google změnil CORS politiku v roce 2024
- Přímý přístup k CSV exportu často selže kvůli `Access-Control-Allow-Origin` chybám
- Proxy servery jsou nyní nezbytné pro spolehlivý přístup

### 2. **Neaktuální proxy servery**
- Některé proxy servery v původním kódu už nefungují
- `cors-anywhere.herokuapp.com` vyžaduje speciální hlavičky
- `thingproxy.freeboard.io` je často nedostupný

### 3. **Nedostatečné error handling**
- Aplikace rychle přecházela na mock data při první chybě
- Chybělo postupné testování všech dostupných metod
- Nedostatečné logování pro diagnostiku

## ✅ Implementovaná řešení

### 1. **Aktualizovaný seznam proxy serverů**
```javascript
// Nové pořadí proxy serverů (2024)
const proxyServers = [
    {
        name: 'AllOrigins',
        url: (targetUrl) => `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
        parseResponse: (response) => response.contents
    },
    {
        name: 'CORS.SH',
        url: (targetUrl) => `https://cors.sh/${targetUrl}`
    },
    {
        name: 'Proxy CORS',
        url: (targetUrl) => `https://proxy.cors.sh/${targetUrl}`
    },
    {
        name: 'ThingProxy',
        url: (targetUrl) => `https://thingproxy.freeboard.io/fetch/${targetUrl}`
    },
    {
        name: 'CORS Anywhere (Heroku)',
        url: (targetUrl) => `https://cors-anywhere.herokuapp.com/${targetUrl}`,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    }
];
```

### 2. **Vylepšená strategie načítání dat**
1. **Přímý přístup** - zkusí se nejprve (nejrychlejší)
2. **Postupné testování proxy serverů** - pokud přímý přístup selže
3. **Mock data** - pouze jako poslední možnost

### 3. **Robustnější error handling**
- Detailní logování každého kroku
- Validace délky načtených dat (min. 100 znaků)
- Timeout pro každý pokus
- Pokračování i při částečných selháních

### 4. **Vylepšené cache-busting**
```javascript
const timestamp = new Date().getTime();
const csvUrl = `...&cachebust=${timestamp}`;
```

## 🧪 Testovací nástroje

### 1. **quick-test.html** - Rychlý diagnostický test
- Okamžité ověření přístupu k Google Sheets
- Test 3 hlavních metod (přímý + 2 proxy)
- Automatické spuštění při načtení

### 2. **test-new-loader.html** - Kompletní test
- Test všech 5 proxy serverů
- Test obou listů (hlavní + měsíční)
- Simulace kompletního data loaderu
- Měření doby odezvy

### 3. **test-correct-sheets.html** - Specializovaný test
- Ověření správného Google Sheets ID
- Test obou gid parametrů
- Detailní diagnostika

## 🚀 Jak testovat

### 1. **Rychlý test**
```
http://localhost:8000/quick-test.html
```
- Automaticky otestuje základní funkčnost
- Výsledek do 10 sekund

### 2. **Kompletní test**
```
http://localhost:8000/test-new-loader.html
```
- Detailní test všech metod
- Interaktivní tlačítka pro různé testy

### 3. **Produkční test**
```
http://localhost:8000/majak.html
```
- Otevři konzoli (F12)
- Sleduj logy načítání dat
- Použij debug funkce: `testFetch()`, `debugLoadData()`

## 📊 Očekávané výsledky

### ✅ **Úspěšné načtení dat**
- Status: "LIVE DATA STREAM ACTIVE"
- Aktuální čas v prvním řádku tabulky
- Skutečná data z Google Sheets
- Automatické obnovování každou hodinu

### ❌ **Selhání načtení dat**
- Status: "DEMO DATA ACTIVE" (oranžová barva)
- Mock data s aktuálním časem
- Chybové zprávy v konzoli
- Stále funkční automatické obnovování

## 🔧 Možné problémy a řešení

### **Problém: Stále se zobrazují mock data**
**Řešení:**
1. Otevři konzoli (F12) a sleduj logy
2. Spusť `testFetch()` pro diagnostiku
3. Zkontroluj, že Google Sheets je publikovaný
4. Ověř síťové připojení

### **Problém: CORS chyby**
**Řešení:**
1. Aplikace automaticky přejde na proxy servery
2. Zkus jiný proxy server ručně
3. Ověř dostupnost proxy serverů

### **Problém: Prázdná nebo neplatná data**
**Řešení:**
1. Ověř správnost Google Sheets ID: `1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE`
2. Zkontroluj gid parametry: `gid=0` (hlavní), `gid=1829845095` (měsíční)
3. Ověř, že listy obsahují data

### **Problém: Pomalé načítání**
**Řešení:**
1. Přímý přístup je nejrychlejší (pokud funguje)
2. AllOrigins proxy je obvykle nejspolehlivější
3. Ostatní proxy mohou být pomalejší

## 📈 Monitoring a debugging

### **Konzolové logy**
```
=== NOVÝ DATA LOADER ===
Target CSV URL: https://docs.google.com/spreadsheets/d/1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE/export?format=csv&gid=0&cachebust=1234567890
=== ZKOUŠÍM PŘÍMÝ PŘÍSTUP ===
Přímý přístup - status: 200 ok: true
✅ Přímý přístup ÚSPĚŠNÝ!
✅ Data úspěšně načtena, zpracovávám...
```

### **Debug funkce**
- `testFetch()` - kompletní test načítání
- `debugLoadData()` - debug načtení dat
- `manualRefresh()` - manuální obnovení
- `testUrl()` - generování test URL

## 🎯 Doporučení

1. **Pravidelně testuj** přístup k datům pomocí testovacích stránek
2. **Sleduj konzoli** pro včasné odhalení problémů
3. **Aktualizuj proxy servery** podle dostupnosti
4. **Zálohuj mock data** pro případ úplného selhání
5. **Dokumentuj změny** v Google Sheets struktuře

## 📝 Technické detaily

### **Google Sheets URL formát**
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv&gid=SHEET_GID&cachebust=TIMESTAMP
```

### **Mapování listů**
- `gid=0` - Hlavní list "List 1" (aktuální denní data)
- `gid=1829845095` - List "od 1" (měsíční data od 1. dne)

### **Validace dat**
- Minimální délka: 100 znaků
- Kontrola CSV formátu
- Ověření existence řádků s daty 