// Navigation.js - Cache Buster Version 1.0.3 - CHROME FOCUS FIX
console.log('🔄 Navigation.js načten - verze 1.0.3 - CHROME FOCUS OPRAVENO - ' + new Date().toISOString());

// Minimalistické menu systém
console.log('🧭 Navigation.js se načítá...');

function updateNavigation() {
    console.log('🔧 updateNavigation() spuštěna');
    const nav = document.querySelector('nav ul');
    if (!nav) {
        console.error('❌ Navigation ul element not found!');
        return;
    }
    console.log('✅ Nav ul element nalezen:', nav);
    
    // Přidej header-controls container pokud neexistuje
    let headerControls = document.querySelector('.header-controls');
    if (!headerControls) {
        const headerContent = document.querySelector('.header-content');
        if (headerContent) {
            headerControls = document.createElement('div');
            headerControls.className = 'header-controls';
            headerContent.appendChild(headerControls);
        }
    }
    
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('role');
    
    // Získat jméno uživatele pro profil
    const userDisplayName = getUserDisplayName();
    
    // Čisté minimalistické menu - bez emoji
    const baseItems = `
        <li><a href="index.html">Domů</a></li>
        <li><a href="novinky.html">Novinky</a></li>
        <li><a href="leaderboards.html">Žebříček</a></li>
        <li><a href="prodejny.html">Prodejny</a></li>
    `;
    
    // Normální menu tlačítko pro prodejního asistenta - DEBUG
    const salesAssistantButton = `
        <li><a href="#" onclick="openSalesAssistant(event)">Nový zákazník</a></li>
    `;
    
    console.log('🔄 DEBUG: salesAssistantButton vytvořeno:', salesAssistantButton);
    console.log('🔄 DEBUG: isLoggedIn:', isLoggedIn, 'userRole:', userRole);
    
    // Prodejce menu - čisté a jednoduché
    const prodejceItems = `
        <li><a href="bazar.html" onclick="openNewBazarForm(event)">Přidat výkup</a></li>
        <li><a href="user-profile.html">${userDisplayName}</a></li>
        <li><a href="#" id="logout" class="logout-btn">Odhlásit</a></li>
    `;
    
    // Admin menu - minimalistické
    const adminItems = `
        <li class="dropdown">
            <a href="#" class="dropdown-toggle">Mobil Maják</a>
            <ul class="dropdown-menu">
                <li><a href="prodejny.html">Prodejny</a></li>
                <li><a href="servis.html">Servis</a></li>
                <li><a href="eshop.html">Eshop</a></li>
                <li class="dropdown-submenu">
                    <a href="bazar.html" class="dropdown-submenu-toggle">Bazar</a>
                    <ul class="dropdown-submenu-menu">
                        <li><a href="bazar.html">Přehled bazaru</a></li>
                        <li><a href="bazar.html" onclick="openNewBazarForm(event)">Přidat výkup</a></li>
                    </ul>
                </li>
                <li><a href="celkem.html">Celkem</a></li>
            </ul>
        </li>
        <li><a href="sales-analytics.html">📊 Prodejní analytika</a></li>
        <li><a href="user-profile.html">${userDisplayName}</a></li>
        <li><a href="user-management.html">Správa uživatelů</a></li>
        <li><a href="#" id="logout" class="logout-btn">Odhlásit</a></li>
    `;
    
    // Sestavení menu podle role uživatele
    if (isLoggedIn) {
        if (userRole === 'Prodejce') {
            nav.innerHTML = baseItems + salesAssistantButton + prodejceItems;
        } else if (userRole === 'Administrator' || userRole === 'Administrátor') {
            nav.innerHTML = baseItems + salesAssistantButton + adminItems;
        } else {
            // Pro ostatní role nebo neznámé role
            nav.innerHTML = baseItems + salesAssistantButton + `
                <li><a href="user-profile.html">${userDisplayName}</a></li>
                <li><a href="#" id="logout" class="logout-btn">Odhlásit</a></li>
            `;
        }
        // Odstranit login tlačítko
        const existingLoginBtn = document.querySelector('.header-login-btn');
        if (existingLoginBtn) existingLoginBtn.remove();
    } else {
        // Menu pro nepřihlášené - bez login tlačítka v nav
        nav.innerHTML = baseItems;
        
        // Přidat login tlačítko do header-controls
        const headerControls = document.querySelector('.header-controls');
        let loginBtn = document.querySelector('.header-login-btn');
        
        if (!loginBtn && headerControls) {
            loginBtn = document.createElement('a');
            loginBtn.href = 'login.html';
            loginBtn.className = 'header-login-btn';
            loginBtn.textContent = 'Přihlásit';
            
            // Vložit před hamburger nebo na začátek
            const hamburger = document.querySelector('.hamburger');
            if (hamburger) {
                headerControls.insertBefore(loginBtn, hamburger);
            } else {
                headerControls.appendChild(loginBtn);
            }
        }
    }
    
    // Logout funkcionalita
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Opravdu se chcete odhlásit?')) {
                const sessionKeys = [
                    'isLoggedIn', 'username', 'role', 'userId', 'sellerId',
                    'userEmail', 'userPhone', 'userProdejna', 'userData'
                ];
                sessionKeys.forEach(key => localStorage.removeItem(key));
                window.location.href = 'index.html';
            }
        });
    }
    
    setupDropdownMenus();
    setupHamburgerMenu();
    markActivePage();
}

