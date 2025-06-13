// Specializovaný data loader pro celkové statistiky firmy z Google Sheets
class CelkemDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // Google Sheets ID a gid pro list "statistiky aktual"
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.celkemGid = '329913614'; // gid pro list "statistiky aktual"
        
        // Publikované URL pro CSV export
        this.basePublishedUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv`;
        
        this.refreshInterval = null;
        
        // Stránkování
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.allRows = [];
        this.filteredRows = [];
        
        // Agregované data
        this.aggregatedData = {
            byStredisko: new Map(),
            byKategorie: new Map(),
            byPodkategorie: new Map(),
            byDoklad: new Map(),
            totalObrat: 0,
            totalMarze: 0,
            totalCount: 0,
            totalDoklady: 0,
            avgObratPerDoklad: 0,
            avgMarzePerDoklad: 0
        };
        
        // Bind funkce pro event listenery
        this.filterTableBound = () => this.filterTable();
    }

    async loadCelkemData() {
        console.log('=== NAČÍTÁNÍ CELKOVÝCH DAT ===');
        console.log('Spreadsheet ID:', this.spreadsheetId);
        console.log('Celkem GID:', this.celkemGid);
        
        try {
            this.showLoading();
            
            // Vytvoříme timestamp pro cache-busting
            const timestamp = new Date().getTime();
            
            // URL pro CSV export celkových dat
            const csvUrl = `${this.basePublishedUrl}&gid=${this.celkemGid}&cachebust=${timestamp}`;
            
            console.log('CSV URL:', csvUrl);
            
            let csvData = null;
            
            // Rychlý timeout pro všechny pokusy - pokud se nepodaří do 5 sekund, jdeme na mock data
            const quickTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout - přechod na mock data')), 5000)
            );
            
            // Zkusíme rychle načíst data s timeoutem
            try {
                csvData = await Promise.race([
                    this.tryLoadData(csvUrl),
                    quickTimeout
                ]);
                
                if (csvData && csvData.length > 500) {
                    console.log('=== ÚSPĚCH: Celková data načtena rychle ===');
                    console.log('Celková délka CSV dat:', csvData.length);
                    this.parseAndDisplayCelkemData(csvData);
                    return;
                }
            } catch (error) {
                console.log('=== RYCHLÉ NAČÍTÁNÍ SELHALO, PŘECHOD NA MOCK DATA ===');
                console.log('Důvod:', error.message);
            }
            
            // Pokud rychlé načítání selhalo, zobrazíme mock data
            console.log('=== ZOBRAZUJEM MOCK CELKOVÁ DATA ===');
            this.showMockCelkemData();
            
        } catch (error) {
            console.error('Chyba při načítání celkových dat:', error.message);
            console.log('=== ZOBRAZUJEM MOCK DATA ===');
            this.showMockCelkemData();
        }
    }

    async tryLoadData(csvUrl) {
        // Chrome kompatibilní timeout implementace
        const createFetchWithTimeout = (url, timeoutMs) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            
            return fetch(url, {
                mode: 'cors',
                cache: 'no-cache',
                signal: controller.signal
            }).finally(() => clearTimeout(timeoutId));
        };
        
        // Zkusíme několik rychlých přístupů paralelně
        const attempts = [
            // Přímý přístup k CSV
            createFetchWithTimeout(csvUrl, 3000),
            
            // Publikované URL
            createFetchWithTimeout(`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/pub?gid=${this.celkemGid}&single=true&output=csv`, 3000),
            
            // Alternativní formát
            createFetchWithTimeout(`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${this.celkemGid}`, 3000)
        ];

        // Zkusíme všechny přístupy současně a vezmeme první úspěšný
        for (const attempt of attempts) {
            try {
                const response = await attempt;
                if (response.ok) {
                    const data = await response.text();
                    if (data && data.length > 500) {
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

    parseAndDisplayCelkemData(csvData) {
        console.log('=== PARSOVÁNÍ CELKOVÝCH DAT ===');
        console.log('Délka CSV dat:', csvData.length);
        console.log('První 1000 znaků CSV:', csvData.substring(0, 1000));
        
        const lines = csvData.split('\n').filter(line => line.trim());
        console.log('Počet řádků po filtrování:', lines.length);
        console.log('První 3 řádky:', lines.slice(0, 3));
        
        if (lines.length === 0) {
            console.log('Žádné řádky v CSV, zobrazujem mock data');
            this.showMockCelkemData();
            return;
        }

        // Najít header řádek (očekáváme "Vystaveno", "Kód", "Název", ...)
        let headerRowIndex = -1;
        let headers = [];
        
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const testHeaders = this.parseCSVLine(lines[i]);
            if (testHeaders.includes('Vystaveno') || testHeaders.includes('Název') || testHeaders.includes('Středisko')) {
                headers = testHeaders;
                headerRowIndex = i;
                break;
            }
        }
        
        if (headerRowIndex === -1) {
            console.log('Nenašli jsme header řádek, vezmu první řádek');
            headers = this.parseCSVLine(lines[0]);
            headerRowIndex = 0;
        }
        
        console.log('Parsované headers:', headers);
        console.log('Header řádek index:', headerRowIndex);
        
        const rows = lines.slice(headerRowIndex + 1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row.some(cell => cell.trim())); // Odfiltrovat prázdné řádky

        console.log(`Načteno ${rows.length} řádků celkových dat`);
        console.log('První 3 řádky dat:', rows.slice(0, 3));
        
        if (rows.length === 0) {
            console.log('Žádné datové řádky, zobrazujem mock data');
            this.showMockCelkemData();
            return;
        }

        // Agregovat data podle středisek, kategorií atd.
        this.aggregateData(rows);
        
        // Uložíme původní data a seřadíme podle data (sloupec A - Vystaveno)
        this.allRows = this.sortRowsByDate(rows, 0);
        this.filteredRows = [...this.allRows];
        
        this.displayCelkemData(headers);
    }

    aggregateData(rows) {
        console.log('=== AGREGACE DAT ===');
        
        // Reset aggregated data
        this.aggregatedData = {
            byStredisko: new Map(),
            byKategorie: new Map(),
            byPodkategorie: new Map(),
            byDoklad: new Map(),
            totalObrat: 0,
            totalMarze: 0,
            totalCount: 0,
            totalDoklady: 0,
            avgObratPerDoklad: 0,
            avgMarzePerDoklad: 0
        };
        
        rows.forEach(row => {
            // Sloupce podle toho co vidím v tabulce:
            // A=Vystaveno, B=Kód, C=Název, D=Doklad, E=Objednávka, F=Typ, G=Středisko, H=Cena celkem bez DPH, I=Kategorie, J=Podkategorie, K=Nákupní cena, L=Marže
            
            const vystaveno = row[0] || '';
            const kod = row[1] || '';
            const nazev = row[2] || '';
            const doklad = row[3] || '';
            const objednavka = row[4] || '';
            const typ = row[5] || '';
            const stredisko = row[6] || '';
            const cenaCelkem = this.parseNumber(row[7]) || 0;
            const kategorie = row[8] || '';
            const podkategorie = row[9] || '';
            const nakupniCena = this.parseNumber(row[10]) || 0;
            const marze = this.parseNumber(row[11]) || 0;
            
            // Přeskočit řádky bez střediska nebo s nulovým obratem
            if (!stredisko || stredisko.trim() === '' || cenaCelkem === 0) {
                return;
            }
            
            // Agregace podle dokladů (účtenek)
            if (doklad && doklad.trim() !== '') {
                if (!this.aggregatedData.byDoklad.has(doklad)) {
                    this.aggregatedData.byDoklad.set(doklad, {
                        obrat: 0,
                        marze: 0,
                        polozky: 0,
                        stredisko: stredisko,
                        datum: vystaveno
                    });
                }
                const dokladData = this.aggregatedData.byDoklad.get(doklad);
                dokladData.obrat += cenaCelkem;
                dokladData.marze += marze;
                dokladData.polozky += 1;
            }
            
            // Agregace podle střediska
            if (!this.aggregatedData.byStredisko.has(stredisko)) {
                this.aggregatedData.byStredisko.set(stredisko, {
                    obrat: 0,
                    marze: 0,
                    count: 0,
                    categories: new Map()
                });
            }
            const strediskoData = this.aggregatedData.byStredisko.get(stredisko);
            strediskoData.obrat += cenaCelkem;
            strediskoData.marze += marze;
            strediskoData.count += 1;
            
            // Kategorii pro středisko
            if (kategorie) {
                if (!strediskoData.categories.has(kategorie)) {
                    strediskoData.categories.set(kategorie, { obrat: 0, marze: 0, count: 0 });
                }
                const katData = strediskoData.categories.get(kategorie);
                katData.obrat += cenaCelkem;
                katData.marze += marze;
                katData.count += 1;
            }
            
            // Agregace podle kategorie
            if (kategorie) {
                if (!this.aggregatedData.byKategorie.has(kategorie)) {
                    this.aggregatedData.byKategorie.set(kategorie, {
                        obrat: 0,
                        marze: 0,
                        count: 0
                    });
                }
                const katData = this.aggregatedData.byKategorie.get(kategorie);
                katData.obrat += cenaCelkem;
                katData.marze += marze;
                katData.count += 1;
            }
            
            // Agregace podle podkategorie
            if (podkategorie) {
                if (!this.aggregatedData.byPodkategorie.has(podkategorie)) {
                    this.aggregatedData.byPodkategorie.set(podkategorie, {
                        obrat: 0,
                        marže: 0,
                        count: 0
                    });
                }
                const podkatData = this.aggregatedData.byPodkategorie.get(podkategorie);
                podkatData.obrat += cenaCelkem;
                podkatData.marže += marze;
                podkatData.count += 1;
            }
            
            // Celkové součty
            this.aggregatedData.totalObrat += cenaCelkem;
            this.aggregatedData.totalMarze += marze;
            this.aggregatedData.totalCount += 1;
        });
        
        // Spočítáme průměry na účtenku
        this.aggregatedData.totalDoklady = this.aggregatedData.byDoklad.size;
        if (this.aggregatedData.totalDoklady > 0) {
            this.aggregatedData.avgObratPerDoklad = this.aggregatedData.totalObrat / this.aggregatedData.totalDoklady;
            this.aggregatedData.avgMarzePerDoklad = this.aggregatedData.totalMarze / this.aggregatedData.totalDoklady;
        }
        
        console.log('Agregovaná data:', this.aggregatedData);
        console.log(`Střediska: ${this.aggregatedData.byStredisko.size}`);
        console.log(`Kategorie: ${this.aggregatedData.byKategorie.size}`);
        console.log(`Doklady (účtenky): ${this.aggregatedData.totalDoklady}`);
        console.log(`Celkový obrat: ${this.aggregatedData.totalObrat.toFixed(2)} Kč`);
        console.log(`Celková marže: ${this.aggregatedData.totalMarze.toFixed(2)} Kč`);
        console.log(`Průměr na účtenku - obrat: ${this.aggregatedData.avgObratPerDoklad.toFixed(2)} Kč`);
        console.log(`Průměr na účtenku - marže: ${this.aggregatedData.avgMarzePerDoklad.toFixed(2)} Kč`);
    }

    parseNumber(str) {
        if (!str || str === '') return 0;
        // Odstraníme všechny nečíselné znaky kromě čárky, tečky a minus
        const cleaned = str.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
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

    displayCelkemData(headers) {
        // Seřadit střediska podle obratu
        const sortedStrediska = Array.from(this.aggregatedData.byStredisko.entries())
            .sort((a, b) => b[1].obrat - a[1].obrat);
        
        // Seřadit kategorie podle obratu
        const sortedKategorie = Array.from(this.aggregatedData.byKategorie.entries())
            .sort((a, b) => b[1].obrat - a[1].obrat);

        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; celkem_analytics.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <!-- Celkové statistiky -->
                    <div class="kings-stats">
                        <div class="king-box">
                            <div class="king-crown">💰</div>
                            <div class="king-label">// CELKOVÝ OBRAT</div>
                            <div class="king-name">${this.formatCurrency(this.aggregatedData.totalObrat)}</div>
                            <div class="king-value">${this.aggregatedData.totalCount} položek</div>
                        </div>
                        <div class="king-box">
                            <div class="king-crown">📈</div>
                            <div class="king-label">// CELKOVÁ MARŽE</div>
                            <div class="king-name">${this.formatCurrency(this.aggregatedData.totalMarze)}</div>
                            <div class="king-value">${((this.aggregatedData.totalMarze / this.aggregatedData.totalObrat) * 100).toFixed(1)}% marže</div>
                        </div>
                        <div class="king-box">
                            <div class="king-crown">🧾</div>
                            <div class="king-label">// PRŮMĚR OBRAT/ÚČTENKU</div>
                            <div class="king-name">${this.formatCurrency(this.aggregatedData.avgObratPerDoklad)}</div>
                            <div class="king-value">${this.aggregatedData.totalDoklady} účtenek</div>
                        </div>
                        <div class="king-box">
                            <div class="king-crown">💵</div>
                            <div class="king-label">// PRŮMĚR MARŽE/ÚČTENKU</div>
                            <div class="king-name">${this.formatCurrency(this.aggregatedData.avgMarzePerDoklad)}</div>
                            <div class="king-value">${(this.aggregatedData.totalCount / this.aggregatedData.totalDoklady).toFixed(1)} položek/účtenku</div>
                        </div>
                    </div>

                    <!-- Tab switcher -->
                    <div class="retro-tab-switcher">
                        <div class="retro-tab-container">
                            <button class="retro-tab active" data-tab="strediska">
                                <span class="retro-tab-icon">●</span>
                                <span class="retro-tab-text">STŘEDISKA</span>
                            </button>
                            <button class="retro-tab" data-tab="kategorie">
                                <span class="retro-tab-icon">●</span>
                                <span class="retro-tab-text">KATEGORIE</span>
                            </button>
                            <button class="retro-tab" data-tab="detaily">
                                <span class="retro-tab-icon">●</span>
                                <span class="retro-tab-text">DETAILY</span>
                            </button>
                        </div>
                        <div class="retro-tab-indicator"></div>
                    </div>

                    <!-- Tab content - Střediska -->
                    <div id="strediska-data" class="tab-content active">
                        <div class="table-scroll">
                            <table class="retro-sales-table">
                                <thead>
                                    <tr>
                                        <th>STŘEDISKO</th>
                                        <th>OBRAT</th>
                                        <th>MARŽE</th>
                                        <th>MARŽE %</th>
                                        <th>TRANSAKCE</th>
                                        <th>PRŮMĚR/TRANS.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sortedStrediska.map(([name, data]) => `
                                        <tr>
                                            <td>${this.escapeHtml(name)}</td>
                                            <td class="numeric">${this.formatCurrency(data.obrat)}</td>
                                            <td class="numeric">${this.formatCurrency(data.marze)}</td>
                                            <td class="numeric">${((data.marze / data.obrat) * 100).toFixed(1)}%</td>
                                            <td class="numeric">${data.count}</td>
                                            <td class="numeric">${this.formatCurrency(data.obrat / data.count)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Tab content - Kategorie -->
                    <div id="kategorie-data" class="tab-content">
                        <div class="table-scroll">
                            <table class="retro-sales-table">
                                <thead>
                                    <tr>
                                        <th>KATEGORIE</th>
                                        <th>OBRAT</th>
                                        <th>MARŽE</th>
                                        <th>MARŽE %</th>
                                        <th>TRANSAKCE</th>
                                        <th>PRŮMĚR/TRANS.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sortedKategorie.map(([name, data]) => `
                                        <tr>
                                            <td>${this.escapeHtml(name)}</td>
                                            <td class="numeric">${this.formatCurrency(data.obrat)}</td>
                                            <td class="numeric">${this.formatCurrency(data.marze)}</td>
                                            <td class="numeric">${((data.marze / data.obrat) * 100).toFixed(1)}%</td>
                                            <td class="numeric">${data.count}</td>
                                            <td class="numeric">${this.formatCurrency(data.obrat / data.count)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Tab content - Detaily -->
                    <div id="detaily-data" class="tab-content">
                        <div class="retro-filter-panel">
                            <div class="retro-filter-row">
                                <span class="retro-filter-label">// FILTR:</span>
                                <input type="text" class="retro-filter-input" id="celkemFilter" 
                                       placeholder="Filtrovat podle názvu, střediska, kategorie...">
                                <select id="strediskoFilter" class="retro-filter-select">
                                    <option value="">Všechna střediska</option>
                                    ${sortedStrediska.map(([name]) => `<option value="${this.escapeHtml(name)}">${this.escapeHtml(name)}</option>`).join('')}
                                </select>
                                <select id="kategorieFilter" class="retro-filter-select">
                                    <option value="">Všechny kategorie</option>
                                    ${sortedKategorie.map(([name]) => `<option value="${this.escapeHtml(name)}">${this.escapeHtml(name)}</option>`).join('')}
                                </select>
                                <button class="retro-filter-clear" id="clearCelkemFilter">
                                    VYMAZAT
                                </button>
                            </div>
                        </div>

                        <!-- Datové filtry -->
                        <div class="date-filter-section">
                            <div class="date-filter-header">
                                <div class="filter-label">// DATOVÉ FILTRY</div>
                                <div class="filter-info">Filtrování podle data vystavení dokladu</div>
                            </div>
                            
                            <div class="date-filter-inputs">
                                <div class="date-input-group">
                                    <label for="dateFrom">OD DATUM:</label>
                                    <input type="date" id="dateFrom" class="date-input">
                                </div>
                                <div class="date-input-group">
                                    <label for="dateTo">DO DATUM:</label>
                                    <input type="date" id="dateTo" class="date-input">
                                </div>
                            </div>
                            
                            <div class="date-filter-buttons">
                                <button type="button" class="quick-filter-btn" id="weekBtn">
                                    POSLEDNÍ TÝDEN
                                </button>
                                <button type="button" class="quick-filter-btn" id="monthBtn">
                                    AKTUÁLNÍ MĚSÍC
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

                        <div class="table-scroll">
                            <table class="retro-sales-table" id="celkemTable">
                                <thead>
                                    <tr>
                                        <th>DATUM</th>
                                        <th>NÁZEV</th>
                                        <th>STŘEDISKO</th>
                                        <th>OBRAT</th>
                                        <th>MARŽE</th>
                                        <th>KATEGORIE</th>
                                    </tr>
                                </thead>
                                <tbody id="celkemTableBody">
                                    <!-- Bude vyplněno JavaScriptem -->
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <div class="retro-pagination">
                            <div class="pagination-info">
                                <span id="recordsInfo">Zobrazeno 0-0 z 0 záznamů</span>
                            </div>
                            <div class="pagination-controls">
                                <button id="prevPage" class="pagination-btn">&lt;</button>
                                <span id="pageInfo">1 / 1</span>
                                <button id="nextPage" class="pagination-btn">&gt;</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// CELKOVÉ STATISTIKY ACTIVE</span>
                        <span class="retro-blink">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">▓▒░</span>
                        <span class="retro-small-text">SYNC: 100% | AKTUALIZOVÁNO: ${new Date().toLocaleTimeString('cs-CZ')}</span>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
        this.renderDetailTable();
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    renderDetailTable() {
        const tbody = document.getElementById('celkemTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredRows.length);
        const pageRows = this.filteredRows.slice(startIndex, endIndex);

        tbody.innerHTML = pageRows.map(row => `
            <tr>
                <td>${this.escapeHtml(row[0] || '')}</td>
                <td>${this.escapeHtml(row[2] || '')}</td>
                <td>${this.escapeHtml(row[6] || '')}</td>
                <td class="numeric">${this.formatCurrency(this.parseNumber(row[7]))}</td>
                <td class="numeric">${this.formatCurrency(this.parseNumber(row[11]))}</td>
                <td>${this.escapeHtml(row[8] || '')}</td>
            </tr>
        `).join('');

        // Update pagination info
        const recordsInfo = document.getElementById('recordsInfo');
        const pageInfo = document.getElementById('pageInfo');
        const totalPages = Math.ceil(this.filteredRows.length / this.itemsPerPage);

        if (recordsInfo) {
            recordsInfo.textContent = `Zobrazeno ${startIndex + 1}-${endIndex} z ${this.filteredRows.length} záznamů`;
        }
        if (pageInfo) {
            pageInfo.textContent = `${this.currentPage} / ${totalPages}`;
        }

        // Update pagination buttons
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.retro-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Filters
        const celkemFilter = document.getElementById('celkemFilter');
        const strediskoFilter = document.getElementById('strediskoFilter');
        const kategorieFilter = document.getElementById('kategorieFilter');
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        const clearBtn = document.getElementById('clearCelkemFilter');

        if (celkemFilter) {
            celkemFilter.addEventListener('input', () => this.filterTable());
        }
        if (strediskoFilter) {
            strediskoFilter.addEventListener('change', () => this.filterTable());
        }
        if (kategorieFilter) {
            kategorieFilter.addEventListener('change', () => this.filterTable());
        }
        if (dateFromInput) {
            dateFromInput.addEventListener('change', () => this.filterTable());
        }
        if (dateToInput) {
            dateToInput.addEventListener('change', () => this.filterTable());
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (celkemFilter) celkemFilter.value = '';
                if (strediskoFilter) strediskoFilter.value = '';
                if (kategorieFilter) kategorieFilter.value = '';
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

        // Pagination
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderDetailTable();
                }
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredRows.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderDetailTable();
                }
            });
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.retro-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-data`).classList.add('active');

        // Animate indicator
        const indicator = document.querySelector('.retro-tab-indicator');
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContainer = document.querySelector('.retro-tab-container');
        const tabRect = activeTab.getBoundingClientRect();
        const containerRect = tabContainer.getBoundingClientRect();
        
        indicator.style.left = (tabRect.left - containerRect.left) + 'px';
        indicator.style.width = tabRect.width + 'px';
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
        const celkemFilter = document.getElementById('celkemFilter');
        const strediskoFilter = document.getElementById('strediskoFilter');
        const kategorieFilter = document.getElementById('kategorieFilter');
        
        if (dateFromInput) dateFromInput.value = '';
        if (dateToInput) dateToInput.value = '';
        if (celkemFilter) celkemFilter.value = '';
        if (strediskoFilter) strediskoFilter.value = '';
        if (kategorieFilter) kategorieFilter.value = '';
        
        this.filterTable();
    }

    filterTable() {
        const textFilter = document.getElementById('celkemFilter')?.value.toLowerCase() || '';
        const strediskoFilter = document.getElementById('strediskoFilter')?.value || '';
        const kategorieFilter = document.getElementById('kategorieFilter')?.value || '';
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        
        const dateFrom = dateFromInput ? dateFromInput.value : '';
        const dateTo = dateToInput ? dateToInput.value : '';

        this.filteredRows = this.allRows.filter(row => {
            const nazev = (row[2] || '').toLowerCase();
            const stredisko = row[6] || '';
            const kategorie = row[8] || '';
            const datum = row[0] || '';

            // Textový filtr
            const matchesText = !textFilter || 
                nazev.includes(textFilter) || 
                stredisko.toLowerCase().includes(textFilter) || 
                kategorie.toLowerCase().includes(textFilter);
            
            // Filtr střediska
            const matchesStredisko = !strediskoFilter || stredisko === strediskoFilter;
            
            // Filtr kategorie
            const matchesKategorie = !kategorieFilter || kategorie === kategorieFilter;

            // Datový filtr
            let dateMatch = true;
            if (dateFrom || dateTo) {
                const rowDate = this.parseDate(datum);
                
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

            return matchesText && matchesStredisko && matchesKategorie && dateMatch;
        });

        // DŮLEŽITÉ: Znovu agregovat data pro filtrované řádky
        this.aggregateData(this.filteredRows);
        
        // Aktualizovat okýnka s číslami (Kings stats)
        this.updateAggregatedStats();
        
        // Aktualizovat tabulky podle kategorií a středisek
        this.updateTabContent();

        this.currentPage = 1;
        this.renderDetailTable();
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; loading_celkem.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content loading">
                    <div class="loading-animation">
                        <span class="loading-text">// Načítání celkových statistik</span>
                        <span class="loading-dots">...</span>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// CONNECTING TO CELKEM STREAM</span>
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

    showMockCelkemData() {
        console.log('=== ZOBRAZUJEM MOCK CELKOVÁ DATA ===');
        
        // Mock data pro testování - několik řádků se stejnými doklady
        const mockData = [
            ['01.06.2025', 'P140340', 'ALIGATOR RX850 eXtremo 64GB', '32506027011', 'polozka', 'Čepkov', '2719.01', 'NOVÉ TELEFONY', 'Aligator', '2183.5', '535.51'],
            ['01.06.2025', 'P114194', 'CT300', '32506027011', 'polozka', 'Čepkov', '247.93', '!Servis', 'Práce', '247.93', '0'],
            ['01.06.2025', 'P126738', 'Přehrání True Tone', '32506027011', 'polozka', 'Čepkov', '165.29', '!Servis', 'Práce', '165.29', '0'],
            ['01.06.2025', 'NAP', 'Nastavení Apple', '2025003532', 'polozka', 'Čepkov', '205.79', '!Servis', 'Práce', '205.79', '0'],
            ['01.06.2025', 'P130566', 'iPhone X LCD Display', '2025003532', 'polozka', 'Čepkov', '1818.18', 'PŘÍSLUŠENSTVÍ', 'Díly', '1818.18', '0'],
            ['01.06.2025', 'P63615', 'Vícepráce', '32506021015', 'polozka', 'Šternberk', '17.36', '!Servis', 'Práce', '17.36', '0'],
            ['01.06.2025', 'P114661', 'Tvrzené sklo iPhone 15', '32506021009', 'polozka', 'Šternberk', '329.75', 'PŘÍSLUŠENSTVÍ', 'Skla a fólie', '35', '294.75'],
            ['01.06.2025', 'P141257', 'Tvrzené sklo Xiaomi Redmi Note 14', '32506021009', 'polozka', 'Šternberk', '329.75', 'PŘÍSLUŠENSTVÍ', 'Skla a fólie', '6.59', '323.16'],
            ['01.06.2025', 'P75367', 'Tvrzené sklo iPhone 13/14', '32506029006', 'polozka', 'Přerov', '329.75', 'PŘÍSLUŠENSTVÍ', 'Skla a fólie', '35.69', '294.06'],
            ['01.06.2025', 'P124068', 'Obal Xiaomi Redmi NOTE 13 PRO', '32506029006', 'polozka', 'Přerov', '288.43', 'PŘÍSLUŠENSTVÍ', 'Pouzdra a kryty', '26.2', '262.23'],
            ['01.06.2025', 'P120155', 'Bluetooth sluchátka', '32506029006', 'polozka', 'Přerov', '799.00', 'PŘÍSLUŠENSTVÍ', 'Audio', '450.00', '349.00']
        ];
        
        // Simulace agregace
        this.aggregateData(mockData);
        this.allRows = mockData;
        this.filteredRows = [...mockData];
        
        this.displayCelkemData(['Vystaveno', 'Kód', 'Název', 'Doklad', 'Typ', 'Středisko', 'Cena celkem', 'Kategorie', 'Podkategorie', 'Nákupní cena', 'Marže']);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateAggregatedStats() {
        // Aktualizace okýnek s celkovými statistikami
        const totalObratElement = document.querySelector('.king-box:nth-child(1) .king-name');
        const totalObratCountElement = document.querySelector('.king-box:nth-child(1) .king-value');
        const totalMarzeElement = document.querySelector('.king-box:nth-child(2) .king-name');
        const totalMarzePercentElement = document.querySelector('.king-box:nth-child(2) .king-value');
        const avgObratElement = document.querySelector('.king-box:nth-child(3) .king-name');
        const avgObratCountElement = document.querySelector('.king-box:nth-child(3) .king-value');
        const avgMarzeElement = document.querySelector('.king-box:nth-child(4) .king-name');
        const avgMarzeCountElement = document.querySelector('.king-box:nth-child(4) .king-value');

        if (totalObratElement) {
            totalObratElement.textContent = this.formatCurrency(this.aggregatedData.totalObrat);
        }
        if (totalObratCountElement) {
            totalObratCountElement.textContent = `${this.aggregatedData.totalCount} položek`;
        }
        if (totalMarzeElement) {
            totalMarzeElement.textContent = this.formatCurrency(this.aggregatedData.totalMarze);
        }
        if (totalMarzePercentElement) {
            const marzePercent = this.aggregatedData.totalObrat > 0 ? 
                ((this.aggregatedData.totalMarze / this.aggregatedData.totalObrat) * 100).toFixed(1) : 0;
            totalMarzePercentElement.textContent = `${marzePercent}% marže`;
        }
        if (avgObratElement) {
            avgObratElement.textContent = this.formatCurrency(this.aggregatedData.avgObratPerDoklad);
        }
        if (avgObratCountElement) {
            avgObratCountElement.textContent = `${this.aggregatedData.totalDoklady} účtenek`;
        }
        if (avgMarzeElement) {
            avgMarzeElement.textContent = this.formatCurrency(this.aggregatedData.avgMarzePerDoklad);
        }
        if (avgMarzeCountElement) {
            const itemsPerDoklad = this.aggregatedData.totalDoklady > 0 ? 
                (this.aggregatedData.totalCount / this.aggregatedData.totalDoklady).toFixed(1) : 0;
            avgMarzeCountElement.textContent = `${itemsPerDoklad} položek/účtenku`;
        }
    }

    updateTabContent() {
        // Seřadit střediska podle obratu
        const sortedStrediska = Array.from(this.aggregatedData.byStredisko.entries())
            .sort((a, b) => b[1].obrat - a[1].obrat);
        
        // Seřadit kategorie podle obratu
        const sortedKategorie = Array.from(this.aggregatedData.byKategorie.entries())
            .sort((a, b) => b[1].obrat - a[1].obrat);

        // Aktualizace tabulky středisek
        const strediskaTableBody = document.querySelector('#strediska-data tbody');
        if (strediskaTableBody) {
            strediskaTableBody.innerHTML = sortedStrediska.map(([name, data]) => `
                <tr>
                    <td>${this.escapeHtml(name)}</td>
                    <td class="numeric">${this.formatCurrency(data.obrat)}</td>
                    <td class="numeric">${this.formatCurrency(data.marze)}</td>
                    <td class="numeric">${((data.marze / data.obrat) * 100).toFixed(1)}%</td>
                    <td class="numeric">${data.count}</td>
                    <td class="numeric">${this.formatCurrency(data.obrat / data.count)}</td>
                </tr>
            `).join('');
        }

        // Aktualizace tabulky kategorií
        const kategorieTableBody = document.querySelector('#kategorie-data tbody');
        if (kategorieTableBody) {
            kategorieTableBody.innerHTML = sortedKategorie.map(([name, data]) => `
                <tr>
                    <td>${this.escapeHtml(name)}</td>
                    <td class="numeric">${this.formatCurrency(data.obrat)}</td>
                    <td class="numeric">${this.formatCurrency(data.marze)}</td>
                    <td class="numeric">${((data.marze / data.obrat) * 100).toFixed(1)}%</td>
                    <td class="numeric">${data.count}</td>
                    <td class="numeric">${this.formatCurrency(data.obrat / data.count)}</td>
                </tr>
            `).join('');
        }

        // Aktualizace filtračních selectů
        const strediskoFilterSelect = document.getElementById('strediskoFilter');
        if (strediskoFilterSelect) {
            const currentValue = strediskoFilterSelect.value;
            strediskoFilterSelect.innerHTML = `
                <option value="">Všechna střediska</option>
                ${sortedStrediska.map(([name]) => `<option value="${this.escapeHtml(name)}">${this.escapeHtml(name)}</option>`).join('')}
            `;
            strediskoFilterSelect.value = currentValue; // Zachovat současnou hodnotu
            
            // Znovu zaregistrovat event listener
            strediskoFilterSelect.removeEventListener('change', this.filterTableBound);
            this.filterTableBound = () => this.filterTable();
            strediskoFilterSelect.addEventListener('change', this.filterTableBound);
        }

        const kategorieFilterSelect = document.getElementById('kategorieFilter');
        if (kategorieFilterSelect) {
            const currentValue = kategorieFilterSelect.value;
            kategorieFilterSelect.innerHTML = `
                <option value="">Všechny kategorie</option>
                ${sortedKategorie.map(([name]) => `<option value="${this.escapeHtml(name)}">${this.escapeHtml(name)}</option>`).join('')}
            `;
            kategorieFilterSelect.value = currentValue; // Zachovat současnou hodnotu
            
            // Znovu zaregistrovat event listener
            kategorieFilterSelect.removeEventListener('change', this.filterTableBound);
            kategorieFilterSelect.addEventListener('change', this.filterTableBound);
        }
    }
}

// Export pro použití v jiných souborech
window.CelkemDataLoader = CelkemDataLoader; 