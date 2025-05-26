// Dashboard funkce
class Dashboard {
    constructor() {
        this.currentUser = null;
        this.viewingUser = null;
        this.salesChart = null;
        this.init();
    }

    async init() {
        // Zkontrolovat přihlášení
        if (!window.authSystem.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        this.currentUser = window.authSystem.getCurrentUser();
        await this.loadUserInfo();
        await this.setupAdminControls();
        await this.loadStats();
        this.setupEventListeners();
        this.initChart();
    }

    async loadUserInfo() {
        // Získat uživatele, jehož data prohlížíme
        this.viewingUser = await window.authSystem.getViewingUser();
        
        // Aktualizovat UI
        document.getElementById('userName').textContent = this.viewingUser.name;
        document.getElementById('userRole').textContent = `// ${this.viewingUser.role === 'admin' ? 'Administrátor' : 'Prodejce'} - ${this.viewingUser.prodejna}`;
        
        // Aktualizovat subtitle pokud admin prohlíží jiného uživatele
        if (this.currentUser.role === 'admin' && this.viewingUser.id !== this.currentUser.id) {
            document.getElementById('dashboardSubtitle').textContent = `Statistiky prodejů - Prohlížíte: ${this.viewingUser.name}`;
        }
    }

    async setupAdminControls() {
        if (this.currentUser.role !== 'admin') return;

        // Zobrazit admin kontroly
        document.getElementById('adminControls').style.display = 'flex';

        // Načíst seznam prodejců
        const sellers = await window.authSystem.getAllSellers();
        const selector = document.getElementById('userSelector');
        
        // Vyčistit existující možnosti
        selector.innerHTML = '<option value="">-- Vlastní statistiky --</option>';
        
        // Přidat prodejce
        sellers.forEach(seller => {
            const option = document.createElement('option');
            option.value = seller.id;
            option.textContent = `${seller.name} - ${seller.prodejna}`;
            selector.appendChild(option);
        });

        // Nastavit aktuální hodnotu
        const viewingUserId = localStorage.getItem('viewingUser');
        if (viewingUserId) {
            selector.value = viewingUserId;
        }

        // Event listener pro změnu uživatele
        selector.addEventListener('change', async (e) => {
            const userId = e.target.value ? parseInt(e.target.value) : null;
            window.authSystem.setViewingUser(userId);
            
            // Znovu načíst stránku pro aktualizaci dat
            await this.loadUserInfo();
            await this.loadStats();
        });
    }

    async loadStats() {
        // Načíst statistiky pro aktuálního/prohlíženého uživatele
        const stats = await window.statsManager.getUserStats(this.viewingUser.id);
        
        // Aktualizovat statistické karty
        document.getElementById('todaySales').textContent = stats.todaySales || 0;
        document.getElementById('monthlySales').textContent = stats.monthlySales || 0;
        document.getElementById('monthlyServices').textContent = stats.monthlyServices || 0;

        // Aktualizovat graf
        this.updateChart();
    }

    setupEventListeners() {
        // Event listener pro změnu období
        document.getElementById('periodFilter').addEventListener('change', () => {
            this.updateChart();
        });

        // Event listener pro změnu typu
        document.getElementById('typeFilter').addEventListener('change', () => {
            this.updateChart();
        });

        // Event listener pro výběr data
        document.getElementById('dateFilter').addEventListener('change', async (e) => {
            const date = e.target.value;
            if (date) {
                await this.loadDailyStats(date);
            }
        });

        // Nastavit dnešní datum jako výchozí
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateFilter').value = today;
        this.loadDailyStats(today);
    }

    initChart() {
        const ctx = document.getElementById('salesChart').getContext('2d');
        
        // Nastavit barvu pro Chart.js
        Chart.defaults.color = '#00ff41';
        Chart.defaults.borderColor = 'rgba(0, 255, 65, 0.2)';
        
        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Položky',
                    data: [],
                    borderColor: '#00ff41',
                    backgroundColor: 'rgba(0, 255, 65, 0.1)',
                    tension: 0.1
                }, {
                    label: 'Služby',
                    data: [],
                    borderColor: '#41ff00',
                    backgroundColor: 'rgba(65, 255, 0, 0.1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 255, 65, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 255, 65, 0.1)'
                        }
                    }
                }
            }
        });
    }

    async updateChart() {
        const period = document.getElementById('periodFilter').value;
        const type = document.getElementById('typeFilter').value;
        
        // Získat data pro graf
        const chartData = await window.statsManager.getChartData(this.viewingUser.id, period, type);
        
        // Aktualizovat graf
        this.salesChart.data.labels = chartData.labels;
        
        if (type === 'all') {
            this.salesChart.data.datasets = [{
                label: 'Položky',
                data: chartData.itemsData,
                borderColor: '#00ff41',
                backgroundColor: 'rgba(0, 255, 65, 0.1)',
                tension: 0.1
            }, {
                label: 'Služby',
                data: chartData.servicesData,
                borderColor: '#41ff00',
                backgroundColor: 'rgba(65, 255, 0, 0.1)',
                tension: 0.1
            }];
        } else if (type === 'items') {
            this.salesChart.data.datasets = [{
                label: 'Položky',
                data: chartData.itemsData,
                borderColor: '#00ff41',
                backgroundColor: 'rgba(0, 255, 65, 0.1)',
                tension: 0.1
            }];
        } else {
            this.salesChart.data.datasets = [{
                label: 'Služby',
                data: chartData.servicesData,
                borderColor: '#41ff00',
                backgroundColor: 'rgba(65, 255, 0, 0.1)',
                tension: 0.1
            }];
        }
        
        this.salesChart.update();
    }

    async loadDailyStats(date) {
        const container = document.getElementById('dailyStatsContainer');
        
        // Získat denní statistiky
        const dailyStats = await window.statsManager.getDailyStats(this.viewingUser.id, date);
        
        if (!dailyStats || dailyStats.length === 0) {
            container.innerHTML = '<div class="no-data">Žádná data pro vybraný den</div>';
            return;
        }

        // Vytvořit tabulku s daty
        let html = `
            <table class="daily-stats-table">
                <thead>
                    <tr>
                        <th>Typ</th>
                        <th>Položka</th>
                        <th>Množství</th>
                        <th>Čas</th>
                    </tr>
                </thead>
                <tbody>
        `;

        dailyStats.forEach(stat => {
            html += `
                <tr>
                    <td>${stat.type === 'item' ? 'Položka' : 'Služba'}</td>
                    <td>${stat.name}</td>
                    <td>${stat.quantity}</td>
                    <td>${new Date(stat.timestamp).toLocaleTimeString('cs-CZ')}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }
}

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
}); 