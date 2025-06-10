// ⚠️⚠️⚠️ POZOR! TENTO SOUBOR OBSAHUJE FUNKČNÍ GOOGLE SHEETS ČTENÍ! ⚠️⚠️⚠️
// ⚠️ USER PROFILY FUNGUJÍ SPRÁVNĚ OD 10.6.2025 ⚠️
// ⚠️ NEMĚNIT BEZ VÝSLOVNÉHO SVOLENÍ UŽIVATELE! ⚠️
//
// Specializovaný data loader pro uživatelské profily s filtrováním podle ID prodejce
// Používá stejnou logiku jako ProdejnyDataLoader, ale filtruje podle ID prodejce
class UserProfileDataLoader {
    constructor(containerId, tabType = 'current') {
        this.container = document.getElementById(containerId);
        this.tabType = tabType;
        this.isMonthly = tabType === 'monthly';
        this.isPoints = tabType === 'points';
        
        // ID přihlášeného uživatele - získáme z localStorage (pouze ID, ne data)
        this.userSellerId = this.getCurrentUserSellerId();
        
        // ⚠️ KRITICKÉ NASTAVENÍ PRO USER PROFILE - NEMĚNIT! ⚠️
        // ⚠️ FUNKČNÍ OD 10.6.2025 - AKTUÁLNÍ I MĚSÍČNÍ DATA! ⚠️
        // Google Sheets ID a gid pro správné listy
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.mainGid = '0'; // aktuální data - list "List 1" (obvykle GID = 0)
        this.monthlyGid = '1829845095'; // měsíční data - list "od 1"
        // ⚠️ KONEC KRITICKÉHO NASTAVENÍ ⚠️
        
        // Publikované URL pro CSV export
        this.basePublishedUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv`;
        
        this.refreshInterval = null;
        
        // Google Apps Script URL pro ČTENÍ dat z prodejní tabulky
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbyGPiyfiPMn1yvZFoYuiFwFiCXJ7u3vBLlmiEqXLXSuzuDvDCcKqm6uUyDIRbcH4Ftk5g/exec';
        
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
        
        // 3. Hledat v tabulce uživatelů ze SERVERU (ne localStorage)
        if (!sellerId && username) {
            console.log('🌐 Načítám uživatele ze serveru...');
            // Synchronní volání - vrátíme fallback a načteme v pozadí
            this.loadUserFromServer(username).then(user => {
                if (user && user.customId) {
                    localStorage.setItem('sellerId', user.customId);
                    console.log('✅ Aktualizováno sellerId ze serveru:', user.customId);
                    // Reload dat pokud se ID změnilo
                    if (this.userSellerId !== user.customId) {
                        this.userSellerId = user.customId;
                        this.loadData(this.isMonthly);
                    }
                }
            });
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

    // Nová metoda pro načtení uživatele ze serveru
    async loadUserFromServer(username) {
        try {
            console.log('🌐 Volám server API pro uživatele...');
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
                
                // Najdi uživatele podle username
                const user = data.users.find(u => u.username === username);
                
                if (user) {
                    console.log('✅ Uživatel nalezen na serveru:', user);
                    
                    // Aktualizuj localStorage jako cache
                    localStorage.setItem('users', JSON.stringify(data.users));
                    
                    // Pokud uživatel nemá customId, automaticky ho nastavíme
                    if (!user.customId && user.id) {
                        user.customId = String(user.id);
                        console.log('⚠️ Doplněno chybějící customId:', user.customId);
                        
                        // Ulož zpět na server s doplněným customId
                        this.saveUserToServer(data.users);
                    }
                    
                    // Zajistit správné zobrazování jména
                    if (!user.displayName) {
                        if (user.fullName && user.fullName.trim() !== '') {
                            user.displayName = user.fullName;
                        } else if (user.firstName && user.lastName) {
                            user.displayName = `${user.firstName} ${user.lastName}`.trim();
                        } else if (user.firstName) {
                            user.displayName = user.firstName;
                        } else {
                            user.displayName = user.username;
                        }
                        console.log('✨ Nastaveno zobrazované jméno:', user.displayName);
                    }
                    
                    return user;
                } else {
                    console.log('❌ Uživatel nenalezen na serveru:', username);
                    return null;
                }
            } else {
                throw new Error('Neplatná odpověď ze serveru');
            }
            
        } catch (error) {
            console.error('❌ Chyba při načítání ze serveru:', error);
            
            // Fallback na localStorage
            console.log('🔄 Fallback - čtu z localStorage...');
            try {
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                return users.find(u => u.username === username) || null;
            } catch (e) {
                console.error('❌ Chyba i při čtení z localStorage:', e);
                return null;
            }
        }
    }

    // Nová metoda pro uložení uživatelů na server
    async saveUserToServer(users) {
        try {
            console.log('💾 Ukládám uživatele na server...');
            const response = await fetch('/api/users-github', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    users: users
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Uživatelé úspěšně uloženi na server');
                return true;
            } else {
                throw new Error(data.error || 'Nepodařilo se uložit');
            }
            
        } catch (error) {
            console.error('❌ Chyba při ukládání na server:', error);
            return false;
        }
    }

    // UPRAVENÁ metoda s podporou historie
    async loadData(isMonthly = false) {
        console.log('=== NAČÍTÁNÍ PRODEJNÍCH DAT PRO PROFIL ===');
        console.log('Spreadsheet ID:', this.spreadsheetId);
        console.log('Tab type:', this.tabType);
        console.log('Je měsíční:', isMonthly);
        console.log('Je bodové hodnocení:', this.isPoints);
        console.log('ID prodejce:', this.userSellerId);
        console.log('Vybrané historické datum:', this.selectedHistoryDate);
        
        // Pro body načítáme vždy měsíční data
        if (this.isPoints) {
            this.isMonthly = true;
            isMonthly = true;
            console.log('🏆 Bodové hodnocení - force načítání měsíčních dat');
        } else {
            this.isMonthly = isMonthly;
        }
        
        try {
            this.showLoading();
            
            // Zkontrolovat, zda načítat historická data
            if (this.selectedHistoryDate && window.historyManager) {
                console.log(`📚 Načítám historická data pro datum: ${this.selectedHistoryDate}`);
                await this.loadHistoricalData(this.selectedHistoryDate, isMonthly);
                return;
            }
            
            // Standardní načítání aktuálních dat
            const gid = isMonthly ? this.monthlyGid : this.mainGid;
            console.log(`🔄 Načítám aktuální data z GID: ${gid} (${isMonthly ? 'měsíční list "od 1"' : 'aktuální list'})`);
            
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
            console.log('🔄 Používám JSONP metodu pro načtení ze serveru...');
            await this.loadWithJsonp(gid, isMonthly);
            return;
            
        } catch (error) {
            console.error('❌ JSONP metoda selhala:', error);
            console.log('❌ ŽÁDNÁ FALLBACK DATA - zobrazuji chybu');
            this.showError(error);
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

    // NOVÁ metoda - načítání historických dat
    async loadHistoricalData(dateString, isMonthly) {
        console.log(`📚 Načítám historická data pro ${dateString}, měsíční: ${isMonthly}`);
        
        try {
            // Získat historická data
            const historyData = window.historyManager.getDataForDate(dateString);
            
            if (!historyData) {
                throw new Error(`Historická data pro datum ${dateString} nenalezena`);
            }
            
            console.log('📊 Historická data načtena:', historyData.metadata);
            
            // Pro historická data používáme vždy raw data (která byla původně aktuální)
            // Převést na CSV formát pro kompatibilitu
            const csvData = this.convertHistoricalDataToCsv(historyData.data);
            
            // Standardní parsování a zobrazení - přidáme flag pro historická data
            this.parseAndDisplayData(csvData, isMonthly, true); // třetí parametr označuje historická data
            
        } catch (error) {
            console.error('❌ Chyba při načítání historických dat:', error);
            this.showHistoricalDataError(dateString, error);
        }
    }

    // Převést historická data na CSV formát
    convertHistoricalDataToCsv(historicalData) {
        if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
            return '';
        }
        
        // Již jsou ve formátu array of arrays - jen převést na CSV string
        const csvLines = historicalData.map(row => {
            return Array.isArray(row) ? row.map(cell => String(cell || '')).join(',') : String(row);
        });
        
        return csvLines.join('\n');
    }

    // Error handler pro historická data
    showHistoricalDataError(dateString, error) {
        const formattedDate = this.formatDateForDisplay(dateString);
        
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; historical_data_${dateString}.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <div style="padding: 2rem; text-align: center; color: var(--error-color, #e74c3c);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
                        <h3>Historická data nenalezena</h3>
                        <p>Pro datum <strong>${formattedDate}</strong> nejsou dostupná žádná historická data.</p>
                        
                        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1.5rem; margin: 2rem 0; text-align: left; color: #856404;">
                            <h5 style="margin-top: 0; color: #856404;">💡 Vysvětlení:</h5>
                            <ul style="margin: 0; line-height: 1.6;">
                                <li>Historická data se ukládají každý den ve 22:35</li>
                                <li>Data jsou dostupná od ${this.getFirstAvailableDate() || 'budoucího'} ukládání</li>
                                <li>Pro toto datum nebyl vytvořen snapshot dat</li>
                            </ul>
                        </div>
                        
                        <div style="margin-top: 2rem;">
                            <button class="retro-refresh-btn" onclick="window.historyUI.selectDate('current')" style="margin-right: 1rem;">
                                📊 Zobrazit aktuální data
                            </button>
                            
                            ${this.canCreateHistoricalSnapshot(dateString) ? `
                                <button class="retro-refresh-btn" onclick="window.historyDebug.createTodaySnapshot()">
                                    📸 Vytvořit snapshot (test)
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Helper metoda pro formátování data
    formatDateForDisplay(dateString) {
        if (!dateString) return '';
        
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        
        return date.toLocaleDateString('cs-CZ', { 
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
        });
    }

    // Zjistit první dostupné datum v historii
    getFirstAvailableDate() {
        if (!window.historyManager) return null;
        
        const dates = window.historyManager.getAvailableDates();
        return dates.length > 0 ? this.formatDateForDisplay(dates[dates.length - 1]) : null;
    }

    // Zkontrolovat, zda lze vytvořit snapshot pro dané datum
    canCreateHistoricalSnapshot(dateString) {
        const today = new Date().toISOString().slice(0, 10);
        return dateString === today;
    }

    // UPRAVENÁ metoda z ProdejnyDataLoader - přidáno filtrování podle ID prodejce a podpora historie
    parseAndDisplayData(csvData, isMonthly, isHistorical = false) {
        console.log('=== PARSOVÁNÍ PRODEJNÍCH DAT PRO PROFIL ===');
        console.log(`Typ dat: ${isMonthly ? 'MĚSÍČNÍ (list "od 1")' : 'AKTUÁLNÍ (main list)'}`);
        console.log(`Zdroj dat: ${isHistorical ? 'HISTORICKÁ DATA' : 'AKTUÁLNÍ SERVER'}`);
        console.log('Délka CSV dat:', csvData.length);
        console.log('První 500 znaků:', csvData.substring(0, 500));
        console.log('ID prodejce pro filtrování:', this.userSellerId);
        
        const lines = csvData.split('\n').filter(line => String(line || '').trim());
        console.log('Počet řádků po filtrování:', lines.length);
        
        if (lines.length === 0) {
            console.log('❌ Žádné řádky v CSV datech ze serveru');
            this.showError(new Error('Tabulka ze serveru neobsahuje žádná data'));
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
        console.log('Hledaný header pattern: "id_prodejce"');
        console.log('Dostupné headers pro porovnání:');
        headers.forEach((header, index) => {
            console.log(`  Index ${index}: "${header}" (toLowerCase: "${(header || '').toLowerCase()}")"`);
        });
        
        if (idProdejceIndex === -1) {
            console.error('❌ Sloupec "id_prodejce" nenalezen v headers!');
            console.log('Dostupné headers:', headers);
            
            this.showError(new Error('Sloupec "id_prodejce" neexistuje v tabulce ze serveru'));
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
            const userSellerIdStr = String(this.userSellerId || '').trim();
            
            // Porovnávej jako stringy i jako čísla
            const matches = rowSellerId === userSellerIdStr || 
                           parseInt(rowSellerId) === parseInt(userSellerIdStr);
            
            console.log(`Řádek ${index + 1}: "${rowSellerId}" (type: ${typeof row[idProdejceIndex]}) === "${userSellerIdStr}" (type: ${typeof this.userSellerId}) → ${matches ? '✅ SHODA' : '❌ NESHODA'}`);
            
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
            
            this.showError(new Error(`Uživatel s ID prodejce "${this.userSellerId}" není v tabulce ze serveru. Dostupná ID: ${availableIds.filter(id => id).join(', ')}`));
            return;
        }

        // Seřadit podle správného sloupce podle typu dat
        // Pro měsíční data: seřadit podle sloupce D (polozky_nad_100) - index 3
        // Pro aktuální data: seřadit podle sloupce D (polozky_nad_100) - index 3
        const sortColumnIndex = 3; // sloupec D (polozky_nad_100)
        const sortedRows = this.sortRowsByColumn(userRows, sortColumnIndex);
        console.log(`Po seřazení podle sloupce ${sortColumnIndex}: ${sortedRows.length} řádků`);

        // Aktualizovat metriky před zobrazením
        if (this.isPoints) {
            this.updateUserPoints(sortedRows, headers);
        } else {
            this.updateUserMetrics(sortedRows, isMonthly, headers);
        }

        // Zobrazit tabulku s použitím STEJNÉ logiky jako ProdejnyDataLoader - předat isHistorical flag
        if (this.isPoints) {
            this.displayPointsTable(headers, sortedRows, isHistorical);
        } else {
            this.displayTable(headers, sortedRows, isMonthly, isHistorical);
        }
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

    // Helper metoda pro získání správného jména uživatele
    getUserDisplayName() {
        const username = localStorage.getItem('username');
        
        if (!username) {
            return 'Neznámý prodejce';
        }
        
        try {
            // Zkus najít v localStorage uživatelských dat
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const currentUser = users.find(u => u.username === username);
            
            if (currentUser) {
                // Priorita: fullName -> firstName + lastName -> firstName -> username
                if (currentUser.fullName && currentUser.fullName.trim() !== '') {
                    return currentUser.fullName;
                } else if (currentUser.firstName && currentUser.lastName) {
                    return `${currentUser.firstName} ${currentUser.lastName}`.trim();
                } else if (currentUser.firstName) {
                    return currentUser.firstName;
                } else {
                    return currentUser.username;
                }
            }
        } catch (e) {
            console.log('Chyba při čtení uživatelských dat z localStorage:', e);
        }
        
        // Fallback na username
        return username;
    }

    // NOVÁ metoda - výpočet bodů podle bodovacích pravidel
    updateUserPoints(rows, headers) {
        console.log('=== VÝPOČET BODŮ PRODEJCE ===');
        console.log('Headers:', headers);
        
        // Bodovací pravidla
        const pointsRules = {
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

        console.log('Indexy sloupců:', {
            polozky: polozkyIndex,
            CT600: ct600Index,
            CT1200: ct1200Index,
            NAP: napIndex,
            AKT: aktIndex,
            PZ1: pz1Index,
            ZAH250: zah250Index,
            ZAH500: zah500Index,
            KOP250: kop250Index,
            KOP500: kop500Index
        });

        let totalPoints = 0;
        let totalItems = 0;
        let breakdown = {};

        rows.forEach((row, index) => {
            console.log(`📊 Zpracovávám řádek ${index + 1}:`, row);
            
            // Základní body za položky nad 100 Kč
            const polozkyCount = parseInt(row[polozkyIndex]) || 0;
            const basePoints = polozkyCount * pointsRules.basePoints;
            totalPoints += basePoints;
            totalItems += polozkyCount;
            
            console.log(`  📱 Položky nad 100 Kč: ${polozkyCount} × ${pointsRules.basePoints} = ${basePoints} bodů`);
            breakdown['Základní body'] = (breakdown['Základní body'] || 0) + basePoints;

            // Bonusové body za specifické produkty
            const bonuses = [
                { name: 'CT600', index: ct600Index, points: pointsRules.CT600 },
                { name: 'CT1200', index: ct1200Index, points: pointsRules.CT1200 },
                { name: 'NAP', index: napIndex, points: pointsRules.NAP },
                { name: 'AKT', index: aktIndex, points: pointsRules.AKT },
                { name: 'PZ1', index: pz1Index, points: pointsRules.PZ1 },
                { name: 'ZAH250', index: zah250Index, points: pointsRules.ZAH250 },
                { name: 'ZAH500', index: zah500Index, points: pointsRules.ZAH500 },
                { name: 'KOP250', index: kop250Index, points: pointsRules.KOP250 },
                { name: 'KOP500', index: kop500Index, points: pointsRules.KOP500 }
            ];

            bonuses.forEach(bonus => {
                if (bonus.index >= 0) {
                    const count = parseInt(row[bonus.index]) || 0;
                    const bonusPoints = count * bonus.points;
                    if (bonusPoints > 0) {
                        totalPoints += bonusPoints;
                        console.log(`  🎯 ${bonus.name}: ${count} × ${bonus.points} = ${bonusPoints} bodů`);
                        breakdown[bonus.name] = (breakdown[bonus.name] || 0) + bonusPoints;
                    }
                }
            });
        });

        console.log(`🏆 CELKOVÉ BODY: ${totalPoints}`);
        console.log('📊 Rozpis bodů:', breakdown);

        // Výpočet průměru bodů na den (předpokládáme aktuální měsíc)
        const currentDate = new Date();
        const daysInMonth = currentDate.getDate(); // Počet dní od začátku měsíce
        const averagePerDay = daysInMonth > 0 ? Math.round(totalPoints / daysInMonth) : 0;

        console.log(`📅 Průměr na den: ${totalPoints} / ${daysInMonth} = ${averagePerDay} bodů`);

        // Aktualizovat UI prvky pro bodové hodnocení
        const totalPointsElement = document.getElementById('totalPoints');
        const averagePointsElement = document.getElementById('averagePointsPerDay');
        const pointsRankingElement = document.getElementById('pointsRanking');

        if (totalPointsElement) totalPointsElement.textContent = totalPoints;
        if (averagePointsElement) averagePointsElement.textContent = averagePerDay;
        if (pointsRankingElement) pointsRankingElement.textContent = '1'; // Hardcodované zatím

        // Uložit data pro zobrazení v tabulce
        this.pointsData = {
            totalPoints,
            totalItems,
            averagePerDay,
            breakdown,
            daysInMonth
        };
    }

    // UPRAVENÁ metoda z ProdejnyDataLoader - zobrazí filtrovaná data s podporou historie
    displayTable(headers, rows, isMonthly, isHistorical = false) {
        // Zpracuj data pro zobrazení - PŘEDEJ headers jako třetí parametr
        const processedData = this.processDataForDisplay(rows, isMonthly, headers);
        
        // Získej správné jméno uživatele
        const userName = this.getUserDisplayName();
        
        // Připravit text pro hlavičku podle typu dat
        let headerText, dateInfo;
        if (isHistorical && this.selectedHistoryDate) {
            headerText = `${this.escapeHtml(userName)} - Historická data`;
            dateInfo = `📅 ${this.formatDateForDisplay(this.selectedHistoryDate)}`;
        } else {
            headerText = `${this.escapeHtml(userName)} - ${isMonthly ? 'Aktuální měsíc' : 'Aktuální den'}`;
            dateInfo = null;
        }
        
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; profil_${isHistorical ? 'historical' : (isMonthly ? 'monthly' : 'current')}_${this.userSellerId}.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    ${isHistorical ? `
                        <div class="historical-notice" style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; text-align: center;">
                            <div style="font-size: 1.25rem; margin-bottom: 0.5rem;">📚 Historická data</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">${dateInfo}</div>
                        </div>
                    ` : ''}
                    
                    <div class="user-info" style="margin-bottom: 2rem;">
                        <h3>📊 ${headerText}</h3>
                        ${dateInfo && !isHistorical ? `<p><strong>Datum:</strong> ${dateInfo}</p>` : ''}
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

    // NOVÁ metoda - zobrazení bodové tabulky s podporou historie
    displayPointsTable(headers, rows, isHistorical = false) {
        if (!this.pointsData) {
            console.error('❌ Chybí pointsData pro zobrazení');
            return;
        }

        // Získej správné jméno uživatele
        const userName = this.getUserDisplayName();
        
        // Připravit text pro hlavičku podle typu dat
        let headerText, dateInfo;
        if (isHistorical && this.selectedHistoryDate) {
            headerText = `${this.escapeHtml(userName)} - Historické bodové hodnocení`;
            dateInfo = `📅 ${this.formatDateForDisplay(this.selectedHistoryDate)}`;
        } else {
            headerText = `${this.escapeHtml(userName)} - Bodové hodnocení za měsíc`;
            dateInfo = null;
        }
        
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; body_${isHistorical ? 'historical' : 'current'}_${this.userSellerId}.json_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    ${isHistorical ? `
                        <div class="historical-notice" style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; text-align: center;">
                            <div style="font-size: 1.25rem; margin-bottom: 0.5rem;">📚 Historické bodové hodnocení</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">${dateInfo}</div>
                        </div>
                    ` : ''}
                    
                    <div class="user-info" style="margin-bottom: 2rem;">
                        <h3>🏆 ${headerText}</h3>
                        ${dateInfo && !isHistorical ? `<p><strong>Datum:</strong> ${dateInfo}</p>` : ''}
                        <p><strong>ID prodejce:</strong> ${this.escapeHtml(this.userSellerId)}</p>
                        <p><strong>Celkové body:</strong> <span style="color: #2196F3; font-weight: bold; font-size: 1.2em;">${this.pointsData.totalPoints} bodů</span></p>
                        <p><strong>Průměr na den:</strong> ${this.pointsData.averagePerDay} bodů (za ${this.pointsData.daysInMonth} dní)</p>
                    </div>

                    <!-- Tabulka rozpisu bodů -->
                    <div class="table-scroll">
                        <h4 style="margin-bottom: 1rem; color: var(--primary-color);">📊 Rozpis bodového hodnocení</h4>
                        <table class="retro-sales-table" id="pointsBreakdownTable">
                            <thead>
                                <tr>
                                    <th>Kategorie</th>
                                    <th>Body za jednotku</th>
                                    <th>Získané body</th>
                                    <th>Podíl z celku</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generatePointsBreakdownRows()}
                            </tbody>
                        </table>
                    </div>

                    <!-- Popis bodového systému -->
                    <div style="margin-top: 2rem; padding: 1.5rem; background: var(--highlight-background, #f8f9fa); border-radius: 8px;">
                        <h4 style="margin-top: 0; color: var(--primary-color);">🎯 Bodovací systém</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.875rem;">
                            <div><strong>Základní body:</strong> 15 bodů za každou položku nad 100 Kč</div>
                            <div><strong>CT600:</strong> +35 bodů navíc</div>
                            <div><strong>CT1200:</strong> +85 bodů navíc</div>
                            <div><strong>NAP:</strong> +35 bodů navíc</div>
                            <div><strong>AKT:</strong> +15 bodů navíc</div>
                            <div><strong>PZ1:</strong> +85 bodů navíc</div>
                            <div><strong>ZAH250:</strong> +15 bodů navíc</div>
                            <div><strong>ZAH500:</strong> +35 bodů navíc</div>
                            <div><strong>KOP250:</strong> +15 bodů navíc</div>
                            <div><strong>KOP500:</strong> +35 bodů navíc</div>
                        </div>
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

    // Pomocná metoda pro generování řádků rozpisu bodů
    generatePointsBreakdownRows() {
        if (!this.pointsData || !this.pointsData.breakdown) {
            return '<tr><td colspan="4">Žádná data k zobrazení</td></tr>';
        }

        const { breakdown, totalPoints } = this.pointsData;
        
        // Mapování kategorií na body za jednotku
        const pointsPerUnit = {
            'Základní body': 15,
            'CT600': 35,
            'CT1200': 85,
            'NAP': 35,
            'AKT': 15,
            'PZ1': 85,
            'ZAH250': 15,
            'ZAH500': 35,
            'KOP250': 15,
            'KOP500': 35
        };

        let rows = '';
        
        // Seřadit podle počtu bodů (nejvíce bodů nahoru)
        const sortedBreakdown = Object.entries(breakdown)
            .sort(([,a], [,b]) => b - a)
            .filter(([,points]) => points > 0);

        if (sortedBreakdown.length === 0) {
            return '<tr><td colspan="4">Žádné body získány</td></tr>';
        }

        sortedBreakdown.forEach(([category, points]) => {
            const percentage = totalPoints > 0 ? Math.round((points / totalPoints) * 100) : 0;
            const unitPoints = pointsPerUnit[category] || '?';
            
            rows += `
                <tr>
                    <td><strong>${this.escapeHtml(category)}</strong></td>
                    <td class="numeric">${unitPoints}</td>
                    <td class="numeric" style="color: var(--primary-color); font-weight: bold;">${points}</td>
                    <td class="numeric">${percentage}%</td>
                </tr>
            `;
        });

        // Řádek s celkem
        rows += `
            <tr style="border-top: 2px solid var(--primary-color); background: var(--highlight-background, #f8f9fa); font-weight: bold;">
                <td><strong>CELKEM</strong></td>
                <td>-</td>
                <td class="numeric" style="color: var(--primary-color); font-size: 1.1em;">${totalPoints}</td>
                <td class="numeric">100%</td>
            </tr>
        `;

        return rows;
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
        // Pro body vždy načítáme měsíční data
        const shouldLoadMonthly = this.isPoints ? true : this.isMonthly;
        await this.loadData(shouldLoadMonthly);
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

    // Mock data metoda odstraněna - data se načítají pouze ze serveru

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
                            <p>Pro uživatele <strong>${this.escapeHtml(username)}</strong> s ID prodejce <strong>${this.escapeHtml(this.userSellerId)}</strong> nejsou v Google Sheets tabulce žádná ${isMonthly ? 'měsíční' : 'aktuální'} data.</p>
                            
                            <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 1.5rem; margin: 2rem 0; text-align: left;">
                                <h5 style="margin-top: 0; color: #495057;">🔧 Možné řešení:</h5>
                                <ul style="margin: 0; color: #6c757d; line-height: 1.6;">
                                    <li>Zkontrolujte, zda má uživatel v <strong>Správě uživatelů</strong> vyplněné <strong>ID prodejce</strong></li>
                                    <li>Ověřte, zda ID prodejce odpovídá sloupci <strong>"id_prodejce"</strong> v Google Sheets tabulce</li>
                                    <li>Ujistěte se, že v tabulce existuje sloupec s názvem <strong>"id_prodejce"</strong></li>
                                    <li>Ujistěte se, že Google Sheets tabulka obsahuje data pro tento měsíc</li>
                                    <li>Pro nového prodejce je potřeba přidat řádek do Google Sheets tabulky</li>
                                    <li><strong>Data se načítají pouze ze serveru</strong> - žádná lokální záložní data</li>
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
        console.log('=== DIAGNOSTIKA CHYBY NAČÍTÁNÍ ZE SERVERU ===');
        console.log('🔗 Google Apps Script URL:', this.scriptUrl);
        console.log('📋 Spreadsheet ID:', this.spreadsheetId);
        console.log('🆔 ID prodejce:', this.userSellerId);
        console.log('❌ Chyba:', error.message);
        console.log('');
        console.log('🔧 MOŽNÉ PŘÍČINY A ŘEŠENÍ:');
        console.log('1. Google Apps Script není nasazený nebo má špatnou URL');
        console.log('2. Google Sheets tabulka není veřejně přístupná');
        console.log('3. Sloupec "id_prodejce" neexistuje v tabulce');
        console.log('4. Uživatel s ID', this.userSellerId, 'není v tabulce');
        console.log('5. CORS problém - Google Apps Script musí povolit všechny domény');
        console.log('');
        console.log('✅ KONTROLNÍ SEZNAM:');
        console.log('- Otevřete Google Sheets tabulku ručně a zkontrolujte data');
        console.log('- Ověřte, že existuje sloupec "id_prodejce"');
        console.log('- Ověřte, že existuje řádek s ID prodejce:', this.userSellerId);
        console.log('- Zkontrolujte Google Apps Script deployment');
        
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; error_server_connection_${this.userSellerId}.log_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <div style="padding: 2rem; text-align: center; color: var(--error-color, #ff3333);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🚫</div>
                        <h3>Chyba při načítání dat ze serveru</h3>
                        <p>Nepodařilo se načíst data z Google Sheets tabulky.</p>
                        <p><strong>ID prodejce:</strong> ${this.escapeHtml(this.userSellerId)}</p>
                        
                        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1.5rem; margin: 2rem 0; text-align: left; color: #856404;">
                            <h5 style="margin-top: 0; color: #856404;">🔧 Možné příčiny problému:</h5>
                            <ul style="margin: 0; line-height: 1.6;">
                                <li><strong>Google Apps Script:</strong> Není nasazený nebo má špatnou URL</li>
                                <li><strong>Google Sheets:</strong> Tabulka není veřejně přístupná</li>
                                <li><strong>Sloupec "id_prodejce":</strong> Neexistuje v tabulce</li>
                                <li><strong>Data uživatele:</strong> ID prodejce ${this.escapeHtml(this.userSellerId)} není v tabulce</li>
                                <li><strong>CORS:</strong> Google Apps Script nepovoluje přístup z této domény</li>
                            </ul>
                        </div>
                        
                        <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 1.5rem; margin: 2rem 0; text-align: left; color: #155724;">
                            <h5 style="margin-top: 0; color: #155724;">✅ Kontrolní seznam:</h5>
                            <ul style="margin: 0; line-height: 1.6;">
                                <li>Otevřete Google Sheets tabulku ručně a zkontrolujte data</li>
                                <li>Ověřte, že existuje sloupec <strong>"id_prodejce"</strong></li>
                                <li>Ověřte, že existuje řádek s ID prodejce: <strong>${this.escapeHtml(this.userSellerId)}</strong></li>
                                <li>Zkontrolujte Google Apps Script deployment</li>
                                <li>Otevřite konzoli (F12) pro detailní informace</li>
                            </ul>
                        </div>
                        
                        <p style="font-size: 0.875rem; opacity: 0.7; margin-top: 1rem;">
                            <strong>Technická chyba:</strong> ${this.escapeHtml(error.message)}
                        </p>
                        
                        <div style="margin-top: 2rem;">
                            <button class="retro-refresh-btn" onclick="window.reloadUserProfileData && window.reloadUserProfileData()" style="margin-right: 1rem;">
                                🔄 ZKUSIT ZNOVU
                            </button>
                            <button class="retro-refresh-btn" onclick="window.open('https://sheets.google.com/d/${this.spreadsheetId}', '_blank')">
                                📊 OTEVŘÍT TABULKU
                            </button>
                        </div>
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

// 🛠️ ADMIN DEBUG FUNKCE - dostupné v konzoli
window.userProfileDebug = {
    // Zkontrolovat stav uživatele malek
    checkMalekUser: async function() {
        console.log('=== DEBUG UŽIVATELE MALEK ===');
        
        try {
            // Načti ze serveru
            console.log('🌐 Načítám uživatele ze serveru...');
            const response = await fetch('/api/users-github');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const users = data.users;
                    console.log(`✅ Načteno ${users.length} uživatelů ze serveru`);
                    
                    const malek = users.find(u => u.username === 'malek');
                    console.log('Uživatel malek:', malek);
                    
                    if (!malek) {
                        console.log('❌ Uživatel malek nenalezen na serveru!');
                        return false;
                    }
                    
                    if (!malek.customId) {
                        console.log('⚠️ Uživatel malek nemá customId, nastavujem ID 3...');
                        malek.customId = '3';
                        
                        // Ulož zpět na server
                        const saveResponse = await fetch('/api/users-github', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ users: users })
                        });
                        
                        if (saveResponse.ok) {
                            console.log('✅ CustomId uloženo na server');
                        }
                    }
                    
                    console.log('Finální stav malka:', malek);
                    console.log('LocalStorage sellerId:', localStorage.getItem('sellerId'));
                    console.log('LocalStorage username:', localStorage.getItem('username'));
                    
                    return true;
                }
            }
            
            throw new Error('Server nedostupný');
            
        } catch (error) {
            console.error('❌ Chyba při načítání ze serveru:', error);
            
            // Fallback na localStorage
            console.log('🔄 Fallback - čtu z localStorage...');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const malek = users.find(u => u.username === 'malek');
            
            console.log('Uživatel malek z localStorage:', malek);
            console.log('LocalStorage sellerId:', localStorage.getItem('sellerId'));
            console.log('LocalStorage username:', localStorage.getItem('username'));
            
            return !!malek;
        }
    },
    
    // Nastavit seller ID pro aktuálně přihlášeného uživatele
    setCurrentUserSellerId: function(newId) {
        localStorage.setItem('sellerId', String(newId));
        console.log(`✅ SellerId nastaven na: ${newId}`);
        
        // Reload profil data
        if (window.reloadUserProfileData) {
            window.reloadUserProfileData();
        }
    },
    
    // Zobrazit všechny uživatele ze serveru
    showAllUsers: async function() {
        try {
            console.log('🌐 Načítám uživatele ze serveru...');
            const response = await fetch('/api/users-github');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log(`✅ Načteno ${data.users.length} uživatelů ze serveru:`);
                    console.table(data.users.map(u => ({
                        username: u.username,
                        fullName: `${u.firstName} ${u.lastName}`,
                        customId: u.customId || 'NENÍ NASTAVENO',
                        systemId: u.id
                    })));
                    return data.users;
                }
            }
            
            throw new Error('Server nedostupný');
            
        } catch (error) {
            console.error('❌ Chyba při načítání ze serveru:', error);
            
            // Fallback na localStorage
            console.log('🔄 Fallback - čtu z localStorage...');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            console.table(users.map(u => ({
                username: u.username,
                fullName: `${u.firstName} ${u.lastName}`,
                customId: u.customId || 'NENÍ NASTAVENO',
                systemId: u.id
            })));
            return users;
        }
    }
};

// Dostupné v konzoli:
console.log('🛠️ DEBUG FUNKCE (aktualizováno pro server + body):');
console.log('userProfileDebug.checkMalekUser() - zkontroluje stav uživatele malek (ze serveru)');
console.log('userProfileDebug.setCurrentUserSellerId("3") - nastaví seller ID');  
console.log('userProfileDebug.showAllUsers() - zobrazí všechny uživatele (ze serveru)');
console.log('🏆 NOVÉ BODOVÁNÍ: Přidán tab "Aktuální body" s detailním rozpočtem bodů podle pravidel'); 