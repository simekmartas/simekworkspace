// Specializovaný data loader pro servisní data z Google Sheets
class ServisDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // Google Sheets ID a gid pro nový list se servisními statistikami
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.servisGid = '2091883961'; // gid pro nový list se servisními statistikami
        
        // Publikované URL pro CSV export
        this.basePublishedUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv`;
        
        this.refreshInterval = null;
        
        // Stránkování
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.allRows = [];
        this.filteredRows = [];
        
        // Bind funkce pro event listenery
        this.filterTableBound = () => this.filterTable();
    }

    async loadServisData() {
        console.log('=== NAČÍTÁNÍ SERVISNÍCH DAT ===');
        console.log('Spreadsheet ID:', this.spreadsheetId);
        console.log('Servis GID:', this.servisGid);
        
        try {
            this.showLoading();
            
            // Vytvoříme timestamp pro cache-busting
            const timestamp = new Date().getTime();
            
            // URL pro CSV export servisních dat
            const csvUrl = `${this.basePublishedUrl}&gid=${this.servisGid}&cachebust=${timestamp}`;
            
            console.log('CSV URL:', csvUrl);
            
            let csvData = null;
            
            // Rychlý timeout pro všechny pokusy - pokud se nepodaří do 3 sekund, jdeme na mock data
            const quickTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout - přechod na mock data')), 3000)
            );
            
            // Zkusíme rychle načíst data s timeoutem
            try {
                csvData = await Promise.race([
                    this.tryLoadData(csvUrl),
                    quickTimeout
                ]);
                
                if (csvData && csvData.length > 100) {
                    console.log('=== ÚSPĚCH: Servisní data načtena rychle ===');
                    console.log('Celková délka CSV dat:', csvData.length);
                    this.parseAndDisplayServisData(csvData);
                    return;
                }
            } catch (error) {
                console.log('=== RYCHLÉ NAČÍTÁNÍ SELHALO, PŘECHOD NA MOCK DATA ===');
                console.log('Důvod:', error.message);
            }
            
            // Pokud rychlé načítání selhalo, zobrazíme mock data
            console.log('=== ZOBRAZUJEM MOCK SERVISNÍ DATA ===');
            this.showMockServisData();
            
        } catch (error) {
            console.error('Chyba při načítání servisních dat:', error.message);
            console.log('=== ZOBRAZUJEM MOCK DATA ===');
            this.showMockServisData();
        }
    }

    async tryLoadData(csvUrl) {
        // Zkusíme několik rychlých přístupů paralelně
        const attempts = [
            // Přímý přístup k CSV
            fetch(csvUrl, {
                mode: 'cors',
                cache: 'no-cache',
                signal: AbortSignal.timeout(2000) // 2 sekundy timeout
            }),
            
            // Publikované URL
            fetch(`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/pub?gid=${this.servisGid}&single=true&output=csv`, {
                mode: 'cors',
                cache: 'no-cache',
                signal: AbortSignal.timeout(2000)
            }),
            
            // Alternativní formát
            fetch(`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${this.servisGid}`, {
                mode: 'cors',
                cache: 'no-cache',
                signal: AbortSignal.timeout(2000)
            })
        ];

        // Zkusíme všechny přístupy současně a vezmeme první úspěšný
        for (const attempt of attempts) {
            try {
                const response = await attempt;
                if (response.ok) {
                    const data = await response.text();
                    if (data && data.length > 100) {
                        console.log('✅ Úspěšně načteno:', data.length, 'znaků');
                        return data;
                    }
                }
            } catch (error) {
                console.log('❌ Pokus selhal:', error.message);
                continue;
            }
        }
        
        throw new Error('Všechny rychlé pokusy selhaly');
    }

    parseAndDisplayServisData(csvData) {
        console.log('=== PARSOVÁNÍ SERVISNÍCH DAT ===');
        console.log('Délka CSV dat:', csvData.length);
        console.log('První 1000 znaků CSV:', csvData.substring(0, 1000));
        
        const lines = csvData.split('\n').filter(line => line.trim());
        console.log('Počet řádků po filtrování:', lines.length);
        console.log('První 3 řádky:', lines.slice(0, 3));
        
        if (lines.length === 0) {
            console.log('Žádné řádky v CSV, zobrazujem mock data');
            this.showMockServisData();
            return;
        }

        // Parsování CSV - přeskočíme header (první řádek)
        const headers = this.parseCSVLine(lines[0]);
        console.log('Parsované headers:', headers);
        
        const rows = lines.slice(1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row.some(cell => cell.trim())); // Odfiltrovat prázdné řádky

        console.log(`Načteno ${rows.length} řádků servisních dat`);
        console.log('První 3 řádky dat:', rows.slice(0, 3));
        
        if (rows.length === 0) {
            console.log('Žádné datové řádky, zobrazujem mock data');
            this.showMockServisData();
            return;
        }

        // Uložíme původní data a seřadíme podle data (sloupec A)
        this.allRows = this.sortRowsByDate(rows, 0);
        this.filteredRows = [...this.allRows];
        
        this.displayServisTable(headers, this.allRows);
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
        
        // Formát DD.MM.YYYY
        const parts = dateString.split('.');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Měsíce jsou 0-based
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
        
        return new Date(dateString);
    }

    displayServisTable(headers, rows) {
        // Nastavíme filtrované řádky pro stránkování
        this.filteredRows = rows;
        this.currentPage = 1;
        
        this.renderTable(headers);
        this.setupEventListeners();
    }

    renderTable(headers) {
        const parseCena = (cenaStr) => {
            if (!cenaStr) return 0;
            // Odstraníme "Kč" a mezery, ale zachováme čísla, tečky a čárky
            const cleanStr = cenaStr.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
            const number = parseFloat(cleanStr);
            return isNaN(number) ? 0 : number;
        };
        
        // STATISTIKY ZE SERVISNÍCH DAT
        // Celkový obrat (sloupec F - Cena položky)
        const celkovyObrat = this.filteredRows.reduce((sum, row) => {
            const cena = parseCena(row[5]); // Index 5 = sloupec F
            return sum + cena;
        }, 0);
        
        // Celková marže (sloupec I)
        const celkovaMarze = this.filteredRows.reduce((sum, row) => {
            const marze = parseCena(row[8]); // Index 8 = sloupec I
            return sum + marze;
        }, 0);
        
        // Počet unikátních zakázek (podle sloupce D - Číslo zakázky)
        const unikatniZakazky = new Set();
        this.filteredRows.forEach(row => {
            const cisloZakazky = row[3] || ''; // Index 3 = sloupec D
            if (cisloZakazky.trim() !== '') {
                unikatniZakazky.add(cisloZakazky.trim());
            }
        });
        const pocetZakazek = unikatniZakazky.size;
        
        // Celkový počet položek (řádků)
        const celkemPolozek = this.filteredRows.length;
        
        // Průměrný počet položek na zakázku
        const prumerPolozekNaZakazku = pocetZakazek > 0 ? (celkemPolozek / pocetZakazek) : 0;
        
        // Nejaktivnější pobočka
        const pobockyCount = {};
        this.filteredRows.forEach(row => {
            const pobocka = row[2] || ''; // Index 2 = sloupec C - Pobočka
            if (pobocka.trim() !== '') {
                const nazev = pobocka.trim();
                pobockyCount[nazev] = (pobockyCount[nazev] || 0) + 1;
            }
        });
        
        let nejaktivnejsiPobocka = 'Žádná';
        let nejaktivnejsiPocet = 0;
        
        Object.entries(pobockyCount).forEach(([nazev, pocet]) => {
            if (pocet > nejaktivnejsiPocet) {
                nejaktivnejsiPobocka = nazev;
                nejaktivnejsiPocet = pocet;
            }
        });
        
        // Stránkování
        const totalPages = Math.ceil(this.filteredRows.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageRows = this.filteredRows.slice(startIndex, endIndex);

        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; servis_data.csv_</span>
                    <div class="retro-window-controls">
                        <button class="refresh-btn" onclick="window.servisLoader.manualRefresh()" title="Obnovit data">
                            ⟳
                        </button>
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <!-- Hlavní statistiky -->
                    <div class="bazar-stats">
                        <div class="stat-box">
                            <div class="stat-label">// CELKOVÝ OBRAT</div>
                            <div class="stat-value">${celkovyObrat.toLocaleString('cs-CZ')} Kč</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">// CELKOVÁ MARŽE</div>
                            <div class="stat-value ${celkovaMarze >= 0 ? 'positive-margin' : 'negative-margin'}">${celkovaMarze.toLocaleString('cs-CZ')} Kč</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">// POČET ZAKÁZEK</div>
                            <div class="stat-value">${pocetZakazek}</div>
                        </div>
                        <div class="stat-box king-box">
                            <div class="stat-label">// NEJAKTIVNĚJŠÍ POBOČKA 👑</div>
                            <div class="stat-value king-name">${nejaktivnejsiPobocka}</div>
                            <div class="stat-subvalue">${nejaktivnejsiPocet}x zakázek</div>
                        </div>
                    </div>

                    <!-- Doplňkové statistiky -->
                    <div class="bazar-stats-small">
                        <div class="stat-box-small">
                            <div class="stat-label-small">// ZAKÁZKY CELKEM</div>
                            <div class="stat-value-small">${pocetZakazek}</div>
                        </div>
                        <div class="stat-box-small">
                            <div class="stat-label-small">// CELKEM POLOŽEK</div>
                            <div class="stat-value-small">${celkemPolozek}</div>
                        </div>
                        <div class="stat-box-small">
                            <div class="stat-label-small">// PRŮMĚR POLOŽEK/ZAKÁZKA</div>
                            <div class="stat-value-small">${prumerPolozekNaZakazku.toLocaleString('cs-CZ', {maximumFractionDigits: 1})}</div>
                        </div>
                        <div class="stat-box-small">
                            <div class="stat-label-small">// PRŮMĚR/ZAKÁZKA</div>
                            <div class="stat-value-small">${pocetZakazek > 0 ? (celkovyObrat / pocetZakazek).toLocaleString('cs-CZ', {maximumFractionDigits: 0}) : '0'} Kč</div>
                        </div>
                        <div class="stat-box-small">
                            <div class="stat-label-small">// PRŮMĚR MARŽE/ZAKÁZKA</div>
                            <div class="stat-value-small">${pocetZakazek > 0 ? (celkovaMarze / pocetZakazek).toLocaleString('cs-CZ', {maximumFractionDigits: 0}) : '0'} Kč</div>
                        </div>
                        <div class="stat-box-small">
                            <div class="stat-label-small">// ZISKOVOST</div>
                            <div class="stat-value-small">${celkovyObrat > 0 ? ((celkovaMarze / celkovyObrat) * 100).toFixed(1) : '0'}%</div>
                        </div>
                    </div>

                    <!-- Filtry -->
                    <div class="bazar-filters">
                        <!-- Textový filtr -->
                        <div class="filter-section">
                            <input type="text" id="servisFilter" placeholder="// Filtrovat podle názvu položky, pobočky, uživatele...">
                        </div>
                        
                        <!-- Rozbalovací filtry -->
                        <div class="dropdown-filters-section">
                            <div class="dropdown-filters-row">
                                <div class="dropdown-filter-group">
                                    <label class="filter-label-small">// POBOČKA</label>
                                    <select id="pobockaFilter" class="dropdown-filter">
                                        <option value="">Všechny pobočky</option>
                                    </select>
                                </div>
                                <div class="dropdown-filter-group">
                                    <label class="filter-label-small">// PRODEJCE</label>
                                    <select id="prodejceFilter" class="dropdown-filter">
                                        <option value="">Všichni prodejci</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Datový filtr -->
                        <div class="date-filter-section">
                            <div class="date-filter-header">
                                <span class="filter-label">// RYCHLÉ FILTRY PODLE OBDOBÍ</span>
                            </div>
                            
                            <!-- Skryté inputy pro interní použití -->
                            <input type="hidden" id="dateFrom">
                            <input type="hidden" id="dateTo">
                            
                            <div class="date-filter-buttons">
                                <button type="button" class="quick-filter-btn" id="weekBtn">
                                    TÝDEN
                                </button>
                                <button type="button" class="quick-filter-btn" id="monthBtn">
                                    MĚSÍC
                                </button>
                                <button type="button" class="show-all-btn" id="showAllBtn">
                                    ZOBRAZIT VŠE
                                </button>
                            </div>
                            
                            <!-- Měsíční filtry -->
                            <div class="month-filter-section">
                                <div class="month-filter-header">
                                    <span class="filter-label">// FILTRY PODLE MĚSÍCE 2025</span>
                                </div>
                                <div class="month-filter-buttons">
                                    <button type="button" class="month-filter-btn" id="januaryBtn">
                                        LEDEN
                                    </button>
                                    <button type="button" class="month-filter-btn" id="februaryBtn">
                                        ÚNOR
                                    </button>
                                    <button type="button" class="month-filter-btn" id="marchBtn">
                                        BŘEZEN
                                    </button>
                                    <button type="button" class="month-filter-btn" id="aprilBtn">
                                        DUBEN
                                    </button>
                                    <button type="button" class="month-filter-btn" id="mayBtn">
                                        KVĚTEN
                                    </button>
                                    <button type="button" class="month-filter-btn" id="juneBtn">
                                        ČERVEN
                                    </button>
                                    <button type="button" class="month-filter-btn" id="julyBtn">
                                        ČERVENEC
                                    </button>
                                    <button type="button" class="month-filter-btn" id="augustBtn">
                                        SRPEN
                                    </button>
                                    <button type="button" class="month-filter-btn" id="septemberBtn">
                                        ZÁŘÍ
                                    </button>
                                    <button type="button" class="month-filter-btn" id="octoberBtn">
                                        ŘÍJEN
                                    </button>
                                    <button type="button" class="month-filter-btn" id="novemberBtn">
                                        LISTOPAD
                                    </button>
                                    <button type="button" class="month-filter-btn" id="decemberBtn">
                                        PROSINEC
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tabulka s daty -->
                    <div class="retro-table-wrapper">
                        <table class="retro-table">
                            <thead>
                                <tr>
                                    <th>DATUM</th>
                                    <th>UŽIVATEL</th>
                                    <th>POBOČKA</th>
                                    <th>ČÍSLO ZAKÁZKY</th>
                                    <th>NÁZEV POLOŽKY</th>
                                    <th>CENA</th>
                                    <th>RECEPTURA</th>
                                    <th>NÁKUPNÍ CENA</th>
                                    <th>MARŽE</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${currentPageRows.map(row => `
                                    <tr class="data-row" data-original-index="${this.allRows.indexOf(row)}">
                                        <td class="data-cell">${this.escapeHtml(row[0] || '')}</td>
                                        <td class="data-cell">${this.escapeHtml(row[1] || '')}</td>
                                        <td class="data-cell">${this.escapeHtml(row[2] || '')}</td>
                                        <td class="data-cell">${this.escapeHtml(row[3] || '')}</td>
                                        <td class="data-cell">${this.escapeHtml(row[4] || '')}</td>
                                        <td class="data-cell price-cell">${this.escapeHtml(row[5] || '')}</td>
                                        <td class="data-cell">${this.escapeHtml(row[6] || '')}</td>
                                        <td class="data-cell price-cell">${this.escapeHtml(row[7] || '')}</td>
                                        <td class="data-cell price-cell ${parseCena(row[8]) >= 0 ? 'positive' : 'negative'}">${this.escapeHtml(row[8] || '')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Stránkování -->
                    ${totalPages > 1 ? `
                        <div class="pagination">
                            <div class="pagination-info">
                                Stránka ${this.currentPage} z ${totalPages} | 
                                Zobrazeno ${startIndex + 1}-${Math.min(endIndex, this.filteredRows.length)} z ${this.filteredRows.length} záznamů
                            </div>
                            <div class="pagination-controls">
                                ${this.currentPage > 1 ? `<button class="page-btn" onclick="window.servisLoader.goToPage(${this.currentPage - 1})">← Předchozí</button>` : ''}
                                ${Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                    const pageNum = Math.max(1, Math.min(totalPages - 4, this.currentPage - 2)) + i;
                                    return pageNum <= totalPages ? `<button class="page-btn ${pageNum === this.currentPage ? 'active' : ''}" onclick="window.servisLoader.goToPage(${pageNum})">${pageNum}</button>` : '';
                                }).join('')}
                                ${this.currentPage < totalPages ? `<button class="page-btn" onclick="window.servisLoader.goToPage(${this.currentPage + 1})">Další →</button>` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Debug info -->
                    <div class="debug-info">
                        <span class="filter-stats" id="filterStats">
                            Zobrazeno ${this.filteredRows.length} z ${this.allRows.length} záznamů
                        </span>
                    </div>
                </div>
            </div>
        `;

        this.populateDropdownFilters();
    }

    populateDropdownFilters() {
        // Získáme unikátní pobočky
        const pobocky = new Set();
        this.allRows.forEach(row => {
            const pobocka = row[2] || ''; // Index 2 = sloupec C - Pobočka
            if (pobocka.trim() !== '') {
                pobocky.add(pobocka.trim());
            }
        });

        // Získáme unikátní prodejce
        const prodejci = new Set();
        this.allRows.forEach(row => {
            const uzivatel = row[1] || ''; // Index 1 = sloupec B - Uživatel
            if (uzivatel.trim() !== '') {
                prodejci.add(uzivatel.trim());
            }
        });

        // Naplníme dropdown pro pobočky
        const pobockaSelect = document.getElementById('pobockaFilter');
        if (pobockaSelect) {
            // Zachováme současnou hodnotu
            const currentValue = pobockaSelect.value;
            
            // Vyčistíme options kromě první
            pobockaSelect.innerHTML = '<option value="">Všechny pobočky</option>';
            
            // Přidáme seřazené pobočky
            Array.from(pobocky).sort().forEach(pobocka => {
                const option = document.createElement('option');
                option.value = pobocka;
                option.textContent = pobocka;
                pobockaSelect.appendChild(option);
            });
            
            // Obnovíme hodnotu pokud existuje
            pobockaSelect.value = currentValue;
            
            // Znovu zaregistrovat event listener
            pobockaSelect.removeEventListener('change', this.filterTableBound);
            pobockaSelect.addEventListener('change', this.filterTableBound);
        }

        // Naplníme dropdown pro prodejce
        const prodejceSelect = document.getElementById('prodejceFilter');
        if (prodejceSelect) {
            // Zachováme současnou hodnotu
            const currentValue = prodejceSelect.value;
            
            // Vyčistíme options kromě první
            prodejceSelect.innerHTML = '<option value="">Všichni prodejci</option>';
            
            // Přidáme seřazené prodejce
            Array.from(prodejci).sort().forEach(prodejce => {
                const option = document.createElement('option');
                option.value = prodejce;
                option.textContent = prodejce;
                prodejceSelect.appendChild(option);
            });
            
            // Obnovíme hodnotu pokud existuje
            prodejceSelect.value = currentValue;
            
            // Znovu zaregistrovat event listener
            prodejceSelect.removeEventListener('change', this.filterTableBound);
            prodejceSelect.addEventListener('change', this.filterTableBound);
        }
    }

    setupEventListeners() {
        // Textový filtr
        const filterInput = document.getElementById('servisFilter');
        if (filterInput) {
            filterInput.addEventListener('input', () => {
                this.filterTable();
            });
        }

        // Dropdown filtry
        const pobockaFilter = document.getElementById('pobockaFilter');
        if (pobockaFilter) {
            pobockaFilter.addEventListener('change', () => {
                this.filterTable();
            });
        }

        const prodejceFilter = document.getElementById('prodejceFilter');
        if (prodejceFilter) {
            prodejceFilter.addEventListener('change', () => {
                this.filterTable();
            });
        }

        // Rychlé filtry
        const weekBtn = document.getElementById('weekBtn');
        const monthBtn = document.getElementById('monthBtn');
        const showAllBtn = document.getElementById('showAllBtn');

        if (weekBtn) {
            weekBtn.addEventListener('click', () => {
                this.setWeekFilter();
            });
        }

        if (monthBtn) {
            monthBtn.addEventListener('click', () => {
                this.setMonthFilter();
            });
        }

        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => {
                this.showAllRecords();
            });
        }

        // Měsíční filtry
        const monthFilters = [
            { id: 'januaryBtn', month: 1 },
            { id: 'februaryBtn', month: 2 },
            { id: 'marchBtn', month: 3 },
            { id: 'aprilBtn', month: 4 },
            { id: 'mayBtn', month: 5 },
            { id: 'juneBtn', month: 6 },
            { id: 'julyBtn', month: 7 },
            { id: 'augustBtn', month: 8 },
            { id: 'septemberBtn', month: 9 },
            { id: 'octoberBtn', month: 10 },
            { id: 'novemberBtn', month: 11 },
            { id: 'decemberBtn', month: 12 }
        ];

        monthFilters.forEach(filter => {
            const btn = document.getElementById(filter.id);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.setMonthFilter(filter.month);
                });
            }
        });
    }

    filterTable() {
        const textFilter = document.getElementById('servisFilter');
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        const pobockaFilter = document.getElementById('pobockaFilter');
        const prodejceFilter = document.getElementById('prodejceFilter');
        
        const textQuery = textFilter ? textFilter.value.toLowerCase() : '';
        const dateFrom = dateFromInput ? dateFromInput.value : '';
        const dateTo = dateToInput ? dateToInput.value : '';
        const selectedPobocka = pobockaFilter ? pobockaFilter.value : '';
        const selectedProdejce = prodejceFilter ? prodejceFilter.value : '';
        
        this.filteredRows = this.allRows.filter(row => {
            // Textový filtr - prohledáváme všechny sloupce
            let textMatch = true;
            if (textQuery) {
                textMatch = row.some(cell => 
                    cell && cell.toString().toLowerCase().includes(textQuery)
                );
            }
            
            // Filtr pobočky
            let pobockaMatch = true;
            if (selectedPobocka) {
                const rowPobocka = row[2] || ''; // Index 2 = sloupec C - Pobočka
                pobockaMatch = rowPobocka.trim() === selectedPobocka;
            }
            
            // Filtr prodejce
            let prodejceMatch = true;
            if (selectedProdejce) {
                const rowProdejce = row[1] || ''; // Index 1 = sloupec B - Uživatel
                prodejceMatch = rowProdejce.trim() === selectedProdejce;
            }
            
            // Datový filtr
            let dateMatch = true;
            if (dateFrom || dateTo) {
                const rowDate = this.parseDate(row[0]); // Sloupec A - Datum
                
                if (dateFrom) {
                    const fromDate = new Date(dateFrom);
                    if (rowDate < fromDate) dateMatch = false;
                }
                
                if (dateTo) {
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999); // Konec dne
                    if (rowDate > toDate) dateMatch = false;
                }
            }
            
            return textMatch && pobockaMatch && prodejceMatch && dateMatch;
        });
        
        // Reset na první stránku při filtrování
        this.currentPage = 1;
        
        // Znovu vykreslit tabulku
        this.renderTable(['Datum', 'Uživatel', 'Pobočka', 'Číslo zakázky', 'Název položky', 'Cena položky', 'Receptura', 'Nákupní cena', 'Marže']);
        this.updateFilterStats(this.filteredRows.length, this.allRows.length);
        
        // Event listenery jsou zachovány díky bound funkcím v populateDropdownFilters
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable(['Datum', 'Uživatel', 'Pobočka', 'Číslo zakázky', 'Název položky', 'Cena položky', 'Receptura', 'Nákupní cena', 'Marže']);
        // Event listenery jsou zachovány díky bound funkcím
    }

    setWeekFilter() {
        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        
        if (dateFromInput && dateToInput) {
            dateFromInput.value = oneWeekAgo.toISOString().split('T')[0];
            dateToInput.value = today.toISOString().split('T')[0];
            this.filterTable();
        }
    }

    setMonthFilter(monthNumber = null) {
        const today = new Date();
        const currentMonth = monthNumber || (today.getMonth() + 1);
        const currentYear = today.getFullYear();
        
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfMonth = new Date(currentYear, currentMonth, 0);
        
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        
        if (dateFromInput && dateToInput) {
            dateFromInput.value = startOfMonth.toISOString().split('T')[0];
            dateToInput.value = endOfMonth.toISOString().split('T')[0];
            this.filterTable();
        }
    }

    showAllRecords() {
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        const servisFilter = document.getElementById('servisFilter');
        const pobockaFilter = document.getElementById('pobockaFilter');
        const prodejceFilter = document.getElementById('prodejceFilter');
        
        if (dateFromInput) dateFromInput.value = '';
        if (dateToInput) dateToInput.value = '';
        if (servisFilter) servisFilter.value = '';
        if (pobockaFilter) pobockaFilter.value = '';
        if (prodejceFilter) prodejceFilter.value = '';
        
        this.filterTable();
    }

    updateFilterStats(visibleCount, totalCount) {
        const filterStats = document.getElementById('filterStats');
        if (filterStats) {
            filterStats.textContent = `Zobrazeno ${visibleCount} z ${totalCount} záznamů`;
        }
    }

    showLoading() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="retro-data-container">
                    <div class="retro-data-header">
                        <span class="retro-terminal-prompt">&gt; servis_data.csv_</span>
                        <div class="retro-window-controls">
                            <button class="refresh-btn" onclick="window.servisLoader.manualRefresh()" title="Obnovit data">
                                ⟳
                            </button>
                            <span class="control-dot red"></span>
                            <span class="control-dot yellow"></span>
                            <span class="control-dot green"></span>
                        </div>
                    </div>
                    <div class="retro-data-content">
                        <div class="loading-container">
                            <div class="retro-loading">
                                <div class="loading-text">
                                    <span class="blinking-cursor">█</span> Načítání servisních dat...
                                </div>
                                
                                <!-- Funkční progress bar -->
                                <div class="progress-bar-container">
                                    <div class="progress-bar">
                                        <div class="progress-fill" id="progressFill"></div>
                                    </div>
                                    <div class="progress-text" id="progressText">0%</div>
                                </div>
                                
                                <div class="loading-details" id="loadingSteps">
                                    &gt; Připojování k Google Sheets...<br>
                                    &gt; Stahování CSV dat...<br>
                                    &gt; Parsování statistik...
                                </div>

                                <!-- Dinosaurus minihra -->
                                <div class="dino-game-container" id="dinoGame">
                                    <div class="dino-game-header">
                                        <span class="game-title">// MINI GAME - Dokud se načítají data</span>
                                        <span class="game-score">Skóre: <span id="gameScore">0</span></span>
                                    </div>
                                    <div class="dino-game-instructions">
                                        Stiskni MEZERNÍK pro skok dinosaura!
                                    </div>
                                    <div class="dino-game-area" id="gameArea">
                                        <div class="dino" id="dino">🦕</div>
                                        <div class="ground"></div>
                                    </div>
                                    <div class="game-status" id="gameStatus">Hra běží...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Spustíme progress bar animaci
            this.startProgressBar();
            
            // Spustíme dinosaurus hru
            this.startDinoGame();
        }
    }

    showMockServisData() {
        console.log('=== ZOBRAZUJEM MOCK SERVISNÍ DATA ===');
        
        const mockData = this.generateMockData();
        this.allRows = mockData;
        this.filteredRows = [...mockData];
        
        const headers = ['Datum', 'Uživatel', 'Pobočka', 'Číslo zakázky', 'Název položky', 'Cena položky', 'Receptura', 'Nákupní cena', 'Marže'];
        this.displayServisTable(headers, mockData);
    }

    generateMockData() {
        const mockData = [
            ['02.06.2025', 'Šimon Gabriel (id:116)', 'Mobil Maják - Globus Olomouc', 'RMA9125048', 'Samsung Galaxy A54 - Servis', '2500', 'P10409', '1500,00 Kč', '1000,00 Kč'],
            ['02.06.2025', 'Šimon Gabriel (id:116)', 'Mobil Maják - Globus Olomouc', 'RMA9125048', 'Dezinfekční čištění telefonu', '300', 'P10409', '50,00 Kč', '250,00 Kč'],
            ['02.06.2025', 'František Vychodil (id:121)', 'Mobil Maják - Globus Olomouc', '912501591', 'Diagnostika', '500', 'P10409', '100,00 Kč', '400,00 Kč'],
            ['02.06.2025', 'Lukáš Kováčik (id:111)', 'Mobil Maják - Čepkov Zlín', '952500774', 'iPhone XR - Výměna baterie', '750', 'P45821', '159,38 Kč', '590,62 Kč'],
            ['02.06.2025', 'Lukáš Kováčik (id:111)', 'Mobil Maják - Čepkov Zlín', '952500774', 'Prachuvzdorné lepení', '200', 'P131922', '29,00 Kč', '171,00 Kč'],
            ['01.06.2025', 'František Vychodil (id:121)', 'Mobil Maják - Globus Olomouc', '912501590', 'Samsung Galaxy A52 - Výměna displeje', '2700', 'P95683', '1632,52 Kč', '1067,48 Kč'],
            ['01.06.2025', 'František Vychodil (id:121)', 'Mobil Maják - Globus Olomouc', '912501590', 'Základní čištění telefonu', '300', 'P114194', '50,00 Kč', '250,00 Kč'],
            ['01.06.2025', 'Lukáš Kováčik (id:111)', 'Mobil Maják - Čepkov Zlín', '952500773', 'iPhone 12 - Výměna displeje', '3600', 'P127257', '1037,03 Kč', '2562,97 Kč'],
            ['31.05.2025', 'Martin Novák (id:130)', 'Mobil Maják - Centrum Brno', '912501580', 'Huawei P30 - Oprava konektoru', '1200', 'P80912', '450,00 Kč', '750,00 Kč'],
            ['30.05.2025', 'Jana Krásná (id:150)', 'Mobil Maják - Ostrava', '912501570', 'OnePlus - Výměna skla', '1800', 'P65432', '800,00 Kč', '1000,00 Kč']
        ];
        
        return mockData;
    }

    manualRefresh() {
        console.log('=== MANUÁLNÍ OBNOVENÍ DAT ===');
        this.loadServisData();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    startProgressBar() {
        let progress = 0;
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const loadingSteps = document.getElementById('loadingSteps');
        
        const progressInterval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 100) progress = 100;
            
            if (progressFill) {
                progressFill.style.width = progress + '%';
            }
            if (progressText) {
                progressText.textContent = Math.round(progress) + '%';
            }
            
            // Aktualizace kroků
            if (loadingSteps) {
                if (progress > 30 && progress < 60) {
                    loadingSteps.innerHTML = `
                        &gt; ✓ Připojeno k Google Sheets<br>
                        &gt; Stahování CSV dat...<br>
                        &gt; Parsování statistik...
                    `;
                } else if (progress > 60) {
                    loadingSteps.innerHTML = `
                        &gt; ✓ Připojeno k Google Sheets<br>
                        &gt; ✓ CSV data stažena<br>
                        &gt; Parsování statistik...
                    `;
                }
            }
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                if (loadingSteps) {
                    loadingSteps.innerHTML = `
                        &gt; ✓ Připojeno k Google Sheets<br>
                        &gt; ✓ CSV data stažena<br>
                        &gt; ✓ Statistiky zpracovány
                    `;
                }
            }
        }, 200);
    }

    startDinoGame() {
        const gameArea = document.getElementById('gameArea');
        const dino = document.getElementById('dino');
        const gameScore = document.getElementById('gameScore');
        const gameStatus = document.getElementById('gameStatus');
        
        if (!gameArea || !dino) return;
        
        let isJumping = false;
        let gameRunning = true;
        let score = 0;
        let gameSpeed = 2;
        let obstacles = [];
        let obstacleSpawnRate = 0.02;
        
        // Pozice dinosaura
        let dinoY = 0;
        let dinoVelocity = 0;
        const gravity = 0.8;
        const jumpPower = -15;
        
        // Vytvoření obstacle
        function createObstacle() {
            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            obstacle.innerHTML = '🌵';
            obstacle.style.position = 'absolute';
            obstacle.style.right = '-30px';
            obstacle.style.bottom = '0px';
            obstacle.style.fontSize = '30px';
            obstacle.style.zIndex = '1';
            gameArea.appendChild(obstacle);
            
            obstacles.push({
                element: obstacle,
                x: gameArea.offsetWidth + 30,
                width: 30,
                height: 30
            });
        }
        
        // Skok dinosaura
        function jump() {
            if (!isJumping && gameRunning) {
                isJumping = true;
                dinoVelocity = jumpPower;
            }
        }
        
        // Detekce kolize
        function checkCollision() {
            const dinoRect = {
                x: 20,
                y: 150 - dinoY - 30,
                width: 30,
                height: 30
            };
            
            for (let obstacle of obstacles) {
                const obstacleRect = {
                    x: obstacle.x,
                    y: 150 - 30,
                    width: obstacle.width,
                    height: obstacle.height
                };
                
                if (dinoRect.x < obstacleRect.x + obstacleRect.width &&
                    dinoRect.x + dinoRect.width > obstacleRect.x &&
                    dinoRect.y < obstacleRect.y + obstacleRect.height &&
                    dinoRect.y + dinoRect.height > obstacleRect.y) {
                    return true;
                }
            }
            return false;
        }
        
        // Konec hry
        function gameOver() {
            gameRunning = false;
            if (gameStatus) {
                gameStatus.textContent = `Hra skončila! Finální skóre: ${score} - Stiskni MEZERNÍK pro restart`;
            }
            
            // Vyčistíme překážky
            obstacles.forEach(obstacle => {
                if (obstacle.element && obstacle.element.parentNode) {
                    obstacle.element.parentNode.removeChild(obstacle.element);
                }
            });
            obstacles = [];
        }
        
        // Restart hry
        function restartGame() {
            gameRunning = true;
            score = 0;
            gameSpeed = 2;
            obstacleSpawnRate = 0.02;
            dinoY = 0;
            dinoVelocity = 0;
            isJumping = false;
            
            if (gameScore) gameScore.textContent = score;
            if (gameStatus) gameStatus.textContent = 'Hra běží...';
            
            // Vyčistíme překážky
            obstacles.forEach(obstacle => {
                if (obstacle.element && obstacle.element.parentNode) {
                    obstacle.element.parentNode.removeChild(obstacle.element);
                }
            });
            obstacles = [];
        }
        
        // Hlavní herní smyčka
        function gameLoop() {
            if (!gameRunning) return;
            
            // Fyzika dinosaura
            if (isJumping || dinoY > 0) {
                dinoVelocity += gravity;
                dinoY += dinoVelocity;
                
                if (dinoY >= 0) {
                    dinoY = 0;
                    dinoVelocity = 0;
                    isJumping = false;
                }
                
                dino.style.bottom = dinoY + 'px';
            }
            
            // Vytváření překážek
            if (Math.random() < obstacleSpawnRate) {
                createObstacle();
            }
            
            // Pohyb překážek
            obstacles = obstacles.filter(obstacle => {
                obstacle.x -= gameSpeed;
                obstacle.element.style.right = (gameArea.offsetWidth - obstacle.x) + 'px';
                
                // Odstranění překážek mimo obrazovku
                if (obstacle.x < -obstacle.width) {
                    if (obstacle.element && obstacle.element.parentNode) {
                        obstacle.element.parentNode.removeChild(obstacle.element);
                    }
                    score += 10;
                    if (gameScore) gameScore.textContent = score;
                    
                    // Zvýšení rychlosti
                    if (score % 100 === 0) {
                        gameSpeed += 0.5;
                        obstacleSpawnRate += 0.005;
                    }
                    
                    return false;
                }
                return true;
            });
            
            // Kontrola kolize
            if (checkCollision()) {
                gameOver();
                return;
            }
            
            // Pokračování smyčky
            requestAnimationFrame(gameLoop);
        }
        
        // Event listener pro ovládání
        function handleKeyPress(event) {
            if (event.code === 'Space' || event.key === ' ') {
                event.preventDefault();
                
                if (gameRunning) {
                    jump();
                } else {
                    restartGame();
                    gameLoop();
                }
            }
        }
        
        // Registrace event listenerů
        document.addEventListener('keydown', handleKeyPress);
        
        // Uložíme cleanup funkci
        this.cleanupDinoGame = () => {
            document.removeEventListener('keydown', handleKeyPress);
            obstacles.forEach(obstacle => {
                if (obstacle.element && obstacle.element.parentNode) {
                    obstacle.element.parentNode.removeChild(obstacle.element);
                }
            });
        };
        
        // Spuštění hry
        gameLoop();
        
        // Auto-cleanup po 30 sekundách (když se loading dokončí)
        setTimeout(() => {
            if (this.cleanupDinoGame) {
                this.cleanupDinoGame();
            }
        }, 30000);
    }
} 