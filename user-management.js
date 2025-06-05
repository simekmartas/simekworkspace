// Správa uživatelů
class UserManager {
    constructor() {
        this.init();
    }

    async init() {
        // Zkontrolovat, zda je uživatel admin
        if (!window.authSystem.isLoggedIn() || !window.authSystem.isAdmin()) {
            window.location.href = 'dashboard.html';
            return;
        }

        await this.loadUsers();
        this.setupEventListeners();
    }

    async loadUsers() {
        const db = await window.authSystem.loadDatabase();
        const tbody = document.getElementById('userTableBody');
        
        tbody.innerHTML = '';
        
        db.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.username}</td>
                <td>${user.prodejna}</td>
                <td>${user.role === 'admin' ? 'Administrátor' : 'Prodejce'}</td>
                <td>
                    <div class="action-buttons">
                        ${user.role !== 'admin' ? `
                            <button class="btn-edit" onclick="userManager.showEditModal(${user.id})">Upravit</button>
                            <button class="btn-delete" onclick="userManager.deleteUser(${user.id})">Smazat</button>
                        ` : ''}
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
        document.getElementById('modalTitle').textContent = '// Přidat prodejce';
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        document.getElementById('password').required = true;
        document.getElementById('userModal').style.display = 'block';
    }

    async showEditModal(userId) {
        const db = await window.authSystem.loadDatabase();
        const user = db.users.find(u => u.id === userId);
        
        if (!user) return;
        
        document.getElementById('modalTitle').textContent = '// Upravit prodejce';
        document.getElementById('userId').value = user.id;
        document.getElementById('name').value = user.name;
        document.getElementById('username').value = user.username;
        document.getElementById('password').value = '';
        document.getElementById('password').required = false;
        document.getElementById('prodejna').value = user.prodejna;
        
        document.getElementById('userModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('userModal').style.display = 'none';
        document.getElementById('userForm').reset();
    }

    async saveUser() {
        const userId = document.getElementById('userId').value;
        const userData = {
            name: document.getElementById('name').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            prodejna: document.getElementById('prodejna').value
        };

        try {
            if (userId) {
                // Editace existujícího uživatele
                if (!userData.password) {
                    delete userData.password; // Zachovat stávající heslo
                }
                await window.authSystem.updateUser(parseInt(userId), userData);
                alert('Uživatel byl úspěšně aktualizován');
            } else {
                // Přidání nového uživatele
                await window.authSystem.addUser(userData);
                alert('Nový prodejce byl úspěšně přidán');
            }

            this.closeModal();
            await this.loadUsers();
        } catch (error) {
            alert('Chyba při ukládání: ' + error.message);
        }
    }

    async deleteUser(userId) {
        if (!confirm('Opravdu chcete smazat tohoto uživatele?')) {
            return;
        }

        try {
            await window.authSystem.deleteUser(userId);
            alert('Uživatel byl úspěšně smazán');
            await this.loadUsers();
        } catch (error) {
            alert('Chyba při mazání: ' + error.message);
        }
    }

    // Pomocná funkce pro export uživatelů
    exportUsers() {
        const table = document.getElementById('userTable');
        let csv = [];
        
        // Headers
        const headers = [];
        table.querySelectorAll('thead th').forEach(th => {
            headers.push(th.textContent);
        });
        csv.push(headers.join(','));
        
        // Data
        table.querySelectorAll('tbody tr').forEach(tr => {
            const row = [];
            tr.querySelectorAll('td').forEach((td, index) => {
                if (index < headers.length - 1) { // Skip action column
                    row.push(td.textContent);
                }
            });
            csv.push(row.join(','));
        });
        
        // Download
        const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'uzivatele_mobil_majak.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Inicializace
window.userManager = new UserManager(); 