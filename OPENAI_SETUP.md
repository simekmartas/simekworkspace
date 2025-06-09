# Nastavení OpenAI API pro AI Chatbot

## 🤖 Aktuální stav
Chatbot nyní běží v **fallback režimu** s předdefinovanými odpověďmi pro časté dotazy.

## 🔑 Nastavení OpenAI API klíče

### Krok 1: Získání API klíče
1. Jděte na https://platform.openai.com/
2. Přihlaste se nebo vytvořte účet
3. Přejděte na https://platform.openai.com/account/api-keys
4. Klikněte na "Create new secret key"
5. Zkopírujte vygenerovaný klíč (začíná `sk-proj-` nebo `sk-`)

### Krok 2: Nastavení klíče v kódu
V souboru `ai-chatbot.js` na řádku 8 nahraďte:

```javascript
this.apiKey = process.env.OPENAI_API_KEY || 'sk-proj-iVkAReplaceWithRealKey2024';
```

Vaším skutečným API klíčem:

```javascript
this.apiKey = 'sk-proj-VÁŠ_SKUTEČNÝ_KLÍČ_ZDE';
```

### Krok 3: Pro bezpečnost (doporučeno)
Pro produkční použití vytvořte backend endpoint a nikdy nevkládejte API klíč přímo do frontend kódu.

## 🛠️ Aktuální funkcionalita (bez API)

Chatbot i bez API klíče umí odpovídat na:

### ✅ Dotazy o systému
- "Jak funguje systém?"
- "Jak používat Mobil Maják?"

### ✅ Dotazy o datech a statistikách  
- "Kde najdu statistiky?"
- "Jak zobrazit data prodejců?"

### ✅ Dotazy o ALIGATOR telefonech
- "Aligator telefony se nezobrazují"
- "Kde najdu ALIGATOR statistiky?"

### ✅ Řešení problémů
- "Nefunguje mi něco"
- "Mám problém se systémem"

## 🚀 Po nastavení API
S platným OpenAI API klíčem získáte:
- Inteligentní konverzaci s GPT-3.5
- Kontextové odpovědi
- Možnost pokládat libovolné dotazy
- Pokročilou analýzu dat

## 💰 Náklady
- OpenAI API je placené podle použití
- GPT-3.5-turbo: ~$0.0015 za 1K tokenů
- Pro běžné použití chatbota: ~$5-20/měsíc

## 🔧 Troubleshooting

### Chyba "Incorrect API key"
- Zkontrolujte, že jste zkopírovali celý klíč
- Ujistěte se, že klíč není vypršený
- Ověřte, že máte kredity na OpenAI účtu

### Chyba "Rate limit exceeded"
- Příliš mnoho požadavků za krátký čas
- Počkejte chvíli a zkuste znovu

### Chyba "Insufficient quota"
- Nemáte dostatek kreditů na OpenAI účtu
- Přidejte kredity na https://platform.openai.com/account/billing 