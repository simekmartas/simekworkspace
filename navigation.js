console.log('🔵 NAVIGATION.JS: Script se načítá...');

// Enhanced navigation with detailed logging
function updateNavigation() {
    console.log('🔵 NAVIGATION.JS: updateNavigation() spuštěno');
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    
    console.log('🔵 NAVIGATION.JS: Stav přihlášení:', {
        isLoggedIn,
        role,
        username,
        localStorage_keys: Object.keys(localStorage)
    });
    
    const navList = document.querySelector('nav ul');
    if (!navList) {
        console.error('🔴 NAVIGATION.JS: Nenalezen nav ul element!');
        return;
    }
    
    console.log('🔵 NAVIGATION.JS: Nav element nalezen, počet existujících položek:', navList.children.length);
    
    // Vymaž aktuální obsah
    navList.innerHTML = '';
    console.log('🔵 NAVIGATION.JS: Nav vymazán');

    // Základní navigace
    if (isLoggedIn) {
        console.log('🔵 NAVIGATION.JS: Uživatel je přihlášen, vytvářím navigaci pro roli:', role);
        
        // Přidej základní položky podle role
        if (role === 'Prodejce') {
            console.log('🔵 NAVIGATION.JS: Přidávám navigaci pro PRODEJCE');
            
            const homeItem = document.createElement('li');
            homeItem.innerHTML = '<a href="index.html">🏠 Domů</a>';
            navList.appendChild(homeItem);
            console.log('🔵 NAVIGATION.JS: Přidán domů link');
            
            const salesItem = document.createElement('li');
            salesItem.innerHTML = '<a href="sales-analytics.html">📊 Prodeje</a>';
            navList.appendChild(salesItem);
            console.log('🔵 NAVIGATION.JS: Přidán prodeje link');
            
            const celkemItem = document.createElement('li');
            celkemItem.innerHTML = '<a href="celkem.html">📈 Celkem</a>';
            navList.appendChild(celkemItem);
            console.log('🔵 NAVIGATION.JS: Přidán celkem link');
            
            const servisItem = document.createElement('li');
            servisItem.innerHTML = '<a href="servis.html">🔧 Servis</a>';
            navList.appendChild(servisItem);
            console.log('🔵 NAVIGATION.JS: Přidán servis link');
            
            const bazarItem = document.createElement('li');
            bazarItem.innerHTML = '<a href="bazar.html">🛒 Bazar</a>';
            navList.appendChild(bazarItem);
            console.log('🔵 NAVIGATION.JS: Přidán bazar link');
            
            const leaderboardItem = document.createElement('li');
            leaderboardItem.innerHTML = '<a href="leaderboards.html">🏆 Žebříčky</a>';
            navList.appendChild(leaderboardItem);
            console.log('🔵 NAVIGATION.JS: Přidán žebříčky link');
            
            // KLÍČOVÝ MOMENT - PLUS TLAČÍTKO
            console.log('🔵 NAVIGATION.JS: Začínám vytvářet PLUS TLAČÍTKO pro prodejce...');
            
            const plusItem = document.createElement('li');
            plusItem.style.cssText = 'position: relative; display: flex; align-items: center;';
            
            console.log('🔵 NAVIGATION.JS: Kontroluji dostupnost openSalesAssistant funkce:', typeof openSalesAssistant);
            
            if (typeof openSalesAssistant === 'function') {
                console.log('🟢 NAVIGATION.JS: openSalesAssistant funkce JE dostupná - používám ji');
                plusItem.innerHTML = '<a href="#" onclick="openSalesAssistant(event)" style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 0.5rem 1rem; border-radius: 20px; text-decoration: none; font-weight: bold; box-shadow: 0 2px 10px rgba(255, 107, 107, 0.3); transition: all 0.3s ease;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'" title="Otevřít prodejní asistent">➕ Nový prodej</a>';
            } else {
                console.log('🟡 NAVIGATION.JS: openSalesAssistant funkce NENÍ dostupná - vytvářím fallback');
                plusItem.innerHTML = '<a href="#" onclick="window.forceOpenSalesAssistant && window.forceOpenSalesAssistant(event)" style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 0.5rem 1rem; border-radius: 20px; text-decoration: none; font-weight: bold; box-shadow: 0 2px 10px rgba(255, 107, 107, 0.3); transition: all 0.3s ease;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'" title="Otevřít prodejní asistent">➕ Nový prodej</a>';
            }
            
            navList.appendChild(plusItem);
            console.log('🟢 NAVIGATION.JS: PLUS TLAČÍTKO PŘIDÁNO DO NAVIGACE!');
            console.log('🔵 NAVIGATION.JS: Plus tlačítko HTML:', plusItem.innerHTML);
            
            // Kontrola zda se tlačítko skutečně objevilo
            setTimeout(() => {
                const checkPlusButton = document.querySelector('a[onclick*="openSalesAssistant"], a[onclick*="forceOpenSalesAssistant"]');
                if (checkPlusButton) {
                    console.log('🟢 NAVIGATION.JS: PLUS TLAČÍTKO OVĚŘENO - je viditelné v DOM!');
                } else {
                    console.error('🔴 NAVIGATION.JS: PLUS TLAČÍTKO NEBYLO NALEZENO V DOM!');
                    
                    // Windows Chrome fallback
                    if (navigator.userAgent.includes('Windows') && navigator.userAgent.includes('Chrome')) {
                        console.log('🟡 NAVIGATION.JS: Detected Windows Chrome - creating fallback button');
                        createWindowsChromeFallback();
                    }
                }
            }, 500);
            
        } else if (role === 'Vedoucí' || role === 'Admin') {
            console.log('🔵 NAVIGATION.JS: Přidávám navigaci pro VEDOUCÍ/ADMIN');
            
            const homeItem = document.createElement('li');
            homeItem.innerHTML = '<a href="index.html">🏠 Domů</a>';
            navList.appendChild(homeItem);
            
            const salesItem = document.createElement('li');
            salesItem.innerHTML = '<a href="sales-analytics.html">📊 Prodeje</a>';
            navList.appendChild(salesItem);
            
            const celkemItem = document.createElement('li');
            celkemItem.innerHTML = '<a href="celkem.html">📈 Celkem</a>';
            navList.appendChild(celkemItem);
            
            const servisItem = document.createElement('li');
            servisItem.innerHTML = '<a href="servis.html">🔧 Servis</a>';
            navList.appendChild(servisItem);
            
            const bazarItem = document.createElement('li');
            bazarItem.innerHTML = '<a href="bazar.html">🛒 Bazar</a>';
            navList.appendChild(bazarItem);
            
            const leaderboardItem = document.createElement('li');
            leaderboardItem.innerHTML = '<a href="leaderboards.html">🏆 Žebříčky</a>';
            navList.appendChild(leaderboardItem);
            
            // Plus tlačítko i pro vedoucí
            console.log('🔵 NAVIGATION.JS: Přidávám PLUS TLAČÍTKO pro vedoucí/admin');
            const plusItem = document.createElement('li');
            plusItem.innerHTML = '<a href="#" onclick="openSalesAssistant(event)" style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 0.5rem 1rem; border-radius: 20px; text-decoration: none; font-weight: bold; box-shadow: 0 2px 10px rgba(255, 107, 107, 0.3); transition: all 0.3s ease;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'" title="Otevřít prodejní asistent">➕ Nový prodej</a>';
            navList.appendChild(plusItem);
            console.log('🟢 NAVIGATION.JS: PLUS TLAČÍTKO přidáno pro vedoucí/admin');
        }
        
        // User info
        const userItem = document.createElement('li');
        userItem.innerHTML = `<span style="color: #666; font-size: 0.9em;">👤 ${username} (${role})</span>`;
        navList.appendChild(userItem);
        console.log('🔵 NAVIGATION.JS: Přidáno user info');
        
        // Logout
        const logoutItem = document.createElement('li');
        logoutItem.innerHTML = '<a href="#" onclick="logout()" style="color: #ff6b6b;">🚪 Odhlásit</a>';
        navList.appendChild(logoutItem);
        console.log('🔵 NAVIGATION.JS: Přidáno logout');
        
    } else {
        console.log('🔵 NAVIGATION.JS: Uživatel NENÍ přihlášen, zobrazuji login');
        const loginItem = document.createElement('li');
        loginItem.innerHTML = '<a href="login.html">🔐 Přihlásit se</a>';
        navList.appendChild(loginItem);
    }
    
    console.log('🔵 NAVIGATION.JS: Navigace dokončena, celkový počet položek:', navList.children.length);
    
    // Final check pro Windows Chrome
    if (navigator.userAgent.includes('Windows') && navigator.userAgent.includes('Chrome')) {
        setTimeout(() => {
            console.log('🔵 NAVIGATION.JS: Windows Chrome final check...');
            const finalPlusCheck = document.querySelector('a[onclick*="openSalesAssistant"]');
            if (!finalPlusCheck && isLoggedIn && role === 'Prodejce') {
                console.error('🔴 NAVIGATION.JS: CRITICAL - Plus tlačítko se neobjevilo na Windows Chrome!');
                createWindowsChromeFallback();
            }
        }, 1000);
    }
}

