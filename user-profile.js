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
        
        // Načíst statistiky
        this.loadUserStats();
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

    // Načítání uživatelských statistik
    loadUserStats() {
        // TODO: Později nahradit skutečnými daty z API/localStorage
        const mockStats = {
            totalSales: this.generateRandomStat(15, 50),
            totalRepairs: this.generateRandomStat(5, 25),
            totalBuyouts: this.generateRandomStat(3, 15),
            averageRating: (4.2 + Math.random() * 0.8).toFixed(1),
            monthlyStats: this.generateRandomStat(2, 10),
            bestDay: this.generateRandomStat(3, 8)
        };

        // Aktualizovat DOM elementy
        this.updateStatElement('totalSales', mockStats.totalSales);
        this.updateStatElement('totalRepairs', mockStats.totalRepairs);
        this.updateStatElement('totalBuyouts', mockStats.totalBuyouts);
        this.updateStatElement('averageRating', mockStats.averageRating);
        this.updateStatElement('monthlyStats', mockStats.monthlyStats);
        this.updateStatElement('bestDay', mockStats.bestDay);

        // Animovat čísla
        this.animateStats();
    }

    generateRandomStat(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    animateStats() {
        // Jednoduchá animace pro čísla
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
}

// Globální funkce pro upload obrázku
function triggerImageUpload() {
    document.getElementById('profileImageInput').click();
}

// Crop modal a state
let cropState = {
    image: null,
    selection: { x: 0, y: 0, width: 100, height: 100 },
    imageElement: null,
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    startPos: { x: 0, y: 0 }
};

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
            // Zobrazit crop modal
            showCropModal(img, e.target.result);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showCropModal(img, imageSrc) {
    const modal = document.getElementById('cropModal');
    const cropImage = document.getElementById('cropImage');
    const cropSelection = document.getElementById('cropSelection');
    
    // Nastavit obrázek
    cropImage.src = imageSrc;
    cropState.imageElement = cropImage;
    
    // Zobrazit modal
    modal.style.display = 'flex';
    
    // Počkat na načtení obrázku
    cropImage.onload = function() {
        initializeCropSelection();
        updatePreview();
        setupCropEventListeners();
    };
}

function initializeCropSelection() {
    const container = document.querySelector('.crop-container');
    const cropSelection = document.getElementById('cropSelection');
    const img = document.getElementById('cropImage');
    
    // Získat rozměry kontejneru a obrázku
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // Relativní pozice obrázku v kontejneru
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    
    // Nastavit výchozí výběr na střed obrázku (čtverec)
    const size = Math.min(imgRect.width, imgRect.height) * 0.6;
    const x = imgLeft + (imgRect.width - size) / 2;
    const y = imgTop + (imgRect.height - size) / 2;
    
    cropState.selection = { x, y, width: size, height: size };
    
    // Aplikovat pozici
    cropSelection.style.left = x + 'px';
    cropSelection.style.top = y + 'px';
    cropSelection.style.width = size + 'px';
    cropSelection.style.height = size + 'px';
}

function setupCropEventListeners() {
    const cropSelection = document.getElementById('cropSelection');
    const handles = document.querySelectorAll('.crop-handle');
    
    // Event listener pro táhnutí celého výběru
    cropSelection.addEventListener('mousedown', startDragging);
    
    // Event listenery pro handles
    handles.forEach(handle => {
        handle.addEventListener('mousedown', startResizing);
    });
    
    // Globální event listenery
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDragResize);
}

function startDragging(e) {
    if (e.target.classList.contains('crop-handle')) return;
    
    cropState.isDragging = true;
    cropState.startPos = { x: e.clientX - cropState.selection.x, y: e.clientY - cropState.selection.y };
    e.preventDefault();
}

function startResizing(e) {
    cropState.isResizing = true;
    cropState.resizeHandle = e.target.classList[1]; // crop-handle-nw, etc.
    cropState.startPos = { x: e.clientX, y: e.clientY };
    e.preventDefault();
    e.stopPropagation();
}

