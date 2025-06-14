# 🔧 Oprava Gemini API - Návod

## ❌ **Problém:**
"Gemini API Error (404): models/gemini-pro is not found"

## ✅ **Řešení implementováno:**

### 1. **Změna endpointu a modelu**
```javascript
// ZMĚNĚNO Z:
this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// NA:
this.apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
```

### 2. **Automatické testování více endpointů**
Chatbot nyní zkouší postupně:
1. `v1/models/gemini-1.5-flash:generateContent`
2. `v1beta/models/gemini-1.5-flash:generateContent` 
3. `v1/models/gemini-pro:generateContent`
4. `v1beta/models/gemini-pro:generateContent`

## 🔄 **Jak otestovat opravu:**

### Krok 1: Reload stránky
```
Stiskněte F5 nebo klikněte 🔄 Reload v chatbotu
```

### Krok 2: Test API
```
Klikněte 🔧 Test API v chatbotu
```

### Krok 3: Sledujte console
```
Stiskněte F12 → Console tab
Uvidíte: "🤖 Trying endpoint: [URL]"
```

## 📋 **Alternativní řešení (pokud stále nefunguje):**

### Možnost A: Nový Gemini API klíč
1. Jděte na https://aistudio.google.com/app/apikey
2. Vytvořte nový API klíč
3. Nahraďte v `ai-chatbot.js` řádek 6:
```javascript
this.apiKey = 'VÁŠ_NOVÝ_KLÍČ';
```

### Možnost B: Ověřte oprávnění
- API klíč musí mít oprávnění pro Generative Language API
- Zkontrolujte na Google Cloud Console

### Možnost C: Návrat k OpenAI
Pokud Gemini nefunguje, můžeme se vrátit k OpenAI:
```javascript
this.apiKey = 'sk-proj-VÁŠ_OPENAI_KLÍČ';
this.apiUrl = 'https://api.openai.com/v1/chat/completions';
```

## 🎯 **Očekávaný výsledek po opravě:**

✅ **V console uvidíte:**
```
🤖 Trying endpoint: https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent
🤖 Success with endpoint: [funkční URL]
🤖 Gemini API Response successful
```

✅ **V chatbotu:**
```
✅ Gemini API Test úspěšný!
Odpověď: [Gemini odpověď v češtině]
```

## 🔍 **Debugging kroky:**

1. **F12 → Console** - sledujte logy
2. **🔧 Test API** - testujte připojení  
3. **Kontrola Network tab** - sledujte HTTP požadavky
4. **Zkuste různé zprávy** - "Ahoj", "Test"

Pokud ani jedna URL nefunguje, problém je s API klíčem nebo oprávněními. 