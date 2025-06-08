// Specializovaný data loader pro uživatelské profily s filtrováním podle ID prodejce
class UserProfileDataLoader {
    constructor(containerId, tabType = 'current') {
        this.container = document.getElementById(containerId);
        this.tabType = tabType;
        this.isMonthly = tabType === 'monthly';
        
        // ID přihlášeného uživatele - získáme z localStorage
        this.userSellerId = this.getCurrentUserSellerId();
        
        // Google Sheets ID a gid pro hlavní list
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.mainGid = '0'; // aktuální list "statistiky aktual"
        this.monthlyGid = '1829845095'; // měsíční list "od 1"
        
        // Google Apps Script URL - stejný jako v prodejnách
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbyrD0f_pWkPIaowVclG3zdzgfceYGjyqWin5-2jKKwadFb1e3itg6OMoeZdRxfX0Qk4xg/exec';
        
        this.refreshInterval = null;
        
        // Automaticky načte data po vytvoření instance
        setTimeout(() => {
            this.loadData(this.isMonthly);
        }, 100);
    }

    getCurrentUserSellerId() {
        // Získá ID prodejce z localStorage nebo jiného uložiště
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        return userData.sellerId || localStorage.getItem('sellerId') || '1'; // fallback na ID 1
    }

    async loadData(isMonthly = false) {
        console.log('=== NAČÍTÁNÍ DAT PROFILU UŽIVATELE ===');
        console.log('ID prodejce:', this.userSellerId);
        console.log('Je měsíční:', isMonthly);
        
        this.isMonthly = isMonthly;
        
        try {
            this.showLoading();
            
            // Použij Google Apps Script endpoint pro načítání dat
            const gid = isMonthly ? this.monthlyGid : this.mainGid;
            await this.loadFromGoogleScript(gid, isMonthly);
            return;
        } catch (error) {
            console.error('Chyba při načítání dat profilu:', error);
            this.showError(error);
        }
    }

    async loadFromGoogleScript(gid, isMonthly) {
        console.log('=== NAČÍTÁNÍ Z GOOGLE APPS SCRIPT PRO PROFIL ===');
        console.log('GID:', gid, 'Je měsíční:', isMonthly, 'ID prodejce:', this.userSellerId);
        
        try {
            console.log('🔄 Používám JSONP metodu pro načítání dat profilu...');
            await this.loadWithJsonp(gid, isMonthly);
            return;
            
        } catch (error) {
            console.error('❌ JSONP metoda selhala pro profil:', error);
            console.log('🔄 Používám fallback mock data pro profil...');
            this.showMockData(isMonthly);
        }
    }

