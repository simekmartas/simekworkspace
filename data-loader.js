// Data loader pro zobrazení dat bez Google Sheets iframe
class RetroDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQyn0JYmE8u7sclbQH9NQyWdgnHP-mUD-whljYrrWy4ipE1Z016AcYeumZnRB5rBfDz0x9THnH7kb8/pub?output=csv';
        this.monthlyUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQyn0JYmE8u7sclbQH9NQyWdgnHP-mUD-whljYrrWy4ipE1Z016AcYeumZnRB5rBfDz0x9THnH7kb8/pub?gid=1234567890&output=csv';
    }

    async loadData(isMonthly = false) {
        try {
            this.showLoading();
            
            // Použijeme CORS proxy pro přístup k CSV
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const targetUrl = isMonthly ? this.monthlyUrl : this.csvUrl;
            const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
            
            if (!response.ok) {
                throw new Error('Chyba při načítání dat');
            }
            
            const data = await response.json();
            const csvData = data.contents;
            
            this.parseAndDisplayCSV(csvData, isMonthly);
            
        } catch (error) {
            console.error('Chyba při načítání dat:', error);
            this.showError();
        }
    }

    parseAndDisplayCSV(csvData, isMonthly) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            this.showError('Žádná data k zobrazení');
            return;
        }

        // Parsování CSV
        const headers = this.parseCSVLine(lines[0]);
        const rows = lines.slice(1).map(line => this.parseCSVLine(line));

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
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
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
                        <table class="retro-data-table">
                            <thead>
                                <tr>
                                    ${headers.map(header => `<th>${this.escapeHtml(header)}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(row => `
                                    <tr>
                                        ${row.map(cell => `<td>${this.escapeHtml(cell)}</td>`).join('')}
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
                        <span class="loading-text">// Načítání dat</span>
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

    showError(message = 'Chyba při načítání dat') {
        this.container.innerHTML = `
            <div class="retro-data-container error">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; error.log_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content">
                    <div class="error-message">
                        <span class="error-icon">⚠</span>
                        <span class="error-text">${message}</span>
                        <button class="retry-button" onclick="location.reload()">[ ZKUSIT ZNOVU ]</button>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text error-status">// CONNECTION FAILED</span>
                        <span class="retro-blink">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">░░░</span>
                        <span class="retro-small-text">SYNC: ERROR</span>
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export pro použití v jiných souborech
window.RetroDataLoader = RetroDataLoader; 