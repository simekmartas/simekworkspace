# Návod: Nastavení Google Sheets synchronizace pro bazarová data

Tento návod vás provede nastavením automatické synchronizace bazarových dat do Google Sheets.

## Krok 1: Příprava Google Sheets

1. **Otevřete vaši Google Sheets tabulku**: https://docs.google.com/spreadsheets/d/14IQ_ud8aakJSA8Ge_WcEQrRDnP-aK4WpnOvq9HFi2xE/edit
2. **Zkontrolujte ID tabulky** (je už nastaveno v kódu): `14IQ_ud8aakJSA8Ge_WcEQrRDnP-aK4WpnOvq9HFi2xE`

## Krok 2: Vytvoření Google Apps Script projektu

1. **Jděte na Google Apps Script**: https://script.google.com
2. **Klikněte "Nový projekt"**
3. **Otevřete soubor `google-apps-script-code.js`** v tomto adresáři
4. **Zkopírujte celý obsah** tohoto souboru
5. **Vložte ho do Google Apps Script** (nahraďte defaultní `function myFunction()` kód)
6. **Uložte projekt** (Ctrl+S nebo ikona diskety)
7. **Pojmenujte projekt** (např. "Bazar Synchronizace")

## Krok 3: Publikování jako webové aplikace

1. **V Google Apps Script klikněte na "Nasadit"** (vpravo nahoře)
2. **Vyberte "Nové nasazení"**
3. **Nastavte tyto možnosti:**
   - **Typ**: Webová aplikace
   - **Popis**: Bazar API (volitelné)
   - **Spustit jako**: Já
   - **Přístup**: Kdokoli
4. **Klikněte "Nasadit"**
5. **Zkopírujte URL webové aplikace** (bude vypadat jako: `https://script.google.com/macros/s/NĚJAKÝ_ID/exec`)

## Krok 4: Nastavení v bazarové aplikaci

1. **Otevřete vaši bazarovou aplikaci**
2. **Přejděte do sekce "Export a správa dat"**
3. **Klikněte na "Nastavit Google Sheets"**
4. **Vložte URL webové aplikace** z kroku 3
5. **Potvrďte nastavení**

## Krok 5: Testování

1. **Přidejte nový bazarový záznam** do vaší aplikace
2. **Zkontrolujte Google Sheets tabulku** - měl by se tam objevit nový list "Bazar" s daty
3. **Pokud se nic nestalo:**
   - Zkontrolujte konzoli v browseru (F12) na chybové zprávy
   - Ověřte, že jste správně nastavili URL
   - Vyzkoušejte URL přímo v browseru - měla by se zobrazit zpráva "Google Apps Script funguje!"

## Funkce synchronizace

### Automatická synchronizace
- **Každý nový záznam** se automaticky odešle do Google Sheets
- **Pokud se odeslání nepovede**, zobrazí se varování (data zůstanou lokálně uložena)

### Manuální synchronizace
- **Tlačítko "Synchronizovat vše"** odešle všechna lokální data do Google Sheets
- **Užitečné při prvním nastavení** nebo po technických problémech

### Správa nastavení
- **URL se ukládá lokálně** - nemusíte ho zadávat znovu
- **Můžete URL kdykoliv změnit** pomocí tlačítka "Nastavit Google Sheets"

## Struktura dat v Google Sheets

Data se ukládají do listu "Bazar" s těmito sloupci:

| Sloupec | Popis |
|---------|-------|
| ID | Unikátní identifikátor záznamu |
| Timestamp | Časové razítko vytvoření |
| Datum | Datum výkupu |
| Čas | Čas výkupu |
| Výkupka | Název výkupky |
| Typ telefonu | Model telefonu |
| IMEI | IMEI číslo |
| Cena | Výkupní cena |
| Nabíječka | Má nabíječku? |
| Krabička | Má krabičku? |
| Záruční list | Má záruční list? |
| Záruka do | Datum konce záruky |
| Použité díly | Popis použitých dílů |
| Vykoupil | Jméno zaměstnance |
| Jméno klienta | Jméno klienta |
| Příjmení klienta | Příjmení klienta |
| Adresa klienta | Adresa klienta |
| Rodné číslo | Rodné číslo klienta |
| Rodinný stav | Rodinný stav |
| Místo vydání dokladu | Místo vydání dokladu |
| Datum vydání dokladu | Datum vydání dokladu |
| Platnost do | Platnost dokladu do |
| Datum narození | Datum narození |

## Řešení problémů

### "Google Sheets není nakonfigurován"
- Zkontrolujte, že jste správně nastavili URL webové aplikace
- URL musí obsahovat `script.google.com/macros/s/` a končit `/exec`

### "Nepodařilo se synchronizovat"
- Zkontrolujte, že máte povolené pop-up okna
- Ověřte, že Google Apps Script má správná oprávnění
- Vyzkoušejte URL přímo v browseru

### Data se neobjevují v tabulce
- Zkontrolujte, že používáte správné ID tabulky
- Ověřte, že máte přístup k tabulce
- Zkontrolujte, že webová aplikace běží pod vaším účtem

### Chyba oprávnění
- V Google Apps Script zkontrolujte oprávnění
- Spusťte funkci `testFunction()` pro ověření oprávnění
- Možná budete muset znovu publikovat webovou aplikaci

## Bezpečnost

- **Webová aplikace běží pod vaším Google účtem**
- **Pouze vy máte přístup k datům v tabulce**
- **URL webové aplikace by měla zůstat soukromá**
- **Můžete kdykoliv zakázat webovou aplikaci** v Google Apps Script

## Záloha a export

Kromě Google Sheets synchronizace máte stále k dispozici:
- **Lokální úložiště** v browseru
- **Export do XLSX** souborů
- **Export do JSON** souborů

Doporučujeme kombinovat všechny metody pro maximální bezpečnost dat. 