    async loadWithJsonp(gid, isMonthly) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const callbackName = `profileCallback_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Vytvoř globální callback funkci
            window[callbackName] = (data) => {
                try {
                    console.log('JSONP callback zavolán pro profil:', data);
                    
                    if (data && data.data && Array.isArray(data.data)) {
                        const csvData = this.convertJsonToCsv(data.data);
                        console.log('CSV data pro profil převedena, délka:', csvData.length);
                        this.parseAndDisplayData(csvData, isMonthly);
                        resolve();
                    } else {
                        console.error('Neplatná struktura dat pro profil:', data);
                        reject(new Error('Neplatná struktura dat'));
                    }
                    
                    // Vyčisti callback
                    delete window[callbackName];
                    document.head.removeChild(script);
                    
                } catch (error) {
                    console.error('Chyba v JSONP callback pro profil:', error);
                    reject(error);
                }
            };
            
            // Vytvoř script tag
            const script = document.createElement('script');
            script.src = `${this.scriptUrl}?gid=${gid}&callback=${callbackName}&_=${timestamp}`;
            script.onerror = () => {
                delete window[callbackName];
                document.head.removeChild(script);
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

    convertJsonToCsv(jsonData) {
        if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
            return '';
        }
        
        // První řádek obsahuje hlavičky
        const headers = jsonData[0];
        let csvLines = [headers.map(h => String(h || '')).join(',')];
        
        // Přidej datové řádky - převeď všechny hodnoty na stringy
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

    parseAndDisplayData(csvData, isMonthly) {
        console.log('=== PARSOVÁNÍ DAT PROFILU UŽIVATELE ===');
        console.log('Délka CSV dat:', csvData.length);
        console.log('ID prodejce:', this.userSellerId);
        
        const lines = csvData.split('\n').filter(line => String(line || '').trim());
        console.log('Počet řádků po filtrování:', lines.length);
        
        if (lines.length === 0) {
            console.log('Žádné řádky v CSV, zobrazujem mock data');
            this.showMockData(isMonthly);
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
        
        // Najdi index sloupce ID prodejce (sloupec C = index 2)
        const sellerIdColumnIndex = 2; // podle specifikace je ve sloupci C
        
        const rows = lines.slice(headerRowIndex + 1)
            .map(line => this.parseCSVLine(line))
            .filter(row => {
                if (!row || !row.some(cell => String(cell || '').trim())) {
                    return false; // Odfiltrovat prázdné řádky
                }
                
                // Filtrovat podle ID prodejce
                const rowSellerId = String(row[sellerIdColumnIndex] || '').trim();
                const matches = rowSellerId === String(this.userSellerId);
                
                if (matches) {
                    console.log('Nalezen řádek pro prodejce:', this.userSellerId, row);
                }
                
                return matches;
            });

        console.log(`Po filtrování podle ID prodejce (${this.userSellerId}): ${rows.length} řádků`);
        
        if (rows.length === 0) {
            console.log('Žádné řádky pro tohoto prodejce, zobrazujem prázdný stav');
            this.showEmptyState(isMonthly);
            return;
        }

        // Seřadit podle sloupce polozky_nad_100 (pro aktuální) nebo položky (pro měsíční)
        const sortColumnIndex = isMonthly ? 1 : 2; // měsíční: položky v indexu 1, aktuální: položky v indexu 2
        const sortedRows = this.sortRowsByColumn(rows, sortColumnIndex);

        // Aktualizovat hlavní metriky
        this.updateMainMetrics(sortedRows, isMonthly);

        // Aktualizovat dodatečné statistiky
        this.updateAdditionalStats(sortedRows, isMonthly);

        this.displayUserProfile(headers, sortedRows, isMonthly);
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

    sortRowsByColumn(rows, columnIndex) {
        return rows.sort((a, b) => {
            const valueA = parseInt(a[columnIndex]) || 0;
            const valueB = parseInt(b[columnIndex]) || 0;
            return valueB - valueA;
        });
    }

    updateMainMetrics(rows, isMonthly) {
        // Hlavní metriky - celkové hodnoty pro uživatele
        let totalItems = 0;
        let totalServices = 0;

        rows.forEach(row => {
            if (isMonthly) {
                totalItems += parseInt(row[1]) || 0; // měsíční: položky v indexu 1
                totalServices += parseInt(row[2]) || 0; // měsíční: služby v indexu 2
            } else {
                totalItems += parseInt(row[2]) || 0; // aktuální: položky v indexu 2
                totalServices += parseInt(row[3]) || 0; // aktuální: služby v indexu 3
            }
        });

        // Aktualizovat UI pouze pro hlavní metriky (zobrazují se vždy)
        document.getElementById('totalItemsSold').textContent = totalItems;
        document.getElementById('totalServicesSold').textContent = totalServices;
    }

    updateAdditionalStats(rows, isMonthly) {
        // Dodatečné statistiky pro konkrétní tab
        let aligatorSales = 0;
        let totalSales = 0;

        rows.forEach(row => {
            if (isMonthly) {
                totalSales += parseInt(row[1]) || 0; // měsíční: položky
                // Pro ALIGATOR telefony - pokud je speciální sloupec
                if (row.length > 4) {
                    aligatorSales += parseInt(row[4]) || 0;
                }
            } else {
                totalSales += parseInt(row[2]) || 0; // aktuální: položky 
                // Pro ALIGATOR telefony - pokud je speciální sloupec
                if (row.length > 5) {
                    aligatorSales += parseInt(row[5]) || 0;
                }
            }
        });

        // Aktualizovat pouze příslušné elementy pro aktivní tab
        const prefix = isMonthly ? 'monthly' : 'current';
        const aligatorElement = document.getElementById(`${prefix}AligatorSales`);
        const totalElement = document.getElementById(`${prefix}TotalSales`);
        const rankingElement = document.getElementById(`${prefix}Ranking`);

        if (aligatorElement) aligatorElement.textContent = aligatorSales;
        if (totalElement) totalElement.textContent = totalSales;
        if (rankingElement) rankingElement.textContent = '-'; // Bude vypočítáno později s dalšími daty
    }

    displayUserProfile(headers, rows, isMonthly) {
        // Jednoduchý informační display pro uživatele
        const userName = rows.length > 0 ? rows[0][0] : 'Neznámý prodejce'; // předpokládá se jméno v prvním sloupci
        
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; profil_${isMonthly ? 'monthly' : 'current'}_${this.userSellerId}.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <div class="user-info">
                        <h3>📊 Vaše statistiky - ${isMonthly ? 'Aktuální měsíc' : 'Aktuální den'}</h3>
                        <p><strong>Prodejce:</strong> ${this.escapeHtml(userName)}</p>
                        <p><strong>ID prodejce:</strong> ${this.escapeHtml(this.userSellerId)}</p>
                        
                        ${rows.length > 0 ? `
                            <div class="user-stats-table">
                                <table class="retro-sales-table">
                                    <thead>
                                        <tr>
                                            ${headers.map(header => `<th>${this.escapeHtml(header)}</th>`).join('')}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rows.map((row, index) => `
                                            <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
                                                ${row.map((cell, cellIndex) => {
                                                    const isNumeric = isMonthly ? (cellIndex >= 1) : (cellIndex >= 2);
                                                    if (isNumeric && !isNaN(cell) && String(cell || '').trim() !== '') {
                                                        return `<td class="numeric" data-value="${cell}">${this.escapeHtml(cell)}</td>`;
                                                    }
                                                    return `<td>${this.escapeHtml(cell)}</td>`;
                                                }).join('')}
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : '<p>Zatím žádné prodeje pro tento period.</p>'}
                    </div>
                    
                    <div class="refresh-controls">
                        <button class="retro-refresh-btn" onclick="window.reloadUserProfileData && window.reloadUserProfileData()">
                            🔄 OBNOVIT DATA
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    showEmptyState(isMonthly) {
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; profil_${isMonthly ? 'monthly' : 'current'}_${this.userSellerId}.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <div class="empty-state">
                        <h3>📊 Vaše statistiky - ${isMonthly ? 'Aktuální měsíc' : 'Aktuální den'}</h3>
                        <p><strong>ID prodejce:</strong> ${this.escapeHtml(this.userSellerId)}</p>
                        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">📈</div>
                            <h4>Zatím žádná data</h4>
                            <p>Pro tento ${isMonthly ? 'měsíc' : 'den'} nejsou k dispozici žádné prodeje.</p>
                        </div>
                        
                        <div class="refresh-controls">
                            <button class="retro-refresh-btn" onclick="window.reloadUserProfileData && window.reloadUserProfileData()">
                                🔄 OBNOVIT DATA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Aktualizovat metriky na nulu
        this.updateMainMetrics([], isMonthly);
        this.updateAdditionalStats([], isMonthly);
    }

    async reloadData() {
        console.log('🔄 Reload dat profilu uživatele...');
        await this.loadData(this.isMonthly);
    }

    setupEventListeners() {
        // Event listenery pro interakce s profilem
        console.log('Nastavuji event listenery pro profil');
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; loading_profile_${this.userSellerId}.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <div class="loading" style="padding: 3rem; text-align: center;">
                        <div class="loading-spinner"></div>
                        <p style="margin-top: 1rem;">Načítám vaše data...</p>
                    </div>
                </div>
            </div>
        `;
    }

