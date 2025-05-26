# 🏋️ Fitness Kalorie Tracker - Návod na nastavení

## 📋 Přehled
Kompletní mobilní-first webová aplikace pro počítání kalorií s AI analýzou jídla pomocí OpenAI GPT-4 Vision.

## 🔑 1. Získání OpenAI API klíče

### Krok 1: Registrace na OpenAI
1. Jděte na: **https://platform.openai.com/**
2. Klikněte na **"Sign up"** nebo **"Log in"** pokud už máte účet
3. Dokončete registraci

### Krok 2: Získání API klíče
1. Po přihlášení jděte na: **https://platform.openai.com/api-keys**
2. Klikněte na **"Create new secret key"**
3. Pojmenujte klíč (např. "Fitness App")
4. **DŮLEŽITÉ**: Zkopírujte klíč hned - už ho neuvidíte!
5. Klíč vypadá takto: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Krok 3: Nastavení platby (povinné)
1. Jděte na: **https://platform.openai.com/settings/organization/billing**
2. Přidejte platební metodu (karta)
3. Nastavte limit (doporučuji začít s $10-20)
4. **Cena**: GPT-4 Vision stojí cca $0.01-0.03 za analýzu fotky

## 🚀 2. Nastavení aplikace

### Varianta A: PHP Backend (jednodušší)

#### Krok 1: Nastavení API klíče
Otevřete soubor `WEB/api/analyze-food.php` a nahraďte:
```php
$openai_api_key = 'YOUR_OPENAI_API_KEY';
```
Vaším skutečným klíčem:
```php
$openai_api_key = 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

#### Krok 2: Upload na server
1. Nahrajte celou složku `WEB/` na váš webhosting
2. Ujistěte se, že PHP má povolené:
   - `curl` extension
   - `json` extension
   - `file_get_contents()`

#### Krok 3: Test
Otevřete `https://vase-domena.cz/fitness.html`

### Varianta B: Node.js Backend (pokročilejší)

#### Krok 1: Instalace Node.js
1. Stáhněte Node.js z: **https://nodejs.org/**
2. Nainstalujte (verze 14+)

#### Krok 2: Nastavení projektu
```bash
cd WEB/api
npm install
```

#### Krok 3: Nastavení API klíče
Buď upravte soubor `analyze-food.js`:
```javascript
const OPENAI_API_KEY = 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

Nebo vytvořte `.env` soubor:
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Krok 4: Spuštění serveru
```bash
npm start
# nebo pro development:
npm run dev
```

#### Krok 5: Úprava frontendu
V `fitness.js` odkomentujte řádek:
```javascript
this.apiUrl = 'http://localhost:3001/api/analyze-food';
```

## 📱 3. Testování aplikace

### Test 1: Základní funkce
1. Otevřete aplikaci v prohlížeči
2. Zkuste přidat jídlo ručně
3. Ověřte, že se zobrazuje v seznamu

### Test 2: AI analýza
1. Klikněte "Spustit kameru" nebo "Nahrát foto"
2. Vyfotografujte/nahrajte obrázek jídla
3. Klikněte "Analyzovat AI"
4. Počkejte na výsledek (5-15 sekund)

## 🔧 4. Řešení problémů

### Chyba: "OpenAI API error"
- ✅ Zkontrolujte API klíč
- ✅ Ověřte, že máte kredit na OpenAI účtu
- ✅ Zkontrolujte internetové připojení

### Chyba: "No image provided"
- ✅ Zkontrolujte, že foto se správně nahrává
- ✅ Zkuste menší obrázek (max 10MB)

### Kamera nefunguje
- ✅ Povolte přístup ke kameře v prohlížeči
- ✅ Používejte HTTPS (ne HTTP)
- ✅ Zkuste jiný prohlížeč

### API nedostupné
- ✅ Zkontrolujte cestu k API souboru
- ✅ Ověřte, že server běží (Node.js)
- ✅ Zkontrolujte CORS nastavení

## 💰 5. Náklady a optimalizace

### Odhad nákladů
- **1 analýza fotky**: $0.01-0.03
- **100 analýz měsíčně**: $1-3
- **1000 analýz měsíčně**: $10-30

### Optimalizace nákladů
1. **Komprese obrázků**: Zmenšete rozlišení před odesláním
2. **Cache výsledky**: Ukládejte podobné fotky
3. **Batch processing**: Analyzujte více jídel najednou

## 🔒 6. Bezpečnost

### Ochrana API klíče
- ❌ **NIKDY** nevkládejte API klíč do frontendu
- ✅ Používejte pouze v backend kódu
- ✅ Používejte environment variables
- ✅ Přidejte `.env` do `.gitignore`

### Rate limiting
```php
// Přidejte do PHP API
$max_requests_per_hour = 100;
// implementujte rate limiting logiku
```

## 📊 7. Monitoring a logy

### Sledování použití
1. OpenAI Dashboard: **https://platform.openai.com/usage**
2. Lokální logy: `food_analysis_log.json`

### Příklad log záznamu
```json
{
  "timestamp": "2024-01-15 14:30:00",
  "userId": "user_123456",
  "result": {
    "foodName": "Kuřecí řízek s bramborami",
    "calories": 650,
    "confidence": 0.85
  }
}
```

## 🚀 8. Nasazení do produkce

### Doporučené hostingy
- **PHP**: Wedos, Forpsi, SiteGround
- **Node.js**: Vercel, Netlify, Railway, Heroku

### Checklist před spuštěním
- [ ] API klíč je zabezpečený
- [ ] HTTPS je aktivní
- [ ] Rate limiting je nastavený
- [ ] Error handling funguje
- [ ] Logy se zapisují
- [ ] Backup strategie je připravená

## 📞 9. Podpora

### Užitečné odkazy
- **OpenAI API Docs**: https://platform.openai.com/docs
- **GPT-4 Vision Guide**: https://platform.openai.com/docs/guides/vision
- **OpenAI Status**: https://status.openai.com/

### Časté problémy
1. **Rate limit exceeded**: Počkejte nebo zvyšte limit
2. **Insufficient credits**: Dobijte kredit na OpenAI
3. **Model not found**: Zkontrolujte název modelu

---

## 🎉 Hotovo!

Vaše fitness aplikace je připravená k použití! 

**URL aplikace**: `https://simek.work/fitness.html`

Aplikace umí:
- ✅ Fotografovat jídlo kamerou
- ✅ Nahrávat fotky ze zařízení  
- ✅ AI analýzu kalorií pomocí GPT-4 Vision
- ✅ Ruční přidávání jídel
- ✅ Sledování denního cíle
- ✅ Historii jídel
- ✅ Responzivní design pro mobily

**Užívejte si zdravé stravování! 🥗💪** 