// Funkce pro získání zobrazovaného jména uživatele
function getUserDisplayName() {
    const username = localStorage.getItem('username');
    
    if (!username) {
        return 'Můj profil';
    }
    
    try {
        // Zkus najít v localStorage uživatelských dat
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = users.find(u => u.username === username);
        
        if (currentUser) {
            // Priorita: fullName -> firstName + lastName -> firstName -> username
            if (currentUser.fullName && currentUser.fullName.trim() !== '') {
                return currentUser.fullName;
            } else if (currentUser.firstName && currentUser.lastName) {
                return `${currentUser.firstName} ${currentUser.lastName}`.trim();
            } else if (currentUser.firstName) {
                return currentUser.firstName;
            } else {
                return currentUser.username;
            }
        }
    } catch (e) {
        console.log('Chyba při čtení uživatelských dat z localStorage:', e);
    }
    
    // Fallback na username
    return username;
}

// Jednoduché dropdown menu
function setupDropdownMenus() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdown = document.querySelector('.dropdown');
    
    if (!dropdownToggle || !dropdown) return;
    
    dropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Desktop hover efekt
    if (window.innerWidth > 768) {
        dropdown.addEventListener('mouseenter', () => {
            dropdown.classList.add('active');
        });
        
        dropdown.addEventListener('mouseleave', () => {
            dropdown.classList.remove('active');
        });
    }
    
    // Submenu pro mobily
    const submenuToggle = dropdown.querySelector('.dropdown-submenu-toggle');
    const submenu = dropdown.querySelector('.dropdown-submenu');
    
    if (submenuToggle && submenu) {
        submenuToggle.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                submenu.classList.toggle('active');
            }
        });
    }
}