    showMockData(isMonthly) {
        console.log('Zobrazuji mock data pro profil');
        const mockData = isMonthly ? [
            ['Prodejce', 'Položky', 'Služby', 'ALIGATOR'],
            [localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')).firstName || 'Testovací prodejce' : 'Testovací prodejce', '15', '8', '3']
        ] : [
            ['Prodejce', 'Aktualizováno', 'Položky nad 100', 'Služby', 'Celkem', 'ALIGATOR'],
            [localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')).firstName || 'Testovací prodejce' : 'Testovací prodejce', new Date().toLocaleString('cs-CZ'), '5', '3', '8', '1']
        ];
        
        const csvData = this.convertJsonToCsv(mockData);
        this.parseAndDisplayData(csvData, isMonthly);
    }

    showError(error) {
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; error_profile_${this.userSellerId}.log_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <div style="padding: 2rem; text-align: center; color: var(--error-color, #ff3333);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                        <h3>Chyba při načítání dat</h3>
                        <p>Nepodařilo se načíst vaše prodejní data.</p>
                        <p style="font-size: 0.875rem; opacity: 0.7; margin-top: 1rem;">
                            Chyba: ${this.escapeHtml(error.message)}
                        </p>
                        <button class="retro-refresh-btn" onclick="window.reloadUserProfileData && window.reloadUserProfileData()" style="margin-top: 1rem;">
                            🔄 ZKUSIT ZNOVU
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
} 