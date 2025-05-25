// Funkce pro aktualizaci navigace podle stavu přihlášení
function updateNavigation() {
    const nav = document.querySelector('nav ul');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    // Přidání hamburger menu pro mobily
    const header = document.querySelector('header');
    if (!header.querySelector('.hamburger')) {
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        header.appendChild(hamburger);
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
                <li><a href="majak.html">[ AKTUÁLNÍ ]</a></li>
                <li><a href="majak-mesicni.html">[ MĚSÍČNÍ ]</a></li>
            </ul>
        </li>
        <li><a href="#" id="logout">[ ODHLÁSIT ]</a></li>
    `;
    
    // Položka pro nepřihlášené uživatele
    const loginItem = `
        <li><a href="login.html">[ PŘIHLÁSIT ]</a></li>
    `;
    
    // Aktualizace navigace
    nav.innerHTML = baseItems + (isLoggedIn ? memberItems : loginItem);
    
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
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            dropdown.classList.toggle('active');
        });
        
        // Zavření dropdown při kliknutí mimo
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Zavření dropdown při hover out
        dropdown.addEventListener('mouseleave', function() {
            dropdown.classList.remove('active');
        });
        
        // Otevření dropdown při hover (pouze na desktopu)
        if (window.innerWidth > 768) {
            dropdown.addEventListener('mouseenter', function() {
                dropdown.classList.add('active');
            });
            
            dropdown.addEventListener('mouseleave', function() {
                dropdown.classList.remove('active');
            });
        }
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
                // Zavřít i dropdown
                if (dropdown) {
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