// Jednoduché hamburger menu
function setupHamburgerMenu() {
    // Přidej hamburger tlačítko, pokud neexistuje
    let hamburger = document.querySelector('.hamburger');
    if (!hamburger) {
        const headerControls = document.querySelector('.header-controls');
        if (headerControls) {
            hamburger = document.createElement('button');
            hamburger.className = 'hamburger';
            hamburger.innerHTML = '<span></span><span></span><span></span>';
            headerControls.appendChild(hamburger);
        }
    }
    
    const nav = document.querySelector('nav');
    
    // DEBUG informace
    console.log('🔍 DEBUG setupHamburgerMenu:');
    console.log('🍔 Hamburger found:', !!hamburger);
    console.log('🧭 Nav found:', !!nav);
    if (nav) {
        console.log('📝 Nav HTML:', nav.outerHTML.substring(0, 200) + '...');
        console.log('📍 Nav position:', window.getComputedStyle(nav).position);
        console.log('👁️ Nav visibility:', window.getComputedStyle(nav).visibility);
        console.log('🎨 Nav display:', window.getComputedStyle(nav).display);
    }
    
    if (!hamburger || !nav) {
        console.error('❌ Missing elements - hamburger:', !!hamburger, 'nav:', !!nav);
        return;
    }
    
    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('🍔 Hamburger clicked!');
        
        // DEBUG: Force inline styles
        if (nav.classList.contains('active')) {
            // Skrýt menu
            nav.style.cssText = 'position: fixed !important; top: 60px !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: rgba(255,255,255,0.98) !important; transform: translateX(-100%) !important; z-index: 9999 !important; visibility: hidden !important; opacity: 0 !important;';
            nav.classList.remove('active');
        } else {
            // Zobrazit menu - optimalizováno pro všechny velikosti obrazovek
            nav.style.cssText = `
                position: fixed !important; 
                top: 60px !important; 
                left: 0 !important; 
                right: 0 !important; 
                bottom: 0 !important; 
                width: 100vw !important;
                max-width: 100vw !important;
                height: calc(100vh - 60px) !important;
                min-height: calc(100vh - 60px) !important;
                background: rgba(255,255,255,0.98) !important; 
                transform: translateX(0) !important; 
                z-index: 9999 !important; 
                visibility: visible !important; 
                opacity: 1 !important; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
            `.replace(/\s+/g, ' ').trim();
            
            // Nastav správné styly na UL a zachovej původní obsah
            const navUl = nav.querySelector('ul');
            if (navUl) {
                // Nastav styly na UL
                navUl.style.cssText = 'visibility: visible !important; opacity: 1 !important; display: flex !important; flex-direction: column !important; padding: 20px !important; margin: 0 !important; list-style: none !important; background: rgba(255,255,255,0.95) !important; width: 100% !important; height: auto !important;';
                
                // Nastav styly na všechny LI elementy
                const menuItems = navUl.querySelectorAll('li');
                menuItems.forEach((li, index) => {
                    li.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; padding: 0 !important; margin: 0 0 10px 0 !important; width: 100% !important;';
                    
                    // Nastav styly na odkazy
                    const link = li.querySelector('a');
                    if (link) {
                        link.style.cssText = 'color: #333 !important; font-size: 18px !important; font-weight: 500 !important; text-decoration: none !important; display: block !important; padding: 15px 20px !important; border-radius: 8px !important; background: transparent !important; transition: background 0.2s ease !important;';
                        
                        // Přidej hover efekt
                        link.addEventListener('mouseenter', () => {
                            link.style.background = 'rgba(255, 20, 147, 0.1) !important';
                        });
                        link.addEventListener('mouseleave', () => {
                            link.style.background = 'transparent !important';
                        });
                        
                        // Přidej click handler pro zavření menu
                        link.addEventListener('click', () => {
                            closeHamburgerMenu();
                        });
                    }
                });
                
                console.log('✅ Menu styly aplikovány na', menuItems.length, 'položek');
            } else {
                console.error('❌ Nav UL element nenalezen!');
            }
            
            nav.classList.add('active');
        }
        
        hamburger.classList.toggle('active');
        console.log('🔄 Nav classes:', nav.classList);
        console.log('📱 Nav styles:', nav.style.cssText);
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });
    
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
            closeHamburgerMenu();
        }
    });
    
    nav.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && !e.target.classList.contains('dropdown-toggle')) {
            closeHamburgerMenu();
        }
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            closeHamburgerMenu();
        }
    });
}

// Zavření hamburger menu
function closeHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    
    if (hamburger && nav) {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
        document.body.style.overflow = '';
        
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
}

// Označení aktivní stránky
function markActivePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkPath = new URL(link.href).pathname.split('/').pop();
        
        if (linkPath === currentPage || 
            (currentPage === '' && linkPath === 'index.html') ||
            (currentPage === 'index.html' && linkPath === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Inicializace menu
function initNavigation() {
    console.log('🎯 initNavigation() spuštěna');
    updateNavigation();
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'isLoggedIn' || e.key === 'role') {
            updateNavigation();
        }
    });
}

