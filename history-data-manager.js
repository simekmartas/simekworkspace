// History Data Manager - správa historických denních snapshotů
class HistoryDataManager {
    constructor() {
        // Konfigurace
        this.storageKey = 'sales_history_data';
        this.dailySnapshotTime = '22:35'; // Čas denního snapshotu - změněno na 22:35
        
        // Google Sheets konfigurace - AKTUÁLNÍ data (ne měsíční)
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.currentDataGid = '0'; // aktuální data - main list
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbyGPiyfiPMn1yvZFoYuiFwFiCXJ7u3vBLlmiEqXLXSuzuDvDCcKqm6uUyDIRbcH4Ftk5g/exec';
        
        // Server API konfigurace pro ukládání historie
        this.serverApiUrl = '/api/users-github'; // Stejný endpoint jako pro uživatele
        this.historyEndpoint = '/api/history-data'; // Dedikovaný endpoint pro historii
        
        console.log('📚 HistoryDataManager inicializován (snapshot čas: 22:35)');
        
        // Automaticky zkontrolovat, zda není čas na denní snapshot
        this.checkDailySnapshot();
        
        // Nastavit pravidelnou kontrolu (každých 15 minut)
        this.setupPeriodicCheck();
    }

    // Získat všechna historická data (primárně ze serveru)
    async getHistoryData() {
        try {
            // Zkusit načíst ze serveru
            const serverData = await this.loadHistoryFromServer();
            if (serverData) {
                // Aktualizovat localStorage jako cache
                localStorage.setItem(this.storageKey, JSON.stringify(serverData));
                return serverData;
            }
        } catch (error) {
            console.warn('⚠️ Nepodařilo se načíst historii ze serveru, používám localStorage:', error);
        }

        // Fallback na localStorage
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('❌ Chyba při načítání historických dat z localStorage:', error);
            return {};
        }
    }

    // Uložit historická data (primárně na server)
    async saveHistoryData(historyData) {
        try {
            // Uložit na server
            const serverSuccess = await this.saveHistoryToServer(historyData);
            
            if (serverSuccess) {
                console.log('✅ Historická data uložena na server');
                
                // Backup do localStorage
                localStorage.setItem(this.storageKey, JSON.stringify(historyData));
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Nepodařilo se uložit na server, ukládám do localStorage:', error);
        }

        // Fallback na localStorage
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(historyData));
            console.log('✅ Historická data uložena do localStorage (fallback)');
            return true;
        } catch (error) {
            console.error('❌ Chyba při ukládání historických dat:', error);
            return false;
        }
    }

    // Načíst historii ze serveru
    async loadHistoryFromServer() {
        try {
            const response = await fetch(this.historyEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log(`📥 Načteno ${Object.keys(data.history || {}).length} historických záznamů ze serveru`);
                    return data.history || {};
                }
            }
            
            throw new Error(`Server response: ${response.status}`);
        } catch (error) {
            console.warn('⚠️ Chyba při načítání historie ze serveru:', error);
            return null;
        }
    }

    // Uložit historii na server
    async saveHistoryToServer(historyData) {
        try {
            const response = await fetch(this.historyEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    history: historyData,
                    timestamp: new Date().toISOString(),
                    action: 'save_history'
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.success === true;
            }
            
            throw new Error(`Server response: ${response.status}`);
        } catch (error) {
            console.error('❌ Chyba při ukládání historie na server:', error);
            return false;
        }
    }

    // Získat data pro konkrétní datum (synchronní verze pro kompatibilitu)
    getDataForDate(dateString) {
        try {
            // Pokusit se načíst z localStorage cache
            const data = localStorage.getItem(this.storageKey);
            const historyData = data ? JSON.parse(data) : {};
            return historyData[dateString] || null;
        } catch (error) {
            console.error('❌ Chyba při načítání dat pro datum:', error);
            return null;
        }
    }

    // Získat seznam dostupných historických dat (seřazený)
    getAvailableDates() {
        try {
            // Pokusit se načíst z localStorage cache
            const data = localStorage.getItem(this.storageKey);
            const historyData = data ? JSON.parse(data) : {};
            return Object.keys(historyData).sort().reverse(); // Nejnovější první
        } catch (error) {
            console.error('❌ Chyba při načítání dostupných dat:', error);
            return [];
        }
    }

    // Zkontrolovat, zda už existuje snapshot pro dnešní den
    hasTodaySnapshot() {
        const today = this.getTodayDateString();
        return this.getDataForDate(today) !== null;
    }

    // Zkontrolovat oprávnění uživatele
    getCurrentUser() {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const username = localStorage.getItem('username');
            return users.find(u => u.username === username) || null;
        } catch (e) {
            return null;
        }
    }

    // Zkontrolovat, zda je uživatel administrátor
    isCurrentUserAdmin() {
        const user = this.getCurrentUser();
        return user && user.role && user.role.toLowerCase() === 'administrator';
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
        
        // Pokud je po 22:35 a ještě nemáme dnešní snapshot
        if (currentTime >= this.dailySnapshotTime && !hasTodayData) {
            console.log('🎯 Čas na denní snapshot!');
            this.createDailySnapshot();
        }
    }

    // Vytvořit denní snapshot aktuálních dat (s kontrolou oprávnění)
    async createDailySnapshot(forceDate = null, manualRequest = false) {
        const dateString = forceDate || this.getTodayDateString();
        
        // Kontrola oprávnění pro manuální požadavky
        if (manualRequest && !this.isCurrentUserAdmin()) {
            throw new Error('Manuální vytváření snapshotů je povoleno pouze administrátorům');
        }
        
        console.log(`📸 Vytváŕím denní snapshot pro: ${dateString} (${manualRequest ? 'manuální' : 'automatický'})`);
        
        try {
            // Načíst aktuální data z Google Sheets
            const rawData = await this.loadCurrentDataFromGoogleSheets();
            
            if (!rawData || rawData.length === 0) {
                throw new Error('Žádná data z Google Sheets');
            }

            // Načíst uživatelská data ze serveru
            const usersData = await this.loadUsersFromServer();

            // Zpracovat data s rozšířenými informacemi
            const processedData = this.processRawDataForSnapshot(rawData, usersData);
            
            // Vytvořit rozšířený snapshot objekt pro budoucí analýzy
            const snapshot = {
                date: dateString,
                timestamp: new Date().toISOString(),
                captureTime: this.getCurrentTimeString(),
                version: '2.0', // Verze pro budoucí kompatibilitu
                source: 'google_sheets',
                
                // Raw data pro kompatibilitu
                data: rawData,
                
                // Zpracovaná data pro rychlé načítání
                processed: processedData,
                
                // Rozšířená metadata pro analýzy
                metadata: {
                    totalRows: rawData.length - 1,
                    totalSellers: processedData.sellers.length,
                    activeSellers: processedData.sellers.filter(s => s.points > 0).length,
                    totalPoints: processedData.totalPoints,
                    totalItems: processedData.totalItems,
                    averagePointsPerSeller: processedData.sellers.length > 0 ? 
                        Math.round(processedData.totalPoints / processedData.sellers.length) : 0,
                    topSeller: processedData.topSeller,
                    bottomSeller: processedData.bottomSeller,
                    
                    // Kategorie pro analýzy
                    categories: processedData.categories || {},
                    dailyStats: processedData.dailyStats || {},
                    
                    // Technické informace
                    captureMethod: manualRequest ? 'manual' : 'automatic',
                    capturedBy: manualRequest ? this.getCurrentUser()?.username : 'system'
                },
                
                // Strukturovaná data pro budoucí grafy a trendy
                analytics: {
                    byCategory: processedData.analytics?.byCategory || {},
                    bySeller: processedData.analytics?.bySeller || {},
                    trends: processedData.analytics?.trends || {},
                    comparisons: processedData.analytics?.comparisons || {}
                }
            };

            // Uložit do historie
            const historyData = await this.getHistoryData();
            historyData[dateString] = snapshot;
            
            const success = await this.saveHistoryData(historyData);
            
            if (success) {
                console.log(`✅ Snapshot pro ${dateString} úspěšně vytvořen a uložen na server`);
                console.log(`📊 Metadata:`, snapshot.metadata);
                
                // Oznámit o novém snapshotu
                this.notifySnapshotCreated(dateString, snapshot.metadata);
                
                return snapshot;
            } else {
                throw new Error('Nepodařilo se uložit snapshot na server');
            }
            
        } catch (error) {
            console.error(`❌ Chyba při vytváření snapshotu pro ${dateString}:`, error);
            throw error;
        }
    }

    // Načíst uživatelská data ze serveru
    async loadUsersFromServer() {
        try {
            const response = await fetch(this.serverApiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.users)) {
                    return data.users.filter(user => 
                        user.role && user.role.toLowerCase() === 'prodejce' && user.customId
                    );
                }
            }
            
            console.warn('⚠️ Nepodařilo se načíst uživatele ze serveru');
            return [];
        } catch (error) {
            console.error('❌ Chyba při načítání uživatelů ze serveru:', error);
            return [];
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

    // Zpracovat raw data pro snapshot - extrahovat rozšířené informace pro analýzy
    processRawDataForSnapshot(rawData, usersData = []) {
        if (!rawData || rawData.length < 2) {
            return { 
                sellers: [], 
                totalPoints: 0, 
                totalItems: 0,
                topSeller: null, 
                bottomSeller: null,
                categories: {},
                analytics: {},
                dailyStats: {}
            };
        }

        const headers = rawData[0];
        const dataRows = rawData.slice(1).filter(row => 
            row && row.some(cell => String(cell || '').trim())
        );

        // Najít indexy všech sloupců pro rozšířené analýzy
        const columnIndexes = this.findColumnIndexes(headers);
        
        console.log('📊 Nalezené sloupce pro analýzu:', columnIndexes);

        // Vytvořit mapování ID prodejce -> uživatelská data
        const usersMap = {};
        usersData.forEach(user => {
            if (user.customId) {
                usersMap[String(user.customId)] = user;
            }
        });

        const sellers = [];
        let totalPoints = 0;
        let totalItems = 0;
        const categories = {};

        dataRows.forEach(row => {
            const sellerId = String(row[columnIndexes.idProdejce] || '').trim();
            const prodejce = row[columnIndexes.prodejce] || 'Neznámý';
            const prodejna = row[columnIndexes.prodejna] || 'Nespecifikována';
            const polozky = parseInt(row[columnIndexes.polozkyNad100]) || 0;
            
            // Najít user data pro dodatečné informace
            const userData = usersMap[sellerId] || {};
            const fullName = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || prodejce;
            
            // Vypočítat detailní bodování
            const pointsBreakdown = this.calculateDetailedPoints(row, columnIndexes);
            totalPoints += pointsBreakdown.total;
            totalItems += polozky;

            // Kategorizovat podle výkonnosti
            const performanceCategory = this.categorizePerformance(pointsBreakdown.total);
            categories[performanceCategory] = (categories[performanceCategory] || 0) + 1;

            // Uložit data prodejce
            const sellerData = {
                sellerId: sellerId,
                name: fullName,
                username: userData.username || prodejce,
                prodejna: prodejna,
                email: userData.email || null,
                
                // Základní metriky
                items: polozky,
                points: pointsBreakdown.total,
                breakdown: pointsBreakdown.breakdown,
                
                // Rozšířené metriky pro analýzy
                metrics: {
                    itemsPerPoint: pointsBreakdown.total > 0 ? (polozky / pointsBreakdown.total).toFixed(2) : 0,
                    pointsPerItem: polozky > 0 ? (pointsBreakdown.total / polozky).toFixed(2) : 0,
                    bonusPointsRatio: pointsBreakdown.total > 0 ? 
                        ((pointsBreakdown.total - pointsBreakdown.basePoints) / pointsBreakdown.total * 100).toFixed(1) : 0,
                    performanceCategory: performanceCategory
                },
                
                // Detailní produktové metriky
                products: this.extractProductMetrics(row, columnIndexes)
            };

            sellers.push(sellerData);
        });

        // Seřadit podle bodů
        sellers.sort((a, b) => b.points - a.points);
        
        const topSeller = sellers.length > 0 ? sellers[0] : null;
        const bottomSeller = sellers.length > 0 ? sellers[sellers.length - 1] : null;

        // Vytvořit rozšířené analytics objekty
        const analytics = this.createAnalyticsData(sellers, categories);
        
        // Denní statistiky
        const dailyStats = {
            date: this.getTodayDateString(),
            totalSellers: sellers.length,
            activeSellers: sellers.filter(s => s.points > 0).length,
            totalPoints: totalPoints,
            totalItems: totalItems,
            averagePoints: sellers.length > 0 ? Math.round(totalPoints / sellers.length) : 0,
            averageItems: sellers.length > 0 ? Math.round(totalItems / sellers.length) : 0,
            topPerformerPoints: topSeller?.points || 0,
            pointsDistribution: this.calculatePointsDistribution(sellers)
        };

        return {
            sellers,
            totalPoints,
            totalItems,
            topSeller,
            bottomSeller,
            categories,
            analytics,
            dailyStats
        };
    }

    // Najít indexy všech důležitých sloupců
    findColumnIndexes(headers) {
        return {
            idProdejce: headers.findIndex(h => h && h.toLowerCase().includes('id_prodejce')),
            prodejce: headers.findIndex(h => h && h.toLowerCase().includes('prodejce')),
            prodejna: headers.findIndex(h => h && h.toLowerCase().includes('prodejna')),
            polozkyNad100: headers.findIndex(h => h && h.toLowerCase().includes('polozky_nad_100')),
            sluzby: headers.findIndex(h => h && h.toLowerCase().includes('sluzby')),
            
            // Bonusové produkty
            ct600: headers.findIndex(h => h && h.toLowerCase() === 'ct600'),
            ct1200: headers.findIndex(h => h && h.toLowerCase() === 'ct1200'),
            nap: headers.findIndex(h => h && h.toLowerCase() === 'nap'),
            akt: headers.findIndex(h => h && h.toLowerCase() === 'akt'),
            pz1: headers.findIndex(h => h && h.toLowerCase() === 'pz1'),
            zah250: headers.findIndex(h => h && h.toLowerCase() === 'zah250'),
            zah500: headers.findIndex(h => h && h.toLowerCase() === 'zah500'),
            kop250: headers.findIndex(h => h && h.toLowerCase() === 'kop250'),
            kop500: headers.findIndex(h => h && h.toLowerCase() === 'kop500')
        };
    }

    // Vypočítat detailní bodování
    calculateDetailedPoints(row, indexes) {
        const pointsRules = {
            basePoints: 15, CT600: 35, CT1200: 85, NAP: 35, AKT: 15,
            PZ1: 85, ZAH250: 15, ZAH500: 35, KOP250: 15, KOP500: 35
        };

        const polozky = parseInt(row[indexes.polozkyNad100]) || 0;
        const basePoints = polozky * pointsRules.basePoints;
        
        const breakdown = { 'Základní body': basePoints };
        let total = basePoints;

        // Bonusové body
        const bonusProducts = ['CT600', 'CT1200', 'NAP', 'AKT', 'PZ1', 'ZAH250', 'ZAH500', 'KOP250', 'KOP500'];
        bonusProducts.forEach(product => {
            const index = indexes[product.toLowerCase()];
            if (index >= 0) {
                const count = parseInt(row[index]) || 0;
                const points = count * pointsRules[product];
                if (points > 0) {
                    breakdown[product] = points;
                    total += points;
                }
            }
        });

        return { total, basePoints, breakdown };
    }

    // Kategorizovat výkonnost
    categorizePerformance(points) {
        if (points >= 500) return 'excellent';
        if (points >= 300) return 'good';
        if (points >= 150) return 'average';
        if (points >= 50) return 'below_average';
        return 'poor';
    }

    // Extrahovat metriky produktů
    extractProductMetrics(row, indexes) {
        const products = {};
        const productIndexes = ['ct600', 'ct1200', 'nap', 'akt', 'pz1', 'zah250', 'zah500', 'kop250', 'kop500'];
        
        productIndexes.forEach(product => {
            const index = indexes[product];
            if (index >= 0) {
                const count = parseInt(row[index]) || 0;
                if (count > 0) {
                    products[product.toUpperCase()] = count;
                }
            }
        });
        
        return products;
    }

    // Vytvořit analytics data
    createAnalyticsData(sellers, categories) {
        return {
            byCategory: {
                performance: categories,
                topPerformers: sellers.slice(0, 5).map(s => ({ name: s.name, points: s.points })),
                productLeaders: this.findProductLeaders(sellers)
            },
            bySeller: sellers.reduce((acc, seller) => {
                acc[seller.sellerId] = {
                    points: seller.points,
                    rank: sellers.findIndex(s => s.sellerId === seller.sellerId) + 1,
                    percentile: Math.round((1 - (sellers.findIndex(s => s.sellerId === seller.sellerId) / sellers.length)) * 100)
                };
                return acc;
            }, {}),
            trends: {
                // Připraveno pro budoucí porovnání s předchozími dny
                dailyChange: null,
                weeklyTrend: null,
                monthlyTrend: null
            }
        };
    }

    // Najít leadery v jednotlivých produktech
    findProductLeaders(sellers) {
        const productLeaders = {};
        const products = ['CT600', 'CT1200', 'NAP', 'AKT', 'PZ1', 'ZAH250', 'ZAH500', 'KOP250', 'KOP500'];
        
        products.forEach(product => {
            const leader = sellers
                .filter(s => s.products[product] > 0)
                .sort((a, b) => b.products[product] - a.products[product])[0];
                
            if (leader) {
                productLeaders[product] = {
                    name: leader.name,
                    count: leader.products[product],
                    sellerId: leader.sellerId
                };
            }
        });
        
        return productLeaders;
    }

    // Vypočítat distribuci bodů
    calculatePointsDistribution(sellers) {
        const ranges = [
            { min: 0, max: 49, label: '0-49' },
            { min: 50, max: 149, label: '50-149' },
            { min: 150, max: 299, label: '150-299' },
            { min: 300, max: 499, label: '300-499' },
            { min: 500, max: Infinity, label: '500+' }
        ];

        const distribution = {};
        ranges.forEach(range => {
            distribution[range.label] = sellers.filter(s => 
                s.points >= range.min && s.points <= range.max
            ).length;
        });

        return distribution;
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
    // Vytvořit testovací snapshot pro dnes (pouze administrátoři)
    createTodaySnapshot: async () => {
        try {
            if (!window.historyManager.isCurrentUserAdmin()) {
                console.error('❌ Manuální vytváření snapshotů je povoleno pouze administrátorům');
                return false;
            }
            const result = await window.historyManager.createDailySnapshot(null, true);
            console.log('✅ Snapshot úspěšně vytvořen:', result);
            return result;
        } catch (error) {
            console.error('❌ Chyba při vytváření snapshotu:', error);
            return false;
        }
    },
    
    // Vytvořit testovací snapshot pro včerejšek (pouze administrátoři)
    createYesterdaySnapshot: async () => {
        try {
            if (!window.historyManager.isCurrentUserAdmin()) {
                console.error('❌ Manuální vytváření snapshotů je povoleno pouze administrátorům');
                return false;
            }
            const result = await window.historyManager.createYesterdaySnapshot();
            console.log('✅ Včerejší snapshot úspěšně vytvořen:', result);
            return result;
        } catch (error) {
            console.error('❌ Chyba při vytváření včerejšího snapshotu:', error);
            return false;
        }
    },
    
    // Zobrazit všechna historická data
    showHistory: async () => {
        try {
            const history = await window.historyManager.getHistoryData();
            console.log('📚 Historie (celkem ' + Object.keys(history).length + ' dní):');
            console.table(Object.keys(history).map(date => ({
                date: date,
                sellers: history[date].metadata?.totalSellers || 0,
                points: history[date].metadata?.totalPoints || 0,
                topSeller: history[date].metadata?.topSeller?.name || 'N/A',
                version: history[date].version || '1.0',
                method: history[date].metadata?.captureMethod || 'unknown'
            })));
            return history;
        } catch (error) {
            console.error('❌ Chyba při načítání historie:', error);
            return {};
        }
    },
    
    // Zobrazit rozšířené statistiky
    showStats: async () => {
        try {
            const stats = await window.historyManager.getHistoryStats();
            console.log('📊 Statistiky historie:', stats);
            
            const history = await window.historyManager.getHistoryData();
            const dates = Object.keys(history).sort();
            
            if (dates.length > 0) {
                const latestSnapshot = history[dates[dates.length - 1]];
                console.log('📈 Nejnovější snapshot:', {
                    date: latestSnapshot.date,
                    version: latestSnapshot.version,
                    sellers: latestSnapshot.metadata?.totalSellers,
                    points: latestSnapshot.metadata?.totalPoints,
                    captureMethod: latestSnapshot.metadata?.captureMethod
                });
            }
            
            return stats;
        } catch (error) {
            console.error('❌ Chyba při načítání statistik:', error);
            return {};
        }
    },
    
    // Export historie (pouze administrátoři)
    exportHistory: () => {
        if (!window.historyManager.isCurrentUserAdmin()) {
            console.error('❌ Export historie je povolen pouze administrátorům');
            return false;
        }
        return window.historyManager.exportHistory();
    },
    
    // Vymazat historii (pouze administrátoři - POZOR!)
    clearHistory: () => {
        if (!window.historyManager.isCurrentUserAdmin()) {
            console.error('❌ Mazání historie je povoleno pouze administrátorům');
            return false;
        }
        return window.historyManager.clearAllHistory();
    },
    
    // Zobrazit informace o současném uživateli
    showCurrentUser: () => {
        const user = window.historyManager.getCurrentUser();
        const isAdmin = window.historyManager.isCurrentUserAdmin();
        console.log('👤 Aktuální uživatel:', {
            username: user?.username || 'neznámý',
            fullName: user?.fullName || 'neuvedeno',
            role: user?.role || 'neuvedeno',
            isAdmin: isAdmin,
            permissions: {
                createSnapshot: isAdmin,
                exportHistory: isAdmin,
                clearHistory: isAdmin,
                viewHistory: true
            }
        });
        return { user, isAdmin };
    },
    
    // Zobrazit strukturu nejnovějšího snapshotu
    showLatestSnapshotStructure: async () => {
        try {
            const history = await window.historyManager.getHistoryData();
            const dates = Object.keys(history).sort();
            
            if (dates.length === 0) {
                console.log('📂 Žádná historická data');
                return null;
            }
            
            const latest = history[dates[dates.length - 1]];
            console.log('🔍 Struktura nejnovějšího snapshotu:');
            console.log('📅 Datum:', latest.date);
            console.log('📊 Metadata:', latest.metadata);
            console.log('📈 Analytics:', latest.analytics);
            console.log('👥 Prodejci (první 3):', latest.processed?.sellers?.slice(0, 3));
            
            return latest;
        } catch (error) {
            console.error('❌ Chyba při analýze struktury:', error);
            return null;
        }
    }
}; 