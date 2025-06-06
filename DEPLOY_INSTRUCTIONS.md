# 🚀 Nasazení na Netlify - Návod

## Příprava před nahráním na GitHub

1. **Ujistěte se, že máte tyto soubory:**
   - `netlify.toml` - konfigurace Netlify
   - `package.json` - závislosti Node.js
   - `netlify/functions/posts.js` - API pro příspěvky
   - `netlify/functions/upload.js` - API pro upload obrázků
   - `data/posts.json` - datový soubor (bude automaticky vytvořen)

## Nasazení na Netlify

### 1. Připojení GitHub repository
- Jděte na [netlify.com](https://netlify.com)
- Klikněte na "New site from Git"
- Vyberte váš GitHub repository
- Větev: `main` nebo `master`

### 2. Build nastavení
```
Build command: npm run build
Publish directory: .
Functions directory: netlify/functions
```

### 3. Environment Variables (volitelné)
Pokud budete potřebovat API klíče, nastavte je v:
`Site settings > Environment variables`

## Výhody tohoto řešení

✅ **Serverless funkce** - automaticky škálované
✅ **File system storage** - data se ukládají do souborů na serveru
✅ **Fallback na localStorage** - funguje i offline
✅ **CORS podpora** - API funguje z všech domén
✅ **Error handling** - odolné proti chybám

## Jak funguje ukládání

1. **Příspěvky** se ukládají do `/data/posts.json`
2. **Obrázky** se ukládají do `/uploads/` složky
3. **Backup** je v localStorage jako záloha
4. **Auto-sync** při změnách mezi taby

## Testování lokálně

```bash
# Nainstaluj Netlify CLI
npm install -g netlify-cli

# Spusť lokální server s funkcemi
netlify dev
```

## 🎯 Co se změní po deployu

- Všechna data se budou ukládat na server
- Obrázky budou dostupné přes URL
- Rychlejší načítání (cache)
- Sdílení mezi uživateli v reálném čase
- Perzistentní data (nezmizí při odhlášení)

## 📝 Monitoring

Po nasazení můžete sledovat:
- **Functions logs** v Netlify dashboardu
- **Site analytics** pro návštěvnost
- **Deploy logs** pro debug

---

**✨ Tip:** Po prvním nasazení otestujte vytvoření příspěvku a upload obrázku! 