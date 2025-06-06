// Performance Monitor pro sledování výkonu aplikace
class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enableMetrics: true,
      enableUserTiming: true,
      enableResourceTiming: true,
      sampleRate: 0.1, // 10% sampling
      reportEndpoint: '/api/performance',
      ...options
    };
    
    this.metrics = new Map();
    this.init();
  }

  init() {
    if (!this.shouldSample()) return;
    
    this.setupPerformanceObserver();
    this.trackCoreWebVitals();
    this.trackPageLoad();
    this.trackUserInteractions();
    this.setupErrorTracking();
    
    // Automatické reportování každých 30 sekund
    setInterval(() => this.report(), 30000);
    
    // Report při ukončení stránky
    window.addEventListener('beforeunload', () => this.report());
  }

  shouldSample() {
    return Math.random() < this.options.sampleRate;
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Sledování paint metrik
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.addMetric(`paint.${entry.name}`, entry.startTime);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Sledování layout shift
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.addMetric('cls', clsValue);
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

      // Sledování largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.addMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  trackCoreWebVitals() {
    // First Input Delay
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = entry.processingStart - entry.startTime;
          this.addMetric('fid', fid);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    }

    // Time to Interactive (aproximace)
    this.measureTTI();
  }

  async measureTTI() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const navigationStart = performance.timing.navigationStart;
        const tti = performance.now();
        this.addMetric('tti', tti);
      });
    }
  }

  trackPageLoad() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.timing;
        const metrics = {
          'dns-lookup': perfData.domainLookupEnd - perfData.domainLookupStart,
          'tcp-connect': perfData.connectEnd - perfData.connectStart,
          'server-response': perfData.responseStart - perfData.requestStart,
          'page-download': perfData.responseEnd - perfData.responseStart,
          'dom-processing': perfData.domComplete - perfData.responseEnd,
          'total-load-time': perfData.loadEventEnd - perfData.navigationStart
        };

        Object.entries(metrics).forEach(([key, value]) => {
          this.addMetric(key, value);
        });
      }, 0);
    });
  }

  trackUserInteractions() {
    // Sledování kliků
    let clickStartTime;
    document.addEventListener('mousedown', () => {
      clickStartTime = performance.now();
    });

    document.addEventListener('click', (e) => {
      if (clickStartTime) {
        const clickDuration = performance.now() - clickStartTime;
        this.addMetric('click-response-time', clickDuration);
        
        // Sledování konkrétních prvků
        if (e.target.matches('button, a, [role="button"]')) {
          this.addMetric(`click-${e.target.tagName.toLowerCase()}`, clickDuration);
        }
      }
    });

    // Sledování scroll performance
    let isScrolling = false;
    let scrollStartTime;
    
    window.addEventListener('scroll', () => {
      if (!isScrolling) {
        scrollStartTime = performance.now();
        isScrolling = true;
        
        requestAnimationFrame(() => {
          const scrollDuration = performance.now() - scrollStartTime;
          this.addMetric('scroll-performance', scrollDuration);
          isScrolling = false;
        });
      }
    }, { passive: true });
  }

  setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (e) => {
      this.addMetric('js-errors', 1, 'counter');
      this.addEvent('error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        timestamp: Date.now()
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.addMetric('promise-rejections', 1, 'counter');
      this.addEvent('promise-rejection', {
        reason: e.reason,
        timestamp: Date.now()
      });
    });

    // Resource loading errors
    document.addEventListener('error', (e) => {
      if (e.target !== window) {
        this.addMetric('resource-errors', 1, 'counter');
        this.addEvent('resource-error', {
          src: e.target.src || e.target.href,
          tagName: e.target.tagName,
          timestamp: Date.now()
        });
      }
    }, true);
  }

  addMetric(name, value, type = 'gauge') {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { type, values: [], events: [] });
    }
    
    const metric = this.metrics.get(name);
    
    if (type === 'counter') {
      const lastValue = metric.values[metric.values.length - 1] || 0;
      metric.values.push(lastValue + value);
    } else {
      metric.values.push(value);
    }
    
    // Zachováme pouze posledních 100 hodnot
    if (metric.values.length > 100) {
      metric.values = metric.values.slice(-50);
    }
  }

  addEvent(name, data) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { type: 'event', values: [], events: [] });
    }
    
    const metric = this.metrics.get(name);
    metric.events.push(data);
    
    // Zachováme pouze posledních 50 eventů
    if (metric.events.length > 50) {
      metric.events = metric.events.slice(-25);
    }
  }

  getMetrics() {
    const summary = {};
    
    this.metrics.forEach((metric, name) => {
      if (metric.values.length > 0) {
        const values = metric.values;
        summary[name] = {
          type: metric.type,
          count: values.length,
          latest: values[values.length - 1],
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        };
        
        if (metric.events.length > 0) {
          summary[name].events = metric.events;
        }
      }
    });
    
    // Přidání systémových informací
    summary._meta = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: this.getConnectionInfo()
    };
    
    return summary;
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }
    return null;
  }

  async report() {
    if (!this.options.enableMetrics) return;
    
    const metrics = this.getMetrics();
    
    try {
      if (this.options.reportEndpoint) {
        await fetch(this.options.reportEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metrics)
        });
      }
      
      // Console log pro development
      if (window.location.hostname === 'localhost') {
        console.group('🔧 Performance Metrics');
        console.table(metrics);
        console.groupEnd();
      }
      
    } catch (error) {
      console.warn('Performance reporting failed:', error);
    }
  }

  // Public API
  startTiming(name) {
    performance.mark(`${name}-start`);
    return {
      end: () => {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          this.addMetric(`timing.${name}`, measure.duration);
        }
      }
    };
  }

  trackCustomMetric(name, value) {
    this.addMetric(`custom.${name}`, value);
  }

  trackEvent(name, data) {
    this.addEvent(`custom.${name}`, { ...data, timestamp: Date.now() });
  }
}

// Lazy Loading Monitor
class LazyLoadMonitor {
  constructor() {
    this.observer = null;
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadElement(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px'
      });
    }
  }

  loadElement(element) {
    if (element.dataset.src) {
      element.src = element.dataset.src;
      element.removeAttribute('data-src');
    }
    
    if (element.dataset.srcset) {
      element.srcset = element.dataset.srcset;
      element.removeAttribute('data-srcset');
    }
    
    element.classList.add('loaded');
    
    // Track loading performance
    if (window.performanceMonitor) {
      window.performanceMonitor.trackEvent('lazy-load', {
        element: element.tagName,
        src: element.src || element.dataset.src
      });
    }
  }

  observe(elements) {
    if (this.observer) {
      elements.forEach(el => this.observer.observe(el));
    }
  }
}

// Inicializace
document.addEventListener('DOMContentLoaded', () => {
  // Performance Monitor
  window.performanceMonitor = new PerformanceMonitor({
    sampleRate: window.location.hostname === 'localhost' ? 1 : 0.1
  });
  
  // Lazy Loading
  window.lazyLoadMonitor = new LazyLoadMonitor();
  
  // Auto-setup lazy loading pro obrázky
  const lazyImages = document.querySelectorAll('img[data-src]');
  if (lazyImages.length > 0) {
    window.lazyLoadMonitor.observe(lazyImages);
  }
});

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceMonitor, LazyLoadMonitor };
} 