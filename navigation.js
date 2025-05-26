// Funkce pro aktualizaci navigace podle stavu přihlášení
function updateNavigation() {
    const nav = document.querySelector('nav ul');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    // Přidání hamburger menu pro mobily
    const headerContent = document.querySelector('.header-content');
    if (headerContent && !headerContent.querySelector('.hamburger')) {
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        headerContent.appendChild(hamburger);
    }
    
    // Základní položky menu pro všechny uživatele
    const baseItems = `
        <li><a href="index.html">[ DOMŮ ]</a></li>
        <li><a href="index.html#o-nas">[ O NÁS ]</a></li>
        <li><a href="index.html#kontakt">[ KONTAKT ]</a></li>
    `;
    
    // Položky pouze pro přihlášené uživatele
    const memberItems = `
        <li class="dropdown">
            <a href="#" class="dropdown-toggle">[ MOBIL MAJÁK ]</a>
            <ul class="dropdown-menu">
                <li><a href="prodejny.html">[ PRODEJNY ]</a></li>
                <li><a href="servis.html">[ SERVIS ]</a></li>
                <li><a href="eshop.html">[ ESHOP ]</a></li>
                <li><a href="bazar.html">[ BAZAR ]</a></li>
                <li><a href="celkem.html">[ CELKEM ]</a></li>
            </ul>
        </li>
        <li><a href="#" id="logout">[ ODHLÁSIT ]</a></li>
    `;
    
    // Položka pro nepřihlášené uživatele
    const loginItem = `
        <li><a href="login.html">[ PŘIHLÁSIT ]</a></li>
    `;
    
    // Aktualizace navigace - MOBIL MAJÁK pouze pro přihlášené
    if (isLoggedIn) {
        nav.innerHTML = baseItems + memberItems;
    } else {
        nav.innerHTML = baseItems + loginItem;
    }
    
    // Přidání event listeneru pro odhlášení
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            window.location.href = 'index.html';
        });
    }
    
    // Přidání event listeneru pro dropdown menu
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdown = document.querySelector('.dropdown');
    
    if (dropdownToggle && dropdown) {
        // Kliknutí na dropdown toggle
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('active');
            console.log('Dropdown toggled:', dropdown.classList.contains('active'));
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
                    hamburger.classList.remove('active');
                    nav.classList.remove('active');
                }
            });
        });
    }
    
    // Hamburger menu funkcionalita
    const hamburger = document.querySelector('.hamburger');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        // Zavření menu při kliknutí mimo menu
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
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
            }
        });
    }
}

// Spuštění při načtení stránky
document.addEventListener('DOMContentLoaded', updateNavigation); 