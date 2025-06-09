// Specializovaný data loader pro uživatelské profily s filtrováním podle ID prodejce
// Používá stejnou logiku jako ProdejnyDataLoader, ale filtruje podle ID prodejce
class UserProfileDataLoader {
    constructor(containerId, tabType = 'current') {
        this.container = document.getElementById(containerId);
        this.tabType = tabType;
        this.isMonthly = tabType === 'monthly';
        
        // ID přihlášeného uživatele - získáme z localStorage (pouze ID, ne data)
        this.userSellerId = this.getCurrentUserSellerId();
        
        // Google Sheets ID a gid pro správné listy
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.mainGid = '0'; // aktuální data - list "List 1" (obvykle GID = 0)
        this.monthlyGid = '1829845095'; // měsíční data - list "od 1"
        
        // Publikované URL pro CSV export
        this.basePublishedUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv`;
        
        this.refreshInterval = null;
        
        // Google Apps Script URL - STEJNÝ jako ProdejnyDataLoader
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbyrD0f_pWkPIaowVclG3zdzgfceYGjyqWin5-2jKKwadFb1e3itg6OMoeZdRxfX0Qk4xg/exec';
        
        console.log(`📊 UserProfileDataLoader vytvořen pro ${this.isMonthly ? 'MĚSÍČNÍ' : 'AKTUÁLNÍ'} data`);
        console.log(`📊 ID prodejce: ${this.userSellerId}, GID: ${this.isMonthly ? this.monthlyGid : this.mainGid}`);
        
        // Automaticky načte data po vytvoření instance
        setTimeout(() => {
            this.loadData(this.isMonthly);
        }, 100);
    }

    getCurrentUserSellerId() {
        // Získá ID prodejce - preferuje sellerId před systémovým ID
        let sellerId = null;
        const username = localStorage.getItem('username');
        
        console.log('=== DIAGNOSTIKA ID PRODEJCE ===');
        console.log('Username z localStorage:', username);
        
        // 1. Přímo z localStorage sellerId (preferovaná metoda)
        sellerId = localStorage.getItem('sellerId');
        console.log('SellerId z localStorage:', sellerId);
        
        // 2. Z userData v localStorage
        if (!sellerId) {
            try {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                if (userData.sellerId) {
                    sellerId = userData.sellerId;
                    localStorage.setItem('sellerId', sellerId); // Uložit pro příště
                    console.log('SellerId z userData:', sellerId);
                }
            } catch (e) {
                console.log('📊 Chyba při parsování userData');
            }
        }
        
        // 3. Hledat v tabulce uživatelů podle username
        if (!sellerId && username) {
            try {
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                console.log('Počet uživatelů v localStorage:', users.length);
                
                const user = users.find(u => u.username === username);
                console.log('Nalezený uživatel podle username:', user);
                
                if (user) {
                    // Priorita 1: customId (ID prodejce z user-management)
                    if (user.customId) {
                        sellerId = user.customId;
                        localStorage.setItem('sellerId', sellerId);
                        console.log('✅ Nalezeno customId podle username:', username, '→', sellerId);
                    } 
                    // Priorita 2: systémové ID jako fallback
                    else if (user.id) {
                        sellerId = String(user.id);
                        localStorage.setItem('sellerId', sellerId);
                        console.log('⚠️ Použito systémové ID jako sellerId pro:', username, '→', sellerId);
                        
                        // Automaticky nastavit customId pro příště
                        user.customId = sellerId;
                        localStorage.setItem('users', JSON.stringify(users));
                        console.log('✅ Automaticky nastaveno customId pro uživatele:', username);
                    }
                }
            } catch (e) {
                console.log('📊 Chyba při čtení tabulky uživatelů:', e);
            }
        }
        
        // 4. Fallback - default prodejce
        if (!sellerId) {
            console.log('⚠️ Nenalezeno ID prodejce, používám fallback ID: 2');
            sellerId = '2';
            localStorage.setItem('sellerId', sellerId);
        }
        
        console.log('📊 FINÁLNÍ ID prodejce:', sellerId);
        console.log('=== KONEC DIAGNOSTIKY ===');
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
            console.log(`🔄 Načítám data z GID: ${gid} (${isMonthly ? 'měsíční list "od 1"' : 'aktuální list'})`);
            
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
            const scriptSrc = `${this.scriptUrl}?gid=${gid}&callback=${callbackName}&_=${timestamp}`;
            script.src = scriptSrc;
            console.log(`🔗 Script URL pro ${isMonthly ? 'měsíční' : 'aktuální'} data:`, scriptSrc);
            
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
        console.log(`Typ dat: ${isMonthly ? 'MĚSÍČNÍ (list "od 1")' : 'AKTUÁLNÍ (main list)'}`);
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
        
        // FILTROVÁNÍ podle ID prodejce - najít správný sloupec podle názvu
        console.log('=== FILTROVÁNÍ DAT PRO ID PRODEJCE ===');
        console.log('Hledané ID prodejce:', this.userSellerId);
        console.log('Headers:', headers);
        
        // Najít index sloupce "id_prodejce"
        const idProdejceIndex = headers.findIndex(h => 
            h && h.toLowerCase().includes('id_prodejce')
        );
        
        console.log('Index sloupce id_prodejce:', idProdejceIndex);
        
        if (idProdejceIndex === -1) {
            console.error('❌ Sloupec "id_prodejce" nenalezen v headers!');
            console.log('Dostupné headers:', headers);
            this.showEmptyState(isMonthly);
            return;
        }
        
        console.log('Všechna dostupná ID prodejců v datech:');
        
        const availableIds = allRows.map((row, index) => {
            const id = String(row[idProdejceIndex] || '').trim();
            console.log(`  Řádek ${index + 1}: ID="${id}", Prodejna="${row[0]}", Prodejce="${row[1]}"`);
            return id;
        });
        
        const userRows = allRows.filter((row, index) => {
            const rowSellerId = String(row[idProdejceIndex] || '').trim();
            const matches = rowSellerId === this.userSellerId;
            
            console.log(`Řádek ${index + 1}: "${rowSellerId}" === "${this.userSellerId}" → ${matches ? '✅ SHODA' : '❌ NESHODA'}`);
            
            if (matches) {
                console.log(`✅ Nalezen řádek pro prodejce (${isMonthly ? 'měsíční' : 'aktuální'}):`, this.userSellerId, row);
            }
            
            return matches;
        });

        console.log(`Po filtrování podle ID prodejce (${this.userSellerId}) - ${isMonthly ? 'měsíční' : 'aktuální'}: ${userRows.length} řádků`);
        
        if (userRows.length === 0) {
            console.log('❌ Žádné řádky pro tohoto prodejce v', isMonthly ? 'měsíčních' : 'aktuálních', 'datech');
            console.log('Dostupná ID prodejců:', availableIds.filter(id => id));
            console.log('Zkontrolujte, zda má uživatel správně nastavené customId v user-management.html');
            this.showEmptyState(isMonthly);
            return;
        }

        // Seřadit podle správného sloupce podle typu dat
        // Pro měsíční data: seřadit podle sloupce D (polozky_nad_100) - index 3
        // Pro aktuální data: seřadit podle sloupce D (polozky_nad_100) - index 3
        const sortColumnIndex = 3; // sloupec D (polozky_nad_100)
        const sortedRows = this.sortRowsByColumn(userRows, sortColumnIndex);
        console.log(`Po seřazení podle sloupce ${sortColumnIndex}: ${sortedRows.length} řádků`);

        // Aktualizovat metriky před zobrazením
        this.updateUserMetrics(sortedRows, isMonthly, headers);

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
    updateUserMetrics(rows, isMonthly, headers) {
        console.log('=== AKTUALIZUJI METRIKY UŽIVATELE ===');
        console.log(`Typ dat: ${isMonthly ? 'MĚSÍČNÍ' : 'AKTUÁLNÍ'}`);
        console.log('Headers:', headers);
        
        let totalItems = 0;
        let totalServices = 0;
        let aligatorSales = 0;

        // Najít indexy sloupců podle názvů
        const polozkyIndex = headers.findIndex(h => h.toLowerCase().includes('polozky'));
        const sluzbyIndex = headers.findIndex(h => h.toLowerCase().includes('sluzby'));
        
        // Hledat ALIGATOR různými způsoby
        let aligatorIndex = headers.findIndex(h => h.toLowerCase() === 'aligator');
        if (aligatorIndex === -1) {
            aligatorIndex = headers.findIndex(h => h.toLowerCase().includes('aligator'));
        }
        
        // Pro aktuální data: zkusit CT300 sloupec jako ALIGATOR (podle obrázku uživatele)
        let ct300Index = -1;
        if (!isMonthly && aligatorIndex === -1) {
            ct300Index = headers.findIndex(h => h.toLowerCase() === 'ct300');
        }
        
        console.log(`Indexy sloupců: položky=${polozkyIndex}, služby=${sluzbyIndex}, aligator=${aligatorIndex}, ct300=${ct300Index}`);

        rows.forEach(row => {
            console.log('Zpracovávám řádek:', row);
            
            // Položky - obvykle sloupec D (index 3)
            if (polozkyIndex >= 0) {
                totalItems += parseInt(row[polozkyIndex]) || 0;
            } else {
                totalItems += parseInt(row[3]) || 0; // fallback na index 3
            }
            
            // Služby - obvykle sloupec E (index 4)  
            if (sluzbyIndex >= 0) {
                totalServices += parseInt(row[sluzbyIndex]) || 0;
            } else {
                totalServices += parseInt(row[4]) || 0; // fallback na index 4
            }
            
            // ALIGATOR - hledat přímo sloupec ALIGATOR
            if (aligatorIndex >= 0) {
                aligatorSales += parseInt(row[aligatorIndex]) || 0;
                console.log(`ALIGATOR z indexu ${aligatorIndex}: ${row[aligatorIndex]}`);
            } else if (!isMonthly && ct300Index >= 0) {
                // Pro aktuální data: použij CT300 jako ALIGATOR telefony
                aligatorSales += parseInt(row[ct300Index]) || 0;
                console.log(`ALIGATOR z CT300 indexu ${ct300Index}: ${row[ct300Index]}`);
            } else {
                console.log('⚠️ Sloupec ALIGATOR ani CT300 nenalezen, zkouším poslední sloupec');
                // Fallback - zkus poslední sloupec, který by mohl být ALIGATOR
                if (row.length > 15) {
                    aligatorSales += parseInt(row[row.length - 1]) || 0;
                    console.log(`ALIGATOR z posledního sloupce: ${row[row.length - 1]}`);
                }
            }
        });

        console.log(`Celkové metriky (${isMonthly ? 'měsíční' : 'aktuální'}):`, { totalItems, totalServices, aligatorSales });

        // Aktualizovat hlavní metriky (zobrazují se vždy - berou se z aktuálně aktivního tabu)
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
        // Zpracuj data pro zobrazení - PŘEDEJ headers jako třetí parametr
        const processedData = this.processDataForDisplay(rows, isMonthly, headers);
        
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

    // UPRAVENÁ metoda - dynamicky najde a odstraní sloupec ID prodejce
    processDataForDisplay(rows, isMonthly, originalHeaders) {
        // Zpracování pro uživatelský profil - SKRÝT sloupec ID prodejce
        console.log(`Zpracovávám data pro zobrazení: ${isMonthly ? 'MĚSÍČNÍ' : 'AKTUÁLNÍ'}`);
        
        // Najít index sloupce "id_prodejce" v původních headers
        const idProdejceIndex = originalHeaders.findIndex(h => 
            h && h.toLowerCase().includes('id_prodejce')
        );
        
        console.log('Index sloupce id_prodejce pro odstranění:', idProdejceIndex);
        
        // Vytvořit displayHeaders bez sloupce id_prodejce
        const displayHeaders = originalHeaders.filter((header, index) => 
            index !== idProdejceIndex
        );
        
        // Zpracované řádky - odstraň sloupec ID prodejce
        const processedRows = rows.map(row => {
            // Vytvoř nový řádek bez sloupce ID prodejce
            return row.filter((cell, index) => index !== idProdejceIndex);
        });
        
        console.log('Původní headers:', originalHeaders);
        console.log('Zpracované headers (bez ID):', displayHeaders);
        console.log('Původní řádky:', rows.length);
        console.log('Zpracované řádky (bez ID):', processedRows.length);
        
        // Najít index sloupce "prodejce" v nových headers
        const prodejceIndex = displayHeaders.findIndex(h => 
            h && h.toLowerCase().includes('prodejce')
        );
        
        return {
            headers: displayHeaders,
            rows: processedRows,
            nameColumnIndex: prodejceIndex >= 0 ? prodejceIndex : 1 // fallback na index 1
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
        console.log(`Zobrazuji mock data pro profil (${isMonthly ? 'měsíční' : 'aktuální'})`);
        
        // Mock data podle skutečné struktury tabulky
        const mockData = isMonthly ? [
            // Měsíční data (list "od 1") - Šimon Gabriel: 186 položek, 33 služeb, 1 ALIGATOR
            ['prodejna', 'prodejce', 'id_prodejce', 'polozky_nad_100', 'sluzby_celkem', 'CT300', 'CT600', 'CT1200', 'AKT', 'ZAH250', 'NAP', 'ZAH500', 'KOP250', 'KOP500', 'PZ1', 'KNZ', 'ALIGATOR'],
            ['Globus', 'Šimon Gabriel', '2', '186', '33', '8', '7', '2', '0', '0', '10', '0', '1', '3', '1', '0', '1']
        ] : [
            // Aktuální data - Šimon Gabriel: 48 položek, 4 služby, 1 ALIGATOR
            ['prodejna', 'prodejce', 'id_prodejce', 'polozky_nad_100', 'sluzby_celkem', 'CT300', 'CT600', 'CT1200', 'AKT', 'ZAH250', 'NAP', 'ZAH500', 'KOP250', 'KOP500', 'PZ1', 'KNZ', 'ALIGATOR'],
            ['Globus', 'Šimon Gabriel', '2', '48', '4', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '1']
        ];
        
        const csvData = this.convertJsonToCsv(mockData);
        this.parseAndDisplayData(csvData, isMonthly);
    }

    showEmptyState(isMonthly) {
        // Získej username pro diagnostiku
        const username = localStorage.getItem('username') || 'neznámý';
        
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
                        <h3>📊 Žádná prodejní data pro uživatele "${this.escapeHtml(username)}"</h3>
                        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">📈</div>
                            <h4>Data nenalezena</h4>
                            <p>Pro uživatele <strong>${this.escapeHtml(username)}</strong> s ID prodejce <strong>${this.escapeHtml(this.userSellerId)}</strong> nejsou v tabulce žádná ${isMonthly ? 'měsíční' : 'aktuální'} data.</p>
                            
                            <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 1.5rem; margin: 2rem 0; text-align: left;">
                                <h5 style="margin-top: 0; color: #495057;">🔧 Možné řešení:</h5>
                                <ul style="margin: 0; color: #6c757d; line-height: 1.6;">
                                    <li>Zkontrolujte, zda má uživatel v <strong>Správě uživatelů</strong> vyplněné <strong>ID prodejce</strong></li>
                                    <li>Ověřte, zda ID prodejce odpovídá sloupci <strong>"id_prodejce"</strong> v Google Sheets tabulce</li>
                                    <li>Ujistěte se, že v tabulce existuje sloupec s názvem <strong>"id_prodejce"</strong></li>
                                    <li>Ujistěte se, že v tabulce existují data pro tento měsíc</li>
                                    <li>Pro nového prodejce je potřeba přidat řádek do Google Sheets</li>
                                </ul>
                            </div>
                            
                            <p><small><strong>Diagnostika:</strong> Hledané ID prodejce: ${this.escapeHtml(this.userSellerId)} | Zobrazené konzole F12 pro více informací.</small></p>
                        </div>
                        
                        <div class="refresh-controls">
                            <button class="retro-refresh-btn" onclick="window.reloadUserProfileData && window.reloadUserProfileData()">
                                🔄 OBNOVIT DATA
                            </button>
                            <button class="retro-refresh-btn" onclick="window.open('user-management.html', '_blank')" style="margin-left: 1rem;">
                                ⚙️ SPRÁVA UŽIVATELŮ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Aktualizovat metriky na nulu
        this.updateUserMetrics([], isMonthly, []);
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