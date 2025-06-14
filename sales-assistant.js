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
            modalBody.innerHTML = renderComingSoon('PŘÍSLUŠENSTVÍ', '🔌');
            break;
        case 'novy-telefon':
            modalBody.innerHTML = renderComingSoon('NOVÝ TELEFON', '📱');
            break;
        case 'vykup':
            modalBody.innerHTML = renderComingSoon('VÝKUP', '💰');
            break;
        case 'jen-se-kouka':
            modalBody.innerHTML = renderComingSoon('JEN SE KOUKÁ', '👀');
            break;
        case 'konzultace':
            modalBody.innerHTML = renderComingSoon('CHCE KONZULTACI', '💬');
            break;
        case 'servis':
            modalBody.innerHTML = renderComingSoon('CHCE SERVIS TELEFONU', '🔧');
            break;
        default:
            modalBody.innerHTML = renderScenarioSelection();
    }
}

// Zásilkovna scénář - krok 1 (obaly)
function renderZasilkovnaScenario() {
    currentWizardStep = 1;
    selectedItems = { obaly: [], sklicka: [], prislusenstvi: [] };
    
    return `
        <button class="scenario-back-btn" onclick="goBackToScenarios()">← Zpět na výběr</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Krok 1/4
        </h3>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                💡 "Díky zásilkovně máte na všechno příslušenství 20% slevu!"
            </div>
        </div>
        
        <div class="sales-content">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center; font-size: 0.9rem;">
                📱 OBALY - Vyberte typ obalu:
            </h4>
            
            <div class="scenario-grid">
                <div class="scenario-tile" onclick="selectObal('pruhledny')">
                    <span class="scenario-emoji">🔹</span>
                    <h4 class="scenario-title">PRŮHLEDNÝ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectObal('barevny')">
                    <span class="scenario-emoji">🌈</span>
                    <h4 class="scenario-title">BAREVNÝ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectObal('klasicky')">
                    <span class="scenario-emoji">📱</span>
                    <h4 class="scenario-title">KLASICKÝ<br>OBAL</h4>
                </div>
                <div class="scenario-tile" onclick="selectObal('knizkovy')">
                    <span class="scenario-emoji">📖</span>
                    <h4 class="scenario-title">KNÍŽKOVÝ<br>OBAL</h4>
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
        <button class="scenario-back-btn" onclick="renderZasilkovnaScenario(); document.getElementById('salesModalBody').innerHTML = renderZasilkovnaScenario();">← Zpět na obaly</button>
        
        <h3 style="text-align: center; color: var(--primary-color); margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Krok 2/4
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
            📦 ZÁSILKOVNA - Krok 3/4
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

// Výběr příslušenství a přechod na krok 4
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

// Zásilkovna scénář - krok 4 (finální - sleva a dokončení)
function renderZasilkovnaStep4() {
    currentWizardStep = 4;
    
    // Spočítej co se prodalo
    const soldItems = [];
    if (selectedItems.obaly.length > 0) soldItems.push(selectedItems.obaly[0] + ' obal');
    if (selectedItems.sklicka.length > 0) soldItems.push(selectedItems.sklicka[0] + ' sklíčko');
    if (selectedItems.prislusenstvi.length > 0) soldItems.push(selectedItems.prislusenstvi[0]);
    
    const nothingSold = soldItems.length === 0;
    
    if (nothingSold) {
        // Pokud se nic neprodalo, přejdi na "neprodáno" formulář
        return renderNotSoldForm();
    }
    
    return `
        <button class="scenario-back-btn" onclick="document.getElementById('salesModalBody').innerHTML = renderZasilkovnaStep3();">← Zpět na příslušenství</button>
        
        <h3 style="text-align: center; color: #2ed573; margin-bottom: 1rem;">
            📦 ZÁSILKOVNA - Krok 4/4
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
                <div class="checkbox-item" data-checkbox="pruhledny-obal">
                    <span class="item-icon">🔹</span>
                    <input type="checkbox" id="pruhledny-obal" name="sold-items">
                    <label for="pruhledny-obal">PRŮHLEDNÝ<br>OBAL</label>
                </div>
                <div class="checkbox-item" data-checkbox="barevny-obal">
                    <span class="item-icon">🌈</span>
                    <input type="checkbox" id="barevny-obal" name="sold-items">
                    <label for="barevny-obal">BAREVNÝ<br>OBAL</label>
                </div>
                <div class="checkbox-item" data-checkbox="klasicky-obal">
                    <span class="item-icon">📱</span>
                    <input type="checkbox" id="klasicky-obal" name="sold-items">
                    <label for="klasicky-obal">KLASICKÝ<br>OBAL</label>
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
    selectedItems = { obaly: [], sklicka: [], prislusenstvi: [] };
} 