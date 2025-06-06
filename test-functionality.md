# 🧪 Test funkcionalitity před nasazením

## 1. API Chatbot Test
✅ **API klíč aktualizován**: `sk-proj-lRM7B1XN3CFLbOhc4p8_wurd6...`

**Test kroky:**
1. Otevřete web v prohlížeči
2. Klikněte na 🤖 ikonu vpravo dole
3. Napište: "Jak funguje systém Mobil Maják?"
4. ✅ Měli byste dostat odpověď od AI

## 2. Příspěvky - Lokální test
✅ **Lokální ukládání**: Pro testování se používá localStorage

**Test kroky:**
1. Přihlaste se jako `admin` / `Admin123`
2. Vytvořte příspěvek: "Test před nasazením"
3. Přidejte obrázek
4. ✅ Příspěvek se zobrazí
5. Odhlaste se a přihlaste znovu
6. ✅ Příspěvek by měl zůstat viditelný

## 3. Prostředí detekce
```javascript
// Lokální (localhost): používá localStorage
// Produkce (netlify): používá server API
```

**Kontrola:**
- Otevřete Dev Tools (F12) → Console
- Najděte: `🏠 Lokální prostředí - používám localStorage`

## 4. Upload test
✅ **Lokální**: obrázky se ukládají jako base64
✅ **Produkce**: obrázky se nahrají na server

**Test kroky:**
1. Vytvořte příspěvek s obrázkem
2. Zkontrolujte, že se obrázek zobrazuje
3. ✅ Lokálně: dlouhá base64 URL
4. ✅ Na serveru: `/uploads/filename.jpg`

## 🚀 Připraveno k nasazení!

Po úspěšném testování můžete:
1. **Git push** všechny změny
2. **Netlify deploy** z GitHub
3. **První test** na produkci

### Co se změní po nasazení:
- ☁️ Serverové ukládání místo localStorage
- 🔗 Skutečné URL obrázků
- 🔄 Sdílení dat mezi uživateli
- 💾 Perzistentní data

---

**Status:** ✅ Všechny systémy připraveny k nasazení 