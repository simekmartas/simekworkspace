# RETRO WEB

Webové stránky v retro stylu s integrací Mobil Majáku a Google Sheets statistik.

## Nasazení na Netlify

1. **Přihlaste se na Netlify**
   - Přejděte na [netlify.com](https://netlify.com) a přihlaste se nebo zaregistrujte

2. **Možnost 1: Nasazení pomocí Netlify CLI**
   - Nainstalujte Netlify CLI: `npm install -g netlify-cli`
   - V adresáři projektu spusťte: `netlify deploy`
   - Postupujte podle instrukcí pro autentizaci a výběr týmu
   - Pro produkční nasazení: `netlify deploy --prod`

3. **Možnost 2: Nasazení přes Netlify UI**
   - Na dashboard stránce klikněte na "Add new site" > "Deploy manually"
   - Přetáhněte celou složku WEB do Netlify rozhraní

4. **Konfigurace environmentu**
   - Ve nastavení webu v sekci "Build & deploy" -> "Environment":
   - Název domény získáte v sekci "Domain settings"

## Struktura projektu

- `index.html` - Hlavní stránka
- `majak.html` - Stránka s Mobil Majákem a Google Sheets statistikami
- `styles.css` - Hlavní CSS soubory
- `navigation.js` - Logika pro navigaci
- `netlify.toml` - Konfigurace pro Netlify

## Poznámky

- Data v tabulce Mobil Majáku jsou dostupná pouze přihlášeným uživatelům
- Přihlašovací údaje:
  - Uživatelské jméno: `admin`
  - Heslo: `Admin123`
- Tabulka je automaticky aktualizována každý den z Google Sheets přes Apify aktor

## Kontakt

Pro technickou podporu kontaktujte správce webu. 