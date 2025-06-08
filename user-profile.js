// Uživatelský profil - správa a úprava osobních údajů
class UserProfile {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.init();
    }

    async init() {
        // Zkontrolovat přihlášení
        if (!this.checkLogin()) {
            return;
        }

        // Načíst data uživatelů
        await this.loadUsers();
        
        // Načíst současného uživatele
        this.loadCurrentUser();
        
        // Naplnit formulář
        this.populateForm();
        
        // Nastavit event listenery
        this.setupEventListeners();
        
        // Načíst profilový obrázek
        this.loadProfileImage();
    }

    checkLogin() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userId = localStorage.getItem('userId');

        if (isLoggedIn !== 'true' || !userId) {
            alert('Musíte se nejdříve přihlásit.');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    async loadUsers() {
        try {
            const savedUsers = localStorage.getItem('users');
            if (savedUsers) {
                this.users = JSON.parse(savedUsers);
            } else {
                this.users = [];
            }
        } catch (error) {
            console.error('❌ Chyba při načítání uživatelů:', error);
            this.users = [];
        }
    }

    loadCurrentUser() {
        const userId = parseInt(localStorage.getItem('userId'));
        this.currentUser = this.users.find(user => user.id === userId);
        
        if (!this.currentUser) {
            alert('Uživatel nebyl nalezen. Budete přesměrováni na přihlášení.');
            this.logout();
            return;
        }
    }

    populateForm() {
        if (!this.currentUser) return;

        // Základní údaje
        document.getElementById('firstName').value = this.currentUser.firstName || '';
        document.getElementById('lastName').value = this.currentUser.lastName || '';
        document.getElementById('username').value = this.currentUser.username || '';
        document.getElementById('email').value = this.currentUser.email || '';
        document.getElementById('phone').value = this.currentUser.phone || '';
        document.getElementById('prodejna').value = this.currentUser.prodejna || '';
        document.getElementById('bio').value = this.currentUser.bio || '';

        // Aktualizovat zobrazené jméno v hlavičce
        const profileHeader = document.querySelector('.profile-header h1');
        if (profileHeader) {
            profileHeader.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }

        // Aktualizovat iniciály v profilovém obrázku
        this.updateProfileImagePlaceholder();
    }

    updateProfileImagePlaceholder() {
        const profileImage = document.getElementById('profileImage');
        if (this.currentUser && this.currentUser.firstName && this.currentUser.lastName) {
            const initials = (this.currentUser.firstName.charAt(0) + this.currentUser.lastName.charAt(0)).toUpperCase();
            profileImage.textContent = initials;
        } else {
            profileImage.textContent = '👤';
        }
    }

    setupEventListeners() {
        const form = document.getElementById('profileForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time aktualizace iniciál při změně jména
        document.getElementById('firstName').addEventListener('input', () => this.updateProfileImagePlaceholder());
        document.getElementById('lastName').addEventListener('input', () => this.updateProfileImagePlaceholder());
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            // Zobrazit loading stav
            this.setLoadingState(true);
            
            // Validace
            if (!this.validateForm()) {
                this.setLoadingState(false);
                return;
            }

            // Shromáždit data z formuláře
            const formData = this.gatherFormData();
            
            // Zkontrolovat jedinečnost uživatelského jména
            if (!this.checkUsernameUniqueness(formData.username)) {
                this.showMessage('Uživatelské jméno už existuje. Zvolte jiné.', 'error');
                this.setLoadingState(false);
                return;
            }

            // Zpracovat změnu hesla (pokud byla zadána)
            if (!this.processPasswordChange(formData)) {
                this.setLoadingState(false);
                return;
            }

            // Aktualizovat uživatele
            this.updateUser(formData);
            
            // Uložit do localStorage
            await this.saveUsers();
            
            // Aktualizovat session údaje
            this.updateSessionData();
            
            this.showMessage('Profil byl úspěšně aktualizován!', 'success');
            
        } catch (error) {
            console.error('❌ Chyba při ukládání profilu:', error);
            this.showMessage('Došlo k chybě při ukládání profilu. Zkuste to znovu.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    validateForm() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!firstName || !lastName || !username || !email) {
            this.showMessage('Vyplňte prosím všechna povinná pole (označená *).', 'error');
            return false;
        }

        // Validace emailu
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage('Zadejte prosím platnou emailovou adresu.', 'error');
            return false;
        }

        return true;
    }

    gatherFormData() {
        return {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            prodejna: document.getElementById('prodejna').value.trim(),
            bio: document.getElementById('bio').value.trim(),
            currentPassword: document.getElementById('currentPassword').value,
            newPassword: document.getElementById('newPassword').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };
    }

    checkUsernameUniqueness(username) {
        return !this.users.some(user => 
            user.username === username && user.id !== this.currentUser.id
        );
    }

    processPasswordChange(formData) {
        const { currentPassword, newPassword, confirmPassword } = formData;
        
        // Pokud není zadáno žádné heslo, neměnit
        if (!currentPassword && !newPassword && !confirmPassword) {
            return true;
        }

        // Pokud je zadáno nějaké heslo, musí být zadána všechna pole
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showMessage('Pro změnu hesla musíte vyplnit všechna pole pro heslo.', 'error');
            return false;
        }

        // Zkontrolovat současné heslo
        if (currentPassword !== this.currentUser.password) {
            this.showMessage('Současné heslo je nesprávné.', 'error');
            return false;
        }

        // Zkontrolovat shodu nových hesel
        if (newPassword !== confirmPassword) {
            this.showMessage('Nová hesla se neshodují.', 'error');
            return false;
        }

        // Zkontrolovat sílu hesla
        if (newPassword.length < 6) {
            this.showMessage('Nové heslo musí mít alespoň 6 znaků.', 'error');
            return false;
        }

        return true;
    }

    updateUser(formData) {
        // Najít index současného uživatele
        const userIndex = this.users.findIndex(user => user.id === this.currentUser.id);
        
        if (userIndex === -1) {
            throw new Error('Uživatel nebyl nalezen');
        }

        // Aktualizovat údaje
        this.users[userIndex] = {
            ...this.users[userIndex],
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            prodejna: formData.prodejna,
            bio: formData.bio
        };

        // Aktualizovat heslo pokud bylo změněno
        if (formData.newPassword) {
            this.users[userIndex].password = formData.newPassword;
        }

        // Aktualizovat současný uživatel
        this.currentUser = this.users[userIndex];
    }

    async saveUsers() {
        try {
            localStorage.setItem('users', JSON.stringify(this.users));
            
            // Pokusit se synchronizovat se serverem
            try {
                const response = await fetch('/api/users-github', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        users: this.users
                    })
                });
                
                if (response.ok) {
                    console.log('✅ Profil synchronizován se serverem');
                }
            } catch (serverError) {
                console.warn('⚠️ Server nedostupný, data uložena pouze lokálně');
            }
            
        } catch (error) {
            throw new Error('Chyba při ukládání dat');
        }
    }

    updateSessionData() {
        // Aktualizovat localStorage session údaje
        localStorage.setItem('username', `${this.currentUser.firstName} ${this.currentUser.lastName}`);
        localStorage.setItem('userEmail', this.currentUser.email);
        localStorage.setItem('userPhone', this.currentUser.phone);
        localStorage.setItem('userProdejna', this.currentUser.prodejna);
    }

    showMessage(text, type) {
        const successElement = document.getElementById('successMessage');
        const errorElement = document.getElementById('errorMessage');
        
        // Skrýt obě zprávy
        successElement.style.display = 'none';
        errorElement.style.display = 'none';
        
        // Zobrazit příslušnou zprávu
        if (type === 'success') {
            successElement.textContent = text;
            successElement.style.display = 'block';
            successElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            errorElement.textContent = text;
            errorElement.style.display = 'block';
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Automaticky skrýt po 5 sekundách
        setTimeout(() => {
            successElement.style.display = 'none';
            errorElement.style.display = 'none';
        }, 5000);
    }

    setLoadingState(isLoading) {
        const submitButton = document.querySelector('button[type="submit"]');
        const originalText = '💾 Uložit změny';
        
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '⏳ Ukládám...';
            submitButton.style.opacity = '0.7';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            submitButton.style.opacity = '1';
        }
    }

    logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userProdejna');
        window.location.href = 'login.html';
    }

    // Správa profilového obrázku
    loadProfileImage() {
        const savedImage = localStorage.getItem(`profileImage_${this.currentUser.id}`);
        if (savedImage) {
            const profileImage = document.getElementById('profileImage');
            profileImage.style.backgroundImage = `url(${savedImage})`;
            profileImage.style.backgroundSize = 'cover';
            profileImage.style.backgroundPosition = 'center';
            profileImage.textContent = '';
        }
    }

    saveProfileImage(imageDataUrl) {
        localStorage.setItem(`profileImage_${this.currentUser.id}`, imageDataUrl);
        this.loadProfileImage();
    }
}

// Globální funkce pro upload obrázku
function triggerImageUpload() {
    document.getElementById('profileImageInput').click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Kontrola typu souboru
    if (!file.type.startsWith('image/')) {
        alert('Vyberte prosím obrázek.');
        return;
    }

    // Kontrola velikosti souboru (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Obrázek je příliš velký. Maximum je 5MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Vytvoř canvas pro změnu velikosti
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Nastavit rozměry (max 300x300)
            const maxSize = 300;
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Nakreslit zmenšený obrázek
            ctx.drawImage(img, 0, 0, width, height);
            
            // Uložit jako base64
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            userProfile.saveProfileImage(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Globální funkce pro odhlášení
function logout() {
    if (userProfile) {
        userProfile.logout();
    } else {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userProdejna');
        window.location.href = 'login.html';
    }
}

// Inicializace po načtení stránky
let userProfile;
document.addEventListener('DOMContentLoaded', function() {
    userProfile = new UserProfile();
}); 