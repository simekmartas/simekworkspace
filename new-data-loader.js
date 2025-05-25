// Nový kompletní data loader pro Google Sheets
class NewDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.refreshInterval = null;
        this.isMonthly = false;
        
        // Seznam proxy serverů k testování (aktualizované pro 2024)
        this.proxyServers = [
            {
                name: 'AllOrigins',
                url: (targetUrl) => `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
                headers: {},
                parseResponse: (response) => response.contents
            },
            {
                name: 'CORS.SH',
                url: (targetUrl) => `https://cors.sh/${targetUrl}`,
                headers: {}
            },
            {
                name: 'Proxy CORS',
                url: (targetUrl) => `https://proxy.cors.sh/${targetUrl}`,
                headers: {}
            },
            {
                name: 'ThingProxy',
                url: (targetUrl) => `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
                headers: {}
            },
            {
                name: 'CORS Anywhere (Heroku)',
                url: (targetUrl) => `https://cors-anywhere.herokuapp.com/${targetUrl}`,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }
        ];
    }

    async loadData(isMonthly = false) {
        console.log('=== NOVÝ DATA LOADER ===');
        this.isMonthly = isMonthly;
        
        try {
            this.showLoading();
            
            const timestamp = new Date().getTime();
            const csvUrl = isMonthly 
                ? `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=1829845095&cachebust=${timestamp}`
                : `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=0&cachebust=${timestamp}`;
            
            console.log('Target CSV URL:', csvUrl);
            
            // Nejprve zkusíme přímý přístup
            let csvData = await this.tryDirectAccess(csvUrl);
            
            // Pokud přímý přístup selhal, zkusíme proxy servery
            if (!csvData || csvData.length < 100) {
                console.log('Přímý přístup selhal, zkouším proxy servery...');
                
                for (let i = 0; i < this.proxyServers.length; i++) {
                    const proxy = this.proxyServers[i];
                    console.log(`=== ZKOUŠÍM PROXY ${i + 1}/${this.proxyServers.length}: ${proxy.name} ===`);
                    
                    try {
                        csvData = await this.tryProxy(proxy, csvUrl);
                        if (csvData && csvData.length > 100) {
                            console.log(`✅ ÚSPĚCH s ${proxy.name}!`);
                            break;
                        }
                    } catch (error) {
                        console.log(`❌ ${proxy.name} selhal:`, error.message);
                    }
                }
            }
            
            // Zpracování dat
            if (csvData && csvData.length > 100) {
                console.log('✅ Data úspěšně načtena, zpracovávám...');
                this.parseAndDisplayCSV(csvData, isMonthly);
                this.startAutoRefresh();
            } else {
                console.log('❌ Nepodařilo se načíst data, zobrazuji mock data');
                this.showMockData(isMonthly);
                this.startAutoRefresh();
            }
            
        } catch (error) {
            console.error('❌ Kritická chyba:', error);
            this.showMockData(isMonthly);
            this.startAutoRefresh();
        }
    }

    async tryDirectAccess(url) {
        console.log('=== ZKOUŠÍM PŘÍMÝ PŘÍSTUP ===');
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'omit',
                headers: {
                    'Accept': 'text/csv, text/plain, */*',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            console.log('Přímý přístup - status:', response.status, 'ok:', response.ok);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.text();
            console.log('Přímý přístup - délka dat:', data.length);
            console.log('Přímý přístup - první 200 znaků:', data.substring(0, 200));
            
            if (data.length > 100) {
                console.log('✅ Přímý přístup ÚSPĚŠNÝ!');
                return data;
            } else {
                throw new Error('Data jsou příliš krátká');
            }
        } catch (error) {
            console.log('❌ Přímý přístup selhal:', error.message);
            return null;
        }
    }

    async tryProxy(proxy, targetUrl) {
        const proxyUrl = proxy.url(targetUrl);
        console.log(`Proxy URL (${proxy.name}):`, proxyUrl);
        
        const response = await fetch(proxyUrl, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                ...proxy.headers
            }
        });
        
        console.log(`${proxy.name} response:`, response.status, response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let data;
        if (proxy.parseResponse) {
            const jsonData = await response.json();
            data = proxy.parseResponse(jsonData);
        } else {
            data = await response.text();
        }
        
        console.log(`${proxy.name} data length:`, data ? data.length : 'null');
        console.log(`${proxy.name} first 200 chars:`, data ? data.substring(0, 200) : 'null');
        
        return data;
    }

    parseAndDisplayCSV(csvData, isMonthly) {
        console.log('=== PARSOVÁNÍ CSV ===');
        console.log('Délka dat:', csvData.length);
        
        const lines = csvData.split('\n').filter(line => line.trim());
        console.log('Počet řádků:', lines.length);
        
        if (lines.length === 0) {
            this.showMockData(isMonthly);
            return;
        }

        const headers = this.parseCSVLine(lines[0]);
        const rows = lines.slice(1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row.some(cell => cell.trim()));

        console.log(`Zpracováno ${rows.length} řádků dat`);
        
        if (rows.length === 0) {
            this.showMockData(isMonthly);
            return;
        }

        // Seřadit podle sloupce polozky_nad_100
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
            return this.sortRowsByIndex(rows, 2);
        }
        return this.sortRowsByIndex(rows, columnIndex);
    }

    sortRowsByIndex(rows, columnIndex) {
        const firstRow = rows[0];
        const dataRows = rows.slice(1);
        
        const sortedDataRows = dataRows.sort((a, b) => {
            const valueA = parseFloat(a[columnIndex]) || 0;
            const valueB = parseFloat(b[columnIndex]) || 0;
            return valueB - valueA;
        });
        
        return [firstRow, ...sortedDataRows];
    }

    displayTable(headers, rows, isMonthly) {
        console.log('=== ZOBRAZUJI SKUTEČNÁ DATA ===');
        
        const title = isMonthly ? 'Měsíční statistiky' : 'Aktuální statistiky';
        const prompt = isMonthly ? 'monthly_stats.csv' : 'current_stats.csv';
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
                        <button class="retro-filter-clear" onclick="document.getElementById('${filterId}').value=''; document.getElementById('${filterId}').dispatchEvent(new Event('input'));">[ CLEAR ]</button>
                        <button class="retro-refresh-btn" onclick="window.newDataLoader && window.newDataLoader.loadData(${isMonthly})">[ OBNOVIT ]</button>
                    </div>
                </div>
                <div class="retro-data-content">
                    <div class="table-scroll">
                        <table class="retro-sales-table" id="${tableId}">
                            <thead>
                                <tr>
                                    ${headers.map((header, index) => `<th onclick="window.sortNewTable('${tableId}', ${index})" class="sortable-header">${this.escapeHtml(header)} <span class="sort-indicator">⇅</span></th>`).join('')}
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
                        <span class="loading-text">// Testování proxy serverů...</span>
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
        
        const mockHeaders = ['prodejna', 'prodejce', 'polozky_nad_100', 'sluzby_celkem', 'CT300', 'CT600', 'CT1200', 'AKT', 'ZAH250', 'NAP', 'ZAH500', 'KOP250', 'KOP500', 'PZ1', 'KNZ'];
        
        const now = new Date();
        const timeString = now.toLocaleString('cs-CZ');
        
        const mockRows = isMonthly ? [
            ['Aktualizováno:', timeString, '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['Globus', 'Šimon Gabriel', '349', '45', '0', '21', '2', '0', '0', '15', '0', '3', '2', '1', '1'],
            ['Čepkov', 'Lukáš Kováčik', '341', '24', '0', '7', '0', '3', '2', '3', '2', '4', '0', '0', '3'],
            ['Globus', 'Jiří Pohořelský', '282', '35', '0', '13', '0', '1', '0', '7', '0', '2', '3', '0', '9']
        ] : [
            ['Aktualizováno:', timeString, '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['Globus', 'Šimon Gabriel', '14', '1', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
            ['Čepkov', 'Lukáš Kováčik', '11', '2', '1', '0', '0', '0', '0', '1', '0', '0', '0', '0', '0'],
            ['Šternberk', 'Adam Kolarčík', '8', '1', '0', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ];

        this.displayTable(mockHeaders, mockRows, isMonthly);
        
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

    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        const refreshIntervalMs = 3600000; // 1 hodina
        
        this.refreshInterval = setInterval(() => {
            console.log('Automatické obnovování...');
            this.loadData(this.isMonthly);
        }, refreshIntervalMs);

        console.log('Automatické obnovování spuštěno (každou hodinu)');
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}

// Globální funkce pro řazení
window.sortNewTable = function(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const headerRow = rows[0];
    const dataRows = rows.slice(1);

    const header = table.querySelectorAll('th')[columnIndex];
    const currentSort = header.getAttribute('data-sort') || 'none';
    const newSort = currentSort === 'asc' ? 'desc' : 'asc';

    table.querySelectorAll('th').forEach(th => {
        th.setAttribute('data-sort', 'none');
        const indicator = th.querySelector('.sort-indicator');
        if (indicator) indicator.textContent = '⇅';
    });

    header.setAttribute('data-sort', newSort);
    const indicator = header.querySelector('.sort-indicator');
    if (indicator) {
        indicator.textContent = newSort === 'asc' ? '↑' : '↓';
    }

    dataRows.sort((a, b) => {
        const cellA = a.cells[columnIndex].textContent.trim();
        const cellB = b.cells[columnIndex].textContent.trim();

        const numA = parseFloat(cellA);
        const numB = parseFloat(cellB);

        if (!isNaN(numA) && !isNaN(numB)) {
            return newSort === 'asc' ? numA - numB : numB - numA;
        } else {
            return newSort === 'asc' 
                ? cellA.localeCompare(cellB, 'cs') 
                : cellB.localeCompare(cellA, 'cs');
        }
    });

    tbody.innerHTML = '';
    tbody.appendChild(headerRow);
    dataRows.forEach(row => tbody.appendChild(row));
};

// Export
window.NewDataLoader = NewDataLoader; 