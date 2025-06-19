// smeny.js - Systém pro správu směn
console.log('🕐 Směny JS modul se načítá...');

class ShiftsManager {
    constructor() {
        this.shifts = [];
        this.allShifts = []; // Všechny směny bez filtrování
        this.currentDate = new Date();
        this.currentUser = null;
        this.editingShift = null;
        this.isLoading = false;
        this.currentStoreFilter = 'my'; // Defaultní filtr na "Moje směny"
        
        // Pro hromadné přidávání směn
        this.miniCalendarDate = new Date();
        this.selectedDates = new Set(); // Set pro vybrané datumy
        
        // Pro hromadné mazání směn
        this.deleteMiniCalendarDate = new Date();
        this.selectedShiftsToDelete = new Set(); // Set pro vybrané směny ke smazání
        
        // Získat ID uživatele pro filtrování směn
        this.userId = localStorage.getItem('sellerId') || localStorage.getItem('userId') || localStorage.getItem('username');
        this.userProdejna = localStorage.getItem('userProdejna') || 'Globus';
        
        // Seznam dostupných prodejen (podle skutečných dat)
        this.availableStores = [
            'Globus',
            'Senimo',
            'Čepkov',
            'Přerov',
            'Vsetín',
            'Šternberk'
        ];
        
        console.log('🔧 ShiftsManager inicializován pro uživatele:', this.userId);
        console.log('🏪 Uživatelova prodejna:', this.userProdejna);
    }

    async init() {
        console.log('🚀 Inicializuji Směny systém...');
        
        try {
            await this.loadShifts();
            this.setupEventListeners();
            
            // Nastav defaultní filtr na "Moje směny"
            document.getElementById('storeFilter').value = this.currentStoreFilter;
            
            this.renderCalendar();
            this.updateStats();
            this.updateTodayTomorrowInfo();
            console.log('✅ Směny systém úspěšně načten');
        } catch (error) {
            console.error('❌ Chyba při inicializaci směn:', error);
            this.showError('Chyba při načítání směn: ' + error.message);
        }
    }

    // Načtení směn ze serveru s fallback na localStorage
    async loadShifts() {
        this.setLoading(true);
        
        try {
            console.log('🌐 Pokusím se načíst směny ze serveru...');
            
            // Zkus načíst ze serveru
            const response = await fetch('/api/shifts-github', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.shifts) {
                    // Uložit všechny směny
                    this.allShifts = data.shifts || [];
                    
                    // Aplikovat filtr
                    this.applyStoreFilter();
                    
                    // Uložit do localStorage jako backup
                    localStorage.setItem('shifts_data', JSON.stringify(this.allShifts));
                    console.log('✅ Směny načteny ze serveru:', this.allShifts.length);
                    
                    this.setLoading(false);
                    return;
                }
            }
            
            throw new Error('Server data nejsou validní');
            
        } catch (error) {
            console.warn('⚠️ Server nedostupný, používám localStorage:', error.message);
            
            // Fallback na localStorage
            try {
                const localData = JSON.parse(localStorage.getItem('shifts_data') || '[]');
                this.allShifts = localData || [];
                
                // Aplikovat filtr
                this.applyStoreFilter();
                
                console.log('📦 Směny načteny z localStorage:', this.allShifts.length);
            } catch (localError) {
                console.error('❌ Chyba při načítání z localStorage:', localError);
                this.allShifts = [];
                this.shifts = [];
            }
        }
        
