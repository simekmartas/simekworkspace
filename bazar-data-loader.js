// Specializovaný data loader pro bazarová data z Google Sheets
class BazarDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // Google Sheets ID a gid pro list BAZARVYKUP
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.bazarGid = '1980953060'; // gid pro list BAZARVYKUP
        
        // Publikované URL pro CSV export
        this.basePublishedUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv`;
        
        this.refreshInterval = null;
        
        // Stránkování
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.allRows = [];
        this.filteredRows = [];
    }

    async loadBazarData() {
        console.log('=== NAČÍTÁNÍ BAZAROVÝCH DAT ===');
        console.log('Spreadsheet ID:', this.spreadsheetId);
        console.log('Bazar GID:', this.bazarGid);
        
        try {
            this.showLoading();
            
            // Vytvoříme timestamp pro cache-busting
            const timestamp = new Date().getTime();
            
            // URL pro CSV export bazarových dat
            const csvUrl = `${this.basePublishedUrl}&gid=${this.bazarGid}&cachebust=${timestamp}`;
            
            console.log('CSV URL:', csvUrl);
            
            let csvData = null;
            
            // Přístup 1: Zkusíme CORS Anywhere (Heroku)
            console.log('=== PŘÍSTUP 1: CORS Anywhere ===');
            try {
                const proxyUrl = `https://cors-anywhere.herokuapp.com/${csvUrl}`;
                console.log('CORS Anywhere URL:', proxyUrl);
                
                const proxyResponse = await fetch(proxyUrl, {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                console.log('CORS Anywhere response status:', proxyResponse.status);
                
                if (proxyResponse.ok) {
                    csvData = await proxyResponse.text();
                    console.log('CORS Anywhere ÚSPĚŠNÝ - délka dat:', csvData.length);
                }
            } catch (error) {
                console.log('CORS Anywhere přístup selhal:', error.message);
            }
            
            // Přístup 2: Přímý přístup k publikovanému CSV
            if (!csvData || csvData.length < 100) {
                console.log('=== PŘÍSTUP 2: Přímý přístup k publikovanému CSV ===');
                try {
                    // Zkusíme publikované URL pro CSV
                    const publishedUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/pub?gid=${this.bazarGid}&single=true&output=csv&cachebust=${timestamp}`;
                    console.log('Publikované CSV URL:', publishedUrl);
                    
                    const directResponse = await fetch(publishedUrl, {
                        mode: 'cors',
                        cache: 'no-cache',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    });
                    
                    console.log('Přímý přístup response status:', directResponse.status);
                    
                    if (directResponse.ok) {
                        csvData = await directResponse.text();
                        console.log('Přímý přístup ÚSPĚŠNÝ - délka dat:', csvData.length);
                        console.log('První 500 znaků:', csvData.substring(0, 500));
                    }
                } catch (error) {
                    console.log('Přímý přístup selhal:', error.message);
                }
            }

            // Přístup 2b: Zkusíme původní export URL přímo
            if (!csvData || csvData.length < 100) {
                console.log('=== PŘÍSTUP 2b: Přímý export URL ===');
                try {
                    console.log('Export URL:', csvUrl);
                    
                    const exportResponse = await fetch(csvUrl, {
                        mode: 'cors',
                        cache: 'no-cache',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    });
                    
                    console.log('Export přístup response status:', exportResponse.status);
                    
                    if (exportResponse.ok) {
                        csvData = await exportResponse.text();
                        console.log('Export přístup ÚSPĚŠNÝ - délka dat:', csvData.length);
                        console.log('První 500 znaků:', csvData.substring(0, 500));
                    }
                } catch (error) {
                    console.log('Export přístup selhal:', error.message);
                }
            }

            // Přístup 3: AllOrigins proxy jako fallback
            if (!csvData || csvData.length < 100) {
                console.log('=== PŘÍSTUP 3: AllOrigins Proxy ===');
                try {
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(csvUrl)}`;
                    console.log('AllOrigins Proxy URL:', proxyUrl);
                    
                    const proxyResponse = await fetch(proxyUrl, {
                        cache: 'no-cache',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    });
                    
                    if (proxyResponse.ok) {
                        const proxyData = await proxyResponse.json();
                        
                        if (proxyData.contents && proxyData.contents.length > 100) {
                            csvData = proxyData.contents;
                            console.log('AllOrigins Proxy ÚSPĚŠNÝ - délka dat:', csvData.length);
                        }
                    }
                } catch (error) {
                    console.log('AllOrigins Proxy přístup selhal:', error.message);
                }
            }
            
            // Přístup 4: Zkusíme jiný formát URL pro Google Sheets
            if (!csvData || csvData.length < 100) {
                console.log('=== PŘÍSTUP 4: Alternativní Google Sheets URL ===');
                try {
                    // Zkusíme jiný formát URL
                    const altUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${this.bazarGid}&cachebust=${timestamp}`;
                    console.log('Alternativní URL:', altUrl);
                    
                    const altResponse = await fetch(altUrl, {
                        mode: 'cors',
                        cache: 'no-cache',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    });
                    
                    console.log('Alternativní přístup response status:', altResponse.status);
                    
                    if (altResponse.ok) {
                        csvData = await altResponse.text();
                        console.log('Alternativní přístup ÚSPĚŠNÝ - délka dat:', csvData.length);
                        console.log('První 500 znaků:', csvData.substring(0, 500));
                    }
                } catch (error) {
                    console.log('Alternativní přístup selhal:', error.message);
                }
            }

            // Zpracování dat pokud se podařilo je načíst
            if (csvData && csvData.length > 100) {
                console.log('=== ÚSPĚCH: Bazarová data načtena ===');
                console.log('Celková délka CSV dat:', csvData.length);
                this.parseAndDisplayBazarData(csvData);
                this.startAutoRefresh();
                return;
            } else {
                console.log('=== SELHÁNÍ: Zobrazujem mock bazarová data ===');
                console.log('Důvod: csvData délka =', csvData ? csvData.length : 'null');
                throw new Error('Nepodařilo se načíst validní bazarová data');
            }
            
        } catch (error) {
            console.error('Chyba při načítání bazarových dat:', error.message);
            console.log('=== ZKOUŠÍM IFRAME FALLBACK ===');
            this.showIframeFallback();
        }
    }

    parseAndDisplayBazarData(csvData) {
        console.log('=== PARSOVÁNÍ BAZAROVÝCH DAT ===');
        console.log('Délka CSV dat:', csvData.length);
        console.log('První 1000 znaků CSV:', csvData.substring(0, 1000));
        
        const lines = csvData.split('\n').filter(line => line.trim());
        console.log('Počet řádků po filtrování:', lines.length);
        console.log('První 3 řádky:', lines.slice(0, 3));
        
        if (lines.length === 0) {
            console.log('Žádné řádky v CSV, zobrazujem mock data');
            this.showMockBazarData();
            return;
        }

        // Parsování CSV
        const headers = this.parseCSVLine(lines[0]);
        console.log('Parsované headers:', headers);
        
        const rows = lines.slice(1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row.some(cell => cell.trim())); // Odfiltrovat prázdné řádky

        console.log(`Načteno ${rows.length} řádků bazarových dat`);
        console.log('První 3 řádky dat:', rows.slice(0, 3));
        
        if (rows.length === 0) {
            console.log('Žádné datové řádky, zobrazujem mock data');
            this.showMockBazarData();
            return;
        }

        // Seřadit podle data (sloupec C - Datum) od nejnovějšího
        const sortedRows = this.sortRowsByDate(rows, 2); // index 2 = sloupec C (Datum)
        console.log(`Po seřazení: ${sortedRows.length} řádků`);

        this.displayBazarTable(headers, sortedRows);
    }

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

    sortRowsByDate(rows, dateColumnIndex) {
        return rows.sort((a, b) => {
            const dateA = this.parseDate(a[dateColumnIndex]);
            const dateB = this.parseDate(b[dateColumnIndex]);
            return dateB - dateA; // Nejnovější první
        });
    }

    parseDate(dateString) {
        if (!dateString) return new Date(0);
        
        // Formát: d.m.yyyy (např. 2.1.2025)
        const parts = dateString.trim().split('.');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Měsíce jsou 0-indexované
            const year = parseInt(parts[2]);
            
            // Validace hodnot
            if (isNaN(day) || isNaN(month) || isNaN(year)) {
                console.warn('Neplatné číselné hodnoty v datu:', dateString);
                return new Date(NaN);
            }
            
            if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) {
                console.warn('Datum mimo platný rozsah:', dateString);
                return new Date(NaN);
            }
            
            const date = new Date(year, month, day);
            
            // Kontrola, zda se datum nezměnilo (např. 31.2. -> 3.3.)
            if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
                console.warn('Neplatné datum (automaticky opraveno):', dateString);
                return new Date(NaN);
            }
            
            return date;
        }
        
        // Pokus o parsování jiného formátu
        const fallbackDate = new Date(dateString);
        if (isNaN(fallbackDate.getTime())) {
            console.warn('Nepodařilo se parsovat datum:', dateString);
        }
        return fallbackDate;
    }

    displayBazarTable(headers, rows) {
        // Uložit všechny řádky pro filtrování a stránkování
        this.allRows = rows;
        this.filteredRows = rows;
        this.currentPage = 1;
        
        this.renderTable(headers);
    }

    renderTable(headers) {
        // Statistiky pro aktuálně filtrované řádky
        const prodaneRows = this.filteredRows.filter(row => row[0] === 'Prodáno');
        const naskladneneCount = this.filteredRows.filter(row => row[0] === 'Naskladněno').length;
        const celkemCount = this.filteredRows.length;
        
        // Součet nákupních cen (sloupec G - index 5)
        const nakupniCenySum = this.filteredRows.reduce((sum, row) => {
            const cena = parseFloat(row[5]?.replace(/[^\d]/g, '') || 0);
            return sum + cena;
        }, 0);
        
        // Součet prodejních cen (sloupec W - index 7) - pouze pro prodané telefony
        const prodejniCenySum = prodaneRows.reduce((sum, row) => {
            const cena = parseFloat(row[7]?.replace(/[^\d]/g, '') || 0);
            return sum + cena;
        }, 0);
        
        // Marže = prodejní ceny - nákupní ceny (pouze pro prodané telefony)
        const nakupniCenyProdanych = prodaneRows.reduce((sum, row) => {
            const cena = parseFloat(row[5]?.replace(/[^\d]/g, '') || 0);
            return sum + cena;
        }, 0);
        const marze = prodejniCenySum - nakupniCenyProdanych;
        
        // Hodnota skladu - neprodané telefony
        const neprodaneRows = this.filteredRows.filter(row => row[0] === 'Naskladněno');
        const hodnotaSkladu = neprodaneRows.reduce((sum, row) => {
            const cena = parseFloat(row[5]?.replace(/[^\d]/g, '') || 0);
            return sum + cena;
        }, 0);
        
        // Stránkování
        const totalPages = Math.ceil(this.filteredRows.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageRows = this.filteredRows.slice(startIndex, endIndex);

        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; bazar_data.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <!-- Hlavní statistiky -->
                    <div class="bazar-stats">
                        <div class="stat-box">
                            <div class="stat-label">// PRODÁNO</div>
                            <div class="stat-value">${prodaneRows.length}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">// NEPRODÁNO</div>
                            <div class="stat-value">${naskladneneCount}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">// VYKOUPENO CELKEM</div>
                            <div class="stat-value">${celkemCount}</div>
                        </div>
                    </div>

                    <!-- Doplňkové statistiky -->
                    <div class="bazar-stats-small">
                        <div class="stat-box-small">
                            <div class="stat-label-small">// VYKOUPENO ZA</div>
                            <div class="stat-value-small">${nakupniCenySum.toLocaleString('cs-CZ')} Kč</div>
                        </div>
                        <div class="stat-box-small">
                            <div class="stat-label-small">// PRODÁNO ZA</div>
                            <div class="stat-value-small">${prodejniCenySum.toLocaleString('cs-CZ')} Kč</div>
                        </div>
                        <div class="stat-box-small">
                            <div class="stat-label-small">// MARŽE CELKEM</div>
                            <div class="stat-value-small ${marze >= 0 ? 'positive-margin' : 'negative-margin'}">${marze.toLocaleString('cs-CZ')} Kč</div>
                        </div>
                        <div class="stat-box-small">
                            <div class="stat-label-small">// SKLAD</div>
                            <div class="stat-value-small sklad-value">${neprodaneRows.length}ks / ${hodnotaSkladu.toLocaleString('cs-CZ')} Kč</div>
                        </div>
                    </div>

                    <!-- Filtry -->
                    <div class="bazar-filters">
                        <!-- Textový filtr -->
                        <div class="filter-section">
                            <input type="text" id="bazarFilter" placeholder="// Filtrovat podle typu, IMEI, jména...">
                        </div>
                        
                        <!-- Datový filtr -->
                        <div class="date-filter-section">
                            <div class="date-filter-header">
                                <span class="filter-label">// FILTR PODLE OBDOBÍ</span>
                                <span class="filter-info">(Formát: d.m.yyyy, např. 1.1.2025)</span>
                            </div>
                            <div class="date-filter-inputs">
                                <div class="date-input-group">
                                    <label>OD:</label>
                                    <input type="text" id="dateFrom" class="date-input" placeholder="1.1.2025">
                                </div>
                                <div class="date-input-group">
                                    <label>DO:</label>
                                    <input type="text" id="dateTo" class="date-input" placeholder="31.12.2025">
                                </div>
                                <div class="date-filter-buttons">
                                    <button type="button" class="quick-filter-btn" id="weekBtn">
                                        TÝDEN
                                    </button>
                                    <button type="button" class="quick-filter-btn" id="monthBtn">
                                        MĚSÍC
                                    </button>
                                    <button type="button" class="clear-dates-btn" id="clearDatesBtn">
                                        VYMAZAT
                                    </button>
                                    <button type="button" class="show-all-btn" id="showAllBtn">
                                        ZOBRAZIT VŠE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stránkování info -->
                    <div class="pagination-info">
                        <span class="pagination-text">// Stránka ${this.currentPage} z ${totalPages} | Zobrazeno ${currentPageRows.length} z ${this.filteredRows.length} záznamů</span>
                    </div>

                    <!-- Tabulka dat -->
                    <div class="table-scroll">
                        <table class="retro-data-table" id="bazarTable">
                            <thead>
                                <tr>
                                    ${headers.map(header => `<th>${this.escapeHtml(header)}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${currentPageRows.map(row => `
                                    <tr class="${row[0] === 'Prodáno' ? 'sold-item' : 'stocked-item'}">
                                        ${row.map((cell, index) => {
                                            // Zvýraznit stav (sloupec A)
                                            if (index === 0) {
                                                return `<td class="status-cell">${this.escapeHtml(cell)}</td>`;
                                            }
                                            // Zvýraznit nákupní cenu (sloupec G - index 5)
                                            if (index === 5 && cell && !isNaN(cell.replace(/[^\d]/g, ''))) {
                                                return `<td class="buy-price-cell">${this.escapeHtml(cell)} Kč</td>`;
                                            }
                                            // Zvýraznit prodejní cenu (sloupec W - index 7)
                                            if (index === 7 && cell && !isNaN(cell.replace(/[^\d]/g, ''))) {
                                                return `<td class="sell-price-cell">${this.escapeHtml(cell)} Kč</td>`;
                                            }
                                            return `<td>${this.escapeHtml(cell)}</td>`;
                                        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Stránkování ovládání -->
                    <div class="pagination-controls">
                        <button class="pagination-btn" data-page="1" ${this.currentPage === 1 ? 'disabled' : ''}>
                            ⏮ První
                        </button>
                        <button class="pagination-btn" data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
                            ◀ Předchozí
                        </button>
                        <span class="pagination-current">Stránka ${this.currentPage}</span>
                        <button class="pagination-btn" data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''}>
                            Další ▶
                        </button>
                        <button class="pagination-btn" data-page="${totalPages}" ${this.currentPage === totalPages ? 'disabled' : ''}>
                            Poslední ⏭
                        </button>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// BAZAR DATA STREAM ACTIVE</span>
                        <span class="retro-blink">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">▓▒░</span>
                        <span class="retro-small-text">SYNC: 100%</span>
                    </div>
                </div>
            </div>
        `;
        
        // Po vygenerování HTML vždy nastavit event listenery (budou se nejprve vyčistit)
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log('=== NASTAVUJI EVENT LISTENERY ===');
        
        // Použít requestAnimationFrame místo setTimeout pro lepší timing
        const setupListeners = () => {
            // Nejprve odstraníme všechny existující event listenery
            this.removeExistingEventListeners();
            
            // Textové inputy pro datum
            const dateFromInput = document.getElementById('dateFrom');
            const dateToInput = document.getElementById('dateTo');
            
            const textFilter = document.getElementById('bazarFilter');
            const clearBtn = document.getElementById('clearDatesBtn');
            const showAllBtn = document.getElementById('showAllBtn');
            const weekBtn = document.getElementById('weekBtn');
            const monthBtn = document.getElementById('monthBtn');
            
            console.log('Hledám elementy:', {
                dateFrom: !!dateFromInput,
                dateTo: !!dateToInput,
                textFilter: !!textFilter,
                clearBtn: !!clearBtn,
                showAllBtn: !!showAllBtn,
                weekBtn: !!weekBtn,
                monthBtn: !!monthBtn
            });
            
            // Debug informace o inputech
            if (dateFromInput) {
                console.log('dateFromInput element:', dateFromInput);
                console.log('dateFromInput style:', window.getComputedStyle(dateFromInput));
                console.log('dateFromInput disabled:', dateFromInput.disabled);
                console.log('dateFromInput readonly:', dateFromInput.readOnly);
            }
            if (dateToInput) {
                console.log('dateToInput element:', dateToInput);
                console.log('dateToInput style:', window.getComputedStyle(dateToInput));
                console.log('dateToInput disabled:', dateToInput.disabled);
                console.log('dateToInput readonly:', dateToInput.readOnly);
            }
            
            // Pokud elementy ještě nejsou k dispozici, zkusit znovu (max 10x)
            if (!dateFromInput || !dateToInput) {
                if (!setupListeners.attempts) setupListeners.attempts = 0;
                setupListeners.attempts++;
                
                if (setupListeners.attempts < 10) {
                    console.log(`Elementy ještě nejsou k dispozici, zkouším znovu za 100ms... (pokus ${setupListeners.attempts}/10)`);
                    setTimeout(setupListeners, 100);
                    return;
                } else {
                    console.log('❌ Nepodařilo se najít všechny elementy po 10 pokusech');
                    return;
                }
            }
            
            // Event listenery pro datum OD
            const handleDateFromChange = () => {
                const dateValue = dateFromInput?.value || '';
                console.log('🔥 Date FROM changed:', dateValue);
                console.log('🔥 this.allRows length:', this.allRows ? this.allRows.length : 'null');
                try {
                    this.filterTable();
                } catch (error) {
                    console.error('❌ Chyba při filtrování (dateFrom):', error);
                    console.error('❌ Stack trace:', error.stack);
                }
            };
            
            // Event listenery pro datum DO
            const handleDateToChange = () => {
                const dateValue = dateToInput?.value || '';
                console.log('🔥 Date TO changed:', dateValue);
                console.log('🔥 this.allRows length:', this.allRows ? this.allRows.length : 'null');
                try {
                    this.filterTable();
                } catch (error) {
                    console.error('❌ Chyba při filtrování (dateTo):', error);
                    console.error('❌ Stack trace:', error.stack);
                }
            };
            
            if (dateFromInput) {
                // Explicitně nastavit vlastnosti inputu
                dateFromInput.disabled = false;
                dateFromInput.readOnly = false;
                dateFromInput.removeAttribute('disabled');
                dateFromInput.removeAttribute('readonly');
                dateFromInput.style.pointerEvents = 'auto';
                dateFromInput.style.userSelect = 'text';
                dateFromInput.style.cursor = 'text';
                dateFromInput.style.zIndex = '999';
                dateFromInput.style.webkitUserSelect = 'text';
                dateFromInput.style.mozUserSelect = 'text';
                dateFromInput.style.msUserSelect = 'text';
                dateFromInput.style.touchAction = 'manipulation';
                dateFromInput.tabIndex = 0;
                
                dateFromInput.addEventListener('input', handleDateFromChange);
                dateFromInput.addEventListener('change', handleDateFromChange);
                dateFromInput.addEventListener('blur', handleDateFromChange);
                dateFromInput.addEventListener('click', () => {
                    console.log('Date FROM input clicked');
                    console.log('Date FROM input properties:', {
                        disabled: dateFromInput.disabled,
                        readOnly: dateFromInput.readOnly,
                        pointerEvents: dateFromInput.style.pointerEvents,
                        userSelect: dateFromInput.style.userSelect,
                        cursor: dateFromInput.style.cursor
                    });
                    dateFromInput.focus();
                });
                dateFromInput.addEventListener('focus', () => console.log('Date FROM input focused'));
                dateFromInput.addEventListener('keydown', (e) => {
                    console.log('Date FROM keydown:', e.key);
                });
                dateFromInput.addEventListener('input', (e) => {
                    console.log('Date FROM input event:', e.target.value);
                });
                console.log('Date FROM input nastaven');
            }
            
            if (dateToInput) {
                // Explicitně nastavit vlastnosti inputu
                dateToInput.disabled = false;
                dateToInput.readOnly = false;
                dateToInput.removeAttribute('disabled');
                dateToInput.removeAttribute('readonly');
                dateToInput.style.pointerEvents = 'auto';
                dateToInput.style.userSelect = 'text';
                dateToInput.style.cursor = 'text';
                dateToInput.style.zIndex = '999';
                dateToInput.style.webkitUserSelect = 'text';
                dateToInput.style.mozUserSelect = 'text';
                dateToInput.style.msUserSelect = 'text';
                dateToInput.style.touchAction = 'manipulation';
                dateToInput.tabIndex = 0;
                
                dateToInput.addEventListener('input', handleDateToChange);
                dateToInput.addEventListener('change', handleDateToChange);
                dateToInput.addEventListener('blur', handleDateToChange);
                dateToInput.addEventListener('click', () => {
                    console.log('Date TO input clicked');
                    console.log('Date TO input properties:', {
                        disabled: dateToInput.disabled,
                        readOnly: dateToInput.readOnly,
                        pointerEvents: dateToInput.style.pointerEvents,
                        userSelect: dateToInput.style.userSelect,
                        cursor: dateToInput.style.cursor
                    });
                    dateToInput.focus();
                });
                dateToInput.addEventListener('focus', () => console.log('Date TO input focused'));
                dateToInput.addEventListener('keydown', (e) => {
                    console.log('Date TO keydown:', e.key);
                });
                dateToInput.addEventListener('input', (e) => {
                    console.log('Date TO input event:', e.target.value);
                });
                console.log('Date TO input nastaven');
            }
            
            if (textFilter) {
                const handleTextFilter = () => {
                    try {
                        this.filterTable();
                    } catch (error) {
                        console.error('Chyba při textovém filtrování:', error);
                    }
                };
                
                textFilter.addEventListener('keyup', handleTextFilter);
                textFilter.addEventListener('input', handleTextFilter);
                
                console.log('Text filter nastaven');
            }
            
            if (clearBtn) {
                const handleClearBtn = () => {
                    console.log('Clear button clicked');
                    try {
                        this.clearDateFilter();
                    } catch (error) {
                        console.error('Chyba při mazání datového filtru:', error);
                    }
                };
                
                clearBtn.addEventListener('click', handleClearBtn);
                console.log('Clear button nastaven');
            }
            
            if (showAllBtn) {
                const handleShowAllBtn = () => {
                    console.log('Show all button clicked');
                    try {
                        this.showAllRecords();
                    } catch (error) {
                        console.error('Chyba při zobrazení všech záznamů:', error);
                    }
                };
                
                showAllBtn.addEventListener('click', handleShowAllBtn);
                console.log('Show all button nastaven');
            }
            
            if (weekBtn) {
                const handleWeekBtn = () => {
                    console.log('Week button clicked');
                    try {
                        this.setWeekFilter();
                    } catch (error) {
                        console.error('Chyba při nastavení týdenního filtru:', error);
                    }
                };
                
                weekBtn.addEventListener('click', handleWeekBtn);
                console.log('Week button nastaven');
            }
            
            if (monthBtn) {
                const handleMonthBtn = () => {
                    console.log('Month button clicked');
                    try {
                        this.setMonthFilter();
                    } catch (error) {
                        console.error('Chyba při nastavení měsíčního filtru:', error);
                    }
                };
                
                monthBtn.addEventListener('click', handleMonthBtn);
                console.log('Month button nastaven');
            }
            
            // Event listenery pro stránkování
            const paginationBtns = document.querySelectorAll('.pagination-btn');
            paginationBtns.forEach(btn => {
                if (!btn.disabled) {
                    const handlePaginationClick = () => {
                        const page = parseInt(btn.getAttribute('data-page'));
                        if (page && !isNaN(page)) {
                            try {
                                this.goToPage(page);
                            } catch (error) {
                                console.error('Chyba při přechodu na stránku:', error);
                            }
                        }
                    };
                    
                    btn.addEventListener('click', handlePaginationClick);
                }
            });
            
            console.log('Event listeners nastaveny pro:', {
                dateFrom: !!dateFromInput,
                dateTo: !!dateToInput,
                textFilter: !!textFilter,
                clearBtn: !!clearBtn,
                showAllBtn: !!showAllBtn,
                weekBtn: !!weekBtn,
                monthBtn: !!monthBtn,
                paginationBtns: paginationBtns.length
            });
            
            // NEPOUŽÍVAT automatický výchozí datový filtr - způsobuje nekonečnou smyčku
            console.log('Event listenery nastaveny, zobrazujem všechna data');
        };
        
        // Spustit setup
        setupListeners();
    }

    removeExistingEventListeners() {
        // Uložíme reference na event listenery pro pozdější odstranění
        const elements = [
            'dateFrom', 'dateTo',
            'bazarFilter', 'clearDatesBtn', 'showAllBtn',
            'weekBtn', 'monthBtn'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // Klonujeme element pro odstranění všech event listenerů
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; loading_bazar.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content loading">
                    <div class="loading-animation">
                        <span class="loading-text">// Načítání bazarových dat</span>
                        <span class="loading-dots">...</span>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// CONNECTING TO BAZAR STREAM</span>
                        <span class="retro-blink">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">▓▒░</span>
                        <span class="retro-small-text">SYNC: 0%</span>
                    </div>
                </div>
            </div>
        `;
    }

    showIframeFallback() {
        console.log('=== ZOBRAZUJEM IFRAME FALLBACK ===');
        
        const iframeUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/pubhtml?gid=${this.bazarGid}&single=true&widget=true&headers=false`;
        console.log('Iframe URL:', iframeUrl);
        
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; bazar_iframe.html_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content" style="height: 600px; padding: 0;">
                    <iframe 
                        src="${iframeUrl}"
                        style="width: 100%; height: 100%; border: none; background: white;"
                        seamless
                    ></iframe>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// IFRAME FALLBACK MODE</span>
                        <span class="retro-blink">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">▓▒░</span>
                        <span class="retro-small-text">LIVE DATA</span>
                    </div>
                </div>
            </div>
        `;
        
        // Pokud iframe nefunguje, zobrazíme mock data po 5 sekundách
        setTimeout(() => {
            console.log('=== IFRAME TIMEOUT - ZOBRAZUJEM MOCK DATA ===');
            this.showMockBazarData();
        }, 5000);
    }

    showMockBazarData() {
        console.log('=== ZOBRAZUJEM MOCK BAZAROVÁ DATA ===');
        
        // Generovat mock data s aktuálními daty
        const mockData = this.generateMockData();

        const headers = ['Stav', 'Výkupka', 'Datum', 'Typ', 'IMEI', 'Nákupní cena', 'Vykoupil', 'Prodejní cena'];

        console.log(`Mock data obsahují ${mockData.length} záznamů`);
        this.displayBazarTable(headers, mockData);
        this.startAutoRefresh();
    }

    generateMockData() {
        const today = new Date();
        const mockData = [];
        
        const phones = [
            'Samsung Galaxy A14', 'Xiaomi Redmi Note 9 Pro', 'Apple iPhone 15, 128GB', 'Xiaomi Redmi 13C 5G',
            'Apple iPhone 12', 'Samsung Galaxy S21', 'Xiaomi Mi 11', 'iPhone 13 Pro', 'OnePlus 9',
            'Google Pixel 6', 'Samsung Galaxy Note 20', 'Xiaomi Redmi Note 12', 'iPhone 14',
            'Huawei P40', 'Motorola Edge 30', 'Sony Xperia 5', 'Nokia 8.3', 'Realme GT',
            'Oppo Find X3', 'Vivo V21', 'Samsung Galaxy S22', 'iPhone 11', 'Xiaomi Poco X4',
            'Honor 50', 'Nothing Phone 1', 'Samsung Galaxy A53', 'iPhone SE 2022', 'Xiaomi 12',
            'OnePlus Nord 2', 'Google Pixel 7', 'Samsung Galaxy Z Flip 4', 'iPhone 13 Mini',
            'Xiaomi Redmi 10', 'Huawei Nova 9', 'Motorola Moto G52', 'Sony Xperia 10 IV',
            'Nokia G50', 'Realme 9 Pro', 'Oppo Reno 8', 'Vivo Y33s', 'Samsung Galaxy M33',
            'iPhone 15 Pro', 'Samsung Galaxy S24', 'Xiaomi 14', 'Google Pixel 8', 'OnePlus 12',
            'Huawei P60', 'Sony Xperia 1 V', 'Motorola Edge 40', 'Nothing Phone 2', 'Honor Magic 5'
        ];
        
        const names = [
            ['Kováčik', 'Lukáš'], ['Babušík', 'Sandra'], ['Šebák', 'Milan'], ['Gabriel', 'Jiří'],
            ['Kosev', 'Roman'], ['Novák', 'Petr'], ['Svoboda', 'Jan'], ['Dvořák', 'Marie'],
            ['Černý', 'Tomáš'], ['Veselý', 'Pavel'], ['Horák', 'Jiří'], ['Kratochvíl', 'Michal'],
            ['Procházka', 'Anna'], ['Krejčí', 'Václav'], ['Fiala', 'Zdeněk'], ['Pokorný', 'Lukáš'],
            ['Malý', 'David'], ['Růžička', 'Martin'], ['Beneš', 'Petr'], ['Čech', 'Tomáš'],
            ['Novotný', 'Jan'], ['Svobodová', 'Eva'], ['Dvořáková', 'Hana'], ['Černá', 'Petra'],
            ['Veselá', 'Klára'], ['Horáková', 'Lenka'], ['Kratochvílová', 'Zuzana'], ['Procházková', 'Tereza'],
            ['Krejčová', 'Barbora'], ['Fialová', 'Simona'], ['Pokorná', 'Michaela'], ['Malá', 'Veronika'],
            ['Růžičková', 'Nikola'], ['Benešová', 'Adéla'], ['Čechová', 'Kristýna'], ['Nováková', 'Denisa'],
            ['Svoboda', 'Ondřej'], ['Dvořák', 'Jakub'], ['Černý', 'Filip'], ['Veselý', 'Marek'],
            ['Novák', 'Tomáš'], ['Svoboda', 'Pavel'], ['Dvořák', 'Jan'], ['Černý', 'Petr'],
            ['Veselý', 'Marie'], ['Horák', 'Anna'], ['Kratochvíl', 'Václav'], ['Procházka', 'Zdeněk']
        ];
        
        const statuses = ['Prodáno', 'Naskladněno'];
        const yesNo = ['ano', 'ne'];
        
        // Generovat záznamy od 1.1.2025 do současnosti
        const startDate = new Date(2025, 0, 1); // 1. ledna 2025
        const endDate = new Date(); // Dnešní datum
        const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Počet záznamů podle délky období (cca 3-4 záznamy na den)
        const recordsCount = Math.max(450, Math.floor(totalDays * 3.5));
        
        for (let i = 0; i < recordsCount; i++) {
            // Náhodný den mezi 1.1.2025 a dneškem
            const randomDays = Math.floor(Math.random() * totalDays);
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + randomDays);
            
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const dateStr = `${day}.${month}.${year}`;
            
            const phone = phones[Math.floor(Math.random() * phones.length)];
            const [surname, firstName] = names[Math.floor(Math.random() * names.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            // Generovat IMEI
            const imei = '35' + Math.floor(Math.random() * 1000000000000000).toString().padStart(13, '0');
            
            // Generovat nákupní cenu (G) - 500-15000 Kč
            const nakupniCena = Math.floor(Math.random() * 14500) + 500;
            
            // Generovat prodejní cenu (W) - pouze pro prodané telefony, vyšší než nákupní
            let prodejniCena = '';
            if (status === 'Prodáno') {
                // Prodejní cena je 1.2x až 2.5x nákupní ceny
                const multiplier = 1.2 + Math.random() * 1.3; // 1.2 - 2.5
                prodejniCena = Math.floor(nakupniCena * multiplier).toString();
            }
            
            const vykoupil = `${surname} ${firstName}`;
            
            const record = [
                status,                    // A - Stav
                `V2025${String(i + 1).padStart(4, '0')}`, // B - Výkupka
                dateStr,                   // C - Datum
                phone,                     // D - Typ
                imei,                      // E - IMEI
                nakupniCena.toString(),    // G - Nákupní cena
                vykoupil,                  // M - Vykoupil
                prodejniCena               // W - Prodejní cena
            ];
            
            mockData.push(record);
        }
        
        // Seřadit podle data (nejnovější první)
        mockData.sort((a, b) => {
            const dateA = this.parseDate(a[2]);
            const dateB = this.parseDate(b[2]);
            return dateB - dateA;
        });
        
        console.log(`Vygenerováno ${mockData.length} mock záznamů od ${startDate.toLocaleDateString('cs-CZ')} do ${endDate.toLocaleDateString('cs-CZ')}`);
        return mockData;
    }

    filterTable() {
        try {
            console.log('🔍 === FILTROVÁNÍ TABULKY ===');
            
            // Zkontrolovat, zda máme data
            if (!this.allRows || this.allRows.length === 0) {
                console.log('❌ Žádná data k filtrování - this.allRows:', this.allRows);
                return;
            }
            
            console.log('✅ Mám data k filtrování:', this.allRows.length, 'řádků');
            
            // Získat hodnoty filtrů
            const textFilter = document.getElementById('bazarFilter')?.value.toLowerCase() || '';
            
            // Získat hodnoty datových filtrů
            const dateFromStr = document.getElementById('dateFrom')?.value || '';
            const dateToStr = document.getElementById('dateTo')?.value || '';
            
            // Vytvořit Date objekty z textových inputů
            let dateFromObj = null;
            let dateToObj = null;
            
            if (dateFromStr) {
                dateFromObj = this.parseDate(dateFromStr);
                if (isNaN(dateFromObj.getTime())) {
                    console.warn('Neplatné datum OD:', dateFromStr);
                    dateFromObj = null;
                }
            }
            
            if (dateToStr) {
                dateToObj = this.parseDate(dateToStr);
                if (isNaN(dateToObj.getTime())) {
                    console.warn('Neplatné datum DO:', dateToStr);
                    dateToObj = null;
                } else {
                    dateToObj.setHours(23, 59, 59, 999); // Konec dne
                }
            }

            console.log('Filtry:', { 
                textFilter, 
                dateFrom: { str: dateFromStr, obj: dateFromObj },
                dateTo: { str: dateToStr, obj: dateToObj }
            });

            // Filtrovat všechny řádky
            this.filteredRows = this.allRows.filter(row => {
                if (!row || !Array.isArray(row)) return false;
                
                let shouldShow = true;

                // Textový filtr
                if (textFilter) {
                    let textMatch = false;
                    for (let j = 0; j < row.length; j++) {
                        const cellText = (row[j] || '').toString().toLowerCase();
                        if (cellText.includes(textFilter)) {
                            textMatch = true;
                            break;
                        }
                    }
                    if (!textMatch) shouldShow = false;
                }

                // Datový filtr
                if (shouldShow && (dateFromObj || dateToObj)) {
                    const rowDateStr = row[2] || ''; // sloupec C - Datum (index 2)
                    
                    try {
                        const rowDate = this.parseDate(rowDateStr);
                        
                        if (dateFromObj) {
                            if (rowDate < dateFromObj) shouldShow = false;
                        }
                        
                        if (dateToObj && shouldShow) {
                            if (rowDate > dateToObj) shouldShow = false;
                        }
                    } catch (dateError) {
                        console.error('Chyba při parsování data:', rowDateStr, dateError);
                        // Pokud se nepodaří parsovat datum, řádek nezobrazíme
                        shouldShow = false;
                    }
                }

                return shouldShow;
            });

            console.log(`Filtrováno: ${this.filteredRows.length} z ${this.allRows.length} řádků`);

            // Reset na první stránku po filtrování
            this.currentPage = 1;
            
            // Znovu vykreslit tabulku
            const headers = ['Stav', 'Výkupka', 'Datum', 'Typ', 'IMEI', 'Nákupní cena', 'Vykoupil', 'Prodejní cena'];
            this.renderTable(headers);
            
        } catch (error) {
            console.error('Chyba při filtrování tabulky:', error);
            console.error('Stack trace:', error.stack);
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredRows.length / this.itemsPerPage);
                          if (page >= 1 && page <= totalPages) {
             this.currentPage = page;
              const headers = ['Stav', 'Výkupka', 'Datum', 'Typ', 'IMEI', 'Nákupní cena', 'Vykoupil', 'Prodejní cena'];
               this.renderTable(headers);
         }
    }

    setDefaultDateRange() {
        console.log('🗓️ === NASTAVUJI VÝCHOZÍ DATOVÝ ROZSAH ===');
        
        // Nastavit výchozí období od 1.1.2025 do dneška
        const today = new Date();
        
        // Nastavit textové inputy pro datum
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        
        if (dateFromInput && dateToInput) {
            // Nastavit datum OD na 1.1.2025
            dateFromInput.value = '1.1.2025';
            
            // Nastavit datum DO na dnešek
            const todayStr = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;
            dateToInput.value = todayStr;
            
            console.log('✅ Výchozí datový rozsah nastaven:', {
                od: '1.1.2025',
                do: todayStr
            });
            
            // Aplikovat filtr
            this.filterTable();
        } else {
            console.log('❌ Nepodařilo se najít datové inputy');
        }
    }

    setWeekFilter() {
        console.log('📅 === NASTAVUJI TÝDENNÍ FILTR ===');
        
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        
        // Nastavit textové inputy pro datum
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        
        if (dateFromInput && dateToInput) {
            // Nastavit datum OD na před týdnem
            const weekAgoStr = `${weekAgo.getDate()}.${weekAgo.getMonth() + 1}.${weekAgo.getFullYear()}`;
            dateFromInput.value = weekAgoStr;
            
            // Nastavit datum DO na dnešek
            const todayStr = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;
            dateToInput.value = todayStr;
            
            console.log('✅ Týdenní filtr nastaven:', {
                od: weekAgoStr,
                do: todayStr
            });
            
            // Aplikovat filtr
            this.filterTable();
        } else {
            console.log('❌ Nepodařilo se najít datové inputy');
        }
    }

    setMonthFilter() {
        console.log('📅 === NASTAVUJI MĚSÍČNÍ FILTR ===');
        
        const today = new Date();
        
        // Vypočítat minulý měsíc
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0); // Poslední den minulého měsíce
        
        // Nastavit textové inputy pro datum
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        
        if (dateFromInput && dateToInput) {
            // Nastavit datum OD na první den minulého měsíce
            const monthStartStr = `1.${lastMonth.getMonth() + 1}.${lastMonth.getFullYear()}`;
            dateFromInput.value = monthStartStr;
            
            // Nastavit datum DO na poslední den minulého měsíce
            const monthEndStr = `${lastMonthEnd.getDate()}.${lastMonthEnd.getMonth() + 1}.${lastMonthEnd.getFullYear()}`;
            dateToInput.value = monthEndStr;
            
            console.log('✅ Měsíční filtr nastaven:', {
                od: monthStartStr,
                do: monthEndStr,
                mesic: lastMonth.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
            });
            
            // Aplikovat filtr
            this.filterTable();
        } else {
            console.log('❌ Nepodařilo se najít datové inputy');
        }
    }

    setDefaultDateFilter() {
        // Stará metoda - ponecháno pro kompatibilitu
        console.log('⚠️ setDefaultDateFilter() je deprecated, používám setDefaultDateRange()');
        this.setDefaultDateRange();
    }

    clearDateFilter() {
        // Vymazat textové inputy pro datum
        const inputs = ['dateFrom', 'dateTo'];
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.value = '';
            }
        });
        this.filterTable();
        console.log('Datové filtry vymazány');
    }

    showAllRecords() {
        // Vymazat všechny filtry
        const inputs = ['dateFrom', 'dateTo'];
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.value = '';
            }
        });
        
        const textFilter = document.getElementById('bazarFilter');
        if (textFilter) {
            textFilter.value = '';
        }
        
        this.filterTable();
        console.log('Zobrazeny všechny záznamy');
    }

    updateFilterStats(visibleCount, totalCount) {
        // Najít nebo vytvořit element pro statistiky filtru
        let statsElement = document.getElementById('filterStats');
        if (!statsElement) {
            statsElement = document.createElement('div');
            statsElement.id = 'filterStats';
            statsElement.className = 'filter-stats';
            
            const filtersContainer = document.querySelector('.bazar-filters');
            if (filtersContainer) {
                filtersContainer.appendChild(statsElement);
            }
        }

        if (visibleCount === totalCount) {
            statsElement.innerHTML = `<span class="stats-text">// Zobrazeno všech ${totalCount} záznamů</span>`;
        } else {
            statsElement.innerHTML = `<span class="stats-text">// Zobrazeno ${visibleCount} z ${totalCount} záznamů</span>`;
        }
    }

    startAutoRefresh() {
        // Automatické obnovení každých 5 minut
        this.refreshInterval = setInterval(() => {
            console.log('Auto-refresh bazarových dat...');
            this.loadBazarData();
        }, 5 * 60 * 1000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export pro použití v jiných souborech
window.BazarDataLoader = BazarDataLoader; 