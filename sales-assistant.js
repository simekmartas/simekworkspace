// Prodejní asistent - pomocník pro prodejce
let currentSalesSession = null;
let currentScenario = null;
let sessionStartTime = null;
let currentWizardStep = 1;
let selectedItems = {
    obaly: [],
    sklicka: [],
    prislusenstvi: []
};

// Globální inicializace pro kompatibilitu s Chrome
if (typeof window !== 'undefined') {
    window.sessionStartTime = null;
    window.currentSalesSession = null;
    window.currentScenario = null;
    
    // Debug informace pro Chrome
    console.log('🔧 Sales assistant initialized');
    console.log('🔍 User Agent:', navigator.userAgent);
    console.log('🔍 Chrome version:', navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Not Chrome');
}

// Hlavní funkce pro vytvoření modal okna
function createSalesAssistantModal() {
    const modalHTML = `
        <div id="salesAssistantModal" class="sales-modal">
            <div class="sales-modal-overlay" onclick="closeSalesAssistant()"></div>
            <div class="sales-modal-content">
                <div class="sales-modal-header">
                    <h2>Prodejní asistent</h2>
                    <button class="sales-close-btn" onclick="closeSalesAssistant()">×</button>
                </div>
                <div class="sales-modal-body" id="salesModalBody">
                    ${renderScenarioSelection()}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    addSalesAssistantStyles();
    initCheckboxListeners();
}

// Styly pro prodejní asistent
function addSalesAssistantStyles() {
    if (document.getElementById('salesAssistantStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'salesAssistantStyles';
    styles.textContent = `
        .sales-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .sales-modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
        }
        
        .sales-modal-content {
            position: relative;
            background: var(--bg-primary);
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            max-height: 85vh;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sales-modal-header {
            padding: 1.5rem 1.5rem 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .sales-modal-header h2 {
            margin: 0;
            color: var(--text-primary);
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .sales-close-btn {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 2rem;
            cursor: pointer;
            padding: 0;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        .sales-close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-primary);
        }
        
        .sales-modal-body {
            padding: 1rem;
            max-height: 70vh;
            overflow-y: auto;
            scroll-behavior: smooth;
        }
        
        .sales-modal-body.scroll-top {
            animation: scrollToTop 0.3s ease-out;
        }
        
        @keyframes scrollToTop {
            from { scroll-behavior: auto; }
            to { scroll-behavior: smooth; }
        }
        
        .sales-tips-container {
            margin-bottom: 1.5rem;
        }
        
        .sales-tip {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 0.75rem;
            margin-bottom: 0.75rem;
        }
        
        .sales-tip h4 {
            margin: 0 0 0.5rem 0;
            color: var(--primary-color);
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .sales-tip p {
            margin: 0;
            color: var(--text-primary);
            font-size: 0.85rem;
            line-height: 1.4;
            font-style: italic;
        }
        
        .sales-result-buttons {
            display: flex;
            gap: 0.75rem;
            margin-top: 1rem;
        }
        
        .sales-result-btn {
            flex: 1;
            padding: 0.75rem 1rem;
            border: none;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }
        
        .sales-sold-btn {
            background: linear-gradient(135deg, #2ed573, #17c0eb);
            color: white;
        }
        
        .sales-sold-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(46, 213, 115, 0.3);
        }
        
        .sales-not-sold-btn {
            background: linear-gradient(135deg, #ff4757, #ff3742);
            color: white;
        }
        
        .sales-not-sold-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 71, 87, 0.3);
        }
        
        .scenario-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        
        .scenario-tile {
            background: linear-gradient(135deg, rgba(255, 20, 147, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%);
            border: 2px solid rgba(255, 20, 147, 0.2);
            border-radius: 8px;
            padding: 0.75rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            min-height: 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .scenario-tile:hover {
            transform: translateY(-5px);
            border-color: rgba(255, 20, 147, 0.5);
            box-shadow: 0 10px 30px rgba(255, 20, 147, 0.2);
        }
        
        .scenario-tile::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #ff1493, #2196F3);
        }
        
        .scenario-emoji {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            display: block;
        }
        
        .scenario-title {
            color: var(--text-primary);
            font-size: 0.75rem;
            font-weight: 600;
            margin: 0;
            line-height: 1.2;
        }
        
        .scenario-back-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: var(--text-primary);
            padding: 0.75rem 1.5rem;
            border-radius: 25px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
            margin-bottom: 1.5rem;
        }
        
        .scenario-back-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateX(-5px);
        }
        
        .sales-content {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 0.75rem;
            margin-bottom: 0.75rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sales-step {
            margin-bottom: 1.5rem;
        }
        
        .sales-step h3 {
            color: var(--primary-color);
            margin: 0 0 0.75rem 0;
            font-size: 1rem;
            font-weight: 600;
        }
        
        .sales-advice {
            background: rgba(255, 20, 147, 0.1);
            border-left: 4px solid var(--primary-color);
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 0.75rem;
        }
        
        .sales-advice p {
            margin: 0;
            color: var(--text-primary);
            line-height: 1.5;
            font-style: italic;
        }
        
        .sales-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 2rem;
        }
        
        .sales-btn {
            background: linear-gradient(135deg, #2196F3, #1976D2);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
        }
        
        .sales-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(33, 150, 243, 0.4);
        }
        
        .sales-btn.success {
            background: linear-gradient(135deg, #2ed573, #20bf6b);
            box-shadow: 0 4px 15px rgba(46, 213, 115, 0.3);
        }
        
        .sales-btn.success:hover {
            box-shadow: 0 8px 25px rgba(46, 213, 115, 0.4);
        }
        
        .sales-btn.danger {
            background: linear-gradient(135deg, #ff4757, #ff3838);
            box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
        }
        
        .sales-btn.danger:hover {
            box-shadow: 0 8px 25px rgba(255, 71, 87, 0.4);
        }
        
        .checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .checkbox-item {
            position: relative;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 1rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            text-align: center;
            overflow: hidden;
            min-height: 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .checkbox-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, transparent, rgba(255, 20, 147, 0.3), transparent);
            transition: all 0.3s ease;
        }
        
        .checkbox-item:hover {
            transform: translateY(-2px);
            background: linear-gradient(135deg, rgba(255, 20, 147, 0.08) 0%, rgba(33, 150, 243, 0.08) 100%);
            border-color: rgba(255, 20, 147, 0.4);
            box-shadow: 0 8px 25px rgba(255, 20, 147, 0.15);
        }
        
        .checkbox-item:hover::before {
            background: linear-gradient(90deg, #ff1493, #2196F3, #ff1493);
        }
        
        .checkbox-item.checked {
            background: linear-gradient(135deg, rgba(255, 20, 147, 0.2) 0%, rgba(33, 150, 243, 0.2) 100%);
            border-color: var(--primary-color);
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(255, 20, 147, 0.25);
        }
        
        .checkbox-item.checked::before {
            background: linear-gradient(90deg, #ff1493, #2196F3);
        }
        
        .scenario-tile.selected {
            background: linear-gradient(135deg, rgba(255, 20, 147, 0.2) 0%, rgba(33, 150, 243, 0.2) 100%);
            border-color: var(--primary-color);
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(255, 20, 147, 0.25);
        }
        
        .scenario-tile.selected::before {
            background: linear-gradient(90deg, #ff1493, #2196F3);
        }
        
        .scenario-tile.selected .scenario-title {
            color: var(--primary-color);
        }
        
        .checkbox-item .item-icon {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            display: block;
            opacity: 0.8;
        }
        
        .checkbox-item input[type="checkbox"] {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
            pointer-events: none;
        }
        
        .checkbox-item label {
            color: var(--text-primary);
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            margin: 0;
            user-select: none;
            text-align: center;
            line-height: 1.3;
        }
        
        .checkbox-item.checked label {
            color: var(--primary-color);
        }
        
        /* Tooltip styly pro služby */
        .service-tooltip {
            position: relative;
            cursor: pointer;
        }
        
        .service-tooltip .tooltip-text {
            visibility: hidden;
            width: 220px;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            text-align: center;
            border-radius: 8px;
            padding: 8px;
            position: absolute;
            z-index: 10000;
            bottom: 125%;
            left: 50%;
            margin-left: -110px;
            opacity: 0;
            transition: opacity 0.3s;
            font-size: 0.75rem;
            line-height: 1.3;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        
        .service-tooltip .tooltip-text::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: rgba(0, 0, 0, 0.9) transparent transparent transparent;
        }
        
        .service-tooltip:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }
        
        .sales-form {
            margin-top: 1.5rem;
        }
        
        .sales-form textarea {
            width: 100%;
            min-height: 100px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 1rem;
            color: var(--text-primary);
            font-size: 0.9rem;
            resize: vertical;
            outline: none;
            font-family: inherit;
            line-height: 1.5;
        }
        
        .sales-form textarea::placeholder {
            color: var(--text-secondary);
        }
        
        .sales-form textarea:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(255, 20, 147, 0.2);
        }
        
        .radio-group {
            display: flex;
            gap: 1rem;
            margin: 1rem 0;
            justify-content: center;
        }
        
        .radio-item {
            position: relative;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 1rem 2rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            text-align: center;
            overflow: hidden;
            min-width: 120px;
        }
        
        .radio-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, transparent, rgba(255, 20, 147, 0.3), transparent);
            transition: all 0.3s ease;
        }
        
        .radio-item:hover {
            transform: translateY(-2px);
            background: linear-gradient(135deg, rgba(255, 20, 147, 0.08) 0%, rgba(33, 150, 243, 0.08) 100%);
            border-color: rgba(255, 20, 147, 0.4);
            box-shadow: 0 8px 25px rgba(255, 20, 147, 0.15);
        }
        
        .radio-item:hover::before {
            background: linear-gradient(90deg, #ff1493, #2196F3, #ff1493);
        }
        
        .radio-item.selected {
            background: linear-gradient(135deg, rgba(46, 213, 115, 0.2) 0%, rgba(32, 191, 107, 0.2) 100%);
            border-color: #2ed573;
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(46, 213, 115, 0.25);
        }
        
        .radio-item.selected::before {
            background: linear-gradient(90deg, #2ed573, #20bf6b);
        }
        
        .radio-item input[type="radio"] {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
            pointer-events: none;
        }
        
        .radio-item label {
            color: var(--text-primary);
            font-size: 0.9rem;
            cursor: pointer;
            font-weight: 600;
            margin: 0;
            user-select: none;
        }
        
        .radio-item.selected label {
            color: #2ed573;
        }
        
        @media (max-width: 768px) {
            .sales-modal-content {
                margin: 0.5rem;
                max-width: none;
                width: calc(100% - 1rem);
                max-height: 90vh;
            }
            
            .sales-modal-header,
            .sales-modal-body {
                padding: 1rem;
            }
            
            .scenario-grid {
                grid-template-columns: 1fr;
            }
            
            .sales-actions {
                flex-direction: column;
            }
            
            .sales-btn {
                width: 100%;
            }
            
            .radio-group {
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .radio-item {
                min-width: auto;
                width: 100%;
                padding: 0.75rem 1rem;
            }
            
            .checkbox-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
            }
            
            .checkbox-item {
                min-height: 70px;
                padding: 0.75rem;
            }
            
            .checkbox-item .item-icon {
                font-size: 1.2rem;
                margin-bottom: 0.25rem;
            }
            
            .checkbox-item label {
                font-size: 0.75rem;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// Renderování výběru scénářů
function renderScenarioSelection() {
    return `
        <div class="scenario-selection">
            <h3 style="text-align: center; color: var(--text-primary); margin-bottom: 2rem;">S čím zákazník přišel?</h3>
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectScenario('zasilkovna')">
                    <span class="scenario-emoji">📦</span>
                    <h4 class="scenario-title">ZÁSILKOVNA</h4>
                </div>
                <div class="scenario-tile" onclick="selectScenario('prislusenstvi')">
                    <span class="scenario-emoji">🔌</span>
                    <h4 class="scenario-title">PŘÍSLUŠENSTVÍ</h4>
                </div>
                <div class="scenario-tile" onclick="selectScenario('novy-telefon')">
                    <span class="scenario-emoji">📱</span>
                    <h4 class="scenario-title">NOVÝ TELEFON</h4>
                </div>
                <div class="scenario-tile" onclick="selectScenario('vykup')">
                    <span class="scenario-emoji">💰</span>
                    <h4 class="scenario-title">VÝKUP</h4>
                </div>
                <div class="scenario-tile" onclick="selectScenario('jen-se-kouka')">
                    <span class="scenario-emoji">👀</span>
                    <h4 class="scenario-title">JEN SE KOUKÁ</h4>
                </div>
                <div class="scenario-tile" onclick="selectScenario('konzultace')">
                    <span class="scenario-emoji">💬</span>
                    <h4 class="scenario-title">CHCE KONZULTACI</h4>
                </div>
                <div class="scenario-tile" onclick="selectScenario('servis')">
                    <span class="scenario-emoji">🔧</span>
                    <h4 class="scenario-title">CHCE SERVIS TELEFONU</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr scénáře
function selectScenario(scenario) {
    currentScenario = scenario;
    
    // Inicializace sales session
    currentSalesSession = {
        id: Date.now().toString(),
        scenario: scenario,
        seller: localStorage.getItem('username') || 'Unknown',
        sellerId: localStorage.getItem('sellerId') || localStorage.getItem('username'),
        store: localStorage.getItem('userProdejna') || 'Unknown',
        timestamp: Date.now(),
        steps: []
    };
    
    const modalBody = document.getElementById('salesModalBody');
    
    switch(scenario) {
        case 'zasilkovna':
            modalBody.innerHTML = renderZasilkovnaScenario();
            break;
        case 'prislusenstvi':
            modalBody.innerHTML = renderPrislusenstviScenario();
            break;
        case 'novy-telefon':
            modalBody.innerHTML = renderNovyTelefonScenario();
            break;
        case 'vykup':
            modalBody.innerHTML = renderVykupScenario();
            break;
        case 'jen-se-kouka':
            modalBody.innerHTML = renderComingSoon('JEN SE KOUKÁ', '👀');
            break;
        case 'konzultace':
            modalBody.innerHTML = renderComingSoon('CHCE KONZULTACI', '💬');
            break;
        case 'servis':
            modalBody.innerHTML = renderServisScenario();
            break;
        default:
            modalBody.innerHTML = renderScenarioSelection();
    }
}

// Zásilkovna scénář - krok 0 (tipy pro prodej)
function renderZasilkovnaScenario() {
    currentWizardStep = 0;
    selectedItems = { 
        obaly: [], 
        sklicka: [], 
        prislusenstvi: [],
        cisteni: [],
        sluzby: [],
        hadrik: false,
        zakaznickaKarticka: null,
        založitKarticku: null
    };
    
    return `
        <button class="scenario-back-btn" onclick="goBackToScenarios()">← Zpět na výběr</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Tipy pro prodej
        </h3>
        
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                💡 "Díky zásilkovně máte na všechno příslušenství 20% slevu!"
            </div>
        </div>
        
        <div class="sales-content">
            <div class="sales-tips-container">
                <div class="sales-tip">
                    <h4>📱 POKUD MÁ ROZBITÉ SKLÍČKO NA TELEFONU:</h4>
                    <p>"Vidím, že máte rozbité sklíčko, rovnou vám ho vyměním, chcete levnější sklíčko nebo kvalitnější?"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>📱 POKUD MÁ ROZBITÝ NEBO ŽLUTÝ OBAL:</h4>
                    <p>"Vidím, že máte žlutý obal na telefonu, rovnou vám ho vyměním, chcete znovu takový průhledný nebo chcete nějaký barevný?"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>🧽 POKUD MÁ ŠPINAVÝ TELEFON:</h4>
                    <p>"Vidím, že máte špinavý telefon, co kdybych vám ho rovnou vyčistil když už jste tu?"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>✨ POKUD MÁ VŠECHNO V POŘÁDKU:</h4>
                    <p>"Můžu vám nabídnout obal nebo sklíčko? Díky zásilkovně u nás teď máte 20% slevu na příslušenství."</p>
                </div>
            </div>
            
            <div class="sales-result-buttons">
                <button class="sales-result-btn sales-sold-btn" onclick="proceedToProducts()">
                    ✅ Prodal jsem
                </button>
                <button class="sales-result-btn sales-not-sold-btn" onclick="handleNotSold()">
                    ❌ Neprodal jsem
                </button>
            </div>
        </div>
    `;
}

// Pokračování na produkty po úspěšném prodeji
function proceedToProducts() {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderZakaznickaKarticka('zasilkovna');
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Pokračování z zákaznické kartičky pro zásilkovnu
function proceedFromZakaznickaKartickaZasilkovna() {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderZasilkovnaStep1();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Zpracování neprodání při tipech
function handleNotSold() {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderNotSoldTipsForm();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Formulář pro neprodáno při tipech
function renderNotSoldTipsForm() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZasilkovnaScenario();">← Zpět na tipy</button>
        
        <h3 style="text-align: center; color: #ff4757; margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Neprodáno
        </h3>
        
        <div class="sales-content">
            <div style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: #ff4757; text-align: center;">❌ Proč se neprodalo?</h4>
                <textarea id="notSoldReasonTips" placeholder="Krátké odůvodnění proč se nic neprodalo..." 
                    style="width: 100%; min-height: 80px; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.2); 
                    border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--text-primary); 
                    font-size: 0.9rem; resize: vertical; font-family: inherit;"></textarea>
            </div>
            
            <button class="sales-result-btn sales-not-sold-btn" onclick="completeNotSoldTips()" style="width: 100%;">
                📝 Odeslat a dokončit
            </button>
        </div>
    `;
}

// Dokončení neprodáno při tipech
async function completeNotSoldTips() {
    const reason = document.getElementById('notSoldReasonTips').value.trim();
    
    if (!reason) {
        alert('Prosím uveďte alespoň krátké odůvodnění.');
        return;
    }
    
    const sessionData = {
        ...currentSalesSession,
        result: 'not-sold',
        reason: reason,
        items: [],
        revenue: 0,
        discount_used: false,
        completed_at: Date.now(),
        duration: sessionStartTime ? Date.now() - sessionStartTime : 0
    };
    
    try {
        await saveSalesSession(sessionData);
        showSuccessMessage('Neprodáno úspěšně zaznamenáno!');
        closeSalesAssistant();
    } catch (error) {
        console.error('Chyba při ukládání neprodáno:', error);
        alert('Chyba při ukládání dat. Zkuste to znovu.');
    }
}

// Zásilkovna scénář - krok 1 (obaly)
function renderZasilkovnaStep1() {
    currentWizardStep = 1;
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZasilkovnaScenario();">← Zpět na tipy</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Krok 1/5
        </h3>
        
        <div class="sales-content">
            <div class="sales-tip" style="margin-bottom: 1.5rem;">
                <h4>📱 PRODEJNÍ TIP - OBALY:</h4>
                <p>"Nový telefon určitě potřebuje ochranu! Můžu vám nabídnout transparentní obal který nezmění design, barevný obal pro osobitost, nebo knížkový obal s extra ochranou displeje."</p>
            </div>
            
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                📱 OBALY - Vyberte typ obalu:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectObal('transparentni')">
                    <span class="scenario-emoji">🔹</span>
                    <h4 class="scenario-title">TRANSPARENTNÍ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectObal('barevny')">
                    <span class="scenario-emoji">🌈</span>
                    <h4 class="scenario-title">BAREVNÝ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectObal('knizkovy')">
                    <span class="scenario-emoji">📖</span>
                    <h4 class="scenario-title">KNÍŽKOVÝ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectObal('jine')">
                    <span class="scenario-emoji">📦</span>
                    <h4 class="scenario-title">JINÉ</h4>
                </div>
                <div class="scenario-tile" onclick="selectObal('zadny')" style="border-color: #ff4757; background: linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff4757;">❌</span>
                    <h4 class="scenario-title" style="color: #ff4757;">ŽÁDNÝ OBAL<br>NEPRODÁN</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr obalu a přechod na krok 2
function selectObal(typ) {
    if (typ !== 'zadny') {
        selectedItems.obaly = [typ];
    } else {
        selectedItems.obaly = [];
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderZasilkovnaStep2();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Zásilkovna scénář - krok 2 (sklíčka)
function renderZasilkovnaStep2() {
    currentWizardStep = 2;
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZasilkovnaStep1();">← Zpět na obaly</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Krok 2/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Obal: ${selectedItems.obaly.length > 0 ? selectedItems.obaly[0] : 'žádný'}
            </div>
        </div>
        
        <div class="sales-content">
            <div class="sales-tip" style="margin-bottom: 1.5rem;">
                <h4>🔍 PRODEJNÍ TIP - SKLÍČKA:</h4>
                <p>"Displej je nejdražší část telefonu na opravu! Kvalitní ochranné sklíčko vás vyjde levněji než jedna oprava. Mám tu levnější i kvalitnější variantu podle vašich potřeb."</p>
            </div>
            
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🔍 SKLÍČKA - Vyberte typ sklíčka:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectSklicko('kvalitnejsi')">
                    <span class="scenario-emoji">💎</span>
                    <h4 class="scenario-title">KVALITNĚJŠÍ<br>SKLÍČKO</h4>
                </div>
                <div class="scenario-tile" onclick="selectSklicko('levnejsi')">
                    <span class="scenario-emoji">💰</span>
                    <h4 class="scenario-title">LEVNĚJŠÍ<br>SKLÍČKO</h4>
                </div>
                <div class="scenario-tile" onclick="selectSklicko('zadne')" style="border-color: #ff4757; background: linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff4757;">❌</span>
                    <h4 class="scenario-title" style="color: #ff4757;">ŽÁDNÉ SKLÍČKO<br>NEPRODÁNO</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr sklíčka a přechod na krok 3
function selectSklicko(typ) {
    if (typ !== 'zadne') {
        selectedItems.sklicka = [typ];
    } else {
        selectedItems.sklicka = [];
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderZasilkovnaStep3();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Zásilkovna scénář - krok 3 (příslušenství)
function renderZasilkovnaStep3() {
    currentWizardStep = 3;
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZasilkovnaStep2();">← Zpět na sklíčka</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Krok 3/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Obal: ${selectedItems.obaly.length > 0 ? selectedItems.obaly[0] : 'žádný'} | 
                Sklíčko: ${selectedItems.sklicka.length > 0 ? selectedItems.sklicka[0] : 'žádné'}
            </div>
        </div>
        
        <div class="sales-content">
            <div class="sales-tip" style="margin-bottom: 1.5rem;">
                <h4>🔌 PRODEJNÍ TIP - PŘÍSLUŠENSTVÍ:</h4>
                <p>"K novému telefonu se hodí i praktické doplňky! Náhradní kabel pro práci, rychlonabíječka pro rychlé dobíjení, nebo držák do auta pro bezpečnou jízdu."</p>
            </div>
            
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🔌 OSTATNÍ PŘÍSLUŠENSTVÍ - Vyberte co se prodalo:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectPrislusenstvi('kabel')">
                    <span class="scenario-emoji">🔌</span>
                    <h4 class="scenario-title">KABEL</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstvi('nabijeka')">
                    <span class="scenario-emoji">🔋</span>
                    <h4 class="scenario-title">NABÍJEČKA</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstvi('drzak')">
                    <span class="scenario-emoji">🚗</span>
                    <h4 class="scenario-title">DRŽÁK<br>DO AUTA</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstvi('ostatni')">
                    <span class="scenario-emoji">📦</span>
                    <h4 class="scenario-title">OSTATNÍ</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstvi('zadne')" style="border-color: #ff4757; background: linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff4757;">❌</span>
                    <h4 class="scenario-title" style="color: #ff4757;">ŽÁDNÉ PŘÍSLUŠENSTVÍ<br>NEPRODÁNO</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr příslušenství a přechod na krok 4 (služby)
function selectPrislusenstvi(typ) {
    if (typ !== 'zadne') {
        selectedItems.prislusenstvi = [typ];
    } else {
        selectedItems.prislusenstvi = [];
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderZasilkovnaStep4();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Zásilkovna scénář - krok 4 (služby)
function renderZasilkovnaStep4() {
    currentWizardStep = 4;
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZasilkovnaStep3();">← Zpět na příslušenství</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Krok 4/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Příslušenství: ${selectedItems.obaly.length + selectedItems.sklicka.length + selectedItems.prislusenstvi.length} položek
            </div>
        </div>
        
        <div class="sales-content">
            <div class="sales-tip" style="margin-bottom: 1.5rem;">
                <h4>🧹 PRODEJNÍ TIP - ČIŠTĚNÍ:</h4>
                <p>"Když už jste tu, můžu vám telefon rovnou vyčistit! Máme různé varianty podle toho jak moc je špinavý."</p>
            </div>
            
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🧹 ČIŠTĚNÍ TELEFONU - Vyberte variantu:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile service-tooltip" onclick="selectZasilkovnaCisteni('CT300')">
                    <span class="scenario-emoji">🧽</span>
                    <h4 class="scenario-title">CT300<br>KLASICKÉ</h4>
                    <span class="tooltip-text">"Klasické čištění konektoru a z venku - základní údržba telefonu."</span>
                </div>
                <div class="scenario-tile service-tooltip" onclick="selectZasilkovnaCisteni('CT600')">
                    <span class="scenario-emoji">💡</span>
                    <h4 class="scenario-title">CT600<br>+ UV LAMPA</h4>
                    <span class="tooltip-text">"Důkladnější čištění s UV lampou - odstraní bakterie a dezinfikuje telefon."</span>
                </div>
                <div class="scenario-tile service-tooltip" onclick="selectZasilkovnaCisteni('CT1200')">
                    <span class="scenario-emoji">🔧</span>
                    <h4 class="scenario-title">CT1200<br>VNITŘNÍ</h4>
                    <span class="tooltip-text">"Nejdůkladnější čištění - rozebereme telefon a vyčistíme i zevnitř."</span>
                </div>
                <div class="scenario-tile" onclick="selectZasilkovnaCisteni('zadne')" style="border-color: #ff4757; background: linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff4757;">❌</span>
                    <h4 class="scenario-title" style="color: #ff4757;">ŽÁDNÉ<br>ČIŠTĚNÍ</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr čištění a přechod na ostatní služby
function selectZasilkovnaCisteni(typ) {
    if (typ !== 'zadne') {
        selectedItems.cisteni = [typ];
    } else {
        selectedItems.cisteni = [];
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderZasilkovnaStep4Sluzby();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Zásilkovna krok 4 - ostatní služby
function renderZasilkovnaStep4Sluzby() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZasilkovnaStep4();">← Zpět na čištění</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Krok 4/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Čištění: ${selectedItems.cisteni.length > 0 ? selectedItems.cisteni[0] : 'žádné'}
            </div>
        </div>
        
        <div class="sales-content">
            <div class="sales-tip" style="margin-bottom: 1.5rem;">
                <h4>🛠️ PRODEJNÍ TIP - SLUŽBY:</h4>
                <p>"Když už máte telefon u nás, můžu ho rovnou aktualizovat a zazálohovat! Najeďte myší na službu pro detaily."</p>
            </div>
            
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🛠️ OSTATNÍ SLUŽBY - Vyberte prodané služby:
            </h4>
            
            <div class="checkbox-grid">
                <div class="checkbox-item service-tooltip" data-checkbox="aktualizace">
                    <span class="item-icon">🔄</span>
                    <input type="checkbox" id="aktualizace" name="zasilkovna-sluzby">
                    <label for="aktualizace">AKTUALIZACE<br>SYSTÉMU</label>
                    <span class="tooltip-text">"Telefon bude mít nejnovější verzi systému s novými funkcemi a opravami."</span>
                </div>
                <div class="checkbox-item service-tooltip" data-checkbox="zalohovani-dat">
                    <span class="item-icon">💾</span>
                    <input type="checkbox" id="zalohovani-dat" name="zasilkovna-sluzby">
                    <label for="zalohovani-dat">ZÁLOHOVÁNÍ<br>DAT</label>
                    <span class="tooltip-text">"Zazálohuju všechna vaša důležitá data - fotky, kontakty, zprávy."</span>
                </div>
                <div class="checkbox-item service-tooltip" data-checkbox="aktualizace-telefonu">
                    <span class="item-icon">📱</span>
                    <input type="checkbox" id="aktualizace-telefonu" name="zasilkovna-sluzby">
                    <label for="aktualizace-telefonu">AKTUALIZACE<br>TELEFONU</label>
                    <span class="tooltip-text">"Aktualizace všech aplikací a nastavení pro optimální výkon telefonu."</span>
                </div>
                <div class="checkbox-item service-tooltip" data-checkbox="konzultace">
                    <span class="item-icon">💬</span>
                    <input type="checkbox" id="konzultace" name="zasilkovna-sluzby">
                    <label for="konzultace">KONZULTACE</label>
                    <span class="tooltip-text">"Poradím vám s používáním telefonu a ukážu nové funkce."</span>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 2rem;">
                <button class="sales-btn" onclick="proceedToZasilkovnaHadrik()">
                    ➡️ POKRAČOVAT NA HADŘÍK
                </button>
            </div>
        </div>
    `;
}

// Pokračování na hadřík
function proceedToZasilkovnaHadrik() {
    // Uložení vybraných služeb
    const selectedSluzby = [];
    document.querySelectorAll('input[name="zasilkovna-sluzby"]:checked').forEach(item => {
        const label = document.querySelector(`label[for="${item.id}"]`);
        const itemName = label ? label.textContent.replace(/\s+/g, ' ').trim() : item.id;
        selectedSluzby.push(itemName);
    });
    selectedItems.sluzby = selectedSluzby;
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderZasilkovnaStep4Hadrik();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Zásilkovna krok 4 - hadřík
function renderZasilkovnaStep4Hadrik() {  
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZasilkovnaStep4Sluzby();">← Zpět na služby</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Krok 4/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Služby: ${selectedItems.sluzby.length} položek
            </div>
        </div>
        
        <div class="sales-content">
            <div class="sales-tip" style="margin-bottom: 1.5rem;">
                <h4>🧽 PRODEJNÍ TIP - HADŘÍK:</h4>
                <p>"A nakonec, můžu vám nabídnout speciální hadřík na čištění displeje - budete mít telefon vždy čistý!"</p>
            </div>
            
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🧽 HADŘÍK NA ČIŠTĚNÍ:
            </h4>
            
            <div class="radio-group">
                <div class="radio-item" onclick="selectZasilkovnaHadrik(true, this)">
                    <input type="radio" id="hadrik-ano" name="hadrik" value="ano">
                    <label for="hadrik-ano">ANO</label>
                </div>
                <div class="radio-item" onclick="selectZasilkovnaHadrik(false, this)">
                    <input type="radio" id="hadrik-ne" name="hadrik" value="ne">
                    <label for="hadrik-ne">NE</label>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 2rem;">
                <button class="sales-btn" onclick="proceedToZasilkovnaFinal()">
                    ➡️ POKRAČOVAT NA DOKONČENÍ
                </button>
            </div>
        </div>
    `;
}

// Výběr hadříku
function selectZasilkovnaHadrik(selected, element) {
    selectedItems.hadrik = selected;
    
    document.querySelectorAll('.radio-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    
    const radio = element.querySelector('input[type="radio"]');
    radio.checked = true;
}

// Pokračování na finální dokončení
function proceedToZasilkovnaFinal() {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderZasilkovnaStep5();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Zásilkovna scénář - krok 5 (finální - sleva a dokončení)
function renderZasilkovnaStep5() {
    currentWizardStep = 5;
    
    // Spočítej co se prodalo
    const soldItems = [];
    if (selectedItems.obaly.length > 0) soldItems.push(selectedItems.obaly[0] + ' obal');
    if (selectedItems.sklicka.length > 0) soldItems.push(selectedItems.sklicka[0] + ' sklíčko');
    if (selectedItems.prislusenstvi.length > 0) soldItems.push(selectedItems.prislusenstvi[0]);
    if (selectedItems.cisteni.length > 0) soldItems.push('čištění ' + selectedItems.cisteni[0]);
    soldItems.push(...selectedItems.sluzby);
    if (selectedItems.hadrik) soldItems.push('hadřík na čištění');
    
    const nothingSold = soldItems.length === 0;
    
    if (nothingSold) {
        // Pokud se nic neprodalo, přejdi na "neprodáno" formulář
        return renderNotSoldForm();
    }
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZasilkovnaStep4Hadrik();">← Zpět na hadřík</button>
        
        <h3 style="text-align: center; color: #2ed573; margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Krok 5/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="background: rgba(46, 213, 115, 0.1); border: 1px solid rgba(46, 213, 115, 0.3); border-radius: 8px; padding: 1rem; color: var(--text-primary);">
                <h4 style="margin: 0 0 0.5rem 0; color: #2ed573;">✅ Prodáno:</h4>
                <div style="font-size: 0.9rem;">
                    ${soldItems.map(item => `• ${item}`).join('<br>')}
                </div>
            </div>
        </div>
        
        <div class="sales-content">
            <h4 style="color: var(--text-primary); margin: 1rem 0; text-align: center;">
                Použil jste při argumentaci slevu?
            </h4>
            
            <div class="radio-group">
                <div class="radio-item" onclick="selectDiscountUsed(true, this)">
                    <input type="radio" id="discount-yes" name="discount-used" value="yes">
                    <label for="discount-yes">ANO</label>
                </div>
                <div class="radio-item" onclick="selectDiscountUsed(false, this)">
                    <input type="radio" id="discount-no" name="discount-used" value="no">
                    <label for="discount-no">NE</label>
                </div>
            </div>
        </div>
        
        <div class="sales-actions">
            <button class="sales-btn success" onclick="completeWizardSale()">
                🎉 DOKONČIT PRODEJ
            </button>
        </div>
    `;
}

// Coming soon template
function renderComingSoon(title, emoji) {
    return `
        <button class="scenario-back-btn" onclick="goBackToScenarios()">← Zpět na výběr</button>
        
        <div style="text-align: center; padding: 3rem 1rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">${emoji}</div>
            <h3 style="color: var(--text-primary); margin-bottom: 1rem;">${title}</h3>
            <p style="color: var(--text-secondary); font-size: 1.1rem;">
                Tento scénář bude brzy dostupný!<br>
                Momentálně pracujeme na jeho dokončení.
            </p>
        </div>
    `;
}

// Zpět na výběr scénářů
function goBackToScenarios() {
    currentScenario = null;
    currentSalesSession = null;
    document.getElementById('salesModalBody').innerHTML = renderScenarioSelection();
}

// Zpracování výsledku prodeje
function handleSaleResult(result) {
    const modalBody = document.getElementById('salesModalBody');
    
    if (result === 'sold') {
        modalBody.innerHTML = renderSoldForm();
    } else {
        modalBody.innerHTML = renderNotSoldForm();
    }
    
    // Scroll na začátek modalu
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Formulář pro prodáno
function renderSoldForm() {
    return `
        <button class="scenario-back-btn" onclick="selectScenario('zasilkovna')">← Zpět na scénář</button>
        
        <h3 style="text-align: center; color: #2ed573; margin-bottom: 2rem;">
            ✅ Skvělé! Co se podařilo prodat?
        </h3>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem;">📱 OBALY:</h4>
            <div class="checkbox-grid">
                <div class="checkbox-item" data-checkbox="transparentni-obal">
                    <span class="item-icon">🔹</span>
                    <input type="checkbox" id="transparentni-obal" name="sold-items">
                    <label for="transparentni-obal">TRANSPARENTNÍ<br>OBAL</label>
                </div>
                <div class="checkbox-item" data-checkbox="barevny-obal">
                    <span class="item-icon">🌈</span>
                    <input type="checkbox" id="barevny-obal" name="sold-items">
                    <label for="barevny-obal">BAREVNÝ<br>OBAL</label>
                </div>
                <div class="checkbox-item" data-checkbox="knizkovy-obal">
                    <span class="item-icon">📖</span>
                    <input type="checkbox" id="knizkovy-obal" name="sold-items">
                    <label for="knizkovy-obal">KNÍŽKOVÝ<br>OBAL</label>
                </div>
            </div>
            
            <h4 style="color: var(--primary-color); margin: 2rem 0 1rem 0;">🔍 SKLÍČKA:</h4>
            <div class="checkbox-grid">
                <div class="checkbox-item" data-checkbox="kvalitnejsi-sklicko">
                    <span class="item-icon">💎</span>
                    <input type="checkbox" id="kvalitnejsi-sklicko" name="sold-items">
                    <label for="kvalitnejsi-sklicko">KVALITNĚJŠÍ<br>SKLÍČKO</label>
                </div>
                <div class="checkbox-item" data-checkbox="levnejsi-sklicko">
                    <span class="item-icon">💰</span>
                    <input type="checkbox" id="levnejsi-sklicko" name="sold-items">
                    <label for="levnejsi-sklicko">LEVNĚJŠÍ<br>SKLÍČKO</label>
                </div>
            </div>
            
            <h4 style="color: var(--primary-color); margin: 2rem 0 1rem 0;">🔌 OSTATNÍ PŘÍSLUŠENSTVÍ:</h4>
            <div class="checkbox-grid">
                <div class="checkbox-item" data-checkbox="kabel">
                    <span class="item-icon">🔌</span>
                    <input type="checkbox" id="kabel" name="sold-items">
                    <label for="kabel">KABEL</label>
                </div>
                <div class="checkbox-item" data-checkbox="nabijeka">
                    <span class="item-icon">🔋</span>
                    <input type="checkbox" id="nabijeka" name="sold-items">
                    <label for="nabijeka">NABÍJEČKA</label>
                </div>
                <div class="checkbox-item" data-checkbox="drzak-do-auta">
                    <span class="item-icon">🚗</span>
                    <input type="checkbox" id="drzak-do-auta" name="sold-items">
                    <label for="drzak-do-auta">DRŽÁK<br>DO AUTA</label>
                </div>
                <div class="checkbox-item" data-checkbox="ostatni">
                    <span class="item-icon">📦</span>
                    <input type="checkbox" id="ostatni" name="sold-items">
                    <label for="ostatni">OSTATNÍ</label>
                </div>
            </div>
            
            <h4 style="color: var(--text-primary); margin: 2rem 0 1rem 0; text-align: center;">
                Použil jste při argumentaci slevu?
            </h4>
            
            <div class="radio-group">
                <div class="radio-item" onclick="selectDiscountUsed(true, this)">
                    <input type="radio" id="discount-yes" name="discount-used" value="yes">
                    <label for="discount-yes">ANO</label>
                </div>
                <div class="radio-item" onclick="selectDiscountUsed(false, this)">
                    <input type="radio" id="discount-no" name="discount-used" value="no">
                    <label for="discount-no">NE</label>
                </div>
            </div>
        </div>
        
        <div class="sales-actions">
            <button class="sales-btn success" onclick="completeSale()">
                🎉 DOKONČIT
            </button>
        </div>
    `;
}

// Formulář pro neprodáno
function renderNotSoldForm() {
    return `
        <button class="scenario-back-btn" onclick="selectScenario('zasilkovna')">← Zpět na scénář</button>
        
        <h3 style="text-align: center; color: #ff4757; margin-bottom: 2rem;">
            ❌ Nedošlo k prodeji
        </h3>
        
        <div class="sales-content">
            <h4 style="color: var(--text-primary); margin-bottom: 1rem;">
                Napište ve zkratce důvod:
            </h4>
            
            <div class="sales-form">
                <textarea 
                    id="notSoldReason" 
                    placeholder="Např.: Zákazník si rozmyslel, neměl peníze, nelíbil se mu design..."
                    rows="4"
                ></textarea>
            </div>
        </div>
        
        <div class="sales-actions">
            <button class="sales-btn danger" onclick="completeNotSold()">
                📝 DOKONČIT
            </button>
        </div>
    `;
}

// Toggle checkbox funkce
function toggleCheckbox(checkboxId) {
    const checkbox = document.getElementById(checkboxId);
    const checkboxItem = checkbox.closest('.checkbox-item');
    
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        
        // Aktualizuj vizuální stav
        if (checkbox.checked) {
            checkboxItem.classList.add('checked');
        } else {
            checkboxItem.classList.remove('checked');
        }
    }
}

// Inicializace checkbox event listenerů
function initCheckboxListeners() {
    // Event delegation pro všechny checkbox items
    document.addEventListener('click', function(e) {
        const checkboxItem = e.target.closest('.checkbox-item');
        if (checkboxItem && checkboxItem.dataset.checkbox) {
            e.preventDefault();
            e.stopPropagation();
            
            const checkboxId = checkboxItem.dataset.checkbox;
            toggleCheckbox(checkboxId);
        }
    });
}

// Výběr slevy
function selectDiscountUsed(used, element) {
    document.querySelectorAll('.radio-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    
    const radio = element.querySelector('input[type="radio"]');
    radio.checked = true;
}

// Dokončení prodeje
async function completeSale() {
    const soldItems = [];
    document.querySelectorAll('input[name="sold-items"]:checked').forEach(item => {
        // Převést ID na čitelný název z labelu
        const label = document.querySelector(`label[for="${item.id}"]`);
        const itemName = label ? label.textContent : item.id.toUpperCase();
        soldItems.push(itemName);
    });
    
    const discountUsed = document.querySelector('input[name="discount-used"]:checked');
    
    if (soldItems.length === 0) {
        alert('Prosím vyberte alespoň jednu položku která byla prodána.');
        return;
    }
    
    if (!discountUsed) {
        alert('Prosím vyberte zda byla použita sleva.');
        return;
    }
    
    // Spočítej čas session
    const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    
    // Přidat data do session
    currentSalesSession.result = 'sold';
    currentSalesSession.soldItems = soldItems;
    currentSalesSession.discountUsed = discountUsed.value === 'yes';
    currentSalesSession.completedAt = Date.now();
    currentSalesSession.sessionDuration = sessionDuration;
    currentSalesSession.sessionDurationMinutes = Math.round(sessionDuration / 60000 * 100) / 100; // Minuty s 2 des. místy
    
    // Uložit na server
    const saved = await saveSalesSession(currentSalesSession);
    
    if (saved) {
        showSuccessMessage('Prodej byl úspěšně zaznamenán! 🎉');
        setTimeout(function() {
            closeSalesAssistant();
            // Aktualizuj stránku pro čistý nový začátek
            location.reload();
        }, 2000);
    } else {
        alert('Chyba při ukládání dat. Zkuste to prosím znovu.');
    }
}

// Dokončení neprodáno
async function completeNotSold() {
    const reason = document.getElementById('notSoldReason').value.trim();
    
    if (!reason) {
        alert('Prosím napište důvod proč nedošlo k prodeji.');
        return;
    }
    
    // Spočítej čas session
    const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    
    // Přidat data do session
    currentSalesSession.result = 'not-sold';
    currentSalesSession.notSoldReason = reason;
    currentSalesSession.completedAt = Date.now();
    currentSalesSession.sessionDuration = sessionDuration;
    currentSalesSession.sessionDurationMinutes = Math.round(sessionDuration / 60000 * 100) / 100; // Minuty s 2 des. místy
    
    // Uložit na server
    const saved = await saveSalesSession(currentSalesSession);
    
    if (saved) {
        showSuccessMessage('Záznam byl úspěšně uložen. 📝');
        setTimeout(function() {
            closeSalesAssistant();
            // Aktualizuj stránku pro čistý nový začátek
            location.reload();
        }, 2000);
    } else {
        alert('Chyba při ukládání dat. Zkuste to prosím znovu.');
    }
}

// Uložení sales session na server
async function saveSalesSession(sessionData) {
    try {
        // Nejdřív ulož do localStorage jako backup
        const existingSessions = JSON.parse(localStorage.getItem('sales_sessions') || '[]');
        existingSessions.push(sessionData);
        localStorage.setItem('sales_sessions', JSON.stringify(existingSessions));
        
        console.log('📦 Sales session uložena do localStorage');
        console.log('📦 Celkem sessions v localStorage:', existingSessions.length);
        console.log('📦 Nová session data:', sessionData);
        
        // Zkus uložit na server
        const response = await fetch('/api/sales-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sessionData)
        });
        
        if (response.ok) {
            console.log('✅ Sales session úspěšně uložena na server');
            return true;
        } else {
            console.warn('⚠️ Server nedostupný, data uložena pouze lokálně');
            return true; // Vraťme true i pro lokální uložení
        }
        
    } catch (error) {
        console.warn('⚠️ Chyba při ukládání na server:', error.message);
        return true; // Data jsou alespoň v localStorage
    }
}

// Zobrazení success zprávy
function showSuccessMessage(message) {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
            <h3 style="color: #2ed573; margin-bottom: 1rem;">${message}</h3>
            <p style="color: var(--text-secondary);">
                Okno se automaticky zavře za chvíli...
            </p>
        </div>
    `;
}

// Dokončení prodeje z wizardu
async function completeWizardSale() {
    const discountUsed = document.querySelector('input[name="discount-used"]:checked');
    
    if (!discountUsed) {
        alert('Prosím vyberte zda byla použita sleva.');
        return;
    }
    
    // Spočítej čas session
    const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    
    // Sestavuj prodané položky z wizardu
    const soldItems = [];
    if (selectedItems.obaly.length > 0) {
        soldItems.push(selectedItems.obaly[0] + ' obal');
    }
    if (selectedItems.sklicka.length > 0) {
        soldItems.push(selectedItems.sklicka[0] + ' sklíčko');
    }
    if (selectedItems.prislusenstvi.length > 0) {
        soldItems.push(selectedItems.prislusenstvi[0]);
    }
    if (selectedItems.cisteni && selectedItems.cisteni.length > 0) {
        soldItems.push('čištění ' + selectedItems.cisteni[0]);
    }
    if (selectedItems.sluzby && selectedItems.sluzby.length > 0) {
        soldItems.push(...selectedItems.sluzby);
    }
    if (selectedItems.hadrik) {
        soldItems.push('hadřík na čištění');
    }
    
    // Přidat data do session
    currentSalesSession.result = 'sold';
    currentSalesSession.soldItems = soldItems;
    currentSalesSession.discountUsed = discountUsed.value === 'yes';
    currentSalesSession.completedAt = Date.now();
    currentSalesSession.sessionDuration = sessionDuration;
    currentSalesSession.sessionDurationMinutes = Math.round(sessionDuration / 60000 * 100) / 100; // Minuty s 2 des. místy
    
    // Uložit na server
    const saved = await saveSalesSession(currentSalesSession);
    
    if (saved) {
        showSuccessMessage('Prodej byl úspěšně zaznamenán! 🎉');
        setTimeout(function() {
            closeSalesAssistant();
            // Aktualizuj stránku pro čistý nový začátek
            location.reload();
        }, 2000);
    } else {
        alert('Chyba při ukládání dat. Zkuste to prosím znovu.');
    }
}

// === PŘÍSLUŠENSTVÍ SCÉNÁŘ ===

// Příslušenství scénář - krok 0 (výběr typu příslušenství)
function renderPrislusenstviScenario() {
    currentWizardStep = 0;
    selectedItems = { 
        typPrislusenstvi: '',
        zakaznickaKarticka: null,
        založitKarticku: null,
        obaly: [],
        sklicka: [],
        prislusenstvi: [],
        sluzby: [],
        sunshinefolie: false,
        hadrik: false
    };
    
    return `
        <button class="scenario-back-btn" onclick="goBackToScenarios()">← Zpět na výběr</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            🔌 PŘÍSLUŠENSTVÍ
        </h3>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🔌 S ČÍM ZÁKAZNÍK PŘIŠEL?
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectPrislusenstviTyp('obal')">
                    <span class="scenario-emoji">📱</span>
                    <h4 class="scenario-title">OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviTyp('sklo')">
                    <span class="scenario-emoji">🔍</span>
                    <h4 class="scenario-title">SKLO</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviTyp('nabijeka')">
                    <span class="scenario-emoji">🔋</span>
                    <h4 class="scenario-title">NABÍJEČKA</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviTyp('jine')">
                    <span class="scenario-emoji">📦</span>
                    <h4 class="scenario-title">JINÉ</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr typu příslušenství
function selectPrislusenstviTyp(typ) {
    selectedItems.typPrislusenstvi = typ;
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderZakaznickaKarticka('prislusenstvi');
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Funkce pro zákaznickou kartičku (použitelná ve všech scénářích)
function renderZakaznickaKarticka(scenarioType) {
    const scenarioInfo = {
        'prislusenstvi': {
            title: '🔌 PŘÍSLUŠENSTVÍ',
            backFunction: 'renderPrislusenstviScenario',
            continueFunction: 'proceedFromZakaznickaKarticka'
        },
        'zasilkovna': {
            title: '📦 ZÁSILKOVNA',
            backFunction: 'renderZasilkovnaScenario',
            continueFunction: 'proceedFromZakaznickaKartickaZasilkovna'
        },
        'novy-telefon': {
            title: '📱 NOVÝ TELEFON',
            backFunction: 'renderNovyTelefonScenario',
            continueFunction: 'proceedFromZakaznickaKartickaNovyTelefon'
        },
        'servis': {
            title: '🔧 SERVIS TELEFONU',
            backFunction: 'renderServisScenario',
            continueFunction: 'proceedFromZakaznickaKartickaServis'
        }
    };
    
    const info = scenarioInfo[scenarioType];
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = ${info.backFunction}();">← Zpět</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            ${info.title} - Zákaznická kartička
        </h3>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                💳 MÁ ZÁKAZNÍK ZÁKAZNICKOU KARTIČKU?
            </h4>
            
            <div class="radio-group">
                <div class="radio-item" onclick="selectZakaznickaKarticka(true, this, '${scenarioType}')">
                    <input type="radio" id="karticka-ano" name="zakaznicka-karticka" value="ano">
                    <label for="karticka-ano">ANO</label>
                </div>
                <div class="radio-item" onclick="selectZakaznickaKarticka(false, this, '${scenarioType}')">
                    <input type="radio" id="karticka-ne" name="zakaznicka-karticka" value="ne">
                    <label for="karticka-ne">NE</label>
                </div>
            </div>
            
            <div id="karticka-pokracovat" style="text-align: center; margin-top: 2rem; display: none;">
                <button class="sales-btn" onclick="${info.continueFunction}()">
                    ➡️ POKRAČOVAT
                </button>
            </div>
        </div>
    `;
}

// Výběr zákaznické kartičky
function selectZakaznickaKarticka(maKarticku, element, scenarioType) {
    selectedItems.zakaznickaKarticka = maKarticku;
    
    document.querySelectorAll('.radio-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    
    const radio = element.querySelector('input[type="radio"]');
    radio.checked = true;
    
    // Pokud nemá kartičku, zobraz otázku na založení
    if (!maKarticku) {
        setTimeout(() => {
            const modalBody = document.getElementById('salesModalBody');
            modalBody.innerHTML = renderZalozitKarticku(scenarioType);
        }, 500);
    } else {
        // Pokud má kartičku, zobraz tlačítko pokračovat
        document.getElementById('karticka-pokracovat').style.display = 'block';
    }
}

// Formulář pro založení kartičky
function renderZalozitKarticku(scenarioType) {
    const scenarioInfo = {
        'prislusenstvi': { title: '🔌 PŘÍSLUŠENSTVÍ', continueFunction: 'proceedFromZakaznickaKarticka' },
        'zasilkovna': { title: '📦 ZÁSILKOVNA', continueFunction: 'proceedFromZakaznickaKartickaZasilkovna' },
        'novy-telefon': { title: '📱 NOVÝ TELEFON', continueFunction: 'proceedFromZakaznickaKartickaNovyTelefon' },
        'servis': { title: '🔧 SERVIS TELEFONU', continueFunction: 'proceedFromZakaznickaKartickaServis' }
    };
    
    const info = scenarioInfo[scenarioType];
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZakaznickaKarticka('${scenarioType}');">← Zpět</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            ${info.title} - Založit kartičku?
        </h3>
        
        <div class="sales-content">
            <div class="sales-tip" style="margin-bottom: 1.5rem;">
                <h4>💳 NABÍDNI ZALOŽENÍ KARTIČKY:</h4>
                <p>"Můžu vám založit zákaznickou kartičku! Budete mít slevy, body za nákupy a speciální nabídky jen pro vás."</p>
            </div>
            
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                💳 BUDEME ZAKLÁDAT ZÁKAZNICKOU KARTIČKU?
            </h4>
            
            <div class="radio-group">
                <div class="radio-item" onclick="selectZalozitKarticku(true, this, '${scenarioType}')">
                    <input type="radio" id="zalozit-ano" name="zalozit-karticku" value="ano">
                    <label for="zalozit-ano">ANO</label>
                </div>
                <div class="radio-item" onclick="selectZalozitKarticku(false, this, '${scenarioType}')">
                    <input type="radio" id="zalozit-ne" name="zalozit-karticku" value="ne">
                    <label for="zalozit-ne">NE</label>
                </div>
            </div>
            
            <div id="zalozit-pokracovat" style="text-align: center; margin-top: 2rem; display: none;">
                <button class="sales-btn" onclick="${info.continueFunction}()">
                    ➡️ POKRAČOVAT
                </button>
            </div>
        </div>
    `;
}

// Výběr založení kartičky
function selectZalozitKarticku(zalozit, element, scenarioType) {
    selectedItems.založitKarticku = zalozit;
    
    document.querySelectorAll('.radio-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    
    const radio = element.querySelector('input[type="radio"]');
    radio.checked = true;
    
    // Zobraz tlačítko pokračovat
    document.getElementById('zalozit-pokracovat').style.display = 'block';
}

// Pokračování z zákaznické kartičky pro příslušenství
function proceedFromZakaznickaKarticka() {
    const modalBody = document.getElementById('salesModalBody');
    
    // Podle typu příslušenství ukažeme různé tipy
    switch(selectedItems.typPrislusenstvi) {
        case 'sklo':
            modalBody.innerHTML = renderPrislusenstviSkloTipy();
            break;
        case 'obal':
            modalBody.innerHTML = renderPrislusenstviObalTipy();
            break;
        case 'nabijeka':
            modalBody.innerHTML = renderPrislusenstviNabijekaTipy();
            break;
        case 'jine':
            modalBody.innerHTML = renderPrislusenstviJineTipy();
            break;
        default:
            modalBody.innerHTML = renderPrislusenstviSkloTipy();
    }
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Tipy pro SKLO
function renderPrislusenstviSkloTipy() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZakaznickaKarticka('prislusenstvi');">← Zpět na kartičku</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            🔍 SKLO - Tipy pro upsell
        </h3>
        
        <div class="sales-content">
            <div class="sales-tips-container">
                <div class="sales-tip">
                    <h4>🌟 SUNSHINE FOLIE:</h4>
                    <p>"Alternativně můžu nabídnout Sunshine folii - má doživotní záruku a když se poškodí, vyměním ji za novou jen za 299 Kč!"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>📱 OBAL:</h4>
                    <p>"Když už chráníte displej, pojďme chránit i zbytek telefonu kvalitním obalem!"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>🛠️ SLUŽBY:</h4>
                    <p>"Když už jste tu, můžu vám telefon vyčistit, aktualizovat nebo zazálohovat!"</p>
                </div>
            </div>
            
            <div class="sales-result-buttons">
                <button class="sales-result-btn sales-sold-btn" onclick="proceedToPrislusenstviProducts()">
                    ✅ Uspěl jsem s upsell
                </button>
                <button class="sales-result-btn sales-not-sold-btn" onclick="proceedToPrislusenstviProducts()">
                    ❌ Neuspěl jsem s upsell
                </button>
            </div>
        </div>
    `;
}

// Tipy pro OBAL
function renderPrislusenstviObalTipy() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZakaznickaKarticka('prislusenstvi');">← Zpět na kartičku</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📱 OBAL - Tipy pro upsell
        </h3>
        
        <div class="sales-content">
            <div class="sales-tips-container">
                <div class="sales-tip">
                    <h4>🔍 SKLO:</h4>
                    <p>"Když už chráníte telefon obalem, pojďme chránit i displej kvalitním sklem!"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>🌟 SUNSHINE FOLIE:</h4>
                    <p>"Místo skla můžu nabídnout Sunshine folii - má doživotní záruku a když se poškodí, vyměním ji za novou jen za 299 Kč!"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>🛠️ SLUŽBY:</h4>
                    <p>"Když už jste tu, můžu vám telefon vyčistit, aktualizovat nebo zazálohovat!"</p>
                </div>
            </div>
            
            <div class="sales-result-buttons">
                <button class="sales-result-btn sales-sold-btn" onclick="proceedToPrislusenstviProducts()">
                    ✅ Uspěl jsem s upsell
                </button>
                <button class="sales-result-btn sales-not-sold-btn" onclick="proceedToPrislusenstviProducts()">
                    ❌ Neuspěl jsem s upsell
                </button>
            </div>
        </div>
    `;
}

// Tipy pro NABÍJEČKA
function renderPrislusenstviNabijekaTipy() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZakaznickaKarticka('prislusenstvi');">← Zpět na kartičku</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            🔋 NABÍJEČKA - Tipy pro upsell
        </h3>
        
        <div class="sales-content">
            <div class="sales-tips-container">
                <div class="sales-tip">
                    <h4>🔌 ADAPTER vs KABEL:</h4>
                    <p>"Potřebujete adapter nebo kabel? Pokud máte jen jedno, druhé se vám určitě bude hodit!"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>📱 OCHRANA TELEFONU:</h4>
                    <p>"Když už investujete do nabíjení, pojďme chránit i telefon - obal a sklo!"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>🌟 SUNSHINE FOLIE:</h4>
                    <p>"K tomu doporučuji Sunshine folii - má doživotní záruku a když se poškodí, vyměním ji za novou jen za 299 Kč!"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>🛠️ SLUŽBY:</h4>
                    <p>"Když už jste tu, můžu vám telefon vyčistit, aktualizovat nebo zazálohovat!"</p>
                </div>
            </div>
            
            <div class="sales-result-buttons">
                <button class="sales-result-btn sales-sold-btn" onclick="proceedToPrislusenstviProducts()">
                    ✅ Uspěl jsem s upsell
                </button>
                <button class="sales-result-btn sales-not-sold-btn" onclick="proceedToPrislusenstviProducts()">
                    ❌ Neuspěl jsem s upsell
                </button>
            </div>
        </div>
    `;
}

// Tipy pro JINÉ
function renderPrislusenstviJineTipy() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZakaznickaKarticka('prislusenstvi');">← Zpět na kartičku</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📦 JINÉ PŘÍSLUŠENSTVÍ - Tipy pro upsell
        </h3>
        
        <div class="sales-content">
            <div class="sales-tips-container">
                <div class="sales-tip">
                    <h4>🔍 OCHRANA TELEFONU:</h4>
                    <p>"Když už investujete do příslušenství, pojďme chránit i telefon - sklo a obal!"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>🌟 SUNSHINE FOLIE:</h4>
                    <p>"Můžu nabídnout Sunshine folii - má doživotní záruku a když se poškodí, vyměním ji za novou jen za 299 Kč!"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>🛠️ SLUŽBY:</h4>
                    <p>"Když už jste tu, můžu vám telefon vyčistit, aktualizovat nebo zazálohovat!"</p>
                </div>
            </div>
            
            <div class="sales-result-buttons">
                <button class="sales-result-btn sales-sold-btn" onclick="proceedToPrislusenstviProducts()">
                    ✅ Uspěl jsem s upsell
                </button>
                <button class="sales-result-btn sales-not-sold-btn" onclick="proceedToPrislusenstviProducts()">
                    ❌ Neuspěl jsem s upsell
                </button>
            </div>
        </div>
    `;
}

// Pokračování na produkty - krok 1 (obaly)
function proceedToPrislusenstviProducts() {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderPrislusenstviStep1();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Příslušenství scénář - krok 1 (obaly)
function renderPrislusenstviStep1() {
    return `
        <button class="scenario-back-btn" onclick="proceedFromZakaznickaKarticka()">← Zpět na tipy</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            🔌 PŘÍSLUŠENSTVÍ - Krok 1/5
        </h3>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                📱 OBALY - Vyberte typ obalu:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectPrislusenstviObal('transparentni')">
                    <span class="scenario-emoji">🔹</span>
                    <h4 class="scenario-title">TRANSPARENTNÍ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviObal('barevny')">
                    <span class="scenario-emoji">🌈</span>
                    <h4 class="scenario-title">BAREVNÝ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviObal('knizkovy')">
                    <span class="scenario-emoji">📖</span>
                    <h4 class="scenario-title">KNÍŽKOVÝ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviObal('zadny')" style="border-color: #ff4757; background: linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff4757;">❌</span>
                    <h4 class="scenario-title" style="color: #ff4757;">ŽÁDNÝ OBAL<br>NEPRODÁN</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr obalu a přechod na krok 2
function selectPrislusenstviObal(typ) {
    if (typ !== 'zadny') {
        selectedItems.obaly = [typ];
    } else {
        selectedItems.obaly = [];
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderPrislusenstviStep2();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Příslušenství scénář - krok 2 (sklíčka + sunshine folie)
function renderPrislusenstviStep2() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderPrislusenstviStep1();">← Zpět na obaly</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            🔌 PŘÍSLUŠENSTVÍ - Krok 2/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Obal: ${selectedItems.obaly.length > 0 ? selectedItems.obaly[0] : 'žádný'}
            </div>
        </div>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🔍 SKLÍČKA + SUNSHINE FOLIE:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectPrislusenstviSklicko('kvalitnejsi')">
                    <span class="scenario-emoji">💎</span>
                    <h4 class="scenario-title">KVALITNĚJŠÍ<br>SKLÍČKO</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviSklicko('levnejsi')">
                    <span class="scenario-emoji">💰</span>
                    <h4 class="scenario-title">LEVNĚJŠÍ<br>SKLÍČKO</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviSklicko('sunshine')">
                    <span class="scenario-emoji">🌟</span>
                    <h4 class="scenario-title">SUNSHINE<br>FOLIE</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviSklicko('zadne')" style="border-color: #ff4757; background: linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff4757;">❌</span>
                    <h4 class="scenario-title" style="color: #ff4757;">ŽÁDNÉ SKLÍČKO<br>NEPRODÁNO</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr sklíčka a přechod na krok 3
function selectPrislusenstviSklicko(typ) {
    if (typ !== 'zadne') {
        selectedItems.sklicka = [typ];
    } else {
        selectedItems.sklicka = [];
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderPrislusenstviStep3();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Příslušenství scénář - krok 3 (ostatní příslušenství)
function renderPrislusenstviStep3() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderPrislusenstviStep2();">← Zpět na sklíčka</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            🔌 PŘÍSLUŠENSTVÍ - Krok 3/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Obal: ${selectedItems.obaly.length > 0 ? selectedItems.obaly[0] : 'žádný'} | 
                Sklíčko: ${selectedItems.sklicka.length > 0 ? selectedItems.sklicka[0] : 'žádné'}
            </div>
        </div>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🔌 OSTATNÍ PŘÍSLUŠENSTVÍ - Vyberte co se prodalo:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectPrislusenstviOstatni('kabel')">
                    <span class="scenario-emoji">🔌</span>
                    <h4 class="scenario-title">KABEL</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviOstatni('adapter')">
                    <span class="scenario-emoji">🔌</span>
                    <h4 class="scenario-title">ADAPTER</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviOstatni('nabijeka')">
                    <span class="scenario-emoji">🔋</span>
                    <h4 class="scenario-title">NABÍJEČKA</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviOstatni('drzak')">
                    <span class="scenario-emoji">🚗</span>
                    <h4 class="scenario-title">DRŽÁK<br>DO AUTA</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviOstatni('ostatni')">
                    <span class="scenario-emoji">📦</span>
                    <h4 class="scenario-title">OSTATNÍ</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviOstatni('zadne')" style="border-color: #ff4757; background: linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff4757;">❌</span>
                    <h4 class="scenario-title" style="color: #ff4757;">ŽÁDNÉ PŘÍSLUŠENSTVÍ<br>NEPRODÁNO</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr ostatního příslušenství a přechod na krok 4
function selectPrislusenstviOstatni(typ) {
    if (typ !== 'zadne') {
        selectedItems.prislusenstvi = [typ];
    } else {
        selectedItems.prislusenstvi = [];
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderPrislusenstviStep4();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Příslušenství scénář - krok 4 (služby)
function renderPrislusenstviStep4() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderPrislusenstviStep3();">← Zpět na příslušenství</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            🔌 PŘÍSLUŠENSTVÍ - Krok 4/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Příslušenství: ${selectedItems.obaly.length + selectedItems.sklicka.length + selectedItems.prislusenstvi.length} položek
            </div>
        </div>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🛠️ SLUŽBY - Vyberte prodané služby:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectPrislusenstviSluzba('cisteni')">
                    <span class="scenario-emoji">🧽</span>
                    <h4 class="scenario-title">ČIŠTĚNÍ<br>TELEFONU</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviSluzba('aktualizace')">
                    <span class="scenario-emoji">🔄</span>
                    <h4 class="scenario-title">AKTUALIZACE<br>SYSTÉMU</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviSluzba('zalohovani')">
                    <span class="scenario-emoji">💾</span>
                    <h4 class="scenario-title">ZÁLOHOVÁNÍ<br>DAT</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviSluzba('zadne')" style="border-color: #ff4757; background: linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff4757;">❌</span>
                    <h4 class="scenario-title" style="color: #ff4757;">ŽÁDNÉ SLUŽBY<br>NEPRODÁNY</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr služby a přechod na krok 5
function selectPrislusenstviSluzba(typ) {
    if (typ !== 'zadne') {
        selectedItems.sluzby = [typ];
    } else {
        selectedItems.sluzby = [];
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderPrislusenstviStep5();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Příslušenství scénář - krok 5 (hadřík)
function renderPrislusenstviStep5() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderPrislusenstviStep4();">← Zpět na služby</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            🔌 PŘÍSLUŠENSTVÍ - Krok 5/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Služby: ${selectedItems.sluzby.length} položek
            </div>
        </div>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🧽 HADŘÍK NA ČIŠTĚNÍ:
            </h4>
            
            <div class="radio-group">
                <div class="radio-item" onclick="selectPrislusenstviHadrik(true, this)">
                    <input type="radio" id="hadrik-ano" name="hadrik" value="ano">
                    <label for="hadrik-ano">ANO</label>
                </div>
                <div class="radio-item" onclick="selectPrislusenstviHadrik(false, this)">
                    <input type="radio" id="hadrik-ne" name="hadrik" value="ne">
                    <label for="hadrik-ne">NE</label>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 2rem;">
                <button class="sales-btn" onclick="proceedToPrislusenstviSlevaFinal()">
                    ➡️ POKRAČOVAT NA SLEVU
                </button>
            </div>
        </div>
    `;
}

// Výběr hadříku
function selectPrislusenstviHadrik(selected, element) {
    selectedItems.hadrik = selected;
    
    document.querySelectorAll('.radio-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    
    const radio = element.querySelector('input[type="radio"]');
    radio.checked = true;
}

// Pokračování na finální slevu
function proceedToPrislusenstviSlevaFinal() {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderPrislusenstviSlevaFinal();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Finální výběr slevy
function renderPrislusenstviSlevaFinal() {
    // Sestavuj všechny prodané položky
    const allSoldItems = [];
    allSoldItems.push(`Původní položka: ${selectedItems.typPrislusenstvi}`);
    if (selectedItems.obaly.length > 0) allSoldItems.push(selectedItems.obaly[0] + ' obal');
    if (selectedItems.sklicka.length > 0) allSoldItems.push(selectedItems.sklicka[0] + (selectedItems.sklicka[0] === 'sunshine' ? ' folie' : ' sklíčko'));
    if (selectedItems.prislusenstvi.length > 0) allSoldItems.push(selectedItems.prislusenstvi[0]);
    if (selectedItems.sluzby.length > 0) allSoldItems.push(...selectedItems.sluzby);
    if (selectedItems.hadrik) allSoldItems.push('hadřík na čištění');
    
    selectedItems.allItems = allSoldItems;
    
    const nothingSold = allSoldItems.length <= 1; // Pouze původní položka
    
    if (nothingSold) {
        return renderPrislusenstviNotSoldFormFinal();
    }
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderPrislusenstviStep5();">← Zpět na hadřík</button>
        
        <h3 style="text-align: center; color: #2ed573; margin-bottom: 1rem;">
            🔌 PŘÍSLUŠENSTVÍ - Sleva a dokončení
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="background: rgba(46, 213, 115, 0.1); border: 1px solid rgba(46, 213, 115, 0.3); border-radius: 8px; padding: 1rem; color: var(--text-primary);">
                <h4 style="margin: 0 0 0.5rem 0; color: #2ed573;">✅ Celkově prodáno:</h4>
                <div style="font-size: 0.9rem;">
                    ${allSoldItems.map(item => `• ${item}`).join('<br>')}
                </div>
            </div>
        </div>
        
        <div class="sales-content">
            <h4 style="color: var(--text-primary); margin: 1rem 0; text-align: center;">
                Jaká sleva byla použita?
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectPrislusenstviSleva('2+1', this)">
                    <span class="scenario-emoji">🎁</span>
                    <h4 class="scenario-title">2+1</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviSleva('3+1', this)">
                    <span class="scenario-emoji">🎁</span>
                    <h4 class="scenario-title">3+1</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviSleva('20%', this)">
                    <span class="scenario-emoji">💰</span>
                    <h4 class="scenario-title">20%</h4>
                </div>
                <div class="scenario-tile" onclick="selectPrislusenstviSleva('zadna', this)" style="border-color: #6c757d; background: linear-gradient(135deg, rgba(108, 117, 125, 0.1) 0%, rgba(108, 117, 125, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #6c757d;">❌</span>
                    <h4 class="scenario-title" style="color: #6c757d;">ŽÁDNÁ<br>SLEVA</h4>
                </div>
            </div>
            
            <div id="sleva-pokracovat" style="text-align: center; margin-top: 2rem; display: none;">
                <button class="sales-btn success" onclick="completePrislusenstviSaleFinal()">
                    🎉 DOKONČIT PRODEJ
                </button>
            </div>
        </div>
    `;
}

// Výběr slevy pro příslušenství
function selectPrislusenstviSleva(sleva, element) {
    selectedItems.sleva = sleva;
    
    document.querySelectorAll('.scenario-tile').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    
    // Zobraz tlačítko pokračovat
    document.getElementById('sleva-pokracovat').style.display = 'block';
}

// Formulář pro neprodáno při příslušenství
function renderPrislusenstviNotSoldForm() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderPrislusenstviProductSelection();">← Zpět na produkty</button>
        
        <h3 style="text-align: center; color: #ff4757; margin-bottom: 1rem;">
            🔌 PŘÍSLUŠENSTVÍ - Neprodáno
        </h3>
        
        <div class="sales-content">
            <div style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: #ff4757; text-align: center;">❌ Proč se nic dalšího neprodalo?</h4>
                <textarea id="prislusenstviNotSoldReason" placeholder="Krátké odůvodnění proč se nic dalšího neprodalo..." 
                    style="width: 100%; min-height: 80px; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.2); 
                    border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--text-primary); 
                    font-size: 0.9rem; resize: vertical; font-family: inherit;"></textarea>
            </div>
            
            <button class="sales-result-btn sales-not-sold-btn" onclick="completePrislusenstviNotSold()" style="width: 100%;">
                📝 Odeslat a dokončit
            </button>
        </div>
    `;
}

// Dokončení úspěšného prodeje příslušenství
async function completePrislusenstviSale() {
    if (!selectedItems.sleva) {
        alert('Prosím vyberte slevu.');
        return;
    }
    
    // Spočítej čas session
    const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    
    // Přidat data do session
    currentSalesSession.result = 'sold';
    currentSalesSession.soldItems = selectedItems.allItems;
    currentSalesSession.discountUsed = selectedItems.sleva;
    currentSalesSession.zakaznickaKarticka = selectedItems.zakaznickaKarticka;
    currentSalesSession.založitKarticku = selectedItems.založitKarticku;
    currentSalesSession.prislusenstviData = selectedItems;
    currentSalesSession.completedAt = Date.now();
    currentSalesSession.sessionDuration = sessionDuration;
    currentSalesSession.sessionDurationMinutes = Math.round(sessionDuration / 60000 * 100) / 100;
    
    // Uložit na server
    const saved = await saveSalesSession(currentSalesSession);
    
    if (saved) {
        showSuccessMessage('Prodej příslušenství byl úspěšně zaznamenán! 🎉');
        setTimeout(function() {
            closeSalesAssistant();
            location.reload();
        }, 2000);
    } else {
        alert('Chyba při ukládání dat. Zkuste to prosím znovu.');
    }
}

// Dokončení neprodání při příslušenství
async function completePrislusenstviNotSold() {
    const reason = document.getElementById('prislusenstviNotSoldReason').value.trim();
    
    if (!reason) {
        alert('Prosím uveďte alespoň krátké odůvodnění.');
        return;
    }
    
    const sessionData = {
        ...currentSalesSession,
        result: 'sold', // Původní položka byla prodána
        reason: reason,
        soldItems: [`Pouze: ${selectedItems.typPrislusenstvi}`],
        zakaznickaKarticka: selectedItems.zakaznickaKarticka,
        založitKarticku: selectedItems.založitKarticku,
        noUpsellReason: reason,
        completed_at: Date.now(),
        duration: sessionStartTime ? Date.now() - sessionStartTime : 0
    };
    
    try {
        await saveSalesSession(sessionData);
        showSuccessMessage('Příslušenství prodáno, nedoprodáno zaznamenáno!');
        setTimeout(function() {
            closeSalesAssistant();
            location.reload();
        }, 2000);
    } catch (error) {
        console.error('Chyba při ukládání neprodáno:', error);
        alert('Chyba při ukládání dat. Zkuste to znovu.');
    }
}

// Finální dokončovací funkce
function completePrislusenstviSaleFinal() {
    return completePrislusenstviSale();
}

// Finální formulář pro neprodáno
function renderPrislusenstviNotSoldFormFinal() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderPrislusenstviStep5();">← Zpět na hadřík</button>
        
        <h3 style="text-align: center; color: #ff4757; margin-bottom: 1rem;">
            🔌 PŘÍSLUŠENSTVÍ - Neprodáno
        </h3>
        
        <div class="sales-content">
            <div style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: #ff4757; text-align: center;">❌ Proč se nic dalšího neprodalo?</h4>
                <textarea id="prislusenstviNotSoldReason" placeholder="Krátké odůvodnění proč se nic dalšího neprodalo..." 
                    style="width: 100%; min-height: 80px; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.2); 
                    border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--text-primary); 
                    font-size: 0.9rem; resize: vertical; font-family: inherit;"></textarea>
            </div>
            
            <button class="sales-result-btn sales-not-sold-btn" onclick="completePrislusenstviNotSoldFinal()" style="width: 100%;">
                📝 Odeslat a dokončit
            </button>
        </div>
    `;
}

// Dokončení neprodání při příslušenství - finální
function completePrislusenstviNotSoldFinal() {
    return completePrislusenstviNotSold();
}

// === NOVÝ TELEFON SCÉNÁŘ ===

// Nový telefon scénář - krok 0 (tipy pro získání informací)
function renderNovyTelefonScenario() {
    currentWizardStep = 0;
    selectedItems = { 
        typTelefonu: '', 
        soucasnyTelefon: '', 
        rozpocet: '', 
        vyuziti: '',
        telefon: '',
        staryTelefon: '',
        obaly: [], 
        sklicka: [], 
        prislusenstvi: [],
        sluzby: [],
        zakaznickaKarticka: null,
        založitKarticku: null
    };
    
    return `
        <button class="scenario-back-btn" onclick="goBackToScenarios()">← Zpět na výběr</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📱 NOVÝ TELEFON - Tipy pro prodej
        </h3>
        
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                💡 "Nejdřív získej informace, pak nabídni ideální řešení!"
            </div>
        </div>
        
        <div class="sales-content">
            <div class="sales-tips-container">
                <div class="sales-tip">
                    <h4>❓ NEJDŘÍV SE ZEPTEJ:</h4>
                    <p>"Vybereme nový nebo bazarový telefon? Co máte teď za telefon? Kolik byste chtěl investovat? Co na telefonu budete dělat?"</p>
                </div>
            </div>
            
            <div class="sales-result-buttons">
                <button class="sales-result-btn sales-sold-btn" onclick="proceedToNovyTelefonStep1()">
                    ✅ Získal jsem informace
                </button>
                <button class="sales-result-btn sales-not-sold-btn" onclick="handleNovyTelefonNotSold()">
                    ❌ Zákazník neměl zájem
                </button>
            </div>
        </div>
    `;
}

// Pokračování na krok 1 po získání informací
function proceedToNovyTelefonStep1() {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderZakaznickaKarticka('novy-telefon');
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Pokračování z zákaznické kartičky pro nový telefon
function proceedFromZakaznickaKartickaNovyTelefon() {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderNovyTelefonStep1();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Zpracování nezájmu zákazníka
function handleNovyTelefonNotSold() {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderNovyTelefonNotSoldForm();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Nový telefon scénář - krok 1 (typ telefonu a základní info)
function renderNovyTelefonStep1() {
    currentWizardStep = 1;
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderNovyTelefonScenario();">← Zpět na tipy</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📱 NOVÝ TELEFON - Krok 1/5
        </h3>
        
        <div class="sales-content">
            <div class="sales-tip" style="margin-bottom: 1.5rem;">
                <h4>📱 NABÍDNI TELEFON TÍMTO STYLEM:</h4>
                <p>"Na základě toho co jste říkal, tak tento telefon pro vás bude ideální, můžete na něm [doplň využití] a vychází cca na [rozpočet +-]. V ceně máte telefon, příslušenství i služby."</p>
            </div>
            
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                📱 Jaký typ telefonu zákazník chce?
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectNovyTelefonTyp('novy')">
                    <span class="scenario-emoji">✨</span>
                    <h4 class="scenario-title">NOVÝ<br>TELEFON</h4>
                </div>
                <div class="scenario-tile" onclick="selectNovyTelefonTyp('bazarovy')">
                    <span class="scenario-emoji">♻️</span>
                    <h4 class="scenario-title">BAZAROVÝ<br>TELEFON</h4>
                </div>
                <div class="scenario-tile" onclick="selectNovyTelefonTyp('nerozhoduje')" style="border-color: #ff9500; background: linear-gradient(135deg, rgba(255, 149, 0, 0.1) 0%, rgba(255, 149, 0, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff9500;">🤔</span>
                    <h4 class="scenario-title" style="color: #ff9500;">NEVÍ / PORADÍM<br>MU</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr typu telefonu a přechod na krok 2
function selectNovyTelefonTyp(typ) {
    selectedItems.typTelefonu = typ;
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderNovyTelefonStep2();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Nový telefon scénář - krok 2 (nabídka telefonu + starý telefon)
function renderNovyTelefonStep2() {
    currentWizardStep = 2;
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderNovyTelefonStep1();">← Zpět na typ telefonu</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📱 NOVÝ TELEFON - Krok 2/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Typ: ${selectedItems.typTelefonu}
            </div>
        </div>
        
        <div class="sales-content">
            <div class="sales-tips-container" style="margin-bottom: 1.5rem;">
                <div class="sales-tip">
                    <h4>💰 STARÝ TELEFON - POKUD HO NECHCE:</h4>
                    <p>"Co budete dělat se starým telefonem? Můžeme ho od vás rovnou vykoupit a díky tomu budete mít nový telefon levnější!"</p>
                </div>
                
                <div class="sales-tip">
                    <h4>✨ STARÝ TELEFON - POKUD HO CHCE NECHAT:</h4>
                    <p>"Tak vám ten starý telefon dám rovnou do gala a vyčistím vám ho a dáme na něj i obal a sklíčko ať ho předáte v dobrém stavu."</p>
                </div>
            </div>
            
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                💰 Co se starým telefonem?
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectStaryTelefon('vykup')">
                    <span class="scenario-emoji">💰</span>
                    <h4 class="scenario-title">VÝKUP<br>STARÉHO</h4>
                </div>
                <div class="scenario-tile" onclick="selectStaryTelefon('vycisteni')">
                    <span class="scenario-emoji">✨</span>
                    <h4 class="scenario-title">VYČIŠTĚNÍ +<br>OCHRANA</h4>
                </div>
                <div class="scenario-tile" onclick="selectStaryTelefon('si-necha')" style="border-color: #6c757d; background: linear-gradient(135deg, rgba(108, 117, 125, 0.1) 0%, rgba(108, 117, 125, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #6c757d;">📱</span>
                    <h4 class="scenario-title" style="color: #6c757d;">SI NECHÁ<br>TAK JAK JE</h4>
                </div>
                <div class="scenario-tile" onclick="selectStaryTelefon('nema')" style="border-color: #17a2b8; background: linear-gradient(135deg, rgba(23, 162, 184, 0.1) 0%, rgba(23, 162, 184, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #17a2b8;">🆕</span>
                    <h4 class="scenario-title" style="color: #17a2b8;">NEMÁ STARÝ<br>TELEFON</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr řešení starého telefonu a přechod na krok 3
function selectStaryTelefon(reseni) {
    selectedItems.staryTelefon = reseni;
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderNovyTelefonStep3();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Nový telefon scénář - krok 3 (příslušenství - stejné jako u zásilkovny)
function renderNovyTelefonStep3() {
    currentWizardStep = 3;
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderNovyTelefonStep2();">← Zpět na starý telefon</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📱 NOVÝ TELEFON - Krok 3/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Typ: ${selectedItems.typTelefonu} | Starý telefon: ${selectedItems.staryTelefon}
            </div>
        </div>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                📱 OBALY - Vyberte typ obalu:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectNovyTelefonObal('transparentni')">
                    <span class="scenario-emoji">🔹</span>
                    <h4 class="scenario-title">TRANSPARENTNÍ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectNovyTelefonObal('barevny')">
                    <span class="scenario-emoji">🌈</span>
                    <h4 class="scenario-title">BAREVNÝ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectNovyTelefonObal('knizkovy')">
                    <span class="scenario-emoji">📖</span>
                    <h4 class="scenario-title">KNÍŽKOVÝ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectNovyTelefonObal('zadny')" style="border-color: #ff4757; background: linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff4757;">❌</span>
                    <h4 class="scenario-title" style="color: #ff4757;">ŽÁDNÝ OBAL<br>NEPRODÁN</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr obalu pro nový telefon a přechod na sklíčka
function selectNovyTelefonObal(typ) {
    if (typ !== 'zadny') {
        selectedItems.obaly = [typ];
    } else {
        selectedItems.obaly = [];
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderNovyTelefonStep3Sklicka();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Podkrok 3 - sklíčka
function renderNovyTelefonStep3Sklicka() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderNovyTelefonStep3();">← Zpět na obaly</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📱 NOVÝ TELEFON - Krok 3/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Obal: ${selectedItems.obaly.length > 0 ? selectedItems.obaly[0] : 'žádný'}
            </div>
        </div>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🔍 SKLÍČKA - Vyberte typ sklíčka:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectNovyTelefonSklicko('kvalitnejsi')">
                    <span class="scenario-emoji">💎</span>
                    <h4 class="scenario-title">KVALITNĚJŠÍ<br>SKLÍČKO</h4>
                </div>
                <div class="scenario-tile" onclick="selectNovyTelefonSklicko('levnejsi')">
                    <span class="scenario-emoji">💰</span>
                    <h4 class="scenario-title">LEVNĚJŠÍ<br>SKLÍČKO</h4>
                </div>
                <div class="scenario-tile" onclick="selectNovyTelefonSklicko('zadne')" style="border-color: #ff4757; background: linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff4757;">❌</span>
                    <h4 class="scenario-title" style="color: #ff4757;">ŽÁDNÉ SKLÍČKO<br>NEPRODÁNO</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr sklíčka a přechod na ostatní příslušenství
function selectNovyTelefonSklicko(typ) {
    if (typ !== 'zadne') {
        selectedItems.sklicka = [typ];
    } else {
        selectedItems.sklicka = [];
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderNovyTelefonStep3Prislusenstvi();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Podkrok 3 - ostatní příslušenství
function renderNovyTelefonStep3Prislusenstvi() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderNovyTelefonStep3Sklicka();">← Zpět na sklíčka</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📱 NOVÝ TELEFON - Krok 3/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Obal: ${selectedItems.obaly.length > 0 ? selectedItems.obaly[0] : 'žádný'} | 
                Sklíčko: ${selectedItems.sklicka.length > 0 ? selectedItems.sklicka[0] : 'žádné'}
            </div>
        </div>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🔌 OSTATNÍ PŘÍSLUŠENSTVÍ - Vyberte co se prodalo:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectNovyTelefonPrislusenstvi('kabel')">
                    <span class="scenario-emoji">🔌</span>
                    <h4 class="scenario-title">KABEL</h4>
                </div>
                <div class="scenario-tile" onclick="selectNovyTelefonPrislusenstvi('nabijeka')">
                    <span class="scenario-emoji">🔋</span>
                    <h4 class="scenario-title">NABÍJEČKA</h4>
                </div>
                <div class="scenario-tile" onclick="selectNovyTelefonPrislusenstvi('drzak')">
                    <span class="scenario-emoji">🚗</span>
                    <h4 class="scenario-title">DRŽÁK<br>DO AUTA</h4>
                </div>
                <div class="scenario-tile" onclick="selectNovyTelefonPrislusenstvi('ostatni')">
                    <span class="scenario-emoji">📦</span>
                    <h4 class="scenario-title">OSTATNÍ</h4>
                </div>
                <div class="scenario-tile" onclick="selectNovyTelefonPrislusenstvi('zadne')" style="border-color: #ff4757; background: linear-gradient(135deg, rgba(255, 71, 87, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);">
                    <span class="scenario-emoji" style="color: #ff4757;">❌</span>
                    <h4 class="scenario-title" style="color: #ff4757;">ŽÁDNÉ PŘÍSLUŠENSTVÍ<br>NEPRODÁNO</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr příslušenství a přechod na krok 4 (služby)
function selectNovyTelefonPrislusenstvi(typ) {
    if (typ !== 'zadne') {
        selectedItems.prislusenstvi = [typ];
    } else {
        selectedItems.prislusenstvi = [];
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderNovyTelefonStep4();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Nový telefon scénář - krok 4 (služby)
function renderNovyTelefonStep4() {
    currentWizardStep = 4;
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderNovyTelefonStep3Prislusenstvi();">← Zpět na příslušenství</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📱 NOVÝ TELEFON - Krok 4/5
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Příslušenství: ${selectedItems.obaly.length + selectedItems.sklicka.length + selectedItems.prislusenstvi.length} položek
            </div>
        </div>
        
        <div class="sales-content">
            <div class="sales-tip" style="margin-bottom: 1.5rem;">
                <h4>🛠️ PRODEJNÍ TIP - SLUŽBY:</h4>
                <p>"Nový telefon si zaslouží perfektní nastavení! Nabídnu vám služby které vám ušetří čas a starosti. Najeďte myší na službu pro detaily."</p>
            </div>
            
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🛠️ SLUŽBY - Vyberte prodané služby:
            </h4>
            
            <div class="checkbox-grid">
                <div class="checkbox-item service-tooltip" data-checkbox="kopirovani-dat">
                    <span class="item-icon">📲</span>
                    <input type="checkbox" id="kopirovani-dat" name="sluzby">
                    <label for="kopirovani-dat">KOPÍROVÁNÍ<br>DAT</label>
                    <span class="tooltip-text">"Ušetřím vám hodiny práce! Všechny kontakty, fotky a aplikace přenesu do nového telefonu."</span>
                </div>
                <div class="checkbox-item service-tooltip" data-checkbox="prodlouzena-zaruka">
                    <span class="item-icon">🛡️</span>
                    <input type="checkbox" id="prodlouzena-zaruka" name="sluzby">
                    <label for="prodlouzena-zaruka">PRODLOUŽENÁ<br>ZÁRUKA</label>
                    <span class="tooltip-text">"Klid na další roky! Pokud se cokoliv pokazí, máte krytou opravu i náhradu."</span>
                </div>
                <div class="checkbox-item service-tooltip" data-checkbox="nastaveni-telefonu">
                    <span class="item-icon">⚙️</span>
                    <input type="checkbox" id="nastaveni-telefonu" name="sluzby">
                    <label for="nastaveni-telefonu">NASTAVENÍ<br>TELEFONU</label>
                    <span class="tooltip-text">"Telefon připravím přesně podle vašich potřeb - email, aplikace, všechno nastaveno."</span>
                </div>
                <div class="checkbox-item service-tooltip" data-checkbox="aktualizace-sw">
                    <span class="item-icon">🔄</span>
                    <input type="checkbox" id="aktualizace-sw" name="sluzby">
                    <label for="aktualizace-sw">AKTUALIZACE<br>SOFTWARE</label>
                    <span class="tooltip-text">"Telefon bude mít nejnovější funkce a bezpečnostní aktualizace hned od začátku."</span>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 2rem;">
                <button class="sales-btn" onclick="proceedToNovyTelefonFinal()">
                    ➡️ POKRAČOVAT NA DOKONČENÍ
                </button>
            </div>
        </div>
    `;
}

// Pokračování na finální krok
function proceedToNovyTelefonFinal() {
    // Uložení vybraných služeb
    const selectedSluzby = [];
    document.querySelectorAll('input[name="sluzby"]:checked').forEach(item => {
        const label = document.querySelector(`label[for="${item.id}"]`);
        const itemName = label ? label.textContent.replace(/\s+/g, ' ').trim() : item.id;
        selectedSluzby.push(itemName);
    });
    selectedItems.sluzby = selectedSluzby;
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderNovyTelefonStep5();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Nový telefon scénář - krok 5 (finální dokončení)
function renderNovyTelefonStep5() {
    currentWizardStep = 5;
    
    // Spočítej všechno co se prodalo
    const allItems = [];
    allItems.push(`${selectedItems.typTelefonu} telefon`);
    if (selectedItems.staryTelefon !== 'si-necha' && selectedItems.staryTelefon !== 'nema') {
        allItems.push(`řešení starého telefonu: ${selectedItems.staryTelefon}`);
    }
    if (selectedItems.obaly.length > 0) allItems.push(selectedItems.obaly[0] + ' obal');
    if (selectedItems.sklicka.length > 0) allItems.push(selectedItems.sklicka[0] + ' sklíčko');
    if (selectedItems.prislusenstvi.length > 0) allItems.push(selectedItems.prislusenstvi[0]);
    allItems.push(...selectedItems.sluzby);
    
    // Kontrola jestli je jen telefon (a možná řešení starého telefonu)
    const onlyPhoneSold = allItems.length <= 2 && 
                          !selectedItems.obaly.length && 
                          !selectedItems.sklicka.length && 
                          !selectedItems.prislusenstvi.length && 
                          !selectedItems.sluzby.length;
    
    if (onlyPhoneSold) {
        return renderNovyTelefonOnlyPhoneForm();
    }
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderNovyTelefonStep4();">← Zpět na služby</button>
        
        <h3 style="text-align: center; color: #2ed573; margin-bottom: 1rem;">
            📱 NOVÝ TELEFON - Dokončení
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="background: rgba(46, 213, 115, 0.1); border: 1px solid rgba(46, 213, 115, 0.3); border-radius: 8px; padding: 1rem; color: var(--text-primary);">
                <h4 style="margin: 0 0 0.5rem 0; color: #2ed573;">✅ Celkově prodáno:</h4>
                <div style="font-size: 0.9rem; line-height: 1.4;">
                    ${allItems.map(item => `• ${item}`).join('<br>')}
                </div>
            </div>
        </div>
        
        <div class="sales-actions">
            <button class="sales-btn success" onclick="completeNovyTelefonSale()">
                🎉 DOKONČIT PRODEJ
            </button>
        </div>
    `;
}

// Formulář pro pouze telefon (bez příslušenství)
function renderNovyTelefonOnlyPhoneForm() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderNovyTelefonStep4();">← Zpět na služby</button>
        
        <h3 style="text-align: center; color: #2ed573; margin-bottom: 1rem;">
            📱 NOVÝ TELEFON PRODÁN - Super! 🎉
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="background: rgba(46, 213, 115, 0.1); border: 1px solid rgba(46, 213, 115, 0.3); border-radius: 8px; padding: 1rem; color: var(--text-primary);">
                <h4 style="margin: 0 0 0.5rem 0; color: #2ed573;">✅ Telefon byl úspěšně prodán!</h4>
                <div style="font-size: 0.9rem;">
                    ${selectedItems.typTelefonu} telefon
                    ${selectedItems.staryTelefon !== 'si-necha' && selectedItems.staryTelefon !== 'nema' ? 
                      `<br>+ řešení starého telefonu: ${selectedItems.staryTelefon}` : ''}
                </div>
            </div>
        </div>
        
        <div class="sales-content">
            <div style="background: rgba(255, 149, 0, 0.1); border: 1px solid rgba(255, 149, 0, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: #ff9500; text-align: center;">❌ Proč se něco dalšího nedoprodalo?</h4>
                <textarea id="novyTelefonOnlyPhoneReason" placeholder="Důvod proč se neprodalo příslušenství ani služby k telefonu..." 
                    style="width: 100%; min-height: 80px; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.2); 
                    border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--text-primary); 
                    font-size: 0.9rem; resize: vertical; font-family: inherit;"></textarea>
            </div>
            
            <button class="sales-result-btn" onclick="completeNovyTelefonOnlyPhone()" style="width: 100%; background: linear-gradient(135deg, #2ed573, #20bf6b);">
                📝 Odeslat a dokončit
            </button>
        </div>
    `;
}

// Formulář pro neprodáno při nezájmu
function renderNovyTelefonNotSoldForm() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderNovyTelefonScenario();">← Zpět na tipy</button>
        
        <h3 style="text-align: center; color: #ff4757; margin-bottom: 1rem;">
            📱 NOVÝ TELEFON - Neprodáno
        </h3>
        
        <div class="sales-content">
            <div style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: #ff4757; text-align: center;">❌ Proč se neprodalo?</h4>
                <textarea id="novyTelefonNotSoldReason" placeholder="Krátké odůvodnění proč se telefon neprodal..." 
                    style="width: 100%; min-height: 80px; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.2); 
                    border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--text-primary); 
                    font-size: 0.9rem; resize: vertical; font-family: inherit;"></textarea>
            </div>
            
            <button class="sales-result-btn sales-not-sold-btn" onclick="completeNovyTelefonNotSild()" style="width: 100%;">
                📝 Odeslat a dokončit
            </button>
        </div>
    `;
}

// Formulář pro finální neprodáno
function renderNovyTelefonNotSoldFinalForm() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderNovyTelefonStep4();">← Zpět na služby</button>
        
        <h3 style="text-align: center; color: #ff4757; margin-bottom: 1rem;">
            📱 NOVÝ TELEFON - Neprodáno
        </h3>
        
        <div class="sales-content">
            <div style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: #ff4757; text-align: center;">❌ Proč se neprodalo?</h4>
                <textarea id="novyTelefonFinalNotSoldReason" placeholder="Krátké odůvodnění proč se nakonec nic neprodalo..." 
                    style="width: 100%; min-height: 80px; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.2); 
                    border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--text-primary); 
                    font-size: 0.9rem; resize: vertical; font-family: inherit;"></textarea>
            </div>
            
            <button class="sales-result-btn sales-not-sold-btn" onclick="completeNovyTelefonFinalNotSold()" style="width: 100%;">
                📝 Odeslat a dokončit
            </button>
        </div>
    `;
}

// Dokončení úspěšného prodeje nového telefonu
async function completeNovyTelefonSale() {
    // Sestavuj všechny prodané položky
    const allSoldItems = [];
    allSoldItems.push(`${selectedItems.typTelefonu} telefon`);
    
    if (selectedItems.staryTelefon !== 'si-necha' && selectedItems.staryTelefon !== 'nema') {
        allSoldItems.push(`řešení starého telefonu: ${selectedItems.staryTelefon}`);
    }
    if (selectedItems.obaly.length > 0) allSoldItems.push(selectedItems.obaly[0] + ' obal');
    if (selectedItems.sklicka.length > 0) allSoldItems.push(selectedItems.sklicka[0] + ' sklíčko');
    if (selectedItems.prislusenstvi.length > 0) allSoldItems.push(selectedItems.prislusenstvi[0]);
    allSoldItems.push(...selectedItems.sluzby);
    
    // Spočítej čas session
    const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    
    // Přidat data do session
    currentSalesSession.result = 'sold';
    currentSalesSession.soldItems = allSoldItems;
    currentSalesSession.novyTelefonData = selectedItems; // Specifická data pro analýzu
    currentSalesSession.completedAt = Date.now();
    currentSalesSession.sessionDuration = sessionDuration;
    currentSalesSession.sessionDurationMinutes = Math.round(sessionDuration / 60000 * 100) / 100;
    
    // Uložit na server
    const saved = await saveSalesSession(currentSalesSession);
    
    if (saved) {
        showSuccessMessage('Prodej telefonu byl úspěšně zaznamenán! 🎉');
        setTimeout(function() {
            closeSalesAssistant();
            location.reload();
        }, 2000);
    } else {
        alert('Chyba při ukládání dat. Zkuste to prosím znovu.');
    }
}

// Dokončení pouze telefon (bez příslušenství)
async function completeNovyTelefonOnlyPhone() {
    const reason = document.getElementById('novyTelefonOnlyPhoneReason').value.trim();
    
    if (!reason) {
        alert('Prosím uveďte důvod proč se neprodalo příslušenství ani služby.');
        return;
    }
    
    // Sestavuj prodané položky
    const soldItems = [];
    soldItems.push(`${selectedItems.typTelefonu} telefon`);
    if (selectedItems.staryTelefon !== 'si-necha' && selectedItems.staryTelefon !== 'nema') {
        soldItems.push(`řešení starého telefonu: ${selectedItems.staryTelefon}`);
    }
    
    // Spočítej čas session
    const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    
    // Přidat data do session
    currentSalesSession.result = 'sold'; // Počítá se jako prodáno!
    currentSalesSession.soldItems = soldItems;
    currentSalesSession.phoneOnlyWithReason = true; // Speciální flag pro analytiku
    currentSalesSession.noDoprodejReason = reason; // Důvod proč se nedoprodalo
    currentSalesSession.novyTelefonData = selectedItems;
    currentSalesSession.completedAt = Date.now();
    currentSalesSession.sessionDuration = sessionDuration;
    currentSalesSession.sessionDurationMinutes = Math.round(sessionDuration / 60000 * 100) / 100;
    
    // Uložit na server
    const saved = await saveSalesSession(currentSalesSession);
    
    if (saved) {
        showSuccessMessage('Telefon prodán, nedoprodáno zaznamenáno! 📱');
        setTimeout(function() {
            closeSalesAssistant();
            location.reload();
        }, 2000);
    } else {
        alert('Chyba při ukládání dat. Zkuste to prosím znovu.');
    }
}

// Dokončení neprodání při nezájmu
async function completeNovyTelefonNotSild() {
    const reason = document.getElementById('novyTelefonNotSoldReason').value.trim();
    
    if (!reason) {
        alert('Prosím uveďte alespoň krátké odůvodnění.');
        return;
    }
    
    const sessionData = {
        ...currentSalesSession,
        result: 'not-sold',
        reason: reason,
        items: [],
        revenue: 0,
        completed_at: Date.now(),
        duration: sessionStartTime ? Date.now() - sessionStartTime : 0
    };
    
    try {
        await saveSalesSession(sessionData);
        showSuccessMessage('Neprodáno úspěšně zaznamenáno!');
        closeSalesAssistant();
    } catch (error) {
        console.error('Chyba při ukládání neprodáno:', error);
        alert('Chyba při ukládání dat. Zkuste to znovu.');
    }
}

// Dokončení finálního neprodání
async function completeNovyTelefonFinalNotSold() {
    const reason = document.getElementById('novyTelefonFinalNotSoldReason').value.trim();
    
    if (!reason) {
        alert('Prosím uveďte alespoň krátké odůvodnění.');
        return;
    }
    
    const sessionData = {
        ...currentSalesSession,
        result: 'not-sold',
        reason: reason,
        items: [],
        revenue: 0,
        completed_at: Date.now(),
        duration: sessionStartTime ? Date.now() - sessionStartTime : 0
    };
    
    try {
        await saveSalesSession(sessionData);
        showSuccessMessage('Neprodáno úspěšně zaznamenáno!');
        closeSalesAssistant();
    } catch (error) {
        console.error('Chyba při ukládání neprodáno:', error);
        alert('Chyba při ukládání dat. Zkuste to znovu.');
    }
}


// === SERVIS TELEFONU SCÉNÁŘ ===

// Servis telefonu scénář - krok 0 (výběr typu servisu)
function renderServisScenario() {
    currentWizardStep = 0;
    selectedItems = { 
        typServisu: '',
        obaly: [],
        sklicka: [],
        prislusenstvi: [],
        sluzby: [],
        novyTelefon: false,
        zakaznickaKarticka: null,
        založitKarticku: null
    };
    
    return `
        <button class="scenario-back-btn" onclick="goBackToScenarios()">← Zpět na výběr</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            🔧 SERVIS TELEFONU
        </h3>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🔧 S ČÍM ZÁKAZNÍK PŘIŠEL?
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectServisTyp('displej')">
                    <span class="scenario-emoji">📱</span>
                    <h4 class="scenario-title">DISPLEJ</h4>
                </div>
                <div class="scenario-tile" onclick="selectServisTyp('baterie')">
                    <span class="scenario-emoji">🔋</span>
                    <h4 class="scenario-title">BATERIE</h4>
                </div>
                <div class="scenario-tile" onclick="selectServisTyp('nenabiji')">
                    <span class="scenario-emoji">⚡</span>
                    <h4 class="scenario-title">NENABÍJÍ</h4>
                </div>
                <div class="scenario-tile" onclick="selectServisTyp('zadni-kryt')">
                    <span class="scenario-emoji">📲</span>
                    <h4 class="scenario-title">ZADNÍ KRYT</h4>
                </div>
                <div class="scenario-tile" onclick="selectServisTyp('jine')">
                    <span class="scenario-emoji">🔧</span>
                    <h4 class="scenario-title">JINÉ</h4>
                </div>
            </div>
        </div>
    `;
}

// Výběr typu servisu
function selectServisTyp(typ) {
    selectedItems.typServisu = typ;
    
    // Otevři odkaz na servis v nové záložce
    window.open('https://servismajak.cz/zarizeni/mobilni-telefony', '_blank');
    
    // Přejdi na zákaznickou kartičku
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderZakaznickaKarticka('servis');
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Pokračování z zákaznické kartičky pro servis
function proceedFromZakaznickaKartickaServis() {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = renderServisStep2();
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}




// Servis scénář - krok 2 (co se prodalo)
function renderServisStep2() {
    currentWizardStep = 2;
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderServisScenario();">← Zpět na typ servisu</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            🔧 SERVIS TELEFONU - Krok 2/2
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                ✅ Typ servisu: ${selectedItems.typServisu}
            </div>
        </div>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                🛍️ CO JSI PRODAL/ DOPRODAL? - Vyberte kategorie:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectServisKategorie('obal')">
                    <span class="scenario-emoji">📱</span>
                    <h4 class="scenario-title">OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectServisKategorie('sklo')">
                    <span class="scenario-emoji">🔍</span>
                    <h4 class="scenario-title">SKLO</h4>
                </div>
                <div class="scenario-tile" onclick="selectServisKategorie('prislusenstvi')">
                    <span class="scenario-emoji">🔌</span>
                    <h4 class="scenario-title">PŘÍSLUŠENSTVÍ</h4>
                </div>
                <div class="scenario-tile" onclick="selectServisKategorie('sluzba')">
                    <span class="scenario-emoji">🛠️</span>
                    <h4 class="scenario-title">SLUŽBA</h4>
                </div>
                <div class="scenario-tile" onclick="selectServisKategorie('novy-telefon')">
                    <span class="scenario-emoji">📱</span>
                    <h4 class="scenario-title">NOVÝ<br>TELEFON</h4>
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; flex-wrap: wrap;">
                <button class="sales-btn" onclick="renderServisFinal()">
                    ➡️ POKRAČOVAT NA DOKONČENÍ
                </button>
                <button class="sales-btn danger" onclick="renderServisZakaznikNechce()">
                    ❌ ZÁKAZNÍK NAKONEC NECHCE
                </button>
            </div>
        </div>
    `;
}

// Výběr kategorie pro servis
function selectServisKategorie(kategorie) {
    const tile = event.target.closest('.scenario-tile');
    
    if (tile.classList.contains('selected')) {
        // Odebrat výběr
        tile.classList.remove('selected');
        if (kategorie === 'novy-telefon') {
            selectedItems.novyTelefon = false;
        } else {
            const index = selectedItems[kategorie === 'sklo' ? 'sklicka' : (kategorie === 'sluzba' ? 'sluzby' : (kategorie + 'y'))].indexOf(kategorie);
            if (index > -1) {
                selectedItems[kategorie === 'sklo' ? 'sklicka' : (kategorie === 'sluzba' ? 'sluzby' : (kategorie + 'y'))].splice(index, 1);
            }
        }
    } else {
        // Přidat výběr
        tile.classList.add('selected');
        if (kategorie === 'obal') {
            selectedItems.obaly.push('obal');
        } else if (kategorie === 'sklo') {
            selectedItems.sklicka.push('sklo');
        } else if (kategorie === 'prislusenstvi') {
            selectedItems.prislusenstvi.push('příslušenství');
        } else if (kategorie === 'sluzba') {
            selectedItems.sluzby.push('služba');
        } else if (kategorie === 'novy-telefon') {
            selectedItems.novyTelefon = true;
        }
    }
}

// Servis scénář - finální dokončení
function renderServisFinal() {
    // Pokud je vybrán nový telefon, přejdi na flow nového telefonu
    if (selectedItems.novyTelefon) {
        // Nastav scénář na nový telefon a přejdi na jeho flow
        currentScenario = 'novy-telefon';
        const modalBody = document.getElementById('salesModalBody');
        modalBody.innerHTML = renderNovyTelefonScenario();
        return;
    }
    
    // Spočítej co se prodalo
    const soldItems = [];
    soldItems.push(...selectedItems.obaly);
    soldItems.push(...selectedItems.sklicka);
    soldItems.push(...selectedItems.prislusenstvi);
    soldItems.push(...selectedItems.sluzby);
    
    const nothingSold = soldItems.length === 0;
    
    if (nothingSold) {
        return renderServisNotSoldFinalForm();
    }
    
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderServisStep2();">← Zpět na výběr</button>
        
        <h3 style="text-align: center; color: #2ed573; margin-bottom: 1rem;">
            🔧 SERVIS TELEFONU - Dokončení
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="background: rgba(46, 213, 115, 0.1); border: 1px solid rgba(46, 213, 115, 0.3); border-radius: 8px; padding: 1rem; color: var(--text-primary);">
                <h4 style="margin: 0 0 0.5rem 0; color: #2ed573;">✅ Prodáno při servisu:</h4>
                <div style="font-size: 0.9rem; line-height: 1.4;">
                    • Servis: ${selectedItems.typServisu}<br>
                    ${soldItems.map(item => `• ${item}`).join('<br>')}
                </div>
            </div>
        </div>
        
        <div class="sales-actions">
            <button class="sales-btn success" onclick="completeServisSale()">
                🎉 DOKONČIT SERVIS
            </button>
        </div>
    `;
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Formulář pro "zákazník nakonec nechce"
function renderServisZakaznikNechce() {
    const modalBody = document.getElementById('salesModalBody');
    modalBody.innerHTML = `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderServisStep2();">← Zpět na výběr</button>
        
        <h3 style="text-align: center; color: #ff4757; margin-bottom: 1rem;">
            🔧 SERVIS TELEFONU - Zákazník nakonec nechce
        </h3>
        
        <div class="sales-content">
            <div style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: #ff4757; text-align: center;">❌ Proč zákazník nakonec nechce?</h4>
                <textarea id="servisZakaznikNechceReason" placeholder="Krátké odůvodnění proč zákazník nakonec nechce..." 
                    style="width: 100%; min-height: 80px; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.2); 
                    border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--text-primary); 
                    font-size: 0.9rem; resize: vertical; font-family: inherit;"></textarea>
            </div>
            
            <button class="sales-result-btn sales-not-sold-btn" onclick="completeServisZakaznikNechce()" style="width: 100%;">
                📝 Odeslat a dokončit
            </button>
        </div>
    `;
    
    // Smooth scroll to top
    setTimeout(function() {
        modalBody.scrollTop = 0;
        modalBody.classList.add('scroll-top');
        setTimeout(function() { modalBody.classList.remove('scroll-top'); }, 300);
    }, 50);
}

// Dokončení "zákazník nakonec nechce"
async function completeServisZakaznikNechce() {
    const reason = document.getElementById('servisZakaznikNechceReason').value.trim();
    
    if (!reason) {
        alert('Prosím uveďte alespoň krátké odůvodnění.');
        return;
    }
    
    const sessionData = {
        ...currentSalesSession,
        result: 'customer-changed-mind',
        reason: reason,
        items: [`Servis: ${selectedItems.typServisu}`],
        revenue: 0,
        completed_at: Date.now(),
        duration: sessionStartTime ? Date.now() - sessionStartTime : 0
    };
    
    try {
        await saveSalesSession(sessionData);
        showSuccessMessage('Zákazník si rozmyslel - zaznamenáno!');
        setTimeout(function() {
            closeSalesAssistant();
            location.reload();
        }, 2000);
    } catch (error) {
        console.error('Chyba při ukládání:', error);
        alert('Chyba při ukládání dat. Zkuste to znovu.');
    }
}

// Formulář pro neprodáno při servisu
function renderServisNotSoldFinalForm() {
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderServisStep2();">← Zpět na výběr</button>
        
        <h3 style="text-align: center; color: #ff9500; margin-bottom: 1rem;">
            🔧 SERVIS TELEFONU - Pouze servis
        </h3>
        
        <div class="sales-content">
            <div style="background: rgba(255, 149, 0, 0.1); border: 1px solid rgba(255, 149, 0, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: #ff9500; text-align: center;">⚠️ Pouze servis bez přidaného prodeje</h4>
                <textarea id="servisFinalNotSoldReason" placeholder="Poznámka o průběhu servisu..." 
                    style="width: 100%; min-height: 80px; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.2); 
                    border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--text-primary); 
                    font-size: 0.9rem; resize: vertical; font-family: inherit;"></textarea>
            </div>
            
            <button class="sales-result-btn" onclick="completeServisFinalNotSold()" style="width: 100%; background: linear-gradient(135deg, #ff9500, #ff7700);">
                📝 Dokončit pouze se servisem
            </button>
        </div>
    `;
}

// Dokončení úspěšného servisu
async function completeServisSale() {
    // Sestavuj všechny prodané položky
    const allSoldItems = [];
    allSoldItems.push(`Servis: ${selectedItems.typServisu}`);
    allSoldItems.push(...selectedItems.obaly);
    allSoldItems.push(...selectedItems.sklicka);
    allSoldItems.push(...selectedItems.prislusenstvi);
    allSoldItems.push(...selectedItems.sluzby);
    
    // Spočítej čas session
    const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    
    // Přidat data do session
    currentSalesSession.result = 'sold';
    currentSalesSession.soldItems = allSoldItems;
    currentSalesSession.servisData = selectedItems; // Specifická data pro analýzu
    currentSalesSession.completedAt = Date.now();
    currentSalesSession.sessionDuration = sessionDuration;
    currentSalesSession.sessionDurationMinutes = Math.round(sessionDuration / 60000 * 100) / 100;
    
    // Uložit na server
    const saved = await saveSalesSession(currentSalesSession);
    
    if (saved) {
        showSuccessMessage('Servis byl úspěšně zaznamenán! 🎉');
        setTimeout(function() {
            closeSalesAssistant();
            location.reload();
        }, 2000);
    } else {
        alert('Chyba při ukládání dat. Zkuste to prosím znovu.');
    }
}

// Dokončení finálního neprodání při servisu
async function completeServisFinalNotSold() {
    const reason = document.getElementById('servisFinalNotSoldReason').value.trim();
    
    const sessionData = {
        ...currentSalesSession,
        result: 'service-only',
        reason: reason || 'Pouze servis bez přidaných prodejů',
        items: [`Servis: ${selectedItems.typServisu}`],
        revenue: 0,
        completed_at: Date.now(),
        duration: sessionStartTime ? Date.now() - sessionStartTime : 0
    };
    
    try {
        await saveSalesSession(sessionData);
        showSuccessMessage('Servis zaznamenán!');
        closeSalesAssistant();
    } catch (error) {
        console.error('Chyba při ukládání:', error);
        alert('Chyba při ukládání dat. Zkuste to znovu.');
    }
}

// Zavření prodejního asistenta
function closeSalesAssistant() {
    const modal = document.getElementById('salesAssistantModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset stavu
    currentSalesSession = null;
    currentScenario = null;
    currentWizardStep = 1;
    selectedItems = { 
        obaly: [], 
        sklicka: [], 
        prislusenstvi: [],
        cisteni: [],
        sluzby: [],
        hadrik: false
    };
} 