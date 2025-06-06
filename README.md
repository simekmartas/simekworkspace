# 🚀 Mobil Maják - Enhanced Version

Modernizovaná webová aplikace s pokročilými funkcemi pro správu prodejních dat a statistik.

## ✨ Nové Funkce v Enhanced Version

### 🔧 Performance & Monitoring
- **Performance Monitor**: Sledování Core Web Vitals, FID, LCP, CLS
- **Real-time Analytics**: Automatické reportování výkonu
- **Error Tracking**: Sledování JS chyb a Promise rejections
- **Resource Monitoring**: Sledování načítání zdrojů

### 🌐 Offline & PWA
- **Service Worker**: Offline funkcionality a caching
- **Background Sync**: Synchronizace offline komentářů
- **PWA Manifest**: Instalovatelná jako nativní aplikace
- **Offline Support**: Práce bez internetového připojení

### 💬 Enhanced Comments System
- **Offline Comments**: Ukládání komentářů offline
- **Real-time Updates**: Live aktualizace přes SSE
- **Auto-save Drafts**: Automatické ukládání konceptů
- **Spam Detection**: Základní detekce spamu
- **Validace**: Pokročilá validace formulářů

### ♿ Accessibility (A11Y)
- **WCAG 2.1 Compliance**: Splňuje standardy přístupnosti
- **Keyboard Navigation**: Kompletní klávesová navigace
- **Screen Reader Support**: Podpora čteček obrazovky
- **Skip Links**: Navigační odkazy pro přeskočení
- **ARIA Labels**: Automatické přidávání ARIA atributů
- **Focus Management**: Pokročilé řízení focusu
- **Color Contrast**: Kontrola kontrastu barev
- **A11Y Toolbar**: Nástroje pro přístupnost

### 🎨 Enhanced Theming
- **CSS Custom Properties**: Pokročilý theming systém
- **Auto Theme Detection**: Automatická detekce systémového tématu
- **Theme Sync**: Synchronizace mezi taby
- **Reduced Motion**: Podpora pro snížené animace
- **High Contrast**: Režim vysokého kontrastu

### 📱 Mobile & Touch
- **Touch Optimization**: Optimalizace pro dotykové zařízení
- **Responsive Design**: Plně responzivní design
- **Mobile-first**: Mobilní přístup
- **Haptic Feedback**: Vibrační odezva

## 🏗️ Architektura

### 📁 Struktura Souborů

```
WEB/
├── 📄 index.html                    # Hlavní stránka
├── 🎨 styles.css                    # Základní styly
├── 🎨 progressive-enhancement.css   # Pokročilé styly
├── 📱 manifest.json                 # PWA manifest
├── ⚙️ sw.js                        # Service Worker
├── 
├── 📜 JavaScript Moduly:
├── ├── theme-toggle.js              # Pokročilý theming
├── ├── navigation.js                # Navigace
├── ├── performance-monitor.js       # Performance monitoring
├── ├── enhanced-comments.js         # Komentářový systém
├── ├── accessibility-enhancements.js # A11Y vylepšení
├── └── script.js                    # Hlavní logika
├── 
└── 📊 Data & API:
    ├── simple-novinky.js           # Novinky systém
    ├── bazar-data-loader.js        # Bazar data
    ├── prodejny-data-loader.js     # Prodejny data
    └── ...další data loadery
```

### 🔧 Technologie

- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **PWA**: Service Workers, Web App Manifest, Cache API
- **Performance**: Intersection Observer, Performance API, Web Vitals
- **Accessibility**: ARIA, WCAG 2.1, Screen Reader Support
- **Offline**: IndexedDB, Background Sync, Cache Strategies

## 🚀 Instalace a Spuštění

### Požadavky
- Webový server (Apache, Nginx, nebo lokální server)
- Moderní prohlížeč s podporou ES6+

### Rychlé spuštění
```bash
# Klonování repozitáře
git clone [repository-url]
cd WEB

# Spuštění lokálního serveru (Python)
python -m http.server 3000

# Nebo pomocí Node.js
npx serve . -p 3000

# Nebo pomocí PHP
php -S localhost:3000
```

### Produkční nasazení
1. Nahrání souborů na webový server
2. Konfigurace HTTPS (vyžadováno pro Service Workers)
3. Nastavení cache headers pro statické soubory
4. Konfigurace gzip komprese

## ⚙️ Konfigurace

### Performance Monitor
```javascript
// Nastavení performance monitoring
window.performanceMonitor = new PerformanceMonitor({
  sampleRate: 0.1,              // 10% sampling
  reportEndpoint: '/api/metrics', // Endpoint pro metriky
  enableMetrics: true,          // Zapnout monitoring
  enableUserTiming: true        // User timing API
});
```

