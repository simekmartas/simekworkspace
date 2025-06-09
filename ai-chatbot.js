// === AI CHATBOT SYSTÉM ===

class AIChatbot {
    constructor() {
        // ⚠️ VAROVÁNÍ: V produkci NIKDY API klíč do frontend kódu!
        // Vytvořte backend endpoint pro bezpečnost
        this.apiKey = 'AIzaSyAjrUIvmXkB2lZr1HOtswyz92YSaKpuTkc';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
        
        this.isOpen = false;
        this.isTyping = false;
        this.conversationHistory = [];
        this.isAuthenticated = false;
        
        // Cache pro data ze všech stránek
        this.allPagesData = {
            'user-profile': null,
            'prodejny': null,
            'bazar': null,
            'servis': null,
            'celkem': null,
            'index': null,
            loaded: false,
            loading: false
        };
        
        // Nastavení chatbota
        this.settings = {
            model: 'gemini-1.5-flash',
            maxTokens: 1000,
            temperature: 0.7,
            systemPrompt: `Jsi pokročilý AI asistent pro systém Mobil Maják - systém pro správu prodejních dat mobilních operátorů. 

STRUKTURA SYSTÉMU:
- **index.html** - Hlavní stránka s přehledem
- **prodejny.html** - Celkový přehled všech prodejen a prodejců s žebříčky
- **user-profile.html** - Osobní profil prodejce s individuálními statistikami  
- **bazar.html** - Seznam prodaných položek v bazaru
- **servis.html** - Přehled servisních služeb
- **celkem.html** - Celkové statistiky systému

DATOVÉ SLOUPCE:
- **Položky nad 100** - počet prodaných položek nad 100 Kč
- **Služby celkem** - celkový počet prodaných služeb
- **CT300, CT600, CT1200** - různé typy služeb/produktů
- **ALIGATOR** - speciální kategorie ALIGATOR telefonů
- **AKT, ZAH250, NAP, ZAH500** - různé typy aktivací a záruk
- **KOP250, KOP500** - kopie SIM karet
- **PZ1, KNZ** - další služby

FUNKCE, které máš k dispozici:
- Můžeš číst aktuální data ze stránky pomocí DOM
- Můžeš analyzovat viditelné statistiky
- Můžeš poskytovat kontextové rady na základě dat

Odpovídej v češtině, buď přátelský a profesionální. Pokud potřebuješ aktuální data ze stránky, požádej o jejich načtení.`
        };
        
        this.init();
    }

    init() {
        this.checkAuthentication();
        
        if (this.isAuthenticated) {
            this.createChatbotUI();
            this.loadConversationHistory();
            this.preloadAllPagesData(); // Načti data ze všech stránek
            console.log('🤖 AI Chatbot inicializován');
        }
    }

    // === PRE-LOADING VŠECH DAT ===
    async preloadAllPagesData() {
        if (this.allPagesData.loading || this.allPagesData.loaded) {
            return;
        }

        console.log('🚀 Pre-loading dat ze všech stránek...');
        this.allPagesData.loading = true;

        const pages = [
            { name: 'user-profile', url: 'user-profile.html' },
            { name: 'prodejny', url: 'prodejny.html' },
            { name: 'bazar', url: 'bazar.html' },
            { name: 'servis', url: 'servis.html' },
            { name: 'celkem', url: 'celkem.html' }
        ];

        // Načti data ze všech stránek paralelně
        const loadPromises = pages.map(page => this.loadPageData(page.name, page.url));
        
        try {
            await Promise.allSettled(loadPromises);
            this.allPagesData.loaded = true;
            console.log('✅ Všechna data načtena!', this.allPagesData);
            
            // Aktualizuj uvítací zprávu
            this.updateWelcomeMessage();
        } catch (error) {
            console.warn('⚠️ Některá data se nepodařilo načíst:', error);
        } finally {
            this.allPagesData.loading = false;
        }
    }

