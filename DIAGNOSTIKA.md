# Diagnostika a oprava problému s načítáním dat

## Identifikovaný problém

Webová aplikace zobrazovala mock data místo skutečných dat z Google Sheets. Problém byl způsoben několika faktory:

### 1. Nesprávný formát URL parametrů
- **Původní**: `&t=${timestamp}` 
- **Opraveno**: `&cachebust=${timestamp}`
- Google Sheets nerozpoznával parametr `t` pro cache-busting

### 2. Nedostatečné error handling
- Aplikace rychle přecházela na mock data při první chybě
- Chybělo detailní logování pro diagnostiku
- Nebyly vyzkoušeny všechny možné přístupy

### 3. CORS politika Google Sheets
- Google změnil politiku pro externí přístup k datům
- Přímý přístup často selhal kvůli CORS omezením
- Proxy servery jsou nyní nezbytné pro spolehlivý přístup

## Provedené opravy

### 1. Oprava URL formátu
```javascript
// Před opravou
const csvUrl = `...&t=${timestamp}`;

// Po opravě  
const csvUrl = `...&cachebust=${timestamp}`;
```

### 2. Rozšířené načítání dat - 3 přístupy
1. **Přímý přístup** - zkusí se nejprve
2. **CORS proxy** - fallback pro CORS problémy
3. **Alternativní URL** - jiný formát Google Sheets URL

### 3. Detailní diagnostika
- Kompletní logování každého kroku
- Zobrazení HTTP status kódů a headers
- Ukázka prvních 100-300 znaků načtených dat
- Rozlišení mezi mock a skutečnými daty

### 4. Lepší cache-busting
```javascript
// Přidány HTTP hlavičky pro vynucení aktuálních dat
headers: {
    'Accept': 'text/csv, text/plain, */*',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
}
```

### 5. Debug nástroje
- `testUrl()` - generuje a testuje URL
- `testFetch()` - testuje skutečné načtení dat
- `debugLoadData()` - debug načtení dat
- `manualRefresh()` - manuální obnovení

## Testovací soubor

Vytvořen `test-url.html` pro nezávislé testování URL:
- Test přímého přístupu
- Test proxy přístupu  
- Test alternativní URL
- Automatické spuštění všech testů

## Jak testovat

1. **Otevřít konzoli** v prohlížeči na stránce `majak.html`
2. **Spustit testy**:
   ```javascript
   testFetch()      // Kompletní test načítání
   testUrl()        // Generování test URL
   debugLoadData()  // Debug načtení dat
   manualRefresh()  // Manuální obnovení
   ```

3. **Otevřít test stránku**: `http://localhost:8000/test-url.html`
   - Automaticky spustí všechny testy
   - Zobrazí detailní výsledky

## Očekávané výsledky

Po opravách by měla aplikace:
1. **Úspěšně načíst** skutečná data z Google Sheets
2. **Zobrazit status** "LIVE DATA STREAM ACTIVE" místo "DEMO DATA ACTIVE"
3. **Aktualizovat čas** v prvním řádku tabulky na aktuální čas
4. **Automaticky obnovovat** data každou hodinu

## Možné problémy

Pokud stále nefunguje:
1. **Google Sheets není publikovaný** - zkontrolovat nastavení sdílení
2. **Nesprávné ID tabulky** - ověřit URL v prohlížeči
3. **Proxy server nedostupný** - zkusit jiný proxy
4. **Síťová omezení** - firewall nebo ISP blokuje přístup

## Monitoring

Aplikace nyní loguje:
- Každý pokus o načtení dat
- HTTP status kódy a chyby
- Délku načtených dat
- Úspěch/selhání každého přístupu
- Čas posledního obnovení

Všechny logy jsou viditelné v konzoli prohlížeče (F12). 