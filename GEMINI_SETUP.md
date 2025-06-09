# Nastavení Google Gemini API pro AI Chatbot

## 🚀 Aktuální stav
Chatbot nyní používá **Google Gemini AI** místo OpenAI!

## 🔑 Aktuální konfigurace

✅ **API klíč**: `AIzaSyAjrUIvmXkB2lZr1HOtswyz92YSaKpuTkc`  
✅ **Model**: `gemini-pro`  
✅ **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

## 🆚 Gemini vs OpenAI

### 🎯 **Výhody Google Gemini:**
- **Rychlejší odpovědi** - obvykle 2-3x rychlejší než GPT
- **Lepší čeština** - nativní podpora češtiny
- **Zdarma/levnější** - větší limity zdarma
- **Moderní AI** - nejnovější Google technologie
- **Přesnost** - vynikající porozumění kontextu

### 📊 **Technické rozdíly:**
- **Formát API** - jiný než OpenAI (contents vs messages)
- **Autentifikace** - API klíč v URL místo Bearer token
- **Odpovědi** - candidates[0].content.parts[0].text
- **Rate limiting** - vyšší limity než OpenAI free tier

## 🛠️ Implementované funkce

### 📊 **Čtení dat ze stránek**
- Automatické načítání dat z DOM při každém dotazu
- Support pro všechny stránky (user-profile, prodejny, bazar, servis)
- Real-time analýza tabulek a statistik

### 🤖 **Gemini schopnosti**
- Kontextová konverzace v češtině
- Analýza JSON dat ze stránek
- Inteligentní odpovědi na konkrétní čísla
- Pokročilé porozumění ALIGATOR systému

## 🔧 Testování

### 1. **🔄 Reload stránku** (vymaže cache)
### 2. **🔧 Klikněte "Test API"** v chatbotu
### 3. **Zkuste dotazy:**
- "Kolik mám ALIGATOR telefonů?"
- "Jak si vedu v žebříčku?" 
- "Analyzuj moje prodejní data"

## 📈 **Očekávané výsledky**

✅ **Rychlé odpovědi** (1-3 sekundy)  
✅ **Přesná čísla** z aktuálních dat  
✅ **Český jazyk** - přirozená konverzace  
✅ **Kontextové rady** pro zlepšení prodeje  

## ⚠️ **Možné problémy**

### Chyba 403/401
- API klíč neplatný nebo vypršený
- Překročeny limity Gemini API

### Chyba 400  
- Neplatný formát požadavku
- Příliš dlouhá zpráva

### Network Error
- Problém s připojením
- CORS blokování (řeší se automaticky)

## 💡 **Tipy pro použití**

1. **Buďte konkrétní** - "Kolik mám přesně ALIGATOR telefonů tento měsíc?"
2. **Ptejte se na trendy** - "Jak se vyvíjí můj prodej?"  
3. **Žádejte analýzy** - "Porovnej mé výsledky s ostatními"
4. **Rady pro zlepšení** - "Jak mohu prodávat víc ALIGATOR telefonů?"

## 🚀 **Výsledek**

Gemini poskytuje:
- **Rychlejší a přesnější** odpovědi než OpenAI
- **Lepší českou konverzaci** 
- **Více detailní analýzy** prodejních dat
- **Užitečnější rady** pro zlepšení prodeje

Chatbot je nyní plně funkční s Google Gemini AI! 🎉 