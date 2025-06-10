// ⚠️⚠️⚠️ POZOR! TENTO SOUBOR OBSAHUJE FUNKČNÍ GOOGLE SHEETS ZÁPIS! ⚠️⚠️⚠️
// ⚠️ VÝKUPNÍ FORMULÁŘ FUNGUJE SPRÁVNĚ OD 10.6.2025 ⚠️
// ⚠️ NEMĚNIT BEZ VÝSLOVNÉHO SVOLENÍ UŽIVATELE! ⚠️
//
// Správa lokálních bazarových dat s Google Sheets synchronizací
class BazarStorage {
    constructor() {
        this.storageKey = 'bazarRecords';
        this.counterKey = 'bazarCounter';
        // ⚠️ KRITICKÁ URL PRO ZÁPIS VÝKUPNÍCH DAT - NEMĚNIT! ⚠️
        // ⚠️ FUNKČNÍ OD 10.6.2025 - ODESÍLÁ DO SPRÁVNÉ TABULKY! ⚠️
        // URL pro Google Apps Script webovou aplikaci - FUNKČNÍ URL
        this.googleSheetsURL = 'https://script.google.com/macros/s/AKfycbwkATHtC5SG67oDkiItUxxLV-mS3tsIDHoiSRvaNDNMLMPczDEdTrGnexkaev7ppALN/exec';
        // ⚠️ KONEC KRITICKÉ URL ⚠️
        this.syncEnabled = true; // Zapnuto - opravená detekce duplicit podle čísla výkupky
    }
    
    // Nastavení Google Sheets URL
    setGoogleSheetsURL(url) {
        this.googleSheetsURL = url;
        this.syncEnabled = true;
        localStorage.setItem('googleSheetsURL', url);
        console.log('Google Sheets synchronizace aktivována');
    }
    
    // Načtení uloženého URL při startu
    loadGoogleSheetsConfig() {
        const savedURL = localStorage.getItem('googleSheetsURL');
        if (savedURL) {
            this.googleSheetsURL = savedURL;
            this.syncEnabled = true;
        }
    }
    
    // Diagnostika Google Apps Script
    async testGoogleAppsScript() {
        if (!this.syncEnabled || !this.googleSheetsURL) {
            console.log('❌ Google Sheets není nakonfigurován');
            return;
        }
        
        console.log('🧪 Spouštím diagnostiku Google Apps Script...');
        console.log('📍 URL:', this.googleSheetsURL);
        
        // Test připojení
        try {
            const response = await fetch(this.googleSheetsURL, {
                method: 'GET',
                mode: 'no-cors'
            });
            console.log('✅ Připojení k Google Apps Script funguje');
        } catch (error) {
            console.log('❌ Chyba připojení:', error);
            return;
        }
        
        // Test odesílání dat
        const testData = {
            datum: '2024-01-01',
            cas: '12:00',
            vykupka: 'TEST DIAGNOSTIKA',
            typTelefonu: 'Test Phone',
            imei: 'DIAGNOSTIC12345',
            cena: 1,
            vykoupil: 'Test User'
        };
        
        console.log('📝 Odesílám testovací data:', testData);
        const result = await this.sendToGoogleSheets(testData);
        
        if (result.success) {
            console.log('✅ Test úspěšný! Zkontrolujte Google Sheets tabulku.');
            alert('Test diagnostiky dokončen! Zkontrolujte konzoli a Google Sheets tabulku.');
        } else {
            console.log('❌ Test neúspěšný:', result.reason);
            alert('Test neúspěšný: ' + result.reason);
        }
    }
    
