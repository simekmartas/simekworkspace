// JSONP Data Loader pro Google Sheets
class JSONPDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
    }

    async loadData(isMonthly = false) {
        console.log('=== JSONP DATA LOADER ===');
        
        try {
            this.showLoading();
            
            // Zkusíme publikovanou CSV URL
            const gid = isMonthly ? '1829845095' : '0';
            const csvUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=${gid}&single=true&output=csv`;
            
            console.log('CSV URL:', csvUrl);
            
            // Zkusíme různé přístupy
            let csvData = null;
            
            // Přístup 1: Fetch s no-cors mode
            try {
                console.log('Zkouším fetch s no-cors...');
                const response = await fetch(csvUrl, {
                    method: 'GET',
                    mode: 'no-cors',
                    cache: 'no-cache'
                });
                console.log('No-cors response:', response);
            } catch (error) {
                console.log('No-cors selhal:', error.message);
            }
            
            // Přístup 2: Použití Google Sheets publikované URL
            try {
                console.log('Zkouším publikovanou URL...');
                const publishedUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSQyn0JYmE8u7sclbQH9NQyWdgnHP-mUD-whljYrrWy4ipE1Z016AcYeumZnRB5rBfDz0x9THnH7kb8/pub?gid=${gid}&single=true&output=csv`;
                console.log('Published URL:', publishedUrl);
                
                const response = await fetch(publishedUrl, {
                    method: 'GET',
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    csvData = await response.text();
                    console.log('Publikovaná URL ÚSPĚŠNÁ - délka dat:', csvData.length);
                }
            } catch (error) {
                console.log('Publikovaná URL selhala:', error.message);
            }
            
            // Přístup 3: Proxy přes Google Apps Script (pokud je k dispozici)
            if (!csvData || csvData.length < 100) {
                console.log('Zkouším Google Apps Script proxy...');
                // Toto bude aktualizováno po vytvoření proxy
            }
            
            if (csvData && csvData.length > 100) {
                console.log('✅ Data načtena, zpracovávám...');
                this.parseAndDisplayCSV(csvData, isMonthly);
            } else {
                console.log('❌ Nepodařilo se načíst data');
                this.showError();
            }
            
        } catch (error) {
            console.error('Kritická chyba:', error);
            this.showError();
        }
    }

    parseAndDisplayCSV(csvData, isMonthly) {
        console.log('=== PARSOVÁNÍ SKUTEČNÝCH DAT ===');
        console.log('Délka dat:', csvData.length);
        console.log('První 300 znaků:', csvData.substring(0, 300));
        
        const lines = csvData.split('\n').filter(line => line.trim());
        console.log('Počet řádků:', lines.length);
        
        if (lines.length === 0) {
            this.showError();
            return;
        }

        // Parsování CSV
        const headers = this.parseCSVLine(lines[0]);
        const rows = lines.slice(1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row.some(cell => cell.trim()));

        console.log(`Zpracováno ${rows.length} řádků dat`);
        console.log('Headers:', headers);
        
        if (rows.length === 0) {
            this.showError();
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
        console.log('=== ZOBRAZUJI SKUTEČNÁ DATA Z GOOGLE SHEETS ===');
        
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
                        <button class="retro-refresh-btn" onclick="window.jsonpLoader && window.jsonpLoader.loadData(${isMonthly})">[ OBNOVIT ]</button>
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
                    <span class="retro-terminal-prompt">&gt; loading_real_data.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content loading">
                    <div class="loading-animation">
                        <span class="loading-text">// Načítání skutečných dat z Google Sheets...</span>
                        <span class="loading-dots">...</span>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// CONNECTING TO GOOGLE SHEETS</span>
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

    showError() {
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; error_loading_data.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <div style="padding: 40px; text-align: center; color: #ff6b6b;">
                        <h3>// CHYBA NAČÍTÁNÍ DAT</h3>
                        <p>Nepodařilo se načíst data z Google Sheets.</p>
                        <p>Pro vyřešení problému postupujte podle návodu v souboru RYCHLY-NAVOD.md</p>
                        <button class="retro-refresh-btn" onclick="window.jsonpLoader && window.jsonpLoader.loadData(false)" style="margin-top: 20px;">[ ZKUSIT ZNOVU ]</button>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// CONNECTION FAILED</span>
                        <span class="retro-blink" style="color: #ff6b6b;">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">░░░</span>
                        <span class="retro-small-text">SYNC: 0%</span>
                    </div>
                </div>
            </div>
        `;
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
}

// Export
window.JSONPDataLoader = JSONPDataLoader; 