// Autentizační systém pro Mobil Maják - Nová verze
class AuthSystem {
    constructor() {
        this.dbUrl = 'api/db.json';
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Zkontrolovat, zda je uživatel přihlášen
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    async loadDatabase() {
        console.log('=== NAČÍTÁNÍ DATABÁZE ===');
        
        // Nejdřív zkusíme fallback databázi
        const fallbackDb = {
            users: [
                {
                    id: 1,
                    username: "admin",
                    password: "admin123",
                    role: "admin",
                    name: "Administrátor",
                    prodejna: "Všechny"
                },
                {
                    id: 2,
                    username: "gabriel",
                    password: "globus123",
                    role: "prodejce",
                    name: "Šimon Gabriel",
                    prodejna: "Globus"
                },
                {
                    id: 3,
                    username: "kovacik",
                    password: "cepkov123",
                    role: "prodejce",
                    name: "Lukáš Kováčik",
                    prodejna: "Čepkov"
                }
            ],
            dailyStats: [],
            salesHistory: []
        };

        try {
            console.log('Zkouším načíst databázi z:', this.dbUrl);
            const response = await fetch(this.dbUrl + '?v=' + Date.now(), {
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Databáze úspěšně načtena ze souboru');
                return data;
            }
        } catch (error) {
            console.log('Chyba při načítání ze souboru:', error.message);
        }
        
        console.log('Používám fallback databázi');
        return fallbackDb;
    }

    async login(username, password) {
        console.log('=== POKUS O PŘIHLÁŠENÍ ===');
        console.log('Username:', username);
        
        const db = await this.loadDatabase();
        console.log('Počet uživatelů v databázi:', db.users.length);
        
        const user = db.users.find(u => 
            u.username === username && u.password === password
        );

        if (user) {
            console.log('Uživatel nalezen:', user.name);
            // Uložit uživatele bez hesla
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            
            this.currentUser = userWithoutPassword;
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
            localStorage.setItem('isLoggedIn', 'true');
            
            return { success: true, user: userWithoutPassword };
        }

        console.log('Uživatel nenalezen nebo špatné heslo');
        return { success: false, message: 'Neplatné přihlašovací údaje' };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('viewingUser');
        window.location.href = 'login.html';
    }

    isLoggedIn() {
        return this.currentUser !== null && localStorage.getItem('isLoggedIn') === 'true';
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Metoda pro admina - přepnout pohled na jiného uživatele
    setViewingUser(userId) {
        if (!this.isAdmin()) {
            console.error('Pouze admin může přepínat mezi uživateli');
            return false;
        }

        if (userId === null) {
            localStorage.removeItem('viewingUser');
            return true;
        }

        localStorage.setItem('viewingUser', userId.toString());
        return true;
    }

    // Získat uživatele, jehož data prohlížíme
    async getViewingUser() {
        if (!this.isAdmin()) {
            return this.currentUser;
        }

        const viewingUserId = localStorage.getItem('viewingUser');
        if (!viewingUserId) {
            return this.currentUser;
        }

        const db = await this.loadDatabase();
        const user = db.users.find(u => u.id.toString() === viewingUserId);
        return user || this.currentUser;
    }

    // Získat všechny prodejce (pro admin dropdown)
    async getAllSellers() {
        if (!this.isAdmin()) return [];
        
        const db = await this.loadDatabase();
        return db.users.filter(u => u.role === 'prodejce');
    }

    // Správa uživatelů - pouze pro admina
    async addUser(userData) {
        if (!this.isAdmin()) {
            throw new Error('Nedostatečná oprávnění');
        }

        const db = await this.loadDatabase();
        const newUser = {
            id: Math.max(...db.users.map(u => u.id), 0) + 1,
            ...userData,
            role: 'prodejce'
        };

        db.users.push(newUser);
        console.log('Nový uživatel by byl uložen:', newUser);
        return newUser;
    }

    async updateUser(userId, userData) {
        if (!this.isAdmin()) {
            throw new Error('Nedostatečná oprávnění');
        }

        const db = await this.loadDatabase();
        const userIndex = db.users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            throw new Error('Uživatel nenalezen');
        }

        db.users[userIndex] = { ...db.users[userIndex], ...userData };
        console.log('Uživatel by byl aktualizován:', db.users[userIndex]);
        return db.users[userIndex];
    }

    async deleteUser(userId) {
        if (!this.isAdmin()) {
            throw new Error('Nedostatečná oprávnění');
        }

        const db = await this.loadDatabase();
        const userIndex = db.users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            throw new Error('Uživatel nenalezen');
        }

        const deletedUser = db.users.splice(userIndex, 1)[0];
        console.log('Uživatel by byl smazán:', deletedUser);
        return deletedUser;
    }
}

// Globální instance
window.authSystem = new AuthSystem(); 