function handleMouseMove(e) {
    if (!cropState.isDragging && !cropState.isResizing) return;
    
    const container = document.querySelector('.crop-container');
    const img = document.getElementById('cropImage');
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    const imgRight = imgLeft + imgRect.width;
    const imgBottom = imgTop + imgRect.height;
    
    if (cropState.isDragging) {
        // Táhnutí celého výběru
        let newX = e.clientX - cropState.startPos.x;
        let newY = e.clientY - cropState.startPos.y;
        
        // Omezit na hranice obrázku
        newX = Math.max(imgLeft, Math.min(newX, imgRight - cropState.selection.width));
        newY = Math.max(imgTop, Math.min(newY, imgBottom - cropState.selection.height));
        
        cropState.selection.x = newX;
        cropState.selection.y = newY;
        
    } else if (cropState.isResizing) {
        // Změna velikosti
        const deltaX = e.clientX - cropState.startPos.x;
        const deltaY = e.clientY - cropState.startPos.y;
        
        let newSelection = { ...cropState.selection };
        
        // Pro kruhový crop - jednoduché změnění velikosti ze středu
        let sizeDelta = 0;
        
        switch (cropState.resizeHandle) {
            case 'crop-handle-nw': // Horní střed
                sizeDelta = -deltaY * 2;
                break;
            case 'crop-handle-ne': // Pravý střed
                sizeDelta = deltaX * 2;
                break;
            case 'crop-handle-sw': // Dolní střed
                sizeDelta = deltaY * 2;
                break;
            case 'crop-handle-se': // Levý střed
                sizeDelta = -deltaX * 2;
                break;
        }
        
        // Nová velikost (čtverec)
        const newSize = Math.max(50, cropState.selection.width + sizeDelta);
        
        // Centrovat nový výběr
        newSelection.width = newSize;
        newSelection.height = newSize;
        newSelection.x = cropState.selection.x + (cropState.selection.width - newSize) / 2;
        newSelection.y = cropState.selection.y + (cropState.selection.height - newSize) / 2;
        
        // Omezit na hranice obrázku
        newSelection.x = Math.max(imgLeft, Math.min(newSelection.x, imgRight - newSelection.width));
        newSelection.y = Math.max(imgTop, Math.min(newSelection.y, imgBottom - newSelection.height));
        
        // Aplikovat změny
        cropState.selection = newSelection;
        
        cropState.startPos = { x: e.clientX, y: e.clientY };
    }
    
    updateCropSelection();
    updatePreview();
}

function stopDragResize() {
    cropState.isDragging = false;
    cropState.isResizing = false;
    cropState.resizeHandle = null;
}

function updateCropSelection() {
    const cropSelection = document.getElementById('cropSelection');
    cropSelection.style.left = cropState.selection.x + 'px';
    cropSelection.style.top = cropState.selection.y + 'px';
    cropSelection.style.width = cropState.selection.width + 'px';
    cropSelection.style.height = cropState.selection.height + 'px';
}

function updatePreview() {
    const canvas = document.getElementById('cropPreviewCanvas');
    const ctx = canvas.getContext('2d');
    const img = document.getElementById('cropImage');
    
    if (!img.complete) return;
    
    const container = document.querySelector('.crop-container');
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Vypočítat poměr mezi skutečnou velikostí obrázku a zobrazenou velikostí
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    
    // Pozice výběru relativně k obrázku
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    
    const relativeX = (cropState.selection.x - imgLeft) * scaleX;
    const relativeY = (cropState.selection.y - imgTop) * scaleY;
    const relativeWidth = cropState.selection.width * scaleX;
    const relativeHeight = cropState.selection.height * scaleY;
    
    // Vyčistit canvas a nakreslit náhled s kruhovým ořezem
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Uložit context
    ctx.save();
    
    // Vytvořit kruhový clipping path
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI);
    ctx.clip();
    
    // Vypočítat rozměry pro správný poměr stran (čtverec -> kruh)
    // Protože crop je čtvercový, můžeme použít jen width
    const cropSize = Math.min(relativeWidth, relativeHeight);
    const cropX = relativeX + (relativeWidth - cropSize) / 2;
    const cropY = relativeY + (relativeHeight - cropSize) / 2;
    
    // Nakreslit čtvercový výřez do kruhového canvas
    ctx.drawImage(
        img,
        cropX, cropY, cropSize, cropSize,
        0, 0, canvas.width, canvas.height
    );
    
    // Obnovit context
    ctx.restore();
}

function applyCrop() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.getElementById('cropImage');
    
    if (!img.complete) return;
    
    const container = document.querySelector('.crop-container');
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Vypočítat poměr
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    
    // Pozice výběru
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    
    const relativeX = (cropState.selection.x - imgLeft) * scaleX;
    const relativeY = (cropState.selection.y - imgTop) * scaleY;
    const relativeWidth = cropState.selection.width * scaleX;
    const relativeHeight = cropState.selection.height * scaleY;
    
    // Nastavit canvas na finální velikost (200x200 pro profil)
    canvas.width = 200;
    canvas.height = 200;
    
    // Uložit context
    ctx.save();
    
    // Vytvořit kruhový clipping path
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI);
    ctx.clip();
    
    // Vypočítat rozměry pro správný poměr stran (čtverec -> kruh)
    // Protože crop je čtvercový, zajistíme že výřez je skutečně čtvercový
    const cropSize = Math.min(relativeWidth, relativeHeight);
    const cropX = relativeX + (relativeWidth - cropSize) / 2;
    const cropY = relativeY + (relativeHeight - cropSize) / 2;
    
    // Nakreslit čtvercový výřez do kruhového canvas
    ctx.drawImage(
        img,
        cropX, cropY, cropSize, cropSize,
        0, 0, canvas.width, canvas.height
    );
    
    // Obnovit context
    ctx.restore();
    
    // Uložit jako base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    userProfile.saveProfileImage(dataUrl);
    
    // Zavřít modal
    closeCropModal();
}

function closeCropModal() {
    const modal = document.getElementById('cropModal');
    modal.style.display = 'none';
    
    // Vyčistit file input
    document.getElementById('profileImageInput').value = '';
    
    // Odstranit event listenery
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopDragResize);
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