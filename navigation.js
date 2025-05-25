// Funkce pro aktualizaci navigace podle stavu přihlášení
function updateNavigation() {
    const nav = document.querySelector('nav ul');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
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
        
        // Otevření dropdown při hover
        dropdown.addEventListener('mouseenter', function() {
            dropdown.classList.add('active');
        });
    }
}

// Spuštění při načtení stránky
document.addEventListener('DOMContentLoaded', updateNavigation); 