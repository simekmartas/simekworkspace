// Theme Toggle s pokročilými funkcemi
class ThemeManager {
  constructor() {
    this.init();
    this.setupSystemThemeDetection();
    this.setupPreferenceSync();
  }

  init() {
    // CSS Custom Properties pro témata
    this.themes = {
      light: {
        '--primary-bg': '#ffffff',
        '--secondary-bg': '#f8f9fa',
        '--text-primary': '#333333',
        '--text-secondary': '#666666',
        '--accent-color': '#007bff',
        '--border-color': '#e9ecef',
        '--shadow': '0 2px 10px rgba(0,0,0,0.1)',
        '--transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      },
      dark: {
        '--primary-bg': '#1a1a1a',
        '--secondary-bg': '#2d2d2d',
        '--text-primary': '#ffffff',
        '--text-secondary': '#cccccc',
        '--accent-color': '#4dabf5',
        '--border-color': '#404040',
        '--shadow': '0 2px 10px rgba(0,0,0,0.3)',
        '--transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      },
      auto: null // Automaticky detekuje systémové nastavení
    };

    this.currentTheme = this.getStoredTheme() || 'auto';
    this.applyTheme(this.currentTheme);
    this.createToggleButton();
  }

  getStoredTheme() {
    return localStorage.getItem('theme-preference');
  }

  setStoredTheme(theme) {
    localStorage.setItem('theme-preference', theme);
  }

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  applyTheme(themeName) {
    const theme = themeName === 'auto' ? this.getSystemTheme() : themeName;
    const properties = this.themes[theme];
    
    if (properties) {
      const root = document.documentElement;
      Object.entries(properties).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });
    }

    // Přidání třídy pro theme-specifické styly
    document.body.className = document.body.className.replace(/theme-\w+/, '');
    document.body.classList.add(`theme-${theme}`);
    
    // Uložení aktuálního tématu
    this.currentTheme = themeName;
    this.setStoredTheme(themeName);
    
    // Event pro ostatní komponenty
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: theme, preference: themeName } 
    }));
  }

  setupSystemThemeDetection() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addListener(() => {
      if (this.currentTheme === 'auto') {
        this.applyTheme('auto');
      }
    });
  }

  setupPreferenceSync() {
    // Synchronizace mezi taby
    window.addEventListener('storage', (e) => {
      if (e.key === 'theme-preference') {
        this.currentTheme = e.newValue || 'auto';
        this.applyTheme(this.currentTheme);
        this.updateToggleButton();
      }
    });
  }

  createToggleButton() {
    const button = document.querySelector('#theme-toggle') || this.createToggleElement();
    
    button.innerHTML = this.getThemeIcon(this.currentTheme);
    button.setAttribute('aria-label', `Přepnout na ${this.getNextTheme()} režim`);
    
    button.addEventListener('click', () => this.toggleTheme());
    
    // Klávesová zkratka Ctrl+Shift+T
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  createToggleElement() {
    const button = document.createElement('button');
    button.id = 'theme-toggle';
    button.className = 'theme-toggle-btn';
    button.setAttribute('type', 'button');
    
    // Přidání do navigace
    const nav = document.querySelector('nav') || document.querySelector('header');
    if (nav) {
      nav.appendChild(button);
    } else {
      document.body.appendChild(button);
    }
    
    return button;
  }

  toggleTheme() {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    this.applyTheme(nextTheme);
    this.updateToggleButton();
    
    // Haptic feedback pro mobilní zařízení
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  getNextTheme() {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.currentTheme);
    return themes[(currentIndex + 1) % themes.length];
  }

  getThemeIcon(theme) {
    const icons = {
      light: '☀️',
      dark: '🌙',
      auto: '🔄'
    };
    return `<span class="theme-icon">${icons[theme]}</span>
            <span class="theme-label">${theme}</span>`;
  }

  updateToggleButton() {
    const button = document.querySelector('#theme-toggle');
    if (button) {
      button.innerHTML = this.getThemeIcon(this.currentTheme);
      button.setAttribute('aria-label', `Přepnout na ${this.getNextTheme()} režim`);
    }
  }
}

// CSS styly pro theme toggle
const themeToggleStyles = `
.theme-toggle-btn {
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-primary);
  transition: var(--transition);
  box-shadow: var(--shadow);
}

.theme-toggle-btn:hover {
  background: var(--accent-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.theme-toggle-btn:active {
  transform: translateY(0);
}

.theme-icon {
  font-size: 16px;
}

.theme-label {
  font-weight: 500;
  text-transform: capitalize;
}

@media (max-width: 768px) {
  .theme-toggle-btn .theme-label {
    display: none;
  }
}
`;

// Přidání stylů do hlavy dokumentu
if (!document.querySelector('#theme-toggle-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'theme-toggle-styles';
  styleSheet.textContent = themeToggleStyles;
  document.head.appendChild(styleSheet);
}

// Inicializace
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});

// Export pro použití v jiných modulech
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
} 