        this.setLoading(false);
    }

    // Aplikace filtru podle prodejny
    applyStoreFilter() {
        console.log('🔍 Aplikuji filtr prodejny:', this.currentStoreFilter);
        
        switch (this.currentStoreFilter) {
            case 'my':
                // Jen moje směny (podle userId)
                this.shifts = this.allShifts.filter(shift => 
                    shift.userId === this.userId || 
                    shift.sellerId === this.userId ||
                    shift.username === this.userId
                );
                break;
                
            default:
                // Specifická prodejna
                this.shifts = this.allShifts.filter(shift => 
                    shift.prodejna === this.currentStoreFilter ||
                    shift.store === this.currentStoreFilter
                );
                break;
        }
        
        console.log(`📊 Filtr "${this.currentStoreFilter}": ${this.shifts.length} směn z celkem ${this.allShifts.length}`);
    }

    // Uložení směny na server s fallback
    async saveShift(shiftData) {
        try {
            // Okamžitě ulož do localStorage
            const existingShifts = JSON.parse(localStorage.getItem('shifts_data') || '[]');
            
            if (shiftData.id) {
                // Aktualizace existující směny
                const index = existingShifts.findIndex(s => s.id === shiftData.id);
                if (index !== -1) {
                    existingShifts[index] = shiftData;
                } else {
                    existingShifts.push(shiftData);
                }
            } else {
                // Nová směna
                shiftData.id = Date.now().toString();
                existingShifts.push(shiftData);
            }
            
            // Aktualizuj localStorage a allShifts
            localStorage.setItem('shifts_data', JSON.stringify(existingShifts));
            this.allShifts = existingShifts;
            console.log('📦 Směna uložena do localStorage');
            
            // Zkus synchronizovat se serverem na pozadí
            try {
                const response = await fetch('/api/shifts-github', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(shiftData)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log('✅ Směna synchronizována se serverem');
                    } else {
                        console.warn('⚠️ Server odmítl směnu:', data.error);
                    }
                } else {
                    console.warn('⚠️ Server error:', response.status);
                }
            } catch (syncError) {
                console.warn('⚠️ Synchronizace se serverem selhala:', syncError.message);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Chyba při ukládání směny:', error);
            throw error;
        }
    }

    // Smazání směny
    async deleteShift(shiftId) {
        console.log('🗑️ Začínám mazání směny ID:', shiftId);
        
        try {
            // Načti aktuální data z localStorage
            const existingShifts = JSON.parse(localStorage.getItem('shifts_data') || '[]');
            console.log('📦 Nalezeno v localStorage:', existingShifts.length, 'směn');
            
            // Najdi směnu ke smazání
            const shiftToDelete = existingShifts.find(s => s.id === shiftId);
            if (!shiftToDelete) {
                console.warn('⚠️ Směna s ID', shiftId, 'nebyla nalezena v localStorage');
                throw new Error('Směna nebyla nalezena');
            }
            
            console.log('✅ Nalezena směna ke smazání:', shiftToDelete.date, shiftToDelete.type);
            
            // Smaž z localStorage
            const filteredShifts = existingShifts.filter(s => s.id !== shiftId);
            localStorage.setItem('shifts_data', JSON.stringify(filteredShifts));
            
            // Aktualizuj allShifts
            this.allShifts = filteredShifts;
            
            console.log('📦 Směna smazána z localStorage. Zbývá:', filteredShifts.length, 'směn');
            
            // Zkus smazat ze serveru na pozadí
            try {
                const response = await fetch(`/api/shifts-github/${shiftId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    console.log('✅ Směna smazána ze serveru');
                } else {
                    console.warn('⚠️ Server delete error:', response.status);
                }
            } catch (syncError) {
                console.warn('⚠️ Delete synchronizace selhala:', syncError.message);
                // Toto není kritická chyba - směna je už smazána lokálně
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Chyba při mazání směny:', error);
            throw error;
        }
    }

    // Event listenery
    setupEventListeners() {
        // Navigace kalendáře
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
            this.updateStats();
            this.updateTodayTomorrowInfo();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
            this.updateStats();
            this.updateTodayTomorrowInfo();
        });
        
        // Přidání směny
        document.getElementById('addShiftBtn').addEventListener('click', () => {
            this.openShiftModal();
        });
        
        // Hromadné přidání směn
        document.getElementById('addMultipleShiftsBtn').addEventListener('click', () => {
            this.openMultipleShiftsModal();
        });
        
        // Hromadné mazání směn
        document.getElementById('deleteMultipleShiftsBtn').addEventListener('click', () => {
            this.openDeleteShiftsModal();
        });
        
        // Odstranění duplicitních směn
        document.getElementById('removeDuplicatesBtn').addEventListener('click', () => {
            this.removeDuplicateShifts();
        });
        
        // Export
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportShifts();
        });
        
        // Apple kalendář export
        document.getElementById('appleCalendarBtn').addEventListener('click', () => {
            this.exportToAppleCalendar();
        });
        
        // Google kalendář export
        document.getElementById('googleCalendarBtn').addEventListener('click', () => {
            this.exportToGoogleCalendar();
        });
        
        // Synchronizace
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncAllShiftsToServer();
        });
        
        // Filtr prodejen
        document.getElementById('storeFilter').addEventListener('change', (e) => {
            this.currentStoreFilter = e.target.value;
            this.applyStoreFilter();
            this.renderCalendar();
            this.updateStats();
            this.updateTodayTomorrowInfo();
        });
        
        // Modal události
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeShiftModal();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeShiftModal();
        });
        
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveCurrentShift();
        });
        
        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.deleteCurrentShift();
        });
        
        // Formulář
        document.getElementById('shiftForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCurrentShift();
        });
        
        // Typ směny změna - automatické vyplnění času
        document.getElementById('shiftType').addEventListener('change', (e) => {
            this.autoFillTimes(e.target.value);
        });
        
        // Zavření modalu při kliknutí mimo
        document.getElementById('shiftModal').addEventListener('click', (e) => {
            if (e.target.id === 'shiftModal') {
                this.closeShiftModal();
            }
        });
        
        // Multiple shifts modal události
        document.getElementById('closeMultipleModal').addEventListener('click', () => {
            this.closeMultipleShiftsModal();
        });
        
        document.getElementById('cancelMultipleBtn').addEventListener('click', () => {
            this.closeMultipleShiftsModal();
        });
        
        document.getElementById('saveMultipleBtn').addEventListener('click', () => {
            this.saveMultipleShifts();
        });
        
        // Navigace v minikalendáři
        document.getElementById('miniPrevMonth').addEventListener('click', () => {
            this.miniCalendarDate.setMonth(this.miniCalendarDate.getMonth() - 1);
            this.renderMiniCalendar();
        });
        
        document.getElementById('miniNextMonth').addEventListener('click', () => {
            this.miniCalendarDate.setMonth(this.miniCalendarDate.getMonth() + 1);
            this.renderMiniCalendar();
        });
        
        // Typ směny změna - automatické vyplnění času v multiple modal
        document.getElementById('multiShiftType').addEventListener('change', (e) => {
            this.autoFillMultipleTimes(e.target.value);
        });
        
        // Zavření multiple modal při kliknutí mimo
        document.getElementById('multipleShiftsModal').addEventListener('click', (e) => {
            if (e.target.id === 'multipleShiftsModal') {
                this.closeMultipleShiftsModal();
            }
        });
        
        // Delete shifts modal události
        document.getElementById('closeDeleteModal').addEventListener('click', () => {
            this.closeDeleteShiftsModal();
        });
        
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.closeDeleteShiftsModal();
        });
        
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteSelectedShifts();
        });
        
        // Navigace v delete minikalendáři
        document.getElementById('deleteMiniPrevMonth').addEventListener('click', () => {
            this.deleteMiniCalendarDate.setMonth(this.deleteMiniCalendarDate.getMonth() - 1);
            this.renderDeleteMiniCalendar();
        });
        
        document.getElementById('deleteMiniNextMonth').addEventListener('click', () => {
            this.deleteMiniCalendarDate.setMonth(this.deleteMiniCalendarDate.getMonth() + 1);
            this.renderDeleteMiniCalendar();
        });
        
        // Zavření delete modal při kliknutí mimo
        document.getElementById('deleteMultipleShiftsModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteMultipleShiftsModal') {
                this.closeDeleteShiftsModal();
            }
        });
    }

    // Vykreslení kalendáře
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Aktualizuj nadpis měsíce
        const monthNames = [
            'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
            'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
        ];
        document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
        
        // Vyčisti kalendář
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        
        // Přidej hlavičky dnů
        const dayHeaders = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });
        
        // Prvý den měsíce a počet dní
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Začni od pondělí (1) místo neděle (0)
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;
        
        // Předchozí měsíc
        const prevMonth = new Date(year, month - 1, 0);
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonth.getDate() - i;
            this.createDayElement(day, month - 1, year, true);
        }
        
        // Aktuální měsíc
        for (let day = 1; day <= daysInMonth; day++) {
            this.createDayElement(day, month, year, false);
        }
        
        // Následující měsíc - doplnění do 42 buněk (6 týdnů)
        const totalCells = 42 - 7; // 42 - 7 headers
        const usedCells = startDay + daysInMonth;
        const remainingCells = totalCells - usedCells;
        
        for (let day = 1; day <= remainingCells; day++) {
            this.createDayElement(day, month + 1, year, true);
        }
    }

    // Vytvoření elementu dne
    createDayElement(day, month, year, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        // Zkontroluj jestli je to dnešek
        const today = new Date();
        const cellDate = new Date(year, month, day);
        if (cellDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Číslo dne
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Kontejner pro směny
        const shiftsContainer = document.createElement('div');
        shiftsContainer.className = 'day-shifts';
        
        // Najdi směny pro tento den
        const dayShifts = this.getShiftsForDate(cellDate);
        dayShifts.forEach(shift => {
            const shiftElement = document.createElement('div');
            shiftElement.className = `shift-item ${shift.type}`;
            shiftElement.textContent = this.formatShiftDisplay(shift);
            shiftElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editShift(shift);
            });
            shiftsContainer.appendChild(shiftElement);
        });
        
        dayElement.appendChild(shiftsContainer);
        
        // Kliknutí na den - přidání nové směny
        dayElement.addEventListener('click', () => {
            if (!isOtherMonth) {
                this.openShiftModal(cellDate);
            }
        });
        
        document.getElementById('calendarGrid').appendChild(dayElement);
    }

    // Získání směn pro konkrétní datum
    getShiftsForDate(date) {
        const dateString = this.formatDateString(date);
        return this.shifts.filter(shift => shift.date === dateString);
    }

    // Formátování zobrazení směny
    formatShiftDisplay(shift) {
        let display = '';
        
        if (shift.type === 'off') {
            display = 'Volno';
        } else if (shift.type === 'vacation') {
            display = 'Dovolená';
        } else if (shift.timeFrom && shift.timeTo) {
            display = `${shift.timeFrom}-${shift.timeTo}`;
        } else {
            switch (shift.type) {
                case 'morning': display = 'Ráno'; break;
                case 'afternoon': display = 'Odpoledne'; break;
                case 'evening': display = 'Večer'; break;
                case 'full': display = 'Celý den'; break;
                default: display = 'Směna'; break;
            }
        }
        
        // Přidej jméno uživatele pokud nejsme ve filtru "Moje směny"
        if (this.currentStoreFilter !== 'my') {
            const userName = shift.displayName || shift.username || shift.userId || 'Neznámý';
            const shortName = this.getShortUserName(userName);
            display += ` - ${shortName}`;
        }
        
        // Přidej označení prodejny pokud je jiná než uživatelova a nejsme ve filtru "Moje směny"
        const shiftStore = shift.prodejna || shift.store;
        if (this.currentStoreFilter === 'my' && shiftStore && shiftStore !== this.userProdejna) {
            const storeShort = this.getStoreShortName(shiftStore);
            display += ` (${storeShort})`;
        }
        
        return display;
    }
    
    // Zkrácený název prodejny pro zobrazení
    getStoreShortName(storeName) {
        switch (storeName) {
            case 'Globus': return 'GLB';
            case 'Senimo': 
            case 'Hlavní sklad - Senimo': return 'SEN'; // Kompatibilita se starými daty
            case 'Čepkov': return 'ČEP';
            case 'Přerov': return 'PRE';
            case 'Vsetín': return 'VSE';
            case 'Šternberk': return 'ŠTE';
            default: return storeName.substring(0, 3).toUpperCase();
        }
    }

    // Zkrácené jméno uživatele pro zobrazení
    getShortUserName(userName) {
        if (!userName) return 'N/A';
        
        // Speciální jména
        const nameMap = {
            'Šimon': 'Šim',
            'Simon': 'Šim',
            'Létal': 'Lét',
            'Martin': 'Mar',
            'Petra': 'Pet',
            'Pavel': 'Pav',
            'Jana': 'Jan',
            'Tomáš': 'Tom',
            'Lucie': 'Luc',
            'David': 'Dav'
        };
        
        // Pokud máme speciální mapping, použij ho
        if (nameMap[userName]) {
            return nameMap[userName];
        }
        
        // Jinak vezmi první 3 znaky
        return userName.substring(0, 3);
    }

    // Otevření modalu pro směnu
    openShiftModal(date = null) {
        this.editingShift = null;
        document.getElementById('modalTitle').textContent = 'Přidat směnu';
        document.getElementById('deleteBtn').style.display = 'none';
        
        // Vyčisti formulář
        document.getElementById('shiftForm').reset();
        
        // Nastav datum pokud je zadané
        if (date) {
            document.getElementById('shiftDate').value = this.formatDateInput(date);
        }
        
        // Výchozí nastavení: celodenní směna od 8:00 do 20:00
        document.getElementById('shiftType').value = 'full';
        document.getElementById('timeFrom').value = '08:00';
        document.getElementById('timeTo').value = '20:00';
        
        // Výchozí prodejna - uživatelova prodejna
        document.getElementById('shiftStore').value = this.userProdejna;
        
        document.getElementById('shiftModal').classList.add('show');
    }

    // Úprava existující směny
    editShift(shift) {
        this.editingShift = shift;
        document.getElementById('modalTitle').textContent = 'Upravit směnu';
        document.getElementById('deleteBtn').style.display = 'block';
        
        // Vyplň formulář
        document.getElementById('shiftDate').value = shift.date;
        document.getElementById('shiftType').value = shift.type;
        document.getElementById('timeFrom').value = shift.timeFrom || '';
        document.getElementById('timeTo').value = shift.timeTo || '';
        document.getElementById('shiftNote').value = shift.note || '';
        document.getElementById('shiftStore').value = shift.prodejna || shift.store || this.userProdejna;
        
        document.getElementById('shiftModal').classList.add('show');
    }

    // Zavření modalu
    closeShiftModal() {
        document.getElementById('shiftModal').classList.remove('show');
        this.editingShift = null;
    }

    // Uložení aktuální směny
    async saveCurrentShift() {
        try {
            const form = document.getElementById('shiftForm');
            const formData = new FormData(form);
            
            // Validace
            const date = document.getElementById('shiftDate').value;
            const type = document.getElementById('shiftType').value;
            const store = document.getElementById('shiftStore').value;
            
            if (!date || !type || !store) {
                this.showError('Vyplňte prosím všechna povinná pole');
                return;
            }
            
            // Vytvoř objekt směny
            const shiftData = {
                id: this.editingShift ? this.editingShift.id : null,
                date: date,
                type: type,
                timeFrom: document.getElementById('timeFrom').value || null,
                timeTo: document.getElementById('timeTo').value || null,
                note: document.getElementById('shiftNote').value || null,
                userId: this.userId,
                sellerId: this.userId,
                username: localStorage.getItem('username') || this.userId,
                displayName: localStorage.getItem('displayName') || localStorage.getItem('username') || this.userId,
                prodejna: store, // Uložit vybranou prodejnu
                store: store, // Pro kompatibilitu
                created: this.editingShift ? this.editingShift.created : new Date().toISOString(),
                modified: new Date().toISOString()
            };
            
            console.log('💾 Ukládám směnu:', shiftData);
            
            // Uložit na server (který zároveň aktualizuje this.allShifts)
            await this.saveShift(shiftData);
            
            // Aplikuj filtr aby se aktualizoval this.shifts
            this.applyStoreFilter();
            
            // Zavři modal a aktualizuj zobrazení
            this.closeShiftModal();
            this.renderCalendar();
            this.updateStats();
            this.updateTodayTomorrowInfo();
            
            this.showSuccess('Směna byla úspěšně uložena');
            
        } catch (error) {
            console.error('❌ Chyba při ukládání směny:', error);
            this.showError('Chyba při ukládání směny: ' + error.message);
        }
    }

    // Smazání aktuální směny
    async deleteCurrentShift() {
        if (!this.editingShift) {
            this.showError('Žádná směna není vybrána');
            return;
        }
        
        if (!confirm('Opravdu chcete smazat tuto směnu?')) {
            return;
        }
        
        try {
            console.log('🗑️ Mažu směnu:', this.editingShift.id);
            
            // Smaž směnu
            await this.deleteShift(this.editingShift.id);
            
            // Po smazání aktualizuj filtrované směny
            this.applyStoreFilter();
            
            // Zavři modal
            this.closeShiftModal();
            
            // Aktualizuj zobrazení
            this.renderCalendar();
            this.updateStats();
            this.updateTodayTomorrowInfo();
            
            this.showSuccess('Směna byla úspěšně smazána');
            
        } catch (error) {
            console.error('❌ Chyba při mazání směny:', error);
            this.showError('Chyba při mazání směny: ' + error.message);
        }
    }

    // Automatické vyplnění časů podle typu směny
    autoFillTimes(type) {
        const timeFrom = document.getElementById('timeFrom');
        const timeTo = document.getElementById('timeTo');
        
        switch (type) {
            case 'morning':
                timeFrom.value = '06:00';
                timeTo.value = '14:00';
                break;
            case 'afternoon':
                timeFrom.value = '14:00';
                timeTo.value = '22:00';
                break;
            case 'evening':
                timeFrom.value = '18:00';
                timeTo.value = '22:00';
                break;
            case 'full':
                timeFrom.value = '08:00';
                timeTo.value = '20:00';
                break;
            case 'vacation':
                timeFrom.value = '08:00';
                timeTo.value = '16:00';
                break;
            case 'off':
                timeFrom.value = '';
                timeTo.value = '';
                break;
        }
    }

    // Aktualizace statistik
    updateStats() {
        const now = new Date();
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        // Filtruj směny pro aktuální měsíc
        const monthShifts = this.shifts.filter(shift => {
            const shiftDate = new Date(shift.date);
            return shiftDate.getMonth() === currentMonth && 
                   shiftDate.getFullYear() === currentYear &&
                   shift.type !== 'off';
        });
        
        // Filtruj jen pracovní směny (bez dovolené)
        const workShifts = monthShifts.filter(shift => shift.type !== 'vacation');
        
        // Filtruj dovolené
        const vacationShifts = this.shifts.filter(shift => {
            const shiftDate = new Date(shift.date);
            return shiftDate.getMonth() === currentMonth && 
                   shiftDate.getFullYear() === currentYear &&
                   shift.type === 'vacation';
        });
        
        // Počet směn (jen pracovních)
        document.getElementById('monthlyShifts').textContent = workShifts.length;
        
        // Celkové pracovní hodiny
        let totalHours = 0;
        workShifts.forEach(shift => {
            if (shift.timeFrom && shift.timeTo) {
                const hours = this.calculateShiftHours(shift.timeFrom, shift.timeTo);
                totalHours += hours;
            } else {
                // Default hodnoty podle typu směny
                switch (shift.type) {
                    case 'morning': totalHours += 8; break;
                    case 'afternoon': totalHours += 8; break;
                    case 'evening': totalHours += 4; break;
                    case 'full': totalHours += 12; break;
                }
            }
        });
        
        document.getElementById('monthlyHours').textContent = totalHours;
        
        // Hodiny dovolené
        let vacationHours = 0;
        vacationShifts.forEach(shift => {
            if (shift.timeFrom && shift.timeTo) {
                const hours = this.calculateShiftHours(shift.timeFrom, shift.timeTo);
                vacationHours += hours;
            } else {
                // Default 8 hodin pro dovolenou
                vacationHours += 8;
            }
        });
        
        document.getElementById('vacationHours').textContent = vacationHours;
        
        // Průměr hodin za den (jen pracovní směny)
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const avgHours = workShifts.length > 0 ? (totalHours / daysInMonth).toFixed(1) : 0;
        document.getElementById('avgHours').textContent = avgHours;
        
        // Příští směna
        const nextShift = this.getNextShift();
        document.getElementById('nextShift').textContent = nextShift || 'Žádná';
    }

    // Výpočet hodin směny
    calculateShiftHours(timeFrom, timeTo) {
        const [fromHours, fromMinutes] = timeFrom.split(':').map(Number);
        const [toHours, toMinutes] = timeTo.split(':').map(Number);
        
        const fromTime = fromHours * 60 + fromMinutes;
        let toTime = toHours * 60 + toMinutes;
        
        // Pokud je čas "do" menší než "od", předpokládáme přes půlnoc
        if (toTime < fromTime) {
            toTime += 24 * 60;
        }
        
        return (toTime - fromTime) / 60;
    }

    // Získání příští směny (jen pracovní směny, ignoruje dovolenou)
    getNextShift() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Bez času
        
        console.log('🔍 Hledám příští pracovní směnu...');
        console.log('📅 Dnes je:', today.toDateString());
        
        const futureWorkShifts = this.shifts
            .filter(shift => {
                const shiftDate = new Date(shift.date + 'T00:00:00'); // Přidej čas pro správný parsing
                const isValidType = shift.type !== 'off' && shift.type !== 'vacation';
                const isFuture = shiftDate >= today;
                
                console.log(`📊 Směna ${shift.date}: typ=${shift.type}, isFuture=${isFuture}, isValidType=${isValidType}`);
                
                return isFuture && isValidType;
            })
            .sort((a, b) => {
                const dateA = new Date(a.date + 'T00:00:00');
                const dateB = new Date(b.date + 'T00:00:00');
                return dateA - dateB;
            });
        
        console.log('🔍 Nalezené budoucí pracovní směny:', futureWorkShifts.length);
        
        if (futureWorkShifts.length === 0) {
            console.log('❌ Žádné budoucí pracovní směny nenalezeny');
            return null;
        }
        
        const nextShift = futureWorkShifts[0];
        const date = new Date(nextShift.date + 'T00:00:00');
        const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
        
        const result = `${dayNames[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.`;
        console.log('✅ Příští pracovní směna:', result);
        
        return result;
    }

    // Export směn
    exportShifts() {
        try {
            const month = this.currentDate.getMonth();
            const year = this.currentDate.getFullYear();
            const monthNames = [
                'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
                'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
            ];
            
            // Filtruj směny pro aktuální měsíc
            const monthShifts = this.shifts.filter(shift => {
                const shiftDate = new Date(shift.date);
                return shiftDate.getMonth() === month && shiftDate.getFullYear() === year;
            }).sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Vytvoř CSV
            let csv = 'Datum,Den,Typ směny,Od,Do,Hodiny,Poznámka\n';
            
            monthShifts.forEach(shift => {
                const date = new Date(shift.date);
                const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
                const typeNames = {
                    'morning': 'Ranní',
                    'afternoon': 'Odpolední', 
                    'evening': 'Večerní',
                    'full': 'Celý den',
                    'vacation': 'Dovolená',
                    'off': 'Volno'
                };
                
                const hours = shift.timeFrom && shift.timeTo ? 
                    this.calculateShiftHours(shift.timeFrom, shift.timeTo) : '';
                
                csv += `${shift.date},${dayNames[date.getDay()]},${typeNames[shift.type] || shift.type},`;
                csv += `${shift.timeFrom || ''},${shift.timeTo || ''},${hours},${shift.note || ''}\n`;
            });
            
            // Stáhni soubor
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `smeny-${monthNames[month]}-${year}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showSuccess('Export dokončen');
            
        } catch (error) {
            console.error('❌ Chyba při exportu:', error);
            this.showError('Chyba při exportu: ' + error.message);
        }
    }

    // Export do Apple kalendáře
    exportToAppleCalendar() {
        try {
            const month = this.currentDate.getMonth();
            const year = this.currentDate.getFullYear();
            const monthNames = [
                'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
                'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
            ];
            
            // Filtruj směny pro aktuální měsíc
            const monthShifts = this.shifts.filter(shift => {
                const shiftDate = new Date(shift.date + 'T00:00:00');
                return shiftDate.getMonth() === month && 
                       shiftDate.getFullYear() === year &&
                       shift.type !== 'off';
            }).sort((a, b) => new Date(a.date) - new Date(b.date));
            
            if (monthShifts.length === 0) {
                this.showError('Žádné směny k exportu v tomto měsíci');
                return;
            }
            
            console.log(`🍎 Otevírám Apple kalendář pro ${monthShifts.length} směn...`);
            
            // Vytvoř ICS soubor
            const icsContent = this.generateICS(monthShifts, 'Apple');
            
            // Zkus použít webcal:// protokol pro přímé otevření v kalendáři
            this.openAppleCalendarWithWebcal(icsContent, monthNames[month], year, monthShifts.length);
            
        } catch (error) {
            console.error('❌ Chyba při otevírání Apple kalendáře:', error);
            this.showError('Chyba při otevírání Apple kalendáře: ' + error.message);
        }
    }
    
    // Otevření Apple kalendáře s webcal protokolem
    openAppleCalendarWithWebcal(icsContent, monthName, year, shiftsCount) {
        // Vytvoř blob a URL pro ICS soubor
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // Vytvoř data URL pro webcal protokol
        const dataUrl = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent);
        
        // Zobraz dialog s možnostmi
        const options = [
            '1️⃣ Otevřít iCloud kalendář v prohlížeči',
            '2️⃣ Stáhnout ICS soubor pro import',
            '3️⃣ Zkusit otevřít přímo v kalendáři (macOS/iOS)'
        ].join('\\n');
        
        const choice = prompt(
            `🍎 Apple Kalendář - ${shiftsCount} směn\\n\\n` +
            `Jak chcete importovat směny?\\n\\n${options}\\n\\n` +
            'Zadejte číslo volby (1-3):'
        );
        
        switch (choice) {
            case '1':
                // Otevři iCloud kalendář
                window.open('https://calendar.icloud.com/', '_blank');
                this.showSuccess('iCloud kalendář otevřen. Importuj ICS soubor přes tlačítko Nastavení (⚙️) → Import');
                break;
                
            case '2':
                // Stáhni ICS soubor
                const link = document.createElement('a');
                link.href = url;
                link.download = `smeny-${monthName}-${year}-apple.ics`;
                link.click();
                this.showSuccess('ICS soubor stažen. Otevři ho v Apple kalendáři nebo importuj ručně');
                break;
                
            case '3':
                // Zkus webcal protokol
                try {
                    const webcalUrl = dataUrl.replace('data:', 'webcal://data:');
                    window.location.href = webcalUrl;
                    this.showSuccess('Pokusím se otevřít kalendář přímo...');
                } catch (e) {
                    // Fallback na data URL
                    window.open(dataUrl, '_blank');
                    this.showSuccess('Otevírám kalendářový soubor...');
                }
                break;
                
            default:
                // Výchozí - otevři iCloud a stáhni soubor
                window.open('https://calendar.icloud.com/', '_blank');
                const defaultLink = document.createElement('a');
                defaultLink.href = url;
                defaultLink.download = `smeny-${monthName}-${year}-apple.ics`;
                defaultLink.click();
                this.showSuccess('iCloud kalendář otevřen a ICS soubor stažen');
                break;
        }
        
        // Vyčisti URL po chvíli
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 10000);
    }
    
    // Export do Google kalendáře
    exportToGoogleCalendar() {
        try {
            const month = this.currentDate.getMonth();
            const year = this.currentDate.getFullYear();
            const monthNames = [
                'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
                'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
            ];
            
            // Filtruj směny pro aktuální měsíc
            const monthShifts = this.shifts.filter(shift => {
                const shiftDate = new Date(shift.date + 'T00:00:00');
                return shiftDate.getMonth() === month && 
                       shiftDate.getFullYear() === year &&
                       shift.type !== 'off';
            }).sort((a, b) => new Date(a.date) - new Date(b.date));
            
            if (monthShifts.length === 0) {
                this.showError('Žádné směny k exportu v tomto měsíci');
                return;
            }
            
            console.log(`📱 Otevírám Google kalendář pro ${monthShifts.length} směn...`);
            
            // Pro Google kalendář použijeme různé metody podle počtu směn
            if (monthShifts.length <= 3) {
                // Pro malý počet směn - otevři každou jednotlivě
                this.openGoogleCalendarEvents(monthShifts);
            } else {
                // Pro větší počet směn - nabídni možnosti
                this.showGoogleCalendarOptions(monthShifts, monthNames[month], year);
            }
            
        } catch (error) {
            console.error('❌ Chyba při otevírání Google kalendáře:', error);
            this.showError('Chyba při otevírání Google kalendáře: ' + error.message);
        }
    }
    
    // Otevření jednotlivých událostí v Google kalendáři
    openGoogleCalendarEvents(shifts) {
        shifts.forEach((shift, index) => {
            setTimeout(() => {
                const googleUrl = this.createGoogleCalendarEventUrl(shift);
                window.open(googleUrl, `_blank_${index}`);
            }, index * 500); // Zpoždění mezi otevíráním tabů
        });
        
        this.showSuccess(`Otevírám ${shifts.length} směn v Google kalendáři`);
    }
    
    // Zobrazení možností pro Google kalendář
    showGoogleCalendarOptions(shifts, monthName, year) {
        const options = [
            '1️⃣ 🚀 Hromadný import (doporučeno)',
            '2️⃣ 📝 Quick Add - kopírovat do schránky',
            '3️⃣ 📁 Stáhnout ICS soubor',
            '4️⃣ ➕ Otevřít Google kalendář ručně'
        ].join('\\n');
        
        const choice = prompt(
            `📱 Google Kalendář - ${shifts.length} směn\\n\\n` +
            `Jak chcete přidat směny?\\n\\n${options}\\n\\n` +
            'Zadejte číslo volby (1-4):'
        );
        
        switch (choice) {
            case '1':
                // Hromadný import - otevři speciální modal
                this.openGoogleBatchImport(shifts, monthName, year);
                break;
                
            case '2':
                // Quick Add - zkopíruj do schránky
                this.copyGoogleQuickAddToClipboard(shifts);
                break;
                
            case '3':
                // Stáhni ICS soubor
                this.openGoogleCalendarImport(shifts, monthName, year);
                break;
                
            case '4':
                // Jen otevři Google kalendář
                window.open('https://calendar.google.com/calendar/u/0/r', '_blank');
                this.showSuccess('Google kalendář otevřen. Přidejte směny ručně');
                break;
                
            default:
                // Výchozí - hromadný import
                this.openGoogleBatchImport(shifts, monthName, year);
                break;
        }
    }
    
    // Vytvoření URL pro Google kalendář událost
    createGoogleCalendarEventUrl(shift) {
        const shiftDate = new Date(shift.date + 'T00:00:00');
        
        // Název události
        let eventTitle = '';
        const storeName = shift.prodejna || shift.store || 'Neznámá prodejna';
        
        switch (shift.type) {
            case 'morning':
                eventTitle = `🌅 Ranní směna - ${storeName}`;
                break;
            case 'afternoon':
                eventTitle = `☀️ Odpolední směna - ${storeName}`;
                break;
            case 'evening':
                eventTitle = `🌙 Večerní směna - ${storeName}`;
                break;
            case 'full':
                eventTitle = `💼 Celý den - ${storeName}`;
                break;
            case 'vacation':
                eventTitle = `🏖️ Dovolená`;
                break;
            default:
                eventTitle = `📝 Směna - ${storeName}`;
                break;
        }
        
        // Časy události
        let startDateTime, endDateTime;
        if (shift.timeFrom && shift.timeTo) {
            const startDate = new Date(shift.date + `T${shift.timeFrom}:00`);
            const endDate = new Date(shift.date + `T${shift.timeTo}:00`);
            
            startDateTime = this.formatGoogleDateTime(startDate);
            endDateTime = this.formatGoogleDateTime(endDate);
        } else {
            // Celý den
            startDateTime = this.formatGoogleDate(shiftDate);
            endDateTime = this.formatGoogleDate(new Date(shiftDate.getTime() + 24 * 60 * 60 * 1000));
        }
        
        // Popis události
        let description = `Pracovní směna v prodejně ${storeName}`;
        if (shift.note) {
            description += `\\nPoznámka: ${shift.note}`;
        }
        description += `\\nTyp směny: ${this.getShiftTypeName(shift.type)}`;
        description += `\\nExportováno z Mobil Maják systému`;
        
        // Lokace
        const location = shift.type === 'vacation' ? 'Dovolená' : `Prodejna ${storeName}`;
        
        // Vytvoř Google Calendar URL
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: eventTitle,
            dates: `${startDateTime}/${endDateTime}`,
            details: description,
            location: location
        });
        
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }
    
    // Otevření Google kalendáře s ICS importem
    openGoogleCalendarImport(shifts, monthName, year) {
        const icsContent = this.generateICS(shifts, 'Google');
        
        // Vytvoř data URL s ICS obsahem
        const dataUrl = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent);
        
        // Otevři Google Calendar import
        const importUrl = `https://calendar.google.com/calendar/u/0/r/settings/export`;
        
        // Nejdříve stáhni ICS (dočasně)
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `smeny-${monthName}-${year}-google.ics`;
        link.click();
        URL.revokeObjectURL(url);
        
        // Pak otevři Google Calendar import stránku
        setTimeout(() => {
            window.open('https://calendar.google.com/calendar/u/0/r/settings/export', '_blank');
        }, 1000);
        
        this.showSuccess(
            `📁 ICS soubor stažen! Google kalendář se otevře pro import.\\n\\n` +
            `📝 Jak importovat:\\n` +
            `1. V Google kalendáři klikni na ⚙️ Nastavení\\n` +
            `2. Vyber "Import a export"\\n` +
            `3. Klikni "Vybrat soubor" a najdi stažený ICS soubor`
        );
    }
    
    // Formátování data a času pro Google Calendar
    formatGoogleDateTime(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }
    
    // Formátování pouze data pro Google Calendar
    formatGoogleDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    
    // Generování ICS (iCalendar) souboru
    generateICS(shifts, platform = 'Generic') {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            `PRODID:-//Mobil Maják//Směny Export ${platform}//CS`,
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];
        
        shifts.forEach((shift, index) => {
            const shiftDate = new Date(shift.date + 'T00:00:00');
            const dateStr = shiftDate.toISOString().split('T')[0].replace(/-/g, '');
            
            // Určení času události
            let startTime, endTime;
            if (shift.timeFrom && shift.timeTo) {
                startTime = dateStr + 'T' + shift.timeFrom.replace(':', '') + '00';
                endTime = dateStr + 'T' + shift.timeTo.replace(':', '') + '00';
            } else {
                // Celý den
                startTime = dateStr;
                endTime = dateStr;
            }
            
            // Název události
            let eventTitle = '';
            const storeName = shift.prodejna || shift.store || 'Neznámá prodejna';
            
            switch (shift.type) {
                case 'morning':
                    eventTitle = `🌅 Ranní směna - ${storeName}`;
                    break;
                case 'afternoon':
                    eventTitle = `☀️ Odpolední směna - ${storeName}`;
                    break;
                case 'evening':
                    eventTitle = `🌙 Večerní směna - ${storeName}`;
                    break;
                case 'full':
                    eventTitle = `💼 Celý den - ${storeName}`;
                    break;
                case 'vacation':
                    eventTitle = `🏖️ Dovolená`;
                    break;
                default:
                    eventTitle = `📝 Směna - ${storeName}`;
                    break;
            }
            
            if (shift.timeFrom && shift.timeTo) {
                eventTitle += ` (${shift.timeFrom}-${shift.timeTo})`;
            }
            
            // Popis události
            let description = `Pracovní směna v prodejně ${storeName}`;
            if (shift.note) {
                description += `\\nPoznámka: ${shift.note}`;
            }
            description += `\\nTyp směny: ${this.getShiftTypeName(shift.type)}`;
            description += `\\nExportováno z Mobil Maják systému`;
            
            // Lokace
            const location = shift.type === 'vacation' ? 'Dovolená' : `Prodejna ${storeName}`;
            
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:${timestamp}-${index}@mobilmajak.cz`,
                `DTSTAMP:${timestamp}`,
                `DTSTART${shift.timeFrom && shift.timeTo ? '' : ';VALUE=DATE'}:${startTime}`,
                `DTEND${shift.timeFrom && shift.timeTo ? '' : ';VALUE=DATE'}:${endTime}`,
                `SUMMARY:${eventTitle}`,
                `DESCRIPTION:${description}`,
                `LOCATION:${location}`,
                'STATUS:CONFIRMED',
                'TRANSP:OPAQUE',
                `CATEGORIES:Práce,Směny,${shift.type === 'vacation' ? 'Dovolená' : 'Mobil Maják'}`,
                'END:VEVENT'
            );
        });
        
        icsContent.push('END:VCALENDAR');
        
        return icsContent.join('\r\n');
    }
    
    // Pomocná funkce pro názvy typů směn
    getShiftTypeName(type) {
        const typeNames = {
            'morning': 'Ranní směna',
            'afternoon': 'Odpolední směna',
            'evening': 'Večerní směna',
            'full': 'Celý den',
            'vacation': 'Dovolená',
            'off': 'Volno'
        };
        return typeNames[type] || 'Neznámá směna';
    }

    // ===== HROMADNÉ MAZÁNÍ SMĚN =====
    
    // Otevření modalu pro hromadné mazání směn
    openDeleteShiftsModal() {
        // Vyčisti předchozí výběr
        this.selectedShiftsToDelete.clear();
        
        // Nastav kalendář na aktuální měsíc
        this.deleteMiniCalendarDate = new Date();
        this.renderDeleteMiniCalendar();
        this.updateSelectedShiftsToDeleteDisplay();
        
        // Zobraz modal
        document.getElementById('deleteMultipleShiftsModal').classList.add('show');
    }
    
    // Zavření modalu pro hromadné mazání směn
    closeDeleteShiftsModal() {
        document.getElementById('deleteMultipleShiftsModal').classList.remove('show');
        this.selectedShiftsToDelete.clear();
    }
    
    // Vykreslení minikalendáře pro mazání
    renderDeleteMiniCalendar() {
        const year = this.deleteMiniCalendarDate.getFullYear();
        const month = this.deleteMiniCalendarDate.getMonth();
        
        // Aktualizuj nadpis měsíce
        const monthNames = [
            'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
            'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
        ];
        document.getElementById('deleteMiniCurrentMonth').textContent = `${monthNames[month]} ${year}`;
        
        // Vyčisti kalendář
        const grid = document.getElementById('deleteMiniCalendarGrid');
        grid.innerHTML = '';
        
        // Přidej hlavičky dnů
        const dayHeaders = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'mini-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });
        
        // Prvý den měsíce a počet dní
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Začni od pondělí (1) místo neděle (0)
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;
        
        // Předchozí měsíc
        const prevMonth = new Date(year, month - 1, 0);
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonth.getDate() - i;
            this.createDeleteMiniDayElement(day, month - 1, year, true);
        }
        
        // Aktuální měsíc
        for (let day = 1; day <= daysInMonth; day++) {
            this.createDeleteMiniDayElement(day, month, year, false);
        }
        
        // Následující měsíc
        const totalCells = 42 - 7; // 42 - 7 headers
        const usedCells = startDay + daysInMonth;
        const remainingCells = totalCells - usedCells;
        
        for (let day = 1; day <= remainingCells; day++) {
            this.createDeleteMiniDayElement(day, month + 1, year, true);
        }
    }
    
    // Vytvoření elementu dne v delete minikalendáři
    createDeleteMiniDayElement(day, month, year, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'mini-day';
        dayElement.textContent = day;
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        const cellDate = new Date(year, month, day);
        const dateString = this.formatDateString(cellDate);
        
        // Zkontroluj jestli je to dnešek
        const today = new Date();
        if (cellDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Zkontroluj jestli má tento den nějaké směny
        const dayShifts = this.shifts.filter(shift => shift.date === dateString);
        if (dayShifts.length > 0 && !isOtherMonth) {
            dayElement.classList.add('has-shifts');
            
            // Zkontroluj jestli jsou směny vybrané ke smazání
            const isSelected = dayShifts.some(shift => this.selectedShiftsToDelete.has(shift.id));
            if (isSelected) {
                dayElement.classList.add('selected');
            }
            
            // Přidej kliknutí pro výběr směn ke smazání
            dayElement.addEventListener('click', () => {
                this.toggleShiftsForDeletion(dayShifts);
            });
        }
        
        document.getElementById('deleteMiniCalendarGrid').appendChild(dayElement);
    }
    
    // Přepínání výběru směn ke smazání
    toggleShiftsForDeletion(dayShifts) {
        // Zkontroluj jestli jsou všechny směny z tohoto dne již vybrané
        const allSelected = dayShifts.every(shift => this.selectedShiftsToDelete.has(shift.id));
        
        if (allSelected) {
            // Odeber všechny směny z tohoto dne
            dayShifts.forEach(shift => {
                this.selectedShiftsToDelete.delete(shift.id);
            });
        } else {
            // Přidej všechny směny z tohoto dne
            dayShifts.forEach(shift => {
                this.selectedShiftsToDelete.add(shift.id);
            });
        }
        
        // Aktualizuj zobrazení
        this.renderDeleteMiniCalendar();
        this.updateSelectedShiftsToDeleteDisplay();
    }
    
    // Aktualizace zobrazení vybraných směn ke smazání
    updateSelectedShiftsToDeleteDisplay() {
        const infoDiv = document.getElementById('shiftsToDeleteInfo');
        const listDiv = document.getElementById('shiftsToDeleteList');
        const deleteBtn = document.getElementById('confirmDeleteBtn');
        
        if (this.selectedShiftsToDelete.size === 0) {
            infoDiv.style.display = 'none';
            deleteBtn.style.display = 'none';
            return;
        }
        
        // Najdi vybrané směny
        const selectedShifts = this.shifts.filter(shift => 
            this.selectedShiftsToDelete.has(shift.id)
        ).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Vytvoř seznam směn
        const shiftsInfo = selectedShifts.map(shift => {
            const date = new Date(shift.date + 'T00:00:00');
            const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
            const dateStr = `${dayNames[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
            
            let shiftInfo = dateStr;
            if (shift.timeFrom && shift.timeTo) {
                shiftInfo += ` (${shift.timeFrom}-${shift.timeTo})`;
            }
            shiftInfo += ` - ${shift.prodejna || shift.store || 'Neznámá prodejna'}`;
            
            return shiftInfo;
        });
        
        listDiv.innerHTML = `${shiftsInfo.join('<br>')} <br><strong>Celkem: ${selectedShifts.length} směn</strong>`;
        infoDiv.style.display = 'block';
        deleteBtn.style.display = 'block';
    }
    
    // Smazání vybraných směn
    async deleteSelectedShifts() {
        if (this.selectedShiftsToDelete.size === 0) {
            this.showError('Žádné směny nevybrány ke smazání');
            return;
        }
        
        const shiftsCount = this.selectedShiftsToDelete.size;
        console.log(`🗑️ Připravuji hromadné mazání ${shiftsCount} směn`);
        
        if (!confirm(`Opravdu chcete smazat ${shiftsCount} vybraných směn?\n\nTato akce je nevratná!`)) {
            return;
        }
        
        try {
            console.log(`🗑️ Začínám hromadné mazání ${shiftsCount} směn...`);
            
            let deletedCount = 0;
            let errorCount = 0;
            
            // Smaž všechny vybrané směny
            for (const shiftId of this.selectedShiftsToDelete) {
                try {
                    await this.deleteShift(shiftId);
                    deletedCount++;
                    console.log(`✅ Smazána směna ${deletedCount}/${shiftsCount}`);
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Chyba při mazání směny ${shiftId}:`, error);
                }
            }
            
            // Aktualizuj lokální data
            this.applyStoreFilter();
            
            // Zavři modal a aktualizuj zobrazení
            this.closeDeleteShiftsModal();
            this.renderCalendar();
            this.updateStats();
            this.updateTodayTomorrowInfo();
            
            if (errorCount === 0) {
                this.showSuccess(`Úspěšně smazáno všech ${deletedCount} směn`);
            } else {
                this.showError(`Smazáno ${deletedCount} směn, ${errorCount} chyb`);
            }
            
        } catch (error) {
            console.error('❌ Kritická chyba při hromadném mazání směn:', error);
            this.showError('Kritická chyba při mazání směn: ' + error.message);
        }
    }

    // Hromadná synchronizace se serverem
    async syncAllShiftsToServer() {
        try {
            console.log('🔄 Synchronizuji všechny směny se serverem...');
            
            // Načti všechny lokální směny
            const localShifts = this.allShifts;
            
            if (localShifts.length === 0) {
                this.showSuccess('Žádné směny k synchronizaci');
                return;
            }
            
            const response = await fetch('/api/shifts-github', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shifts: localShifts,
                    timestamp: Date.now()
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('✅ Všechny směny synchronizovány se serverem');
                    this.showSuccess(`Synchronizováno ${localShifts.length} směn`);
                } else {
                    console.warn('⚠️ Server odmítl synchronizaci:', data.error);
                    this.showError('Synchronizace selhala: ' + data.error);
                }
            } else {
                const errorText = await response.text();
                console.error(`❌ Server error ${response.status}:`, errorText);
                this.showError(`Server error: ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Chyba při synchronizaci se serverem:', error);
            this.showError('Chyba při synchronizaci: ' + error.message);
        }
    }

    // ===== HROMADNÉ PŘIDÁVÁNÍ SMĚN =====
    
    // Otevření modalu pro hromadné přidání směn
    openMultipleShiftsModal() {
        // Vyčisti předchozí výběr
        this.selectedDates.clear();
        
        // Reset formuláře
        document.getElementById('multipleShiftsForm').reset();
        
        // Nastav výchozí hodnoty
        document.getElementById('multiShiftType').value = 'full';
        document.getElementById('multiTimeFrom').value = '08:00';
        document.getElementById('multiTimeTo').value = '20:00';
        document.getElementById('multiShiftStore').value = this.userProdejna;
        
        // Nastav minikalendář na aktuální měsíc
        this.miniCalendarDate = new Date();
        this.renderMiniCalendar();
        this.updateSelectedDatesDisplay();
        
        // Zobraz modal
        document.getElementById('multipleShiftsModal').classList.add('show');
    }
    
    // Zavření modalu pro hromadné přidání směn
    closeMultipleShiftsModal() {
        document.getElementById('multipleShiftsModal').classList.remove('show');
        this.selectedDates.clear();
    }
    
    // Vykreslení minikalendáře
    renderMiniCalendar() {
        const year = this.miniCalendarDate.getFullYear();
        const month = this.miniCalendarDate.getMonth();
        
        // Aktualizuj nadpis měsíce
        const monthNames = [
            'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
            'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
        ];
        document.getElementById('miniCurrentMonth').textContent = `${monthNames[month]} ${year}`;
        
        // Vyčisti kalendář
        const grid = document.getElementById('miniCalendarGrid');
        grid.innerHTML = '';
        
        // Přidej hlavičky dnů
        const dayHeaders = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'mini-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });
        
        // Prvý den měsíce a počet dní
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Začni od pondělí (1) místo neděle (0)
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;
        
        // Předchozí měsíc
        const prevMonth = new Date(year, month - 1, 0);
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonth.getDate() - i;
            this.createMiniDayElement(day, month - 1, year, true);
        }
        
        // Aktuální měsíc
        for (let day = 1; day <= daysInMonth; day++) {
            this.createMiniDayElement(day, month, year, false);
        }
        
        // Následující měsíc
        const totalCells = 42 - 7; // 42 - 7 headers
        const usedCells = startDay + daysInMonth;
        const remainingCells = totalCells - usedCells;
        
        for (let day = 1; day <= remainingCells; day++) {
            this.createMiniDayElement(day, month + 1, year, true);
        }
    }
    
    // Vytvoření elementu dne v minikalendáři
    createMiniDayElement(day, month, year, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'mini-day';
        dayElement.textContent = day;
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        // Zkontroluj jestli je to dnešek
        const today = new Date();
        const cellDate = new Date(year, month, day);
        if (cellDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Zkontroluj jestli je datum vybrané
        const dateString = this.formatDateString(cellDate);
        if (this.selectedDates.has(dateString)) {
            dayElement.classList.add('selected');
        }
        
        // Přidej kliknutí pouze pro dny aktuálního měsíce
        if (!isOtherMonth) {
            dayElement.addEventListener('click', () => {
                this.toggleDateSelection(cellDate);
            });
        }
        
        document.getElementById('miniCalendarGrid').appendChild(dayElement);
    }
    
    // Přepínání výběru datumu
    toggleDateSelection(date) {
        const dateString = this.formatDateString(date);
        
        if (this.selectedDates.has(dateString)) {
            this.selectedDates.delete(dateString);
        } else {
            this.selectedDates.add(dateString);
        }
        
        // Aktualizuj zobrazení
        this.renderMiniCalendar();
        this.updateSelectedDatesDisplay();
    }
    
    // Aktualizace zobrazení vybraných datumů
    updateSelectedDatesDisplay() {
        const infoDiv = document.getElementById('selectedDatesInfo');
        const listDiv = document.getElementById('selectedDatesList');
        
        if (this.selectedDates.size === 0) {
            infoDiv.style.display = 'none';
            return;
        }
        
        // Seřaď data a zobraz
        const sortedDates = Array.from(this.selectedDates).sort();
        const formattedDates = sortedDates.map(dateStr => {
            const date = new Date(dateStr + 'T00:00:00');
            const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
            return `${dayNames[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
        });
        
        listDiv.textContent = `${formattedDates.join(', ')} (${this.selectedDates.size} dnů)`;
        infoDiv.style.display = 'block';
    }
    
    // Automatické vyplnění časů pro hromadný modal
    autoFillMultipleTimes(type) {
        const timeFrom = document.getElementById('multiTimeFrom');
        const timeTo = document.getElementById('multiTimeTo');
        
        switch (type) {
            case 'morning':
                timeFrom.value = '06:00';
                timeTo.value = '14:00';
                break;
            case 'afternoon':
                timeFrom.value = '14:00';
                timeTo.value = '22:00';
                break;
            case 'evening':
                timeFrom.value = '18:00';
                timeTo.value = '22:00';
                break;
            case 'full':
                timeFrom.value = '08:00';
                timeTo.value = '20:00';
                break;
            case 'vacation':
                timeFrom.value = '08:00';
                timeTo.value = '16:00';
                break;
            case 'off':
                timeFrom.value = '';
                timeTo.value = '';
                break;
        }
    }
    
    // Uložení hromadných směn
    async saveMultipleShifts() {
        try {
            // Validace
            if (this.selectedDates.size === 0) {
                this.showError('Vyberte alespoň jeden den');
                return;
            }
            
            const type = document.getElementById('multiShiftType').value;
            const store = document.getElementById('multiShiftStore').value;
            
            if (!type || !store) {
                this.showError('Vyplňte prosím všechna povinná pole');
                return;
            }
            
            const timeFrom = document.getElementById('multiTimeFrom').value || null;
            const timeTo = document.getElementById('multiTimeTo').value || null;
            const note = document.getElementById('multiShiftNote').value || null;
            
            // Vytvoř objekty směn pro všechny vybrané dny
            const shiftsToSave = [];
            for (const dateString of this.selectedDates) {
                const shiftData = {
                    id: null,
                    date: dateString,
                    type: type,
                    timeFrom: timeFrom,
                    timeTo: timeTo,
                    note: note,
                    userId: this.userId,
                    sellerId: this.userId,
                    username: localStorage.getItem('username') || this.userId,
                    displayName: localStorage.getItem('displayName') || localStorage.getItem('username') || this.userId,
                    prodejna: store,
                    store: store,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };
                shiftsToSave.push(shiftData);
            }
            
            console.log(`💾 Ukládám ${shiftsToSave.length} směn hromadně...`);
            
            // Uložit všechny směny
            for (const shift of shiftsToSave) {
                await this.saveShift(shift);
            }
            
            // Aktualizuj lokální data
            this.applyStoreFilter();
            
            // Zavři modal a aktualizuj zobrazení
            this.closeMultipleShiftsModal();
            this.renderCalendar();
            this.updateStats();
            this.updateTodayTomorrowInfo();
            
            this.showSuccess(`Úspěšně uloženo ${shiftsToSave.length} směn`);
            
        } catch (error) {
            console.error('❌ Chyba při ukládání hromadných směn:', error);
            this.showError('Chyba při ukládání směn: ' + error.message);
        }
    }

    // Aktualizace informací o dnešních a zítřejších směnách
    updateTodayTomorrowInfo() {
        const todayTomorrowInfo = document.getElementById('todayTomorrowInfo');
        
        // Zobraz jen u konkrétních prodejen (ne "Moje směny")
        if (this.currentStoreFilter === 'my') {
            todayTomorrowInfo.style.display = 'none';
            return;
        }
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayString = this.formatDateString(today);
        const tomorrowString = this.formatDateString(tomorrow);
        
        // Najdi směny pro dnes a zítra pro vybranou prodejnu
        const todayShifts = this.allShifts.filter(shift => {
            const shiftStore = shift.prodejna || shift.store;
            return shift.date === todayString && 
                   shiftStore === this.currentStoreFilter && 
                   shift.type !== 'off' && shift.type !== 'vacation';
        });
        
        const tomorrowShifts = this.allShifts.filter(shift => {
            const shiftStore = shift.prodejna || shift.store;
            return shift.date === tomorrowString && 
                   shiftStore === this.currentStoreFilter && 
                   shift.type !== 'off' && shift.type !== 'vacation';
        });
        
        // Aktualizuj zobrazení
        const todayElement = document.getElementById('todayShifts');
        const tomorrowElement = document.getElementById('tomorrowShifts');
        
        if (todayShifts.length > 0) {
            const names = todayShifts.map(shift => 
                shift.displayName || shift.username || shift.userId || 'Neznámý'
            ).join(', ');
            todayElement.textContent = names;
        } else {
            todayElement.textContent = 'Nikdo';
        }
        
        if (tomorrowShifts.length > 0) {
            const names = tomorrowShifts.map(shift => 
                shift.displayName || shift.username || shift.userId || 'Neznámý'
            ).join(', ');
            tomorrowElement.textContent = names;
        } else {
            tomorrowElement.textContent = 'Nikdo';
        }
        
        // Zobraz dlaždice
        todayTomorrowInfo.style.display = 'block';
        
        console.log(`📅 Aktualizace info dlaždic pro ${this.currentStoreFilter}: Dnes="${todayElement.textContent}", Zítra="${tomorrowElement.textContent}"`);
    }

    // Utility funkce
    formatDateString(date) {
        // Používej lokální datum místo UTC aby nedošlo k posunu kvůli časové zóně
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    formatDateInput(date) {
        return this.formatDateString(date);
    }
    
    setLoading(isLoading) {
        this.isLoading = isLoading;
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.style.display = isLoading ? 'block' : 'none';
        }
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showMessage(message, type) {
        // Odstraň existující zprávy
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Vytvoř novou zprávu
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
        messageDiv.textContent = message;
        
        // Vlož do kontejneru
        const container = document.querySelector('.shifts-container');
        container.insertBefore(messageDiv, container.firstChild);
        
        // Automaticky skryj po 5 sekundách
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // Odstranění duplicitních směn
    async removeDuplicateShifts() {
        try {
            console.log('🔍 Hledám duplicitní směny...');
            
            // Mapa pro sledování unikátních směn
            const uniqueShifts = new Map();
            const duplicates = [];
            
            // Projdi všechny směny a najdi duplicity
            this.allShifts.forEach(shift => {
                // Vytvoř unikátní klíč na základě data, času, typu a prodejny
                const key = `${shift.date}-${shift.type}-${shift.timeFrom || 'no-time'}-${shift.timeTo || 'no-time'}-${shift.prodejna || shift.store || 'no-store'}-${shift.userId || shift.sellerId || 'no-user'}`;
                
                if (uniqueShifts.has(key)) {
                    // Duplicitní směna nalezena
                    duplicates.push(shift);
                    console.log('🔍 Nalezena duplicitní směna:', shift.date, shift.type, shift.id);
                } else {
                    // První výskyt této směny
                    uniqueShifts.set(key, shift);
                }
            });
            
            if (duplicates.length === 0) {
                this.showSuccess('Žádné duplicitní směny nebyly nalezeny');
                return;
            }
            
            console.log(`🔍 Nalezeno ${duplicates.length} duplicitních směn`);
            
            // Zobraz seznam duplicitních směn a zeptej se na potvrzení
            let duplicatesList = 'Nalezené duplicitní směny:\n\n';
            duplicates.forEach((shift, index) => {
                const date = new Date(shift.date + 'T00:00:00');
                const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
                const dateStr = `${dayNames[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
                
                let shiftInfo = `${index + 1}. ${dateStr}`;
                if (shift.timeFrom && shift.timeTo) {
                    shiftInfo += ` (${shift.timeFrom}-${shift.timeTo})`;
                }
                shiftInfo += ` - ${shift.type} - ${shift.prodejna || shift.store || 'Neznámá prodejna'}`;
                duplicatesList += shiftInfo + '\n';
            });
            
            duplicatesList += `\nCelkem: ${duplicates.length} duplicitních směn\n\nChcete je všechny smazat?`;
            
            if (!confirm(duplicatesList)) {
                return;
            }
            
            // Smaž všechny duplicitní směny
            let deletedCount = 0;
            let errorCount = 0;
            
            for (const duplicate of duplicates) {
                try {
                    await this.deleteShift(duplicate.id);
                    deletedCount++;
                    console.log(`✅ Smazána duplicitní směna ${deletedCount}/${duplicates.length}`);
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Chyba při mazání duplicitní směny ${duplicate.id}:`, error);
                }
            }
            
            // Aktualizuj zobrazení
            this.applyStoreFilter();
            this.renderCalendar();
            this.updateStats();
            this.updateTodayTomorrowInfo();
            
            if (errorCount === 0) {
                this.showSuccess(`Úspěšně smazáno ${deletedCount} duplicitních směn`);
            } else {
                this.showError(`Smazáno ${deletedCount} duplicitních směn, ${errorCount} chyb`);
            }
            
        } catch (error) {
            console.error('❌ Chyba při odstraňování duplicitních směn:', error);
            this.showError('Chyba při odstraňování duplicitních směn: ' + error.message);
        }
    }

    // Hromadný import do Google kalendáře
    openGoogleBatchImport(shifts, monthName, year) {
        // Vytvoř HTML pro batch import modal
        const modalHtml = this.createBatchImportModal(shifts, monthName, year);
        
        // Přidej modal do stránky
        const existingModal = document.getElementById('googleBatchModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Zobraz modal
        const modal = document.getElementById('googleBatchModal');
        modal.classList.add('show');
        
        // Přidej event listenery
        this.setupBatchImportListeners(shifts);
        
        this.showSuccess('Modal pro hromadný import otevřen! Klikněte na směny které chcete přidat');
    }
    
    // Vytvoření HTML pro batch import modal
    createBatchImportModal(shifts, monthName, year) {
        const shiftsHtml = shifts.map((shift, index) => {
            const date = new Date(shift.date + 'T00:00:00');
            const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
            const dateStr = `${dayNames[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.`;
            
            let timeStr = '';
            if (shift.timeFrom && shift.timeTo) {
                timeStr = `${shift.timeFrom}-${shift.timeTo}`;
            }
            
            const typeNames = {
                'morning': 'Ranní směna',
                'afternoon': 'Odpolední směna',
                'evening': 'Večerní směna',
                'full': 'Celý den',
                'vacation': 'Dovolená'
            };
            
            return `
                <div class="batch-shift-item" data-index="${index}">
                    <div class="shift-info">
                        <div class="shift-date">${dateStr}</div>
                        <div class="shift-details">
                            <span class="shift-type">${typeNames[shift.type] || shift.type}</span>
                            ${timeStr ? `<span class="shift-time">${timeStr}</span>` : ''}
                            <span class="shift-store">${shift.prodejna || shift.store}</span>
                        </div>
                    </div>
                    <button class="btn-add-single" data-index="${index}">
                        ➕ Přidat
                    </button>
                </div>
            `;
        }).join('');
        
        return `
            <div class="shift-modal" id="googleBatchModal">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2 class="modal-title">📱 Hromadný import do Google kalendáře</h2>
                        <button class="modal-close" id="closeBatchModal">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="batch-header">
                            <p><strong>${shifts.length} směn pro ${monthName} ${year}</strong></p>
                            <p>Klikněte na "Přidat" u jednotlivých směn nebo použijte hromadné akce:</p>
                            
                            <div class="batch-actions">
                                <button class="btn-batch-all" id="addAllShifts">
                                    🚀 Přidat všechny (${shifts.length})
                                </button>
                                <button class="btn-batch-selected" id="addSelectedShifts">
                                    ✅ Přidat vybrané (0)
                                </button>
                                <button class="btn-select-all" id="selectAllShifts">
                                    📋 Vybrat vše
                                </button>
                            </div>
                        </div>
                        
                        <div class="batch-shifts-list">
                            ${shiftsHtml}
                        </div>
                        
                        <div class="batch-info">
                            <p><small>💡 <strong>Tip:</strong> Každá směna se otevře v novém tabu s předvyplněnými údaji. Stačí kliknout "Uložit".</small></p>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel" id="cancelBatchImport">Zavřít</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Nastavení event listenerů pro batch import
    setupBatchImportListeners(shifts) {
        // Zavření modalu
        document.getElementById('closeBatchModal').onclick = () => this.closeBatchImportModal();
        document.getElementById('cancelBatchImport').onclick = () => this.closeBatchImportModal();
        
        // Přidání všech směn
        document.getElementById('addAllShifts').onclick = () => {
            this.addShiftsToGoogleCalendar(shifts);
            this.closeBatchImportModal();
        };
        
        // Výběr všech
        document.getElementById('selectAllShifts').onclick = () => this.selectAllBatchShifts();
        
        // Přidání vybraných
        document.getElementById('addSelectedShifts').onclick = () => this.addSelectedBatchShifts(shifts);
        
        // Jednotlivé směny
        document.querySelectorAll('.btn-add-single').forEach(btn => {
            btn.onclick = (e) => {
                const index = parseInt(e.target.dataset.index);
                this.addShiftsToGoogleCalendar([shifts[index]]);
                e.target.textContent = '✅ Přidáno';
                e.target.disabled = true;
            };
        });
        
        // Výběr jednotlivých směn
        document.querySelectorAll('.batch-shift-item').forEach(item => {
            item.onclick = (e) => {
                if (e.target.classList.contains('btn-add-single')) return;
                item.classList.toggle('selected');
                this.updateSelectedBatchCount();
            };
        });
    }
    
    // Kopírování Quick Add textu do schránky
    async copyGoogleQuickAddToClipboard(shifts) {
        try {
            const quickAddTexts = shifts.map(shift => {
                const date = new Date(shift.date + 'T00:00:00');
                const dateStr = `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
                
                const typeNames = {
                    'morning': 'Ranní směna',
                    'afternoon': 'Odpolední směna',
                    'evening': 'Večerní směna',
                    'full': 'Celý den',
                    'vacation': 'Dovolená'
                };
                
                let eventText = `${typeNames[shift.type] || shift.type} ${dateStr}`;
                
                if (shift.timeFrom && shift.timeTo) {
                    eventText += ` ${shift.timeFrom}-${shift.timeTo}`;
                }
                
                if (shift.prodejna || shift.store) {
                    eventText += ` v ${shift.prodejna || shift.store}`;
                }
                
                if (shift.note) {
                    eventText += ` (${shift.note})`;
                }
                
                return eventText;
            });
            
            const fullText = quickAddTexts.join('\\n');
            
            // Zkus zkopírovat do schránky
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(fullText);
                
                // Otevři Google kalendář
                window.open('https://calendar.google.com/calendar/u/0/r', '_blank');
                
                this.showSuccess(
                    `📋 ${shifts.length} směn zkopírováno do schránky!\\n\\n` +
                    `📝 Jak použít Quick Add:\\n` +
                    `1. V Google kalendáři klikni na "+" nebo "Vytvořit"\\n` +
                    `2. Vlož zkopírovaný text (Ctrl+V)\\n` +
                    `3. Google automaticky rozpozná datum a čas`
                );
            } else {
                // Fallback - zobraz text v prompt
                prompt(
                    '📋 Zkopírujte tento text a vložte ho do Google kalendáře:',
                    fullText
                );
                
                window.open('https://calendar.google.com/calendar/u/0/r', '_blank');
                this.showSuccess('Google kalendář otevřen. Použijte zkopírovaný text v Quick Add');
            }
            
        } catch (error) {
            console.error('❌ Chyba při kopírování do schránky:', error);
            this.showError('Chyba při kopírování do schránky: ' + error.message);
        }
    }
    
    // Pomocné funkce pro batch import
    closeBatchImportModal() {
        const modal = document.getElementById('googleBatchModal');
        if (modal) {
            modal.remove();
        }
    }
    
    selectAllBatchShifts() {
        document.querySelectorAll('.batch-shift-item').forEach(item => {
            item.classList.add('selected');
        });
        this.updateSelectedBatchCount();
    }
    
    updateSelectedBatchCount() {
        const selectedCount = document.querySelectorAll('.batch-shift-item.selected').length;
        const btn = document.getElementById('addSelectedShifts');
        if (btn) {
            btn.textContent = `✅ Přidat vybrané (${selectedCount})`;
        }
    }
    
    addSelectedBatchShifts(shifts) {
        const selectedItems = document.querySelectorAll('.batch-shift-item.selected');
        const selectedShifts = Array.from(selectedItems).map(item => {
            const index = parseInt(item.dataset.index);
            return shifts[index];
        });
        
        if (selectedShifts.length === 0) {
            this.showError('Žádné směny nevybrány');
            return;
        }
        
        this.addShiftsToGoogleCalendar(selectedShifts);
        this.closeBatchImportModal();
    }
    
    addShiftsToGoogleCalendar(shifts) {
        console.log(`📱 Přidávám ${shifts.length} směn do Google kalendáře...`);
        
        shifts.forEach((shift, index) => {
            setTimeout(() => {
                const googleUrl = this.createGoogleCalendarEventUrl(shift);
                window.open(googleUrl, `_blank_shift_${index}`);
            }, index * 200); // Kratší zpoždění mezi okny
        });
        
        this.showSuccess(
            `🚀 Otevírám ${shifts.length} směn v Google kalendáři!\\n\\n` +
            `💡 Tip: V každém tabu stačí kliknout "Uložit" pro přidání směny.`
        );
    }
}

// Inicializace po načtení stránky
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📅 DOM načten, spouštím Směny systém...');
    
    try {
        const shiftsManager = new ShiftsManager();
        await shiftsManager.init();
        
        // Globální reference pro debugging
        window.shiftsManager = shiftsManager;
        
    } catch (error) {
        console.error('❌ Kritická chyba při spuštění Směny systému:', error);
        
        // Zobraz chybovou zprávu uživateli
        const container = document.querySelector('.shifts-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>❌ Chyba při načítání systému směn</h3>
                    <p>Detaily: ${error.message}</p>
                    <button onclick="location.reload()" class="btn-primary">Zkusit znovu</button>
                </div>
            `;
        }
    }
});

console.log('✅ Směny JS modul načten'); 