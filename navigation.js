// Funkce pro aktualizaci navigace podle stavu přihlášení
function updateNavigation() {
    const nav = document.querySelector('nav ul');
    if (!nav) {
        console.error('Navigation ul element not found!');
        return;
    }
    
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('role');
    
    // Přidání hamburger menu pro mobily
    const headerContent = document.querySelector('.header-content');
    if (headerContent && !headerContent.querySelector('.hamburger')) {
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.setAttribute('aria-label', 'Otevřít menu');
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        
        // Vložit hamburger před navigaci
        const nav = headerContent.querySelector('nav');
        if (nav) {
            headerContent.insertBefore(hamburger, nav);
        } else {
            headerContent.appendChild(hamburger);
        }
    }
    
    // Theme toggle button bude vytvořen theme-toggle.js
    // Pouze zkontrolujeme, že theme manager existuje
    setTimeout(() => {
        if (window.themeManager) {
            window.themeManager.updateAllToggleButtons();
            console.log('Theme manager aktualizován v navigation.js');
        }
    }, 100);
    
    // Základní položky menu pro všechny uživatele
    const baseItems = `
        <li><a href="index.html">Domů</a></li>
        <li><a href="index.html#o-nas">O nás</a></li>
        <li><a href="index.html#kontakt">Kontakt</a></li>
    `;
    
    // Položky pouze pro prodejce (Prodejny + formulář výkupu + Novinky)
    const prodejceItems = `
        <li><a href="prodejny.html">Prodejny</a></li>
        <li><a href="bazar.html" onclick="openNewBazarForm(event)">➕ Přidat výkup</a></li>
        <li><a href="novinky.html">📢 Novinky</a></li>
        <li><a href="#" id="logout">Odhlásit</a></li>
    `;
    
    // Položky pro administrátora (všechny sekce) - Novinky přímo v menu
    const adminItems = `
        <li class="dropdown">
            <a href="#" class="dropdown-toggle">Mobil Maják</a>
            <ul class="dropdown-menu">
                <li><a href="prodejny.html">Prodejny</a></li>
                <li><a href="servis.html">Servis</a></li>
                <li><a href="eshop.html">Eshop</a></li>
                <li class="dropdown-submenu">
                    <a href="bazar.html" class="dropdown-submenu-toggle">Bazar</a>
                    <ul class="dropdown-submenu-menu">
                        <li><a href="bazar.html">Přehled bazaru</a></li>
                        <li><a href="bazar.html" onclick="openNewBazarForm(event)" style="padding-left: 1rem; padding-right: 1rem;">➕ Přidat nový výkup</a></li>
                    </ul>
                </li>
                <li><a href="celkem.html">Celkem</a></li>
            </ul>
        </li>
        <li><a href="novinky.html">📢 Novinky</a></li>
        <li><a href="#" id="logout">Odhlásit</a></li>
    `;
    
    // Položka pro nepřihlášené uživatele
    const loginItem = `
        <li><a href="login.html" class="btn btn-primary" style="margin-left: 1rem;">Přihlásit</a></li>
    `;
    
    // Aktualizace navigace podle role uživatele
    if (isLoggedIn) {
        if (userRole === 'Prodejce') {
            nav.innerHTML = baseItems + prodejceItems;
        } else if (userRole === 'Administrator' || userRole === 'Administrátor') { // Administrátor v obou jazykových verzích
            nav.innerHTML = baseItems + adminItems;
        } else {
            nav.innerHTML = baseItems + loginItem;
        }
    } else {
        nav.innerHTML = baseItems + loginItem;
    }
    
    // Přidání event listeneru pro odhlášení
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show confirmation dialog
            if (confirm('Opravdu se chcete odhlásit?')) {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('username');
                localStorage.removeItem('role');
                
                // Add visual feedback
                logoutButton.textContent = 'Odhlašování...';
                logoutButton.style.opacity = '0.6';
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            }
        });
    }

    // Aktualizovat theme toggle a nastavovací tlačítka po aktualizaci navigace
    setTimeout(() => {
        if (window.themeManager) {
            console.log('🔄 Aktualizuji theme buttons z navigation.js');
            window.themeManager.updateAllToggleButtons();
            console.log('Theme toggle buttons aktualizovány po aktualizaci navigace');
        } else {
            console.warn('⚠️ themeManager není dostupný v navigation.js');
        }
    }, 100);
    
    // Přidání event listeneru pro dropdown menu
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdown = document.querySelector('.dropdown');
    
    if (dropdownToggle && dropdown) {
        // Kliknutí na dropdown toggle
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
        
        // Zavření dropdown při kliknutí mimo (pouze pokud není mobilní menu otevřené)
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target) && !nav.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        });
        
        // Desktop hover efekty (pouze na desktopu)
        if (window.innerWidth > 768) {
            dropdown.addEventListener('mouseenter', function() {
                dropdown.classList.add('active');
            });
            
            dropdown.addEventListener('mouseleave', function() {
                dropdown.classList.remove('active');
            });
        }
        
        // Kliknutí na dropdown položky - zavřít menu na mobilu
        const dropdownLinks = dropdown.querySelectorAll('.dropdown-menu a');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    dropdown.classList.remove('active');
                    const hamburger = document.querySelector('.hamburger');
                    if (hamburger) {
                        hamburger.classList.remove('active');
                        nav.classList.remove('active');
                    }
                }
            });
        });
        
        // Mobilní submenu functionality
        const submenuToggle = dropdown.querySelector('.dropdown-submenu-toggle');
        const submenu = dropdown.querySelector('.dropdown-submenu');
        
        if (submenuToggle && submenu) {
            submenuToggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    e.stopPropagation();
                    submenu.classList.toggle('active');
                }
            });
        }
    }
    
    // Hamburger menu funkcionalita
    const hamburger = document.querySelector('.hamburger');
    
    console.log('🍔 Hamburger element:', hamburger);
    console.log('📱 Window width:', window.innerWidth);
    
    if (hamburger) {
        console.log('✅ Hamburger nalezen, přidávám event listener');
        hamburger.addEventListener('click', function(e) {
            console.log('🖱️ Klik na hamburger!');
            e.stopPropagation();
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
            
            // Update aria label
            const isActive = hamburger.classList.contains('active');
            hamburger.setAttribute('aria-label', isActive ? 'Zavřít menu' : 'Otevřít menu');
            
            console.log('🔄 Menu stav:', isActive ? 'OTEVŘENÉ' : 'ZAVŘENÉ');
            console.log('🧭 Nav classes:', nav.className);
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = isActive ? 'hidden' : '';
        });
    } else {
        console.error('❌ Hamburger element nebyl nalezen!');
    }
    
    if (hamburger) {
        
        // Zavření menu při kliknutí mimo menu
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = '';
                
                // Zavřít i dropdown pouze na mobilu
                if (dropdown && window.innerWidth <= 768) {
                    dropdown.classList.remove('active');
                }
            }
        });
        
        // Zavření menu při kliknutí na odkaz (ale ne dropdown toggle)
        nav.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' && !e.target.classList.contains('dropdown-toggle')) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Zavření menu při resize okna
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Mark active page in navigation
    markActivePage();
}

