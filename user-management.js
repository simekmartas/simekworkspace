// Správa uživatelů - vylepšená verze s online synchronizací
class UserManager {
    constructor() {
        this.users = [];
        this.init();
    }

    async init() {
        // Zkontrolovat, zda je uživatel admin
        const userRole = localStorage.getItem('role');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        console.log('User role:', userRole, 'Logged in:', isLoggedIn);
        
        if (isLoggedIn !== 'true') {
            alert('Musíte se nejdříve přihlásit.');
            window.location.href = 'login.html';
            return;
        }
        
        if (userRole !== 'Administrator' && userRole !== 'Administrátor') {
            alert('Přístup zamítnut. Pouze administrátoři mohou spravovat uživatele.');
            window.location.href = 'index.html';
            return;
        }

        await this.loadUsers();
        this.setupEventListeners();
        this.startAutoSync();
        this.checkServerStatus();
        
        // Sleduj změny v localStorage (při změnách uživatelů v jiném tabu)
        window.addEventListener('storage', async (e) => {
            if (e.key === 'users') {
                console.log('Změna uživatelů detekována z jiného tabu, znovu načítám...');
                await this.loadUsers();
                this.displayUsers();
            }
        });
    }

    async loadUsers() {
        console.log('🌐 Načítám uživatele ze serveru jako primární zdroj...');
        
        // Primární - načti ze serveru
        try {
            const response = await fetch('/api/users-github', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.users)) {
                    this.users = data.users;
                    console.log(`✅ Načteno ${this.users.length} uživatelů ze serveru`);
                    
                    // Aktualizuj localStorage jako cache
                    localStorage.setItem('users', JSON.stringify(this.users));
                    
                    // Pokračuj ve zpracování
                    await this.processLoadedUsers();
                    return;
                } else {
                    throw new Error('Neplatná odpověď ze serveru');
                }
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
            
        } catch (error) {
            console.warn('⚠️ Server nedostupný, používám localStorage jako fallback:', error.message);
            
            // Fallback na localStorage
            try {
                const savedUsers = localStorage.getItem('users');
                if (savedUsers) {
                    this.users = JSON.parse(savedUsers);
                    console.log('📦 Načteno ' + this.users.length + ' uživatelů z localStorage cache');
                } else {
                    this.users = [];
                    console.log('📦 Žádná cache data v localStorage');
                }
            } catch (error) {
                console.error('❌ Chyba při načítání z localStorage:', error);
                this.users = [];
            }
        }
        
