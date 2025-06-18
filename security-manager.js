// 🔒 BEZPEČNOSTNÍ MANAGER PRO MOBIL MAJÁK
// Komplexní bezpečnostní systém pro ochranu aplikace

class SecurityManager {
    constructor() {
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hodin
        this.maxLoginAttempts = 5;
        this.loginAttemptWindow = 15 * 60 * 1000; // 15 minut
        this.init();
    }

    init() {
        console.log('🔒 SecurityManager inicializován (v pozadí)');
        // Spusti bezpečnostní funkce pouze pokud nejsou v konfliktu s existujícími systémy
        this.setupSessionMonitoring();
        this.setupCSRFProtection();
        this.preventCommonAttacks();
        
        // Nevypisuj chyby do konzole pokud není development mode
        if (!window.location.hostname.includes('localhost')) {
            this.silentMode = true;
        }
    }

    // === AUTENTIFIKACE A SESSION MANAGEMENT ===
    
    isValidSession() {
        const loginTime = localStorage.getItem('loginTime');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (!loginTime || !isLoggedIn || isLoggedIn !== 'true') {
            return false;
        }
        
        const sessionAge = Date.now() - parseInt(loginTime);
        if (sessionAge > this.sessionTimeout) {
            console.log('🔒 Session expired');
            this.clearSession();
            return false;
        }
        
        return true;
    }
    
    createSecureSession(userData) {
        // Vytvoř session pouze s nezbytnými daty
        const sessionData = {
            isLoggedIn: 'true',
            sessionId: this.generateSessionId(),
            userId: userData.id || '1',
            role: this.sanitizeRole(userData.role),
            loginTime: Date.now().toString(),
            lastActivity: Date.now().toString(),
            // NIKDY neukládej hesla!
            username: this.sanitizeString(userData.username || ''),
            displayName: this.sanitizeString(userData.displayName || userData.username || ''),
        };
        
        // Ulož pouze nezbytná data
        Object.keys(sessionData).forEach(key => {
            localStorage.setItem(key, sessionData[key]);
        });
        
        console.log('🔒 Secure session created');
        return sessionData;
    }
    
    clearSession() {
        // Vymaž všechna session data
        const sessionKeys = [
            'isLoggedIn', 'sessionId', 'userId', 'role', 'loginTime', 
            'lastActivity', 'username', 'displayName', 'userEmail', 
            'userPhone', 'userProdejna', 'sellerId', 'deviceType'
        ];
        
        sessionKeys.forEach(key => localStorage.removeItem(key));
        console.log('🔒 Session cleared');
    }
    
    // === RATE LIMITING PRO LOGIN ===
    
    checkRateLimit(identifier = 'general') {
        const key = `login_attempts_${identifier}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();
        
        // Vymaž staré pokusy
        const recentAttempts = attempts.filter(time => now - time < this.loginAttemptWindow);
        
        if (recentAttempts.length >= this.maxLoginAttempts) {
            const oldestAttempt = Math.min(...recentAttempts);
            const waitTime = Math.ceil((this.loginAttemptWindow - (now - oldestAttempt)) / 1000 / 60);
            throw new Error(`Příliš mnoho pokusů o přihlášení. Zkuste to za ${waitTime} minut.`);
        }
        
        return true;
    }
    
    recordLoginAttempt(identifier = 'general', success = false) {
        const key = `login_attempts_${identifier}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        
        if (!success) {
            attempts.push(Date.now());
            localStorage.setItem(key, JSON.stringify(attempts));
        } else {
            // Úspěšné přihlášení - vymaž pokusy
            localStorage.removeItem(key);
        }
    }
    
    // === INPUT SANITIZATION ===
    