// Bazar formulář
function openNewBazarForm(event) {
    event.preventDefault();
    closeHamburgerMenu();
    
    if (window.location.pathname.includes('bazar.html')) {
        const newBazarBtn = document.getElementById('newBazarBtn');
        const newBazarForm = document.getElementById('newBazarForm');
        
        if (newBazarBtn && newBazarForm) {
            newBazarForm.style.display = 'block';
            newBazarBtn.style.display = 'none';
            newBazarForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else {
        window.location.href = 'bazar.html?openForm=true';
    }
}

// Prodejní asistent - Enhanced with Chrome compatibility
function openSalesAssistant(event) {
    try {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        closeHamburgerMenu();
        
        console.log('🔍 DEBUG: openSalesAssistant called');
        console.log('🔍 Browser:', navigator.userAgent);
        console.log('🔍 Chrome version:', navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Not Chrome');
        console.log('🔍 createSalesAssistantModal available:', typeof createSalesAssistantModal);
        
        // Enhanced script loading check with multiple attempts
        if (typeof createSalesAssistantModal === 'undefined') {
            console.error('❌ Sales assistant není načten!');
            return handleMissingScript(event);
        }
        
        console.log('✅ Sales assistant je dostupný');
        
        // Enhanced session timing
        try {
            if (typeof window.sessionStartTime !== 'undefined') {
                window.sessionStartTime = Date.now();
                console.log('✅ Session timer started');
            } else {
                console.warn('⚠️ sessionStartTime není definována, vytvářím globálně');
                window.sessionStartTime = Date.now();
            }
        } catch (sessionError) {
            console.warn('⚠️ Session timer error:', sessionError);
            window.sessionStartTime = Date.now();
        }
        
        // Enhanced modal creation with fallbacks
        return createModalWithFallbacks();
        
    } catch (globalError) {
        console.error('❌ Kritická chyba v openSalesAssistant:', globalError);
        showFallbackMessage();
    }
}

// Helper function for missing script handling
function handleMissingScript(originalEvent) {
    console.log('🔍 Handling missing script...');
    
    // Check if we're in a retry loop
    if (window.salesAssistantRetryCount > 2) {
        console.error('❌ Příliš mnoho pokusů o načtení');
        alert('Prodejní asistent se nedaří načíst. Zkuste obnovit stránku (Ctrl+F5) nebo kontaktujte administrátora.');
        return;
    }
    
    window.salesAssistantRetryCount = (window.salesAssistantRetryCount || 0) + 1;
    
    // Try multiple loading strategies
    const loadingStrategies = [
        () => loadScriptWithPromise('sales-assistant.js'),
        () => loadScriptWithCallback('sales-assistant.js'),
        () => loadScriptWithFetch('sales-assistant.js')
    ];
    
    async function tryLoadingStrategies() {
        for (let i = 0; i < loadingStrategies.length; i++) {
            try {
                console.log(`🔄 Zkouším strategii ${i + 1}/${loadingStrategies.length}`);
                await loadingStrategies[i]();
                
                // Verify loading
                if (typeof createSalesAssistantModal !== 'undefined') {
                    console.log('✅ Sales assistant úspěšně načten');
                    setTimeout(() => openSalesAssistant(originalEvent), 100);
                    return;
                }
            } catch (error) {
                console.log(`❌ Strategie ${i + 1} selhala:`, error.message);
            }
        }
        
        console.error('❌ Všechny strategie načítání selhaly');
        showFallbackMessage();
    }
    
    tryLoadingStrategies();
}

// Script loading strategies
function loadScriptWithPromise(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Promise timeout')), 5000);
    });
}

function loadScriptWithCallback(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false; // Different approach
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
        
        setTimeout(() => reject(new Error('Callback timeout')), 5000);
    });
}

async function loadScriptWithFetch(src) {
    const response = await fetch(src);
    if (!response.ok) throw new Error('Fetch failed');
    
    const scriptText = await response.text();
    const script = document.createElement('script');
    script.textContent = scriptText;
    document.head.appendChild(script);
}

// Enhanced modal creation
function createModalWithFallbacks() {
    try {
        const existingModal = document.getElementById('salesAssistantModal');
        
        if (!existingModal) {
            console.log('🔧 Vytvářím nový modal');
            createSalesAssistantModal();
        } else {
            console.log('🔧 Modal již existuje - obnovuji obsah');
            resetExistingModal(existingModal);
        }
        
        // Reset global state
        resetGlobalState();
        
        // Show modal with enhanced error handling
        return showModalWithFallbacks();
        
    } catch (modalError) {
        console.error('❌ Chyba při vytváření modalu:', modalError);
        return createFallbackModal();
    }
}

// Reset existing modal
function resetExistingModal(modal) {
    try {
        const modalBody = document.getElementById('salesModalBody');
        if (modalBody && typeof renderScenarioSelection !== 'undefined') {
            modalBody.innerHTML = renderScenarioSelection();
            console.log('✅ Obsah modalu obnoven');
        } else {
            console.warn('⚠️ Nelze obnovit obsah modalu');
        }
    } catch (resetError) {
        console.error('❌ Chyba při resetování modalu:', resetError);
        // Force recreate modal
        modal.remove();
        createSalesAssistantModal();
    }
}

// Reset global state
function resetGlobalState() {
    try {
        if (typeof window.currentSalesSession !== 'undefined') {
            window.currentSalesSession = null;
        }
        if (typeof window.currentScenario !== 'undefined') {
            window.currentScenario = null;
        }
    } catch (stateError) {
        console.warn('⚠️ Chyba při resetování stavu:', stateError);
    }
}

// Show modal with fallbacks
function showModalWithFallbacks() {
    const modal = document.getElementById('salesAssistantModal');
    
    if (!modal) {
        console.error('❌ Modal element nenalezen');
        return createFallbackModal();
    }
    
    try {
        // Enhanced display for Chrome
        modal.style.cssText = `
            display: flex !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 1rem !important;
        `;
        
        // Force reflow for Chrome
        modal.offsetHeight;
        
        console.log('✅ Modal zobrazený s enhanced styly');
        return true;
        
    } catch (displayError) {
        console.error('❌ Chyba při zobrazování modalu:', displayError);
        return createFallbackModal();
    }
}

