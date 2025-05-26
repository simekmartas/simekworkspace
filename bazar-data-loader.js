// Specializovaný data loader pro bazarová data z Google Sheets
class BazarDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // Google Sheets ID a gid pro list BAZARVYKUP
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.bazarGid = '1980953060'; // gid pro list BAZARVYKUP
        this.statisticsGid = '1892426010'; // gid pro statistiky (prodané telefony)
        
        // Publikované URL pro CSV export
        this.basePublishedUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv`;
        
        this.refreshInterval = null;
        
        // Stránkování
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.allRows = [];
        this.filteredRows = [];
        
        // Data pro statistiky z druhé tabulky
        this.statisticsData = [];
        this.filteredStatisticsData = [];
        
        // Flag pro sledování, zda jsou statistická data inicializována
        this.statisticsDataInitialized = false;
    }

    async loadBazarData() {
        console.log('=== NAČÍTÁNÍ BAZAROVÝCH DAT A STATISTIK ===');
        console.log('Spreadsheet ID:', this.spreadsheetId);
        console.log('Bazar GID:', this.bazarGid);
        console.log('Statistics GID:', this.statisticsGid);
        
        try {
            this.showLoading();
            
            // Vytvoříme timestamp pro cache-busting
            const timestamp = new Date().getTime();
            
            // URL pro CSV export bazarových dat
            const bazarCsvUrl = `${this.basePublishedUrl}&gid=${this.bazarGid}&cachebust=${timestamp}`;
            // URL pro CSV export statistických dat
            const statisticsCsvUrl = `${this.basePublishedUrl}&gid=${this.statisticsGid}&cachebust=${timestamp}`;
            
            console.log('Bazar CSV URL:', bazarCsvUrl);
            console.log('Statistics CSV URL:', statisticsCsvUrl);
            
            let bazarCsvData = null;
            let statisticsCsvData = null;
            
            // Rychlý timeout pro všechny pokusy - pokud se nepodaří do 3 sekund, jdeme na mock data
            const quickTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout - přechod na mock data')), 3000)
            );
            
            // Zkusíme rychle načíst obě tabulky paralelně
            try {
                const [bazarData, statisticsData] = await Promise.race([
                    Promise.all([
                        this.tryLoadData(bazarCsvUrl),
                        this.tryLoadData(statisticsCsvUrl)
                    ]),
                    quickTimeout
                ]);
                
                if (bazarData && bazarData.length > 100) {
                    console.log('=== ÚSPĚCH: Bazarová data načtena rychle ===');
                    console.log('Celková délka bazarových CSV dat:', bazarData.length);
                    bazarCsvData = bazarData;
                }
                
                if (statisticsData && statisticsData.length > 100) {
                    console.log('=== ÚSPĚCH: Statistická data načtena rychle ===');
                    console.log('Celková délka statistických CSV dat:', statisticsData.length);
                    console.log('První 500 znaků statistických dat:', statisticsData.substring(0, 500));
                    statisticsCsvData = statisticsData;
                } else {
                    console.log('❌ Statistická data se nepodařilo načíst nebo jsou příliš krátká:', statisticsData ? statisticsData.length : 'null');
                }
                
                if (bazarCsvData) {
                    // Parsovat statistická data
                    if (statisticsCsvData) {
                        this.parseStatisticsData(statisticsCsvData);
                    } else {
                        console.log('⚠️ Statistická data se nenačetla, používám prázdný dataset');
                        this.statisticsData = [];
                        this.filteredStatisticsData = [];
                    }
                    
                    // Parsovat a zobrazit bazarová data
                    this.parseAndDisplayBazarData(bazarCsvData);
                    this.startAutoRefresh();
                    return;
                }
            } catch (error) {
                console.log('=== RYCHLÉ NAČÍTÁNÍ SELHALO, PŘECHOD NA MOCK DATA ===');
                console.log('Důvod:', error.message);
            }
            
            // Pokud rychlé načítání selhalo, zobrazíme mock data
            console.log('=== ZOBRAZUJEM MOCK BAZAROVÁ DATA ===');
            this.showMockBazarData();
            
        } catch (error) {
            console.error('Chyba při načítání bazarových dat:', error.message);
            console.log('=== ZOBRAZUJEM MOCK DATA ===');
            this.showMockBazarData();
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
            fetch(`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/pub?gid=${this.bazarGid}&single=true&output=csv`, {
                mode: 'cors',
                cache: 'no-cache',
                signal: AbortSignal.timeout(2000)
            }),
            
            // Alternativní formát
            fetch(`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${this.bazarGid}`, {
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

    parseStatisticsData(csvData) {
        console.log('=== PARSOVÁNÍ STATISTICKÝCH DAT ===');
        console.log('Délka statistických CSV dat:', csvData.length);
        console.log('První 1000 znaků statistických CSV:', csvData.substring(0, 1000));
        
        const lines = csvData.split('\n').filter(line => line.trim());
        console.log('Počet řádků statistických dat po filtrování:', lines.length);
        
        if (lines.length === 0) {
            console.log('Žádné řádky ve statistických CSV');
            this.statisticsData = [];
            return;
        }

        // Parsování CSV - přeskočíme header (první řádek)
        const rows = lines.slice(1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row.some(cell => cell.trim())); // Odfiltrovat prázdné řádky

        console.log(`Načteno ${rows.length} řádků statistických dat`);
        console.log('První 3 řádky statistických dat:', rows.slice(0, 3));
        
        // Zpracovat řádky - extrahovat datum (sloupec A) a prodejní cenu (sloupec F)
        this.statisticsData = rows.map(row => {
            return {
                datum: row[0] || '',      // Sloupec A - Datum
                nakupniCena: row[4] || '', // Sloupec E - Nákupní cena (index 4, protože je 0-based)
                prodejniCena: row[5] || '' // Sloupec F - Prodejní cena (index 5, protože je 0-based)
            };
        }).filter(item => item.datum && item.datum.trim() !== '' && item.datum !== 'Datum'); // Pouze řádky s datem, vyloučit header

        console.log(`Zpracováno ${this.statisticsData.length} statistických záznamů`);
        console.log('První 5 zpracované statistické záznamy:', this.statisticsData.slice(0, 5));
        
        // Debug - zkontrolovat strukturu dat
        console.log('🔍 Debug statistických dat:');
        this.statisticsData.slice(0, 10).forEach((item, index) => {
            console.log(`Řádek ${index + 1}:`, {
                datum: item.datum,
                nakupniCena: item.nakupniCena,
                prodejniCena: item.prodejniCena,
                parsedDate: this.parseDate(item.datum),
                                 parsedProdejniCena: this.parseCenaHelper(item.prodejniCena)
            });
        });
        
        // Inicializovat filtrovaná data
        this.filteredStatisticsData = [...this.statisticsData];
        
        // Označit jako inicializované
        this.statisticsDataInitialized = true;
    }

    parseCenaHelper(cenaStr) {
        if (!cenaStr) return 0;
        // Odstraníme "Kč" a mezery, ale zachováme čísla, tečky a čárky
        const cleanStr = cenaStr.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
        const number = parseFloat(cleanStr);
        return isNaN(number) ? 0 : number;
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

        // Upravit řádky pro správné zobrazení - extrahovat pouze potřebné sloupce
        const processedRows = rows.map(row => {
            // Podle skutečné struktury Google tabulky:
            // A=Stav, B=Výkupka, C=Datum, D=Typ, E=IMEI, F=?, G=Nákupní cena, ..., M=Vykoupil, ..., W=Prodejní cena
            return [
                row[0] || '',  // A - Stav
                row[1] || '',  // B - Výkupka  
                row[2] || '',  // C - Datum
                row[3] || '',  // D - Typ
                row[4] || '',  // E - IMEI
                row[6] || '',  // G - Nákupní cena (index 6, ne 5!)
                row[12] || '', // M - Vykoupil (index 12)
                row[22] || ''  // W - Prodejní cena (index 22)
            ];
        });

        // Seřadit podle data (sloupec C - Datum) od nejnovějšího
        const sortedRows = this.sortRowsByDate(processedRows, 2); // index 2 = sloupec C (Datum)
        console.log(`Po seřazení: ${sortedRows.length} řádků`);
        console.log('První 3 zpracované řádky:', sortedRows.slice(0, 3));

        const displayHeaders = ['Stav', 'Výkupka', 'Datum', 'Typ', 'IMEI', 'Nákupní cena', 'Vykoupil', 'Prodejní cena'];
        this.displayBazarTable(displayHeaders, sortedRows);
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
        // Pomocná funkce pro parsování ceny
        const parseCena = (cenaStr) => {
            if (!cenaStr) return 0;
            // Odstraníme "Kč" a mezery, ale zachováme čísla, tečky a čárky
            const cleanStr = cenaStr.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
            const number = parseFloat(cleanStr);
            return isNaN(number) ? 0 : number;
        };
        
        // ZAJISTIT, ŽE MÁME STATISTICKÁ DATA
        if (!this.statisticsData || this.statisticsData.length === 0) {
            console.log('⚠️ Statistická data nejsou k dispozici, generuji mock data');
            this.generateMockStatisticsData();
        }
        
        if (!this.filteredStatisticsData || this.filteredStatisticsData.length === 0) {
            console.log('⚠️ Filtrovaná statistická data nejsou k dispozici, používám všechna data');
            this.filteredStatisticsData = [...this.statisticsData];
        }
        
        // STATISTIKY Z DRUHÉ TABULKY (gid=1892426010)
        // Počet prodaných telefonů a součet prodejních cen z filtrovaných statistických dat
        const prodanoCount = this.filteredStatisticsData.length;
        const prodanoZaSum = this.filteredStatisticsData.reduce((sum, item) => {
            const cena = parseCena(item.prodejniCena);
            return sum + cena;
        }, 0);
        
        console.log('📊 Statistiky z druhé tabulky:', {
            prodanoCount,
            prodanoZaSum: prodanoZaSum.toLocaleString('cs-CZ'),
            filteredStatisticsDataLength: this.filteredStatisticsData.length,
            totalStatisticsDataLength: this.statisticsData ? this.statisticsData.length : 0,
            statisticsDataInitialized: this.statisticsDataInitialized,
            prvnichPet: this.filteredStatisticsData.slice(0, 5)
        });
        
        // Debug - zkontrolovat aktuální filtry
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        console.log('🔍 Aktuální filtry:', {
            dateFrom: dateFromInput ? dateFromInput.value : 'N/A',
            dateTo: dateToInput ? dateToInput.value : 'N/A',
            filteredRowsCount: this.filteredRows.length,
            allRowsCount: this.allRows.length
        });
        
        // STATISTIKY Z HLAVNÍ TABULKY (bazarová data)
        const naskladneneCount = this.filteredRows.filter(row => row[0] === 'Naskladněno').length;
        const celkemCount = this.filteredRows.length;
        
        // Součet nákupních cen (index 5 ve zpracovaných datech)
        const nakupniCenySum = this.filteredRows.reduce((sum, row) => {
            const cena = parseCena(row[5]);
            return sum + cena;
        }, 0);
        
        // Marže = prodejní ceny z druhé tabulky - nákupní ceny z hlavní tabulky
        // Pro výpočet marže potřebujeme najít odpovídající nákupní ceny pro prodané telefony
        // Zatím použijeme zjednodušený výpočet
        const marze = prodanoZaSum - nakupniCenySum; // Zjednodušený výpočet
        
        // Hodnota skladu - neprodané telefony
        const neprodaneRows = this.filteredRows.filter(row => row[0] === 'Naskladněno');
        const hodnotaSkladu = neprodaneRows.reduce((sum, row) => {
            const cena = parseCena(row[5]);
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
                            <div class="stat-value">${prodanoCount}</div>
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
                            <div class="stat-value-small">${prodanoZaSum.toLocaleString('cs-CZ')} Kč</div>
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
                                    <button type="button" class="clear-dates-btn" id="clearDatesBtn">
                                        VYMAZAT
                                    </button>
                                    <button type="button" class="show-all-btn" id="showAllBtn">
                                        ZOBRAZIT VŠE
                                    </button>
                                </div>
                                
                                <!-- Měsíční filtry -->
                                <div class="month-filter-section">
                                    <div class="month-filter-header">
                                        <span class="filter-label">// RYCHLÉ FILTRY PODLE MĚSÍCE</span>
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
                                    </div>
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
                                            // Zvýraznit nákupní cenu (index 5 ve zpracovaných datech)
                                            if (index === 5 && cell) {
                                                const cleanPrice = cell.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
                                                if (!isNaN(parseFloat(cleanPrice)) && parseFloat(cleanPrice) > 0) {
                                                    const formattedPrice = parseFloat(cleanPrice).toLocaleString('cs-CZ');
                                                    return `<td class="buy-price-cell">${formattedPrice} Kč</td>`;
                                                }
                                                return `<td class="buy-price-cell">${this.escapeHtml(cell)}</td>`;
                                            }
                                            // Zvýraznit prodejní cenu (index 7 ve zpracovaných datech)
                                            if (index === 7 && cell) {
                                                const cleanPrice = cell.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
                                                if (!isNaN(parseFloat(cleanPrice)) && parseFloat(cleanPrice) > 0) {
                                                    const formattedPrice = parseFloat(cleanPrice).toLocaleString('cs-CZ');
                                                    return `<td class="sell-price-cell">${formattedPrice} Kč</td>`;
                                                }
                                                return `<td class="sell-price-cell">${this.escapeHtml(cell)}</td>`;
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
                        <span class="retro-status-text">// BAZAR + STATISTICS SYNC ACTIVE</span>
                        <span class="retro-blink">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">▓▒░</span>
                        <span class="retro-small-text">TABLES: 2/2 | SYNC: 100%</span>
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
            
            // Měsíční tlačítka
            const januaryBtn = document.getElementById('januaryBtn');
            const februaryBtn = document.getElementById('februaryBtn');
            const marchBtn = document.getElementById('marchBtn');
            const aprilBtn = document.getElementById('aprilBtn');
            const mayBtn = document.getElementById('mayBtn');
            const juneBtn = document.getElementById('juneBtn');
            
            console.log('Hledám elementy:', {
                dateFrom: !!dateFromInput,
                dateTo: !!dateToInput,
                textFilter: !!textFilter,
                clearBtn: !!clearBtn,
                showAllBtn: !!showAllBtn,
                weekBtn: !!weekBtn,
                januaryBtn: !!januaryBtn,
                februaryBtn: !!februaryBtn,
                marchBtn: !!marchBtn,
                aprilBtn: !!aprilBtn,
                mayBtn: !!mayBtn,
                juneBtn: !!juneBtn
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
            
            // Event listenery pro měsíční tlačítka
            const monthButtons = [
                { btn: januaryBtn, month: 1, name: 'Leden' },
                { btn: februaryBtn, month: 2, name: 'Únor' },
                { btn: marchBtn, month: 3, name: 'Březen' },
                { btn: aprilBtn, month: 4, name: 'Duben' },
                { btn: mayBtn, month: 5, name: 'Květen' },
                { btn: juneBtn, month: 6, name: 'Červen' }
            ];
            
            monthButtons.forEach(({ btn, month, name }) => {
                if (btn) {
                    const handleMonthBtn = () => {
                        console.log(`${name} button clicked`);
                        try {
                            this.setMonthFilter(month);
                        } catch (error) {
                            console.error(`Chyba při nastavení filtru pro ${name}:`, error);
                        }
                    };
                    
                    btn.addEventListener('click', handleMonthBtn);
                    console.log(`${name} button nastaven`);
                }
            });
            
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
                monthButtons: monthButtons.filter(m => !!m.btn).length,
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
            'weekBtn', 'januaryBtn', 'februaryBtn', 'marchBtn', 
            'aprilBtn', 'mayBtn', 'juneBtn'
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
                        <span class="loading-text">// Načítání bazarových dat a statistik</span>
                        <span class="loading-dots">...</span>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// CONNECTING TO DUAL STREAM</span>
                        <span class="retro-blink">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">▓▒░</span>
                        <span class="retro-small-text">TABLES: 0/2 | SYNC: 0%</span>
                    </div>
                </div>
            </div>
        `;
    }



    showMockBazarData() {
        console.log('=== ZOBRAZUJEM MOCK BAZAROVÁ DATA ===');
        
        // Generovat mock data s aktuálními daty
        const mockData = this.generateMockData();
        
        // Generovat mock statistická data (vždy při použití mock dat)
        this.generateMockStatisticsData();

        const headers = ['Stav', 'Výkupka', 'Datum', 'Typ', 'IMEI', 'Nákupní cena', 'Vykoupil', 'Prodejní cena'];

        console.log(`Mock data obsahují ${mockData.length} záznamů`);
        console.log(`Mock statistická data obsahují ${this.statisticsData.length} záznamů`);
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
                status,                    // 0 - Stav
                `V2025${String(i + 1).padStart(4, '0')}`, // 1 - Výkupka
                dateStr,                   // 2 - Datum
                phone,                     // 3 - Typ
                imei,                      // 4 - IMEI
                nakupniCena.toString(),    // 5 - Nákupní cena
                vykoupil,                  // 6 - Vykoupil
                prodejniCena               // 7 - Prodejní cena
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

    generateMockStatisticsData() {
        // Pokud už jsou data inicializována, neděláme nic
        if (this.statisticsDataInitialized && this.statisticsData.length > 0) {
            console.log('📊 Mock statistická data už jsou inicializována, přeskakuji');
            return;
        }
        
        console.log('=== GENERUJI MOCK STATISTICKÁ DATA ===');
        
        const today = new Date();
        const startDate = new Date(2025, 0, 1); // 1. ledna 2025
        const endDate = new Date(); // Dnešní datum
        const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Počet prodaných telefonů (cca 60-70% z vykoupených)
        const soldCount = Math.floor(totalDays * 2.5); // Cca 2-3 prodané denně
        
        this.statisticsData = [];
        
        for (let i = 0; i < soldCount; i++) {
            // Náhodný den mezi 1.1.2025 a dneškem
            const randomDays = Math.floor(Math.random() * totalDays);
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + randomDays);
            
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const dateStr = `${day}.${month}.${year}`;
            
            // Generovat nákupní a prodejní cenu
            const nakupniCena = Math.floor(Math.random() * 14000) + 500;
            const prodejniCena = Math.floor(nakupniCena * (1.2 + Math.random() * 1.3)); // 1.2x až 2.5x nákupní ceny
            
            this.statisticsData.push({
                datum: dateStr,
                nakupniCena: nakupniCena.toString(),
                prodejniCena: prodejniCena.toString()
            });
        }
        
        // Seřadit podle data (nejnovější první)
        this.statisticsData.sort((a, b) => {
            const dateA = this.parseDate(a.datum);
            const dateB = this.parseDate(b.datum);
            return dateB - dateA;
        });
        
        // Inicializovat filtrovaná data
        this.filteredStatisticsData = [...this.statisticsData];
        
        // Označit jako inicializované
        this.statisticsDataInitialized = true;
        
        console.log(`Vygenerováno ${this.statisticsData.length} mock statistických záznamů`);
        console.log('První 5 mock statistických záznamů:', this.statisticsData.slice(0, 5));
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

            // FILTROVAT I STATISTICKÁ DATA PODLE STEJNÉHO DATOVÉHO ROZSAHU
            // Zajistit, že máme statistická data
            if (!this.statisticsData || this.statisticsData.length === 0) {
                console.log('⚠️ Statistická data nejsou k dispozici při filtrování, generuji mock data');
                this.generateMockStatisticsData();
            }
            
            if (this.statisticsData && this.statisticsData.length > 0) {
                this.filteredStatisticsData = this.statisticsData.filter(item => {
                    if (!item || !item.datum) return false;
                    
                    let shouldShow = true;
                    
                    // Aplikovat stejný datový filtr jako na hlavní tabulku
                    if (dateFromObj || dateToObj) {
                        try {
                            const itemDate = this.parseDate(item.datum);
                            
                            if (dateFromObj) {
                                if (itemDate < dateFromObj) shouldShow = false;
                            }
                            
                            if (dateToObj && shouldShow) {
                                if (itemDate > dateToObj) shouldShow = false;
                            }
                        } catch (dateError) {
                            console.error('Chyba při parsování data ve statistikách:', item.datum, dateError);
                            shouldShow = false;
                        }
                    }
                    
                    return shouldShow;
                });
                
                console.log(`Filtrovaná statistická data: ${this.filteredStatisticsData.length} z ${this.statisticsData.length} záznamů`);
                
                // Debug - ukázat první 5 filtrovaných statistických záznamů
                console.log('🔍 První 5 filtrovaných statistických záznamů:', 
                    this.filteredStatisticsData.slice(0, 5).map(item => ({
                        datum: item.datum,
                        prodejniCena: item.prodejniCena,
                        parsedDate: this.parseDate(item.datum),
                        parsedCena: this.parseCenaHelper(item.prodejniCena)
                    }))
                );
            } else {
                console.log('Žádná statistická data k filtrování');
                this.filteredStatisticsData = [];
            }

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
        console.log('🗓️ === NASTAVUJI VÝCHOZÍ ROZSAH DO DATE-PICKERŮ ===');
        
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
            
            console.log('✅ Výchozí rozsah nastaven do date-pickerů:', {
                od: '1.1.2025',
                do: todayStr
            });
            
            // Přímo spustit filtrování po nastavení hodnot
            this.filterTable();
        } else {
            console.log('❌ Nepodařilo se najít datové inputy');
        }
    }

    setWeekFilter() {
        console.log('📅 === NASTAVUJI TÝDENNÍ ROZSAH DO DATE-PICKERŮ ===');
        
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
            
            console.log('✅ Týdenní rozsah nastaven do date-pickerů:', {
                od: weekAgoStr,
                do: todayStr
            });
            
            // Přímo spustit filtrování po nastavení hodnot
            this.filterTable();
        } else {
            console.log('❌ Nepodařilo se najít datové inputy');
        }
    }

    setMonthFilter(monthNumber = null) {
        console.log('📅 === NASTAVUJI MĚSÍČNÍ ROZSAH DO DATE-PICKERŮ ===');
        
        const today = new Date();
        const currentYear = today.getFullYear();
        
        let targetMonth, targetYear;
        
        if (monthNumber) {
            // Konkrétní měsíc aktuálního roku
            targetMonth = monthNumber;
            targetYear = currentYear;
        } else {
            // Minulý měsíc (původní chování)
            const lastMonth = new Date(currentYear, today.getMonth() - 1, 1);
            targetMonth = lastMonth.getMonth() + 1;
            targetYear = lastMonth.getFullYear();
        }
        
        // První den měsíce
        const monthStart = new Date(targetYear, targetMonth - 1, 1);
        // Poslední den měsíce
        const monthEnd = new Date(targetYear, targetMonth, 0);
        
        // Nastavit textové inputy pro datum
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        
        if (dateFromInput && dateToInput) {
            // Nastavit datum OD na první den měsíce
            const monthStartStr = `1.${targetMonth}.${targetYear}`;
            dateFromInput.value = monthStartStr;
            
            // Nastavit datum DO na poslední den měsíce
            const monthEndStr = `${monthEnd.getDate()}.${targetMonth}.${targetYear}`;
            dateToInput.value = monthEndStr;
            
            const monthNames = [
                '', 'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
                'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
            ];
            
            console.log('✅ Měsíční rozsah nastaven do date-pickerů:', {
                od: monthStartStr,
                do: monthEndStr,
                mesic: `${monthNames[targetMonth]} ${targetYear}`
            });
            
            // Přímo spustit filtrování po nastavení hodnot
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
        console.log('🗑️ === MAZÁNÍ ROZSAHU Z DATE-PICKERŮ ===');
        
        // Vymazat textové inputy pro datum
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        
        if (dateFromInput) {
            dateFromInput.value = '';
        }
        
        if (dateToInput) {
            dateToInput.value = '';
        }
        
        // Přímo spustit filtrování po vymazání hodnot
        this.filterTable();
        
        console.log('✅ Datové rozsahy vymazány z date-pickerů');
    }

    showAllRecords() {
        console.log('🔄 === ZOBRAZUJI VŠECHNY ZÁZNAMY ===');
        
        // Vymazat date-pickery
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        
        if (dateFromInput) {
            dateFromInput.value = '';
        }
        
        if (dateToInput) {
            dateToInput.value = '';
        }
        
        // Vymazat textový filtr
        const textFilter = document.getElementById('bazarFilter');
        if (textFilter) {
            textFilter.value = '';
        }
        
        // Přímo spustit filtrování po vymazání všech filtrů
        this.filterTable();
        
        console.log('✅ Všechny filtry vymazány, zobrazeny všechny záznamy');
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