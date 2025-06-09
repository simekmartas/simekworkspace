// Minimalistické menu systém
function updateNavigation() {
    const nav = document.querySelector('nav ul');
    if (!nav) {
        console.error('Navigation ul element not found!');
        return;
    }
    
    // Přidej header-controls container pokud neexistuje
    let headerControls = document.querySelector('.header-controls');
    if (!headerControls) {
        const headerContent = document.querySelector('.header-content');
        if (headerContent) {
            headerControls = document.createElement('div');
            headerControls.className = 'header-controls';
            headerContent.appendChild(headerControls);
        }
    }
    
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('role');
    
    // Čisté minimalistické menu - bez emoji
    const baseItems = `
        <li><a href="index.html">Domů</a></li>
        <li><a href="index.html#o-nas">O nás</a></li>
        <li><a href="index.html#kontakt">Kontakt</a></li>
    `;
    
    // Prodejce menu - čisté a jednoduché
    const prodejceItems = `
        <li><a href="prodejny.html">Prodejny</a></li>
        <li><a href="bazar.html" onclick="openNewBazarForm(event)">Přidat výkup</a></li>
        <li><a href="novinky.html">Novinky</a></li>
        <li><a href="#" id="logout" class="logout-btn">Odhlásit</a></li>
    `;
    
    // Admin menu - minimalistické
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
                        <li><a href="bazar.html" onclick="openNewBazarForm(event)">Přidat výkup</a></li>
                    </ul>
                </li>
                <li><a href="celkem.html">Celkem</a></li>
            </ul>
        </li>
        <li><a href="novinky.html">Novinky</a></li>
        <li><a href="user-management.html">Správa uživatelů</a></li>
        <li><a href="#" id="logout" class="logout-btn">Odhlásit</a></li>
    `;
    
    // Sestavení menu podle role uživatele
    if (isLoggedIn) {
        if (userRole === 'Prodejce') {
            nav.innerHTML = baseItems + prodejceItems;
        } else if (userRole === 'Administrator' || userRole === 'Administrátor') {
            nav.innerHTML = baseItems + adminItems;
        } else {
            nav.innerHTML = baseItems;
        }
        // Odstranit login tlačítko
        const existingLoginBtn = document.querySelector('.header-login-btn');
        if (existingLoginBtn) existingLoginBtn.remove();
    } else {
        // Menu pro nepřihlášené - bez login tlačítka v nav
        nav.innerHTML = baseItems;
        
        // Přidat login tlačítko do header-controls
        const headerControls = document.querySelector('.header-controls');
        let loginBtn = document.querySelector('.header-login-btn');
        
        if (!loginBtn && headerControls) {
            loginBtn = document.createElement('a');
            loginBtn.href = 'login.html';
            loginBtn.className = 'header-login-btn';
            loginBtn.textContent = 'Přihlásit';
            
            // Vložit před hamburger nebo na začátek
            const hamburger = document.querySelector('.hamburger');
            if (hamburger) {
                headerControls.insertBefore(loginBtn, hamburger);
            } else {
                headerControls.appendChild(loginBtn);
            }
        }
    }
    
    // Logout funkcionalita
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Opravdu se chcete odhlásit?')) {
                const sessionKeys = [
                    'isLoggedIn', 'username', 'role', 'userId', 'sellerId',
                    'userEmail', 'userPhone', 'userProdejna', 'userData'
                ];
                sessionKeys.forEach(key => localStorage.removeItem(key));
                window.location.href = 'index.html';
            }
        });
    }
    
    setupDropdownMenus();
    setupHamburgerMenu();
    markActivePage();
}

// Jednoduché dropdown menu
function setupDropdownMenus() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdown = document.querySelector('.dropdown');
    
    if (!dropdownToggle || !dropdown) return;
    
    dropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Desktop hover efekt
    if (window.innerWidth > 768) {
        dropdown.addEventListener('mouseenter', () => {
            dropdown.classList.add('active');
        });
        
        dropdown.addEventListener('mouseleave', () => {
            dropdown.classList.remove('active');
        });
    }
    
    // Submenu pro mobily
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

// Jednoduché hamburger menu
function setupHamburgerMenu() {
    // Přidej hamburger tlačítko, pokud neexistuje
    let hamburger = document.querySelector('.hamburger');
    if (!hamburger) {
        const headerControls = document.querySelector('.header-controls');
        if (headerControls) {
            hamburger = document.createElement('button');
            hamburger.className = 'hamburger';
            hamburger.innerHTML = '<span></span><span></span><span></span>';
            headerControls.appendChild(hamburger);
        }
    }
    
    const nav = document.querySelector('nav');
    
    if (!hamburger || !nav) return;
    
    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });
    
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
            closeHamburgerMenu();
        }
    });
    
    nav.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && !e.target.classList.contains('dropdown-toggle')) {
            closeHamburgerMenu();
        }
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeHamburgerMenu();
        }
    });
}

// Zavření hamburger menu
function closeHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    
    if (hamburger && nav) {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
        document.body.style.overflow = '';
        
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
}

// Označení aktivní stránky
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

// Inicializace menu
function initNavigation() {
    updateNavigation();
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'isLoggedIn' || e.key === 'role') {
            updateNavigation();
        }
    });
}

// Bazar formulář
function openNewBazarForm(event) {
    event.preventDefault();
    closeHamburgerMenu();
    
    if (window.location.pathname.includes('bazar.html')) {
        const newBazarBtn = document.getElementById('newBazarBtn');
        const newBazarForm = document.getElementById('newBazarForm');
        
        if (newBazarBtn && newBazarForm) {
            newBazarForm.style.display = 'block';
            newBazarBtn.style.display = 'none';
            newBazarForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else {
        window.location.href = 'bazar.html?openForm=true';
    }
}

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    
    // Automatické otevření formuláře z URL parametru
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openForm') === 'true' && window.location.pathname.includes('bazar.html')) {
        setTimeout(() => {
            const newBazarBtn = document.getElementById('newBazarBtn');
            const newBazarForm = document.getElementById('newBazarForm');
            
            if (newBazarBtn && newBazarForm) {
                newBazarForm.style.display = 'block';
                newBazarBtn.style.display = 'none';
                newBazarForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Vyčistit URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }, 500);
    }
}); 