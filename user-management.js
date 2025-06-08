// Správa uživatelů - vylepšená verze
class UserManager {
    constructor() {
        this.users = [];
        this.init();
    }

    async init() {
        // Zkontrolovat, zda je uživatel admin
        const userRole = localStorage.getItem('role');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (isLoggedIn !== 'true' || (userRole !== 'Administrator' && userRole !== 'Administrátor')) {
            alert('Přístup zamítnut. Pouze administrátoři mohou spravovat uživatele.');
            window.location.href = 'index.html';
            return;
        }

        await this.loadUsers();
        this.setupEventListeners();
    }

    async loadUsers() {
        // Načtení uživatelů z localStorage (simulace databáze)
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
            this.users = JSON.parse(storedUsers);
        } else {
            // Vytvoření výchozích uživatelů pokud neexistují
            this.users = [
                {
                    id: 1,
                    firstName: 'Admin',
                    lastName: 'Administrátor',
                    username: 'admin',
                    email: 'admin@mobilmajak.cz',
                    phone: '+420777888999',
                    prodejna: 'Hlavní pobočka',
                    password: 'Admin123',
                    role: 'Administrator'
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
                    role: 'Prodejce'
                }
            ];
            this.saveUsers();
        }
        
        this.displayUsers();
    }

    displayUsers() {
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = '';
        
        this.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
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
        document.getElementById('modalTitle').textContent = '// Přidat uživatele';
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        document.getElementById('password').required = true;
        document.getElementById('userModal').style.display = 'block';
    }

    async showEditModal(userId) {
        const user = this.users.find(u => u.id === userId);
        
        if (!user) return;
        
        document.getElementById('modalTitle').textContent = '// Upravit uživatele';
        document.getElementById('userId').value = user.id;
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
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            prodejna: document.getElementById('prodejna').value.trim(),
            role: document.getElementById('role').value,
            password: document.getElementById('password').value
        };

        // Validace
        if (!userData.firstName || !userData.lastName || !userData.username || !userData.email || !userData.phone || !userData.prodejna || !userData.role) {
            alert('Prosím vyplňte všechna povinná pole.');
            return;
        }

        // Validace emailu
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
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
                const emailExists = this.users.some(u => u.email === userData.email && u.id !== parseInt(userId));
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

                // Zkontrolovat duplicitní username a email
                const usernameExists = this.users.some(u => u.username === userData.username);
                const emailExists = this.users.some(u => u.email === userData.email);
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

            this.saveUsers();
            this.closeModal();
            this.displayUsers();
        } catch (error) {
            alert('Chyba při ukládání: ' + error.message);
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (!confirm(`Opravdu chcete smazat uživatele ${user.firstName} ${user.lastName}?`)) {
            return;
        }

        try {
            this.users = this.users.filter(u => u.id !== userId);
            this.saveUsers();
            alert('Uživatel byl úspěšně smazán');
            this.displayUsers();
        } catch (error) {
            alert('Chyba při mazání: ' + error.message);
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
            this.saveUsers();
            alert('Heslo bylo úspěšně změněno');
        } catch (error) {
            alert('Chyba při změně hesla: ' + error.message);
        }
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
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