// History Data Manager - správa historických denních snapshotů
class HistoryDataManager {
    constructor() {
        // Konfigurace
        this.storageKey = 'sales_history_data';
        this.dailySnapshotTime = '20:15'; // Čas denního snapshotu
        
        // Google Sheets konfigurace - AKTUÁLNÍ data (ne měsíční)
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.currentDataGid = '0'; // aktuální data - main list
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbyGPiyfiPMn1yvZFoYuiFwFiCXJ7u3vBLlmiEqXLXSuzuDvDCcKqm6uUyDIRbcH4Ftk5g/exec';
        
        console.log('📚 HistoryDataManager inicializován');
        
        // Automaticky zkontrolovat, zda není čas na denní snapshot
        this.checkDailySnapshot();
        
        // Nastavit pravidelnou kontrolu (každých 15 minut)
        this.setupPeriodicCheck();
    }

    // Získat všechna historická data
    getHistoryData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('❌ Chyba při načítání historických dat:', error);
            return {};
        }
    }

    // Uložit historická data
    saveHistoryData(historyData) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(historyData));
            console.log('✅ Historická data uložena');
            return true;
        } catch (error) {
            console.error('❌ Chyba při ukládání historických dat:', error);
            return false;
        }
    }

    // Získat data pro konkrétní datum
    getDataForDate(dateString) {
        const historyData = this.getHistoryData();
        return historyData[dateString] || null;
    }

    // Získat seznam dostupných historických dat (seřazený)
    getAvailableDates() {
        const historyData = this.getHistoryData();
        return Object.keys(historyData).sort().reverse(); // Nejnovější první
    }

    // Zkontrolovat, zda už existuje snapshot pro dnešní den
    hasTodaySnapshot() {
        const today = this.getTodayDateString();
        return this.getDataForDate(today) !== null;
    }

    // Získat dnešní datum jako string (YYYY-MM-DD)
    getTodayDateString() {
        const now = new Date();
        return now.getFullYear() + '-' + 
               String(now.getMonth() + 1).padStart(2, '0') + '-' + 
               String(now.getDate()).padStart(2, '0');
    }

    // Získat čas pro porovnání (HH:MM)
    getCurrentTimeString() {
        const now = new Date();
        return String(now.getHours()).padStart(2, '0') + ':' + 
               String(now.getMinutes()).padStart(2, '0');
    }

    // Zkontrolovat, zda je čas na denní snapshot
    checkDailySnapshot() {
        const currentTime = this.getCurrentTimeString();
        const hasTodayData = this.hasTodaySnapshot();
        
        console.log(`⏰ Kontrola denního snapshotu: ${currentTime}, Už máme dnešní data: ${hasTodayData}`);
        
        // Pokud je po 20:15 a ještě nemáme dnešní snapshot
        if (currentTime >= this.dailySnapshotTime && !hasTodayData) {
            console.log('🎯 Čas na denní snapshot!');
            this.createDailySnapshot();
        }
    }

    // Vytvořit denní snapshot aktuálních dat
    async createDailySnapshot(forceDate = null) {
        const dateString = forceDate || this.getTodayDateString();
        
        console.log(`📸 Vytváŕím denní snapshot pro: ${dateString}`);
        
        try {
            // Načíst aktuální data z Google Sheets
            const rawData = await this.loadCurrentDataFromGoogleSheets();
            
            if (!rawData || rawData.length === 0) {
                throw new Error('Žádná data z Google Sheets');
            }

            // Zpracovat data
            const processedData = this.processRawDataForSnapshot(rawData);
            
            // Vytvořit snapshot objekt
            const snapshot = {
                date: dateString,
                timestamp: new Date().toISOString(),
                captureTime: this.getCurrentTimeString(),
                data: rawData, // Původní raw data
                processed: processedData, // Zpracovaná data pro rychlé načítání
                metadata: {
                    totalRows: rawData.length - 1, // -1 pro header
                    totalSellers: processedData.sellers.length,
                    totalPoints: processedData.totalPoints,
                    topSeller: processedData.topSeller
                }
            };

            // Uložit do historie
            const historyData = this.getHistoryData();
            historyData[dateString] = snapshot;
            
            const success = this.saveHistoryData(historyData);
            
            if (success) {
                console.log(`✅ Snapshot pro ${dateString} úspěšně vytvořen`);
                console.log(`📊 Metadata:`, snapshot.metadata);
                
                // Oznámit o novém snapshotu
                this.notifySnapshotCreated(dateString, snapshot.metadata);
                
                return snapshot;
            } else {
                throw new Error('Nepodařilo se uložit snapshot');
            }
            
        } catch (error) {
            console.error(`❌ Chyba při vytváření snapshotu pro ${dateString}:`, error);
            throw error;
        }
    }

    // Načíst aktuální data z Google Sheets (hlavní list, ne měsíční)
    async loadCurrentDataFromGoogleSheets() {
        console.log('🔄 Načítám aktuální data z Google Sheets pro snapshot...');
        
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const callbackName = `historyCallback_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Vytvoř globální callback funkci
            window[callbackName] = (data) => {
                try {
                    console.log('JSONP callback zavolán pro historický snapshot:', data);
                    
                    if (data && data.data && Array.isArray(data.data)) {
                        console.log(`✅ Načteno ${data.data.length} řádků pro snapshot`);
                        resolve(data.data);
                    } else {
                        console.error('Neplatná struktura dat pro snapshot:', data);
                        reject(new Error('Neplatná struktura dat'));
                    }
                    
                    // Vyčisti callback
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.head.removeChild(script);
                    }
                    
                } catch (error) {
                    console.error('Chyba v JSONP callback pro snapshot:', error);
                    reject(error);
                }
            };
            
            // Vytvoř script tag
            const script = document.createElement('script');
            const scriptSrc = `${this.scriptUrl}?gid=${this.currentDataGid}&callback=${callbackName}&_=${timestamp}`;
            script.src = scriptSrc;
            console.log(`🔗 Script URL pro snapshot:`, scriptSrc);
            
            script.onerror = () => {
                delete window[callbackName];
                if (script.parentNode) {
                    document.head.removeChild(script);
                }
                reject(new Error('JSONP request failed for snapshot'));
            };
            
            // Timeout po 10 sekundách
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.head.removeChild(script);
                    }
                    reject(new Error('JSONP request timeout for snapshot'));
                }
            }, 10000);
            
            document.head.appendChild(script);
        });
    }

    // Zpracovat raw data pro snapshot - extrahovat užitečné informace
    processRawDataForSnapshot(rawData) {
        if (!rawData || rawData.length < 2) {
            return { sellers: [], totalPoints: 0, topSeller: null };
        }

        const headers = rawData[0];
        const dataRows = rawData.slice(1).filter(row => 
            row && row.some(cell => String(cell || '').trim())
        );

        // Najít indexy důležitých sloupců
        const prodejceIndex = headers.findIndex(h => h && h.toLowerCase().includes('prodejce'));
        const prodejnaIndex = headers.findIndex(h => h && h.toLowerCase().includes('prodejna'));
        const polozkyIndex = headers.findIndex(h => h && h.toLowerCase().includes('polozky_nad_100'));

        const sellers = [];
        let totalPoints = 0;

        dataRows.forEach(row => {
            const prodejce = row[prodejceIndex] || 'Neznámý';
            const prodejna = row[prodejnaIndex] || 'Nespecifikována';
            const polozky = parseInt(row[polozkyIndex]) || 0;
            
            // Základní body (15 za každou položku nad 100 Kč)
            const points = polozky * 15;
            totalPoints += points;

            sellers.push({
                name: prodejce,
                prodejna: prodejna,
                items: polozky,
                points: points
            });
        });

        // Seřadit podle bodů
        sellers.sort((a, b) => b.points - a.points);
        
        const topSeller = sellers.length > 0 ? sellers[0] : null;

        return {
            sellers,
            totalPoints,
            topSeller
        };
    }

    // Oznámit vytvoření nového snapshotu
    notifySnapshotCreated(dateString, metadata) {
        console.log(`🎉 Nový historický snapshot vytvořen!`);
        console.log(`📅 Datum: ${dateString}`);
        console.log(`👥 Počet prodejců: ${metadata.totalSellers}`);
        console.log(`🏆 Celkem bodů: ${metadata.totalPoints}`);
        
        if (metadata.topSeller) {
            console.log(`🥇 Nejlepší: ${metadata.topSeller.name} (${metadata.topSeller.points} bodů)`);
        }

        // Lze později přidat push notification nebo toast
    }

    // Nastavit pravidelnou kontrolu
    setupPeriodicCheck() {
        // Kontrola každých 15 minut
        setInterval(() => {
            this.checkDailySnapshot();
        }, 15 * 60 * 1000);
        
        console.log('⏰ Pravidelná kontrola denních snapshotů nastavena (každých 15 minut)');
    }

    // MANUÁLNÍ FUNKCE PRO TESTOVÁNÍ
    
    // Vytvořit snapshot pro včerejšek (testovací)
    async createYesterdaySnapshot() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.getFullYear() + '-' + 
                              String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(yesterday.getDate()).padStart(2, '0');
        
        console.log(`🧪 Vytváŕím testovací snapshot pro včerejšek: ${yesterdayString}`);
        return await this.createDailySnapshot(yesterdayString);
    }

    // Vymazat všechna historická data (POZOR!)
    clearAllHistory() {
        if (confirm('Opravdu chcete vymazat VŠECHNA historická data? Tuto akci nelze vrátit zpět!')) {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ Všechna historická data vymazána');
            return true;
        }
        return false;
    }

    // Získat statistiky historie
    getHistoryStats() {
        const historyData = this.getHistoryData();
        const dates = Object.keys(historyData).sort();
        
        if (dates.length === 0) {
            return {
                totalDays: 0,
                firstDate: null,
                lastDate: null,
                totalSize: 0
            };
        }

        const totalSize = JSON.stringify(historyData).length;
        
        return {
            totalDays: dates.length,
            firstDate: dates[0],
            lastDate: dates[dates.length - 1],
            totalSize: totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
        };
    }

    // Export historie do JSON souboru
    exportHistory() {
        const historyData = this.getHistoryData();
        const dataStr = JSON.stringify(historyData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `mobil_majak_history_${this.getTodayDateString()}.json`;
        link.click();
        
        console.log('💾 Historie exportována do JSON souboru');
    }

    // Import historie z JSON souboru
    importHistory(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validace struktury
                    if (typeof importedData !== 'object') {
                        throw new Error('Neplatná struktura importovaných dat');
                    }
                    
                    // Sloučit s existujícími daty
                    const currentData = this.getHistoryData();
                    const mergedData = { ...currentData, ...importedData };
                    
                    this.saveHistoryData(mergedData);
                    
                    console.log('📥 Historie úspěšně importována');
                    resolve(Object.keys(importedData).length);
                    
                } catch (error) {
                    console.error('❌ Chyba při importu historie:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Chyba při čtení souboru'));
            };
            
            reader.readAsText(file);
        });
    }
}

// Export pro globální použití
window.HistoryDataManager = HistoryDataManager;

// Automatická inicializace při načtení
document.addEventListener('DOMContentLoaded', function() {
    // Inicializovat pouze pokud ještě neexistuje
    if (!window.historyManager) {
        window.historyManager = new HistoryDataManager();
        console.log('🚀 Globální HistoryDataManager inicializován');
    }
});

// DEBUG FUNKCE pro konzoli
window.historyDebug = {
    // Vytvořit testovací snapshot pro dnes
    createTodaySnapshot: () => window.historyManager.createDailySnapshot(),
    
    // Vytvořit testovací snapshot pro včerejšek  
    createYesterdaySnapshot: () => window.historyManager.createYesterdaySnapshot(),
    
    // Zobrazit všechna historická data
    showHistory: () => {
        const history = window.historyManager.getHistoryData();
        console.table(Object.keys(history).map(date => ({
            date: date,
            sellers: history[date].metadata.totalSellers,
            points: history[date].metadata.totalPoints,
            topSeller: history[date].metadata.topSeller?.name || 'N/A'
        })));
        return history;
    },
    
    // Zobrazit statistiky
    showStats: () => {
        const stats = window.historyManager.getHistoryStats();
        console.log('📊 Statistiky historie:', stats);
        return stats;
    },
    
    // Export historie
    exportHistory: () => window.historyManager.exportHistory(),
    
    // Vymazat historii (POZOR!)
    clearHistory: () => window.historyManager.clearAllHistory()
}; 