### Enhanced Comments
```javascript
// Nastavení komentářového systému
window.enhancedComments = new EnhancedComments({
  maxLength: 1000,             // Max délka komentáře
  autoSave: true,              // Auto-save konceptů
  offlineSupport: true,        // Offline podpora
  realTimeUpdates: true,       // Real-time aktualizace
  moderationEnabled: true      // Moderace komentářů
});
```

### Theme Manager
```javascript
// Nastavení theming
window.themeManager = new ThemeManager({
  defaultTheme: 'auto',        // Výchozí téma
  syncAcrossTabs: true,        // Sync mezi taby
  systemDetection: true       // Detekce systémového tématu
});
```

## 🎯 Klávesové Zkratky

| Zkratka | Akce |
|---------|------|
| `Alt + 1` | Přejít na hlavní obsah |
| `Alt + 2` | Přejít na navigaci |
| `Alt + 3` | Přejít na vyhledávání |
| `Ctrl + Shift + T` | Přepnout téma |
| `Escape` | Zavřít modály/dropdowny |

## 📊 Performance Metriky

Aplikace automaticky sleduje:
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **TTI** (Time to Interactive)
- **TTFB** (Time to First Byte)

## ♿ Accessibility Features

### WCAG 2.1 Compliance
- ✅ Level AA compliance
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast 4.5:1+
- ✅ Focus management
- ✅ Alternative text
- ✅ Semantic HTML

### Accessibility Toolbar
- 🔤 Text size adjustment
- ⚫⚪ High contrast mode
- 🎯 Focus highlighting
- 📏 Reading guide
- 🔍 Focus mode

## 🌐 PWA Features

### Instalace
Aplikace může být nainstalována jako nativní aplikace na:
- 📱 Android (Chrome, Edge)
- 🍎 iOS (Safari)
- 💻 Desktop (Chrome, Edge)

### Offline Funkcionalita
- 💾 Cache důležitých zdrojů
- 📝 Offline ukládání komentářů
- 🔄 Background synchronizace
- 📱 Offline indikace

## 🔧 API Endpoints

### Performance API
```
POST /api/performance
Content-Type: application/json

{
  "metrics": { ... },
  "errors": [ ... ],
  "timing": { ... }
}
```

### Comments API
```
POST /api/comments
GET /api/comments/{postId}
PUT /api/comments/{id}
DELETE /api/comments/{id}
```

### SSE Stream
```
GET /api/comments/stream
EventSource connection for real-time updates
```

## 🎨 Theming

### CSS Custom Properties
```css
:root {
  --primary-bg: #ffffff;
  --secondary-bg: #f8f9fa;
  --text-primary: #333333;
  --accent-color: #007bff;
  --transition: all 0.3s ease;
  /* ... další proměnné */
}
```

### Dark Theme
Automatická detekce `prefers-color-scheme: dark` nebo manuální přepnutí.

## 📱 Mobile Optimalizace

- **Touch targets**: Minimální velikost 44px
- **Viewport**: Optimalizováno pro všechna zařízení
- **Performance**: Lazy loading, optimalizované obrázky
- **Gestures**: Podpora touch gest

## 🐛 Debugging

### Development Mode
V localhost režimu se aktivují:
- 📊 Performance console logs
- ⚠️ Accessibility warnings
- 🔍 Color contrast checking
- 📈 Detailed error reporting

### Console Commands
```javascript
// Performance metriky
console.log(window.performanceMonitor.getMetrics());

// Accessibility check
window.accessibilityEnhancements.checkColorContrast();

// Theme info
console.log(window.themeManager.currentTheme);
```

## 🔄 Updates & Maintenance

### Service Worker Updates
Service Worker se automaticky aktualizuje při změnách. Pro force refresh:
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) reg.update();
});
```

### Cache Management
```javascript
// Vyčištění cache
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

## 📈 Monitoring & Analytics

### Metriky
- 📊 Performance timing
- 🐛 Error tracking
- 👤 User interactions
- 🔄 API calls
- 📱 Device info

### Reporting
Automatické reportování do:
- Console (development)
- Custom endpoint (production)
- Local storage (fallback)

## 🤝 Contributing

### Development Workflow
1. Fork repozitář
2. Vytvoř feature branch
3. Implementuj změny
4. Testuj accessibility
5. Zkontroluj performance
6. Vytvoř pull request

### Code Style
- ES6+ JavaScript
- Semantic HTML
- BEM CSS metodologie
- WCAG 2.1 guidelines
- Progressive enhancement

## 📄 License

MIT License - viz LICENSE soubor

## 🆘 Support

Pro podporu a hlášení chyb:
- 📧 Email: [support-email]
- 🐛 Issues: [GitHub issues]
- 📖 Dokumentace: [docs-url]

---

**Vyvinuto s ❤️ pro lepší web accessibility a performance** 