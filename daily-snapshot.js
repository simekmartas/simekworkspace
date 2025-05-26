// Automatické ukládání denních snapshotů
class DailySnapshot {
    constructor() {
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.baseUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv`;
        this.checkInterval = 60 * 60 * 1000; // Kontrola každou hodinu
        this.init();
    }

    init() {
        // Spustit první kontrolu
        this.checkAndSaveSnapshot();
        
        // Nastavit interval pro pravidelnou kontrolu
        setInterval(() => {
            this.checkAndSaveSnapshot();
        }, this.checkInterval);
    }

    async checkAndSaveSnapshot() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const hour = now.getHours();
        
        // Kontrola, zda už máme snapshot pro dnešek
        const snapshotKey = `snapshot_${today}`;
        const lastSnapshot = localStorage.getItem(snapshotKey);
        
        // Pokud je 23:00 nebo později a ještě nemáme finální snapshot
        if (hour >= 23 && (!lastSnapshot || JSON.parse(lastSnapshot).hour < 23)) {
            await this.saveSnapshot(today, hour);
        }
        // Nebo pokud vůbec nemáme snapshot pro dnešek
        else if (!lastSnapshot) {
            await this.saveSnapshot(today, hour);
        }
    }

    async saveSnapshot(date, hour) {
        try {
            console.log(`Ukládám snapshot pro ${date} v ${hour}:00`);
            
            // Načíst aktuální data
            const currentData = await this.fetchCurrentData();
            
            if (currentData && currentData.length > 0) {
                const snapshot = {
                    date: date,
                    hour: hour,
                    timestamp: new Date().toISOString(),
                    data: currentData
                };
                
                // Uložit snapshot
                localStorage.setItem(`snapshot_${date}`, JSON.stringify(snapshot));
                
                // Uložit také do historie (omezit na posledních 30 dní)
                this.updateHistory(date, currentData);
                
                console.log(`Snapshot pro ${date} úspěšně uložen`);
            }
        } catch (error) {
            console.error('Chyba při ukládání snapshotu:', error);
        }
    }

    async fetchCurrentData() {
        try {
            const url = `${this.baseUrl}&gid=0&cachebust=${Date.now()}`;
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            
            if (response.ok) {
                const data = await response.json();
                return this.parseCSV(data.contents);
            }
        } catch (error) {
            console.error('Chyba při načítání dat:', error);
        }
        
        return null;
    }

    parseCSV(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });
            data.push(row);
        }

        return data;
    }

    updateHistory(date, data) {
        // Načíst existující historii
        let history = [];
        const historyStr = localStorage.getItem('sales_history');
        if (historyStr) {
            history = JSON.parse(historyStr);
        }
        
        // Přidat nebo aktualizovat dnešní záznam
        const existingIndex = history.findIndex(h => h.date === date);
        if (existingIndex >= 0) {
            history[existingIndex] = { date, data };
        } else {
            history.push({ date, data });
        }
        
        // Seřadit podle data (nejnovější první)
        history.sort((a, b) => b.date.localeCompare(a.date));
        
        // Omezit na posledních 30 záznamů
        history = history.slice(0, 30);
        
        // Uložit zpět
        localStorage.setItem('sales_history', JSON.stringify(history));
    }

    // Metoda pro získání historických dat
    getHistoricalData(date) {
        // Nejdřív zkusit snapshot
        const snapshotKey = `snapshot_${date}`;
        const snapshot = localStorage.getItem(snapshotKey);
        if (snapshot) {
            return JSON.parse(snapshot).data;
        }
        
        // Pak zkusit historii
        const historyStr = localStorage.getItem('sales_history');
        if (historyStr) {
            const history = JSON.parse(historyStr);
            const record = history.find(h => h.date === date);
            if (record) {
                return record.data;
            }
        }
        
        return null;
    }

    // Metoda pro získání dostupných dat
    getAvailableDates() {
        const dates = new Set();
        
        // Přidat data ze snapshotů
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('snapshot_')) {
                dates.add(key.replace('snapshot_', ''));
            }
        }
        
        // Přidat data z historie
        const historyStr = localStorage.getItem('sales_history');
        if (historyStr) {
            const history = JSON.parse(historyStr);
            history.forEach(h => dates.add(h.date));
        }
        
        return Array.from(dates).sort((a, b) => b.localeCompare(a));
    }

    // Vyčistit staré snapshoty (starší než 30 dní)
    cleanOldSnapshots() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('snapshot_')) {
                const date = key.replace('snapshot_', '');
                if (new Date(date) < thirtyDaysAgo) {
                    keysToRemove.push(key);
                }
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Vyčištěno ${keysToRemove.length} starých snapshotů`);
    }
}

// Spustit automatické ukládání pouze na stránkách, kde je to potřeba
if (window.location.pathname.includes('prodejny.html') || 
    window.location.pathname.includes('dashboard.html')) {
    window.dailySnapshot = new DailySnapshot();
} 