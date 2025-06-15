// Sdílená utility třída pro výpočet pozice prodejce v žebříčku
// Používají ji user-profile-data-loader.js i leaderboards-data-loader.js
class LeaderboardPositionCalculator {
    constructor() {
        // Stejná konfigurace jako v leaderboards-data-loader.js
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.monthlyGid = '1829845095'; // list "od 1" pro měsíční data
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbyGPiyfiPMn1yvZFoYuiFwFiCXJ7u3vBLlmiEqXLXSuzuDvDCcKqm6uUyDIRbcH4Ftk5g/exec';
        
        // Bodovací pravidla - STEJNÁ jako v leaderboards-data-loader.js
        this.pointsRules = {
            basePoints: 15,      // Za každou položku nad 100 korun
            CT600: 35,           // Navíc za CT600
            CT1200: 85,          // Navíc za CT1200
            NAP: 35,             // Navíc za NAP
            AKT: 15,             // Navíc za AKT
            PZ1: 85,             // Navíc za PZ1
            ZAH250: 15,          // Navíc za ZAH250
            ZAH500: 35,          // Navíc za ZAH500
            KOP250: 15,          // Navíc za KOP250
            KOP500: 35           // Navíc za KOP500
        };
        
        this.cachedLeaderboard = null;
        this.cacheTimestamp = null;
        this.cacheValidityMs = 5 * 60 * 1000; // Cache platná 5 minut
        
        console.log('🏆 LeaderboardPositionCalculator inicializován');
    }

    // Hlavní metoda pro získání pozice prodejce v žebříčku
    async getUserPosition(sellerId, useCache = true) {
        console.log(`🔍 Hledám pozici prodejce ID: ${sellerId}`);
        
        try {
            // Zkontrolovat cache
            if (useCache && this.isCacheValid()) {
                console.log('📦 Používám cached žebříček');
                return this.findUserInLeaderboard(sellerId, this.cachedLeaderboard);
            }
            
            // Načíst aktuální žebříček
            console.log('🔄 Načítám aktuální žebříček pro pozici...');
            const leaderboard = await this.loadCurrentLeaderboard();
            
            // Uložit do cache
            this.cachedLeaderboard = leaderboard;
            this.cacheTimestamp = Date.now();
            
            return this.findUserInLeaderboard(sellerId, leaderboard);
            
        } catch (error) {
            console.error('❌ Chyba při získávání pozice v žebříčku:', error);
            return {
                position: '?',
                totalPlayers: '?',
                userPoints: 0,
                error: error.message
            };
        }
    }

    // Zkontrolovat platnost cache
    isCacheValid() {
        if (!this.cachedLeaderboard || !this.cacheTimestamp) {
            return false;
        }
        
        const now = Date.now();
        const isValid = (now - this.cacheTimestamp) < this.cacheValidityMs;
        
        if (!isValid) {
            console.log('⏰ Cache vypršela, bude obnovena');
        }
        
        return isValid;
    }

    // Najít uživatele v žebříčku a vrátit jeho pozici
    findUserInLeaderboard(sellerId, leaderboard) {
        const sellerIdStr = String(sellerId);
        
        // Najít uživatele v seřazeném žebříčku
        const userIndex = leaderboard.findIndex(seller => 
            String(seller.sellerId) === sellerIdStr
        );
        
        if (userIndex === -1) {
            console.log(`⚠️ Prodejce ID ${sellerId} nenalezen v žebříčku`);
            return {
                position: '?',
                totalPlayers: leaderboard.length,
                userPoints: 0,
                found: false
            };
        }
        
        const position = userIndex + 1; // Pozice = index + 1
        const userEntry = leaderboard[userIndex];
        
        console.log(`✅ Prodejce nalezen: ${userEntry.name}, pozice ${position}/${leaderboard.length}, ${userEntry.points} bodů`);
        
        return {
            position: position,
            totalPlayers: leaderboard.length,
            userPoints: userEntry.points,
            userEntry: userEntry,
            found: true
        };
    }

