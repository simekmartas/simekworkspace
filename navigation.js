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
    
    // Plus tlačítko pro všechny přihlášené uživatele
    const salesAssistantButton = `
        <li><a href="#" onclick="openSalesAssistant(event)" style="background: linear-gradient(135deg, #ff1493, #e91e63); color: white; border-radius: 50%; width: 40px; height: 40px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 4px 15px rgba(255, 20, 147, 0.3); transition: all 0.3s ease;" title="Prodejní asistent" onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 8px 25px rgba(255, 20, 147, 0.4)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(255, 20, 147, 0.3)'">➕</a></li>
    `;
    
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
            nav.style.cssText = 'position: fixed !important; top: 60px !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: white !important; transform: translateX(-100%) !important; z-index: 9999 !important; border: 3px solid red !important; visibility: hidden !important; opacity: 0 !important;';
            nav.classList.remove('active');
        } else {
            // Zobrazit menu
            nav.style.cssText = 'position: fixed !important; top: 60px !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: white !important; transform: translateX(0) !important; z-index: 9999 !important; border: 3px solid green !important; visibility: visible !important; opacity: 1 !important;';
            
            // MEGA TEST - přidej obrovský text přímo do nav
            nav.innerHTML = '<div style="font-size: 30px !important; color: red !important; background: yellow !important; padding: 20px !important; font-weight: bold !important;">🍔 MENU FUNGUJE! 🎉<br>Domů<br>Novinky<br>Žebříček<br>Prodejny</div>';
            console.log('🚨 MEGA TEST text přidán do nav');
            
            // Také nastav styly na ul element
            const navUl = nav.querySelector('ul');
            console.log('🔍 Hledám UL element:', navUl);
            console.log('🔍 Nav innerHTML:', nav.innerHTML);
            if (navUl) {
                navUl.style.cssText = 'visibility: visible !important; opacity: 1 !important; display: block !important; padding: 20px !important; margin: 0 !important; background: yellow !important; border: 2px solid blue !important; font-size: 20px !important; color: black !important;';
                console.log('🟡 UL styly nastaveny');
                
                // Nastav styly na všechny li elementy
                const menuItems = navUl.querySelectorAll('li');
                menuItems.forEach((li, index) => {
                    li.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; padding: 15px !important; margin: 5px 0 !important; background: orange !important; border: 1px solid red !important; font-size: 18px !important;';
                    console.log(`🟠 LI element ${index + 1} nastaven`);
                    
                    // Nastav styly na odkazy
                    const link = li.querySelector('a');
                    if (link) {
                        link.style.cssText = 'color: black !important; font-size: 18px !important; font-weight: bold !important; text-decoration: none !important; display: block !important;';
                        console.log(`🔗 Link ${index + 1} nastaven: ${link.textContent}`);
                    }
                });
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
        if (window.innerWidth > 768) {
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

// Prodejní asistent
function openSalesAssistant(event) {
    event.preventDefault();
    closeHamburgerMenu();
    
    console.log('🔍 DEBUG: openSalesAssistant called');
    console.log('🔍 Browser:', navigator.userAgent);
    console.log('🔍 createSalesAssistantModal available:', typeof createSalesAssistantModal);
    
    // Zkontroluj zda je sales-assistant.js načten
    if (typeof createSalesAssistantModal === 'undefined') {
        console.error('❌ Sales assistant není načten!');
        console.log('🔍 Zkouším načíst sales-assistant.js dynamicky...');
        
        // Pokus o dynamické načtení pro Chrome
        const script = document.createElement('script');
        script.src = 'sales-assistant.js';
        script.onload = function() {
            console.log('✅ Sales assistant dynamicky načten');
            openSalesAssistant(event);
        };
        script.onerror = function() {
            console.error('❌ Nepodařilo se načíst sales-assistant.js');
            alert('Prodejní asistent se nepodařilo načíst. Obnovte stránku (Ctrl+F5).');
        };
        document.head.appendChild(script);
        return;
    }
    
    console.log('✅ Sales assistant je dostupný');
    
    // Začni měřit čas session
    if (typeof sessionStartTime !== 'undefined') {
        sessionStartTime = Date.now();
        console.log('✅ Session timer started');
    } else {
        console.warn('⚠️ sessionStartTime není definována');
        // Definuj globálně
        window.sessionStartTime = Date.now();
    }
    
    // Vytvoř prodejní asistent modal
    try {
        if (!document.getElementById('salesAssistantModal')) {
            console.log('🔧 Vytvářím nový modal');
            createSalesAssistantModal();
        } else {
            console.log('🔧 Modal již existuje - obnovuji obsah');
            // Resetuj obsah modalu na začátek (výběr scénářů)
            const modalBody = document.getElementById('salesModalBody');
            if (modalBody && typeof renderScenarioSelection !== 'undefined') {
                modalBody.innerHTML = renderScenarioSelection();
                console.log('✅ Obsah modalu obnoven');
            }
        }
        
        // Resetuj stav pro novou session
        if (typeof currentSalesSession !== 'undefined') {
            currentSalesSession = null;
        }
        if (typeof currentScenario !== 'undefined') {
            currentScenario = null;
        }
        
        const modal = document.getElementById('salesAssistantModal');
        if (modal) {
            modal.style.display = 'flex';
            console.log('✅ Modal zobrazený s čistým obsahem');
        } else {
            throw new Error('Modal se nepodařilo vytvořit');
        }
    } catch (error) {
        console.error('❌ Chyba při vytváření modalu:', error);
        alert('Chyba při otevírání prodejního asistenta: ' + error.message);
    }
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