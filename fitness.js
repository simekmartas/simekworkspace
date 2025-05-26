// Fitness Tracker App - JavaScript
class FitnessTracker {
    constructor() {
        this.dailyGoal = parseInt(localStorage.getItem('dailyGoal')) || 2000;
        this.weeklyGoal = parseInt(localStorage.getItem('weeklyGoal')) || 14000;
        this.meals = JSON.parse(localStorage.getItem('meals')) || [];
        this.currentStream = null;
        this.currentSection = 'today';
        this.currentPeriod = 'week';
        // API endpoint - můžete použít PHP nebo Node.js verzi
        this.apiUrl = window.location.origin + '/api/analyze-food.php'; // Pro PHP
        // this.apiUrl = 'http://localhost:3001/api/analyze-food'; // Pro Node.js local development
        
        // Detekce zařízení a prohlížeče
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.displayCurrentDate();
        this.loadTodaysMeals();
        this.checkCameraSupport();
    }

    checkCameraSupport() {
        // Zkontroluj podporu kamery a zobraz informace
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log('Kamera není podporována');
            document.getElementById('startCamera').style.display = 'none';
            this.showNotification('Kamera není podporována. Použijte tlačítka pro nahrání fotek.', 'warning');
        } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            console.log('HTTPS je vyžadováno pro kameru');
            document.getElementById('startCamera').style.display = 'none';
            this.showNotification('Pro kameru je vyžadováno HTTPS připojení.', 'warning');
        } else {
            console.log('Kamera je podporována');
        }

        // Zobraz informace o zařízení v konzoli
        console.log('Informace o zařízení:', {
            isMobile: this.isMobile,
            isIOS: this.isIOS,
            isSafari: this.isSafari,
            userAgent: navigator.userAgent,
            protocol: location.protocol,
            hostname: location.hostname
        });
    }

    setupEventListeners() {
        // Camera controls
        document.getElementById('startCamera').addEventListener('click', () => this.startCamera());
        document.getElementById('capturePhoto').addEventListener('click', () => this.capturePhoto());
        document.getElementById('uploadPhoto').addEventListener('click', () => this.triggerFileUpload());
        document.getElementById('galleryPhoto').addEventListener('click', () => this.triggerGalleryUpload());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('galleryInput').addEventListener('change', (e) => this.handleFileUpload(e));

        // Manual add
        document.getElementById('addManual').addEventListener('click', () => this.addManualMeal());

        // Settings
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('analyzePhoto').addEventListener('click', () => this.analyzePhoto());
        document.getElementById('retakePhoto').addEventListener('click', () => this.retakePhoto());

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchSection(e.target.closest('.nav-item').dataset.section));
        });

        // Statistics controls
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changePeriod(e.target.dataset.period));
        });

        // History controls
        document.getElementById('filterHistory')?.addEventListener('click', () => this.filterHistory());
        document.getElementById('clearFilter')?.addEventListener('click', () => this.clearHistoryFilter());

        // Export/Import
        document.getElementById('exportData')?.addEventListener('click', () => this.exportData());
        document.getElementById('importData')?.addEventListener('click', () => this.triggerImport());
        document.getElementById('importFile')?.addEventListener('change', (e) => this.handleImport(e));

        // Clear all data
        document.getElementById('clearAllData')?.addEventListener('click', () => this.clearAllData());

        // Enter key support
        document.getElementById('foodName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addManualMeal();
        });
        document.getElementById('calories').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addManualMeal();
        });
    }

    displayCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('cs-CZ', options);
    }

    async startCamera() {
        try {
            // Zkontroluj, jestli je k dispozici getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Kamera není podporována v tomto prohlížeči');
            }

            // Zkontroluj HTTPS (kamery na mobilech vyžadují HTTPS)
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                this.showNotification('Kamera vyžaduje HTTPS připojení. Zkuste nahrát foto z galerie.', 'warning');
                return;
            }

            this.showNotification('Žádám o přístup ke kameře...', 'info');

            // Zkus různé konfigurace kamery
            const constraints = [
                // Ideální konfigurace pro mobily
                {
                    video: {
                        facingMode: { exact: 'environment' },
                        width: { ideal: 1280, max: 1920 },
                        height: { ideal: 720, max: 1080 }
                    }
                },
                // Fallback bez exact facingMode
                {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                },
                // Základní konfigurace
                {
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    }
                },
                // Minimální konfigurace
                {
                    video: true
                }
            ];

            let stream = null;
            let lastError = null;

            // Zkus postupně všechny konfigurace
            for (const constraint of constraints) {
                try {
                    console.log('Zkouším konfiguraci kamery:', constraint);
                    stream = await navigator.mediaDevices.getUserMedia(constraint);
                    break;
                } catch (error) {
                    console.log('Konfigurace selhala:', error);
                    lastError = error;
                    continue;
                }
            }

            if (!stream) {
                throw lastError || new Error('Nepodařilo se získat přístup ke kameře');
            }

            this.currentStream = stream;
            const video = document.getElementById('camera');
            video.srcObject = stream;

            // Počkej na načtení videa
            await new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = reject;
                setTimeout(reject, 5000); // Timeout po 5 sekundách
            });

            // Show/hide controls
            document.getElementById('startCamera').style.display = 'none';
            document.getElementById('capturePhoto').style.display = 'flex';
            document.querySelector('.camera-overlay').style.display = 'flex';

            this.showNotification('Kamera je připravena!', 'success');

        } catch (error) {
            console.error('Chyba při spouštění kamery:', error);
            
            let errorMessage = 'Nepodařilo se spustit kameru. ';
            
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Přístup ke kameře byl zamítnut. Povolte přístup v nastavení prohlížeče.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'Kamera nebyla nalezena.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage += 'Kamera není podporována.';
            } else if (error.name === 'NotReadableError') {
                errorMessage += 'Kamera je používána jinou aplikací.';
            } else {
                errorMessage += 'Zkuste nahrát foto z galerie.';
            }
            
            this.showNotification(errorMessage, 'error');
            
            // Automaticky otevři galerii jako fallback
            setTimeout(() => {
                this.triggerFileUpload();
            }, 2000);
        }
    }

    capturePhoto() {
        const video = document.getElementById('camera');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');

        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0);

        // Convert to blob
        canvas.toBlob((blob) => {
            this.showPhotoPreview(blob);
        }, 'image/jpeg', 0.8);

        this.stopCamera();
    }

    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }

        document.getElementById('startCamera').style.display = 'flex';
        document.getElementById('capturePhoto').style.display = 'none';
        document.querySelector('.camera-overlay').style.display = 'none';
    }

    triggerFileUpload() {
        const fileInput = document.getElementById('fileInput');
        
        if (this.isMobile) {
            // Na mobilech přidej možnost vybrat z kamery nebo galerie
            fileInput.setAttribute('capture', 'environment');
            this.showNotification('Pořiďte nové foto kamerou', 'info');
        } else {
            // Na desktopu odstraň capture atribut
            fileInput.removeAttribute('capture');
            this.showNotification('Vyberte foto ze souboru', 'info');
        }
        
        fileInput.click();
    }

    triggerGalleryUpload() {
        const galleryInput = document.getElementById('galleryInput');
        
        // Galerie nikdy nepoužívá capture atribut
        galleryInput.removeAttribute('capture');
        this.showNotification('Vyberte foto z galerie', 'info');
        
        galleryInput.click();
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.showNotification('Foto načteno úspěšně!', 'success');
            this.showPhotoPreview(file);
        } else if (file) {
            this.showNotification('Prosím vyberte obrázek (JPG, PNG, atd.)', 'error');
        }
        
        // Vyčisti input pro možnost nahrát stejný soubor znovu
        event.target.value = '';
    }

    showPhotoPreview(imageBlob) {
        const modal = document.getElementById('photoModal');
        const preview = document.getElementById('photoPreview');
        
        const url = URL.createObjectURL(imageBlob);
        preview.src = url;
        
        // Store the blob for analysis
        this.currentPhotoBlob = imageBlob;
        
        modal.style.display = 'flex';
    }

    closeModal() {
        const modal = document.getElementById('photoModal');
        modal.style.display = 'none';
        
        // Clean up blob URL
        const preview = document.getElementById('photoPreview');
        if (preview.src) {
            URL.revokeObjectURL(preview.src);
        }
    }

    retakePhoto() {
        this.closeModal();
        this.startCamera();
    }

    async analyzePhoto() {
        if (!this.currentPhotoBlob) {
            this.showNotification('Žádná fotka k analýze', 'error');
            return;
        }

        this.closeModal();
        this.showProcessingStatus(true);

        try {
            // Convert blob to base64
            const base64 = await this.blobToBase64(this.currentPhotoBlob);
            
            // Send to our API endpoint
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64,
                    timestamp: new Date().toISOString(),
                    userId: this.getUserId()
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.handleAnalysisResult(result);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Chyba při komunikaci se serverem');
            }

        } catch (error) {
            console.error('Chyba při analýze:', error);
            this.showNotification('Chyba při analýze fotky. Zkuste to znovu.', 'error');
        } finally {
            this.showProcessingStatus(false);
        }
    }

    handleAnalysisResult(result) {
        // Očekávaný formát odpovědi z Make.com:
        // { foodName: "Kuřecí řízek s bramborami", calories: 650, confidence: 0.85 }
        
        if (result.foodName && result.calories) {
            this.addMeal(result.foodName, result.calories, 'AI analýza');
            this.showNotification(`Přidáno: ${result.foodName} (${result.calories} kcal)`, 'success');
        } else {
            this.showNotification('Nepodařilo se rozpoznat jídlo. Zkuste přidat ručně.', 'warning');
        }
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    getUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    addManualMeal() {
        const foodName = document.getElementById('foodName').value.trim();
        const calories = parseInt(document.getElementById('calories').value);

        if (!foodName || !calories || calories <= 0) {
            this.showNotification('Vyplňte název jídla a kalorie', 'error');
            return;
        }

        this.addMeal(foodName, calories, 'Ruční přidání');
        
        // Clear inputs
        document.getElementById('foodName').value = '';
        document.getElementById('calories').value = '';
        
        this.showNotification(`Přidáno: ${foodName} (${calories} kcal)`, 'success');
    }

    addMeal(name, calories, source = 'Manual') {
        const meal = {
            id: Date.now(),
            name: name,
            calories: calories,
            source: source,
            timestamp: new Date().toISOString(),
            date: new Date().toDateString()
        };

        this.meals.push(meal);
        this.saveMeals();
        this.updateDisplay();
        this.loadTodaysMeals();
    }

    deleteMeal(mealId) {
        this.meals = this.meals.filter(meal => meal.id !== mealId);
        this.saveMeals();
        this.updateDisplay();
        this.loadTodaysMeals();
        this.showNotification('Jídlo odstraněno', 'success');
    }

    getTodaysMeals() {
        const today = new Date().toDateString();
        return this.meals.filter(meal => meal.date === today);
    }

    getTodaysCalories() {
        return this.getTodaysMeals().reduce((total, meal) => total + meal.calories, 0);
    }

    updateDisplay() {
        const consumed = this.getTodaysCalories();
        const remaining = Math.max(0, this.dailyGoal - consumed);
        const progress = Math.min(100, (consumed / this.dailyGoal) * 100);

        document.getElementById('caloriesConsumed').textContent = consumed;
        document.getElementById('caloriesRemaining').textContent = remaining;
        document.getElementById('dailyGoal').textContent = this.dailyGoal;
        document.getElementById('progressFill').style.width = progress + '%';
        
        // Update settings inputs if they exist
        const goalInput = document.getElementById('goalInput');
        const weeklyGoalInput = document.getElementById('weeklyGoalInput');
        if (goalInput) goalInput.value = this.dailyGoal;
        if (weeklyGoalInput) weeklyGoalInput.value = this.weeklyGoal;
        
        // Check for goal achievement notification
        if (consumed >= this.dailyGoal && localStorage.getItem('goalNotifications') !== 'false') {
            const today = new Date().toDateString();
            const lastNotification = localStorage.getItem('lastGoalNotification');
            
            if (lastNotification !== today) {
                this.showNotification('🎉 Gratulujeme! Dosáhli jste denního cíle!', 'success');
                localStorage.setItem('lastGoalNotification', today);
            }
        }
    }

    loadTodaysMeals() {
        const mealsList = document.getElementById('mealsList');
        const todaysMeals = this.getTodaysMeals();

        if (todaysMeals.length === 0) {
            mealsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Zatím žádná jídla</p>';
            return;
        }

        mealsList.innerHTML = todaysMeals.map(meal => `
            <div class="meal-item">
                <div class="meal-info">
                    <h4>${meal.name}</h4>
                    <p>${new Date(meal.timestamp).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })} • ${meal.source}</p>
                </div>
                <div class="meal-calories">${meal.calories} kcal</div>
                <div class="meal-actions">
                    <button class="btn-delete" onclick="fitnessApp.deleteMeal(${meal.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    saveSettings() {
        const newDailyGoal = parseInt(document.getElementById('goalInput').value);
        const newWeeklyGoal = parseInt(document.getElementById('weeklyGoalInput').value);
        
        if (newDailyGoal < 1000 || newDailyGoal > 5000) {
            this.showNotification('Denní cíl musí být mezi 1000-5000 kcal', 'error');
            return;
        }

        if (newWeeklyGoal < 7000 || newWeeklyGoal > 35000) {
            this.showNotification('Týdenní cíl musí být mezi 7000-35000 kcal', 'error');
            return;
        }

        this.dailyGoal = newDailyGoal;
        this.weeklyGoal = newWeeklyGoal;
        localStorage.setItem('dailyGoal', this.dailyGoal);
        localStorage.setItem('weeklyGoal', this.weeklyGoal);
        
        // Save notification settings
        localStorage.setItem('goalNotifications', document.getElementById('goalNotifications').checked);
        localStorage.setItem('reminderNotifications', document.getElementById('reminderNotifications').checked);
        
        this.updateDisplay();
        this.showNotification('Nastavení uloženo', 'success');
    }

    saveMeals() {
        localStorage.setItem('meals', JSON.stringify(this.meals));
    }

    showProcessingStatus(show) {
        const status = document.getElementById('processingStatus');
        status.style.display = show ? 'block' : 'none';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--surface);
                    color: var(--text-primary);
                    padding: 12px 20px;
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow-lg);
                    z-index: 1001;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    max-width: 90%;
                    animation: slideDown 0.3s ease;
                }
                .notification-success { border-left: 4px solid var(--primary-color); }
                .notification-error { border-left: 4px solid var(--secondary-color); }
                .notification-warning { border-left: 4px solid var(--accent-color); }
                .notification-info { border-left: 4px solid #3498db; }
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    switchSection(section) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Hide all sections
        const sections = ['summary-card', 'camera-section', 'quick-add-section', 'meals-section', 'settingsSection', 'statsSection', 'historySection'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId) || document.querySelector(`.${sectionId}`);
            if (element) {
                element.style.display = 'none';
            }
        });

        // Show relevant sections based on current section
        this.currentSection = section;
        
        switch(section) {
            case 'today':
                document.querySelector('.summary-card').style.display = 'block';
                document.querySelector('.camera-section').style.display = 'block';
                document.querySelector('.quick-add-section').style.display = 'block';
                document.querySelector('.meals-section').style.display = 'block';
                break;
                
            case 'history':
                document.getElementById('historySection').style.display = 'block';
                this.loadHistory();
                break;
                
            case 'stats':
                document.getElementById('statsSection').style.display = 'block';
                this.loadStatistics();
                break;
                
            case 'profile':
                document.getElementById('settingsSection').style.display = 'block';
                this.loadSettings();
                break;
        }
    }

    // Export data for backup
    exportData() {
        const data = {
            meals: this.meals,
            dailyGoal: this.dailyGoal,
            userId: this.getUserId(),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // Import data from backup
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.meals && Array.isArray(data.meals)) {
                this.meals = data.meals;
                this.saveMeals();
            }
            if (data.dailyGoal) {
                this.dailyGoal = data.dailyGoal;
                localStorage.setItem('dailyGoal', this.dailyGoal);
            }
            this.updateDisplay();
            this.loadTodaysMeals();
            this.showNotification('Data úspěšně importována', 'success');
        } catch (error) {
            this.showNotification('Chyba při importu dat', 'error');
        }
    }

    // Statistics functionality
    changePeriod(period) {
        this.currentPeriod = period;
        
        // Update active button
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        this.loadStatistics();
    }

    loadStatistics() {
        const stats = this.calculateStatistics(this.currentPeriod);
        
        document.getElementById('avgCalories').textContent = Math.round(stats.avgCalories);
        document.getElementById('totalCalories').textContent = stats.totalCalories;
        document.getElementById('goalDays').textContent = stats.goalDays;
        
        this.drawChart(stats.dailyData);
    }

    calculateStatistics(period) {
        const now = new Date();
        let startDate;
        
        switch(period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
        }
        
        const periodMeals = this.meals.filter(meal => {
            const mealDate = new Date(meal.timestamp);
            return mealDate >= startDate && mealDate <= now;
        });
        
        // Group by date
        const dailyData = {};
        periodMeals.forEach(meal => {
            const date = meal.date;
            if (!dailyData[date]) {
                dailyData[date] = 0;
            }
            dailyData[date] += meal.calories;
        });
        
        const totalCalories = Object.values(dailyData).reduce((sum, cal) => sum + cal, 0);
        const days = Object.keys(dailyData).length || 1;
        const avgCalories = totalCalories / days;
        const goalDays = Object.values(dailyData).filter(cal => cal >= this.dailyGoal).length;
        
        return {
            totalCalories,
            avgCalories,
            goalDays,
            dailyData: Object.entries(dailyData).map(([date, calories]) => ({
                date: new Date(date).toLocaleDateString('cs-CZ', { month: 'short', day: 'numeric' }),
                calories
            }))
        };
    }

    drawChart(data) {
        const canvas = document.getElementById('caloriesChart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (data.length === 0) {
            ctx.fillStyle = '#7f8c8d';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Žádná data k zobrazení', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const maxCalories = Math.max(...data.map(d => d.calories), this.dailyGoal);
        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        // Draw goal line
        const goalY = padding + chartHeight - (this.dailyGoal / maxCalories) * chartHeight;
        ctx.strokeStyle = '#4CAF50';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, goalY);
        ctx.lineTo(padding + chartWidth, goalY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw bars
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;
        
        data.forEach((item, index) => {
            const barHeight = (item.calories / maxCalories) * chartHeight;
            const x = padding + index * (barWidth + barSpacing);
            const y = padding + chartHeight - barHeight;
            
            // Bar color based on goal achievement
            ctx.fillStyle = item.calories >= this.dailyGoal ? '#4CAF50' : '#FF6B6B';
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Date label
            ctx.fillStyle = '#2c3e50';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.date, x + barWidth / 2, canvas.height - 10);
            
            // Calories label
            ctx.fillText(item.calories, x + barWidth / 2, y - 5);
        });
        
        // Goal line label
        ctx.fillStyle = '#4CAF50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Cíl: ${this.dailyGoal}`, padding + 5, goalY - 5);
    }

    // History functionality
    loadHistory() {
        this.displayHistory();
    }

    displayHistory(filterDate = null) {
        const historyList = document.getElementById('historyList');
        
        // Group meals by date
        const mealsByDate = {};
        this.meals.forEach(meal => {
            const date = meal.date;
            if (!mealsByDate[date]) {
                mealsByDate[date] = [];
            }
            mealsByDate[date].push(meal);
        });
        
        // Filter by date if specified
        let filteredDates = Object.keys(mealsByDate);
        if (filterDate) {
            const filterDateString = new Date(filterDate).toDateString();
            filteredDates = filteredDates.filter(date => date === filterDateString);
        }
        
        // Sort dates (newest first)
        filteredDates.sort((a, b) => new Date(b) - new Date(a));
        
        if (filteredDates.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Žádná data pro vybrané období</p>';
            return;
        }
        
        historyList.innerHTML = filteredDates.map(date => {
            const meals = mealsByDate[date];
            const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
            const dateObj = new Date(date);
            
            return `
                <div class="history-item">
                    <div>
                        <div class="history-date">${dateObj.toLocaleDateString('cs-CZ', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</div>
                        <div class="history-meals">${meals.length} jídel</div>
                    </div>
                    <div class="history-total">${totalCalories} kcal</div>
                </div>
            `;
        }).join('');
    }

    filterHistory() {
        const dateFilter = document.getElementById('dateFilter').value;
        if (dateFilter) {
            this.displayHistory(dateFilter);
        }
    }

    clearHistoryFilter() {
        document.getElementById('dateFilter').value = '';
        this.displayHistory();
    }

    // Settings functionality
    loadSettings() {
        document.getElementById('goalInput').value = this.dailyGoal;
        document.getElementById('weeklyGoalInput').value = this.weeklyGoal;
        document.getElementById('goalNotifications').checked = localStorage.getItem('goalNotifications') !== 'false';
        document.getElementById('reminderNotifications').checked = localStorage.getItem('reminderNotifications') === 'true';
    }

    // Import/Export functionality
    triggerImport() {
        document.getElementById('importFile').click();
    }

    handleImport(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.importData(e.target.result);
                } catch (error) {
                    this.showNotification('Chyba při čtení souboru', 'error');
                }
            };
            reader.readAsText(file);
        }
    }

    clearAllData() {
        if (confirm('Opravdu chcete vymazat všechna data? Tato akce je nevratná!')) {
            if (confirm('Jste si jisti? Všechna jídla a nastavení budou ztracena!')) {
                localStorage.removeItem('meals');
                localStorage.removeItem('dailyGoal');
                localStorage.removeItem('weeklyGoal');
                localStorage.removeItem('goalNotifications');
                localStorage.removeItem('reminderNotifications');
                
                this.meals = [];
                this.dailyGoal = 2000;
                this.weeklyGoal = 14000;
                
                this.updateDisplay();
                this.loadTodaysMeals();
                this.loadSettings();
                
                this.showNotification('Všechna data byla vymazána', 'success');
            }
        }
    }

    // Logout functionality
    logout() {
        // Confirm logout
        if (confirm('Opravdu se chcete odhlásit?')) {
            // Stop camera if running
            this.stopCamera();
            
            // Clear login data
            localStorage.removeItem('fitnessLoggedIn');
            localStorage.removeItem('fitnessUsername');
            localStorage.removeItem('fitnessLoginTime');
            
            // Show logout message
            this.showNotification('Odhlášení proběhlo úspěšně', 'success');
            
            // Redirect to login page after short delay
            setTimeout(() => {
                window.location.href = 'fitness-login.html';
            }, 1000);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fitnessApp = new FitnessTracker();
});

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
} 