    // Načíst aktuální žebříček - použije stejnou logiku jako leaderboards-data-loader.js
    async loadCurrentLeaderboard() {
        console.log('=== NAČÍTÁNÍ ŽEBŘÍČKU PRO POZICI ===');
        
        // 1. Načíst uživatelská data ze serveru
        const usersData = await this.loadUsersFromServer();
        
        // 2. Načíst prodejní data z Google Sheets  
        const salesData = await this.loadSalesDataFromServer();
        
        // 3. Spočítat body pro každého prodejce
        const leaderboard = this.calculateLeaderboard(usersData, salesData);
        
        console.log(`🏆 Žebříček načten: ${leaderboard.length} prodejců`);
        
        return leaderboard;
    }

    // Načíst uživatele ze serveru - stejná logika jako v leaderboards-data-loader.js
    async loadUsersFromServer() {
        try {
            console.log('🌐 Načítám uživatele ze serveru...');
            const response = await fetch('/api/users-github', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && Array.isArray(data.users)) {
                // Filtrovat pouze prodejce
                const sellers = data.users.filter(user => 
                    user.role && 
                    user.role.toLowerCase() === 'prodejce' && 
                    user.customId
                );
                
                console.log(`👥 Načteno ${sellers.length} prodejců`);
                
                // Vytvořit mapping ID -> uživatelská data
                const usersData = {};
                sellers.forEach(user => {
                    const sellerId = String(user.customId);
                    
                    let displayName = user.fullName;
                    if (!displayName || displayName.trim() === '') {
                        if (user.firstName && user.lastName) {
                            displayName = `${user.firstName} ${user.lastName}`.trim();
                        } else if (user.firstName) {
                            displayName = user.firstName;
                        } else {
                            displayName = user.username;
                        }
                    }
                    
                    usersData[sellerId] = {
                        id: user.id,
                        username: user.username,
                        fullName: displayName,
                        email: user.email,
                        phone: user.phone,
                        prodejna: user.prodejna,
                        role: user.role,
                        sellerId: sellerId
                    };
                });
                
                return usersData;
                
            } else {
                throw new Error('Neplatná odpověď ze serveru pro uživatelská data');
            }
            
        } catch (error) {
            console.error('❌ Chyba při načítání uživatelů:', error);
            throw error;
        }
    }

