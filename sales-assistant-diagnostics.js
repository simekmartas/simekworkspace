/**
 * Diagnostika pro tlačítko prodejního asistenta
 * Testuje viditelnost a funkčnost na všech prohlížečích
 */

// Globální diagnostické funkce
window.SalesAssistantDiagnostics = {
    
    // 1. Test viditelnosti tlačítka
    testButtonVisibility: function() {
        console.log('🔍 === DIAGNOSTIKA TLAČÍTKA PRODEJNÍHO ASISTENTA ===');
        
        const results = {
            timestamp: new Date().toISOString(),
            browser: this.getBrowserInfo(),
            tests: {}
        };
        
        // Test DOM existence
        const button = document.querySelector('a[onclick*="openSalesAssistant"]');
        results.tests.domExists = !!button;
        
        if (button) {
            // Test computed styles
            const computedStyle = window.getComputedStyle(button);
            results.tests.styles = {
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                position: computedStyle.position,
                zIndex: computedStyle.zIndex,
                width: computedStyle.width,
                height: computedStyle.height,
                background: computedStyle.background,
                color: computedStyle.color
            };
            
            // Test bounding rect
            const rect = button.getBoundingClientRect();
            results.tests.boundingRect = {
                visible: rect.width > 0 && rect.height > 0,
                inViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
                rect: rect
            };
            
            // Test CSS conflicts
            results.tests.cssConflicts = this.detectCSSConflicts(button);
            
            // Test event handlers
            results.tests.eventHandlers = {
                onclick: typeof button.onclick === 'function',
                onclickAttribute: button.hasAttribute('onclick'),
                listenerCount: this.getEventListenerCount(button)
            };
            
            // Mark for debugging
            button.setAttribute('data-debug-time', Date.now());
            button.style.setProperty('--debug-marker', '"visible"', 'important');
            
        } else {
            results.tests.error = 'Tlačítko nenalezeno v DOM';
        }
        
        console.table(results.tests);
        return results;
    },
    
    // 2. Test načítání JS
    testScriptLoading: function() {
        console.log('🔍 === TEST NAČÍTÁNÍ SCRIPTŮ ===');
        
        const scripts = {
            'sales-assistant.js': typeof createSalesAssistantModal !== 'undefined',
            'navigation.js': typeof updateNavigation !== 'undefined',
            'theme-toggle.js': typeof initTheme !== 'undefined'
        };
        
        const functions = {
            'createSalesAssistantModal': typeof createSalesAssistantModal,
            'openSalesAssistant': typeof openSalesAssistant,
            'renderScenarioSelection': typeof renderScenarioSelection
        };
        
        console.table({ scripts, functions });
        return { scripts, functions };
    },
    
    // 3. Detekce CSS konfliktů
    detectCSSConflicts: function(element) {
        const conflicts = [];
        const style = window.getComputedStyle(element);
        
        // Check for problematic styles
        if (style.display === 'none') conflicts.push('display: none');
        if (style.visibility === 'hidden') conflicts.push('visibility: hidden');
        if (parseFloat(style.opacity) < 0.1) conflicts.push('opacity too low');
        if (style.position === 'absolute' && style.zIndex < 1000) conflicts.push('z-index too low');
        
        // Check for extension blocking
        if (element.style.cssText.includes('display: none !important')) {
            conflicts.push('EXTENSION_BLOCKED: element forcibly hidden');
        }
        
        return conflicts;
    },
    
    // 4. Browser info
    getBrowserInfo: function() {
        const ua = navigator.userAgent;
        return {
            userAgent: ua,
            isChrome: ua.includes('Chrome'),
            chromeVersion: ua.match(/Chrome\/(\d+)/)?.[1] || 'N/A',
            isWindows: ua.includes('Windows'),
            windowsVersion: ua.match(/Windows NT ([\d.]+)/)?.[1] || 'N/A',
            viewport: { width: window.innerWidth, height: window.innerHeight },
            devicePixelRatio: window.devicePixelRatio,
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        };
    },
    
    // 5. Force show button (emergency fix)
    forceShowButton: function() {
        console.log('🚨 FORCE SHOW BUTTON');
        
        let button = document.querySelector('a[onclick*="openSalesAssistant"]');
        
        if (!button) {
            // Create button if missing
            button = this.createEmergencyButton();
        }
        
        if (button) {
            // Reset to normal menu button style (remove any custom styling)
            button.style.cssText = '';
            button.removeAttribute('style');
            button.setAttribute('data-emergency-fix', 'true');
            button.title = 'Nový zákazník';
            button.textContent = 'Nový zákazník';
            
            console.log('✅ Emergency button restored to normal menu style');
            return true;
        }
        
        return false;
    },
    
    // 6. Create emergency button if missing
    createEmergencyButton: function() {
        console.log('🚨 Creating emergency button');
        
        const nav = document.querySelector('nav ul');
        if (!nav) return null;
        
        const li = document.createElement('li');
        const button = document.createElement('a');
        
        button.href = '#';
        button.textContent = 'Nový zákazník';
        button.title = 'Nový zákazník';
        button.setAttribute('onclick', 'openSalesAssistant(event)');
        button.setAttribute('data-emergency-created', 'true');
        
        li.appendChild(button);
        nav.appendChild(li);
        
        console.log('✅ Emergency menu button created');
        return button;
    },
    
    // 7. Event listener diagnostics
    getEventListenerCount: function(element) {
        try {
            // This is limited by browser security, but we can try
            const listeners = getEventListeners ? getEventListeners(element) : {};
            return Object.keys(listeners).length;
        } catch (e) {
            return 'unavailable';
        }
    },
    
    // 8. Auto-fix pro Chrome
    autoFixForChrome: function() {
        if (!navigator.userAgent.includes('Chrome')) return;
        
        console.log('🔧 Auto-fix for Chrome starting...');
        
        const button = document.querySelector('a[onclick*="openSalesAssistant"]');
        if (!button) {
            console.log('❌ Button not found, creating emergency button');
            this.forceShowButton();
            return;
        }
        
        // Chrome-specific fixes
        button.style.setProperty('-webkit-appearance', 'none', 'important');
        button.style.setProperty('appearance', 'none', 'important');
        button.style.setProperty('-webkit-user-select', 'none', 'important');
        button.style.setProperty('user-select', 'none', 'important');
        button.style.setProperty('will-change', 'transform', 'important');
        button.style.setProperty('-webkit-transform', 'translateZ(0)', 'important');
        button.style.setProperty('transform', 'translateZ(0)', 'important');
        
        // Force reflow
        button.offsetHeight;
        
        console.log('✅ Chrome-specific fixes applied');
    },
    
    // 9. Monitor continuous visibility
    startVisibilityMonitor: function() {
        console.log('👁️ Starting visibility monitor...');
        
        const monitor = () => {
            const button = document.querySelector('a[onclick*="openSalesAssistant"]');
            if (button) {
                const rect = button.getBoundingClientRect();
                const style = window.getComputedStyle(button);
                
                const isVisible = (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    parseFloat(style.opacity) > 0.1 &&
                    rect.width > 0 && rect.height > 0
                );
                
                if (!isVisible) {
                    console.warn('⚠️ Button became invisible:', {
                        display: style.display,
                        visibility: style.visibility,
                        opacity: style.opacity,
                        rect: rect
                    });
                    this.forceShowButton();
                }
            } else {
                console.warn('⚠️ Button disappeared from DOM');
                this.forceShowButton();
            }
        };
        
        // Monitor every 5 seconds
        setInterval(monitor, 5000);
        
        // Also monitor on DOM changes
        if (window.MutationObserver) {
            const observer = new MutationObserver(monitor);
            observer.observe(document.body, { childList: true, subtree: true });
        }
    },
    
    // 10. Full diagnostic report
    runFullDiagnostics: function() {
        console.log('🔍 === SPOUŠTÍM KOMPLETNÍ DIAGNOSTIKU ===');
        
        const report = {
            timestamp: new Date().toISOString(),
            browser: this.getBrowserInfo(),
            visibility: this.testButtonVisibility(),
            scripts: this.testScriptLoading(),
            chromeAutoFix: false
        };
        
        // Auto-fix for Chrome
        if (report.browser.isChrome) {
            this.autoFixForChrome();
            report.chromeAutoFix = true;
        }
        
        // Start monitoring
        this.startVisibilityMonitor();
        
        console.log('📊 KOMPLETNÍ REPORT:', report);
        
        // Store for later access
        window.lastDiagnosticReport = report;
        
        return report;
    }
};