    sanitizeString(input) {
        if (typeof input !== 'string') return '';
        return input
            .replace(/[<>\"'&]/g, '') // Odstranění nebezpečných znaků
            .trim()
            .substring(0, 255); // Omezení délky
    }
    
    sanitizeRole(role) {
        const allowedRoles = ['Administrator', 'Administrátor', 'Prodejce', 'admin'];
        return allowedRoles.includes(role) ? role : 'Prodejce';
    }
    
    // === API SECURITY ===
    
    async secureApiCall(url, options = {}) {
        // Kontrola session před API voláním
        if (!this.isValidSession()) {
            throw new Error('Platnost session vypršela');
        }
        
        // Přidání bezpečnostních headerů
        const secureHeaders = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Session-ID': localStorage.getItem('sessionId') || '',
            ...options.headers
        };
        
        const secureOptions = {
            ...options,
            headers: secureHeaders,
            credentials: 'same-origin'
        };
        
        try {
            const response = await fetch(url, secureOptions);
            
            // Kontrola response
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return response;
        } catch (error) {
            console.error('🔒 Secure API call failed:', error);
            throw error;
        }
    }
    
    // === CSRF OCHRANA ===
    
    setupCSRFProtection() {
        // Generuj CSRF token
        if (!localStorage.getItem('csrfToken')) {
            localStorage.setItem('csrfToken', this.generateCSRFToken());
        }
        
        // Přidej CSRF token do všech formulářů
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                const csrfInput = form.querySelector('input[name="csrf_token"]');
                if (!csrfInput) {
                    const token = document.createElement('input');
                    token.type = 'hidden';
                    token.name = 'csrf_token';
                    token.value = localStorage.getItem('csrfToken');
                    form.appendChild(token);
                }
            }
        });
    }
    
    generateCSRFToken() {
        return 'csrf_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    
    // === SESSION MONITORING ===
    
    setupSessionMonitoring() {
        // Aktualizuj last activity (pasivní monitoring)
        if (!window.securityActivityMonitor) {
            window.securityActivityMonitor = true;
            document.addEventListener('click', () => this.updateActivity(), { passive: true });
            document.addEventListener('keypress', () => this.updateActivity(), { passive: true });
        }
        
        // Kontrola session každých 5 minut (pouze pokud už neběží)
        if (!window.securitySessionChecker) {
            window.securitySessionChecker = setInterval(() => {
                if (!this.isValidSession()) {
                    this.handleSessionExpiry();
                }
            }, 5 * 60 * 1000);
        }
        
        // Monitoring změn v localStorage (jiné taby) - doplňkový
        if (!window.securityStorageMonitor) {
            window.securityStorageMonitor = true;
            window.addEventListener('storage', (e) => {
                if (e.key === 'isLoggedIn' && !e.newValue) {
                    // Pouze pokud už neřeší jiný systém
                    setTimeout(() => {
                        if (!localStorage.getItem('isLoggedIn')) {
                            window.location.href = 'login.html';
                        }
                    }, 100);
                }
            });
        }
    }
    
    updateActivity() {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            localStorage.setItem('lastActivity', Date.now().toString());
        }
    }
    
    handleSessionExpiry() {
        alert('Vaše přihlášení vypršelo. Budete přesměrováni na přihlašovací stránku.');
        this.clearSession();
        window.location.href = 'login.html';
    }
    
    // === OCHRANA PROTI ÚTOKŮM ===
    
    preventCommonAttacks() {
        // Ochrana proti XSS v URL parametrech
        this.sanitizeUrlParams();
        
        // Ochrana proti clickjacking
        if (window.top !== window.self) {
            console.warn('🔒 Možný clickjacking pokus detekován');
            window.top.location = window.self.location;
        }
        
        // Disabling developer tools (částečná ochrana)
        this.setupDevToolsDetection();
        
        // Ochrana proti hotlinking
        if (document.referrer && !this.isAllowedReferrer(document.referrer)) {
            console.warn('🔒 Podezřelý referrer:', document.referrer);
        }
    }
    
    sanitizeUrlParams() {
        const url = new URL(window.location);
        let changed = false;
        
        for (const [key, value] of url.searchParams) {
            const sanitized = this.sanitizeString(value);
            if (sanitized !== value) {
                url.searchParams.set(key, sanitized);
                changed = true;
            }
        }
        
        if (changed) {
            window.history.replaceState({}, '', url);
        }
    }
    
    setupDevToolsDetection() {
        // Detekce developer tools (ne 100% spolehlivé, ale odradí základní pokusy)
        let devtools = { open: false, orientation: null };
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
                if (!devtools.open) {
                    devtools.open = true;
                    console.warn('🔒 Developer tools detected');
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }
    
    isAllowedReferrer(referrer) {
        const allowed = [
            window.location.origin,
            'https://your-domain.netlify.app',
            'https://mobilmajak.cz'
        ];
        return allowed.some(domain => referrer.startsWith(domain));
    }
    
    // === ACCESS CONTROL ===
    
    hasPermission(resource, action = 'read') {
        const role = localStorage.getItem('role');
        const permissions = {
            'Administrator': ['*'],
            'Administrátor': ['*'],
            'admin': ['*'],
            'Prodejce': ['prodejny', 'bazar', 'novinky', 'user-profile']
        };
        
        const userPermissions = permissions[role] || [];
        return userPermissions.includes('*') || userPermissions.includes(resource);
    }
    
    enforcePageAccess(pageName) {
        // Kompatibilní s existujícím access-control.js
        // Pouze doplňuje bezpečnostní kontroly, nenahrazuje je
        
        // Pokud existuje AccessControlManager, nech ho rozhodnout
        if (window.AccessControlManager) {
            const accessManager = new window.AccessControlManager();
            const hasAccess = accessManager.checkPageAccess();
            if (!hasAccess) {
                return false; // AccessControlManager už zobrazil chybu
            }
        }
        
        // Doplňkové security kontroly
        if (!this.isValidSession()) {
            if (!this.silentMode) console.log('🔒 No valid session, redirecting to login');
            window.location.href = 'login.html';
            return false;
        }
        
        const resource = pageName.replace('.html', '');
        if (!this.hasPermission(resource)) {
            if (!this.silentMode) console.log('🔒 Access denied to', resource);
            // Pokud už AccessControlManager neřešil, zobraz chybu
            if (!window.AccessControlManager) {
                this.showAccessDenied();
            }
            return false;
        }
        
        return true;
    }
    
    showAccessDenied() {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; 
                        background: var(--bg-primary, #f5f5f5); font-family: Arial, sans-serif;">
                <div style="text-align: center; background: white; padding: 3rem; border-radius: 1rem; 
                           box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🚫</div>
                    <h2 style="color: #e74c3c; margin-bottom: 1rem;">Přístup zamítnut</h2>
                    <p style="color: #666; margin-bottom: 2rem;">
                        Nemáte oprávnění k zobrazení této stránky.
                    </p>
                    <button onclick="window.location.href='index.html'" 
                            style="background: #3498db; color: white; border: none; padding: 1rem 2rem; 
                                   border-radius: 0.5rem; cursor: pointer; font-size: 1rem;">
                        Zpět na hlavní stránku
                    </button>
                </div>
            </div>
        `;
    }
    
    // === UTILITY FUNKCE ===
    
    generateSessionId() {
        return 'session_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    // === STATICKÉ METODY PRO SNADNÉ POUŽITÍ ===
    
    static initialize() {
        if (!window.securityManager) {
            window.securityManager = new SecurityManager();
        }
        return window.securityManager;
    }
    
    static requireLogin() {
        const sm = SecurityManager.initialize();
        if (!sm.isValidSession()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
    
    static requirePermission(resource) {
        const sm = SecurityManager.initialize();
        return sm.hasPermission(resource);
    }
    
    static securePageLoad(pageName) {
        const sm = SecurityManager.initialize();
        return sm.enforcePageAccess(pageName);
    }
}

// Globální inicializace
document.addEventListener('DOMContentLoaded', () => {
    window.securityManager = SecurityManager.initialize();
    console.log('🔒 Security Manager ready');
});

// Export pro ostatní skripty
window.SecurityManager = SecurityManager; 