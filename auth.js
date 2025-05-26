// Autentizační systém pro Mobil Maják
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
        try {
            console.log('Načítám databázi z:', this.dbUrl);
            const response = await fetch(this.dbUrl, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers.get('content-type'));
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log('Response text length:', text.length);
            console.log('First 100 chars:', text.substring(0, 100));
            
            const data = JSON.parse(text);
            console.log('Databáze úspěšně načtena, počet uživatelů:', data.users?.length || 0);
            return data;
        } catch (error) {
            console.error('Chyba při načítání databáze:', error);
            console.error('Používám fallback databázi');
            
            // Fallback databáze s testovacími uživateli
            return {
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
                    }
                ],
                dailyStats: [],
                salesHistory: []
            };
        }
    }

    async login(username, password) {
        const db = await this.loadDatabase();
        const user = db.users.find(u => 
            u.username === username && u.password === password
        );

        if (user) {
            // Uložit uživatele bez hesla
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            
            this.currentUser = userWithoutPassword;
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
            localStorage.setItem('isLoggedIn', 'true');
            
            return { success: true, user: userWithoutPassword };
        }

        return { success: false, message: 'Neplatné přihlašovací údaje' };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('viewingUser'); // Vymazat i případný prohlížený uživatel
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
        
        // V reálné aplikaci bychom ukládali do databáze na serveru
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
        
        // V reálné aplikaci bychom ukládali do databáze na serveru
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
        
        // V reálné aplikaci bychom ukládali do databáze na serveru
        console.log('Uživatel by byl smazán:', deletedUser);
        return deletedUser;
    }
}

// Globální instance
window.authSystem = new AuthSystem(); 