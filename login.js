// Unifikovaný přihlašovací systém - mobilně optimalizovaný
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
    
    // Inicializace výchozích uživatelů
    initializeUsers();
    
    // Mobilní specifické vylepšení UX
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    
    // Automatické zaměření na první pole (pouze na desktopu)
    if (window.innerWidth > 768) {
        username.focus();
    }
    
    // Mobilní optimalizace - prevent zoom on input focus
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        username.setAttribute('autocomplete', 'username');
        password.setAttribute('autocomplete', 'current-password');
        
        // Prevent zoom on iOS
        document.querySelector('meta[name=viewport]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const usernameValue = username.value.trim();
        const passwordValue = password.value;
        
        // Reset previous messages
        hideMessage();
        
        // Validate input
        if (!usernameValue || !passwordValue) {
            showMessage('Vyplňte prosím všechna pole.', 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        // Simulate API call delay for better UX
        setTimeout(() => {
            authenticateUser(usernameValue, passwordValue);
        }, 300); // Kratší delay pro mobilní zařízení
    });

    // Unifikovaná autentizační funkce
    function authenticateUser(username, password) {
        try {
            // Získat uživatele z localStorage (nový systém)
            const users = getUsers();
            let user = users.find(u => u.username === username && u.password === password);
            
            // Pokud uživatel nebyl nalezen v novém systému, zkus starý formát
            if (!user) {
                // Fallback na starý systém
                user = checkLegacyAuth(username, password);
            }
            
            if (user) {
                // Úspěšné přihlášení - unified session storage
                const sessionData = {
                    isLoggedIn: 'true',
                    username: user.firstName ? `${user.firstName} ${user.lastName}` : user.name || username,
                    userId: user.id ? user.id.toString() : '1',
                    role: user.role || 'Prodejce',
                    userEmail: user.email || '',
                    userPhone: user.phone || '',
                    userProdejna: user.prodejna || 'Nezadáno',
                    // Mobile specific
                    deviceType: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                    loginTime: Date.now()
                };
                
                // Store session data
                Object.keys(sessionData).forEach(key => {
                    localStorage.setItem(key, sessionData[key]);
                });
                
                // Mobile haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                showMessage('✅ Přihlášení úspěšné! Přesměrovávám...', 'success');
                
                // Redirect after short delay
                setTimeout(() => {
                    // Determine redirect based on role
                    if (sessionData.role === 'Prodejce') {
                        window.location.href = 'prodejny.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);
                
            } else {
                setLoadingState(false);
                showMessage('❌ Nesprávné přihlašovací údaje. Zkuste to znovu.', 'error');
                
                // Mobile vibration for error
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
                
                // Shake animation for error
                loginForm.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    loginForm.style.animation = '';
                }, 500);
                
                // Focus on username field (only on desktop)
                if (window.innerWidth > 768) {
                    username.focus();
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoadingState(false);
            showMessage('⚠️ Chyba při přihlašování. Zkuste to znovu.', 'error');
        }
    }

    // Funkce pro kontrolu starého autentizačního systému
    function checkLegacyAuth(username, password) {
        // Hardcoded admin/prodejce accounts for backward compatibility
        const legacyAccounts = {
            'admin': { password: 'Admin123', role: 'Administrator', name: 'Administrátor' },
            'prodejce': { password: 'Prodejce123', role: 'Prodejce', name: 'Prodejce' }
        };
        
        if (legacyAccounts[username] && legacyAccounts[username].password === password) {
            return {
                id: username === 'admin' ? 1 : 2,
                username: username,
                firstName: legacyAccounts[username].name.split(' ')[0],
                lastName: legacyAccounts[username].name.split(' ')[1] || '',
                role: legacyAccounts[username].role,
                email: `${username}@mobilmajak.cz`,
                phone: '',
                prodejna: username === 'admin' ? 'Hlavní pobočka' : 'Pobočka',
                password: password
            };
        }
        
        return null;
    }

    // Funkce pro získání uživatelů z localStorage
    function getUsers() {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
            try {
                return JSON.parse(storedUsers);
            } catch (e) {
                console.error('Error parsing users:', e);
                return [];
            }
        }
        return [];
    }

    // Inicializace výchozích uživatelů - vylepšená verze
    function initializeUsers() {
        let existingUsers = getUsers();
        
        const defaultUsers = [
            {
                id: 1,
                firstName: 'Admin',
                lastName: 'Administrátor',
                username: 'admin',
                email: 'admin@mobilmajak.cz',
                phone: '+420777888999',
                prodejna: 'Hlavní pobočka',
                password: 'Admin123',
                role: 'Administrator',
                bio: 'Hlavní administrátor systému MobilMajak',
                createdAt: Date.now()
            },
            {
                id: 2,
                firstName: 'Demo',
                lastName: 'Prodejce',
                username: 'prodejce',
                email: 'prodejce@mobilmajak.cz',
                phone: '+420777123456',
                prodejna: 'Demo pobočka',
                password: 'prodejce123',
                role: 'Prodejce',
                bio: 'Demo prodejce pro testování',
                createdAt: Date.now()
            }
        ];

        if (existingUsers.length === 0) {
            // Žádní uživatelé - vytvoř výchozí
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            console.log('✅ Výchozí uživatelé vytvořeni');
        } else {
            // Zajisti že admin existuje
            const adminExists = existingUsers.find(u => u.username === 'admin');
            if (!adminExists) {
                existingUsers.unshift(defaultUsers[0]);
                localStorage.setItem('users', JSON.stringify(existingUsers));
                console.log('✅ Admin účet přidán');
            }
        }
    }
    
    // Enhanced message functions with mobile support
    function showMessage(text, type) {
        messageElement.innerHTML = text;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
        messageElement.style.animation = 'slideInFromTop 0.3s ease-out';
        
        // Auto-hide success messages on mobile
        if (type === 'success' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            setTimeout(() => {
                hideMessage();
            }, 2000);
        }
    }
    
    function hideMessage() {
        messageElement.style.animation = 'slideOutToTop 0.3s ease-in';
        setTimeout(() => {
            messageElement.style.display = 'none';
            messageElement.style.animation = '';
        }, 300);
    }
    
    // Enhanced loading state with mobile optimization
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitButton.innerHTML = `
                <div class="loading-spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
                Přihlašuji...
            `;
            submitButton.disabled = true;
            submitButton.style.opacity = '0.7';
            submitButton.style.cursor = 'not-allowed';
        } else {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
        }
    }
    
    // Enhanced form validation with mobile UX
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            // Clear error state when user starts typing
            if (messageElement.classList.contains('error')) {
                hideMessage();
            }
            
            // Remove invalid styling
            this.style.borderColor = '';
            this.style.boxShadow = '';
        });
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                } else {
                    loginForm.dispatchEvent(new Event('submit'));
                }
            }
        });
        
        // Mobile specific enhancements
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            input.addEventListener('focus', function() {
                // Scroll to input on mobile
                setTimeout(() => {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        }
    });
    
    // Demo credentials info for mobile
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const demoInfo = document.createElement('div');
        demoInfo.innerHTML = `
            <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 0.5rem; font-size: 0.875rem;">
                <strong>Demo přístupy:</strong><br>
                Admin: admin / Admin123<br>
                Prodejce: prodejce / prodejce123
            </div>
        `;
        loginForm.parentNode.appendChild(demoInfo);
    }
});

// Mobile specific animations
const mobileAnimationsCSS = `
@keyframes slideInFromTop {
    from {
        transform: translateY(-20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes slideOutToTop {
    from {
        transform: translateY(0);
        opacity: 1;
    }
    to {
        transform: translateY(-20px);
        opacity: 0;
    }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
    20%, 40%, 60%, 80% { transform: translateX(8px); }
}

/* Mobile specific loading spinner */
.loading-spinner {
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Inject mobile animations
if (!document.querySelector('#mobile-login-animations')) {
    const style = document.createElement('style');
    style.id = 'mobile-login-animations';
    style.textContent = mobileAnimationsCSS;
    document.head.appendChild(style);
}

// Debug function for testing
window.resetLoginSystem = function() {
    if (confirm('Resetovat přihlašovací systém? (pouze pro debugging)')) {
        localStorage.removeItem('users');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        alert('Systém resetován. Obnovte stránku.');
        location.reload();
    }
}; 