// Fallback modal for emergency cases
function createFallbackModal() {
    console.log('🚨 Vytvářím fallback modal');
    
    const fallbackHTML = `
        <div style="
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0,0,0,0.8) !important;
            z-index: 999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        " id="fallbackModal">
            <div style="
                background: white !important;
                padding: 2rem !important;
                border-radius: 15px !important;
                max-width: 400px !important;
                text-align: center !important;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
            ">
                <h2 style="color: #333 !important; margin-bottom: 1rem !important;">
                    Prodejní asistent
                </h2>
                <p style="color: #666 !important; margin-bottom: 1.5rem !important;">
                    Načítání prodejního asistenta...
                </p>
                <button onclick="closeFallbackModal()" style="
                    background: #ff1493 !important;
                    color: white !important;
                    border: none !important;
                    padding: 0.75rem 1.5rem !important;
                    border-radius: 25px !important;
                    cursor: pointer !important;
                    font-weight: 600 !important;
                ">
                    Zavřít
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', fallbackHTML);
    
    // Auto-retry after 3 seconds
    setTimeout(() => {
        const fallback = document.getElementById('fallbackModal');
        if (fallback && typeof createSalesAssistantModal !== 'undefined') {
            fallback.remove();
            openSalesAssistant(null);
        }
    }, 3000);
}

// Close fallback modal
window.closeFallbackModal = function() {
    const fallback = document.getElementById('fallbackModal');
    if (fallback) fallback.remove();
};

// Fallback message for critical errors
function showFallbackMessage() {
    alert(`❌ Prodejní asistent se nepodařilo načíst.

Možná řešení:
1. Obnovte stránku (Ctrl+F5)
2. Vypněte rozšíření prohlížeče
3. Zkuste jiný prohlížeč
4. Kontaktujte administrátora

Browser: ${navigator.userAgent.includes('Chrome') ? 'Chrome ' + (navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown') : 'Other'}`);
}

// Inicializace při načtení stránky
console.log('🚀 Navigation.js načten - registruji DOMContentLoaded');
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOMContentLoaded fired - spouštím initNavigation()');
    initNavigation();
    
    // Automatické otevření formuláře z URL parametru
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openForm') === 'true' && window.location.pathname.includes('bazar.html')) {
        setTimeout(() => {
            const newBazarBtn = document.getElementById('newBazarBtn');
            const newBazarForm = document.getElementById('newBazarForm');
            
            if (newBazarBtn && newBazarForm) {
                newBazarForm.style.display = 'block';
                newBazarBtn.style.display = 'none';
                newBazarForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Vyčistit URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }, 500);
    }
});

// Debug funkce pro testování Chrome kompatibility
window.debugSalesAssistant = function() {
    console.log('🔍 DEBUG: Testing Sales Assistant in Chrome');
    console.log('🔍 Browser details:', {
        userAgent: navigator.userAgent,
        chrome: navigator.userAgent.includes('Chrome'),
        version: navigator.userAgent.match(/Chrome\/(\d+)/)?.[1],
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    });
    
    console.log('🔍 Script loading status:', {
        salesAssistant: typeof createSalesAssistantModal !== 'undefined',
        navigation: typeof updateNavigation !== 'undefined',
        sessionStartTime: typeof sessionStartTime !== 'undefined'
    });
    
    console.log('🔍 DOM elements:', {
        navigation: !!document.querySelector('nav ul'),
        plusButton: !!document.querySelector('a[onclick*="openSalesAssistant"]'),
        isLoggedIn: localStorage.getItem('isLoggedIn'),
        userRole: localStorage.getItem('role')
    });
    
    // Pokus o zobrazení plus tlačítka
    const plusButton = document.querySelector('a[onclick*="openSalesAssistant"]');
    if (plusButton) {
        plusButton.setAttribute('data-debug', 'sales-assistant-button');
        console.log('✅ Plus button found and marked for debugging');
        console.log('🔍 Plus button styles:', window.getComputedStyle(plusButton));
    } else {
        console.log('❌ Plus button not found');
    }
};

// Automatické spuštění debug pro Chrome
if (navigator.userAgent.includes('Chrome')) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            console.log('🚀 Chrome Auto-Debug starting...');
            if (window.debugSalesAssistant) {
                window.debugSalesAssistant();
            }
        }, 1000);
    });
} 