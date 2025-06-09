// Leaderboard Data Loader - žebříček prodejců podle bodového hodnocení
class LeaderboardsDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // Google Sheets konfigurace - STEJNÁ jako user-profile-data-loader.js
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.monthlyGid = '1829845095'; // list "od 1" pro měsíční data
        
        // Google Apps Script URL
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbyGPiyfiPMn1yvZFoYuiFwFiCXJ7u3vBLlmiEqXLXSuzuDvDCcKqm6uUyDIRbcH4Ftk5g/exec';
        
        // Bodovací pravidla - STEJNÁ jako user-profile-data-loader.js
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
        
        this.leaderboardData = [];
        this.usersData = {};
        
        console.log('🏆 LeaderboardsDataLoader inicializován');
        
        // Automaticky načte data po vytvoření instance
        setTimeout(() => {
            this.loadLeaderboardData();
        }, 100);
    }

    async loadLeaderboardData() {
        console.log('=== NAČÍTÁNÍ DAT PRO ŽEBŘÍČEK ===');
        
        try {
            this.showLoading();
            
            // 1. Načíst uživatelská data ze serveru
            console.log('🔄 Načítám uživatelská data ze serveru...');
            await this.loadUsersFromServer();
            
            // 2. Načíst prodejní data z Google Sheets (vždy měsíční data)
            console.log('🔄 Načítám prodejní data z Google Sheets...');
            await this.loadSalesDataFromGoogleScript();
            
        } catch (error) {
            console.error('❌ Chyba při načítání dat pro žebříček:', error);
            this.showError(error);
        }
    }

    async loadUsersFromServer() {
        try {
            console.log('🌐 Volám server API pro všechny uživatele...');
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
                console.log(`✅ Načteno ${data.users.length} uživatelů ze serveru`);
                
                // Filtrovat pouze prodejce (ne administrátory)
                const sellers = data.users.filter(user => 
                    user.role && 
                    user.role.toLowerCase() === 'prodejce' && 
                    user.customId
                );
                
                console.log(`👥 Nalezeno ${sellers.length} prodejců (filtrováni administrátoři)`);
                
                // Vytvořit mapping ID prodejce -> uživatelská data
                this.usersData = {};
                sellers.forEach(user => {
                    const sellerId = String(user.customId);
                    this.usersData[sellerId] = {
                        id: user.id,
                        username: user.username,
                        fullName: user.fullName || user.username,
                        email: user.email,
                        phone: user.phone,
                        prodejna: user.prodejna,
                        role: user.role,
                        sellerId: sellerId
                    };
                });
                
                console.log('📊 Mapping uživatelů vytvořen:', Object.keys(this.usersData));
                
            } else {
                throw new Error('Neplatná odpověď ze serveru pro uživatelská data');
            }
            
        } catch (error) {
            console.error('❌ Chyba při načítání uživatelů ze serveru:', error);
            throw new Error(`Nepodařilo se načíst uživatelská data: ${error.message}`);
        }
    }

    async loadSalesDataFromGoogleScript() {
        console.log('=== NAČÍTÁNÍ PRODEJNÍCH DAT Z GOOGLE SHEETS ===');
        console.log('GID:', this.monthlyGid, '(list "od 1")');
        
        try {
            console.log('🔄 Používám JSONP metodu pro načtení ze serveru...');
            await this.loadWithJsonp();
            
        } catch (error) {
            console.error('❌ JSONP metoda selhala:', error);
            this.showError(error);
        }
    }

    async loadWithJsonp() {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const callbackName = `leaderboardCallback_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Vytvoř globální callback funkci
            window[callbackName] = (data) => {
                try {
                    console.log('JSONP callback zavolán pro leaderboard:', data);
                    
                    if (data && data.data && Array.isArray(data.data)) {
                        const csvData = this.convertJsonToCsv(data.data);
                        console.log('CSV data pro leaderboard převedena, délka:', csvData.length);
                        this.parseAndProcessLeaderboardData(csvData);
                        resolve();
                    } else {
                        console.error('Neplatná struktura dat pro leaderboard:', data);
                        reject(new Error('Neplatná struktura dat'));
                    }
                    
                    // Vyčisti callback
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.head.removeChild(script);
                    }
                    
                } catch (error) {
                    console.error('Chyba v JSONP callback pro leaderboard:', error);
                    reject(error);
                }
            };
            
            // Vytvoř script tag
            const script = document.createElement('script');
            const scriptSrc = `${this.scriptUrl}?gid=${this.monthlyGid}&callback=${callbackName}&_=${timestamp}`;
            script.src = scriptSrc;
            console.log(`🔗 Script URL pro měsíční data:`, scriptSrc);
            
            script.onerror = () => {
                delete window[callbackName];
                if (script.parentNode) {
                    document.head.removeChild(script);
                }
                reject(new Error('JSONP request failed'));
            };
            
            // Timeout po 15 sekundách
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.head.removeChild(script);
                    }
                    reject(new Error('JSONP request timeout'));
                }
            }, 15000);
            
            document.head.appendChild(script);
        });
    }

    convertJsonToCsv(jsonData) {
        if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
            return '';
        }
        
        // První řádek obsahuje hlavičky
        const headers = jsonData[0];
        let csvLines = [headers.map(h => String(h || '')).join(',')];
        
        // Přidej datové řádky
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

    parseAndProcessLeaderboardData(csvData) {
        console.log('=== PARSOVÁNÍ A ZPRACOVÁNÍ DAT PRO ŽEBŘÍČEK ===');
        console.log('Délka CSV dat:', csvData.length);
        
        const lines = csvData.split('\n').filter(line => String(line || '').trim());
        console.log('Počet řádků po filtrování:', lines.length);
        
        if (lines.length === 0) {
            console.log('❌ Žádné řádky v CSV datech ze serveru');
            this.showError(new Error('Tabulka ze serveru neobsahuje žádná data'));
            return;
        }

        // Najít řádek s headers
        let headerRowIndex = 0;
        let headers = [];
        
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const testHeaders = this.parseCSVLine(lines[i]);
            if (testHeaders.includes('prodejna') || testHeaders.includes('prodejce')) {
                headers = testHeaders;
                headerRowIndex = i;
                console.log('Nalezeny headers na řádku:', i, headers);
                break;
            }
        }
        
        console.log('Parsované headers:', headers);
        
        // Získej všechny řádky dat
        const allRows = lines.slice(headerRowIndex + 1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row && row.some(cell => {
                const cellStr = String(cell || '').trim();
                return cellStr && cellStr.length > 0;
            }));

        console.log(`Načteno ${allRows.length} řádků dat celkem`);
        
        // Najít index sloupce "id_prodejce"
        const idProdejceIndex = headers.findIndex(h => 
            h && h.toLowerCase().includes('id_prodejce')
        );
        
        if (idProdejceIndex === -1) {
            console.error('❌ Sloupec "id_prodejce" nenalezen v headers!');
            this.showError(new Error('Sloupec "id_prodejce" neexistuje v tabulce'));
            return;
        }

        // Zpracovat data pro každého prodejce
        this.leaderboardData = [];
        
        Object.keys(this.usersData).forEach(sellerId => {
            const userData = this.usersData[sellerId];
            
            // Najít řádky pro tohoto prodejce
            const userRows = allRows.filter(row => {
                const rowSellerId = String(row[idProdejceIndex] || '').trim();
                return rowSellerId === sellerId || parseInt(rowSellerId) === parseInt(sellerId);
            });
            
            console.log(`Prodejce ${userData.fullName} (ID: ${sellerId}): ${userRows.length} řádků`);
            
            if (userRows.length > 0) {
                // Spočítat body pro tohoto prodejce
                const points = this.calculateUserPoints(userRows, headers);
                
                this.leaderboardData.push({
                    sellerId: sellerId,
                    name: userData.fullName,
                    username: userData.username,
                    prodejna: userData.prodejna,
                    points: points.totalPoints,
                    breakdown: points.breakdown,
                    itemsCount: points.totalItems
                });
            } else {
                // Prodejce bez dat - 0 bodů
                this.leaderboardData.push({
                    sellerId: sellerId,
                    name: userData.fullName,
                    username: userData.username,
                    prodejna: userData.prodejna,
                    points: 0,
                    breakdown: {},
                    itemsCount: 0
                });
            }
        });

        // Seřadit podle bodů (nejvíc na začátek)
        this.leaderboardData.sort((a, b) => b.points - a.points);
        
        console.log('🏆 Finální žebříček:', this.leaderboardData);
        
        // Zobrazit žebříček
        this.displayLeaderboard();
    }

    calculateUserPoints(rows, headers) {
        console.log('📊 Počítám body pro uživatele, řádků:', rows.length);
        
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

        rows.forEach((row, index) => {
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

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        if (typeof line !== 'string') {
            line = String(line || '');
        }
        
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

    displayLeaderboard() {
        console.log('🎯 Zobrazuji žebříček');
        
        // Aktualizovat statistiky
        this.updateStats();
        
        // Aktualizovat top 3 podium
        this.updateTopThreePodium();
        
        // Zobrazit hlavní tabulku
        this.displayLeaderboardTable();
    }

    updateStats() {
        const activeSellers = this.leaderboardData.filter(seller => seller.points > 0).length;
        const totalPoints = this.leaderboardData.reduce((sum, seller) => sum + seller.points, 0);
        const averagePoints = activeSellers > 0 ? Math.round(totalPoints / activeSellers) : 0;
        const topPoints = this.leaderboardData.length > 0 ? this.leaderboardData[0].points : 0;

        // Aktualizovat DOM elementy
        document.getElementById('totalSellers').textContent = activeSellers;
        document.getElementById('totalPoints').textContent = totalPoints.toLocaleString();
        document.getElementById('averagePoints').textContent = averagePoints;
        document.getElementById('topPoints').textContent = topPoints;
    }

    updateTopThreePodium() {
        const podium = document.getElementById('topThreePodium');
        const top3 = this.leaderboardData.slice(0, 3);
        
        if (top3.length === 0) {
            podium.innerHTML = '<div class="empty-state"><div class="icon">🏆</div><p>Žádní prodejci s body</p></div>';
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];
        const rankLabels = ['1.', '2.', '3.'];
        
        podium.innerHTML = top3.map((seller, index) => `
            <div class="podium-place">
                <div class="podium-rank">${medals[index]}</div>
                <div class="podium-name">${this.escapeHtml(seller.name)}</div>
                <div class="podium-points">${seller.points}</div>
                <div class="podium-points-label">bodů</div>
            </div>
        `).join('');
    }

    displayLeaderboardTable() {
        if (this.leaderboardData.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">👥</div>
                    <h3>Žádní prodejci nenalezeni</h3>
                    <p>V systému nejsou žádní prodejci s daty pro aktuální měsíc.</p>
                </div>
            `;
            return;
        }

        const tableRows = this.leaderboardData.map((seller, index) => {
            const rank = index + 1;
            let rankClass = '';
            let rankIcon = '';
            
            if (rank === 1) {
                rankClass = 'gold';
                rankIcon = '🥇';
            } else if (rank === 2) {
                rankClass = 'silver';
                rankIcon = '🥈';
            } else if (rank === 3) {
                rankClass = 'bronze';
                rankIcon = '🥉';
            } else {
                rankIcon = `${rank}.`;
            }

            return `
                <tr>
                    <td class="rank-cell ${rankClass}">${rankIcon}</td>
                    <td class="name-cell">${this.escapeHtml(seller.name)}</td>
                    <td class="prodejna-cell">${this.escapeHtml(seller.prodejna || '-')}</td>
                    <td class="points-cell">${seller.points} bodů</td>
                </tr>
            `;
        }).join('');

        this.container.innerHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Pozice</th>
                        <th>Prodejce</th>
                        <th>Prodejna</th>
                        <th>Body</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="loading-animation">
                <div class="loading-spinner"></div>
                <p>Načítám data žebříčku prodejců...</p>
            </div>
        `;
    }

    showError(error) {
        console.error('Chyba v LeaderboardsDataLoader:', error);
        
        this.container.innerHTML = `
            <div class="error-state">
                <div class="icon">🚫</div>
                <h3>Chyba při načítání žebříčku</h3>
                <p>Nepodařilo se načíst data pro žebříček prodejců.</p>
                <p><strong>Chyba:</strong> ${this.escapeHtml(error.message)}</p>
                
                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1.5rem; margin: 2rem 0; text-align: left; color: #856404;">
                    <h5 style="margin-top: 0; color: #856404;">🔧 Možné příčiny:</h5>
                    <ul style="margin: 0; line-height: 1.6;">
                        <li>Google Apps Script není dostupný</li>
                        <li>Tabulka Google Sheets není dostupná</li>
                        <li>Chybí data v listu "od 1"</li>
                        <li>Server API pro uživatele nefunguje</li>
                        <li>Chybí sloupec "id_prodejce" v tabulce</li>
                    </ul>
                </div>
                
                <button class="retro-refresh-btn" onclick="window.location.reload()">
                    🔄 ZKUSIT ZNOVU
                </button>
            </div>
        `;
    }

    escapeHtml(text) {
        if (typeof text !== 'string') {
            text = String(text || '');
        }
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export pro globální použití
window.LeaderboardsDataLoader = LeaderboardsDataLoader; 