// Function to mark active page in navigation
function markActivePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkPath = new URL(link.href).pathname.split('/').pop();
        
        if (linkPath === currentPage || 
            (currentPage === '' && linkPath === 'index.html') ||
            (currentPage === 'index.html' && linkPath === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Enhanced smooth scrolling for anchor links
function enhanceSmoothScrolling() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('a[href^="#"]') || e.target.closest('a[href^="#"]')) {
            e.preventDefault();
            
            const link = e.target.matches('a[href^="#"]') ? e.target : e.target.closest('a[href^="#"]');
            const targetId = link.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            
            if (targetEl) {
                const headerHeight = 64; // Header height
                const targetPosition = targetEl.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const hamburger = document.querySelector('.hamburger');
                const nav = document.querySelector('nav ul');
                if (hamburger && hamburger.classList.contains('active')) {
                    hamburger.classList.remove('active');
                    nav.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        }
    });
}

// Initialize navigation enhancements
function initNavigation() {
    console.log('Inicializuji navigaci...');
    updateNavigation();
    enhanceSmoothScrolling();
    
    // Update navigation on storage changes (for multi-tab sync)
    window.addEventListener('storage', function(e) {
        if (e.key === 'isLoggedIn') {
            updateNavigation();
        }
    });
    
    console.log('Navigace inicializována');
}

// Funkce pro otevření nového bazar formuláře z menu
function openNewBazarForm(event) {
    event.preventDefault();
    
    // Přesměrování na bazar.html a otevření formuláře
    if (window.location.pathname.includes('bazar.html')) {
        // Už jsme na bazar stránce, jen otevřeme formulář
        setTimeout(() => {
            const newBazarBtn = document.getElementById('newBazarBtn');
            const newBazarForm = document.getElementById('newBazarForm');
            
            if (newBazarBtn && newBazarForm) {
                newBazarForm.style.display = 'block';
                newBazarBtn.style.display = 'none';
                newBazarForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    } else {
        // Přesměrujeme na bazar.html s parametrem pro otevření formuláře
        window.location.href = 'bazar.html?openForm=true';
    }
}

// Spuštění při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    
    // Kontrola URL parametru pro automatické otevření formuláře
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openForm') === 'true' && window.location.pathname.includes('bazar.html')) {
        setTimeout(() => {
            const newBazarBtn = document.getElementById('newBazarBtn');
            const newBazarForm = document.getElementById('newBazarForm');
            
            if (newBazarBtn && newBazarForm) {
                newBazarForm.style.display = 'block';
                newBazarBtn.style.display = 'none';
                newBazarForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Vyčištění URL od parametru
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }, 500); // Delší timeout pro jistotu že se vše načte
    }
}); 