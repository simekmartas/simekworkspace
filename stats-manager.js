// Správce statistik pro Mobil Maják
class StatsManager {
    constructor() {
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.baseUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv`;
        this.cachedData = new Map();
    }

    // Získat statistiky uživatele
    async getUserStats(userId) {
        const user = await this.getUserById(userId);
        if (!user) return this.getEmptyStats();

        // Načíst aktuální data z Google Sheets
        const currentData = await this.fetchCurrentData();
        const monthlyData = await this.fetchMonthlyData();

        // Najít data pro uživatele podle prodejny
        const userCurrentStats = this.findUserStatsByStore(currentData, user.prodejna);
        const userMonthlyStats = this.findUserStatsByStore(monthlyData, user.prodejna);

        return {
            todaySales: userCurrentStats ? parseInt(userCurrentStats.polozky_nad_100) || 0 : 0,
            todayServices: userCurrentStats ? parseInt(userCurrentStats.sluzby_celkem) || 0 : 0,
            monthlySales: userMonthlyStats ? parseInt(userMonthlyStats.polozky_nad_100) || 0 : 0,
            monthlyServices: userMonthlyStats ? parseInt(userMonthlyStats.sluzby_celkem) || 0 : 0
        };
    }

    // Získat data pro graf
    async getChartData(userId, period, type) {
        const user = await this.getUserById(userId);
        if (!user) return this.getEmptyChartData();

        // Simulovat historická data (v reálné aplikaci by se načítala z databáze)
        const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
        const labels = [];
        const itemsData = [];
        const servicesData = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            if (period === 'week' || period === 'month') {
                labels.push(date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }));
            } else {
                labels.push(date.toLocaleDateString('cs-CZ', { month: 'short' }));
            }

            // Simulovat náhodná data (v reálné aplikaci by se načítala skutečná data)
            itemsData.push(Math.floor(Math.random() * 50) + 10);
            servicesData.push(Math.floor(Math.random() * 20) + 5);
        }

        return { labels, itemsData, servicesData };
    }

    // Získat denní statistiky
    async getDailyStats(userId, date) {
        const user = await this.getUserById(userId);
        if (!user) return [];

        // Získat uložená data pro daný den (pokud existují)
        const savedData = await this.getSavedDailyData(date);
        if (savedData) {
            const userStats = this.findUserStatsByStore(savedData, user.prodejna);
            if (userStats) {
                return this.convertStatsToDetailedList(userStats);
            }
        }

        // Pokud je to dnešní datum, použít aktuální data
        const today = new Date().toISOString().split('T')[0];
        if (date === today) {
            const currentData = await this.fetchCurrentData();
            const userStats = this.findUserStatsByStore(currentData, user.prodejna);
            if (userStats) {
                return this.convertStatsToDetailedList(userStats);
            }
        }

        return [];
    }

    // Načíst aktuální data z Google Sheets
    async fetchCurrentData() {
        const cacheKey = 'current_' + new Date().getMinutes();
        if (this.cachedData.has(cacheKey)) {
            return this.cachedData.get(cacheKey);
        }

        try {
            const url = `${this.baseUrl}&gid=0&cachebust=${Date.now()}`;
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            
            if (response.ok) {
                const data = await response.json();
                const parsedData = this.parseCSV(data.contents);
                this.cachedData.set(cacheKey, parsedData);
                
                // Uložit dnešní data
                this.saveDailyData(parsedData);
                
                return parsedData;
            }
        } catch (error) {
            console.error('Chyba při načítání aktuálních dat:', error);
        }

        return [];
    }

    // Načíst měsíční data z Google Sheets
    async fetchMonthlyData() {
        const cacheKey = 'monthly_' + new Date().getHours();
        if (this.cachedData.has(cacheKey)) {
            return this.cachedData.get(cacheKey);
        }

        try {
            const url = `${this.baseUrl}&gid=1829845095&cachebust=${Date.now()}`;
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            
            if (response.ok) {
                const data = await response.json();
                const parsedData = this.parseCSV(data.contents);
                this.cachedData.set(cacheKey, parsedData);
                return parsedData;
            }
        } catch (error) {
            console.error('Chyba při načítání měsíčních dat:', error);
        }

        return [];
    }

    // Parsovat CSV data
    parseCSV(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });
            if (row.prodejna || row.prodejce) { // Přeskočit prázdné řádky
                data.push(row);
            }
        }

        return data;
    }

    // Najít statistiky podle prodejny
    findUserStatsByStore(data, storeName) {
        return data.find(row => 
            row.prodejna && row.prodejna.toLowerCase() === storeName.toLowerCase()
        );
    }

    // Převést statistiky na detailní seznam
    convertStatsToDetailedList(stats) {
        const items = [];
        const timestamp = new Date().toISOString();

        // Přidat položky
        const itemTypes = ['CT300', 'CT600', 'CT1200', 'AKT', 'ZAH250', 'NAP', 'ZAH500', 'KOP250', 'KOP500', 'PZ1', 'KNZ'];
        itemTypes.forEach(type => {
            const value = parseInt(stats[type.toLowerCase()]) || 0;
            if (value > 0) {
                items.push({
                    type: 'item',
                    name: type,
                    quantity: value,
                    timestamp: timestamp
                });
            }
        });

        // Přidat služby
        const services = parseInt(stats.sluzby_celkem) || 0;
        if (services > 0) {
            items.push({
                type: 'service',
                name: 'Služby celkem',
                quantity: services,
                timestamp: timestamp
            });
        }

        return items;
    }

    // Uložit denní data
    async saveDailyData(data) {
        const today = new Date().toISOString().split('T')[0];
        const key = `daily_stats_${today}`;
        
        try {
            // V reálné aplikaci by se data ukládala na server
            localStorage.setItem(key, JSON.stringify({
                date: today,
                data: data,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Chyba při ukládání denních dat:', error);
        }
    }

    // Získat uložená denní data
    async getSavedDailyData(date) {
        const key = `daily_stats_${date}`;
        
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.data;
            }
        } catch (error) {
            console.error('Chyba při načítání uložených dat:', error);
        }
        
        return null;
    }

    // Pomocné metody
    async getUserById(userId) {
        const db = await window.authSystem.loadDatabase();
        return db.users.find(u => u.id === userId);
    }

    getEmptyStats() {
        return {
            todaySales: 0,
            todayServices: 0,
            monthlySales: 0,
            monthlyServices: 0
        };
    }

    getEmptyChartData() {
        return {
            labels: [],
            itemsData: [],
            servicesData: []
        };
    }
}

// Globální instance
window.statsManager = new StatsManager(); 