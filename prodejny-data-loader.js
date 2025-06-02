// Specializovaný data loader pro prodejny s podporou "králů"
class ProdejnyDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // Google Sheets ID a gid pro hlavní list
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.mainGid = '0'; // hlavní list
        this.monthlyGid = '1829845095'; // měsíční list "od 1"
        
        // Publikované URL pro CSV export
        this.basePublishedUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv`;
        
        this.refreshInterval = null;
        this.isMonthly = false;
    }

    async loadData(isMonthly = false) {
        console.log('=== NAČÍTÁNÍ PRODEJNÍCH DAT ===');
        console.log('Spreadsheet ID:', this.spreadsheetId);
        console.log('Je měsíční:', isMonthly);
        
        this.isMonthly = isMonthly;
        
        try {
            this.showLoading();
            
            // Extrémně agresivní cache-busting s mnoha parametry
            const timestamp = new Date().getTime();
            const randomId = Math.random().toString(36).substring(2, 15);
            const dateString = new Date().toISOString().split('T')[0];
            const timeString = new Date().toISOString().split('T')[1].replace(/[:.]/g, '');
            const microtime = performance.now().toString().replace('.', '');
            const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            
            // URL pro CSV export s maximálním počtem cache-busting parametrů
            const gid = isMonthly ? this.monthlyGid : this.mainGid;
            const csvUrl = `${this.basePublishedUrl}&gid=${gid}&cachebust=${timestamp}&rand=${randomId}&date=${dateString}&time=${timeString}&micro=${microtime}&session=${sessionId}&v=${Date.now()}&r=${Math.random()}&force=1&refresh=1&nocache=1`;
            
            console.log('CSV URL:', csvUrl);
            
            let csvData = null;
            
            // Přístup 1: Vlastní Netlify API proxy (nejvyšší priorita)
            console.log('=== PŘÍSTUP 1: Vlastní Netlify API ===');
            try {
                const apiUrl = `/api/sheets?spreadsheetId=${this.spreadsheetId}&gid=${gid}&cachebust=${timestamp}&rand=${randomId}&v=${Date.now()}`;
                console.log('Netlify API URL:', apiUrl);
                
                const apiResponse = await fetch(apiUrl, {
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'text/csv, text/plain, */*',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                
                console.log('Netlify API response status:', apiResponse.status);
                
                if (apiResponse.ok) {
                    csvData = await apiResponse.text();
                    console.log('Netlify API ÚSPĚŠNÝ - délka dat:', csvData.length);
                }
            } catch (error) {
                console.log('Netlify API přístup selhal:', error.message);
            }
            
            // Přístup 2: Zkusíme CORS Anywhere (fallback)
            if (!csvData || csvData.length < 100) {
                console.log('=== PŘÍSTUP 2: CORS Anywhere ===');
                try {
                    const proxyUrl = `https://cors-anywhere.herokuapp.com/${csvUrl}`;
                    console.log('CORS Anywhere URL:', proxyUrl);
                    
                    const proxyResponse = await fetch(proxyUrl, {
                        cache: 'no-cache',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                            'Pragma': 'no-cache',
                            'Expires': '0',
                            'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
                            'If-None-Match': '*',
                            'X-Cache-Bust': timestamp.toString(),
                            'X-Force-Refresh': '1',
                            'X-No-Cache': '1',
                            'X-Timestamp': timestamp.toString(),
                            'X-Session-Id': sessionId,
                            'X-Random': randomId
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
                            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                            'Pragma': 'no-cache',
                            'Expires': '0',
                            'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
                            'If-None-Match': '*',
                            'X-Cache-Bust': timestamp.toString(),
                            'X-Force-Refresh': '1',
                            'X-No-Cache': '1',
                            'X-Timestamp': timestamp.toString(),
                            'X-Session-Id': sessionId,
                            'X-Random': randomId
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
            
            // Přístup 4: Corsproxy.io
            if (!csvData || csvData.length < 100) {
                console.log('=== PŘÍSTUP 4: Corsproxy.io ===');
                try {
                    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(csvUrl)}`;
                    console.log('Corsproxy.io URL:', proxyUrl);
                    
                    const proxyResponse = await fetch(proxyUrl, {
                        cache: 'no-cache',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                            'Pragma': 'no-cache',
                            'Expires': '0',
                            'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
                            'If-None-Match': '*',
                            'X-Cache-Bust': timestamp.toString(),
                            'X-Force-Refresh': '1',
                            'X-No-Cache': '1',
                            'X-Timestamp': timestamp.toString(),
                            'X-Session-Id': sessionId,
                            'X-Random': randomId
                        }
                    });
                    
                    console.log('Corsproxy.io response status:', proxyResponse.status);
                    
                    if (proxyResponse.ok) {
                        csvData = await proxyResponse.text();
                        console.log('Corsproxy.io ÚSPĚŠNÝ - délka dat:', csvData.length);
                    }
                } catch (error) {
                    console.log('Corsproxy.io přístup selhal:', error.message);
                }
            }

            // Přístup 5: Proxy-cors.isomorphic-git.org
            if (!csvData || csvData.length < 100) {
                console.log('=== PŘÍSTUP 5: Proxy-cors.isomorphic-git.org ===');
                try {
                    const proxyUrl = `https://proxy-cors.isomorphic-git.org/${csvUrl}`;
                    console.log('Proxy-cors URL:', proxyUrl);
                    
                    const proxyResponse = await fetch(proxyUrl, {
                        cache: 'no-cache',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                            'Pragma': 'no-cache',
                            'Expires': '0',
                            'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
                            'If-None-Match': '*',
                            'X-Cache-Bust': timestamp.toString(),
                            'X-Force-Refresh': '1',
                            'X-No-Cache': '1',
                            'X-Timestamp': timestamp.toString(),
                            'X-Session-Id': sessionId,
                            'X-Random': randomId
                        }
                    });
                    
                    console.log('Proxy-cors response status:', proxyResponse.status);
                    
                    if (proxyResponse.ok) {
                        csvData = await proxyResponse.text();
                        console.log('Proxy-cors ÚSPĚŠNÝ - délka dat:', csvData.length);
                    }
                } catch (error) {
                    console.log('Proxy-cors přístup selhal:', error.message);
                }
            }

            // Přístup 6: Přímý fetch
            if (!csvData || csvData.length < 100) {
                console.log('=== PŘÍSTUP 6: Přímý fetch ===');
                try {
                    const response = await fetch(csvUrl, {
                        mode: 'cors',
                        cache: 'no-cache',
                        headers: {
                            'Accept': 'text/csv, text/plain, */*',
                            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                            'Pragma': 'no-cache',
                            'Expires': '0',
                            'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
                            'If-None-Match': '*',
                            'X-Cache-Bust': timestamp.toString(),
                            'X-Force-Refresh': '1',
                            'X-No-Cache': '1',
                            'X-Timestamp': timestamp.toString(),
                            'X-Session-Id': sessionId,
                            'X-Random': randomId
                        }
                    });
                    
                    console.log('Přímý přístup - status:', response.status);
                    
                    if (response.ok) {
                        csvData = await response.text();
                        console.log('Přímý přístup ÚSPĚŠNÝ - délka dat:', csvData.length);
                    }
                } catch (error) {
                    console.log('Přímý přístup selhal:', error.message);
                }
            }

            // Zpracování dat pokud se podařilo je načíst
            if (csvData && csvData.length > 100) {
                console.log('=== ÚSPĚCH: Data načtena ===');
                console.log('Délka načtených dat:', csvData.length);
                console.log('První 200 znaků:', csvData.substring(0, 200));
                this.parseAndDisplayData(csvData, isMonthly);
                this.startAutoRefresh();
                return;
            } else {
                console.log('=== SELHÁNÍ: Zobrazujem mock data ===');
                console.log('Délka csvData:', csvData ? csvData.length : 'null');
                console.log('csvData obsah:', csvData ? csvData.substring(0, 100) : 'null');
                throw new Error('Nepodařilo se načíst validní data');
            }
            
        } catch (error) {
            console.error('Chyba při načítání dat:', error.message);
            this.showMockData(isMonthly);
        }
    }

    parseAndDisplayData(csvData, isMonthly) {
        console.log('=== PARSOVÁNÍ PRODEJNÍCH DAT ===');
        console.log('Délka CSV dat:', csvData.length);
        console.log('První 500 znaků:', csvData.substring(0, 500));
        
        const lines = csvData.split('\n').filter(line => line.trim());
        console.log('Počet řádků po filtrování:', lines.length);
        
        if (lines.length === 0) {
            console.log('Žádné řádky v CSV, zobrazujem mock data');
            this.showMockData(isMonthly);
            return;
        }

        // Najít řádek s headers (může být první nebo druhý řádek)
        let headerRowIndex = 0;
        let headers = [];
        
        for (let i = 0; i < Math.min(3, lines.length); i++) {
            const testHeaders = this.parseCSVLine(lines[i]);
            if (testHeaders.includes('prodejna') || testHeaders.includes('prodejce')) {
                headers = testHeaders;
                headerRowIndex = i;
                break;
            }
        }
        
        console.log('Parsované headers:', headers);
        console.log('Header řádek index:', headerRowIndex);
        
        const rows = lines.slice(headerRowIndex + 1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row.some(cell => cell.trim())); // Odfiltrovat prázdné řádky

        console.log(`Načteno ${rows.length} řádků dat`);
        console.log('První 3 řádky dat:', rows.slice(0, 3));
        
        if (rows.length === 0) {
            console.log('Žádné datové řádky, zobrazujem mock data');
            this.showMockData(isMonthly);
            return;
        }

        // Seřadit podle sloupce polozky_nad_100 (sloupec C - index 2) od největší po nejmenší
        const sortedRows = this.sortRowsByColumn(rows, 2);
        console.log(`Po seřazení: ${sortedRows.length} řádků`);

        this.displayTable(headers, sortedRows, isMonthly);
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

    sortRowsByColumn(rows, columnIndex) {
        return rows.sort((a, b) => {
            const valueA = parseInt(a[columnIndex]) || 0;
            const valueB = parseInt(b[columnIndex]) || 0;
            return valueB - valueA; // Od největší po nejmenší
        });
    }

    findKings(rows) {
        if (rows.length === 0) return { polozkyKing: null, sluzbyKing: null };
        
        // Najít krále položek (nejvíc v sloupci C - index 2)
        let maxPolozky = 0;
        let polozkyKing = null;
        
        // Najít krále služeb (nejvíc v sloupci D - index 3)
        let maxSluzby = 0;
        let sluzbyKing = null;
        
        rows.forEach(row => {
            // Přeskočit řádek s aktualizací (první řádek obvykle obsahuje timestamp)
            if (row[0] && row[0].includes('Aktualizováno')) return;
            
            const polozky = parseInt(row[2]) || 0;
            const sluzby = parseInt(row[3]) || 0;
            const prodejce = row[1]; // sloupec B - prodejce
            
            if (polozky > maxPolozky && prodejce && prodejce.trim()) {
                maxPolozky = polozky;
                polozkyKing = { name: prodejce, value: polozky };
            }
            
            if (sluzby > maxSluzby && prodejce && prodejce.trim()) {
                maxSluzby = sluzby;
                sluzbyKing = { name: prodejce, value: sluzby };
            }
        });
        
        return { polozkyKing, sluzbyKing };
    }

    displayTable(headers, rows, isMonthly) {
        // Najít krále
        const { polozkyKing, sluzbyKing } = this.findKings(rows);
        
        // Filtrovat řádky - odstranit aktualizační řádek a prázdné řádky
        const dataRows = rows.filter(row => {
            return row[0] && !row[0].includes('Aktualizováno') && 
                   row[1] && row[1].trim() && // má prodejce
                   (parseInt(row[2]) > 0 || parseInt(row[3]) > 0); // má nějaké položky nebo služby
        });

        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; prodejny_${isMonthly ? 'monthly' : 'current'}.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <!-- Králové -->
                    <div class="kings-stats">
                        <div class="king-box">
                            <div class="king-crown">👑</div>
                            <div class="king-label">// KRÁL POLOŽEK</div>
                            <div class="king-name">${polozkyKing ? polozkyKing.name : 'N/A'}</div>
                            <div class="king-value">${polozkyKing ? polozkyKing.value : 0} položek</div>
                        </div>
                        <div class="king-box">
                            <div class="king-crown">🏆</div>
                            <div class="king-label">// KRÁL SLUŽEB</div>
                            <div class="king-name">${sluzbyKing ? sluzbyKing.name : 'N/A'}</div>
                            <div class="king-value">${sluzbyKing ? sluzbyKing.value : 0} služeb</div>
                        </div>
                    </div>

                                         <!-- Filtr -->
                     <div class="retro-filter-panel">
                         <div class="retro-filter-row">
                             <span class="retro-filter-label">// FILTR:</span>
                             <input type="text" class="retro-filter-input" id="prodejnyFilter" 
                                    placeholder="Filtrovat podle prodejny nebo prodejce...">
                             <button class="retro-filter-clear" id="clearFilterBtn">
                                 VYMAZAT
                             </button>
                             <button class="retro-refresh-btn" id="refreshDataBtn">
                                 VYMAZAT CACHE & OBNOVIT
                             </button>
                         </div>
                     </div>

                     <!-- Tabulka dat -->
                     <div class="table-scroll">
                         <table class="retro-sales-table" id="prodejnyTable">
                             <thead>
                                 <tr>
                                     ${headers.map(header => `<th class="sortable-header" data-column="${this.escapeHtml(header)}">${this.escapeHtml(header)} <span class="sort-indicator">▼</span></th>`).join('')}
                                 </tr>
                             </thead>
                            <tbody>
                                ${dataRows.map((row, index) => `
                                    <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
                                        ${row.map((cell, cellIndex) => {
                                            // Zvýraznit číselné hodnoty
                                            if (cellIndex >= 2 && !isNaN(cell) && cell.trim() !== '') {
                                                return `<td class="numeric" data-value="${cell}">${this.escapeHtml(cell)}</td>`;
                                            }
                                            return `<td>${this.escapeHtml(cell)}</td>`;
                                        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// PRODEJNY DATA STREAM ACTIVE</span>
                        <span class="retro-blink">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">▓▒░</span>
                        <span class="retro-small-text">SYNC: 100% | AKTUALIZOVÁNO: ${new Date().toLocaleTimeString('cs-CZ')}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Nastavit event listenery po vygenerování HTML
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event listener pro filtr
        const filterInput = document.getElementById('prodejnyFilter');
        if (filterInput) {
            filterInput.addEventListener('keyup', () => this.filterTable());
            filterInput.addEventListener('input', () => this.filterTable());
        }

        // Event listener pro vymazání filtru
        const clearBtn = document.getElementById('clearFilterBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const filterInput = document.getElementById('prodejnyFilter');
                if (filterInput) {
                    filterInput.value = '';
                    this.filterTable();
                }
            });
        }

        // Event listener pro obnovení dat
        const refreshBtn = document.getElementById('refreshDataBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Manuální obnovení dat s vymazáním cache...');
                this.clearAllCaches().then(() => {
                    this.loadData(this.isMonthly);
                });
            });
        }

        // Event listenery pro řazení tabulky
        const sortableHeaders = document.querySelectorAll('.sortable-header');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const columnName = header.getAttribute('data-column');
                this.sortTable(columnName);
            });
        });
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; loading_prodejny.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content loading">
                    <div class="loading-animation">
                        <span class="loading-text">// Načítání prodejních dat</span>
                        <span class="loading-dots">...</span>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// CONNECTING TO PRODEJNY STREAM</span>
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

    showMockData(isMonthly) {
        console.log('=== ZOBRAZUJEM MOCK PRODEJNÍ DATA ===');
        
        const mockHeaders = ['prodejna', 'prodejce', 'polozky_nad_100', 'sluzby_celkem', 'CT300', 'CT600', 'CT1200', 'AKT', 'ZAH250', 'NAP', 'ZAH500', 'KOP250', 'KOP500', 'PZ1', 'KNZ'];
        
        let mockData;
        
        if (isMonthly) {
            // Mock data pro měsíční přehled (vyšší čísla)
            mockData = [
                ['Globus', 'Šimon Gabriel', '349', '45', '0', '21', '2', '0', '0', '15', '0', '3', '2', '1', '1'],
                ['Čepkov', 'Lukáš Kováčik', '341', '24', '0', '7', '0', '3', '2', '3', '2', '4', '0', '0', '3'],
                ['Globus', 'Jiří Pohořelský', '282', '35', '0', '13', '0', '1', '0', '7', '0', '2', '3', '0', '9'],
                ['Čepkov', 'Tomáš Doležel', '274', '30', '0', '3', '0', '8', '0', '8', '0', '2', '2', '5', '2'],
                ['Hlavní sklad - Senimo', 'Tomáš Valenta', '239', '19', '0', '3', '0', '0', '0', '9', '0', '0', '0', '1', '6'],
                ['Šternberk', 'Adam Kolarčík', '237', '20', '0', '7', '1', '0', '0', '4', '0', '2', '0', '2', '4'],
                ['Přerov', 'Benny Babušík', '206', '15', '0', '5', '0', '0', '0', '4', '0', '1', '2', '0', '3'],
                ['Šternberk', 'Jakub Králik', '204', '13', '0', '2', '0', '1', '0', '5', '0', '3', '1', '0', '1'],
                ['Vsetín', 'Lukáš Krumpolc', '176', '14', '0', '2', '0', '0', '1', '3', '0', '1', '3', '1', '3'],
                ['Přerov', 'Jakub Málek', '135', '18', '0', '5', '0', '0', '0', '4', '0', '2', '0', '0', '7'],
                ['Vsetín', 'Štěpán Kundera', '117', '12', '0', '3', '1', '1', '2', '3', '0', '1', '0', '0', '1'],
                ['Přerov', 'Nový Prodejce', '91', '2', '0', '0', '0', '1', '0', '0', '0', '0', '0', '1', '0'],
                ['Hlavní sklad - Senimo', 'Adéla Koldová', '58', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
                ['Globus', 'František Vychodil', '42', '3', '0', '2', '0', '0', '0', '0', '0', '0', '0', '0', '1'],
                ['Přerov', 'Radek Bulandra', '10', '2', '0', '0', '0', '0', '0', '1', '0', '0', '1', '0', '0'],
                ['Globus', 'Martin Markovič', '6', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
            ];
        } else {
            // Mock data pro aktuální přehled (podle screenshotu z 26.05.2025)
            mockData = [
                ['Hlavní sklad - Senimo', 'Tomáš Valenta', '12', '2', '0', '0', '0', '0', '0', '2', '0', '0', '0', '0', '0'],
                ['Vsetín', 'Lukáš Krumpolc', '10', '1', '0', '0', '0', '0', '0', '1', '0', '0', '0', '0', '0'],
                ['Přerov', 'Benny Babušík', '8', '2', '0', '0', '0', '0', '0', '1', '0', '1', '0', '0', '0'],
                ['Šternberk', 'Jakub Králik', '6', '1', '0', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
                ['Globus', 'Jiří Pohořelský', '4', '2', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0', '1'],
                ['Hlavní sklad - Senimo', 'Adéla Koldová', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
            ];
        }

        console.log(`Mock data obsahují ${mockData.length} záznamů (${isMonthly ? 'měsíční' : 'aktuální'})`);
        this.displayTable(mockHeaders, mockData, isMonthly);
    }

    filterTable() {
        const table = document.getElementById('prodejnyTable');
        if (!table) return;

        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        const filterText = document.getElementById('prodejnyFilter').value.toLowerCase();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            let shouldShow = false;

            // Prohledat první dva sloupce (prodejna a prodejce)
            for (let j = 0; j < Math.min(2, cells.length); j++) {
                const cellText = cells[j].textContent.toLowerCase();
                if (cellText.includes(filterText)) {
                    shouldShow = true;
                    break;
                }
            }

            row.style.display = shouldShow ? '' : 'none';
        }
    }

    sortTable(columnName) {
        // Implementace řazení tabulky
        console.log('Řazení podle sloupce:', columnName);
    }

    startAutoRefresh() {
        // Automatické obnovení každé 2 minuty pro aktuálnější data
        this.refreshInterval = setInterval(() => {
            console.log('Auto-refresh prodejních dat...');
            this.loadData(this.isMonthly);
        }, 2 * 60 * 1000);
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

    async clearAllCaches() {
        console.log('=== MAZÁNÍ VŠECH CACHE ===');
        
        try {
            // 1. Vymazat browser cache pro Google Sheets URLs
            const gids = [this.mainGid, this.monthlyGid];
            for (const gid of gids) {
                const baseUrl = `${this.basePublishedUrl}&gid=${gid}`;
                console.log(`Mazání cache pro URL: ${baseUrl}`);
                
                // Pokusit se vymazat cache pomocí fetch s metodou HEAD a cache direktivami
                try {
                    await fetch(baseUrl, {
                        method: 'HEAD',
                        cache: 'reload',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    });
                } catch (e) {
                    console.log('Cache clearing fetch failed:', e.message);
                }
            }

            // 2. Vymazat Service Worker cache (pokud existuje)
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    console.log('Mazání Service Worker cache...');
                    await registration.unregister();
                }
            }

            // 3. Vymazat Cache API (pokud je podporováno)
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    console.log(`Mazání cache: ${cacheName}`);
                    await caches.delete(cacheName);
                }
            }

            // 4. Vymazat localStorage items související s daty
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('prodejny') || key.includes('google') || key.includes('sheets') || key.includes('csv'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => {
                console.log(`Mazání localStorage: ${key}`);
                localStorage.removeItem(key);
            });

            // 5. Vymazat sessionStorage items
            const sessionKeysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('prodejny') || key.includes('google') || key.includes('sheets') || key.includes('csv'))) {
                    sessionKeysToRemove.push(key);
                }
            }
            sessionKeysToRemove.forEach(key => {
                console.log(`Mazání sessionStorage: ${key}`);
                sessionStorage.removeItem(key);
            });

            // 6. Vynutit garbage collection (pokud je dostupné)
            if (window.gc) {
                console.log('Spouštění garbage collection...');
                window.gc();
            }

            // 7. Krátká pauza pro dokončení cache operací
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('=== CACHE VYMAZÁNA ===');
            
        } catch (error) {
            console.error('Chyba při mazání cache:', error);
        }
    }
}

// Export pro použití v jiných souborech
window.ProdejnyDataLoader = ProdejnyDataLoader; 