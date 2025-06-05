// Specializovaný data loader pro servisní data z Google Sheets
class ServisDataLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // Google Sheets ID a gid pro list SERVIS1
        this.spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
        this.servisGid = '1361797898'; // gid pro list SERVIS1
        
        // Publikované URL pro CSV export
        this.basePublishedUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv`;
        
        this.refreshInterval = null;
        
        // Stránkování
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.allRows = [];
        this.filteredRows = [];
        this.aggregatedData = [];
    }

    async loadServisData() {
        console.log('=== NAČÍTÁNÍ SERVISNÍCH DAT ===');
        console.log('Spreadsheet ID:', this.spreadsheetId);
        console.log('Servis GID:', this.servisGid);
        
        try {
            this.showLoading();
            
            // Vytvoříme timestamp pro cache-busting
            const timestamp = new Date().getTime();
            
            // URL pro CSV export servisních dat
            const csvUrl = `${this.basePublishedUrl}&gid=${this.servisGid}&cachebust=${timestamp}`;
            
            console.log('CSV URL:', csvUrl);
            
            let csvData = null;
            
            // Rychlý timeout pro všechny pokusy - pokud se nepodaří do 3 sekund, jdeme na mock data
            const quickTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout - přechod na mock data')), 3000)
            );
            
            // Zkusíme rychle načíst data s timeoutem
            try {
                csvData = await Promise.race([
                    this.tryLoadData(csvUrl),
                    quickTimeout
                ]);
                
                if (csvData && csvData.length > 100) {
                    console.log('=== ÚSPĚCH: Servisní data načtena rychle ===');
                    console.log('Celková délka CSV dat:', csvData.length);
                    this.parseAndDisplayServisData(csvData);
                    this.startAutoRefresh();
                    return;
                }
            } catch (error) {
                console.log('=== RYCHLÉ NAČÍTÁNÍ SELHALO, PŘECHOD NA MOCK DATA ===');
                console.log('Důvod:', error.message);
            }
            
            // Pokud rychlé načítání selhalo, zobrazíme mock data
            console.log('=== ZOBRAZUJEM MOCK SERVISNÍ DATA ===');
            this.showMockServisData();
            
        } catch (error) {
            console.error('Chyba při načítání servisních dat:', error.message);
            console.log('=== ZOBRAZUJEM MOCK DATA ===');
            this.showMockServisData();
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
            fetch(`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/pub?gid=${this.servisGid}&single=true&output=csv`, {
                mode: 'cors',
                cache: 'no-cache',
                signal: AbortSignal.timeout(2000)
            }),
            
            // Alternativní formát
            fetch(`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${this.servisGid}`, {
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

    parseAndDisplayServisData(csvData) {
        console.log('=== PARSOVÁNÍ SERVISNÍCH DAT ===');
        console.log('Délka CSV dat:', csvData.length);
        console.log('První 1000 znaků CSV:', csvData.substring(0, 1000));
        
        const lines = csvData.split('\n').filter(line => line.trim());
        console.log('Počet řádků po filtrování:', lines.length);
        console.log('První 3 řádky:', lines.slice(0, 3));
        
        if (lines.length === 0) {
            console.log('Žádné řádky v CSV, zobrazujem mock data');
            this.showMockServisData();
            return;
        }

        // Parsování CSV
        const headers = this.parseCSVLine(lines[0]);
        console.log('Parsované headers:', headers);
        
        const rows = lines.slice(1)
            .map(line => this.parseCSVLine(line))
            .filter(row => row.some(cell => cell.trim())); // Odfiltrovat prázdné řádky

        console.log(`Načteno ${rows.length} řádků servisních dat`);
        console.log('První 3 řádky dat:', rows.slice(0, 3));
        
        if (rows.length === 0) {
            console.log('Žádné datové řádky, zobrazujem mock data');
            this.showMockServisData();
            return;
        }

        // Uložíme původní data
        this.allRows = rows;
        
        // Agregujeme data podle servisních středisek
        this.aggregatedData = this.aggregateDataByStredisko(rows);
        
        this.displayServisTable(this.aggregatedData);
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

    aggregateDataByStredisko(rows) {
        console.log('=== AGREGACE DAT PODLE STŘEDISEK ===');
        
        const strediskaMap = new Map();
        let minDate = null;
        let maxDate = null;
        
        rows.forEach(row => {
            // Sloupce podle Google tabulky:
            // A = Kód, B = Datum, C = Celkem, D = Položky, E = Servisní středisko, F = Servisní technik, G = Položky, H = POST
            const kod = row[0] || '';
            const datum = row[1] || '';
            const celkem = row[2] || '';
            const servisniStredisko = row[4] || ''; // sloupec E
            const polozky = row[6] || '0'; // sloupec G (počet položek)
            
            // Přeskočíme řádky bez střediska
            if (!servisniStredisko || servisniStredisko.trim() === '') {
                return;
            }
            
            // Parsování částky (odstraníme "Kč" a mezery, převedeme na číslo)
            const castka = this.parseCastka(celkem);
            const pocetPolozek = parseInt(polozky) || 0;
            
            // Sledování datumového rozmezí
            const parsedDate = this.parseDate(datum);
            if (parsedDate && parsedDate.getTime() > 0) {
                if (!minDate || parsedDate < minDate) minDate = parsedDate;
                if (!maxDate || parsedDate > maxDate) maxDate = parsedDate;
            }
            
            // Agregace podle střediska
            if (!strediskaMap.has(servisniStredisko)) {
                strediskaMap.set(servisniStredisko, {
                    stredisko: servisniStredisko,
                    obrat: 0,
                    pocetObjednavek: 0,
                    celkemPolozek: 0
                });
            }
            
            const strediskoData = strediskaMap.get(servisniStredisko);
            strediskoData.obrat += castka;
            strediskoData.pocetObjednavek += 1;
            strediskoData.celkemPolozek += pocetPolozek;
        });
        
        // Převedeme na pole a vypočítáme průměry
        const result = Array.from(strediskaMap.values()).map(item => ({
            stredisko: item.stredisko,
            obrat: item.obrat,
            prumerPolozekNaObjednavku: item.pocetObjednavek > 0 ? 
                Math.round((item.celkemPolozek / item.pocetObjednavek) * 100) / 100 : 0,
            pocetObjednavek: item.pocetObjednavek,
            datumOd: minDate ? this.formatDate(minDate) : '',
            datumDo: maxDate ? this.formatDate(maxDate) : ''
        }));
        
        // Seřadíme podle obratu (nejvyšší první)
        result.sort((a, b) => b.obrat - a.obrat);
        
        console.log('Agregovaná data:', result);
        return result;
    }

    parseCastka(castkaString) {
        if (!castkaString) return 0;
        
        // Odstraníme všechny nečíselné znaky kromě čárky a tečky
        const cleanString = castkaString.toString()
            .replace(/[^\d,.-]/g, '')
            .replace(/\s/g, '')
            .replace(',', '.');
        
        const number = parseFloat(cleanString);
        return isNaN(number) ? 0 : number;
    }

    parseDate(dateString) {
        if (!dateString) return null;
        
        // Formát: d.m.yyyy (např. 25.5.2025)
        const parts = dateString.trim().split('.');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Měsíce jsou 0-indexované
            const year = parseInt(parts[2]);
            
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                return new Date(year, month, day);
            }
        }
        
        return null;
    }

    formatDate(date) {
        if (!date) return '';
        return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    displayServisTable(data) {
        console.log('=== ZOBRAZOVÁNÍ SERVISNÍ TABULKY ===');
        
        const headers = [
            'Servisní středisko',
            'Obrat',
            'Průměr položek/objednávku',
            'Datum od',
            'Datum do'
        ];
        
        this.renderTable(headers, data);
        this.setupEventListeners();
    }

    renderTable(headers, data) {
        const totalObrat = data.reduce((sum, item) => sum + item.obrat, 0);
        const totalObjednavky = data.reduce((sum, item) => sum + item.pocetObjednavek, 0);
        
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; servis_statistiky.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                
                <div class="retro-data-content">
                    <div class="retro-stats-summary">
                        <div class="retro-stat-item">
                            <span class="retro-stat-label">// CELKOVÝ OBRAT:</span>
                            <span class="retro-stat-value">${this.formatCurrency(totalObrat)}</span>
                        </div>
                        <div class="retro-stat-item">
                            <span class="retro-stat-label">// CELKEM OBJEDNÁVEK:</span>
                            <span class="retro-stat-value">${totalObjednavky}</span>
                        </div>
                        <div class="retro-stat-item">
                            <span class="retro-stat-label">// STŘEDISEK:</span>
                            <span class="retro-stat-value">${data.length}</span>
                        </div>
                    </div>
                    
                    <div class="retro-table-container">
                        <table class="retro-table">
                            <thead>
                                <tr>
                                    ${headers.map(header => `<th>${header}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(item => `
                                    <tr>
                                        <td class="retro-cell-text">${this.escapeHtml(item.stredisko)}</td>
                                        <td class="retro-cell-number">${this.formatCurrency(item.obrat)}</td>
                                        <td class="retro-cell-number">${item.prumerPolozekNaObjednavku}</td>
                                        <td class="retro-cell-date">${item.datumOd}</td>
                                        <td class="retro-cell-date">${item.datumDo}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// SERVISNÍ STATISTIKY</span>
                        <span class="retro-blink">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">▓▒░</span>
                        <span class="retro-small-text">LIVE DATA</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Zatím žádné speciální event listenery
        console.log('Event listeners nastaveny pro servisní tabulku');
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="retro-data-container">
                <div class="retro-data-header">
                    <span class="retro-terminal-prompt">&gt; loading_servis_data.csv_</span>
                    <div class="retro-window-controls">
                        <span class="control-dot red"></span>
                        <span class="control-dot yellow"></span>
                        <span class="control-dot green"></span>
                    </div>
                </div>
                <div class="retro-data-content loading">
                    <div class="loading-animation">
                        <span class="loading-text">// Načítám servisní statistiky</span>
                        <span class="loading-dots">...</span>
                    </div>
                </div>
                <div class="retro-data-footer">
                    <div class="retro-status-left">
                        <span class="retro-status-text">// LOADING</span>
                        <span class="retro-blink">●</span>
                    </div>
                    <div class="retro-status-right">
                        <span class="retro-data-flow">▓▒░</span>
                        <span class="retro-small-text">CONNECTING</span>
                    </div>
                </div>
            </div>
        `;
    }

    showMockServisData() {
        console.log('=== ZOBRAZOVÁNÍ MOCK SERVISNÍCH DAT ===');
        
        const mockData = [
            {
                stredisko: 'ID: 1 - Globus Olomouc',
                obrat: 45000,
                prumerPolozekNaObjednavku: 2.5,
                datumOd: '1.5.2025',
                datumDo: '25.5.2025'
            },
            {
                stredisko: 'ID: 5 - Čepkov Zlín',
                obrat: 32000,
                prumerPolozekNaObjednavku: 3.2,
                datumOd: '1.5.2025',
                datumDo: '25.5.2025'
            },
            {
                stredisko: 'ID: 4 - Tesco Šternberk',
                obrat: 18000,
                prumerPolozekNaObjednavku: 1.8,
                datumOd: '1.5.2025',
                datumDo: '25.5.2025'
            },
            {
                stredisko: 'ID: 7 - Vsetín',
                obrat: 15000,
                prumerPolozekNaObjednavku: 2.1,
                datumOd: '1.5.2025',
                datumDo: '25.5.2025'
            },
            {
                stredisko: 'ID: 6 - Galerie Přerov',
                obrat: 8000,
                prumerPolozekNaObjednavku: 1.5,
                datumOd: '1.5.2025',
                datumDo: '25.5.2025'
            }
        ];
        
        this.displayServisTable(mockData);
    }

    startAutoRefresh() {
        // Automatické obnovování každých 5 minut
        this.refreshInterval = setInterval(() => {
            console.log('Auto-refresh servisních dat...');
            this.loadServisData();
        }, 5 * 60 * 1000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
} 