// Jednoduché a funkční přepínání témat
class ThemeToggle {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createToggleButton();
        this.createAdminSettingsButton();
    }

    applyTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
        
        // Update toggle button if it exists
        this.updateToggleButton();
    }

    createToggleButton() {
        // Najdi existující tlačítko (může být vytvořené navigation.js)
        let toggleButton = document.querySelector('.theme-toggle');
        
        if (!toggleButton) {
            toggleButton = document.createElement('button');
            toggleButton.className = 'theme-toggle';
            toggleButton.setAttribute('aria-label', 'Přepnout téma');
            
            // Přidat do header-content
            const headerContent = document.querySelector('.header-content');
            if (headerContent) {
                headerContent.appendChild(toggleButton);
            } else {
                document.body.appendChild(toggleButton);
            }
        }

        this.updateToggleButton();
        
        // Odstranit staré event listenery a přidat nový
        const newButton = toggleButton.cloneNode(true);
        toggleButton.parentNode.replaceChild(newButton, toggleButton);
        
        newButton.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    createAdminSettingsButton() {
        // Zkontroluj zda je uživatel přihlášen
        const userRole = localStorage.getItem('role');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        console.log('🔧 createAdminSettingsButton - isLoggedIn:', isLoggedIn, 'userRole:', userRole);
        console.log('🔧 isLoggedIn === "true":', isLoggedIn === 'true');
        console.log('🔧 typeof isLoggedIn:', typeof isLoggedIn);
        
        if (isLoggedIn !== 'true') {
            // Odstranit existující tlačítko pokud uživatel není přihlášen
            const existingButton = document.querySelector('.admin-settings-button');
            if (existingButton) {
                existingButton.remove();
                console.log('🗑️ Odstraněno nastavovací tlačítko - uživatel není přihlášen');
            }
            return;
        }

        // Najdi existující tlačítko administrátorských nastavení
        let settingsButton = document.querySelector('.admin-settings-button');
        
        if (!settingsButton) {
            settingsButton = document.createElement('button');
            settingsButton.className = 'admin-settings-button';
            settingsButton.setAttribute('aria-label', 'Uživatelská nastavení');
            settingsButton.innerHTML = '⚙️';
            
            // Přidat do navigace jako poslední položku
            const nav = document.querySelector('nav ul');
            const headerContent = document.querySelector('.header-content');
            const themeToggle = document.querySelector('.theme-toggle');
            
            console.log('🔧 Vytvářím nastavovací tlačítko - nav:', !!nav, 'headerContent:', !!headerContent, 'themeToggle:', !!themeToggle);
            
            if (nav) {
                // Přidat jako poslední položku v navigaci
                const li = document.createElement('li');
                li.appendChild(settingsButton);
                nav.appendChild(li);
                console.log('✅ Nastavovací tlačítko přidáno do navigace');
            } else if (headerContent && themeToggle) {
                // Fallback - vložit hned za theme toggle
                themeToggle.parentNode.insertBefore(settingsButton, themeToggle.nextSibling);
                console.log('✅ Nastavovací tlačítko přidáno za theme toggle');
            } else if (headerContent) {
                headerContent.appendChild(settingsButton);
                console.log('✅ Nastavovací tlačítko přidáno do headerContent');
            } else {
                // Poslední záložní možnost - přidat na konec body
                document.body.appendChild(settingsButton);
                console.warn('⚠️ Nastavovací tlačítko přidáno na konec body jako fallback');
            }
        } else {
            console.log('🔧 Nastavovací tlačítko už existuje');
        }

        // Odstranit staré event listenery a přidat nový
        const newButton = settingsButton.cloneNode(true);
        settingsButton.parentNode.replaceChild(newButton, settingsButton);
        
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.showUserMenu();
        });
    }

    showUserMenu() {
        // Odstranit existující menu pokud je otevřené
        const existingMenu = document.querySelector('.admin-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        // Zjistit roli uživatele
        const userRole = localStorage.getItem('role');
        const isAdmin = userRole === 'Administrator' || userRole === 'Administrátor';

        // Vytvořit dropdown menu
        const menu = document.createElement('div');
        menu.className = 'admin-menu';
        
        let menuContent = `
            <div class="admin-menu-item" data-action="user-profile">
                👤 Můj profil
            </div>
        `;
        
        // Přidat administrátorské možnosti pouze pro adminy
        if (isAdmin) {
            menuContent += `
                <div class="admin-menu-separator"></div>
                <div class="admin-menu-item" data-action="user-management">
                    👥 Správa uživatelů
                </div>
            `;
        }
        
        menu.innerHTML = menuContent;

        // Pozicovat menu vpravo nahoře
        menu.style.position = 'fixed';
        menu.style.top = '60px';
        menu.style.right = '20px';
        menu.style.zIndex = '1000';

        document.body.appendChild(menu);

        // Přidat event listenery pro menu položky
        menu.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (action === 'user-management') {
                window.location.href = 'user-management.html';
            } else if (action === 'user-profile') {
                window.location.href = 'user-profile.html';
            }
            menu.remove();
        });

        // Zavřít menu při kliknutí mimo
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !settingsButton.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    updateToggleButton() {
        const toggleButton = document.querySelector('.theme-toggle');
        if (toggleButton) {
            toggleButton.innerHTML = this.currentTheme === 'light' ? '🌙' : '☀️';
            toggleButton.setAttribute('aria-label', 
                `Přepnout na ${this.currentTheme === 'light' ? 'tmavý' : 'světlý'} režim`
            );
        }
    }

    updateAllToggleButtons() {
        this.updateToggleButton();
        this.createAdminSettingsButton(); // Aktualizovat i nastavovací tlačítko
    }
}

