// Funkce pro aktualizaci navigace podle stavu přihlášení
function updateNavigation() {
    const nav = document.querySelector('nav ul');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    // Základní položky menu - přidána Mobil Maják
    const baseItems = `
        <li><a href="index.html">[ DOMŮ ]</a></li>
        <li><a href="index.html#o-nas">[ O NÁS ]</a></li>
        <li><a href="index.html#kontakt">[ KONTAKT ]</a></li>
        <li><a href="members.html">[ ČLENSKÁ SEKCE ]</a></li>
        <li><a href="calculator.html">[ KALKULAČKA ]</a></li>
        <li><a href="majak.html">[ MOBIL MAJÁK ]</a></li>
    `;
    
    // Položky pro přihlášené uživatele
    const memberItems = `
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
}

// Spuštění při načtení stránky
document.addEventListener('DOMContentLoaded', updateNavigation); 