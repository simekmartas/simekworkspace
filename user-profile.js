// 📱 ULTIMATE MOBILE USER PROFILE SYSTEM - Cross-Device Sync
class UserProfile {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.isLoading = false;
        this.syncEnabled = true;
        this.deviceType = localStorage.getItem('deviceType') || 'desktop';
        
        // 📱 Mobile-specific settings
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.profileImageCache = new Map();
        
        console.log('📱 User Profile System inicializován pro:', this.deviceType);
    }

    async init() {
        console.log('📱 Inicializuji user profile...');
        
        if (!this.checkLogin()) {
            return;
        }

        try {
            await this.loadUsers();
            await this.loadCurrentUser();
            this.populateForm();
            this.setupEventListeners();
            this.setupMobileFeatures();
            this.startSyncService();
            
            console.log('✅ User profile systém připraven');
        } catch (error) {
            console.error('❌ Chyba při inicializaci profilu:', error);
            this.showMessage('Chyba při načítání profilu. Zkuste obnovit stránku.', 'error');
        }
    }

    checkLogin() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userId = localStorage.getItem('userId');

        if (isLoggedIn !== 'true' || !userId) {
            this.showMobileAlert('Musíte se nejdříve přihlásit.', () => {
                window.location.href = 'login.html';
            });
            return false;
        }
        return true;
    }

    async loadUsers() {
        try {
            // Try to load from server first (if available)
            if (this.syncEnabled) {
                try {
                    const response = await fetch('/api/users', {
                        method: 'GET',
                        headers: {
                            'Cache-Control': 'no-cache'
                        }
                    });
                    
                    if (response.ok) {
                        const serverUsers = await response.json();
                        this.users = serverUsers;
                        localStorage.setItem('users', JSON.stringify(serverUsers));
                        console.log('📡 Uživatelé načteni ze serveru');
                        return;
                    }
                } catch (serverError) {
                    console.log('📱 Server nedostupný, používám localStorage');
                }
            }
            
            // Fallback to localStorage
            const storedUsers = localStorage.getItem('users');
            if (storedUsers) {
                this.users = JSON.parse(storedUsers);
                console.log('💾 Uživatelé načteni z localStorage');
            } else {
                throw new Error('Žádní uživatelé nenalezeni');
            }
        } catch (error) {
            console.error('❌ Chyba při načítání uživatelů:', error);
            throw error;
        }
    }

    async loadCurrentUser() {
        const userId = localStorage.getItem('userId');
        this.currentUser = this.users.find(u => u.id.toString() === userId);
        
        if (!this.currentUser) {
            throw new Error('Aktuální uživatel nenalezen');
        }
        
        // Update session data
        this.updateSessionData();
        console.log('👤 Aktuální uživatel načten:', this.currentUser.username);
    }

    populateForm() {
        if (!this.currentUser) return;

        // 📝 Základní údaje
        this.setFieldValue('firstName', this.currentUser.firstName);
        this.setFieldValue('lastName', this.currentUser.lastName);
        this.setFieldValue('username', this.currentUser.username);
        this.setFieldValue('email', this.currentUser.email);
        this.setFieldValue('phone', this.currentUser.phone);
        this.setFieldValue('prodejna', this.currentUser.prodejna);
        this.setFieldValue('bio', this.currentUser.bio);

        // 🎨 Update header information
        this.updateProfileHeader();
        
        // 🖼️ Update profile image
        this.updateProfileImage();
        
        // 📱 Mobile-specific updates
        if (this.deviceType === 'mobile') {
            this.optimizeForMobile();
        }
        
        console.log('📝 Formulář naplněn daty');
    }

    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value || '';
        }
    }

    updateProfileHeader() {
        const profileHeader = document.querySelector('.profile-header h1');
        if (profileHeader) {
            profileHeader.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }

        // Update role badge
        const roleBadge = document.querySelector('.role-badge');
        if (roleBadge) {
            roleBadge.textContent = this.currentUser.role || 'Prodejce';
            roleBadge.className = `role-badge ${(this.currentUser.role || '').toLowerCase()}`;
        }
        
        // Update last login info
        const lastLogin = document.querySelector('.last-login');
        if (lastLogin && this.currentUser.lastLogin) {
            const loginDate = new Date(this.currentUser.lastLogin);
            lastLogin.textContent = `Poslední přihlášení: ${loginDate.toLocaleString('cs-CZ')}`;
        }
    }

    updateProfileImage() {
        const profileImage = document.querySelector('.profile-image');
        const avatarPlaceholder = document.querySelector('.avatar-placeholder');
        
        // 🖼️ Profile image logic
        if (this.currentUser.profileImage) {
            if (profileImage) {
                profileImage.src = this.currentUser.profileImage;
                profileImage.style.display = 'block';
            }
            if (avatarPlaceholder) {
                avatarPlaceholder.style.display = 'none';
            }
        } else {
            // Show initials placeholder
            if (avatarPlaceholder) {
                const initials = this.getInitials(this.currentUser.firstName, this.currentUser.lastName);
                avatarPlaceholder.textContent = initials;
                avatarPlaceholder.style.display = 'flex';
            }
            if (profileImage) {
                profileImage.style.display = 'none';
            }
        }
    }

    getInitials(firstName, lastName) {
        const first = (firstName || '').charAt(0).toUpperCase();
        const last = (lastName || '').charAt(0).toUpperCase();
        return first + last || '??';
    }

    setupEventListeners() {
        // 💾 Form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // 🖼️ Profile image upload
        const imageUpload = document.getElementById('profileImageUpload');
        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // 🔄 Password change
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => this.showPasswordChangeModal());
        }

        // 🗑️ Delete account
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        if (deleteAccountBtn && this.currentUser.role !== 'Administrator') {
            deleteAccountBtn.addEventListener('click', () => this.confirmDeleteAccount());
        }

        // 📱 Real-time sync
        window.addEventListener('storage', (e) => this.handleStorageChange(e));
        
        console.log('🎯 Event listeners nastaveny');
    }

    setupMobileFeatures() {
        if (this.deviceType !== 'mobile') return;

        // 📱 Touch gestures for profile image
        const profileImageContainer = document.querySelector('.profile-image-container');
        if (profileImageContainer) {
            profileImageContainer.addEventListener('touchstart', (e) => {
                this.touchStartY = e.touches[0].clientY;
            });

            profileImageContainer.addEventListener('touchend', (e) => {
                this.touchEndY = e.changedTouches[0].clientY;
                this.handleImageSwipeGesture();
            });
        }

        // 📱 Mobile form optimizations
        const formInputs = document.querySelectorAll('input, textarea');
        formInputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Scroll input into view on mobile
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });

        // 📱 Haptic feedback setup
        this.setupHapticFeedback();
        
        console.log('📱 Mobilní funkce nastaveny');
    }

    handleImageSwipeGesture() {
        const swipeThreshold = 50;
        const swipeDistance = this.touchStartY - this.touchEndY;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swipe up - open image upload
                this.triggerImageUpload();
            } else {
                // Swipe down - remove image
                this.removeProfileImage();
            }
        }
    }

    setupHapticFeedback() {
        if (!navigator.vibrate) return;

        const buttons = document.querySelectorAll('button, .btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                navigator.vibrate(30);
            });
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        this.setLoadingState(true);

        try {
            // 📝 Collect form data
            const formData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                username: document.getElementById('username').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                prodejna: document.getElementById('prodejna').value.trim(),
                bio: document.getElementById('bio').value.trim()
            };

            // ✅ Validate data
            this.validateFormData(formData);

            // 🔄 Update user object
            Object.assign(this.currentUser, formData);
            this.currentUser.lastUpdated = Date.now();
            this.currentUser.updatedBy = this.deviceType;

            // 💾 Save to storage
            await this.saveUserData();
            
            // 🔄 Update UI
            this.updateProfileHeader();
            this.updateSessionData();
            
            // 📱 Success feedback
            this.showMessage('✅ Profil byl úspěšně aktualizován!', 'success');
            
            // 📱 Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([50, 50, 50]);
            }

        } catch (error) {
            console.error('❌ Chyba při ukládání profilu:', error);
            this.showMessage(`❌ ${error.message}`, 'error');
            
            // 📱 Error haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100, 50, 100]);
            }
        }

        this.setLoadingState(false);
    }

    validateFormData(data) {
        if (!data.firstName || !data.lastName || !data.username) {
            throw new Error('Jméno, příjmení a uživatelské jméno jsou povinné.');
        }

        if (data.email && !this.isValidEmail(data.email)) {
            throw new Error('Zadejte platný email.');
        }

        // Check for duplicate username (excluding current user)
        const existingUser = this.users.find(u => 
            u.username === data.username && u.id !== this.currentUser.id
        );
        if (existingUser) {
            throw new Error('Uživatelské jméno je již používáno.');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async saveUserData() {
        // 🔄 Update users array
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.currentUser };
        }

        // 💾 Save to localStorage immediately
        localStorage.setItem('users', JSON.stringify(this.users));
        
        // 📡 Try to sync with server
        if (this.syncEnabled) {
            try {
                await this.syncWithServer();
            } catch (error) {
                console.warn('⚠️ Server sync failed, data saved locally only');
            }
        }
    }

    async syncWithServer() {
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    users: this.users,
                    timestamp: Date.now(),
                    deviceType: this.deviceType
                })
            });

            if (response.ok) {
                console.log('📡 Data synchronized with server');
                return true;
            }
        } catch (error) {
            console.error('📡 Server sync error:', error);
        }
        return false;
    }

    async handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // 🖼️ Validate image file
        if (!file.type.startsWith('image/')) {
            this.showMessage('❌ Prosím vyberte obrázek.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showMessage('❌ Obrázek je příliš velký (max 5MB).', 'error');
            return;
        }

        this.setLoadingState(true);

        try {
            // 📱 Resize image for mobile optimization
            const resizedImage = await this.resizeImage(file, 300, 300);
            
            // 💾 Convert to base64 for cross-device sync
            const base64Image = await this.fileToBase64(resizedImage);
            
            // 🔄 Update user profile
            this.currentUser.profileImage = base64Image;
            this.currentUser.lastUpdated = Date.now();
            
            // 💾 Save and sync
            await this.saveUserData();
            
            // 🔄 Update UI
            this.updateProfileImage();
            
            this.showMessage('✅ Profilový obrázek byl aktualizován!', 'success');
            
        } catch (error) {
            console.error('❌ Chyba při nahrávání obrázku:', error);
            this.showMessage('❌ Chyba při nahrávání obrázku.', 'error');
        }

        this.setLoadingState(false);
    }

    async resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    triggerImageUpload() {
        const imageUpload = document.getElementById('profileImageUpload');
        if (imageUpload) {
            imageUpload.click();
        }
    }

    async removeProfileImage() {
        if (!this.currentUser.profileImage) return;

        const confirmed = await this.showConfirmDialog(
            'Odstranit profilový obrázek?',
            'Opravdu chcete odstranit váš profilový obrázek?'
        );

        if (confirmed) {
            this.currentUser.profileImage = null;
            this.currentUser.lastUpdated = Date.now();
            
            await this.saveUserData();
            this.updateProfileImage();
            
            this.showMessage('🗑️ Profilový obrázek byl odstraněn.', 'success');
        }
    }

    handleStorageChange(e) {
        if (e.key === 'users' && e.newValue) {
            try {
                const updatedUsers = JSON.parse(e.newValue);
                const updatedCurrentUser = updatedUsers.find(u => u.id === this.currentUser.id);
                
                if (updatedCurrentUser && updatedCurrentUser.lastUpdated > this.currentUser.lastUpdated) {
                    console.log('📱 Profile updated from another device');
                    this.currentUser = updatedCurrentUser;
                    this.users = updatedUsers;
                    this.populateForm();
                    this.showMessage('🔄 Profil synchronizován z jiného zařízení.', 'success');
                }
            } catch (error) {
                console.error('❌ Storage sync error:', error);
            }
        }
    }

    startSyncService() {
        // 🔄 Periodic sync every 30 seconds
        setInterval(async () => {
            if (this.syncEnabled) {
                try {
                    await this.loadUsers();
                    
                    // Check for updates
                    const latestUser = this.users.find(u => u.id === this.currentUser.id);
                    if (latestUser && latestUser.lastUpdated > this.currentUser.lastUpdated) {
                        this.currentUser = latestUser;
                        this.populateForm();
                        console.log('🔄 Auto-sync completed');
                    }
                } catch (error) {
                    console.error('🔄 Auto-sync error:', error);
                }
            }
        }, 30000);
    }

    updateSessionData() {
        // 🔄 Update localStorage session data
        localStorage.setItem('username', `${this.currentUser.firstName} ${this.currentUser.lastName}`);
        localStorage.setItem('userEmail', this.currentUser.email || '');
        localStorage.setItem('userPhone', this.currentUser.phone || '');
        localStorage.setItem('userProdejna', this.currentUser.prodejna || '');
    }

    // 📱 Mobile-friendly UI helpers
    showMobileAlert(message, callback) {
        if (this.deviceType === 'mobile') {
            // Enhanced mobile alert
            const alertHtml = `
                <div class="mobile-alert">
                    <div class="mobile-alert-content">
                        <p>${message}</p>
                        <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove(); ${callback ? 'callback()' : ''}">OK</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', alertHtml);
            
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            alert(message);
            if (callback) callback();
        }
    }

    async showConfirmDialog(title, message) {
        if (this.deviceType === 'mobile') {
            return new Promise((resolve) => {
                const confirmHtml = `
                    <div class="mobile-confirm">
                        <div class="mobile-confirm-content">
                            <h3>${title}</h3>
                            <p>${message}</p>
                            <div class="mobile-confirm-buttons">
                                <button class="btn btn-secondary" onclick="mobileConfirmResolve(false)">Zrušit</button>
                                <button class="btn btn-primary" onclick="mobileConfirmResolve(true)">Potvrdit</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', confirmHtml);
                
                window.mobileConfirmResolve = (result) => {
                    document.querySelector('.mobile-confirm').remove();
                    delete window.mobileConfirmResolve;
                    resolve(result);
                };
            });
        } else {
            return confirm(`${title}\n\n${message}`);
        }
    }

    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        const submitBtn = document.querySelector('button[type="submit"]');
        
        if (submitBtn) {
            if (isLoading) {
                submitBtn.innerHTML = `
                    <div class="loading-spinner"></div>
                    Ukládám...
                `;
                submitBtn.disabled = true;
            } else {
                submitBtn.innerHTML = '💾 Uložit změny';
                submitBtn.disabled = false;
            }
        }
    }

    showMessage(text, type) {
        const messageContainer = document.getElementById('message-container') || this.createMessageContainer();
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.innerHTML = text;
        
        messageContainer.appendChild(messageElement);
        
        // 📱 Auto-remove after delay
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.animation = 'slideOutToTop 0.3s ease-in';
                setTimeout(() => messageElement.remove(), 300);
            }
        }, type === 'success' ? 3000 : 5000);
    }

    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'message-container';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
        return container;
    }

    optimizeForMobile() {
        // 📱 Add mobile-specific CSS classes
        document.body.classList.add('mobile-profile');
        
        // 📱 Optimize form layout for touch
        const form = document.getElementById('profileForm');
        if (form) {
            form.classList.add('mobile-optimized');
        }
    }

    logout() {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// 🚀 Initialize User Profile System
let userProfile;

document.addEventListener('DOMContentLoaded', async () => {
    userProfile = new UserProfile();
    await userProfile.init();
});

// 🌐 Global functions for mobile compatibility
function logout() {
    if (userProfile) {
        userProfile.logout();
    } else {
        localStorage.clear();
        window.location.href = 'login.html';
    }
} 