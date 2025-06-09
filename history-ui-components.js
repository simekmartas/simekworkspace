// History UI Components - komponenty pro práci s historickými daty
class HistoryUIComponents {
    constructor() {
        this.currentSelectedDate = null;
        this.onDateChangedCallback = null;
        
        console.log('🎨 HistoryUIComponents inicializovány');
    }

    // Vytvořit kompaktní historický picker za tlačítkem
    createDatePicker(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container ${containerId} nenalezen`);
            return null;
        }

        const {
            includeToday = true,
            onDateChanged = null,
            placeholder = 'Vyberte datum',
            showStats = true
        } = options;

        this.onDateChangedCallback = onDateChanged;

        // Získat dostupná data
        const availableDates = window.historyManager ? window.historyManager.getAvailableDates() : [];
        const todayString = this.getTodayString();
        
        // Zkontrolovat oprávnění pro administrátorské funkce
        const currentUser = this.getCurrentUser();
        const isAdmin = currentUser && currentUser.role && currentUser.role.toLowerCase() === 'administrator';

        container.innerHTML = `
            <div class="compact-history-picker">
                <button class="history-toggle-btn" id="historyToggleBtn" onclick="window.historyUI.toggleHistoryPanel('${containerId}')">
                    📅 Historie (${availableDates.length})
                </button>
                
                <div class="history-panel" id="historyPanel_${containerId}" style="display: none;">
                    <div class="history-panel-header">
                        <span class="history-panel-title">📅 Historická data</span>
                        <button class="history-panel-close" onclick="window.historyUI.closeHistoryPanel('${containerId}')">&times;</button>
                    </div>
                    
                    <div class="history-panel-content">
                        <div class="date-selector">
                            <select class="date-picker-select" id="historyDateSelect">
                                ${includeToday ? `<option value="current">📊 Aktuální data</option>` : ''}
                                ${availableDates.length > 0 ? '<optgroup label="Historická data">' : ''}
                                ${availableDates.map(date => `
                                    <option value="${date}">
                                        ${this.formatDateForDisplay(date)} ${date === todayString ? '(dnes)' : ''}
                                    </option>
                                `).join('')}
                                ${availableDates.length > 0 ? '</optgroup>' : ''}
                                ${availableDates.length === 0 ? `<option disabled>Žádná historická data</option>` : ''}
                            </select>
                        </div>
                        
                        ${showStats ? `
                            <div class="history-stats">
                                <div class="stat">
                                    <span class="stat-label">Dostupných dní:</span>
                                    <span class="stat-value">${availableDates.length}</span>
                                </div>
                                ${availableDates.length > 0 ? `
                                    <div class="stat">
                                        <span class="stat-label">Od:</span>
                                        <span class="stat-value">${this.formatDateForDisplay(availableDates[availableDates.length - 1])}</span>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                        
                        ${availableDates.length === 0 ? `
                            <div class="history-empty">
                                <p>📂 Zatím nejsou dostupná žádná historická data.</p>
                                <p><small>Data se ukládají každý den ve 22:35</small></p>
                                ${isAdmin ? `
                                    <button class="create-snapshot-btn" onclick="window.historyDebug.createTodaySnapshot()">
                                        📸 Vytvořit snapshot (admin)
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                        
                        ${isAdmin && availableDates.length > 0 ? `
                            <div class="admin-controls">
                                <h5>🔧 Administrátorské funkce</h5>
                                <button class="admin-btn" onclick="window.historyDebug.exportHistory()" title="Export dat">
                                    💾 Export historie
                                </button>
                                <button class="admin-btn" onclick="window.historyDebug.showStats()" title="Statistiky">
                                    📊 Statistiky
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // CSS styly pro date picker
        this.injectDatePickerStyles();

        // Event listener
        const selectElement = container.querySelector('#historyDateSelect');
        if (selectElement) {
            selectElement.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                this.handleDateSelection(selectedValue);
            });
        }

        return container.querySelector('.compact-history-picker');
    }

    // Toggle historie panelu
    toggleHistoryPanel(containerId) {
        const panel = document.getElementById(`historyPanel_${containerId}`);
        const isVisible = panel.style.display !== 'none';
        
        if (isVisible) {
            panel.style.display = 'none';
        } else {
            panel.style.display = 'block';
            panel.style.animation = 'slideDown 0.3s ease-out';
        }
    }

    // Zavřít historie panel
    closeHistoryPanel(containerId) {
        const panel = document.getElementById(`historyPanel_${containerId}`);
        panel.style.display = 'none';
    }

    // Získat aktuálního uživatele
    getCurrentUser() {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const username = localStorage.getItem('username');
            return users.find(u => u.username === username) || null;
        } catch (e) {
            return null;
        }
    }

    // Vytvořit kompaktní date switcher pro menší prostory
    createCompactDateSwitcher(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container ${containerId} nenalezen`);
            return null;
        }

        const availableDates = window.historyManager ? window.historyManager.getAvailableDates() : [];
        const todayString = this.getTodayString();

        container.innerHTML = `
            <div class="compact-date-switcher">
                <button class="date-nav-btn" id="prevDateBtn" ${availableDates.length === 0 ? 'disabled' : ''}>
                    ⬅️
                </button>
                
                <div class="current-date-display" id="currentDateDisplay">
                    📊 Aktuální data
                </div>
                
                <button class="date-nav-btn" id="nextDateBtn" disabled>
                    ➡️
                </button>
                
                <button class="date-options-btn" id="dateOptionsBtn" title="Více možností">
                    ⚙️
                </button>
            </div>
            
            <div class="date-options-panel" id="dateOptionsPanel" style="display: none;">
                <div class="date-option" onclick="window.location.reload()">📊 Aktuální data</div>
                ${availableDates.map(date => `
                    <div class="date-option" data-date="${date}">
                        📅 ${this.formatDateForDisplay(date)} ${date === todayString ? '(dnes)' : ''}
                    </div>
                `).join('')}
            </div>
        `;

        this.injectCompactSwitcherStyles();
        this.setupCompactSwitcherEvents(container);

        return container.querySelector('.compact-date-switcher');
    }

    // Vytvořit timeline historických dat
    createHistoryTimeline(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container ${containerId} nenalezen`);
            return null;
        }

        const historyData = window.historyManager ? window.historyManager.getHistoryData() : {};
        const dates = Object.keys(historyData).sort();

        if (dates.length === 0) {
            container.innerHTML = `
                <div class="history-timeline-empty">
                    <div class="empty-icon">📈</div>
                    <h3>Žádná historická data</h3>
                    <p>Historie se začne ukládat od dnešního dne ve 22:35</p>
                </div>
            `;
            return null;
        }

        container.innerHTML = `
            <div class="history-timeline">
                <div class="timeline-header">
                    <h3>📈 Historie výkonnosti</h3>
                    <div class="timeline-stats">
                        <span>${dates.length} dní</span>
                        <span>od ${this.formatDateForDisplay(dates[0])}</span>
                    </div>
                </div>
                
                <div class="timeline-content">
                    ${dates.reverse().map((date, index) => {
                        const data = historyData[date];
                        const isToday = date === this.getTodayString();
                        
                        return `
                            <div class="timeline-item ${isToday ? 'today' : ''}" data-date="${date}">
                                <div class="timeline-marker">
                                    ${isToday ? '🔥' : (index === 0 ? '⭐' : '📊')}
                                </div>
                                <div class="timeline-content-item">
                                    <div class="timeline-date">
                                        ${this.formatDateForDisplay(date)}
                                        ${isToday ? '<span class="today-badge">dnes</span>' : ''}
                                    </div>
                                    <div class="timeline-stats">
                                        <div class="stat">
                                            <span class="stat-icon">👥</span>
                                            <span>${data.metadata.totalSellers} prodejců</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-icon">🏆</span>
                                            <span>${data.metadata.totalPoints} bodů</span>
                                        </div>
                                        ${data.metadata.topSeller ? `
                                            <div class="stat">
                                                <span class="stat-icon">🥇</span>
                                                <span>${data.metadata.topSeller.name}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="timeline-actions">
                                        <button class="timeline-btn" onclick="window.historyUI.selectDate('${date}')">
                                            Zobrazit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        this.injectTimelineStyles();

        return container.querySelector('.history-timeline');
    }

    // Handling výběru data
    handleDateSelection(selectedValue) {
        console.log(`📅 Vybráno datum: ${selectedValue}`);
        
        this.currentSelectedDate = selectedValue === 'current' ? null : selectedValue;
        
        // Zavolat callback
        if (this.onDateChangedCallback && typeof this.onDateChangedCallback === 'function') {
            this.onDateChangedCallback(this.currentSelectedDate);
        }
        
        // Globální event
        window.dispatchEvent(new CustomEvent('historyDateChanged', {
            detail: { selectedDate: this.currentSelectedDate }
        }));
    }

    // Vybrat konkrétní datum (použité z timeline)
    selectDate(dateString) {
        this.handleDateSelection(dateString);
        
        // Aktualizovat UI selecty
        const selects = document.querySelectorAll('#historyDateSelect');
        selects.forEach(select => {
            select.value = dateString;
        });
    }

    // Pomocné metody
    getTodayString() {
        const now = new Date();
        return now.getFullYear() + '-' + 
               String(now.getMonth() + 1).padStart(2, '0') + '-' + 
               String(now.getDate()).padStart(2, '0');
    }

    formatDateForDisplay(dateString) {
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        
        const options = { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short'
        };
        
        return date.toLocaleDateString('cs-CZ', options);
    }

    // CSS styly pro kompaktní historický picker
    injectDatePickerStyles() {
        if (document.getElementById('historyDatePickerStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'historyDatePickerStyles';
        styles.textContent = `
            .compact-history-picker {
                position: relative;
                margin-bottom: 1rem;
            }

            .history-toggle-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 600;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .history-toggle-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .history-panel {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--card-background, #ffffff);
                border: 2px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                margin-top: 0.5rem;
                min-width: 320px;
            }

            .history-panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 10px 10px 0 0;
            }

            .history-panel-title {
                font-weight: 600;
                color: var(--text-primary, #333);
            }

            .history-panel-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--text-secondary, #666);
                padding: 0.25rem;
                border-radius: 4px;
                transition: all 0.3s ease;
            }

            .history-panel-close:hover {
                background: var(--hover-color, #f5f5f5);
                color: var(--text-primary, #333);
            }

            .history-panel-content {
                padding: 1rem;
            }

            .date-selector {
                margin-bottom: 1rem;
            }

            .date-picker-select {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid var(--border-color, #e0e0e0);
                border-radius: 8px;
                background: var(--input-background, #ffffff);
                color: var(--text-primary, #333);
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .date-picker-select:focus {
                outline: none;
                border-color: var(--primary-color, #2196F3);
                box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
            }

            .history-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5rem;
                margin-bottom: 1rem;
                padding: 0.75rem;
                background: var(--highlight-background, #f8f9fa);
                border-radius: 8px;
            }

            .history-stats .stat {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .history-stats .stat-label {
                font-size: 0.75rem;
                color: var(--text-secondary, #666);
                margin-bottom: 0.25rem;
            }

            .history-stats .stat-value {
                font-weight: 600;
                color: var(--primary-color, #2196F3);
                font-size: 0.875rem;
            }

            .history-empty {
                text-align: center;
                padding: 1.5rem;
                color: var(--text-secondary, #666);
            }

            .history-empty p {
                margin: 0.5rem 0;
                font-size: 0.875rem;
            }

            .admin-controls {
                border-top: 1px solid var(--border-color, #e0e0e0);
                padding-top: 1rem;
                margin-top: 1rem;
            }

            .admin-controls h5 {
                margin: 0 0 0.75rem 0;
                font-size: 0.875rem;
                color: var(--text-primary, #333);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .admin-btn,
            .create-snapshot-btn {
                background: var(--primary-color, #2196F3);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.75rem;
                font-weight: 600;
                transition: all 0.3s ease;
                margin-right: 0.5rem;
                margin-bottom: 0.5rem;
            }

            .admin-btn:hover,
            .create-snapshot-btn:hover {
                background: var(--primary-dark, #1976D2);
                transform: translateY(-1px);
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Responzivní design */
            @media (max-width: 768px) {
                .history-panel {
                    left: -50px;
                    right: -50px;
                }
                
                .history-stats {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // CSS styly pro kompaktní switcher
    injectCompactSwitcherStyles() {
        if (document.getElementById('compactSwitcherStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'compactSwitcherStyles';
        styles.textContent = `
            .compact-date-switcher {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: var(--card-background, #ffffff);
                border: 2px solid var(--border-color, #e0e0e0);
                border-radius: 8px;
                padding: 0.5rem;
                position: relative;
            }

            .date-nav-btn,
            .date-options-btn {
                background: none;
                border: none;
                padding: 0.5rem;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1rem;
            }

            .date-nav-btn:hover:not(:disabled),
            .date-options-btn:hover {
                background: var(--hover-color, #f5f5f5);
            }

            .date-nav-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }

            .current-date-display {
                flex-grow: 1;
                text-align: center;
                font-weight: 600;
                color: var(--text-primary, #333);
                padding: 0.5rem;
                font-size: 0.875rem;
            }

            .date-options-panel {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--card-background, #ffffff);
                border: 2px solid var(--border-color, #e0e0e0);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                margin-top: 0.5rem;
            }

            .date-option {
                padding: 0.75rem;
                cursor: pointer;
                transition: all 0.3s ease;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
                font-size: 0.875rem;
            }

            .date-option:last-child {
                border-bottom: none;
            }

            .date-option:hover {
                background: var(--hover-color, #f5f5f5);
                color: var(--primary-color, #2196F3);
            }
        `;
        
        document.head.appendChild(styles);
    }

    // CSS styly pro timeline
    injectTimelineStyles() {
        if (document.getElementById('timelineStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'timelineStyles';
        styles.textContent = `
            .history-timeline {
                background: var(--card-background, #ffffff);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .timeline-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .timeline-header h3 {
                margin: 0;
                font-size: 1.25rem;
            }

            .timeline-stats {
                display: flex;
                gap: 1rem;
                font-size: 0.875rem;
                opacity: 0.9;
            }

            .timeline-content {
                padding: 1rem;
                max-height: 400px;
                overflow-y: auto;
            }

            .timeline-item {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                border: 2px solid transparent;
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .timeline-item:hover {
                background: var(--hover-color, #f8f9fa);
                border-color: var(--primary-color, #2196F3);
            }

            .timeline-item.today {
                background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
                border-color: #ff9800;
            }

            .timeline-marker {
                font-size: 1.5rem;
                flex-shrink: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--highlight-background, #f8f9fa);
                border-radius: 50%;
            }

            .timeline-content-item {
                flex-grow: 1;
            }

            .timeline-date {
                font-weight: 600;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .today-badge {
                background: #ff9800;
                color: white;
                padding: 0.125rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .timeline-stats {
                display: flex;
                gap: 1rem;
                margin-bottom: 0.5rem;
                flex-wrap: wrap;
            }

            .stat {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.875rem;
                color: var(--text-secondary, #666);
            }

            .stat-icon {
                font-size: 1rem;
            }

            .timeline-actions {
                display: flex;
                gap: 0.5rem;
            }

            .timeline-btn {
                background: var(--primary-color, #2196F3);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .timeline-btn:hover {
                background: var(--primary-dark, #1976D2);
                transform: translateY(-1px);
            }

            .history-timeline-empty {
                text-align: center;
                padding: 4rem 2rem;
                color: var(--text-secondary, #666);
            }

            .history-timeline-empty .empty-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                opacity: 0.6;
            }

            .history-timeline-empty h3 {
                margin: 0 0 1rem 0;
                color: var(--text-primary, #333);
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Nastavit events pro kompaktní switcher
    setupCompactSwitcherEvents(container) {
        const optionsBtn = container.querySelector('#dateOptionsBtn');
        const optionsPanel = container.querySelector('#dateOptionsPanel');
        
        if (optionsBtn && optionsPanel) {
            optionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = optionsPanel.style.display !== 'none';
                optionsPanel.style.display = isVisible ? 'none' : 'block';
            });

            // Zavřít při kliknutí mimo
            document.addEventListener('click', () => {
                optionsPanel.style.display = 'none';
            });

            // Event pro výběr data z options
            optionsPanel.addEventListener('click', (e) => {
                if (e.target.classList.contains('date-option')) {
                    const selectedDate = e.target.dataset.date;
                    if (selectedDate) {
                        this.handleDateSelection(selectedDate);
                        optionsPanel.style.display = 'none';
                    }
                }
            });
        }
    }
}

// Export pro globální použití
window.HistoryUIComponents = HistoryUIComponents;

// Globální instance
window.historyUI = new HistoryUIComponents();

// Helper funkce pro rychlé vytvoření komponent
window.createHistoryDatePicker = (containerId, options = {}) => {
    return window.historyUI.createDatePicker(containerId, options);
};

window.createHistoryTimeline = (containerId) => {
    return window.historyUI.createHistoryTimeline(containerId);
}; 