    // Načíst prodejní data z Google Sheets - stejná logika jako v leaderboards-data-loader.js
    async loadSalesDataFromServer() {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const callbackName = `positionCallback_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Vytvoř globální callback funkci
            window[callbackName] = (data) => {
                try {
                    console.log('JSONP callback pro pozici zavolán');
                    
                    if (data && data.data && Array.isArray(data.data)) {
                        const csvData = this.convertJsonToCsv(data.data);
                        resolve(csvData);
                    } else {
                        reject(new Error('Neplatná struktura dat'));
                    }
                    
                    // Vyčisti callback
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.head.removeChild(script);
                    }
                    
                } catch (error) {
                    console.error('Chyba v JSONP callback pro pozici:', error);
                    reject(error);
                }
            };
            
            // Vytvoř script tag
            const script = document.createElement('script');
            const scriptSrc = `${this.scriptUrl}?gid=${this.monthlyGid}&callback=${callbackName}&_=${timestamp}`;
            script.src = scriptSrc;
            
            script.onerror = () => {
                delete window[callbackName];
                if (script.parentNode) {
                    document.head.removeChild(script);
                }
                reject(new Error('JSONP request failed'));
            };
            
            // Timeout po 10 sekundách
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.head.removeChild(script);
                    }
                    reject(new Error('JSONP request timeout'));
                }
            }, 10000);
            
            document.head.appendChild(script);
        });
    }

    // Převést JSON data na CSV - stejná logika jako v leaderboards-data-loader.js  
    convertJsonToCsv(jsonData) {
        if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
            return '';
        }
        
        const headers = jsonData[0];
        let csvLines = [headers.map(h => String(h || '')).join(',')];
        
        for (let i = 1; i < jsonData.length; i++) {
            if (Array.isArray(jsonData[i])) {
                const row = jsonData[i].map(cell => {
                    if (cell === null || cell === undefined) {
                        return '';
                    }
                    return String(cell);
                });
                csvLines.push(row.join(','));
            }
        }
        
        return csvLines.join('\n');
    }

    // Spočítat žebříček - stejná logika jako v leaderboards-data-loader.js
    calculateLeaderboard(usersData, csvData) {
        console.log('=== VÝPOČET ŽEBŘÍČKU PRO POZICI ===');
        
        const lines = csvData.split('\n').filter(line => String(line || '').trim());
        
        if (lines.length === 0) {
            throw new Error('Žádná data v tabulce');
        }

        // Najít řádek s headers
        let headerRowIndex = 0;
        let headers = [];
        
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const testHeaders = this.parseCSVLine(lines[i]);
            if (testHeaders.includes('prodejna') || testHeaders.includes('prodejce')) {
                headers = testHeaders;
                headerRowIndex = i;
                break;
            }
        }
        
        // Najít index sloupce "id_prodejce"
        const idProdejceIndex = headers.findIndex(h => 
            h && h.toLowerCase().includes('id_prodejce')
        );
        
        if (idProdejceIndex === -1) {
            throw new Error('Sloupec "id_prodejce" nenalezen');
        }

        // Získej všechny řádky dat
        const allRows = lines.slice(headerRowIndex + 1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row && row.some(cell => {
                const cellStr = String(cell || '').trim();
                return cellStr && cellStr.length > 0;
            }));

        // Spočítat body pro každého prodejce
        const leaderboard = [];
        
        Object.keys(usersData).forEach(sellerId => {
            const userData = usersData[sellerId];
            
            // Najít řádky pro tohoto prodejce
            const userRows = allRows.filter(row => {
                const rowSellerId = String(row[idProdejceIndex] || '').trim();
                return rowSellerId === String(sellerId).trim();
            });
            
            if (userRows.length > 0) {
                // Spočítat body
                const points = this.calculateUserPoints(userRows, headers);
                
                leaderboard.push({
                    sellerId: sellerId,
                    name: userData.fullName,
                    username: userData.username,
                    prodejna: userData.prodejna || 'Nespecifikována',
                    points: points.totalPoints,
                    breakdown: points.breakdown,
                    itemsCount: points.totalItems
                });
            } else {
                // Prodejce bez dat - 0 bodů
                leaderboard.push({
                    sellerId: sellerId,
                    name: userData.fullName,
                    username: userData.username,
                    prodejna: userData.prodejna || 'Nespecifikována',
                    points: 0,
                    breakdown: {},
                    itemsCount: 0
                });
            }
        });

        // Seřadit podle bodů (nejvíc na začátek)
        leaderboard.sort((a, b) => b.points - a.points);
        
        return leaderboard;
    }

    // Parsovat CSV řádek - stejná logika jako v ostatních souborech
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    // Spočítat body prodejce - stejná logika jako v leaderboards-data-loader.js
    calculateUserPoints(rows, headers) {
        // Najít indexy sloupců
        const polozkyIndex = headers.findIndex(h => h.toLowerCase().includes('polozky_nad_100'));
        const ct600Index = headers.findIndex(h => h.toLowerCase() === 'ct600');
        const ct1200Index = headers.findIndex(h => h.toLowerCase() === 'ct1200');
        const napIndex = headers.findIndex(h => h.toLowerCase() === 'nap');
        const aktIndex = headers.findIndex(h => h.toLowerCase() === 'akt');
        const pz1Index = headers.findIndex(h => h.toLowerCase() === 'pz1');
        const zah250Index = headers.findIndex(h => h.toLowerCase() === 'zah250');
        const zah500Index = headers.findIndex(h => h.toLowerCase() === 'zah500');
        const kop250Index = headers.findIndex(h => h.toLowerCase() === 'kop250');
        const kop500Index = headers.findIndex(h => h.toLowerCase() === 'kop500');

        let totalPoints = 0;
        let totalItems = 0;
        let breakdown = {};

        rows.forEach(row => {
            // Základní body za položky nad 100 Kč
            const polozkyCount = parseInt(row[polozkyIndex]) || 0;
            const basePoints = polozkyCount * this.pointsRules.basePoints;
            totalPoints += basePoints;
            totalItems += polozkyCount;
            
            if (basePoints > 0) {
                breakdown['Základní body'] = (breakdown['Základní body'] || 0) + basePoints;
            }

            // Bonusové body za specifické produkty
            const bonuses = [
                { name: 'CT600', index: ct600Index, points: this.pointsRules.CT600 },
                { name: 'CT1200', index: ct1200Index, points: this.pointsRules.CT1200 },
                { name: 'NAP', index: napIndex, points: this.pointsRules.NAP },
                { name: 'AKT', index: aktIndex, points: this.pointsRules.AKT },
                { name: 'PZ1', index: pz1Index, points: this.pointsRules.PZ1 },
                { name: 'ZAH250', index: zah250Index, points: this.pointsRules.ZAH250 },
                { name: 'ZAH500', index: zah500Index, points: this.pointsRules.ZAH500 },
                { name: 'KOP250', index: kop250Index, points: this.pointsRules.KOP250 },
                { name: 'KOP500', index: kop500Index, points: this.pointsRules.KOP500 }
            ];

            bonuses.forEach(bonus => {
                if (bonus.index >= 0) {
                    const count = parseInt(row[bonus.index]) || 0;
                    const bonusPoints = count * bonus.points;
                    if (bonusPoints > 0) {
                        totalPoints += bonusPoints;
                        breakdown[bonus.name] = (breakdown[bonus.name] || 0) + bonusPoints;
                    }
                }
            });
        });

        return {
            totalPoints,
            totalItems,
            breakdown
        };
    }

    // Vymazat cache (pro ruční refresh)
    clearCache() {
        this.cachedLeaderboard = null;
        this.cacheTimestamp = null;
        console.log('🗑️ Cache žebříčku vymazán');
    }

    // Zjistit průměr položek na účtenku (POL_DOK) pro uživatele
    async getUserAverageItemsPerReceipt(sellerId) {
        console.log(`📊 Hledám průměr položek na účtenku pro prodejce ID: ${sellerId}`);
        
        try {
            // Načíst měsíční data (kde je sloupec POL_DOK)
            const csvData = await this.loadSalesDataFromServer();
            
            const lines = csvData.split('\n').filter(line => String(line || '').trim());
            
            if (lines.length === 0) {
                return { current: 0, monthly: 0 };
            }

            // Najít headers
            let headers = [];
            for (let i = 0; i < Math.min(5, lines.length); i++) {
                const testHeaders = this.parseCSVLine(lines[i]);
                if (testHeaders.includes('prodejna') || testHeaders.includes('prodejce')) {
                    headers = testHeaders;
                    break;
                }
            }

            // Najít indexy sloupců
            const idProdejceIndex = headers.findIndex(h => 
                h && h.toLowerCase().includes('id_prodejce')
            );
            const polDokIndex = headers.findIndex(h => 
                h && h.toLowerCase().includes('pol_dok')
            );

            if (idProdejceIndex === -1 || polDokIndex === -1) {
                console.log('⚠️ Sloupce id_prodejce nebo POL_DOK nenalezeny');
                return { current: 0, monthly: 0 };
            }

            // Najít řádky pro tohoto prodejce
            const allRows = lines.slice(1)
                .map(line => this.parseCSVLine(line))
                .filter(row => row && row.some(cell => String(cell || '').trim()));

            const userRows = allRows.filter(row => {
                const rowSellerId = String(row[idProdejceIndex] || '').trim();
                return rowSellerId === String(sellerId).trim();
            });

            if (userRows.length === 0) {
                console.log('⚠️ Žádná data pro tohoto prodejce');
                return { current: 0, monthly: 0 };
            }

            // Získej hodnotu POL_DOK (průměr položek na účtenku)
            const polDokValue = parseFloat(userRows[0][polDokIndex]) || 0;
            
            console.log(`📊 Průměr položek na účtenku: ${polDokValue}`);
            
            return {
                current: polDokValue,
                monthly: polDokValue // Pro měsíční data je to stejná hodnota
            };

        } catch (error) {
            console.error('❌ Chyba při získávání průměru položek:', error);
            return { current: 0, monthly: 0 };
        }
    }
}

// Export pro globální použití
window.LeaderboardPositionCalculator = LeaderboardPositionCalculator;

// Vytvořit globální instanci
window.positionCalculator = new LeaderboardPositionCalculator();

console.log('🏆 LeaderboardPositionCalculator načten a ready'); 