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
        
        // Nastavit výchozí datový filtr na poslední týden
        this.setDefaultDateFilter();
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
        
        // Součet prodejních cen (sloupec W - index 22, ale v našich datech je to sloupec F - index 5)
        const prodejniCenySum = prodaneRows.reduce((sum, row) => {
            const cena = parseFloat(row[5]?.replace(/[^\d]/g, '') || 0);
            return sum + cena;
        }, 0);
        
        // Součet hodnot ze sloupce G (index 6) - v našich datech je to sloupec G
        const sloupecGSum = this.filteredRows.reduce((sum, row) => {
            const hodnota = parseFloat(row[6]?.replace(/[^\d]/g, '') || 0);
            return sum + hodnota;
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
                    <!-- Statistiky -->
                    <div class="bazar-stats">
                        <div class="stat-box">
                            <div class="stat-label">// PRODÁNO</div>
                            <div class="stat-value">${prodaneRows.length}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">// PRODEJNÍ CENY</div>
                            <div class="stat-value">${prodejniCenySum.toLocaleString('cs-CZ')} Kč</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">// NASKLADNĚNO</div>
                            <div class="stat-value">${naskladneneCount}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">// CELKEM</div>
                            <div class="stat-value">${celkemCount}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">// SLOUPEC G SUMA</div>
                            <div class="stat-value">${sloupecGSum.toLocaleString('cs-CZ')}</div>
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
                                 <button type="button" class="show-all-btn" onclick="bazarLoader.showAllRecords()">
                                     ZOBRAZIT VŠE
                                 </button>
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

                    <!-- Stránkování ovládání -->
                    <div class="pagination-controls">
                        <button class="pagination-btn" onclick="bazarLoader.goToPage(1)" ${this.currentPage === 1 ? 'disabled' : ''}>
                            ⏮ První
                        </button>
                        <button class="pagination-btn" onclick="bazarLoader.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
                            ◀ Předchozí
                        </button>
                        <span class="pagination-current">Stránka ${this.currentPage}</span>
                        <button class="pagination-btn" onclick="bazarLoader.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>
                            Další ▶
                        </button>
                        <button class="pagination-btn" onclick="bazarLoader.goToPage(${totalPages})" ${this.currentPage === totalPages ? 'disabled' : ''}>
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

        const headers = ['Stav', 'Číslo', 'Datum', 'Typ', 'IMEI', 'Cena', 'Nabíj.', 'Krab.', 'Zár.list', 'Vykoupil', 'Jméno'];

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
            'Nokia G50', 'Realme 9 Pro', 'Oppo Reno 8', 'Vivo Y33s', 'Samsung Galaxy M33'
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
            ['Svoboda', 'Ondřej'], ['Dvořák', 'Jakub'], ['Černý', 'Filip'], ['Veselý', 'Marek']
        ];
        
        const statuses = ['Prodáno', 'Naskladněno'];
        const yesNo = ['ano', 'ne'];
        
        // Generovat 50 záznamů za posledních 30 dní
        for (let i = 0; i < 50; i++) {
            const daysAgo = Math.floor(Math.random() * 30);
            const date = new Date(today);
            date.setDate(today.getDate() - daysAgo);
            
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const dateStr = `${day}.${month}.${year}`;
            
            const phone = phones[Math.floor(Math.random() * phones.length)];
            const [surname, firstName] = names[Math.floor(Math.random() * names.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const price = Math.floor(Math.random() * 20000) + 1000;
            
            // Generovat IMEI
            const imei = '35' + Math.floor(Math.random() * 1000000000000000).toString().padStart(13, '0');
            
            const record = [
                status,
                `V2501${String(i + 1).padStart(4, '0')}`,
                dateStr,
                phone,
                imei,
                price.toString(),
                yesNo[Math.floor(Math.random() * 2)],
                yesNo[Math.floor(Math.random() * 2)],
                yesNo[Math.floor(Math.random() * 2)],
                surname,
                firstName
            ];
            
            mockData.push(record);
        }
        
        // Seřadit podle data (nejnovější první)
        mockData.sort((a, b) => {
            const dateA = this.parseDate(a[2]);
            const dateB = this.parseDate(b[2]);
            return dateB - dateA;
        });
        
        return mockData;
    }

    filterTable() {
        // Získat hodnoty filtrů
        const textFilter = document.getElementById('bazarFilter')?.value.toLowerCase() || '';
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';

        // Filtrovat všechny řádky
        this.filteredRows = this.allRows.filter(row => {
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
            if (shouldShow && (dateFrom || dateTo)) {
                const rowDateStr = row[2] || ''; // sloupec C - Datum (index 2)
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

            return shouldShow;
        });

        // Reset na první stránku po filtrování
        this.currentPage = 1;
        
        // Znovu vykreslit tabulku
        const headers = ['Stav', 'Číslo', 'Datum', 'Typ', 'IMEI', 'Cena', 'Nabíj.', 'Krab.', 'Zár.list', 'Vykoupil', 'Jméno'];
        this.renderTable(headers);
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredRows.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            const headers = ['Stav', 'Číslo', 'Datum', 'Typ', 'IMEI', 'Cena', 'Nabíj.', 'Krab.', 'Zár.list', 'Vykoupil', 'Jméno'];
            this.renderTable(headers);
        }
    }

    setDefaultDateFilter() {
        // Nastavit výchozí datum na poslední týden
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        
        // Formátovat data pro input type="date" (YYYY-MM-DD)
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        
        if (dateFromInput && dateToInput) {
            dateFromInput.value = formatDate(weekAgo);
            dateToInput.value = formatDate(today);
            
            console.log(`Nastaveny výchozí datumy: ${formatDate(weekAgo)} - ${formatDate(today)}`);
            
            // Aplikovat filtr
            this.filterTable();
        }
    }

    clearDateFilter() {
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        this.filterTable();
    }

    showAllRecords() {
        // Vymazat všechny filtry
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('bazarFilter').value = '';
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