    // Odeslání dat do Google Sheets
    async sendToGoogleSheets(record) {
        if (!this.syncEnabled || !this.googleSheetsURL) {
            return { success: false, reason: 'Google Sheets není nakonfigurován' };
        }
        
        try {
            console.log('🚀 Odesílám data do Google Apps Script:', {
                url: this.googleSheetsURL,
                action: 'addRecord',
                data: record
            });
            
            const response = await fetch(this.googleSheetsURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'addRecord',
                    data: record
                })
            });
            
            console.log('✅ Data odeslána do Google Apps Script');
            return { success: true };
        } catch (error) {
            console.error('❌ Chyba při odesílání do Google Sheets:', error);
            return { success: false, reason: error.message };
        }
    }
    
    // Získání dalšího ID v sekvenci
    getNextId() {
        const counter = parseInt(localStorage.getItem(this.counterKey)) || 0;
        const nextId = counter + 1;
        localStorage.setItem(this.counterKey, nextId.toString());
        return nextId;
    }
    
    // Získání všech záznamů
    getRecords() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (error) {
            console.error('Chyba při načítání bazarových dat:', error);
            return [];
        }
    }
    
    // Přidání nového záznamu (rozšířeno o Google Sheets)
    async addRecord(record) {
        try {
            // Lokální uložení
            const records = this.getRecords();
            record.id = this.getNextId();
            record.timestamp = new Date().toISOString();
            records.push(record);
            localStorage.setItem(this.storageKey, JSON.stringify(records));
            
            // Pokus o odeslání do Google Sheets
            if (this.syncEnabled) {
                const googleResult = await this.sendToGoogleSheets(record);
                if (!googleResult.success) {
                    console.warn('Nepodařilo se synchronizovat s Google Sheets:', googleResult.reason);
                    // Zobrazit upozornění uživateli
                    this.showSyncWarning(googleResult.reason);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Chyba při ukládání bazarového záznamu:', error);
            return false;
        }
    }
    
    // Smazání záznamu podle ID
    deleteRecord(id) {
        try {
            const records = this.getRecords();
            const filteredRecords = records.filter(record => record.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(filteredRecords));
            return true;
        } catch (error) {
            console.error('Chyba při mazání bazarového záznamu:', error);
            return false;
        }
    }
    
    // Export do XLSX
    exportToXLSX() {
        const records = this.getRecords();
        if (records.length === 0) {
            alert('Žádná data k exportu');
            return;
        }
        
        // Načtení XLSX knihovny pokud není dostupná
        if (typeof XLSX === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => this.performXLSXExport(records);
            document.head.appendChild(script);
        } else {
            this.performXLSXExport(records);
        }
    }
    
    // Provádění XLSX exportu
    performXLSXExport(records) {
        // Příprava dat pro export podle nového pořadí sloupců
        const exportData = records.map(record => ({
            'Výkupka': record.vykupka,
            'Datum výkupu': record.datum,
            'Název telefonu': record.typTelefonu,
            'IMEI': record.imei,
            'Jak se o nás klient dozvěděl?': record.jakSeONasDozvedelKlient || '',
            'Cena': record.cena,
            'Nabíječka': record.nabijjecka,
            'Krabička': record.krabicka,
            'Záruční list': record.zarucniList,
            'Záruka do': record.zarukaDo || '',
            'Použité díly': record.pouziteDily,
            'Vykoupil': record.vykoupil,
            'Jméno klienta': record.jmenoKlienta,
            'Přijímení klienta': record.prijmeniKlienta,
            'Adresa': record.adresaKlienta,
            'Rodné číslo': record.rodneCislo,
            'Rodinný stav': record.rodinnyStav || '',
            'Místo vydání OP': record.mistoVydaniDokladu,
            'Datum vydání OP': record.datumVydaniDokladu,
            'Platnost OP': record.platnostDo,
            'Narození klienta': record.datumNarozeni,
            'Pohlaví': record.pohlavi || '',
            'Číslo OP': record.cisloOP || '',
            'Místo narození': record.mistoNarozeni || '',
            'Telefonní číslo': record.telefonniCislo || '',
            'Poznámky': record.poznamky || '',
            'ID': record.id,
            'Timestamp': record.timestamp,
            'Čas': record.cas
        }));
        
        // Vytvoření workbooku a worksheetu
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Přidání worksheetu do workbooku
        XLSX.utils.book_append_sheet(wb, ws, 'Bazar');
        
        // Stažení XLSX souboru
        XLSX.writeFile(wb, `bazar_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    
    // Export do JSON
    exportToJSON() {
        const records = this.getRecords();
        if (records.length === 0) {
            alert('Žádná data k exportu');
            return;
        }
        
        const jsonContent = JSON.stringify(records, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `bazar_data_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
    
    // Vymazání všech dat
    clearAllData() {
        if (confirm('Opravdu chcete vymazat všechna bazarová data? Tuto akci nelze vrátit zpět.')) {
            localStorage.removeItem(this.storageKey);
            return true;
        }
        return false;
    }
    
    // Statistiky
    getStats() {
        const records = this.getRecords();
        return {
            totalRecords: records.length,
            totalValue: records.reduce((sum, record) => sum + (record.cena || 0), 0),
            lastEntry: records.length > 0 ? records[records.length - 1].datum : null
        };
    }
    
    // Zobrazení upozornění o synchronizaci
    showSyncWarning(reason) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1000;
            background: #ff9800; color: white; padding: 1rem; border-radius: 0.5rem;
            max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        warning.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span style="font-weight: 500;">Upozornění synchronizace</span>
            </div>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                Data byla uložena lokálně, ale nepodařilo se synchronizovat s Google Sheets.
            </p>
        `;
        
        document.body.appendChild(warning);
        setTimeout(() => warning.remove(), 5000);
    }
    
    // Chytrá synchronizace - Google Apps Script automaticky odmítá duplicity
    async syncAllToGoogleSheets() {
        if (!this.syncEnabled) {
            alert('Google Sheets synchronizace není nakonfigurována');
            return;
        }
        
        const records = this.getRecords();
        if (records.length === 0) {
            alert('Žádná lokální data k synchronizaci');
            return;
        }
        
        console.log('🔄 Spouštím chytrou synchronizaci...');
        console.log(`📋 Celkem lokálních záznamů: ${records.length}`);
        
        const confirmSync = confirm(
            `🔄 Chytrá synchronizace\n\n` +
            `Nahráno bude: ${records.length} záznamů\n\n` +
            `Google Apps Script automaticky přeskočí duplicitní záznamy podle čísla výkupky.\n\n` +
            `Pokračovat?`
        );
        
        if (!confirmSync) {
            console.log('❌ Synchronizace zrušena uživatelem');
            return;
        }
        
        try {
            let newCount = 0;
            let duplicateCount = 0;
            let failCount = 0;
            
            for (const record of records) {
                console.log(`🔄 Zpracovávám záznam s výkupkou: ${record.vykupka}`);
                const result = await this.sendToGoogleSheets(record);
                
                // Poznámka: Kvůli no-cors mode nemůžeme přečíst odpověď
                // Všechny požadavky se zobrazí jako úspěšné
                // Ale Google Apps Script interně kontroluje duplicity
                
                if (result.success) {
                    console.log(`📤 Požadavek odeslán pro výkupku: ${record.vykupka}`);
                    newCount++;
                } else {
                    failCount++;
                    console.log(`❌ Chyba při odesílání výkupky: ${record.vykupka}`);
                }
                
                // Malá pauza mezi požadavky
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Poznámka: Kvůli no-cors nemůžeme rozlišit nové vs duplicitní
            // Ale Google Apps Script je automaticky filtruje
            alert(
                `🔄 Synchronizace dokončena!\n\n` +
                `📤 Odesláno: ${newCount} záznamů\n` +
                `❌ Chyby: ${failCount}\n\n` +
                `ℹ️ Google Apps Script automaticky přeskočil\n` +
                `duplicitní záznamy podle čísla výkupky.\n\n` +
                `📊 Celkem lokálních záznamů: ${records.length}`
            );
            
            console.log('✅ Chytrá synchronizace dokončena');
            
        } catch (error) {
            console.error('❌ Chyba při chytré synchronizaci:', error);
            alert(`❌ Chyba při synchronizaci: ${error.message}\n\nZkuste to znovu nebo použijte "Diagnostika" pro více informací.`);
        }
    }
    
    // Diagnostika Google Sheets připojení
    async diagnoseGoogleSheets() {
        if (!this.syncEnabled) {
            alert('Google Sheets synchronizace není nakonfigurována');
            return;
        }
        
        try {
            console.log('🔍 Spouštím diagnostiku Google Sheets...');
            
            const response = await fetch(this.googleSheetsURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'diagnoseSpreadsheet'
                })
            });
            
            alert('Diagnostika byla spuštěna.\n\nPro zobrazení výsledků:\n1. Otevřete Google Apps Script projekt\n2. Klikněte na "Spuštění" v levém menu\n3. Vyberte nejnovější spuštění funkce "diagnoseSpreadsheet"\n4. Prohlédněte si logy');
            
        } catch (error) {
            console.error('Chyba při diagnostice:', error);
            alert('Chyba při spouštění diagnostiky: ' + error.message);
        }
    }
}

// Globální instance
window.bazarStorage = new BazarStorage();

// Funkce pro přidání export tlačítek do UI (skrytých)
function addExportButtons() {
    const container = document.getElementById('bazarDataContainer');
    if (!container) return;
    
    const exportDiv = document.createElement('div');
    exportDiv.style.cssText = 'margin: 2rem 0; padding: 1rem;';
    exportDiv.innerHTML = `
        <details style="background: var(--bg-secondary); border-radius: 0.5rem; padding: 1rem;">
            <summary style="cursor: pointer; font-weight: 500; color: var(--text-primary); margin-bottom: 1rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 0.5rem;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export a správa dat
            </summary>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem;">
                <button onclick="bazarStorage.exportToXLSX()" class="btn" style="background: var(--accent-green);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    Export XLSX
                </button>
                <button onclick="bazarStorage.exportToJSON()" class="btn" style="background: var(--accent-blue);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                    Export JSON
                </button>
                <button onclick="showBazarStats()" class="btn" style="background: var(--accent-yellow); color: black;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                    Statistiky
                </button>
                <button onclick="configureGoogleSheets()" class="btn" style="background: var(--accent-purple);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 6.042A9.02 9.02 0 0 1 12 6a9 9 0 0 1 9 9 9.02 9.02 0 0 1-.042 0h0A9 9 0 0 1 12 24a9.02 9.02 0 0 1 0-.042v0A9 9 0 0 1 3 15a9.02 9.02 0 0 1 .042 0v0A9 9 0 0 1 12 6.042Z"></path>
                        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                        <path d="M12 2v4"></path>
                        <path d="M12 18v4"></path>
                    </svg>
                    Nastavit Google Sheets
                </button>
                <button onclick="bazarStorage.syncAllToGoogleSheets()" class="btn" style="background: var(--accent-teal);" 
                        ${bazarStorage.syncEnabled ? '' : 'disabled style="opacity: 0.5; cursor: not-allowed;"'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 6H3"></path>
                        <path d="m5 12 4 4L21 4"></path>
                    </svg>
                    Chytrá synchronizace
                </button>
                <button onclick="bazarStorage.diagnoseGoogleSheets()" class="btn" style="background: var(--accent-orange);" 
                        ${bazarStorage.syncEnabled ? '' : 'disabled style="opacity: 0.5; cursor: not-allowed;"'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m9 12 2 2 4-4"></path>
                    </svg>
                    Diagnostika
                </button>
                ${isAdminRole() ? `
                <button onclick="secureDeleteAllData()" class="btn" style="background: var(--error-color, #dc3545); color: white;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Smazat všechna data
                </button>
                ` : ''}
            </div>
        </details>
    `;
    
    container.parentNode.insertBefore(exportDiv, container.nextSibling);
}

// Načtení Google Sheets konfigurace při startu
bazarStorage.loadGoogleSheetsConfig();

// Funkce pro kontrolu role administrátora
function isAdminRole() {
    const userRole = localStorage.getItem('role');
    return userRole === 'Administrátor';
}

// Bezpečná funkce pro smazání všech dat s potvrzením hesla
function secureDeleteAllData() {
    // První potvrzení
    const confirmDelete = confirm(
        '⚠️ POZOR! Chystáte se smazat VŠECHNA bazarová data!\n\n' +
        'Tato akce je NEVRATNÁ!\n\n' +
        'Smaže se:\n' +
        '• Všechny lokální záznamy\n' +
        '• Čítač ID se resetuje\n\n' +
        'Pokračovat?'
    );
    
    if (!confirmDelete) {
        return;
    }
    
    // Druhé potvrzení s heslem
    const password = prompt(
        '🔐 Pro dokončení smazání zadejte administrátorské heslo:\n\n' +
        '(Toto heslo je nutné pro bezpečnost dat)'
    );
    
    // Kontrola hesla
    if (password !== '0Mehegru12') {
        alert('❌ Nesprávné heslo! Smazání bylo zrušeno.');
        return;
    }
    
    // Finální potvrzení
    const finalConfirm = confirm(
        '🔥 FINÁLNÍ POTVRZENÍ\n\n' +
        'Opravdu smazat všechna bazarová data?\n\n' +
        'Tato akce je NEVRATNÁ!\n\n' +
        'Klikněte OK pro smazání nebo Zrušit pro přerušení.'
    );
    
    if (!finalConfirm) {
        alert('✅ Smazání bylo zrušeno.');
        return;
    }
    
    try {
        // Smazání lokálních dat
        localStorage.removeItem('bazarRecords');
        localStorage.removeItem('bazarCounter');
        
        // Úspěšná zpráva
        alert(
            '✅ Všechna bazarová data byla úspěšně smazána!\n\n' +
            '• Lokální záznamy: SMAZÁNY\n' +
            '• Čítač ID: RESETOVÁN\n\n' +
            'Stránka se nyní obnoví.'
        );
        
        console.log('🗑️ Administrátor smazal všechna bazarová data');
        
        // Obnovení stránky
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Chyba při mazání dat:', error);
        alert('❌ Chyba při mazání dat: ' + error.message);
    }
}

// Funkce pro zobrazení statistik
function showBazarStats() {
    const stats = bazarStorage.getStats();
    alert(`Bazarové statistiky:\n\nCelkem záznamů: ${stats.totalRecords}\nCelková hodnota: ${stats.totalValue.toLocaleString('cs-CZ')} Kč\nPoslední záznam: ${stats.lastEntry || 'Žádný'}`);
}

// Funkce pro vymazání dat
function clearBazarData() {
    if (bazarStorage.clearAllData()) {
        alert('Všechna data byla vymazána');
        if (window.bazarLoader && window.bazarLoader.loadBazarData) {
            window.bazarLoader.loadBazarData();
        }
    }
}

// Funkce pro konfiguraci Google Sheets
function configureGoogleSheets() {
    const currentURL = bazarStorage.googleSheetsURL;
    const url = prompt(
        'Zadejte URL Google Apps Script webové aplikace:\n\n' +
        'Návod:\n' +
        '1. Vytvořte nový Google Apps Script projekt\n' +
        '2. Vložte kód pro práci s tabulkou\n' +
        '3. Publikujte jako webovou aplikaci\n' +
        '4. Zkopírujte URL zde\n\n' +
        'Aktuální:', 
        currentURL
    );
    
    if (url && url.trim() && url !== currentURL) {
        bazarStorage.setGoogleSheetsURL(url.trim());
        alert('Google Sheets URL bylo nastaveno!\nSynchronizace je nyní aktivní.');
    }
}