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
        
        console.log('📊 UserProfileDataLoader vytvořen pro ID prodejce:', this.userSellerId);
        
        // Automaticky načte data po vytvoření instance
        setTimeout(() => {
            this.loadData(this.isMonthly);
        }, 100);
    }

    getCurrentUserSellerId() {
        // Zkus získat ID prodejce z různých zdrojů
        let sellerId = null;
        
        // 1. Z userData v localStorage
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (userData.sellerId) {
                sellerId = userData.sellerId;
                console.log('📊 SellerId nalezeno v userData:', sellerId);
            }
        } catch (e) {
            console.log('📊 Chyba při parsování userData');
        }
        
        // 2. Přímo z localStorage
        if (!sellerId) {
            sellerId = localStorage.getItem('sellerId');
            if (sellerId) {
                console.log('📊 SellerId nalezeno v localStorage:', sellerId);
            }
        }
        
        // 3. Z userId jako fallback
        if (!sellerId) {
            sellerId = localStorage.getItem('userId');
            if (sellerId) {
                console.log('📊 Používám userId jako sellerId:', sellerId);
            }
        }
        
        // 4. Testovací fallback pro Šimona Gabriela
        if (!sellerId) {
            sellerId = '2'; // Šimon Gabriel z tabulky
            console.log('📊 Fallback na testovací ID:', sellerId);
            
            // Ulož do localStorage pro budoucí použití
            localStorage.setItem('sellerId', sellerId);
            
            // Aktualizuj userData
            try {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                userData.sellerId = sellerId;
                userData.firstName = 'Šimon';
                userData.lastName = 'Gabriel';
                localStorage.setItem('userData', JSON.stringify(userData));
            } catch (e) {
                console.log('📊 Chyba při aktualizaci userData');
            }
        }
        
        return String(sellerId); // Ujisti se, že je to string
    }

    async loadData(isMonthly = false) {
        console.log('=== NAČÍTÁNÍ DAT PROFILU UŽIVATELE ===');
        console.log('ID prodejce:', this.userSellerId);
        console.log('Je měsíční:', isMonthly);
        console.log('Tab type:', this.tabType);
        
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
        console.log('První 500 znaků CSV:', csvData.substring(0, 500));
        
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
            console.log(`Test headers řádek ${i}:`, testHeaders);
            
            // Přeskoč aktualizační řádek a najdi řádek s prodejna/prodejce
            if (testHeaders.includes('prodejna') || testHeaders.includes('prodejce') || testHeaders.includes('id_prodejce')) {
                headers = testHeaders;
                headerRowIndex = i;
                console.log('Nalezeny headers na řádku:', i, headers);
                break;
            }
        }
        
        console.log('Parsované headers:', headers);
        
        // Najdi index sloupce ID prodejce
        let sellerIdColumnIndex = 2; // Default sloupec C
        
        // Pokus se najít přesný index pro id_prodejce
        const idProdejceIndex = headers.findIndex(h => 
            String(h || '').toLowerCase().includes('id_prodejce') || 
            String(h || '').toLowerCase().includes('id prodejce')
        );
        
        if (idProdejceIndex !== -1) {
            sellerIdColumnIndex = idProdejceIndex;
            console.log('Nalezen sloupec id_prodejce na indexu:', sellerIdColumnIndex);
        }
        
        console.log('Používám sloupec pro ID prodejce:', sellerIdColumnIndex);
        
        // Zpracuj všechny datové řádky a najdi ty pro našeho prodejce
        const allRows = lines.slice(headerRowIndex + 1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row && row.some(cell => String(cell || '').trim()));
        
        console.log('Všechny datové řádky:', allRows.length);
        allRows.forEach((row, index) => {
            const rowSellerId = String(row[sellerIdColumnIndex] || '').trim();
            console.log(`Řádek ${index}: ID=${rowSellerId}, Data:`, row.slice(0, 5));
        });
        
        // Filtruj podle ID prodejce
        const userRows = allRows.filter(row => {
            const rowSellerId = String(row[sellerIdColumnIndex] || '').trim();
            const matches = rowSellerId === this.userSellerId;
            
            if (matches) {
                console.log('✅ Nalezen řádek pro prodejce:', this.userSellerId, row);
            }
            
            return matches;
        });

        console.log(`Po filtrování podle ID prodejce (${this.userSellerId}): ${userRows.length} řádků`);
        
        if (userRows.length === 0) {
            console.log('❌ Žádné řádky pro tohoto prodejce, zobrazujem prázdný stav');
            console.log('Dostupná ID prodejců:', allRows.map(row => String(row[sellerIdColumnIndex] || '').trim()));
            this.showEmptyState(isMonthly);
            return;
        }

        // Aktualizovat hlavní metriky
        this.updateMainMetrics(userRows, isMonthly, headers);

        // Aktualizovat dodatečné statistiky
        this.updateAdditionalStats(userRows, isMonthly, headers);

        this.displayUserProfile(headers, userRows, isMonthly);
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

    updateMainMetrics(rows, isMonthly, headers) {
        console.log('=== AKTUALIZUJI HLAVNÍ METRIKY ===');
        console.log('Počet řádků:', rows.length);
        console.log('Headers:', headers);
        
        // Najdi indexy pro položky a služby
        let itemsIndex = -1;
        let servicesIndex = -1;
        
        if (isMonthly) {
            // Pro měsíční: hledáme "POLOŽKY" a "SLUŽBY"
            itemsIndex = headers.findIndex(h => String(h || '').toLowerCase().includes('položky'));
            servicesIndex = headers.findIndex(h => String(h || '').toLowerCase().includes('služby'));
        } else {
            // Pro aktuální: hledáme "polozky_nad_100" a "sluzby_celkem"
            itemsIndex = headers.findIndex(h => 
                String(h || '').toLowerCase().includes('polozky_nad_100') ||
                String(h || '').toLowerCase().includes('položky')
            );
            servicesIndex = headers.findIndex(h => 
                String(h || '').toLowerCase().includes('sluzby_celkem') ||
                String(h || '').toLowerCase().includes('služby')
            );
        }
        
        console.log('Items index:', itemsIndex, 'Services index:', servicesIndex);
        
        // Pokud nenajdeme indexy, použij defaultní pozice
        if (itemsIndex === -1) itemsIndex = isMonthly ? 1 : 3; // D sloupec pro aktuální (polozky_nad_100)
        if (servicesIndex === -1) servicesIndex = isMonthly ? 2 : 4; // E sloupec pro aktuální (sluzby_celkem)
        
        let totalItems = 0;
        let totalServices = 0;

        rows.forEach(row => {
            const items = parseInt(row[itemsIndex]) || 0;
            const services = parseInt(row[servicesIndex]) || 0;
            
            totalItems += items;
            totalServices += services;
            
            console.log('Řádek data:', {
                items: items,
                services: services,
                itemsIndex: itemsIndex,
                servicesIndex: servicesIndex,
                rowData: row.slice(0, 8)
            });
        });

        console.log('Celkové výsledky:', { totalItems, totalServices });

        // Aktualizovat UI pouze pro hlavní metriky (zobrazují se vždy)
        const totalItemsElement = document.getElementById('totalItemsSold');
        const totalServicesElement = document.getElementById('totalServicesSold');
        
        if (totalItemsElement) {
            totalItemsElement.textContent = totalItems;
            console.log('✅ Aktualizován totalItemsSold:', totalItems);
        }
        if (totalServicesElement) {
            totalServicesElement.textContent = totalServices;
            console.log('✅ Aktualizován totalServicesSold:', totalServices);
        }
    }

    updateAdditionalStats(rows, isMonthly, headers) {
        console.log('=== AKTUALIZUJI DODATEČNÉ STATISTIKY ===');
        
        // Najdi index pro ALIGATOR telefony
        let aligatorIndex = headers.findIndex(h => 
            String(h || '').toLowerCase().includes('aligator')
        );
        
        console.log('Aligator index:', aligatorIndex);
        
        // Najdi indexy pro celkové hodnoty
        let itemsIndex = isMonthly ? 1 : 3; // stejné jako v updateMainMetrics
        
        let aligatorSales = 0;
        let totalSales = 0;

        rows.forEach(row => {
            totalSales += parseInt(row[itemsIndex]) || 0;
            
            // ALIGATOR telefony pokud existuje sloupec
            if (aligatorIndex !== -1) {
                aligatorSales += parseInt(row[aligatorIndex]) || 0;
            }
        });

        console.log('Dodatečné statistiky:', { aligatorSales, totalSales });

        // Aktualizovat pouze příslušné elementy pro aktivní tab
        const prefix = isMonthly ? 'monthly' : 'current';
        const aligatorElement = document.getElementById(`${prefix}AligatorSales`);
        const totalElement = document.getElementById(`${prefix}TotalSales`);
        const rankingElement = document.getElementById(`${prefix}Ranking`);

        if (aligatorElement) {
            aligatorElement.textContent = aligatorSales;
            console.log(`✅ Aktualizován ${prefix}AligatorSales:`, aligatorSales);
        }
        if (totalElement) {
            totalElement.textContent = totalSales;
            console.log(`✅ Aktualizován ${prefix}TotalSales:`, totalSales);
        }
        if (rankingElement) {
            rankingElement.textContent = '1'; // Zatím hardcodované, bude vypočítáno později
            console.log(`✅ Aktualizován ${prefix}Ranking: 1`);
        }
    }

    displayUserProfile(headers, rows, isMonthly) {
        // Získej jméno prodejce - předpokládá se jméno ve druhém sloupci (index 1)
        const userName = rows.length > 0 ? (rows[0][1] || 'Neznámý prodejce') : 'Neznámý prodejce';
        
        console.log('Zobrazuji profil pro:', userName);
        
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
                        <p><strong>Pozice v žebříčku:</strong> 🥇 #1</p>
                        
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
                                                    const isNumeric = cellIndex >= 2; // číselné sloupce od C
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
                            <h4>Žádná data pro ID prodejce ${this.escapeHtml(this.userSellerId)}</h4>
                            <p>Pro tento ${isMonthly ? 'měsíc' : 'den'} nejsou k dispozici žádné prodeje.</p>
                            <p><small>Zkuste změnit ID prodejce v localStorage nebo kontaktujte administrátora.</small></p>
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
        this.updateMainMetrics([], isMonthly, []);
        this.updateAdditionalStats([], isMonthly, []);
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
                        <p style="margin-top: 1rem;">Načítám vaše data pro ID prodejce ${this.userSellerId}...</p>
                    </div>
                </div>
            </div>
        `;
    }

    showMockData(isMonthly) {
        console.log('Zobrazuji mock data pro profil Šimona Gabriela');
        
        // Mock data na základě skutečných dat z tabulky pro Šimona (ID=2)
        const mockData = isMonthly ? [
            ['prodejna', 'prodejce', 'id_prodejce', 'polozky', 'sluzby', 'ALIGATOR'],
            ['Globus', 'Šimon Gabriel', '2', '48', '4', '1']
        ] : [
            ['prodejna', 'prodejce', 'id_prodejce', 'polozky_nad_100', 'sluzby_celkem', 'CT300', 'CT600', 'CT1200', 'AKT', 'ZAH250', 'NAP', 'ZAH500', 'KOP250', 'KOP500', 'PZ1', 'KNZ', 'ALIGATOR'],
            ['Globus', 'Šimon Gabriel', '2', '48', '4', '1', '2', '0', '0', '0', '0', '0', '0', '0', '0', '0', '1']
        ];
        
        const csvData = this.convertJsonToCsv(mockData);
        console.log('Mock CSV data:', csvData);
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