// 📱 ULTIMATE MOBILE NAVIGATION SYSTEM - Professional Mobile UX
function updateNavigation() {
    const nav = document.querySelector('nav ul');
    if (!nav) {
        console.error('Navigation ul element not found!');
        return;
    }
    
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('role');
    const deviceType = localStorage.getItem('deviceType') || 'desktop';
    
    // 🍔 Smart Hamburger Menu Management - No Duplicates
    const headerContent = document.querySelector('.header-content');
    if (headerContent && !headerContent.querySelector('.hamburger')) {
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.setAttribute('aria-label', 'Otevřít menu');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        
        // Insert hamburger at the beginning of header
        headerContent.insertBefore(hamburger, headerContent.firstChild);
        console.log('🍔 Hamburger menu vytvořen');
    }
    
    // 🎛️ Header Controls Container for Login/Theme buttons
    let headerControls = headerContent.querySelector('.header-controls');
    if (!headerControls) {
        headerControls = document.createElement('div');
        headerControls.className = 'header-controls';
        headerContent.appendChild(headerControls);
    }
    
    // 🌓 Theme Toggle Management
    if (!headerControls.querySelector('.theme-toggle')) {
        setTimeout(() => {
            if (window.themeManager) {
                window.themeManager.updateAllToggleButtons();
                console.log('🌓 Theme manager aktualizován');
            }
        }, 100);
    }
    
    // 🔐 Login Button Management - Smart Placement
    const existingLoginBtn = headerControls.querySelector('.header-login-btn');
    if (!isLoggedIn) {
        if (!existingLoginBtn) {
            const loginBtn = document.createElement('a');
            loginBtn.href = 'login.html';
            loginBtn.className = 'header-login-btn btn btn-primary mobile-login-btn';
            loginBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10,17 15,12 10,7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                <span class="desktop-only">Přihlásit</span>
            `;
            headerControls.appendChild(loginBtn);
        }
    } else {
        // Remove login button when logged in
        if (existingLoginBtn) {
            existingLoginBtn.remove();
        }
    }
    
    // 📱 Navigation Menu Content
    const baseItems = `
        <li><a href="index.html">🏠 <span>Domů</span></a></li>
        <li><a href="index.html#o-nas">ℹ️ <span>O nás</span></a></li>
        <li><a href="index.html#kontakt">📞 <span>Kontakt</span></a></li>
    `;
    
    // 👨‍💼 Prodejce Menu Items
    const prodejceItems = `
        <li><a href="prodejny.html">📊 <span>Prodejny</span></a></li>
        <li><a href="bazar.html" onclick="openNewBazarForm(event)">➕ <span>Přidat výkup</span></a></li>
        <li><a href="novinky.html">📢 <span>Novinky</span></a></li>
        <li><a href="user-profile.html">👤 <span>Profil</span></a></li>
        <li><a href="#" id="logout" class="logout-btn">🚪 <span>Odhlásit</span></a></li>
    `;
    
    // 👨‍💻 Admin Menu Items
    const adminItems = `
        <li class="dropdown">
            <a href="#" class="dropdown-toggle">📱 <span>Mobil Maják</span></a>
            <ul class="dropdown-menu">
                <li><a href="prodejny.html">📊 Prodejny</a></li>
                <li><a href="servis.html">🔧 Servis</a></li>
                <li><a href="eshop.html">🛒 Eshop</a></li>
                <li class="dropdown-submenu">
                    <a href="bazar.html" class="dropdown-submenu-toggle">💼 Bazar</a>
                    <ul class="dropdown-submenu-menu">
                        <li><a href="bazar.html">📋 Přehled bazaru</a></li>
                        <li><a href="bazar.html" onclick="openNewBazarForm(event)">➕ Přidat výkup</a></li>
                    </ul>
                </li>
                <li><a href="celkem.html">📈 Celkem</a></li>
            </ul>
        </li>
        <li><a href="novinky.html">📢 <span>Novinky</span></a></li>
        <li><a href="user-management.html">👥 <span>Správa uživatelů</span></a></li>
        <li><a href="user-profile.html">👤 <span>Profil</span></a></li>
        <li><a href="#" id="logout" class="logout-btn">🚪 <span>Odhlásit</span></a></li>
    `;
    
    // 🔄 Update Navigation Based on User Role
    if (isLoggedIn) {
        if (userRole === 'Prodejce') {
            nav.innerHTML = baseItems + prodejceItems;
        } else if (userRole === 'Administrator' || userRole === 'Administrátor') {
            nav.innerHTML = baseItems + adminItems;
        } else {
            nav.innerHTML = baseItems;
        }
    } else {
        nav.innerHTML = baseItems;
    }
    
    // 🚪 Enhanced Logout Functionality
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Mobile-friendly confirmation
            const confirmMessage = deviceType === 'mobile' 
                ? 'Odhlásit se?' 
                : 'Opravdu se chcete odhlásit?';
                
            if (confirm(confirmMessage)) {
                // Show loading state
                logoutButton.innerHTML = '⏳ <span>Odhlašování...</span>';
                logoutButton.style.opacity = '0.6';
                
                // Clear all session data
                const sessionKeys = [
                    'isLoggedIn', 'username', 'role', 'userId', 
                    'userEmail', 'userPhone', 'userProdejna', 
                    'deviceType', 'loginTime'
                ];
                sessionKeys.forEach(key => localStorage.removeItem(key));
                
                // Mobile haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            }
        });
    }
    
    // 📱 Enhanced Dropdown Functionality
    setupDropdownMenus();
    
    // 🍔 Enhanced Hamburger Functionality
    setupHamburgerMenu();
    
    // 🎯 Mark Active Page
    markActivePage();
    
    console.log('📱 Navigation updated for:', { userRole, deviceType, isLoggedIn });
}

// 📱 Dropdown Menu Setup - Mobile Optimized
function setupDropdownMenus() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdown = document.querySelector('.dropdown');
    
    if (!dropdownToggle || !dropdown) return;
    
    // Click handler for dropdown toggle
    dropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isActive = dropdown.classList.contains('active');
        dropdown.classList.toggle('active');
        
        // Update aria attributes
        dropdownToggle.setAttribute('aria-expanded', !isActive);
        
        // Mobile haptic feedback
        if (navigator.vibrate && !isActive) {
            navigator.vibrate(30);
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
            dropdownToggle.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Desktop hover effects (only on desktop)
    if (window.innerWidth > 768) {
        dropdown.addEventListener('mouseenter', () => {
            dropdown.classList.add('active');
            dropdownToggle.setAttribute('aria-expanded', 'true');
        });
        
        dropdown.addEventListener('mouseleave', () => {
            dropdown.classList.remove('active');
            dropdownToggle.setAttribute('aria-expanded', 'false');
        });
    }
    
    // Handle dropdown item clicks
    const dropdownLinks = dropdown.querySelectorAll('.dropdown-menu a');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                dropdown.classList.remove('active');
                closeHamburgerMenu();
            }
        });
    });
    
    // Mobile submenu functionality
    const submenuToggle = dropdown.querySelector('.dropdown-submenu-toggle');
    const submenu = dropdown.querySelector('.dropdown-submenu');
    
    if (submenuToggle && submenu) {
        submenuToggle.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                submenu.classList.toggle('active');
                
                // Mobile haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(20);
                }
            }
        });
    }
}

// 🍔 Hamburger Menu Setup - Professional Mobile UX
function setupHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    
    if (!hamburger || !nav) return;
    
    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        
        const isActive = hamburger.classList.contains('active');
        
        // Toggle menu
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
        
        // Update aria attributes
        hamburger.setAttribute('aria-expanded', !isActive);
        hamburger.setAttribute('aria-label', !isActive ? 'Zavřít menu' : 'Otevřít menu');
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = !isActive ? 'hidden' : '';
        
        // Mobile haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(!isActive ? 50 : 30);
        }
        
        console.log('🍔 Hamburger menu toggled:', !isActive);
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
            closeHamburgerMenu();
        }
    });
    
    // Close menu when clicking on navigation links
    nav.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && !e.target.classList.contains('dropdown-toggle')) {
            setTimeout(() => closeHamburgerMenu(), 150); // Small delay for better UX
        }
    });
    
    // Close menu on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeHamburgerMenu();
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && nav.classList.contains('active')) {
            closeHamburgerMenu();
            hamburger.focus();
        }
    });
}

// 🚪 Close Hamburger Menu Helper
function closeHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    
    if (hamburger && nav) {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Otevřít menu');
        document.body.style.overflow = '';
        
        // Close any open dropdowns
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
}

// 🎯 Mark Active Page in Navigation
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

// 🚀 Enhanced Smooth Scrolling for Mobile
function enhanceSmoothScrolling() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('a[href^="#"]') || e.target.closest('a[href^="#"]')) {
            e.preventDefault();
            
            const link = e.target.matches('a[href^="#"]') ? e.target : e.target.closest('a[href^="#"]');
            const targetId = link.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            
            if (targetEl) {
                const headerHeight = window.innerWidth <= 768 ? 60 : 64;
                const targetPosition = targetEl.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                closeHamburgerMenu();
                
                // Mobile haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
            }
        }
    });
}

// 📱 User Profile Sync - Cross-device synchronization
function syncUserProfile() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    // Listen for profile updates from other tabs/devices
    window.addEventListener('storage', function(e) {
        if (e.key === 'users' && e.newValue) {
            try {
                const users = JSON.parse(e.newValue);
                const currentUser = users.find(u => u.id.toString() === userId);
                
                if (currentUser) {
                    // Update session data with latest profile info
                    localStorage.setItem('username', `${currentUser.firstName} ${currentUser.lastName}`);
                    localStorage.setItem('userEmail', currentUser.email || '');
                    localStorage.setItem('userPhone', currentUser.phone || '');
                    localStorage.setItem('userProdejna', currentUser.prodejna || '');
                    
                    console.log('📱 Profil synchronizován mezi zařízeními');
                }
            } catch (error) {
                console.error('❌ Chyba při synchronizaci profilu:', error);
            }
        }
    });
}

// 🎯 Initialize Ultimate Mobile Navigation
function initNavigation() {
    console.log('📱 Inicializuji ultimate mobile navigation...');
    
    // Update navigation
    updateNavigation();
    
    // Setup smooth scrolling
    enhanceSmoothScrolling();
    
    // Setup profile sync
    syncUserProfile();
    
    // Update navigation on storage changes (multi-tab sync)
    window.addEventListener('storage', function(e) {
        if (e.key === 'isLoggedIn' || e.key === 'role') {
            updateNavigation();
        }
    });
    
    // Update on orientation change (mobile)
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            if (window.innerWidth > 768) {
                closeHamburgerMenu();
            }
        }, 100);
    });
    
    console.log('✅ Ultimate mobile navigation inicializována');
}

// 📱 Enhanced Bazar Form Function - Mobile Optimized
function openNewBazarForm(event) {
    event.preventDefault();
    
    // Close mobile menu first
    closeHamburgerMenu();
    
    // Mobile haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    if (window.location.pathname.includes('bazar.html')) {
        // Already on bazar page - open form
        setTimeout(() => {
            const newBazarBtn = document.getElementById('newBazarBtn');
            const newBazarForm = document.getElementById('newBazarForm');
            
            if (newBazarBtn && newBazarForm) {
                newBazarForm.style.display = 'block';
                newBazarBtn.style.display = 'none';
                
                // Enhanced mobile scroll
                if (window.innerWidth <= 768) {
                    newBazarForm.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start',
                        inline: 'nearest'
                    });
                } else {
                    newBazarForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }, 100);
    } else {
        // Redirect to bazar page with form parameter
        window.location.href = 'bazar.html?openForm=true&mobile=' + (window.innerWidth <= 768 ? '1' : '0');
    }
}

// 📱 PWA Installation Support
function initPWASupport() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install prompt on mobile
        if (window.innerWidth <= 768) {
            showPWAInstallPrompt();
        }
    });
    
    function showPWAInstallPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'pwa-install-prompt';
        prompt.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div>
                    <strong>📱 Přidat na domovskou obrazovku</strong>
                    <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary);">
                        Získejte rychlý přístup k Mobil Maják
                    </p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" onclick="installPWA()">Přidat</button>
                    <button class="btn btn-secondary" onclick="dismissPWAPrompt()">Později</button>
                </div>
            </div>
        `;
        document.body.appendChild(prompt);
        
        setTimeout(() => {
            prompt.classList.add('show');
        }, 1000);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            dismissPWAPrompt();
        }, 10000);
    }
    
    window.installPWA = function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('📱 PWA instalace přijata');
                }
                deferredPrompt = null;
                dismissPWAPrompt();
            });
        }
    };
    
    window.dismissPWAPrompt = function() {
        const prompt = document.querySelector('.pwa-install-prompt');
        if (prompt) {
            prompt.remove();
        }
    };
}

// 🚀 Main Initialization
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    
    // Initialize PWA support for mobile
    if ('serviceWorker' in navigator && window.innerWidth <= 768) {
        initPWASupport();
    }
    
    // Check URL parameters for auto-opening forms
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openForm') === 'true' && window.location.pathname.includes('bazar.html')) {
        const isMobile = urlParams.get('mobile') === '1';
        
        setTimeout(() => {
            const newBazarBtn = document.getElementById('newBazarBtn');
            const newBazarForm = document.getElementById('newBazarForm');
            
            if (newBazarBtn && newBazarForm) {
                newBazarForm.style.display = 'block';
                newBazarBtn.style.display = 'none';
                
                // Enhanced mobile scroll with longer timeout
                const scrollTimeout = isMobile ? 800 : 500;
                setTimeout(() => {
                    newBazarForm.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: isMobile ? 'start' : 'center' 
                    });
                }, scrollTimeout);
                
                // Clean up URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }, 500);
    }
}); 