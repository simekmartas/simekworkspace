// Accessibility Enhancement System
class AccessibilityEnhancements {
  constructor() {
    this.focusHistory = [];
    this.skipLinks = [];
    this.ariaLiveRegions = new Map();
    
    this.init();
  }

  init() {
    // Neaktivuj accessibility toolbar na index.html
    if (window.location.pathname.endsWith('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('/')) {
      console.log('🚫 Accessibility Enhancements zakázány na úvodní stránce');
      return;
    }
    
    this.setupKeyboardNavigation();
    this.setupSkipLinks();
    this.setupAriaLabels();
    this.setupFocusManagement();
    this.setupScreenReaderSupport();
    this.setupColorContrastChecker();
    this.setupReducedMotionSupport();
    this.setupTextScaling();
    this.setupAccessibilityToolbar();
  }

  setupKeyboardNavigation() {
    // Globální klávesové zkratky
    document.addEventListener('keydown', (e) => {
      // Alt + 1: Přejít na hlavní obsah
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        this.focusMainContent();
      }
      
      // Alt + 2: Přejít na navigaci
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        this.focusNavigation();
      }
      
      // Alt + 3: Přejít na vyhledávání
      if (e.altKey && e.key === '3') {
        e.preventDefault();
        this.focusSearch();
      }
      
      // Escape: Zavřít modály/dropdowny
      if (e.key === 'Escape') {
        this.closeModalsAndDropdowns();
      }
      
      // Tab trapping v modálech
      if (e.key === 'Tab') {
        this.handleTabTrapping(e);
      }
    });

