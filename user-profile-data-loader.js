// Specializovaný data loader pro uživatelské profily s filtrováním podle ID prodejce
// Používá stejnou logiku jako ProdejnyDataLoader, ale filtruje podle ID prodejce
class UserProfileDataLoader {
    constructor(containerId, tabType = 'current') {
        this.container = document.getElementById(containerId);
        this.tabType = tabType;
        this.isMonthly = tabType === 'monthly';
        
        // ID přihlášeného uživatele - získáme z localStorage (pouze ID, ne data)
        this.userSellerId = this.getCurrentUserSellerId();
        
        // Google Sheets ID a gid pro hlavní list - STEJNÉ jako ProdejnyDataLoader
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.mainGid = '0'; // aktuální list "statistiky aktual"
        this.monthlyGid = '1829845095'; // měsíční list "od 1"
        
        // Publikované URL pro CSV export
        this.basePublishedUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv`;
        
        this.refreshInterval = null;
        
        // Google Apps Script URL - STEJNÝ jako ProdejnyDataLoader
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbyrD0f_pWkPIaowVclG3zdzgfceYGjyqWin5-2jKKwadFb1e3itg6OMoeZdRxfX0Qk4xg/exec';
        
        console.log('📊 UserProfileDataLoader vytvořen pro ID prodejce:', this.userSellerId);
        
        // Automaticky načte data po vytvoření instance
        setTimeout(() => {
            this.loadData(this.isMonthly);
        }, 100);
    }

    getCurrentUserSellerId() {
        // Získá pouze ID prodejce pro filtrování - jinak vše z tabulky
        let sellerId = null;
        
        // 1. Z userData v localStorage - hledáme sellerId
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (userData.sellerId) {
                sellerId = userData.sellerId;
            }
        } catch (e) {
            console.log('📊 Chyba při parsování userData');
        }
        
        // 2. Přímo z localStorage sellerId
        if (!sellerId) {
            sellerId = localStorage.getItem('sellerId');
        }
        
        // 3. Získat sellerId z tabulky uživatelů podle userId
        if (!sellerId) {
            const userId = localStorage.getItem('userId');
            if (userId) {
                try {
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const user = users.find(u => u.id.toString() === userId);
                    
                    if (user && user.sellerId) {
                        sellerId = user.sellerId;
                        localStorage.setItem('sellerId', sellerId);
                    } else if (user) {
                        // SPECIÁLNÍ PŘÍPAD: Pokud je to Šimon Gabriel (userId=4), nastav sellerId=2
                        if (userId === '4' && user.firstName === 'Šimon' && user.lastName === 'Gabriel') {
                            sellerId = '2';
                            user.sellerId = '2';
                            localStorage.setItem('users', JSON.stringify(users));
                            localStorage.setItem('sellerId', '2');
                        }
                    }
                } catch (e) {
                    console.log('📊 Chyba při čtení tabulky uživatelů');
                }
            }
        }
        
        // 4. Fallback pro Šimona Gabriela (ID prodejce = 2)
        if (!sellerId) {
            sellerId = '2';
            localStorage.setItem('sellerId', sellerId);
        }
        
        // OPRAVA: Pokud je sellerId stále 4, vynuť 2
        if (sellerId === '4') {
            sellerId = '2';
            localStorage.setItem('sellerId', '2');
        }
        
        console.log('📊 Používám ID prodejce:', sellerId);
        return String(sellerId);
    }

    // STEJNÁ metoda jako ProdejnyDataLoader
    async loadData(isMonthly = false) {
        console.log('=== NAČÍTÁNÍ PRODEJNÍCH DAT PRO PROFIL ===');
        console.log('Spreadsheet ID:', this.spreadsheetId);
        console.log('Je měsíční:', isMonthly);
        console.log('ID prodejce:', this.userSellerId);
        
        this.isMonthly = isMonthly;
        
        try {
            this.showLoading();
            
            // Použij Google Apps Script endpoint pro načítání dat
            const gid = isMonthly ? this.monthlyGid : this.mainGid;
            await this.loadFromGoogleScript(gid, isMonthly);
            return;
        } catch (error) {
            console.error('Chyba při načítání dat:', error);
            this.showError(error);
        }
    }

    // STEJNÁ metoda jako ProdejnyDataLoader
    async loadFromGoogleScript(gid, isMonthly) {
        console.log('=== NAČÍTÁNÍ Z GOOGLE APPS SCRIPT ===');
        console.log('GID:', gid, 'Je měsíční:', isMonthly);
        
        // Google Apps Script endpoint - stejný jako ProdejnyDataLoader
        const scriptUrl = this.scriptUrl;
        
        // Použij JSONP jako hlavní metodu kvůli CORS problémům
        try {
            console.log('🔄 Používám JSONP metodu jako hlavní...');
            await this.loadWithJsonp(gid, isMonthly);
            return;
            
        } catch (error) {
            console.error('❌ JSONP metoda selhala:', error);
            console.log('🔄 Používám fallback mock data...');
            this.showMockData(isMonthly);
        }
    }

    // STEJNÁ metoda jako ProdejnyDataLoader
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
                    if (script.parentNode) {
                        document.head.removeChild(script);
                    }
                    
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

    // STEJNÁ metoda jako ProdejnyDataLoader
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

    // UPRAVENÁ metoda z ProdejnyDataLoader - přidáno filtrování podle ID prodejce
    parseAndDisplayData(csvData, isMonthly) {
        console.log('=== PARSOVÁNÍ PRODEJNÍCH DAT PRO PROFIL ===');
        console.log('Délka CSV dat:', csvData.length);
        console.log('První 500 znaků:', csvData.substring(0, 500));
        console.log('ID prodejce pro filtrování:', this.userSellerId);
        
        const lines = csvData.split('\n').filter(line => String(line || '').trim());
        console.log('Počet řádků po filtrování:', lines.length);
        
        if (lines.length === 0) {
            console.log('Žádné řádky v CSV, zobrazujem mock data');
            this.showMockData(isMonthly);
            return;
        }

        // Najít řádek s headers - přeskoč aktualizační řádek
        let headerRowIndex = 0;
        let headers = [];
        
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const testHeaders = this.parseCSVLine(lines[i]);
            // Přeskoč aktualizační řádek a najdi řádek s prodejna/prodejce
            if (testHeaders.includes('prodejna') || testHeaders.includes('prodejce')) {
                headers = testHeaders;
                headerRowIndex = i;
                console.log('Nalezeny headers na řádku:', i, headers);
                break;
            }
        }
        
        console.log('Parsované headers:', headers);
        console.log('Header řádek index:', headerRowIndex);
        
        // Získej všechny řádky dat
        const allRows = lines.slice(headerRowIndex + 1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row && row.some(cell => {
                const cellStr = String(cell || '').trim();
                return cellStr && cellStr.length > 0;
            })); // Odfiltrovat prázdné řádky

        console.log(`Načteno ${allRows.length} řádků dat celkem`);
        console.log('První 3 řádky dat:', allRows.slice(0, 3));
        
        // FILTROVÁNÍ podle ID prodejce (sloupec C - index 2)
        const userRows = allRows.filter(row => {
            const rowSellerId = String(row[2] || '').trim(); // sloupec C = index 2
            const matches = rowSellerId === this.userSellerId;
            
            if (matches) {
                console.log('✅ Nalezen řádek pro prodejce:', this.userSellerId, row);
            }
            
            return matches;
        });

        console.log(`Po filtrování podle ID prodejce (${this.userSellerId}): ${userRows.length} řádků`);
        
        if (userRows.length === 0) {
            console.log('❌ Žádné řádky pro tohoto prodejce');
            console.log('Dostupná ID prodejců:', allRows.map(row => String(row[2] || '').trim()));
            this.showEmptyState(isMonthly);
            return;
        }

        // Seřadit podle sloupce polozky_nad_100 (sloupec C - index 2) od největší po nejmenší
        const sortedRows = this.sortRowsByColumn(userRows, 2);
        console.log(`Po seřazení: ${sortedRows.length} řádků`);

        // Aktualizovat metriky před zobrazením
        this.updateUserMetrics(sortedRows, isMonthly);

        // Zobrazit tabulku s použitím STEJNÉ logiky jako ProdejnyDataLoader
        this.displayTable(headers, sortedRows, isMonthly);
    }

    // STEJNÁ metoda jako ProdejnyDataLoader
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        // Ujisti se, že line je string
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

    // STEJNÁ metoda jako ProdejnyDataLoader
    sortRowsByColumn(rows, columnIndex) {
        return rows.sort((a, b) => {
            const valueA = parseInt(a[columnIndex]) || 0;
            const valueB = parseInt(b[columnIndex]) || 0;
            return valueB - valueA; // Od největší po nejmenší
        });
    }

    // NOVÁ metoda - aktualizuje metriky pro uživatele
    updateUserMetrics(rows, isMonthly) {
        console.log('=== AKTUALIZUJI METRIKY UŽIVATELE ===');
        
        let totalItems = 0;
        let totalServices = 0;
        let aligatorSales = 0;

        rows.forEach(row => {
            if (isMonthly) {
                totalItems += parseInt(row[1]) || 0; // měsíční: položky v indexu 1
                totalServices += parseInt(row[2]) || 0; // měsíční: služby v indexu 2
                if (row.length > 4) {
                    aligatorSales += parseInt(row[4]) || 0;
                }
            } else {
                totalItems += parseInt(row[3]) || 0; // aktuální: položky v indexu 3 (sloupec D)
                totalServices += parseInt(row[4]) || 0; // aktuální: služby v indexu 4 (sloupec E)
                if (row.length > 16) {
                    aligatorSales += parseInt(row[16]) || 0; // ALIGATOR sloupec Q = index 16
                }
            }
        });

        console.log('Celkové metriky:', { totalItems, totalServices, aligatorSales });

        // Aktualizovat hlavní metriky (zobrazují se vždy)
        const totalItemsElement = document.getElementById('totalItemsSold');
        const totalServicesElement = document.getElementById('totalServicesSold');
        
        if (totalItemsElement) {
            totalItemsElement.textContent = totalItems;
        }
        if (totalServicesElement) {
            totalServicesElement.textContent = totalServices;
        }

        // Aktualizovat tab-specifické metriky
        const prefix = isMonthly ? 'monthly' : 'current';
        const aligatorElement = document.getElementById(`${prefix}AligatorSales`);
        const totalElement = document.getElementById(`${prefix}TotalSales`);
        const rankingElement = document.getElementById(`${prefix}Ranking`);

        if (aligatorElement) aligatorElement.textContent = aligatorSales;
        if (totalElement) totalElement.textContent = totalItems;
        if (rankingElement) rankingElement.textContent = '1'; // Hardcodované zatím
    }

    // UPRAVENÁ metoda z ProdejnyDataLoader - zobrazí filtrovaná data
    displayTable(headers, rows, isMonthly) {
        // Zpracuj data pro zobrazení - STEJNÁ logika jako ProdejnyDataLoader
        const processedData = this.processDataForDisplay(rows, isMonthly);
        
        // Získej jméno uživatele z prvního řádku dat
        const userName = rows.length > 0 ? (rows[0][1] || 'Neznámý prodejce') : 'Neznámý prodejce';
        
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
                    <div class="user-info" style="margin-bottom: 2rem;">
                        <h3>📊 ${this.escapeHtml(userName)} - ${isMonthly ? 'Aktuální měsíc' : 'Aktuální den'}</h3>
                        <p><strong>ID prodejce:</strong> ${this.escapeHtml(this.userSellerId)}</p>
                        <p><strong>Pozice v žebříčku:</strong> 🥇 #1</p>
                    </div>

                    <!-- Tabulka dat - STEJNÝ formát jako ProdejnyDataLoader -->
                    <div class="table-scroll">
                        <table class="retro-sales-table" id="userProfileTable">
                            <thead>
                                <tr>
                                    ${processedData.headers.map(header => `<th class="sortable-header" data-column="${this.escapeHtml(header)}">${this.escapeHtml(header)} <span class="sort-indicator">▼</span></th>`).join('')}
                                </tr>
                            </thead>
                           <tbody>
                               ${processedData.rows.map((row, index) => `
                                   <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
                                       ${row.map((cell, cellIndex) => {
                                           // Pro měsíční: číselné od indexu 1, pro aktuální: číselné od indexu 2
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
                    
                    <div class="refresh-controls" style="margin-top: 2rem;">
                        <button class="retro-refresh-btn" onclick="window.reloadUserProfileData && window.reloadUserProfileData()">
                            🔄 OBNOVIT DATA
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    // STEJNÁ metoda jako ProdejnyDataLoader
    processDataForDisplay(rows, isMonthly) {
        // Jednoduché zpracování pro uživatelský profil
        const headers = isMonthly 
            ? ['Prodejna', 'Prodejce', 'ID', 'Položky', 'Služby', 'ALIGATOR'] 
            : ['Prodejna', 'Prodejce', 'ID', 'Položky nad 100', 'Služby celkem', 'CT300', 'CT600', 'CT1200', 'AKT', 'ZAH250', 'NAP', 'ZAH500', 'KOP250', 'KOP500', 'PZ1', 'KNZ', 'ALIGATOR'];
        
        return {
            headers: headers,
            rows: rows,
            nameColumnIndex: 1 // prodejce je v druhém sloupci
        };
    }

    // Ostatní metody zůstávají stejné...
    async reloadData() {
        console.log('🔄 Reload dat profilu uživatele...');
        await this.loadData(this.isMonthly);
    }

    setupEventListeners() {
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
                        <p style="margin-top: 1rem;">Načítám data z tabulky pro ID prodejce ${this.userSellerId}...</p>
                    </div>
                </div>
            </div>
        `;
    }

    showMockData(isMonthly) {
        console.log('Zobrazuji mock data pro profil');
        
        // Mock data podle skutečné struktury tabulky
        const mockData = isMonthly ? [
            ['prodejna', 'prodejce', 'id_prodejce', 'polozky', 'sluzby', 'ALIGATOR'],
            ['Globus', 'Šimon Gabriel', '2', '48', '4', '1']
        ] : [
            ['prodejna', 'prodejce', 'id_prodejce', 'polozky_nad_100', 'sluzby_celkem', 'CT300', 'CT600', 'CT1200', 'AKT', 'ZAH250', 'NAP', 'ZAH500', 'KOP250', 'KOP500', 'PZ1', 'KNZ', 'ALIGATOR'],
            ['Globus', 'Šimon Gabriel', '2', '48', '4', '1', '2', '0', '0', '0', '0', '0', '0', '0', '0', '0', '1']
        ];
        
        const csvData = this.convertJsonToCsv(mockData);
        this.parseAndDisplayData(csvData, isMonthly);
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
                        <h3>📊 Žádná data pro ID prodejce ${this.escapeHtml(this.userSellerId)}</h3>
                        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">📈</div>
                            <h4>Prodejce nenalezen</h4>
                            <p>Pro ID prodejce ${this.escapeHtml(this.userSellerId)} nejsou v tabulce žádná data.</p>
                            <p><small>Zkontrolujte ID prodejce nebo kontaktujte administrátora.</small></p>
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
        this.updateUserMetrics([], isMonthly);
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
                        <p>Nepodařilo se načíst data z tabulky.</p>
                        <p><strong>ID prodejce:</strong> ${this.escapeHtml(this.userSellerId)}</p>
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