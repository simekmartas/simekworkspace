# Mobil Maják - Webová aplikace

Webová aplikace pro zobrazování statistik a dat z Google Sheets.

## 🚀 Nové funkce

### API Proxy pro Google Sheets
- **Vlastní Netlify funkce** pro obcházení CORS omezení
- **Extrémní cache-busting** pro aktuální data
- **Automatické obnovování** každé 2 minuty
- **Tlačítko "VYMAZAT CACHE & OBNOVIT"** pro manuální refresh

## 📁 Struktura projektu

```
WEB/
├── api/
│   └── sheets.js          # Netlify funkce pro Google Sheets proxy
├── prodejny.html          # Stránka s prodejními statistikami
├── prodejny-data-loader.js # Data loader s novým API
├── netlify.toml          # Konfigurace Netlify
├── package.json          # Node.js dependencies
└── styles.css            # Styly
```

## 🔧 Nastavení

### 1. Local development
```bash
npm install
npm run dev
```

### 2. Deployment na Netlify
```bash
npm run deploy
```

### 3. Jak funguje nové API

1. **Frontend** volá `/api/sheets?spreadsheetId=...&gid=...`
2. **Netlify funkce** (`api/sheets.js`) zprostředkuje požadavek
3. **Google Sheets** vrátí CSV data
4. **Data se zobrazí** v real-time bez CORS problémů

## 🐛 Řešení problémů

### Data se neaktualizují
1. Klikněte na "VYMAZAT CACHE & OBNOVIT"
2. Zkontrolujte konzoli prohlížeče (F12)
3. Ověřte, že Netlify funkce funguje: `/api/sheets?spreadsheetId=1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE&gid=0`

### CORS chyby
- Nové API řešení by mělo vyřešit všechny CORS problémy
- Pokud stále probíhají, zkontrolujte `netlify.toml` konfiguraci

## 📊 Google Sheets integrace

- **Spreadsheet ID**: `1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE`
- **Aktuální data**: gid=0
- **Měsíční data**: gid=1829845095

## 🔄 Auto-refresh

- Data se automaticky obnovují **každé 2 minuty**
- Manuální refresh pomocí tlačítka
- Agresivní cache-busting pro čerstvá data

## Poznámky

- Data v tabulce Mobil Majáku jsou dostupná pouze přihlášeným uživatelům
- Přihlašovací údaje:
  - Uživatelské jméno: `admin`
  - Heslo: `Admin123`
- Tabulka je automaticky aktualizována každý den z Google Sheets přes Apify aktor

## Kontakt

Pro technickou podporu kontaktujte správce webu. 