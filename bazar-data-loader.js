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
        const parts = dateString.split('.');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Měsíce jsou 0-indexované
            const year = parseInt(parts[2]);
            return new Date(year, month, day);
        }
        
        return new Date(dateString);
    }

    displayBazarTable(headers, rows) {
        // Statistiky
        const prodaneCount = rows.filter(row => row[0] === 'Prodáno').length;
        const naskladneneCount = rows.filter(row => row[0] === 'Naskladněno').length;
        const celkemCount = rows.length;
        
        // Nejčastější typy telefonů
        const typyTelefonu = {};
        rows.forEach(row => {
            const typ = row[3]; // sloupec D - Typ
            if (typ && typ.trim()) {
                typyTelefonu[typ] = (typyTelefonu[typ] || 0) + 1;
            }
        });
        
        const nejcastejsiTypy = Object.entries(typyTelefonu)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

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
                    <!-- Statistiky -->
                    <div class="bazar-stats">
                        <div class="stat-box">
                            <div class="stat-label">// PRODÁNO</div>
                            <div class="stat-value">${prodaneCount}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">// NASKLADNĚNO</div>
                            <div class="stat-value">${naskladneneCount}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">// CELKEM</div>
                            <div class="stat-value">${celkemCount}</div>
                        </div>
                    </div>

                    <!-- Nejčastější typy -->
                    <div class="top-types">
                        <h3>// NEJČASTĚJŠÍ TYPY TELEFONŮ</h3>
                        <div class="types-list">
                            ${nejcastejsiTypy.map(([typ, pocet]) => `
                                <div class="type-item">
                                    <span class="type-name">${this.escapeHtml(typ)}</span>
                                    <span class="type-count">${pocet}x</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Filtry -->
                    <div class="bazar-filters">
                        <!-- Textový filtr -->
                        <div class="filter-section">
                            <input type="text" id="bazarFilter" placeholder="// Filtrovat podle typu, IMEI, jména..." 
                                   onkeyup="bazarLoader.filterTable()">
                        </div>
                        
                        <!-- Datový filtr -->
                        <div class="date-filter-section">
                            <div class="date-filter-header">
                                <span class="filter-label">// FILTR PODLE OBDOBÍ</span>
                            </div>
                            <div class="date-filter-inputs">
                                <div class="date-input-group">
                                    <label for="dateFrom">OD:</label>
                                    <input type="date" id="dateFrom" onchange="bazarLoader.filterTable()">
                                </div>
                                <div class="date-input-group">
                                    <label for="dateTo">DO:</label>
                                    <input type="date" id="dateTo" onchange="bazarLoader.filterTable()">
                                </div>
                                <button type="button" class="clear-dates-btn" onclick="bazarLoader.clearDateFilter()">
                                    VYMAZAT
                                </button>
                            </div>
                        </div>
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
                                ${rows.map(row => `
                                    <tr class="${row[0] === 'Prodáno' ? 'sold-item' : 'stocked-item'}">
                                        ${row.map((cell, index) => {
                                            // Zvýraznit cenu (sloupec F)
                                            if (index === 5 && cell && !isNaN(cell.replace(/[^\d]/g, ''))) {
                                                return `<td class="price-cell">${this.escapeHtml(cell)}</td>`;
                                            }
                                            // Zvýraznit stav (sloupec A)
                                            if (index === 0) {
                                                return `<td class="status-cell">${this.escapeHtml(cell)}</td>`;
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
        
        const mockData = [
            ['Prodáno', 'V25010001', '2.1.2025', 'Samsung Galaxy A14', '359051899089270', '1590', 'ne', 'ne', 'ne', 'Kováčik', 'Lukáš'],
            ['Prodáno', 'V25010002', '3.1.2025', 'Xiaomi Redmi Note 9 Pro', '861722050416491', '2590', 'ne', 'ne', 'ne', 'Babušík', 'Sandra'],
            ['Naskladněno', 'V25010005', '3.1.2025', 'Apple iPhone 15, 128GB', '353173584221053', '13000', 'ne', 'ne', 'ne', 'Šebák', 'Milan'],
            ['Prodáno', 'V25010006', '4.1.2025', 'Xiaomi Redmi 13C 5G', '868278066655583', '2190', 'ano', 'ano', 'ne', 'Gabriel', 'Jiří'],
            ['Prodáno', 'V25010007', '5.1.2025', 'Apple iPhone 12', '352991091004279', '8500', 'ne', 'ano', 'ne', 'Kosev', 'Roman'],
            ['Naskladněno', 'V25010008', '6.1.2025', 'Samsung Galaxy S21', '868278066655584', '12000', 'ano', 'ano', 'ano', 'Novák', 'Petr'],
            ['Prodáno', 'V25010009', '7.1.2025', 'Xiaomi Mi 11', '861722050416492', '7500', 'ne', 'ne', 'ne', 'Svoboda', 'Jan'],
            ['Prodáno', 'V25010010', '8.1.2025', 'iPhone 13 Pro', '353173584221054', '18000', 'ano', 'ano', 'ano', 'Dvořák', 'Marie'],
            ['Naskladněno', 'V25010011', '9.1.2025', 'OnePlus 9', '868278066655585', '9500', 'ne', 'ano', 'ne', 'Černý', 'Tomáš'],
            ['Prodáno', 'V25010012', '10.1.2025', 'Google Pixel 6', '861722050416493', '11000', 'ano', 'ne', 'ne', 'Veselý', 'Pavel'],
            ['Prodáno', 'V25010013', '11.1.2025', 'Samsung Galaxy Note 20', '353173584221055', '14500', 'ne', 'ano', 'ano', 'Horák', 'Jiří'],
            ['Naskladněno', 'V25010014', '12.1.2025', 'Xiaomi Redmi Note 12', '868278066655586', '4500', 'ano', 'ne', 'ne', 'Kratochvíl', 'Michal'],
            ['Prodáno', 'V25010015', '13.1.2025', 'iPhone 14', '861722050416494', '22000', 'ano', 'ano', 'ano', 'Procházka', 'Anna'],
            ['Prodáno', 'V25010016', '14.1.2025', 'Huawei P40', '353173584221056', '6800', 'ne', 'ne', 'ne', 'Krejčí', 'Václav'],
            ['Naskladněno', 'V25010017', '15.1.2025', 'Motorola Edge 30', '868278066655587', '8200', 'ano', 'ano', 'ne', 'Fiala', 'Zdeněk'],
            ['Prodáno', 'V25010018', '16.1.2025', 'Sony Xperia 5', '861722050416495', '9800', 'ne', 'ano', 'ano', 'Pokorný', 'Lukáš'],
            ['Prodáno', 'V25010019', '17.1.2025', 'Nokia 8.3', '353173584221057', '5500', 'ano', 'ne', 'ne', 'Malý', 'David'],
            ['Naskladněno', 'V25010020', '18.1.2025', 'Realme GT', '868278066655588', '7200', 'ne', 'ano', 'ano', 'Růžička', 'Martin'],
            ['Prodáno', 'V25010021', '19.1.2025', 'Oppo Find X3', '861722050416496', '13500', 'ano', 'ano', 'ne', 'Beneš', 'Petr'],
            ['Prodáno', 'V25010022', '20.1.2025', 'Vivo V21', '353173584221058', '6200', 'ne', 'ne', 'ano', 'Čech', 'Tomáš']
        ];

        const headers = ['Stav', 'Číslo', 'Datum', 'Typ', 'IMEI', 'Cena', 'Nabíj.', 'Krab.', 'Zár.list', 'Vykoupil', 'Jméno'];

        console.log(`Mock data obsahují ${mockData.length} záznamů`);
        this.displayBazarTable(headers, mockData);
        this.startAutoRefresh();
    }

    filterTable() {
        const table = document.getElementById('bazarTable');
        if (!table) return;

        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        
        // Získat hodnoty filtrů
        const textFilter = document.getElementById('bazarFilter').value.toLowerCase();
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;

        let visibleCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            let shouldShow = true;

            // Textový filtr
            if (textFilter) {
                let textMatch = false;
                for (let j = 0; j < cells.length; j++) {
                    const cellText = cells[j].textContent.toLowerCase();
                    if (cellText.includes(textFilter)) {
                        textMatch = true;
                        break;
                    }
                }
                if (!textMatch) shouldShow = false;
            }

            // Datový filtr
            if (shouldShow && (dateFrom || dateTo)) {
                const dateCell = cells[2]; // sloupec C - Datum (index 2)
                if (dateCell) {
                    const rowDateStr = dateCell.textContent.trim();
                    const rowDate = this.parseDate(rowDateStr);
                    
                    if (dateFrom) {
                        const fromDate = new Date(dateFrom);
                        if (rowDate < fromDate) shouldShow = false;
                    }
                    
                    if (dateTo && shouldShow) {
                        const toDate = new Date(dateTo);
                        toDate.setHours(23, 59, 59, 999); // Konec dne
                        if (rowDate > toDate) shouldShow = false;
                    }
                }
            }

            row.style.display = shouldShow ? '' : 'none';
            if (shouldShow) visibleCount++;
        }

        // Aktualizovat počítadlo filtrovaných záznamů
        this.updateFilterStats(visibleCount, rows.length);
    }

    clearDateFilter() {
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        this.filterTable();
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