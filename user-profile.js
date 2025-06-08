// 📊 USER PROFILE WITH SALES STATISTICS SYSTEM
class UserProfile {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.isLoading = false;
        this.deviceType = localStorage.getItem('deviceType') || 'desktop';
        
        // Data loadery pro statistiky
        this.currentLoader = null;
        this.monthlyLoader = null;
        
        // Profile edit toggle state
        this.isProfileEditVisible = false;
        
        console.log('📊 User Profile System inicializován pro:', this.deviceType);
    }

    async init() {
        console.log('📊 Inicializuji user profile s statistikami...');
        
        if (!this.checkLogin()) {
            return;
        }

        try {
            await this.loadUsers();
            await this.loadCurrentUser();
            this.populateForm();
            this.setupEventListeners();
            this.initTabSwitching();
            this.loadStatistics();
            
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
            alert('Musíte se nejdříve přihlásit.');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    async loadUsers() {
        try {
            const storedUsers = localStorage.getItem('users');
            if (storedUsers) {
                this.users = JSON.parse(storedUsers);
                console.log('💾 Uživatelé načteni z localStorage');
            } else {
                // Fallback uživatelé pokud nejsou v localStorage
                this.users = [
                    {
                        id: 1,
                        username: 'testuser',
                        firstName: 'Test',
                        lastName: 'User',
                        email: 'test@example.com',
                        phone: '+420123456789',
                        prodejna: 'Hlavní prodejna',
                        bio: 'Testovací uživatel',
                        sellerId: '1' // ID prodejce pro filtrování dat
                    }
                ];
                localStorage.setItem('users', JSON.stringify(this.users));
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
            // Fallback na prvního uživatele
            this.currentUser = this.users[0];
            localStorage.setItem('userId', this.currentUser.id.toString());
        }
        
        // Ujisti se, že uživatel má sellerId
        if (!this.currentUser.sellerId) {
            this.currentUser.sellerId = this.currentUser.id.toString();
            await this.saveUserData();
        }
        
        console.log('👤 Aktuální uživatel načten:', this.currentUser.username, 'ID prodejce:', this.currentUser.sellerId);
        
        // Update profile title
        const profileTitle = document.getElementById('profileTitle');
        if (profileTitle) {
            profileTitle.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }
    }

    loadStatistics() {
        console.log('📊 Načítám statistiky prodeje...');
        
        // Vytvoř global reload funkce
        window.reloadUserProfileData = () => {
            if (this.currentLoader) this.currentLoader.reloadData();
            if (this.monthlyLoader) this.monthlyLoader.reloadData();
        };
        
        // Načti data pro aktuální tab (current je defaultní)
        this.loadDataForTab('current');
    }

    loadDataForTab(tabType) {
        const containerId = `${tabType}-table-container`;
        
        console.log(`📊 Načítám data pro tab: ${tabType}, container: ${containerId}`);
        
        if (tabType === 'current' && !this.currentLoader) {
            this.currentLoader = new UserProfileDataLoader(containerId, tabType);
        } else if (tabType === 'monthly' && !this.monthlyLoader) {
            this.monthlyLoader = new UserProfileDataLoader(containerId, tabType);
        }
        
        // Reload existujícího loaderu
        if (tabType === 'current' && this.currentLoader) {
            this.currentLoader.reloadData();
        } else if (tabType === 'monthly' && this.monthlyLoader) {
            this.monthlyLoader.reloadData();
        }
    }

    initTabSwitching() {
        console.log('🔄 Inicializuji tab switching...');
        
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                console.log(`🔄 Přepínám na tab: ${targetTab}`);
                
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    content.style.display = 'none';
                });
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const targetContent = document.getElementById(`${targetTab}-data`);
                if (targetContent) {
                    targetContent.classList.add('active');
                    targetContent.style.display = 'block';
                    targetContent.style.animation = 'fadeIn 0.3s ease-in-out';
                }
                
                // Load data for the selected tab if not already loaded
                this.loadDataForTab(targetTab);
            });
        });
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

        // 🖼️ Update profile image
        this.updateProfileImage();
        
        console.log('📝 Formulář naplněn daty');
    }

    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value || '';
        }
    }

    updateProfileImage() {
        const profileImage = document.getElementById('profileImage');
        
        if (this.currentUser.profileImage) {
            profileImage.style.backgroundImage = `url(${this.currentUser.profileImage})`;
            profileImage.style.backgroundColor = 'transparent';
            profileImage.textContent = '';
        } else {
            // Show initials
            const initials = this.getInitials(this.currentUser.firstName, this.currentUser.lastName);
            profileImage.textContent = initials;
            profileImage.style.backgroundImage = 'none';
            profileImage.style.backgroundColor = 'var(--primary-color, #2196F3)';
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
        const imageInput = document.getElementById('profileImageInput');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }
        
        console.log('🎯 Event listeners nastaveny');
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

            // 💾 Save to storage
            await this.saveUserData();
            
            // 🔄 Update UI
            this.updateProfileImage();
            
            // Update profile title
            const profileTitle = document.getElementById('profileTitle');
            if (profileTitle) {
                profileTitle.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
            }
            
            // 📱 Success feedback
            this.showMessage('✅ Profil byl úspěšně aktualizován!', 'success');

        } catch (error) {
            console.error('❌ Chyba při ukládání profilu:', error);
            this.showMessage(`❌ ${error.message}`, 'error');
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

        // 💾 Save to localStorage
        localStorage.setItem('users', JSON.stringify(this.users));
        localStorage.setItem('userData', JSON.stringify(this.currentUser));
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
            // 💾 Convert to base64
            const base64Image = await this.fileToBase64(file);
            
            // 🔄 Update user profile
            this.currentUser.profileImage = base64Image;
            this.currentUser.lastUpdated = Date.now();
            
            // 💾 Save
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

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        
        const submitBtn = document.querySelector('.btn-primary');
        if (submitBtn) {
            if (isLoading) {
                submitBtn.textContent = '🔄 Ukládám...';
                submitBtn.disabled = true;
            } else {
                submitBtn.textContent = '💾 Uložit změny';
                submitBtn.disabled = false;
            }
        }
    }

    showMessage(text, type) {
        let messageContainer = document.getElementById(type === 'error' ? 'errorMessage' : 'successMessage');
        
        if (messageContainer) {
            messageContainer.textContent = text;
            messageContainer.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 5000);
        } else {
            // Fallback to alert
            alert(text);
        }
    }
}

