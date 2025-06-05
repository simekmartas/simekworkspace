// Přihlašovací údaje (v reálné aplikaci by byly na serveru)
const users = [
    {
        username: 'admin',
        password: 'Admin123',
        role: 'Administrátor'
    },
    {
        username: 'prodejce',
        password: 'Prodejce123',
        role: 'Prodejce'
    }
];

// Enhanced login form functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const messageElement = document.getElementById('login-message');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    // Check if already logged in
    if (localStorage.getItem('isLoggedIn')) {
        window.location.href = 'index.html';
        return;
    }
    
    // Demo přístupy byly odstraněny
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Reset previous messages
        hideMessage();
        
        // Validate input
        if (!username || !password) {
            showMessage('Vyplňte prosím všechna pole.', 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        // Simulate API call delay for better UX
        setTimeout(() => {
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                // Success - store login info
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('username', username);
                localStorage.setItem('role', user.role);
                
                showMessage('Přihlášení úspěšné! Přesměrovávám...', 'success');
                
                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                
            } else {
                setLoadingState(false);
                showMessage('Nesprávné přihlašovací údaje. Zkuste to znovu.', 'error');
                
                // Shake animation for error
                loginForm.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    loginForm.style.animation = '';
                }, 500);
                
                // Focus on username field
                document.getElementById('username').focus();
            }
        }, 800);
    });
    
    // Show/hide message function
    function showMessage(text, type) {
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
        messageElement.style.animation = 'fadeIn 0.3s ease-in-out';
    }
    
    function hideMessage() {
        messageElement.style.display = 'none';
        messageElement.style.animation = '';
    }
    
    // Loading state management
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitButton.innerHTML = `
                <div class="loading-spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
                Přihlašuji...
            `;
            submitButton.disabled = true;
            submitButton.style.opacity = '0.7';
        } else {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
        }
    }
    
    // Enhanced form validation
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            // Clear error state when user starts typing
            if (messageElement.classList.contains('error')) {
                hideMessage();
            }
            
            // Remove invalid styling
            this.style.borderColor = '';
        });
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextInput = inputs[Array.from(inputs).indexOf(this) + 1];
                if (nextInput) {
                    nextInput.focus();
                } else {
                    loginForm.dispatchEvent(new Event('submit'));
                }
            }
        });
    });
});

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style); 