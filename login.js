// Přihlašovací údaje (v reálné aplikaci by byly na serveru)
const users = [
    {
        username: 'admin',
        password: 'Admin123',
        role: 'Administrátor'
    }
];

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('login-message');
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Uložení informace o přihlášení
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('role', user.role);
        
        // Přesměrování na hlavní stránku
        window.location.href = 'index.html';
    } else {
        messageElement.textContent = '// Chybné přihlašovací údaje';
        messageElement.style.color = '#E40B4D';
        messageElement.style.textShadow = '0 0 10px rgba(228, 11, 77, 0.6)';
    }
}); 