// CSS styly pro přepínač témat a admin nastavení
const themeStyles = `
.theme-toggle {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.3s ease;
    display: flex !important;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-left: 0.5rem;
    position: relative;
    z-index: 10;
}

.admin-settings-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: all 0.3s ease;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    color: inherit;
    text-decoration: none;
}

.admin-settings-button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
}

.theme-toggle:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

.theme-toggle:active, .admin-settings-button:active {
    transform: scale(0.95);
}

.admin-menu {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 180px;
    padding: 8px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
}

.admin-menu-item {
    padding: 12px 16px;
    cursor: pointer;
    color: #333;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
}

.admin-menu-item:hover {
    background: #f5f5f5;
    color: #333;
}

.admin-menu-separator {
    height: 1px;
    background: #e0e0e0;
    margin: 8px 0;
}

/* Světlý režim */
.theme-light {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --text-primary: #333333;
    --text-secondary: #666666;
    --accent-color: #ff1493;
    --border-light: #e9ecef;
    --shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Tmavý režim */
.theme-dark {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --accent-color: #ff1493;
    --border-light: #404040;
    --shadow: 0 2px 10px rgba(0,0,0,0.3);
}

/* Základní styly pro tmavý režim */
.theme-dark body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
}

.theme-dark header {
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-light);
}

.theme-dark nav a {
    color: var(--text-primary);
}

.theme-dark nav a:hover {
    color: var(--accent-color);
}

.theme-dark .btn-primary {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
}

.theme-dark input,
.theme-dark textarea {
    background-color: var(--bg-secondary);
    border-color: var(--border-light);
    color: var(--text-primary);
}

.theme-dark .stat-card {
    background-color: var(--bg-secondary);
    border-color: var(--border-light);
}
`;

// Přidání stylů do stránky
if (!document.querySelector('#theme-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'theme-styles';
    styleElement.textContent = themeStyles;
    document.head.appendChild(styleElement);
}

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Inicializuji ThemeToggle...');
    window.themeManager = new ThemeToggle();
    console.log('🎨 ThemeToggle inicializován');
});

// Debugging funkce - dostupná v konzoli
window.debugTheme = function() {
    console.log('🔍 Debug theme manageru:');
    console.log('- themeManager exists:', !!window.themeManager);
    console.log('- isLoggedIn:', localStorage.getItem('isLoggedIn'));
    console.log('- userRole:', localStorage.getItem('role'));
    console.log('- header-content exists:', !!document.querySelector('.header-content'));
    console.log('- nav ul exists:', !!document.querySelector('nav ul'));
    console.log('- theme-toggle exists:', !!document.querySelector('.theme-toggle'));
    console.log('- admin-settings-button exists:', !!document.querySelector('.admin-settings-button'));
    
    // Zobrazit počet elementů v navigaci
    const navItems = document.querySelectorAll('nav ul li');
    console.log('- nav items count:', navItems.length);
    navItems.forEach((item, index) => {
        console.log(`  - nav item ${index}:`, item.textContent.trim());
    });
    
    if (window.themeManager) {
        console.log('🔄 Force update buttons...');
        window.themeManager.updateAllToggleButtons();
    }
};

// Test login funkce - simuluje přihlášení prodejce
window.testLoginProdejce = function() {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId', '2');
    localStorage.setItem('role', 'Prodejce');
    localStorage.setItem('username', 'Tomáš Novák');
    localStorage.setItem('userEmail', 'tomas.novak@mobilmajak.cz');
    localStorage.setItem('userPhone', '+420777123456');
    localStorage.setItem('userProdejna', 'Praha 1');
    console.log('✅ Test přihlášení PRODEJCE nastaveno');
    console.log('📋 Role:', localStorage.getItem('role'));
    console.log('📋 IsLoggedIn:', localStorage.getItem('isLoggedIn'));
    
    // Aktualizuj navigaci a tlačítka
    if (typeof updateNavigation === 'function') {
        updateNavigation();
    }
    if (window.themeManager) {
        window.themeManager.updateAllToggleButtons();
    }
};

// Test login funkce - simuluje přihlášení admina
window.testLoginAdmin = function() {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId', '1');
    localStorage.setItem('role', 'Administrator');
    localStorage.setItem('username', 'Admin Administrátor');
    localStorage.setItem('userEmail', 'admin@mobilmajak.cz');
    localStorage.setItem('userPhone', '+420777888999');
    localStorage.setItem('userProdejna', 'Hlavní pobočka');
    console.log('✅ Test přihlášení ADMIN nastaveno');
    console.log('📋 Role:', localStorage.getItem('role'));
    console.log('📋 IsLoggedIn:', localStorage.getItem('isLoggedIn'));
    
    // Aktualizuj navigaci a tlačítka
    if (typeof updateNavigation === 'function') {
        updateNavigation();
    }
    if (window.themeManager) {
        window.themeManager.updateAllToggleButtons();
    }
};

// Funkce pro force refresh
window.forceRefreshUI = function() {
    console.log('🔄 Force refresh UI...');
    if (typeof updateNavigation === 'function') {
        updateNavigation();
    }
    if (window.themeManager) {
        window.themeManager.updateAllToggleButtons();
    }
};

// Export pro použití v jiných souborech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeToggle;
} 