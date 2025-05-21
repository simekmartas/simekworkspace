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
        
        // Přesměrování na stránku členů
        window.location.href = 'members.html';
    } else {
        messageElement.textContent = '// Chybné přihlašovací údaje';
        messageElement.style.color = '#ff0000';
    }
}); 