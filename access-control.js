// Access Control Manager pro řízení přístupů podle rolí uživatelů
class AccessControlManager {
    constructor() {
        this.userRole = localStorage.getItem('role');
        this.isLoggedIn = localStorage.getItem('isLoggedIn');
        
        // Definice přístupových práv pro jednotlivé role
        this.permissions = {
            'Administrátor': {
                allowedPages: ['prodejny.html', 'servis.html', 'eshop.html', 'bazar.html', 'celkem.html', 'novinky.html', 'index.html'],
                description: 'Plný přístup ke všem sekcím'
            },
            'Administrator': {
                allowedPages: ['prodejny.html', 'servis.html', 'eshop.html', 'bazar.html', 'celkem.html', 'novinky.html', 'index.html'],
                description: 'Plný přístup ke všem sekcím (anglická verze)'
            },
            'Prodejce': {
                allowedPages: ['prodejny.html', 'bazar.html', 'novinky.html', 'index.html'],
                description: 'Přístup k sekcím Prodejny, Bazar a Novinky'
            }
        };
    }

    // Kontrola zda je uživatel přihlášen
    isUserLoggedIn() {
        return this.isLoggedIn === 'true';
    }

    // Získání aktuální role uživatele
    getUserRole() {
        return this.userRole;
    }

    // Kontrola zda má uživatel přístup k určité stránce
    hasAccessToPage(pageName) {
        if (!this.isUserLoggedIn()) {
            return false;
        }

        const rolePermissions = this.permissions[this.userRole];
        if (!rolePermissions) {
            console.warn(`Neznámá role uživatele: ${this.userRole}`);
            return false;
        }

        return rolePermissions.allowedPages.includes(pageName);
    }

    // Získání aktuální stránky
    getCurrentPage() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    // Hlavní funkce pro kontrolu přístupu
    checkPageAccess() {
        // Nejprve kontrola přihlášení
        if (!this.isUserLoggedIn()) {
            console.log('Uživatel není přihlášen, přesměrování na login');
            this.redirectToLogin();
            return false;
        }

        const currentPage = this.getCurrentPage();
        console.log(`Kontrola přístupu - Stránka: ${currentPage}, Role: ${this.userRole}`);

        // Kontrola přístupových práv
        if (!this.hasAccessToPage(currentPage)) {
            console.warn(`Přístup zamítnut - Role "${this.userRole}" nemá oprávnění k stránce "${currentPage}"`);
            this.showAccessDenied();
            return false;
        }

        console.log(`Přístup povolen pro roli "${this.userRole}" ke stránce "${currentPage}"`);
        return true;
    }

    // Přesměrování na login stránku
    redirectToLogin() {
        window.location.replace('login.html');
    }

    // Zobrazení chyby přístupu
    showAccessDenied() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 2rem;
                text-align: center;
                background: var(--bg-primary);
                color: var(--text-primary);
                font-family: 'Inter', sans-serif;
            ">
                <div style="
                    max-width: 500px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-light);
                    border-radius: 1rem;
                    padding: 3rem 2rem;
                    box-shadow: var(--shadow-large);
                ">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🚫</div>
                    <h1 style="color: var(--error); margin-bottom: 1rem;">Přístup zamítnut</h1>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                        Vaše role "${this.userRole}" nemá oprávnění k této stránce.
                    </p>
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <button onclick="window.location.href='index.html'" style="
                            background: var(--accent-blue);
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 0.5rem;
                            cursor: pointer;
                            font-size: 0.875rem;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        ">
                            🏠 Zpět na hlavní stránku
                        </button>
                        <button onclick="window.location.href='prodejny.html'" style="
                            background: var(--accent-pink);
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 0.5rem;
                            cursor: pointer;
                            font-size: 0.875rem;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        ">
                            📊 Prodejny
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Inicializace kontroly přístupu pro stránku
    initialize() {
        // Kontrola přístupu
        const hasAccess = this.checkPageAccess();
        
        if (hasAccess) {
            // Přístup povolen - zobrazit obsah
            document.body.classList.add('authenticated');
            console.log('Stránka inicializována s úspěšnou autentifikací');
        }

        // Nastavení event listeneru pro kontrolu při změnách
        this.setupEventListeners();
        
        return hasAccess;
    }

    // Nastavení event listenerů pro sledování změn
    setupEventListeners() {
        // Kontrola při změně localStorage (odhlášení v jiném tabu)
        window.addEventListener('storage', (e) => {
            if (e.key === 'isLoggedIn' && !e.newValue) {
                console.log('Uživatel byl odhlášen v jiném tabu');
                this.redirectToLogin();
            }
            if (e.key === 'role') {
                console.log('Role uživatele byla změněna, kontrola přístupu');
                this.userRole = e.newValue;
                this.checkPageAccess();
            }
        });

        // Kontrola při návratu na stránku
        window.addEventListener('focus', () => {
            if (!this.isUserLoggedIn()) {
                console.log('Kontrola při návratu na stránku - uživatel není přihlášen');
                this.redirectToLogin();
            }
        });

        // Kontrola při načtení stránky
        window.addEventListener('pageshow', () => {
            this.checkPageAccess();
        });
    }

    // Statická metoda pro snadné použití
    static initializePageAccess() {
        const accessManager = new AccessControlManager();
        return accessManager.initialize();
    }

    // Získání povolených stránek pro aktuální roli
    getAllowedPages() {
        const rolePermissions = this.permissions[this.userRole];
        return rolePermissions ? rolePermissions.allowedPages : [];
    }

    // Kontrola zda má role přístup k určité sekci
    canAccessSection(section) {
        const sectionPages = {
            'prodejny': 'prodejny.html',
            'servis': 'servis.html', 
            'eshop': 'eshop.html',
            'bazar': 'bazar.html',
            'celkem': 'celkem.html'
        };

        const pageName = sectionPages[section.toLowerCase()];
        return pageName ? this.hasAccessToPage(pageName) : false;
    }
}

// Export pro globální použití
window.AccessControlManager = AccessControlManager;

// Automatická inicializace pro chráněné stránky
document.addEventListener('DOMContentLoaded', function() {
    // Kontrola zda je to chráněná stránka (má třídu protected-page)
    if (document.body.classList.contains('protected-page')) {
        console.log('Detekována chráněná stránka, inicializuji access control');
        AccessControlManager.initializePageAccess();
    }
}); 