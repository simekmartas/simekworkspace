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
                ? 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQyn0JYmE8u7sclbQH9NQyWdgnHP-mUD-whljYrrWy4ipE1Z016AcYeumZnRB5rBfDz0x9THnH7kb8/pub?gid=1234567890&single=true&output=csv'
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
            this.showMockData(isMonthly);
        }
    }

    parseAndDisplayCSV(csvData, isMonthly) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            this.showMockData(isMonthly);
            return;
        }

        // Parsování CSV
        const headers = this.parseCSVLine(lines[0]);
        const rows = lines.slice(1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row.some(cell => cell.trim())); // Odfiltrovat prázdné řádky

        this.displayTable(headers, rows, isMonthly);
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

    displayTable(headers, rows, isMonthly) {
        const title = isMonthly ? 'Měsíční statistiky prodejů' : 'Aktuální statistiky prodejů';
        const prompt = isMonthly ? 'statistiky_mesicni.csv' : 'statistiky_prodejů.csv';
        
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
                <div class="retro-data-content">
                    <div class="table-scroll">
                        <table class="retro-sales-table">
                            <thead>
                                <tr>
                                    ${headers.map(header => `<th>${this.escapeHtml(header)}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map((row, index) => `
                                    <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
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
        const mockHeaders = ['Prodejna', 'Prodejce', 'Prodeje', 'Pozice nad 10', 'Služby celkem', 'CT300', 'CT600', 'CT1200', 'AKT', 'ZAH250', 'NAP', 'ZAH500', 'KOP250', 'KOP500', 'PZ1', 'KNZ'];
        const mockRows = [
            ['Aktualizováno:', '25. 05. 2025 12:43:37', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['Prerov', 'Jakub Málek', '3', '2', '0', '0', '0', '0', '0', '1', '0', '0', '1', '0', '0'],
            ['Šternberk', 'Adam Kolarčík', '8', '1', '0', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
            ['Čepkov', 'Lukáš Kovačík', '11', '2', '1', '0', '0', '0', '0', '1', '0', '0', '0', '0', '0'],
            ['Globus', 'Šimon Gabriel', '12', '1', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
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
}

// Export pro použití v jiných souborech
window.SimpleRetroDataLoader = SimpleRetroDataLoader; 