// 🔄 Toggle profile edit section visibility
function toggleProfileEdit() {
    const profileEditSection = document.getElementById('profileEditSection');
    const isVisible = profileEditSection.classList.contains('active');
    
    if (isVisible) {
        profileEditSection.classList.remove('active');
        profileEditSection.style.display = 'none';
    } else {
        profileEditSection.classList.add('active');
        profileEditSection.style.display = 'block';
    }
    
    console.log('🔄 Profile edit section toggled:', !isVisible);
}

// 🖼️ Trigger image upload
function triggerImageUpload() {
    const imageInput = document.getElementById('profileImageInput');
    if (imageInput) {
        imageInput.click();
    }
}

// 🖼️ Handle image upload from onclick
function handleImageUpload(event) {
    if (window.userProfile) {
        window.userProfile.handleImageUpload(event);
    }
}

// 🖼️ Crop modal functions (básic implementation)
function closeCropModal() {
    const cropModal = document.getElementById('cropModal');
    if (cropModal) {
        cropModal.style.display = 'none';
    }
}

function applyCrop() {
    // Basic crop functionality - for now just close modal
    closeCropModal();
}

// 🚀 Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 DOM ready, inicializuji User Profile...');
    
    // Přidat kontrolu přihlášení
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.replace('login.html');
        return;
    }
    
    window.userProfile = new UserProfile();
    window.userProfile.init();
    
    // Wait for theme manager to be ready
    setTimeout(() => {
        if (window.themeManager) {
            window.themeManager.updateAllToggleButtons();
            console.log('Theme toggle buttons aktualizovány na user-profile.html');
        }
    }, 200);
}); 