    // Vylepšení focus indikátorů
    this.enhanceFocusIndicators();
  }

  setupSkipLinks() {
    const skipLinksHTML = `
      <div class="skip-links" aria-label="Odkazy pro přeskočení">
        <a href="#main-content" class="skip-link">Přeskočit na hlavní obsah</a>
        <a href="#main-navigation" class="skip-link">Přeskočit na navigaci</a>
        <a href="#search" class="skip-link">Přeskočit na vyhledávání</a>
        <a href="#footer" class="skip-link">Přeskočit na zápatí</a>
      </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', skipLinksHTML);
    
    // Styly pro skip links
    const skipLinkStyles = `
      .skip-links {
        position: absolute;
        top: -100px;
        left: 0;
        z-index: 10000;
      }
      
      .skip-link {
        position: absolute;
        top: -100px;
        left: 8px;
        padding: 8px 16px;
        background: #000;
        color: #fff;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        z-index: 10001;
        transition: top 0.2s ease;
      }
      
      .skip-link:focus {
        top: 8px;
      }
    `;
    
    this.addStyles('skip-links-styles', skipLinkStyles);
  }

  setupAriaLabels() {
    // Automatické přidání ARIA labelů
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
      if (!button.textContent.trim()) {
        const context = this.getElementContext(button);
        button.setAttribute('aria-label', context || 'Tlačítko');
      }
    });

    // Přidání landmarks
    this.addLandmarks();
    
    // Live regions pro dynamický obsah
    this.setupLiveRegions();
  }

  addLandmarks() {
    // Hlavní navigace
    const nav = document.querySelector('nav:not([role])');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Hlavní navigace');
    }

    // Hlavní obsah
    let main = document.querySelector('main');
    if (!main) {
      main = document.querySelector('#main-content, .main-content');
      if (main && main.tagName !== 'MAIN') {
        main.setAttribute('role', 'main');
      }
    }
    if (main) {
      main.id = main.id || 'main-content';
    }

    // Vyhledávání
    const searchForm = document.querySelector('form[role="search"], .search-form');
    if (searchForm) {
      searchForm.setAttribute('role', 'search');
      searchForm.setAttribute('aria-label', 'Vyhledávání na webu');
    }

    // Zápatí
    const footer = document.querySelector('footer');
    if (footer) {
      footer.setAttribute('role', 'contentinfo');
    }
  }

  setupLiveRegions() {
    // Vytvoření live region pro oznámení
    const announcements = document.createElement('div');
    announcements.id = 'accessibility-announcements';
    announcements.setAttribute('aria-live', 'polite');
    announcements.setAttribute('aria-atomic', 'true');
    announcements.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcements);
    
    this.ariaLiveRegions.set('announcements', announcements);

    // Live region pro chyby
    const errors = document.createElement('div');
    errors.id = 'accessibility-errors';
    errors.setAttribute('aria-live', 'assertive');
    errors.setAttribute('aria-atomic', 'true');
    errors.style.cssText = announcements.style.cssText;
    document.body.appendChild(errors);
    
    this.ariaLiveRegions.set('errors', errors);
  }

  setupFocusManagement() {
    // Sledování historie focusu pro modály
    document.addEventListener('focusin', (e) => {
      this.focusHistory.push(e.target);
      if (this.focusHistory.length > 10) {
        this.focusHistory = this.focusHistory.slice(-5);
      }
    });

    // Vylepšení focus managementu pro SPA
    this.setupSPAFocusManagement();
  }

  setupSPAFocusManagement() {
    // Sledování změn URL
    let lastUrl = location.href;
    
    const observer = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        this.handlePageChange();
      }
    });
    
    observer.observe(document, { subtree: true, childList: true });
  }

  handlePageChange() {
    // Po změně stránky přesuneme focus na hlavní obsah
    setTimeout(() => {
      const mainContent = document.querySelector('#main-content, main, [role="main"]');
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
        this.announce('Stránka byla načtena');
      }
    }, 100);
  }

  setupScreenReaderSupport() {
    // Označení načítajících se prvků
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.enhanceNewElements(node);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Vylepšení tabulek
    this.enhanceTables();
    
    // Vylepšení seznamů
    this.enhanceLists();
  }

  enhanceNewElements(element) {
    // Přidání ARIA labelů pro nové prvky
    const buttons = element.querySelectorAll?.('button:not([aria-label])') || [];
    buttons.forEach(button => {
      if (!button.textContent.trim()) {
        const context = this.getElementContext(button);
        button.setAttribute('aria-label', context || 'Tlačítko');
      }
    });

    // Loading states
    const loadingElements = element.querySelectorAll?.('.loading, [data-loading]') || [];
    loadingElements.forEach(el => {
      el.setAttribute('aria-busy', 'true');
      el.setAttribute('aria-label', 'Načítá se...');
    });
  }

  enhanceTables() {
    document.querySelectorAll('table').forEach(table => {
      // Přidání summary pro tabulky
      if (!table.querySelector('caption') && !table.getAttribute('aria-label')) {
        const summary = this.generateTableSummary(table);
        table.setAttribute('aria-label', summary);
      }

      // Označení hlaviček
      table.querySelectorAll('th').forEach(th => {
        if (!th.getAttribute('scope')) {
          const isColumnHeader = th.parentNode.parentNode.tagName === 'THEAD' ||
                                th.parentNode.rowIndex === 0;
          th.setAttribute('scope', isColumnHeader ? 'col' : 'row');
        }
      });
    });
  }

  enhanceLists() {
    document.querySelectorAll('ul, ol').forEach(list => {
      const items = list.querySelectorAll('li');
      if (items.length > 0 && !list.getAttribute('aria-label')) {
        const type = list.tagName === 'UL' ? 'seznam' : 'číslovaný seznam';
        list.setAttribute('aria-label', `${type}, ${items.length} položek`);
      }
    });
  }

  setupColorContrastChecker() {
    if (window.location.hostname === 'localhost') {
      // Pouze ve vývoji
      this.checkColorContrast();
    }
  }

  checkColorContrast() {
    const elements = document.querySelectorAll('*');
    const warnings = [];

    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const backgroundColor = styles.backgroundColor;
      const color = styles.color;
      
      if (backgroundColor !== 'rgba(0, 0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
        const contrast = this.calculateContrast(color, backgroundColor);
        
        if (contrast < 4.5) {
          warnings.push({
            element,
            contrast: contrast.toFixed(2),
            recommendation: 'Zvyšte kontrast pro lepší čitelnost'
          });
        }
      }
    });

    if (warnings.length > 0) {
      console.group('⚠️ Accessibility: Problémy s kontrastem');
      warnings.forEach(warning => {
        console.warn(`Nízký kontrast (${warning.contrast}:1)`, warning.element);
      });
      console.groupEnd();
    }
  }

  calculateContrast(color1, color2) {
    // Zjednodušená kalkulace kontrastu
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    
    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  parseColor(color) {
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    const computedColor = window.getComputedStyle(div).color;
    document.body.removeChild(div);
    
    const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return [0, 0, 0];
  }

  getLuminance([r, g, b]) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  setupReducedMotionSupport() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
      document.documentElement.classList.add('reduce-motion');
    }

    prefersReducedMotion.addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    });

    // CSS pro reduced motion
    const reducedMotionStyles = `
      .reduce-motion *,
      .reduce-motion *::before,
      .reduce-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      
      .reduce-motion .parallax {
        transform: none !important;
      }
    `;
    
    this.addStyles('reduced-motion-styles', reducedMotionStyles);
  }

  setupTextScaling() {
    // Podpora pro text scaling
    const textScaleStyles = `
      @media (min-resolution: 2dppx) {
        body {
          font-size: calc(1rem + 0.1vw);
        }
      }
      
      @media (prefers-contrast: high) {
        * {
          text-shadow: none !important;
          box-shadow: none !important;
        }
        
        a {
          text-decoration: underline !important;
        }
      }
    `;
    
    this.addStyles('text-scaling-styles', textScaleStyles);
  }

  setupAccessibilityToolbar() {
    // Accessibility toolbar is disabled - pouze skip links a ARIA labeling
    console.log('🚫 Accessibility toolbar zakázán - jen skip links a ARIA labeling');
  }

  handleToolbarAction(action, button) {
    switch (action) {
      case 'increase-text':
        this.adjustTextSize(1.1);
        break;
      case 'decrease-text':
        this.adjustTextSize(0.9);
        break;
      case 'high-contrast':
        this.toggleHighContrast(button);
        break;
      case 'focus-mode':
        this.toggleFocusMode(button);
        break;
      case 'reading-guide':
        this.toggleReadingGuide(button);
        break;
    }
  }

  adjustTextSize(factor) {
    const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const newSize = Math.max(12, Math.min(24, currentSize * factor));
    document.documentElement.style.fontSize = newSize + 'px';
    
    this.announce(`Velikost textu změněna na ${Math.round(newSize)}px`);
  }

  toggleHighContrast(button) {
    document.body.classList.toggle('high-contrast');
    button.classList.toggle('active');
    
    const isActive = button.classList.contains('active');
    this.announce(isActive ? 'Vysoký kontrast zapnut' : 'Vysoký kontrast vypnut');
  }

  toggleFocusMode(button) {
    document.body.classList.toggle('focus-mode');
    button.classList.toggle('active');
    
    const isActive = button.classList.contains('active');
    this.announce(isActive ? 'Režim focusu zapnut' : 'Režim focusu vypnut');
  }

  toggleReadingGuide(button) {
    let guide = document.querySelector('.reading-guide');
    
    if (guide) {
      guide.remove();
      button.classList.remove('active');
      document.removeEventListener('mousemove', this.updateReadingGuide);
      this.announce('Čtecí vodítko vypnuto');
    } else {
      guide = document.createElement('div');
      guide.className = 'reading-guide';
      document.body.appendChild(guide);
      button.classList.add('active');
      
      this.updateReadingGuide = (e) => {
        guide.style.top = e.clientY + 'px';
      };
      
      document.addEventListener('mousemove', this.updateReadingGuide);
      this.announce('Čtecí vodítko zapnuto');
    }
  }

  // Utility funkce
  announce(message, priority = 'polite') {
    const region = priority === 'assertive' ? 
      this.ariaLiveRegions.get('errors') : 
      this.ariaLiveRegions.get('announcements');
    
    if (region) {
      region.textContent = message;
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  focusMainContent() {
    const mainContent = document.querySelector('#main-content, main, [role="main"]');
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
    }
  }

  focusNavigation() {
    const nav = document.querySelector('nav, [role="navigation"]');
    if (nav) {
      const firstLink = nav.querySelector('a, button');
      if (firstLink) {
        firstLink.focus();
      }
    }
  }

  focusSearch() {
    const search = document.querySelector('[role="search"] input, .search-input, input[type="search"]');
    if (search) {
      search.focus();
    }
  }

  closeModalsAndDropdowns() {
    // Zavření modálů
    document.querySelectorAll('.modal.open, .modal.active').forEach(modal => {
      modal.classList.remove('open', 'active');
      const trigger = document.querySelector(`[aria-controls="${modal.id}"]`);
      if (trigger) {
        trigger.focus();
      }
    });

    // Zavření dropdownů
    document.querySelectorAll('.dropdown.open, .dropdown-menu.show').forEach(dropdown => {
      dropdown.classList.remove('open', 'show');
    });
  }

  handleTabTrapping(e) {
    const activeModal = document.querySelector('.modal.open, .modal.active');
    if (!activeModal) return;

    const focusableElements = activeModal.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  enhanceFocusIndicators() {
    const focusStyles = `
      *:focus {
        outline: 2px solid var(--accent-color) !important;
        outline-offset: 2px !important;
      }
      
      button:focus,
      a:focus,
      input:focus,
      textarea:focus,
      select:focus {
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.3) !important;
      }
    `;
    
    this.addStyles('focus-indicators', focusStyles);
  }

  getElementContext(element) {
    // Pokus o získání kontextu prvku pro lepší labeling
    const parent = element.closest('[aria-label], [aria-labelledby], section, article');
    if (parent) {
      const label = parent.getAttribute('aria-label') || 
                   parent.querySelector('h1, h2, h3, h4, h5, h6')?.textContent;
      if (label) return `Tlačítko v sekci: ${label}`;
    }

    const siblings = Array.from(element.parentNode.children);
    const index = siblings.indexOf(element);
    return `Tlačítko ${index + 1} z ${siblings.length}`;
  }

  generateTableSummary(table) {
    const rows = table.querySelectorAll('tr').length;
    const cols = table.querySelector('tr')?.children.length || 0;
    return `Tabulka s ${rows} řádky a ${cols} sloupci`;
  }

  addStyles(id, css) {
    if (!document.querySelector(`#${id}`)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = css;
      document.head.appendChild(style);
    }
  }
}

// Inicializace
document.addEventListener('DOMContentLoaded', () => {
  window.accessibilityEnhancements = new AccessibilityEnhancements();
});

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityEnhancements;
} 