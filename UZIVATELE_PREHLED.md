# Přehled uživatelů - Mobil Maják

## Administrátor

| Jméno | Uživatelské jméno | Heslo | Role | Prodejna |
|-------|-------------------|-------|------|----------|
| Administrátor | admin | admin123 | admin | Všechny |

## Prodejci

| Jméno | Uživatelské jméno | Heslo | Role | Prodejna |
|-------|-------------------|-------|------|----------|
| Šimon Gabriel | gabriel | globus123 | prodejce | Globus |
| Lukáš Kováčik | kovacik | cepkov123 | prodejce | Čepkov |
| Tereza Šebestová | sebestova | myslocevice123 | prodejce | Mysločevice |
| Jaroslav Truhlář | truhlar | futurum123 | prodejce | Futurum |
| Daniel Halama | halama | teplicka123 | prodejce | Teplička |
| Jaroslav Boháč | bohac | zlin123 | prodejce | Zlín |
| Vojtěch Janců | jancu | janacek123 | prodejce | Janáček |

## Funkce systému

### Pro prodejce:
- Po přihlášení vidí pouze své statistiky
- Denní a měsíční přehled prodejů
- Graf vývoje prodejů
- Detailní výpis prodaných položek

### Pro administrátora:
- Vidí vlastní statistiky
- Může přepínat mezi všemi prodejci
- Správa uživatelů (přidávání, editace, mazání)
- Přístup ke všem datům

## Poznámky:
- Data se načítají z Google Sheets (aktuální a měsíční)
- Denní statistiky se ukládají lokálně pro historii
- Grafy zobrazují simulovaná historická data (v produkci by se načítala z databáze) 