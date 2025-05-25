// Jednoduchý data loader pro retro zobrazení Google Sheets dat
class SimpleRetroDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // SPRÁVNÉ Google Sheets ID - to samé, které používají Apify actoři
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        
        // Publikované URL pro CSV export
        this.basePublishedUrl = 'https://docs.google.com/spreadsheets/d/1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE/export?format=csv';
        
        this.refreshInterval = null;
        this.isMonthly = false;
    }

    async loadData(isMonthly = false) {
        console.log('=== NAČÍTÁNÍ DAT Z GOOGLE SHEETS ===');
        console.log('Spreadsheet ID:', this.spreadsheetId);
        console.log('Je měsíční:', isMonthly);
        
        this.isMonthly = isMonthly;
        
        try {
            this.showLoading();
            
            // Vytvoříme timestamp pro cache-busting
            const timestamp = new Date().getTime();
            
            // URL pro CSV export s cache-busting
            // Pro měsíční data používáme gid=1829845095 (list "od 1")
            // Pro aktuální data používáme gid=0 (hlavní list "List 1")
            const csvUrl = isMonthly 
                ? `${this.basePublishedUrl}&gid=1829845095&cachebust=${timestamp}`
                : `${this.basePublishedUrl}&gid=0&cachebust=${timestamp}`;
            
            console.log('CSV URL:', csvUrl);
            
            let csvData = null;
            
            // Přístup 1: Zkusíme CORS Anywhere (Heroku)
            console.log('=== PŘÍSTUP 1: CORS Anywhere (prioritní) ===');
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
                
                console.log('CORS Anywhere response status:', proxyResponse.status, 'ok:', proxyResponse.ok);
                
                if (proxyResponse.ok) {
                    csvData = await proxyResponse.text();
                    console.log('CORS Anywhere ÚSPĚŠNÝ - délka dat:', csvData.length);
                    console.log('První 200 znaků:', csvData.substring(0, 200));
                }
            } catch (error) {
                console.log('CORS Anywhere přístup selhal:', error.message);
            }
            
            // Přístup 2: AllOrigins proxy jako fallback
            if (!csvData || csvData.length < 100) {
                console.log('=== PŘÍSTUP 2: AllOrigins Proxy (fallback) ===');
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
                    
                    console.log('AllOrigins Proxy response status:', proxyResponse.status, 'ok:', proxyResponse.ok);
                    
                    if (proxyResponse.ok) {
                        const proxyData = await proxyResponse.json();
                        console.log('AllOrigins Proxy data status:', proxyData.status);
                        console.log('AllOrigins Proxy contents length:', proxyData.contents ? proxyData.contents.length : 'null');
                        
                        if (proxyData.contents && proxyData.contents.length > 100) {
                            csvData = proxyData.contents;
                            console.log('AllOrigins Proxy ÚSPĚŠNÝ - délka dat:', csvData.length);
                            console.log('První 200 znaků:', csvData.substring(0, 200));
                        }
                    }
                } catch (error) {
                    console.log('AllOrigins Proxy přístup selhal:', error.message);
                }
            }
            
            // Přístup 3: Přímý fetch (poslední pokus)
            if (!csvData || csvData.length < 100) {
                console.log('=== PŘÍSTUP 3: Přímý fetch (poslední pokus) ===');
                try {
                    const response = await fetch(csvUrl, {
                        mode: 'cors',
                        cache: 'no-cache',
                        headers: {
                            'Accept': 'text/csv, text/plain, */*',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    });
                    
                    console.log('Přímý přístup - status:', response.status, 'ok:', response.ok);
                    
                    if (response.ok) {
                        csvData = await response.text();
                        console.log('Přímý přístup ÚSPĚŠNÝ - délka dat:', csvData.length);
                        console.log('První 200 znaků:', csvData.substring(0, 200));
                    }
                } catch (error) {
                    console.log('Přímý přístup selhal:', error.message);
                }
            }
            
            // Zpracování dat pokud se podařilo je načíst
            if (csvData && csvData.length > 100) {
                console.log('=== ÚSPĚCH: Data načtena, zpracovávám ===');
                this.parseAndDisplayCSV(csvData, isMonthly);
                this.startAutoRefresh();
                return;
            } else {
                console.log('=== SELHÁNÍ: Žádná validní data se nepodařilo načíst ===');
                throw new Error('Nepodařilo se načíst validní data z žádného zdroje');
            }
            
        } catch (error) {
            console.error('=== KRITICKÁ CHYBA ===');
            console.error('Chyba při načítání dat:', error.message);
            console.error('Stack trace:', error.stack);
            console.log('Zobrazujem mock data jako fallback');
            
            this.showMockData(isMonthly);
            this.startAutoRefresh();
        }
    }

    parseAndDisplayCSV(csvData, isMonthly) {
        console.log('=== PARSOVÁNÍ CSV DAT ===');
        console.log('Délka CSV dat:', csvData.length);
        console.log('První 300 znaků:', csvData.substring(0, 300));
        
        const lines = csvData.split('\n').filter(line => line.trim());
        console.log('Počet řádků po filtrování:', lines.length);
        
        if (lines.length === 0) {
            console.log('Žádná data v CSV, zobrazujem mock data');
            this.showMockData(isMonthly);
            return;
        }

        // Parsování CSV
        const headers = this.parseCSVLine(lines[0]);
        const rows = lines.slice(1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row.some(cell => cell.trim())); // Odfiltrovat prázdné řádky

        console.log(`Načteno ${rows.length} řádků dat`);
        console.log('Headers:', headers);
        
        // Debug: zobrazíme první řádek (aktualizace)
        if (rows.length > 0) {
            console.log('První řádek (aktualizace):', rows[0]);
        }
        
        if (rows.length === 0) {
            console.log('Žádné řádky dat, zobrazujem mock data');
            this.showMockData(isMonthly);
            return;
        }

        // Seřadit podle sloupce polozky_nad_100 (index 2) od největší po nejmenší
        const sortedRows = this.sortRowsByColumn(rows, headers, 'polozky_nad_100');

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
                result.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
    }

    sortRowsByColumn(rows, headers, columnName) {
        const columnIndex = headers.findIndex(header => header.toLowerCase() === columnName.toLowerCase());
        if (columnIndex === -1) {
            console.log(`Sloupec ${columnName} nenalezen, řadím podle 3. sloupce`);
            return this.sortRowsByIndex(rows, 2); // Fallback na 3. sloupec (index 2)
        }
        
        return this.sortRowsByIndex(rows, columnIndex);
    }

    sortRowsByIndex(rows, columnIndex) {
        // Oddělíme první řádek (aktualizace) od ostatních
        const firstRow = rows[0];
        const dataRows = rows.slice(1);
        
        // Seřadíme datové řádky podle číselné hodnoty ve sloupci
        const sortedDataRows = dataRows.sort((a, b) => {
            const valueA = parseFloat(a[columnIndex]) || 0;
            const valueB = parseFloat(b[columnIndex]) || 0;
            return valueB - valueA; // Od největší po nejmenší
        });
        
        // Vrátíme první řádek + seřazené datové řádky
        return [firstRow, ...sortedDataRows];
    }

    displayTable(headers, rows, isMonthly) {
        console.log('=== ZOBRAZUJI SKUTEČNÁ DATA ===');
        console.log('Počet řádků:', rows.length);
        console.log('Headers:', headers);
        console.log('První řádek dat:', rows[0]);
        
        const title = isMonthly ? 'Měsíční statistiky prodejů' : 'Aktuální statistiky prodejů';
        const prompt = isMonthly ? 'statistiky_mesicni.csv' : 'statistiky_prodejů.csv';
        const tableId = isMonthly ? 'monthly-table' : 'current-table';
        const filterId = isMonthly ? 'monthly-filter' : 'current-filter';
        
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; ${prompt}_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-filter-panel">
                    <div class="retro-filter-row">
                        <span class="retro-filter-label">&gt; FILTER:</span>
                        <input type="text" id="${filterId}" class="retro-filter-input" placeholder="// Zadejte text pro filtrování..." />
                        <button class="retro-filter-clear" onclick="this.previousElementSibling.value=''; this.previousElementSibling.dispatchEvent(new Event('input'));">[ CLEAR ]</button>
                        <button class="retro-refresh-btn" onclick="window.manualRefresh && window.manualRefresh()">[ OBNOVIT ]</button>
                    </div>
                </div>
                <div class="retro-data-content">
                    <div class="table-scroll">
                        <table class="retro-sales-table" id="${tableId}">
                            <thead>
                                <tr>
                                    ${headers.map((header, index) => `<th onclick="window.sortTable('${tableId}', ${index})" class="sortable-header">${this.escapeHtml(header)} <span class="sort-indicator">⇅</span></th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map((row, index) => `
                                    <tr class="${index % 2 === 0 ? 'even' : 'odd'}" ${index === 0 ? 'data-is-header="true"' : ''}>
                                        ${row.map((cell, cellIndex) => {
                                            const isNumeric = !isNaN(cell) && cell.trim() !== '';
                                            return `<td class="${isNumeric ? 'numeric' : ''}">${this.escapeHtml(cell)}</td>`;
                                        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// ${isMonthly ? 'MONTHLY' : 'LIVE'} DATA STREAM ACTIVE</span>
                        <span class="retro-blink">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">▓▒░</span>
                        <span class="retro-small-text">SYNC: 100%</span>
                    </div>
                </div>
            </div>
        `;

        // Přidáme event listener pro filtrování
        setTimeout(() => {
            const filterInput = document.getElementById(filterId);
            if (filterInput) {
                filterInput.addEventListener('input', (e) => {
                    this.filterTable(tableId, e.target.value);
                });
            }
        }, 100);
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; loading_data.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content loading">
                    <div class="loading-animation">
                        <span class="loading-text">// Načítání dat z Google Sheets</span>
                        <span class="loading-dots">...</span>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// CONNECTING TO DATA STREAM</span>
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
        console.log('=== ZOBRAZUJI MOCK DATA ===');
        console.log('Důvod: Nepodařilo se načíst skutečná data z Google Sheets');
        
        // Pokud se nepodaří načíst data, zobrazíme mock data v retro stylu
        const mockHeaders = ['prodejna', 'prodejce', 'polozky_nad_100', 'sluzby_celkem', 'CT300', 'CT600', 'CT1200', 'AKT', 'ZAH250', 'NAP', 'ZAH500', 'KOP250', 'KOP500', 'PZ1', 'KNZ'];
        
        const now = new Date();
        const timeString = now.toLocaleString('cs-CZ');
        
        const mockRows = isMonthly ? [
            ['Aktualizováno:', timeString, '', '', '', '', '', '', '', '', '', '', '', '', ''],
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
        ] : [
            ['Aktualizováno:', timeString, '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['Globus', 'Šimon Gabriel', '14', '1', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
            ['Čepkov', 'Lukáš Kováčik', '11', '2', '1', '0', '0', '0', '0', '1', '0', '0', '0', '0', '0'],
            ['Šternberk', 'Adam Kolarčík', '8', '1', '0', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
            ['Přerov', 'Jakub Málek', '3', '2', '0', '0', '0', '0', '0', '1', '0', '0', '1', '0', '0'],
            ['Vsetín', 'Štěpán Kundera', '3', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ];

        this.displayTable(mockHeaders, mockRows, isMonthly);
        
        // Přidáme upozornění o mock datech
        setTimeout(() => {
            const footer = this.container.querySelector('.retro-data-footer .retro-status-text');
            if (footer) {
                footer.textContent = '// DEMO DATA ACTIVE';
                footer.style.color = '#ffaa00';
            }
        }, 1000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    filterTable(tableId, filterText) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        const filter = filterText.toLowerCase();

        rows.forEach((row, index) => {
            // První řádek (aktualizace) vždy zobrazit
            if (index === 0) {
                row.style.display = '';
                return;
            }

            const cells = row.querySelectorAll('td');
            let shouldShow = false;

            if (filter === '') {
                shouldShow = true;
            } else {
                cells.forEach(cell => {
                    if (cell.textContent.toLowerCase().includes(filter)) {
                        shouldShow = true;
                    }
                });
            }

            row.style.display = shouldShow ? '' : 'none';
        });
    }

    // Spustí automatické obnovování dat každou hodinu
    startAutoRefresh() {
        // Nejprve zrušíme existující interval, pokud existuje
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Pro testování můžeme použít kratší interval (odkomentuj pro test):
        // const refreshIntervalMs = 60000; // 1 minuta pro testování
        const refreshIntervalMs = 3600000; // 1 hodina pro produkci
        
        this.refreshInterval = setInterval(() => {
            console.log('Automatické obnovování dat...');
            this.refreshData();
        }, refreshIntervalMs);

        const intervalText = refreshIntervalMs === 60000 ? 'každou minutu (TEST REŽIM)' : 'každou hodinu';
        console.log(`Automatické obnovování dat spuštěno (${intervalText})`);
    }

    // Zastaví automatické obnovování
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('Automatické obnovování dat zastaveno');
        }
    }

    // Obnoví data bez zobrazení loading obrazovky
    async refreshData() {
        try {
            console.log('=== AUTOMATICKÉ OBNOVOVÁNÍ DAT ===');
            
            const timestamp = new Date().getTime();
            const csvUrl = this.isMonthly 
                ? `${this.basePublishedUrl}&gid=1829845095&cachebust=${timestamp}`
                : `${this.basePublishedUrl}&gid=0&cachebust=${timestamp}`;
            
            console.log('Refresh URL:', csvUrl);
            
            let csvData = null;
            
            // Zkusíme CORS Anywhere (nejspolehlivější pro refresh)
            try {
                const proxyUrl = `https://cors-anywhere.herokuapp.com/${csvUrl}`;
                console.log('Refresh CORS Anywhere URL:', proxyUrl);
                
                const response = await fetch(proxyUrl, {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                console.log('Refresh CORS Anywhere response:', response.status, response.ok);
                
                if (response.ok) {
                    csvData = await response.text();
                    console.log('Refresh ÚSPĚŠNÝ - délka dat:', csvData.length);
                    console.log('Refresh první 200 znaků:', csvData.substring(0, 200));
                }
            } catch (error) {
                console.log('Refresh CORS Anywhere selhal:', error.message);
            }
            
            // Pokud se podařilo načíst data, zpracujeme je
            if (csvData) {
                this.parseAndDisplayCSV(csvData, this.isMonthly);
                this.updateRefreshIndicator();
                console.log('Data úspěšně obnovena');
            } else {
                console.log('Refresh se nezdařil, ponechávám stávající data');
            }
            
        } catch (error) {
            console.error('Chyba při automatickém obnovování dat:', error.message);
            // Při chybě nebudeme zobrazovat mock data, jen necháme stávající data
        }
    }

    // Aktualizuje indikátor posledního obnovení
    updateRefreshIndicator() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('cs-CZ');
        
        // Najdeme status text a aktualizujeme ho
        const statusElements = document.querySelectorAll('.retro-status-text');
        statusElements.forEach(element => {
            if (element.textContent.includes('DATA STREAM ACTIVE')) {
                element.textContent = `// ${this.isMonthly ? 'MONTHLY' : 'LIVE'} DATA STREAM ACTIVE (aktualizováno ${timeString})`;
            }
        });
    }
}

// Globální funkce pro řazení tabulky
window.sortTable = function(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Oddělíme první řádek (aktualizace) od ostatních
    const headerRow = rows[0];
    const dataRows = rows.slice(1);

    // Zjistíme aktuální směr řazení
    const header = table.querySelectorAll('th')[columnIndex];
    const currentSort = header.getAttribute('data-sort') || 'none';
    const newSort = currentSort === 'asc' ? 'desc' : 'asc';

    // Resetujeme všechny indikátory řazení
    table.querySelectorAll('th').forEach(th => {
        th.setAttribute('data-sort', 'none');
        const indicator = th.querySelector('.sort-indicator');
        if (indicator) indicator.textContent = '⇅';
    });

    // Nastavíme nový indikátor
    header.setAttribute('data-sort', newSort);
    const indicator = header.querySelector('.sort-indicator');
    if (indicator) {
        indicator.textContent = newSort === 'asc' ? '↑' : '↓';
    }

    // Seřadíme datové řádky
    dataRows.sort((a, b) => {
        const cellA = a.cells[columnIndex].textContent.trim();
        const cellB = b.cells[columnIndex].textContent.trim();

        // Pokusíme se o číselné porovnání
        const numA = parseFloat(cellA);
        const numB = parseFloat(cellB);

        if (!isNaN(numA) && !isNaN(numB)) {
            return newSort === 'asc' ? numA - numB : numB - numA;
        } else {
            // Textové porovnání
            return newSort === 'asc' 
                ? cellA.localeCompare(cellB, 'cs') 
                : cellB.localeCompare(cellA, 'cs');
        }
    });

    // Znovu vložíme řádky do tabulky
    tbody.innerHTML = '';
    tbody.appendChild(headerRow);
    dataRows.forEach(row => tbody.appendChild(row));
};

// Export pro použití v jiných souborech
window.SimpleRetroDataLoader = SimpleRetroDataLoader; 