        await this.processLoadedUsers();
    }

    async processLoadedUsers() {
        // Pokud nejsou žádní uživatelé, vytvoř výchozí
        if (this.users.length === 0) {
            await this.createDefaultUsers();
        } else {
            // Vždy zajisti, že admin účet existuje a má správné údaje
            await this.ensureAdminUser();
        }
        
        this.displayUsers();
    }

    async createDefaultUsers() {
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
                bio: 'Hlavní administrátor systému MobilMajak'
            },
            {
                id: 2,
                firstName: 'Tomáš',
                lastName: 'Novák',
                username: 'prodejce',
                email: 'tomas.novak@mobilmajak.cz',
                phone: '+420777123456',
                prodejna: 'Praha 1',
                password: 'prodejce123',
                role: 'Prodejce',
                bio: 'Prodejce mobilních telefonů a příslušenství'
            }
        ];
        
        this.users = defaultUsers;
        await this.saveUsers();
        console.log('🔧 Vytvořeni výchozí uživatelé');
    }

    async ensureAdminUser() {
        const adminUser = {
            id: 1,
            firstName: 'Admin',
            lastName: 'Administrátor',
            username: 'admin',
            email: 'admin@mobilmajak.cz',
            phone: '+420777888999',
            prodejna: 'Hlavní pobočka',
            password: 'Admin123',
            role: 'Administrator',
            bio: 'Hlavní administrátor systému MobilMajak'
        };
        
        // Najdi admin účet
        const adminIndex = this.users.findIndex(u => u.username === 'admin' || u.id === 1);
        if (adminIndex !== -1) {
            // Aktualizuj existující admin účet
            this.users[adminIndex] = adminUser;
        } else {
            // Přidej admin účet na začátek
            this.users.unshift(adminUser);
        }
        
        // Uložíme změny pouze pokud jsme přidali/upravili admin účet
        await this.saveUsers();
    }

    startAutoSync() {
        // Automatická synchronizace každé 2 minuty (jako u novinek)
        setInterval(async () => {
            try {
                console.log('🔄 Automatická synchronizace uživatelů...');
                await this.loadUsers();
            } catch (error) {
                console.error('❌ Chyba při automatické synchronizaci:', error);
            }
        }, 120000); // 2 minuty
    }

    async reloadUsers() {
        console.log('🔄 Ruční reload uživatelů...');
        await this.loadUsers();
        this.displayUsers();
    }

    displayUsers() {
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = '';
        
        this.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.customId || '-'}</td>
                <td>${user.firstName}</td>
                <td>${user.lastName}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.prodejna}</td>
                <td>${user.role}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="userManager.showEditModal(${user.id})">Upravit</button>
                        ${user.role !== 'Administrator' ? `
                            <button class="btn-delete" onclick="userManager.deleteUser(${user.id})">Smazat</button>
                        ` : ''}
                        <button class="btn-edit" onclick="userManager.changePassword(${user.id})">Změnit heslo</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    setupEventListeners() {
        const form = document.getElementById('userForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveUser();
        });

        // Zavřít modal při kliknutí mimo něj
        window.onclick = (event) => {
            const modal = document.getElementById('userModal');
            if (event.target === modal) {
                this.closeModal();
            }
        };
    }

    showAddModal() {
        document.getElementById('modalTitle').textContent = 'Přidat uživatele';
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        document.getElementById('password').required = true;
        document.getElementById('userModal').style.display = 'block';
    }

    async showEditModal(userId) {
        const user = this.users.find(u => u.id === userId);
        
        if (!user) return;
        
        document.getElementById('modalTitle').textContent = 'Upravit uživatele';
        document.getElementById('userId').value = user.id;
        document.getElementById('customId').value = user.customId || '';
        document.getElementById('firstName').value = user.firstName;
        document.getElementById('lastName').value = user.lastName;
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email;
        document.getElementById('phone').value = user.phone;
        document.getElementById('prodejna').value = user.prodejna;
        document.getElementById('role').value = user.role;
        document.getElementById('password').value = '';
        document.getElementById('password').required = false;
        
        document.getElementById('userModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('userModal').style.display = 'none';
        document.getElementById('userForm').reset();
    }

    async saveUser() {
        const userId = document.getElementById('userId').value;
        const userData = {
            customId: document.getElementById('customId').value.trim(),
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            prodejna: document.getElementById('prodejna').value.trim(),
            role: document.getElementById('role').value,
            password: document.getElementById('password').value
        };

        // Validace povinných polí
        if (!userData.firstName || !userData.lastName || !userData.username) {
            alert('Prosím vyplňte všechna povinná pole (Jméno, Příjmení, Uživatelské jméno).');
            return;
        }

        // Validace emailu - pouze pokud je vyplněný
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (userData.email && !emailRegex.test(userData.email)) {
            alert('Prosím zadejte platný email.');
            return;
        }

        try {
            if (userId) {
                // Editace existujícího uživatele
                const userIndex = this.users.findIndex(u => u.id === parseInt(userId));
                if (userIndex === -1) {
                    throw new Error('Uživatel nenalezen');
                }

                // Zkontrolovat duplicitní username a email (kromě aktuálního uživatele)
                const usernameExists = this.users.some(u => u.username === userData.username && u.id !== parseInt(userId));
                const emailExists = userData.email && this.users.some(u => u.email === userData.email && u.id !== parseInt(userId));
                if (usernameExists) {
                    throw new Error('Uživatel s tímto uživatelským jménem již existuje');
                }
                if (emailExists) {
                    throw new Error('Uživatel s tímto emailem již existuje');
                }

                // Aktualizovat uživatele
                this.users[userIndex] = {
                    ...this.users[userIndex],
                    ...userData,
                    password: userData.password || this.users[userIndex].password // Zachovat staré heslo pokud není nové
                };

                alert('Uživatel byl úspěšně aktualizován');
            } else {
                // Přidání nového uživatele
                if (!userData.password) {
                    throw new Error('Heslo je povinné pro nového uživatele');
                }
                
                // Nastavit výchozí hodnoty pro nepovinná pole
                userData.email = userData.email || '';
                userData.phone = userData.phone || '';
                userData.prodejna = userData.prodejna || 'Nezadáno';
                userData.role = userData.role || 'Prodejce';

                // Zkontrolovat duplicitní username a email
                const usernameExists = this.users.some(u => u.username === userData.username);
                const emailExists = userData.email && this.users.some(u => u.email === userData.email);
                if (usernameExists) {
                    throw new Error('Uživatel s tímto uživatelským jménem již existuje');
                }
                if (emailExists) {
                    throw new Error('Uživatel s tímto emailem již existuje');
                }

                // Vytvořit nové ID
                const newId = Math.max(...this.users.map(u => u.id), 0) + 1;
                
                const newUser = {
                    id: newId,
                    ...userData
                };

                this.users.push(newUser);
                alert('Nový uživatel byl úspěšně přidán');
            }

            await this.saveUsers();
            this.closeModal();
            this.displayUsers();
        } catch (error) {
            alert('Chyba při ukládání: ' + error.message);
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            alert('Uživatel nenalezen');
            return;
        }

        if (user.role === 'Administrator' || user.role === 'Administrátor') {
            alert('Nelze smazat administratorský účet');
            return;
        }

        if (!confirm(`Opravdu chcete smazat uživatele ${user.firstName} ${user.lastName}?\n\nTato akce je nevratná!`)) {
            return;
        }

        try {
            console.log(`🗑️ Mazání uživatele ${user.firstName} ${user.lastName} (ID: ${userId})`);
            
            // Nejprve odstraň z pole
            this.users = this.users.filter(u => u.id !== userId);
            
            // Okamžitě ulož do localStorage
            localStorage.setItem('users', JSON.stringify(this.users));
            console.log('📦 Lokální záloha aktualizována');
            
            // Ihned aktualizuj zobrazení
            this.displayUsers();
            
            // Synchronizace se serverem s lepším error handlingem
            try {
                console.log('🔄 Synchronizuji smazání se serverem...');
                const response = await fetch('/api/users-github', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        users: this.users,
                        timestamp: Date.now(),
                        action: 'delete',
                        deletedUserId: userId
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log('✅ Smazání synchronizováno se serverem');
                        alert(`Uživatel ${user.firstName} ${user.lastName} byl úspěšně smazán a synchronizován`);
                    } else {
                        console.warn('⚠️ Server odmítl synchronizaci:', data.error);
                        alert(`Uživatel ${user.firstName} ${user.lastName} byl smazán lokálně, ale synchronizace se serverem selhala: ${data.error}`);
                    }
                } else {
                    const errorText = await response.text();
                    console.error(`❌ Server error ${response.status}:`, errorText);
                    alert(`Uživatel ${user.firstName} ${user.lastName} byl smazán lokálně. Server error: ${response.status}`);
                }
            } catch (syncError) {
                console.error('❌ Chyba při synchronizaci se serverem:', syncError);
                alert(`Uživatel ${user.firstName} ${user.lastName} byl smazán lokálně, ale nepodařilo se synchronizovat se serverem: ${syncError.message}`);
            }
            
        } catch (error) {
            console.error('❌ Chyba při mazání uživatele:', error);
            alert('Kritická chyba při mazání uživatele: ' + error.message);
            // Obnov data ze serveru
            await this.loadUsers();
            this.displayUsers();
        }
    }

    async changePassword(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const newPassword = prompt(`Zadejte nové heslo pro uživatele ${user.firstName} ${user.lastName}:`);
        if (!newPassword) return;

        if (newPassword.length < 6) {
            alert('Heslo musí mít alespoň 6 znaků');
            return;
        }

        try {
            const userIndex = this.users.findIndex(u => u.id === userId);
            this.users[userIndex].password = newPassword;
            await this.saveUsers();
            alert('Heslo bylo úspěšně změněno');
        } catch (error) {
            alert('Chyba při změně hesla: ' + error.message);
        }
    }

    async saveUsers() {
        try {
            // Okamžitě ulož do localStorage (spolehlivé)
            localStorage.setItem('users', JSON.stringify(this.users));
            console.log('📦 Backup uložen do localStorage');
            
            let serverSyncSuccess = false;
            
            // Zkus synchronizovat se serverem na pozadí (ale nespoléhej na to)
            try {
                const response = await fetch('/api/users-github', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        users: this.users,
                        timestamp: Date.now()
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log('✅ Uživatelé synchronizováni se serverem');
                        serverSyncSuccess = true;
                    } else {
                        console.warn('⚠️ Server odmítl data:', data.error || 'Neznámá chyba');
                    }
                } else if (response.status === 500) {
                    const errorData = await response.json().catch(() => null);
                    console.error('❌ Server error 500:', errorData?.error || 'Vnitřní chyba serveru');
                    console.warn('💡 Zkontrolujte GitHub token v environment variables');
                } else {
                    console.warn(`⚠️ Synchronizace selhala (${response.status}):`, response.statusText);
                }
                
            } catch (error) {
                console.warn('⚠️ Síťová chyba při synchronizaci se serverem:', error.message);
            }
            
            // Vrať true pokud se alespoň localStorage povedlo
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('❌ localStorage QuotaExceededError - nutno vyčistit cache');
                alert('Nedostatek místa v prohlížeči - vymažte cache a zkuste to znovu');
            } else {
                console.error('❌ Chyba při ukládání:', error);
            }
            return false;
        }
    }

    // Pomocná funkce pro export uživatelů
    exportUsers() {
        const table = document.getElementById('userTable');
        let csv = [];
        
        // Headers
        const headers = [];
        table.querySelectorAll('thead th').forEach(th => {
            if (th.textContent !== 'Akce') {
                headers.push(th.textContent);
            }
        });
        csv.push(headers.join(','));
        
        // Data
        this.users.forEach(user => {
            const row = [
                user.id,
                user.customId || '',
                user.firstName,
                user.lastName,
                user.username,
                user.email,
                user.phone,
                user.prodejna,
                user.role
            ];
            csv.push(row.join(','));
        });
        
        // Download
        const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'uzivatele_mobil_majak.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Inicializace
document.addEventListener('DOMContentLoaded', () => {
    window.userManager = new UserManager();
}); 