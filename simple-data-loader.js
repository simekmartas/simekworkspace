// Jednoduchý data loader pro retro zobrazení Google Sheets dat
class SimpleRetroDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        // Použijeme Google Sheets JSON API místo CSV
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets/1vSQyn0JYmE8u7sclbQH9NQyWdgnHP-mUD-whljYrrWy4ipE1Z016AcYeumZnRB5rBfDz0x9THnH7kb8/values/';
        this.apiKey = 'AIzaSyD-9tSrke4SkUjnlWis6ZnlgEfU4dfa6M0'; // Veřejný API klíč pro čtení
    }

    async loadData(isMonthly = false) {
        try {
            this.showLoading();
            
            // Zkusíme načíst data pomocí jednoduchého fetch na CSV export
            const csvUrl = isMonthly 
                ? 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQyn0JYmE8u7sclbQH9NQyWdgnHP-mUD-whljYrrWy4ipE1Z016AcYeumZnRB5rBfDz0x9THnH7kb8/pub?gid=1829845095&single=true&output=csv'
                : 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQyn0JYmE8u7sclbQH9NQyWdgnHP-mUD-whljYrrWy4ipE1Z016AcYeumZnRB5rBfDz0x9THnH7kb8/pub?single=true&output=csv';
            
            // Zkusíme přímý přístup bez CORS proxy
            let response;
            try {
                response = await fetch(csvUrl, {
                    mode: 'cors',
                    headers: {
                        'Accept': 'text/csv'
                    }
                });
            } catch (corsError) {
                console.log('Přímý přístup selhal, zkouším proxy...');
                // Fallback na CORS proxy
                response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(csvUrl)}`);
                if (response.ok) {
                    const data = await response.json();
                    this.parseAndDisplayCSV(data.contents, isMonthly);
                    return;
                }
                throw corsError;
            }
            
            if (response.ok) {
                const csvData = await response.text();
                this.parseAndDisplayCSV(csvData, isMonthly);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.error('Chyba při načítání dat:', error);
            console.log('Zobrazujem mock data jako fallback');
            this.showMockData(isMonthly);
        }
    }

    parseAndDisplayCSV(csvData, isMonthly) {
        const lines = csvData.split('\n').filter(line => line.trim());
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
        // Pokud se nepodaří načíst data, zobrazíme mock data v retro stylu
        const mockHeaders = ['prodejna', 'prodejce', 'polozky_nad_100', 'sluzby_celkem', 'CT300', 'CT600', 'CT1200', 'AKT', 'ZAH250', 'NAP', 'ZAH500', 'KOP250', 'KOP500', 'PZ1', 'KNZ'];
        
        const mockRows = isMonthly ? [
            ['Aktualizováno:', '23. 05. 2025 22:01:36', '', '', '', '', '', '', '', '', '', '', '', '', ''],
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
            ['Aktualizováno:', '25. 05. 2025 13:12:13', '', '', '', '', '', '', '', '', '', '', '', '', ''],
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