// Console commands pro adminy
window.fixSalesButton = function() {
    return window.SalesAssistantDiagnostics.forceShowButton();
};

window.diagnoseSalesButton = function() {
    return window.SalesAssistantDiagnostics.runFullDiagnostics();
};

window.showSalesButtonInfo = function() {
    const button = document.querySelector('a[onclick*="openSalesAssistant"]');
    if (button) {
        console.log('🔍 Button info:', {
            element: button,
            styles: window.getComputedStyle(button),
            rect: button.getBoundingClientRect(),
            attributes: Array.from(button.attributes).map(a => ({ name: a.name, value: a.value }))
        });
    } else {
        console.log('❌ Button not found');
    }
};

// Auto-run diagnostics on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🚀 Sales Assistant Diagnostics loaded');
        
        // Auto-run for Chrome on Windows
        const isChrome = navigator.userAgent.includes('Chrome');
        const isWindows = navigator.userAgent.includes('Windows');
        
        if (isChrome && isWindows) {
            console.log('🔧 Chrome on Windows detected - running auto-diagnostics');
            window.SalesAssistantDiagnostics.runFullDiagnostics();
        }
    }, 1000);
});

// Export for console access
console.log('✅ Sales Assistant Diagnostics ready');
console.log('📋 Available commands: fixSalesButton(), diagnoseSalesButton(), showSalesButtonInfo()'); 