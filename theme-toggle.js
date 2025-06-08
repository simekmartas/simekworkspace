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
        // Zkontroluj zda je uživatel přihlášen jako administrátor
        const userRole = localStorage.getItem('role');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (isLoggedIn !== 'true' || (userRole !== 'Administrator' && userRole !== 'Administrátor')) {
            // Odstranit existující tlačítko pokud uživatel není admin
            const existingButton = document.querySelector('.admin-settings-button');
            if (existingButton) {
                existingButton.remove();
            }
            return;
        }

        // Najdi existující tlačítko administrátorských nastavení
        let settingsButton = document.querySelector('.admin-settings-button');
        
        if (!settingsButton) {
            settingsButton = document.createElement('button');
            settingsButton.className = 'admin-settings-button';
            settingsButton.setAttribute('aria-label', 'Administrátorská nastavení');
            settingsButton.innerHTML = '⚙️';
            
            // Přidat do header-content vedle theme toggle
            const headerContent = document.querySelector('.header-content');
            const themeToggle = document.querySelector('.theme-toggle');
            
            if (headerContent && themeToggle) {
                // Vložit hned za theme toggle
                themeToggle.parentNode.insertBefore(settingsButton, themeToggle.nextSibling);
            } else if (headerContent) {
                headerContent.appendChild(settingsButton);
            }
        }

        // Odstranit staré event listenery a přidat nový
        const newButton = settingsButton.cloneNode(true);
        settingsButton.parentNode.replaceChild(newButton, settingsButton);
        
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAdminMenu();
        });
    }

    showAdminMenu() {
        // Odstranit existující menu pokud je otevřené
        const existingMenu = document.querySelector('.admin-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        // Vytvořit dropdown menu
        const menu = document.createElement('div');
        menu.className = 'admin-menu';
        menu.innerHTML = `
            <div class="admin-menu-item" data-action="user-management">
                👥 Nastavení uživatelů
            </div>
        `;

        // Pozicovat menu vedle tlačítka
        const settingsButton = document.querySelector('.admin-settings-button');
        if (settingsButton) {
            const rect = settingsButton.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.top = (rect.bottom + 5) + 'px';
            menu.style.right = '20px';
            menu.style.zIndex = '1000';
        }

        document.body.appendChild(menu);

        // Přidat event listenery pro menu položky
        menu.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (action === 'user-management') {
                window.location.href = 'user-management.html';
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
        this.createAdminSettingsButton(); // Aktualizovat i admin tlačítko
    }
}

// CSS styly pro přepínač témat a admin nastavení
const themeStyles = `
.theme-toggle, .admin-settings-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-left: 0.5rem;
}

.theme-toggle:hover, .admin-settings-button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
}

.theme-toggle:active, .admin-settings-button:active {
    transform: scale(0.95);
}

.admin-menu {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: 0.5rem;
    box-shadow: var(--shadow);
    min-width: 200px;
    padding: 0.5rem 0;
}

.admin-menu-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.admin-menu-item:hover {
    background: var(--accent-color);
    color: white;
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
    window.themeManager = new ThemeToggle();
});

// Export pro použití v jiných souborech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeToggle;
} 