    async loadPageData(pageName, url) {
        try {
            console.log(`📄 Načítám data z ${pageName}...`);
            
            // Vytvoř iframe pro načtení stránky
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);

            // Počkej až se iframe načte
            await new Promise((resolve, reject) => {
                iframe.onload = resolve;
                iframe.onerror = reject;
                setTimeout(reject, 10000); // timeout 10s
            });

            // Extrahuj data z iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const pageData = this.extractDataFromDocument(iframeDoc, pageName);
            
            this.allPagesData[pageName] = {
                data: pageData,
                timestamp: new Date().toISOString(),
                url: url
            };

            console.log(`✅ Data z ${pageName} načtena`);
            
            // Vyčisti iframe
            document.body.removeChild(iframe);
            
        } catch (error) {
            console.warn(`❌ Nepodařilo se načíst data z ${pageName}:`, error);
            this.allPagesData[pageName] = {
                data: null,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    extractDataFromDocument(doc, pageType) {
        // Použij stejné funkce jako pro aktuální stránku, ale na jiném dokumentu
        const originalDocument = document;
        
        try {
            // Dočasně nahraď globální document
            global.document = doc;
            
            switch (pageType) {
                case 'user-profile':
                    return this.getUserProfileDataFromDoc(doc);
                case 'prodejny':
                    return this.getProdejnyDataFromDoc(doc);
                case 'bazar':
                    return this.getBazarDataFromDoc(doc);
                case 'servis':
                    return this.getServisDataFromDoc(doc);
                default:
                    return this.getGeneralPageDataFromDoc(doc);
            }
        } finally {
            // Obnov původní document
            global.document = originalDocument;
        }
    }

    getUserProfileDataFromDoc(doc) {
        const data = {};
        
        // Čti hlavní metriky
        const totalItems = doc.getElementById('totalItemsSold')?.textContent || '0';
        const totalServices = doc.getElementById('totalServicesSold')?.textContent || '0';
        
        data.overview = {
            totalItemsSold: totalItems,
            totalServicesSold: totalServices
        };
        
        // Čti tabulky
        const table = doc.querySelector('#userProfileTable, .retro-sales-table');
        if (table) {
            data.tableData = this.parseTableDataFromDoc(table);
        }
        
        return data;
    }

    getProdejnyDataFromDoc(doc) {
        const data = {};
        
        // Čti králové/žebříčky
        const kings = doc.querySelectorAll('.king-card');
        data.kings = [];
        
        kings.forEach(king => {
            const label = king.querySelector('.king-label')?.textContent || '';
            const name = king.querySelector('.king-name')?.textContent || '';
            const value = king.querySelector('.king-value')?.textContent || '';
            
            data.kings.push({
                category: label,
                name: name,
                value: value
            });
        });
        
        // Čti hlavní tabulku
        const table = doc.querySelector('.retro-sales-table');
        if (table) {
            data.tableData = this.parseTableDataFromDoc(table);
        }
        
        return data;
    }

    getBazarDataFromDoc(doc) {
        const data = {};
        
        // Čti celkové statistiky
        const totalCards = doc.querySelectorAll('.summary-card');
        data.summary = [];
        
        totalCards.forEach(card => {
            const label = card.querySelector('.summary-label')?.textContent || '';
            const value = card.querySelector('.summary-value')?.textContent || '';
            
            data.summary.push({
                label: label,
                value: value
            });
        });
        
        return data;
    }

    getServisDataFromDoc(doc) {
        const data = {};
        
        const table = doc.querySelector('.servis-table, .retro-sales-table');
        if (table) {
            data.services = this.parseTableDataFromDoc(table);
        }
        
        return data;
    }

    getGeneralPageDataFromDoc(doc) {
        const data = {};
        
        const title = doc.querySelector('h1')?.textContent || '';
        const stats = doc.querySelectorAll('.stat-value');
        
        data.title = title;
        data.stats = [];
        
        stats.forEach(stat => {
            const label = stat.previousElementSibling?.textContent || '';
            const value = stat.textContent || '';
            
            data.stats.push({
                label: label,
                value: value
            });
        });
        
        return data;
    }

    parseTableDataFromDoc(table) {
        const headers = [];
        const rows = [];
        
        // Čti hlavičky
        const headerCells = table.querySelectorAll('thead th');
        headerCells.forEach(cell => {
            headers.push(cell.textContent.trim());
        });
        
        // Čti řádky dat (max 20 pro všechna data)
        const dataRows = table.querySelectorAll('tbody tr');
        for (let i = 0; i < Math.min(20, dataRows.length); i++) {
            const row = [];
            const cells = dataRows[i].querySelectorAll('td');
            cells.forEach(cell => {
                row.push(cell.textContent.trim());
            });
            rows.push(row);
        }
        
        return {
            headers: headers,
            rows: rows,
            totalRows: dataRows.length
        };
    }

    updateWelcomeMessage() {
        const welcomeMessage = document.querySelector('.welcome-message .message-text');
        if (welcomeMessage && this.allPagesData.loaded) {
            const loadedPages = Object.keys(this.allPagesData).filter(key => 
                key !== 'loaded' && key !== 'loading' && this.allPagesData[key]?.data
            ).length;
            
            // Přidej info o načtených datech
            const infoElement = welcomeMessage.querySelector('.loaded-data-info');
            if (!infoElement) {
                const info = document.createElement('div');
                info.className = 'loaded-data-info';
                info.style.cssText = 'margin-top: 8px; padding: 8px; background: rgba(34, 197, 94, 0.1); border-radius: 6px; font-size: 12px;';
                info.innerHTML = `📊 <strong>Načtena data z ${loadedPages} stránek</strong> - mohu odpovídat na dotazy o všech sekcích systému!`;
                welcomeMessage.appendChild(info);
            }
        }
    }

    checkAuthentication() {
        // Chatbot je dostupný pro všechny uživatele
        this.isAuthenticated = true;
    }

    // === UI VYTVOŘENÍ ===
    createChatbotUI() {
        // Přidej styly nejdříve
        this.addChatbotStyles();
        
        // Floating chatbot button
        const chatButton = document.createElement('div');
        chatButton.className = 'chatbot-button';
        chatButton.innerHTML = '🤖';
        chatButton.title = 'Otevřít AI asistenta';
        
        chatButton.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex !important;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
            z-index: 1000;
            transition: all 0.3s ease;
            animation: chatbot-pulse 2s infinite;
        `;

        // Chatbot window
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chatbot-window';
        chatWindow.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 380px;
            height: 500px;
            background: var(--bg-primary);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            border: 1px solid var(--border-color);
            z-index: 1001;
            transform: scale(0);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            display: flex;
            flex-direction: column;
            max-height: 80vh;
        `;

        chatWindow.innerHTML = `
            <div class="chatbot-header" style="
                padding: 1rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 16px 16px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div class="chatbot-title" style="
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                ">
                    <span>🤖</span>
                    <span>AI Asistent</span>
                    <div class="status-indicator" style="
                        width: 8px;
                        height: 8px;
                        background: #22c55e;
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                    "></div>
                </div>
                <div class="chatbot-controls" style="display: flex; gap: 0.5rem;">
                    <button class="minimize-btn" style="
                        background: rgba(255,255,255,0.15);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: white;
                        width: 28px;
                        height: 28px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    ">−</button>
                    <button class="close-btn" style="
                        background: rgba(255,255,255,0.15);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: white;
                        width: 28px;
                        height: 28px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    ">×</button>
                </div>
            </div>
            
            <div class="chatbot-messages" style="
                flex: 1;
                padding: 1rem;
                overflow-y: auto;
                background: var(--bg-secondary);
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                max-height: 320px;
            ">
                <div class="welcome-message">
                    <div class="message bot-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            <div class="message-text">
                                Ahoj! Jsem pokročilý AI asistent systému Mobil Maják. Mohu ti pomoci s:
                                <br><br>
                                • **Analýzou aktuálních dat** z této stránky 📊<br>
                                • **Čtením statistik** z tabulek a grafů 📈<br>  
                                • **Porovnáním výkonnosti** prodejců 🏆<br>
                                • **Odpověďmi na dotazy** o konkrétních číslech 🔢<br>
                                • **Radami pro zlepšení** prodeje 💡<br><br>
                                ${this.apiKey && !this.apiKey.includes('ReplaceWithRealKey') ? 
                                    '🚀 Powered by Google Gemini AI + přístup k datům!' : 
                                    '⚠️ Momentálně běžím v základním režimu (API není nakonfigurováno)'
                                }<br><br>
                                Zkus se zeptat: "Kolik mám ALIGATOR telefonů?" nebo "Jak si vedu v žebříčku?"<br><br>
                                <div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">
                                    <button onclick="window.aiChatbot.testAPI()" style="
                                        background: var(--accent-color, #007bff);
                                        color: white;
                                        border: none;
                                        padding: 6px 10px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 11px;
                                    ">🔧 Test API</button>
                                    <button onclick="window.aiChatbot.newChat()" style="
                                        background: var(--warning-color, #ffc107);
                                        color: #212529;
                                        border: none;
                                        padding: 6px 10px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 11px;
                                        font-weight: 500;
                                    ">💬 Nový chat</button>
                                    <button onclick="window.location.reload()" style="
                                        background: var(--success-color, #28a745);
                                        color: white;
                                        border: none;
                                        padding: 6px 10px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 11px;
                                    ">🔄 Reload</button>
                                </div>
                            </div>
                            <div class="message-time">${new Date().toLocaleTimeString('cs-CZ', {hour: '2-digit', minute: '2-digit'})}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="chatbot-input" style="
                padding: 1rem;
                border-top: 1px solid var(--border-color);
                background: var(--bg-primary);
                border-radius: 0 0 16px 16px;
            ">
                <div class="input-container" style="
                    display: flex;
                    gap: 0.5rem;
                    align-items: flex-end;
                ">
                    <div class="input-wrapper" style="
                        flex: 1;
                        position: relative;
                    ">
                        <textarea 
                            class="message-input" 
                            placeholder="Napiš svou otázku..."
                            style="
                                width: 100%;
                                min-height: 40px;
                                max-height: 100px;
                                padding: 0.75rem;
                                border: 2px solid var(--border-color);
                                border-radius: 20px;
                                background: var(--bg-secondary);
                                color: var(--text-primary);
                                resize: none;
                                outline: none;
                                font-family: inherit;
                                line-height: 1.4;
                                transition: border-color 0.2s ease;
                            "
                            rows="1"
                        ></textarea>
                        <div class="char-counter" style="
                            position: absolute;
                            bottom: -18px;
                            right: 8px;
                            font-size: 10px;
                            color: var(--text-muted);
                        ">0/500</div>
                    </div>
                    <button class="send-btn" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        color: white;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                        flex-shrink: 0;
                    " disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                        </svg>
                    </button>
                </div>
                
                <div class="quick-questions" style="
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                    flex-wrap: wrap;
                ">
                    <button class="quick-btn" data-question="Jak funguje systém Mobil Maják?">
                        Jak funguje systém?
                    </button>
                    <button class="quick-btn" data-question="Jak analyzovat prodejní data?">
                        Analýza dat
                    </button>
                    <button class="quick-btn" data-question="Tipy pro zvýšení prodeje">
                        Tipy pro prodej
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(chatButton);
        document.body.appendChild(chatWindow);

        this.chatButton = chatButton;
        this.chatWindow = chatWindow;
        this.messagesContainer = chatWindow.querySelector('.chatbot-messages');
        this.messageInput = chatWindow.querySelector('.message-input');
        this.sendButton = chatWindow.querySelector('.send-btn');
        this.charCounter = chatWindow.querySelector('.char-counter');

        this.setupEventListeners();
        this.addChatbotStyles();
    }

    addChatbotStyles() {
        // Přidej CSS animace
        if (!document.getElementById('chatbot-animations')) {
            const animationStyle = document.createElement('style');
            animationStyle.id = 'chatbot-animations';
            animationStyle.textContent = `
                @keyframes chatbot-pulse {
                    0% { transform: scale(1); box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6); }
                    100% { transform: scale(1); box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
                }
                
                .chatbot-button:hover {
                    transform: scale(1.1) !important;
                    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.8) !important;
                }
                
                .chatbot-window.open {
                    transform: scale(1) !important;
                    opacity: 1 !important;
                }
                
                .minimize-btn:hover,
                .close-btn:hover {
                    background: rgba(255,255,255,0.3) !important;
                    transform: scale(1.1) !important;
                }
                
                .close-btn:hover {
                    background: rgba(220, 53, 69, 0.8) !important;
                }
            `;
            document.head.appendChild(animationStyle);
        }
        const styles = `
            /* Quick Buttons */
            .quick-btn {
                background: var(--bg-tertiary, #f0f0f0);
                border: 1px solid var(--border-color, #ddd);
                color: var(--text-primary, #333);
                padding: 0.5rem 0.75rem;
                border-radius: 16px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            
            .quick-btn:hover {
                background: var(--accent-color, #007bff);
                color: white;
                transform: translateY(-1px);
            }
            
            /* Message Styles */
            .message {
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
                margin-bottom: 0.75rem;
            }
            
            .message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: var(--accent-color, #007bff);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                font-weight: 600;
                flex-shrink: 0;
            }
            
            .bot-message .message-avatar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .message-content {
                flex: 1;
                min-width: 0;
            }
            
            .message-text {
                background: var(--bg-primary, #fff);
                padding: 0.75rem;
                border-radius: 12px;
                border: 1px solid var(--border-color, #ddd);
                margin-bottom: 0.25rem;
                word-wrap: break-word;
            }
            
            .user-message .message-text {
                background: var(--accent-color, #007bff);
                color: white;
                border-color: var(--accent-color, #007bff);
            }
            
            .message-time {
                font-size: 0.7rem;
                color: var(--text-muted, #999);
                margin-left: 0.75rem;
            }
            
            .error-message {
                background: var(--danger-color, #dc3545) !important;
                color: white !important;
                border-color: var(--danger-color, #dc3545) !important;
            }
            
            /* Typing Indicator */
            .typing-indicator {
                display: flex;
                gap: 4px;
                align-items: center;
                padding: 8px 0;
            }
            
            .typing-dot {
                width: 6px;
                height: 6px;
                background: var(--text-muted, #999);
                border-radius: 50%;
                animation: typing-bounce 1.4s infinite ease-in-out both;
            }
            
            .typing-dot:nth-child(1) { animation-delay: -0.32s; }
            .typing-dot:nth-child(2) { animation-delay: -0.16s; }
            
            @keyframes typing-bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }
            
            .chatbot-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
            }
            
            .chatbot-window.open {
                transform: scale(1);
                opacity: 1;
            }
            
            .message {
                display: flex;
                gap: 0.5rem;
                align-items: flex-start;
                animation: messageSlideIn 0.3s ease;
            }
            
            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }
            
            .bot-message .message-avatar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .user-message {
                flex-direction: row-reverse;
            }
            
            .user-message .message-avatar {
                background: var(--accent-color, #007bff);
                color: white;
                font-weight: bold;
            }
            
            .message-content {
                flex: 1;
                min-width: 0;
            }
            
            .message-text {
                background: var(--bg-primary);
                padding: 0.75rem 1rem;
                border-radius: 16px;
                border: 1px solid var(--border-color);
                color: var(--text-primary);
                line-height: 1.5;
                word-wrap: break-word;
                position: relative;
            }
            
            .user-message .message-text {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
            }
            
            .message-time {
                font-size: 0.7rem;
                color: var(--text-muted);
                margin-top: 0.25rem;
                text-align: right;
            }
            
            .user-message .message-time {
                text-align: left;
            }
            
            .typing-indicator {
                display: flex;
                gap: 4px;
                padding: 1rem;
                justify-content: center;
            }
            
            .typing-dot {
                width: 6px;
                height: 6px;
                background: var(--text-muted);
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }
            
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            
            .quick-btn {
                background: var(--bg-tertiary, #f0f0f0);
                border: 1px solid var(--border-color);
                color: var(--text-secondary);
                padding: 0.5rem 0.75rem;
                border-radius: 16px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            
            .quick-btn:hover {
                background: var(--accent-color, #007bff);
                color: white;
                border-color: var(--accent-color, #007bff);
            }
            
            .message-input:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .send-btn:not(:disabled):hover {
                transform: scale(1.1);
            }
            
            .chatbot-messages::-webkit-scrollbar {
                width: 4px;
            }
            
            .chatbot-messages::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .chatbot-messages::-webkit-scrollbar-thumb {
                background: var(--border-color);
                border-radius: 2px;
            }
            
            .error-message {
                color: var(--danger-color, #dc3545);
                font-style: italic;
            }
            
            @media (max-width: 480px) {
                .chatbot-window {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 140px);
                    bottom: 90px;
                    right: 20px;
                    left: 20px;
                }
                
                .chatbot-button {
                    bottom: 20px;
                    right: 20px;
                }
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // === EVENT LISTENERS ===
    setupEventListeners() {
        // Toggle chatbot
        this.chatButton.addEventListener('click', (e) => {
            console.log('🤖 Chatbot button clicked!');
            e.preventDefault();
            e.stopPropagation();
            this.toggleChatbot();
        });

        // Close/minimize buttons
        this.chatWindow.querySelector('.close-btn').addEventListener('click', () => {
            this.closeChatbot();
        });

        this.chatWindow.querySelector('.minimize-btn').addEventListener('click', () => {
            this.minimizeChatbot();
        });

        // Message input
        this.messageInput.addEventListener('input', () => {
            this.handleInputChange();
        });

        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send button
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Quick questions
        this.chatWindow.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.dataset.question;
                this.messageInput.value = question;
                this.sendMessage();
            });
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
        });
    }

    // === CHATBOT ACTIONS ===
    toggleChatbot() {
        this.isOpen = !this.isOpen;
        console.log('🤖 Toggle chatbot, isOpen:', this.isOpen);
        
        if (this.isOpen) {
            console.log('🤖 Opening chatbot window');
            this.chatWindow.classList.add('open');
            setTimeout(() => {
                if (this.messageInput) {
                    this.messageInput.focus();
                }
            }, 300);
        } else {
            console.log('🤖 Closing chatbot window');
            this.chatWindow.classList.remove('open');
        }
    }

    closeChatbot() {
        this.isOpen = false;
        this.chatWindow.classList.remove('open');
    }

    minimizeChatbot() {
        this.closeChatbot();
    }

    handleInputChange() {
        const text = this.messageInput.value;
        const length = text.length;
        
        // Update character counter
        this.charCounter.textContent = `${length}/500`;
        
        // Enable/disable send button
        this.sendButton.disabled = length === 0 || length > 500;
        
        // Color coding for char counter
        if (length > 450) {
            this.charCounter.style.color = 'var(--danger-color, #dc3545)';
        } else if (length > 350) {
            this.charCounter.style.color = 'var(--warning-color, #ffc107)';
        } else {
            this.charCounter.style.color = 'var(--text-muted)';
        }
    }

    // === MESSAGE HANDLING ===
    async sendMessage() {
        console.log('🤖 SendMessage called');
        const message = this.messageInput.value.trim();
        console.log('🤖 Message:', message);
        
        if (!message || this.isTyping) {
            console.log('🤖 No message or already typing');
            return;
        }

        // Add user message
        console.log('🤖 Adding user message to UI');
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.handleInputChange();

        // Show typing indicator
        console.log('🤖 Showing typing indicator');
        this.showTypingIndicator();

        try {
            // Send to OpenAI
            console.log('🤖 Calling OpenAI API...');
            const response = await this.callOpenAI(message);
            console.log('🤖 Got response:', response);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('🤖 API Error:', error);
            this.hideTypingIndicator();
            this.addMessage('Omlouvám se, nastala chyba při zpracování vaší zprávy. Zkuste to prosím znovu. Error: ' + error.message, 'bot', true);
        }
    }

    addMessage(text, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'user' ? (localStorage.getItem('userInitial') || 'U') : '🤖';
        const time = new Date().toLocaleTimeString('cs-CZ', {hour: '2-digit', minute: '2-digit'});
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text ${isError ? 'error-message' : ''}">
                    ${this.formatMessage(text)}
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;

        // Add to conversation history
        this.conversationHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: text,
            timestamp: new Date().toISOString()
        });

        // Add to UI
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage && this.conversationHistory.length > 1) {
            welcomeMessage.remove();
        }

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Save conversation
        this.saveConversationHistory();
    }

    formatMessage(text) {
        // Format text with basic markdown-like styling
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: var(--bg-tertiary, #f0f0f0); padding: 2px 4px; border-radius: 3px;">$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        this.isTyping = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingMessage = this.messagesContainer.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    // === DATA READING FUNCTIONS ===
    getCurrentPageData() {
        const pageData = {
            url: window.location.href,
            title: document.title,
            currentPage: this.getCurrentPageType(),
            data: {}
        };
        
        // Čti data podle typu stránky
        switch (pageData.currentPage) {
            case 'user-profile':
                pageData.data = this.getUserProfileData();
                break;
            case 'prodejny':
                pageData.data = this.getProdejnyData();
                break;
            case 'bazar':
                pageData.data = this.getBazarData();
                break;
            case 'servis':
                pageData.data = this.getServisData();
                break;
            default:
                pageData.data = this.getGeneralPageData();
        }
        
        return pageData;
    }
    
    getCurrentPageType() {
        const url = window.location.href;
        if (url.includes('user-profile')) return 'user-profile';
        if (url.includes('prodejny')) return 'prodejny';
        if (url.includes('bazar')) return 'bazar';
        if (url.includes('servis')) return 'servis';
        if (url.includes('celkem')) return 'celkem';
        return 'index';
    }
    
    getUserProfileData() {
        const data = {};
        
        // Čti hlavní metriky
        const totalItems = document.getElementById('totalItemsSold')?.textContent || '0';
        const totalServices = document.getElementById('totalServicesSold')?.textContent || '0';
        
        // Čti aktuální den statistiky
        const currentAligator = document.getElementById('currentAligatorSales')?.textContent || '0';
        const currentTotal = document.getElementById('currentTotalSales')?.textContent || '0';
        const currentRanking = document.getElementById('currentRanking')?.textContent || '-';
        
        // Čti měsíční statistiky
        const monthlyAligator = document.getElementById('monthlyAligatorSales')?.textContent || '0';
        const monthlyTotal = document.getElementById('monthlyTotalSales')?.textContent || '0';
        const monthlyRanking = document.getElementById('monthlyRanking')?.textContent || '-';
        
        data.overview = {
            totalItemsSold: totalItems,
            totalServicesSold: totalServices
        };
        
        data.currentDay = {
            aligatorSales: currentAligator,
            totalSales: currentTotal,
            ranking: currentRanking
        };
        
        data.currentMonth = {
            aligatorSales: monthlyAligator,
            totalSales: monthlyTotal,
            ranking: monthlyRanking
        };
        
        // Čti data z tabulky pokud existuje
        const table = document.querySelector('#userProfileTable');
        if (table) {
            data.tableData = this.parseTableData(table);
        }
        
        return data;
    }
    
    getProdejnyData() {
        const data = {};
        
        // Čti králové/žebříčky
        const kings = document.querySelectorAll('.king-card');
        data.kings = [];
        
        kings.forEach(king => {
            const label = king.querySelector('.king-label')?.textContent || '';
            const name = king.querySelector('.king-name')?.textContent || '';
            const value = king.querySelector('.king-value')?.textContent || '';
            
            data.kings.push({
                category: label,
                name: name,
                value: value
            });
        });
        
        // Čti data z hlavní tabulky
        const table = document.querySelector('.retro-sales-table');
        if (table) {
            data.tableData = this.parseTableData(table);
        }
        
        return data;
    }
    
    getBazarData() {
        const data = {};
        
        // Čti celkové statistiky
        const totalCards = document.querySelectorAll('.summary-card');
        data.summary = [];
        
        totalCards.forEach(card => {
            const label = card.querySelector('.summary-label')?.textContent || '';
            const value = card.querySelector('.summary-value')?.textContent || '';
            
            data.summary.push({
                label: label,
                value: value
            });
        });
        
        // Čti data z tabulky
        const table = document.querySelector('.bazar-table');
        if (table) {
            data.items = this.parseTableData(table);
        }
        
        return data;
    }
    
    getServisData() {
        const data = {};
        
        // Podobně jako bazar - čti servisní data
        const table = document.querySelector('.servis-table');
        if (table) {
            data.services = this.parseTableData(table);
        }
        
        return data;
    }
    
    getGeneralPageData() {
        const data = {};
        
        // Čti obecné informace ze stránky
        const title = document.querySelector('h1')?.textContent || '';
        const stats = document.querySelectorAll('.stat-value');
        
        data.title = title;
        data.stats = [];
        
        stats.forEach(stat => {
            const label = stat.previousElementSibling?.textContent || '';
            const value = stat.textContent || '';
            
            data.stats.push({
                label: label,
                value: value
            });
        });
        
        return data;
    }
    
    parseTableData(table) {
        const headers = [];
        const rows = [];
        
        // Čti hlavičky
        const headerCells = table.querySelectorAll('thead th');
        headerCells.forEach(cell => {
            headers.push(cell.textContent.trim());
        });
        
        // Čti řádky dat (max 10 pro přehlednost)
        const dataRows = table.querySelectorAll('tbody tr');
        for (let i = 0; i < Math.min(10, dataRows.length); i++) {
            const row = [];
            const cells = dataRows[i].querySelectorAll('td');
            cells.forEach(cell => {
                row.push(cell.textContent.trim());
            });
            rows.push(row);
        }
        
        return {
            headers: headers,
            rows: rows,
            totalRows: dataRows.length
        };
    }

    // === GOOGLE GEMINI API ===
    async callGemini(message) {
        console.log('🤖 CallGemini called with message:', message);
        console.log('🤖 API Key available:', this.apiKey ? 'YES' : 'NO');
        console.log('🤖 API Key length:', this.apiKey ? this.apiKey.length : 0);
        console.log('🤖 API Key starts with:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'NONE');
        
        // Zkontroluj, zda je API klíč nastaven
        if (!this.apiKey || this.apiKey.includes('ReplaceWithRealKey')) {
            console.log('🤖 Using fallback - no valid API key');
            return this.getFallbackResponse(message);
        }

        // Získej aktuální data ze stránky
        const currentPageData = this.getCurrentPageData();
        
        // Připrav všechna dostupná data
        let allDataContext = `AKTUÁLNÍ STRÁNKA:
- Stránka: ${currentPageData.title}
- URL: ${currentPageData.url}
- Typ: ${currentPageData.currentPage}
- Data: ${JSON.stringify(currentPageData.data, null, 2)}`;

        if (this.allPagesData.loaded) {
            allDataContext += `\n\nDATA ZE VŠECH STRÁNEK SYSTÉMU:`;
            Object.keys(this.allPagesData).forEach(pageName => {
                if (pageName !== 'loaded' && pageName !== 'loading' && this.allPagesData[pageName]?.data) {
                    allDataContext += `\n\n=== ${pageName.toUpperCase()} ===\n${JSON.stringify(this.allPagesData[pageName].data, null, 2)}`;
                }
            });
        }
        
        // Vytvoř kontext s všemi daty
        const contextualMessage = `${this.settings.systemPrompt}

${allDataContext}

UŽIVATELŮV DOTAZ: ${message}

Odpověz v češtině na základě všech dostupných dat ze systému. Pokud se ptá na data z jiných stránek než aktuální, použij data ze sekce "DATA ZE VŠECH STRÁNEK SYSTÉMU".`;

        // Gemini API formát - jednodušší přístup
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: contextualMessage
                        }
                    ]
                }
            ]
        };

        try {
            console.log('🤖 Making API request to Google Gemini...');
            console.log('🤖 Request payload:', {
                model: this.settings.model,
                messageLength: contextualMessage.length
            });

            // Seznam možných endpointů pro Gemini
            const possibleUrls = [
                'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
                'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
            ];

            let response = null;
            let lastError = null;

            // Zkusit jednotlivé endpointy
            for (const url of possibleUrls) {
                try {
                    console.log(`🤖 Trying endpoint: ${url}`);
                    const urlWithKey = `${url}?key=${this.apiKey}`;

                    response = await fetch(urlWithKey, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody)
                    });

                    if (response.ok) {
                        console.log(`🤖 Success with endpoint: ${url}`);
                        this.apiUrl = url; // Uložit funkční endpoint
                        break;
                    } else {
                        console.log(`🤖 Failed with endpoint: ${url}, status: ${response.status}`);
                        lastError = await response.text();
                    }
                } catch (err) {
                    console.log(`🤖 Error with endpoint: ${url}`, err);
                    lastError = err;
                }
            }

            if (!response || !response.ok) {
                throw new Error(`All endpoints failed. Last error: ${lastError}`);
            }

            console.log('🤖 Gemini API Response status:', response.status);
            console.log('🤖 Gemini API Response ok:', response.ok);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('🤖 Gemini API Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData: errorData
                });
                
                // Zobraz detailní chybu uživateli
                let errorMessage = `Gemini API Error (${response.status}): `;
                if (response.status === 401 || response.status === 403) {
                    errorMessage += "Neplatný API klíč nebo nedostatečné oprávnění.";
                } else if (response.status === 429) {
                    errorMessage += "Příliš mnoho požadavků. Zkuste později.";
                } else if (response.status === 400) {
                    errorMessage += "Neplatný formát požadavku.";
                } else {
                    errorMessage += errorData.error?.message || response.statusText;
                }
                
                return `❌ ${errorMessage}\n\nPřepínám na základní režim:\n\n${this.getFallbackResponse(message)}`;
            }

            const data = await response.json();
            console.log('🤖 Gemini API Response:', data);
            
            // Gemini má jiný formát odpovědi než OpenAI
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!responseText) {
                console.error('🤖 Neočekávaný formát odpovědi:', data);
                return `❌ Neočekávaný formát odpovědi z Gemini API\n\nPřepínám na základní režim:\n\n${this.getFallbackResponse(message)}`;
            }

            console.log('🤖 Gemini API Response successful, response length:', responseText.length);
            return responseText;
            
        } catch (error) {
            console.error('🤖 Network or API error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            return `❌ Chyba připojení: ${error.message}\n\nPřepínám na základní režim:\n\n${this.getFallbackResponse(message)}`;
        }
    }

    // Kompatibilita - alias pro původní název
    async callOpenAI(message) {
        return this.callGemini(message);
    }

    // === FALLBACK RESPONSES ===
    getFallbackResponse(message) {
        console.log('🤖 Using fallback response system');
        
        // Získej aktuální data ze stránky i pro fallback
        const currentPageData = this.getCurrentPageData();
        const lowerMessage = message.toLowerCase();
        
        // Pokud se ptá na konkrétní data, zkus je najít
        if (lowerMessage.includes('kolik') || lowerMessage.includes('počet') || lowerMessage.includes('statistics')) {
            if (currentPageData.currentPage === 'user-profile' && currentPageData.data.overview) {
                return `Na základě aktuálních dat z vašeho profilu:

📊 **Vaše statistiky:**
• **Položky celkem**: ${currentPageData.data.overview.totalItemsSold}
• **Služby celkem**: ${currentPageData.data.overview.totalServicesSold}
• **ALIGATOR (aktuální den)**: ${currentPageData.data.currentDay?.aligatorSales || '0'}
• **ALIGATOR (měsíc)**: ${currentPageData.data.currentMonth?.aligatorSales || '0'}

🏆 **Pozice v žebříčku:**
• **Aktuální den**: ${currentPageData.data.currentDay?.ranking || '-'}
• **Aktuální měsíc**: ${currentPageData.data.currentMonth?.ranking || '-'}

*Data načtena přímo z vaší stránky profilu.*`;
            }
        }
        
        // Předdefinované odpovědi pro časté dotazy
        if (lowerMessage.includes('jak funguje') || lowerMessage.includes('jak používat')) {
            return `Systém Mobil Maják slouží ke správě prodejních dat mobilních operátorů. Můžete zde:

• Sledovat prodejní statistiky
• Analyzovat výkonnost prodejců
• Zobrazit údaje o prodeji telefonů a služeb
• Prohlížet žebříčky nejlepších prodejců

Pro více informací kontaktujte administrátora systému.`;
        }
        
        if (lowerMessage.includes('statistik') || lowerMessage.includes('data')) {
            return `Pro analýzu dat použijte:

• **Prodejny** - celkový přehled všech prodejen
• **Můj profil** - vaše osobní statistiky
• **Bazar** - prodané položky v bazaru
• **Servis** - servisní služby

Data se automaticky aktualizují z Google Sheets tabulky.`;
        }
        
        if (lowerMessage.includes('aligator')) {
            return `ALIGATOR telefony jsou speciální kategorie produktů. Můžete si prohlédnout:

• Počet prodaných ALIGATOR telefonů v měsíčním přehledu
• Porovnání s ostatními prodejci
• Celkové statistiky na stránce Prodejny

Pokud se vám ALIGATOR telefony nezobrazují správně, zkontrolujte nastavení profilu.`;
        }
        
        if (lowerMessage.includes('problém') || lowerMessage.includes('nefunguje')) {
            return `Při problémech zkuste:

1. **Obnovit stránku** (F5 nebo Ctrl+R)
2. **Vymazat cache** prohlížeče
3. **Zkontrolovat připojení** k internetu
4. **Kontaktovat podporu** pokud problém přetrvává

Většina problémů se vyřeší obnovením stránky.`;
        }
        
        // Obecná odpověď
        return `Děkuji za vaši zprávu! Bohužel momentálně není k dispozici plná AI funkcionalita.

Můžu vám pomoci s:
• **Vysvětlením funkcí** systému Mobil Maják
• **Navigací** po rozhraní
• **Řešením základních problémů**
• **Informacemi o prodejních datech**

Pro složitější dotazy kontaktujte prosím administrátora systému.

*Váš dotaz: "${message}"*`;
    }

    // === CONVERSATION PERSISTENCE ===
    saveConversationHistory() {
        try {
            localStorage.setItem('chatbot_conversation', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.warn('Could not save conversation history:', error);
        }
    }

    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('chatbot_conversation');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
                
                // Restore messages to UI (excluding system messages)
                this.conversationHistory.forEach(msg => {
                    if (msg.role !== 'system') {
                        this.addMessageToUI(msg.content, msg.role === 'user' ? 'user' : 'bot');
                    }
                });
                
                // Remove welcome message if there's conversation history
                if (this.conversationHistory.length > 0) {
                    const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
                    if (welcomeMessage) welcomeMessage.remove();
                }
            }
        } catch (error) {
            console.warn('Could not load conversation history:', error);
        }
    }

    addMessageToUI(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'user' ? (localStorage.getItem('userInitial') || 'U') : '🤖';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">
                    ${this.formatMessage(text)}
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(messageDiv);
    }

    clearConversation() {
        this.newChat(); // Použij novou funkci
    }

    // === API TESTING ===
    async testAPI() {
        console.log('🔧 Testing Gemini API connection...');
        this.addMessage('Testuji Google Gemini API připojení...', 'bot');
        
        try {
            const testResponse = await this.callGemini('Test zpráva - odpověz pouze "Gemini API funguje správně! 🚀"');
            this.addMessage(`✅ Gemini API Test úspěšný!\n\nOdpověď: ${testResponse}`, 'bot');
        } catch (error) {
            this.addMessage(`❌ Gemini API Test neúspěšný!\n\nChyba: ${error.message}`, 'bot', true);
        }
    }

    // === NOVÝ CHAT ===
    newChat() {
        console.log('💬 Starting new chat...');
        
        // Vymaž conversation history
        this.conversationHistory = [];
        this.saveConversationHistory();
        
        // Vymaž UI zprávy
        this.messagesContainer.innerHTML = '';
        
        // Přidej novou uvítací zprávu
        this.showWelcomeMessage();
        
        // Info zpráva o novém chatu
        setTimeout(() => {
            this.addMessage('✨ Nový chat spuštěn! Historie konverzace byla vymazána.', 'bot');
        }, 500);
    }

    showWelcomeMessage() {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <div class="message bot-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-text">
                        Ahoj! Jsem pokročilý AI asistent systému Mobil Maják. Mohu ti pomoci s:
                        <br><br>
                        • **Analýzou aktuálních dat** z této stránky 📊<br>
                        • **Čtením statistik** z tabulek a grafů 📈<br>  
                        • **Porovnáním výkonnosti** prodejců 🏆<br>
                        • **Odpověďmi na dotazy** o konkrétních číslech 🔢<br>
                        • **Radami pro zlepšení** prodeje 💡<br><br>
                        ${this.apiKey && !this.apiKey.includes('ReplaceWithRealKey') ? 
                            '🚀 Powered by Google Gemini AI + přístup k datům!' : 
                            '⚠️ Momentálně běžím v základním režimu (API není nakonfigurováno)'
                        }<br><br>
                        Zkus se zeptat: "Kolik mám ALIGATOR telefonů?" nebo "Jak si vedu v žebříčku?"<br><br>
                        <div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">
                            <button onclick="window.aiChatbot.testAPI()" style="
                                background: var(--accent-color, #007bff);
                                color: white;
                                border: none;
                                padding: 6px 10px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 11px;
                            ">🔧 Test API</button>
                            <button onclick="window.aiChatbot.newChat()" style="
                                background: var(--warning-color, #ffc107);
                                color: #212529;
                                border: none;
                                padding: 6px 10px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 11px;
                                font-weight: 500;
                            ">💬 Nový chat</button>
                            <button onclick="window.location.reload()" style="
                                background: var(--success-color, #28a745);
                                color: white;
                                border: none;
                                padding: 6px 10px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 11px;
                            ">🔄 Reload</button>
                        </div>
                    </div>
                    <div class="message-time">${new Date().toLocaleTimeString('cs-CZ', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(welcomeDiv);
        
        // Aktualizuj info o načtených datech
        setTimeout(() => {
            this.updateWelcomeMessage();
        }, 100);
    }

    // === PUBLIC API ===
    open() {
        if (!this.isOpen) {
            this.toggleChatbot();
        }
    }

    close() {
        if (this.isOpen) {
            this.toggleChatbot();
        }
    }

    destroy() {
        if (this.chatButton) this.chatButton.remove();
        if (this.chatWindow) this.chatWindow.remove();
        console.log('🤖 AI Chatbot byl zničen');
    }
}

// === GLOBAL INSTANCE ===
let aiChatbot = null;

// Inicializace po načtení DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🤖 Inicializuji AI Chatbot...');
    
    try {
        aiChatbot = new AIChatbot();
        
        // Přidej do globálního kontextu
        window.aiChatbot = aiChatbot;
        
        console.log('🤖 AI Chatbot úspěšně inicializován a je viditelný!');
    } catch (error) {
        console.error('❌ Chyba při inicializaci chatbota:', error);
    }
});

// Export pro ES6 moduly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIChatbot;
} 