// Windows Chrome fallback function
function createWindowsChromeFallback() {
    console.log('🟡 NAVIGATION.JS: Vytvářím Windows Chrome fallback tlačítko...');
    
    // Remove existing fallback
    const existingFallback = document.querySelector('.windows-chrome-fallback');
    if (existingFallback) {
        existingFallback.remove();
        console.log('🟡 NAVIGATION.JS: Odstraněn existující fallback');
    }
    
    const fallbackButton = document.createElement('div');
    fallbackButton.className = 'windows-chrome-fallback';
    fallbackButton.innerHTML = '➕ PRODEJ';
    fallbackButton.title = 'Windows Chrome Fallback - Prodejní asistent';
    fallbackButton.style.cssText = `
        position: fixed !important;
        top: 80px !important;
        right: 20px !important;
        background: linear-gradient(135deg, #ff1493, #e91e63) !important;
        color: white !important;
        padding: 1rem 1.5rem !important;
        border-radius: 25px !important;
        cursor: pointer !important;
        z-index: 999999 !important;
        font-weight: bold !important;
        font-size: 1rem !important;
        box-shadow: 0 4px 20px rgba(255, 20, 147, 0.5) !important;
        border: 2px solid white !important;
        animation: windowsFallbackPulse 3s infinite !important;
    `;
    
    fallbackButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🟡 NAVIGATION.JS: Windows Chrome fallback button clicked!');
        
        if (typeof openSalesAssistant === 'function') {
            openSalesAssistant(e);
        } else if (typeof createSalesAssistantModal === 'function') {
            createSalesAssistantModal();
            document.getElementById('salesAssistantModal').style.display = 'flex';
        } else {
            alert('Prodejní asistent není dostupný. Zkuste obnovit stránku (F5).');
        }
    });
    
    document.body.appendChild(fallbackButton);
    console.log('🟢 NAVIGATION.JS: Windows Chrome fallback button vytvořen!');
    
    // Add CSS animation
    if (!document.querySelector('#windows-fallback-css')) {
        const style = document.createElement('style');
        style.id = 'windows-fallback-css';
        style.textContent = `
            @keyframes windowsFallbackPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); box-shadow: 0 6px 25px rgba(255, 20, 147, 0.7); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Logout function
function logout() {
    console.log('🔵 NAVIGATION.JS: Odhlašování uživatele...');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    console.log('🔵 NAVIGATION.JS: LocalStorage vymazán');
    window.location.href = 'login.html';
}

// Force create plus button function for emergency use
window.forceCreatePlusButton = function() {
    console.log('🚨 NAVIGATION.JS: forceCreatePlusButton() called!');
    
    const navList = document.querySelector('nav ul');
    if (!navList) {
        console.error('🔴 NAVIGATION.JS: Cannot force create - nav ul not found!');
        return false;
    }
    
    // Remove existing plus button
    const existingPlus = navList.querySelector('a[onclick*="openSalesAssistant"]');
    if (existingPlus) {
        existingPlus.parentElement.remove();
        console.log('🔵 NAVIGATION.JS: Removed existing plus button');
    }
    
    const plusItem = document.createElement('li');
    plusItem.innerHTML = '<a href="#" onclick="openSalesAssistant(event)" style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 0.5rem 1rem; border-radius: 20px; text-decoration: none; font-weight: bold; box-shadow: 0 2px 10px rgba(255, 107, 107, 0.3); transition: all 0.3s ease;" title="Otevřít prodejní asistent">➕ FORCE CREATED</a>';
    
    navList.appendChild(plusItem);
    console.log('🟢 NAVIGATION.JS: Force created plus button!');
    return true;
};

// Force open sales assistant for fallback
window.forceOpenSalesAssistant = function(event) {
    console.log('🚨 NAVIGATION.JS: forceOpenSalesAssistant() called!');
    
    if (event) {
        event.preventDefault();
    }
    
    if (typeof openSalesAssistant === 'function') {
        console.log('🟢 NAVIGATION.JS: Calling openSalesAssistant...');
        openSalesAssistant(event);
    } else if (typeof createSalesAssistantModal === 'function') {
        console.log('🟢 NAVIGATION.JS: Calling createSalesAssistantModal...');
        createSalesAssistantModal();
        const modal = document.getElementById('salesAssistantModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    } else {
        console.error('🔴 NAVIGATION.JS: No sales assistant functions available!');
        alert('Prodejní asistent není dostupný. Zkuste obnovit stránku (F5).');
    }
};

// FORCE NAVIGATION - vynutí vytvoření navigace za všech okolností
function forceCreateNavigation() {
    console.log('🚨 NAVIGATION.JS: FORCE CREATE NAVIGATION!');
    
    // Simuluj přihlášení pokud není
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        console.log('🚨 NAVIGATION.JS: Force simuluji přihlášení...');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('role', 'Prodejce');
        localStorage.setItem('username', 'force-user');
    }
    
    // Vytvořit navigaci
    updateNavigation();
    
    // Ověřit že plus tlačítko existuje
    setTimeout(() => {
        const plusButton = document.querySelector('a[onclick*="openSalesAssistant"]');
        if (!plusButton) {
            console.log('🚨 NAVIGATION.JS: Plus tlačítko chybí, vytvářím emergency...');
            
            // Emergency plus tlačítko přímo do navigace
            const navList = document.querySelector('nav ul');
            if (navList) {
                const emergencyPlus = document.createElement('li');
                emergencyPlus.innerHTML = '<a href="#" onclick="if(typeof openSalesAssistant===\'function\'){openSalesAssistant(event)}else{alert(\'Obnovte stránku F5\')}" style="background: linear-gradient(135deg, #ff1493, #e91e63) !important; color: white !important; padding: 0.5rem 1rem !important; border-radius: 20px !important; text-decoration: none !important; font-weight: bold !important; box-shadow: 0 4px 15px rgba(255, 20, 147, 0.4) !important;" title="Emergency prodejní asistent">🚨 ➕ PRODEJ</a>';
                navList.appendChild(emergencyPlus);
                console.log('🚨 NAVIGATION.JS: Emergency plus tlačítko přidáno!');
            }
        }
    }, 500);
}

// Multiple initialization attempts
console.log('🔵 NAVIGATION.JS: Spouštím multiple init...');

// Immediate attempt
setTimeout(() => {
    console.log('🔵 NAVIGATION.JS: Immediate attempt...');
    updateNavigation();
}, 10);

// DOM ready attempt  
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔵 NAVIGATION.JS: DOM loaded attempt...');
    setTimeout(() => {
        updateNavigation();
        
        // Force check
        setTimeout(() => {
            const navItems = document.querySelectorAll('nav ul li');
            if (navItems.length < 3) {
                console.log('🚨 NAVIGATION.JS: Navigace neúplná, force creating...');
                forceCreateNavigation();
            }
        }, 500);
    }, 100);
});

// Window load attempt
window.addEventListener('load', function() {
    console.log('🔵 NAVIGATION.JS: Window loaded attempt...');
    setTimeout(() => {
        updateNavigation();
        
        // Final force check
        setTimeout(() => {
            const navItems = document.querySelectorAll('nav ul li');
            const plusButton = document.querySelector('a[onclick*="openSalesAssistant"]');
            
            if (navItems.length < 3 || !plusButton) {
                console.log('🚨 NAVIGATION.JS: Final force creation...');
                forceCreateNavigation();
            }
        }, 1000);
    }, 200);
});

// Interval backup for stubborn cases
let navigationAttempts = 0;
const navigationInterval = setInterval(() => {
    navigationAttempts++;
    console.log(`🔵 NAVIGATION.JS: Interval attempt ${navigationAttempts}...`);
    
    const navList = document.querySelector('nav ul');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (navList && isLoggedIn && navList.children.length < 3) {
        console.log('🔵 NAVIGATION.JS: Interval triggering navigation...');
        updateNavigation();
    }
    
    // Stop after 10 attempts or when navigation is complete
    const navItems = document.querySelectorAll('nav ul li');
    const plusButton = document.querySelector('a[onclick*="openSalesAssistant"]');
    
    if (navigationAttempts >= 10 || (navItems.length >= 3 && plusButton)) {
        clearInterval(navigationInterval);
        console.log('🔵 NAVIGATION.JS: Interval stopped, navigation complete');
    }
}, 1000);

console.log('🔵 NAVIGATION.JS: Script úspěšně načten a připraven'); 