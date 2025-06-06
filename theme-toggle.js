// Jednoduché a funkční přepínání témat
class ThemeToggle {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createToggleButton();
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
        // Najdi existující tlačítko nebo vytvoř nové
        let toggleButton = document.querySelector('#theme-toggle');
        
        if (!toggleButton) {
            toggleButton = document.createElement('button');
            toggleButton.id = 'theme-toggle';
            toggleButton.className = 'theme-toggle';
            toggleButton.setAttribute('aria-label', 'Přepnout téma');
            
            // Přidat do navigace
            const nav = document.querySelector('nav ul');
            if (nav) {
                const li = document.createElement('li');
                li.appendChild(toggleButton);
                nav.appendChild(li);
            } else {
                document.body.appendChild(toggleButton);
            }
        }

        this.updateToggleButton();
        
        toggleButton.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    updateToggleButton() {
        const toggleButton = document.querySelector('#theme-toggle');
        if (toggleButton) {
            toggleButton.innerHTML = this.currentTheme === 'light' ? '🌙' : '☀️';
            toggleButton.setAttribute('aria-label', 
                `Přepnout na ${this.currentTheme === 'light' ? 'tmavý' : 'světlý'} režim`
            );
        }
    }

    updateAllToggleButtons() {
        this.updateToggleButton();
    }
}

// CSS styly pro přepínač témat
const themeStyles = `
.theme-toggle {
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
}

.theme-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
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

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeToggle();
});

// Export pro použití v jiných souborech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeToggle;
} 