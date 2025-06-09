// Přepínač témat s podporou tmavého režimu
class ThemeToggle {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        console.log('🎨 Inicializuji ThemeToggle...');
        
        // Aplikuj aktuální téma na body
        this.applyTheme();
        
        // Vytvoř theme toggle button
        this.createThemeToggle();
        
        // Přidej globální CSS styly
        this.injectStyles();
        
        console.log('🎨 ThemeToggle inicializován');
    }

    applyTheme() {
        document.body.className = `theme-${this.currentTheme}`;
        
        // Darkmode class pro kompatibilitu
        if (this.currentTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    createThemeToggle() {
        // Najdi nebo vytvoř header-controls
        let headerControls = document.querySelector('.header-controls');
        if (!headerControls) {
            const headerContent = document.querySelector('.header-content');
            if (headerContent) {
                headerControls = document.createElement('div');
                headerControls.className = 'header-controls';
                headerContent.appendChild(headerControls);
            }
        }

        // Vytvoř theme toggle tlačítko
        if (headerControls) {
            let themeToggle = document.querySelector('.theme-toggle');
            if (!themeToggle) {
                themeToggle = document.createElement('button');
                themeToggle.className = 'theme-toggle';
                themeToggle.setAttribute('aria-label', 'Přepnout téma');
                themeToggle.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
                
                // Vložit před hamburger nebo na konec
                const hamburger = document.querySelector('.hamburger');
                if (hamburger) {
                    headerControls.insertBefore(themeToggle, hamburger);
                } else {
                    headerControls.appendChild(themeToggle);
                }
            }

            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
        
        // Aktualizuj ikonu
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    injectStyles() {
        // CSS styly pro přepínač témat a admin nastavení
        const themeStyles = `
        .theme-toggle {
            background: transparent;
            border: none;
            border-radius: 0.375rem;
            padding: 0.5rem;
            cursor: pointer;
            color: #64748b;
            transition: all 0.2s ease;
            display: flex !important;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            text-decoration: none;
        }

        .dark-theme .theme-toggle {
            color: #94a3b8;
        }

        .theme-toggle:hover {
            color: #1e293b;
            background: rgba(100, 116, 139, 0.1);
        }

        .dark-theme .theme-toggle:hover {
            color: #f8fafc;
            background: rgba(148, 163, 184, 0.1);
        }

        .theme-toggle:active {
            transform: scale(0.95);
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
    }
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
    
    // Zobrazit počet elementů v navigaci
    const navItems = document.querySelectorAll('nav ul li');
    console.log('- nav items count:', navItems.length);
    navItems.forEach((item, index) => {
        console.log(`  - nav item ${index}:`, item.textContent.trim());
    });
    
    if (window.themeManager) {
        console.log('🔄 Force update buttons...');
        window.themeManager.createThemeToggle();
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
        window.themeManager.createThemeToggle();
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
        window.themeManager.createThemeToggle();
    }
};

// Funkce pro force refresh
window.forceRefreshUI = function() {
    console.log('🔄 Force refresh UI...');
    if (typeof updateNavigation === 'function') {
        updateNavigation();
    }
    if (window.themeManager) {
        window.themeManager.createThemeToggle();
    }
};

// Export pro použití v jiných souborech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeToggle;
} 