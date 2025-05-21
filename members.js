console.log('Testuji načtení members.js');
localStorage.setItem('isLoggedIn', 'true');
document.body.style.backgroundColor = '#222'; // výrazná změna pozadí pro test

// Kontrola přihlášení
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        document.querySelector('main').innerHTML = '<section class="hero"><h1>&gt; Členská sekce_</h1><div class="message" style="font-size:1.3rem;color:#d00;margin-top:2rem;">Tato sekce je pouze pro přihlášené členy.</div></section>';
        return false;
    }
    return true;
}

// Kontrola při načtení stránky
if (checkAuth()) {
    // Odhlášení
    document.getElementById('logout').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    });

    // Funkce pro zobrazení tabulky a grafu
    function showMajakData() {
        console.log('Spouštím showMajakData');
        document.getElementById('majak-table').innerHTML = '<div style="color:lime">Testovací výpis – JS běží!</div>';
        try {
            // Statická data podle načteného Excelu
            const stores = ['SENIMO', 'ŠTERNBERK', 'GLOBUS', 'LITOVELSKÁ', 'ČEPKOV', 'PŘEROV', 'FAKTURY'];
            const obrat = [17219, 107179, 47678, 0, 44526, 15739, 39573];
            const zisk = [2966.98, 10264.18, 9580.17, 0, 5613.53, 2115.46, 992.64];
            // Tabulka
            let html = '<table class="result-table"><tr><th>Prodejna</th><th>Obrat (Kč)</th><th>Zisk (Kč)</th></tr>';
            for (let i = 0; i < stores.length; i++) {
                html += `<tr><td>${stores[i]}</td><td class="right">${obrat[i].toLocaleString('cs-CZ')}</td><td class="right">${zisk[i].toLocaleString('cs-CZ')}</td></tr>`;
            }
            html += '</table>';
            document.getElementById('majak-table').innerHTML += html;
            // Graf
            if (!window.Chart) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
                script.onload = showMajakData;
                script.onerror = function() {
                    console.error('Nepodařilo se načíst Chart.js. Graf nebude zobrazen.');
                };
                document.body.appendChild(script);
                return;
            }
            const ctx = document.getElementById('majak-chart').getContext('2d');
            try {
                new window.Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: stores,
                        datasets: [
                            {
                                label: 'Obrat (Kč)',
                                data: obrat,
                                backgroundColor: 'rgba(0,0,0,0.7)'
                            },
                            {
                                label: 'Zisk (Kč)',
                                data: zisk,
                                backgroundColor: 'rgba(100,100,100,0.7)'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { labels: { color: '#111', font: { family: 'JetBrains Mono' } } }
                        },
                        scales: {
                            x: { ticks: { color: '#111', font: { family: 'JetBrains Mono' } } },
                            y: { ticks: { color: '#111', font: { family: 'JetBrains Mono' } } }
                        }
                    }
                });
            } catch (e) {
                console.error('Chyba při vykreslování grafu:', e);
            }
        } catch (err) {
            console.error('Chyba při zobrazování dat Mobil Maják čísla:', err);
            document.getElementById('majak-table').innerHTML += '<div class="message" style="color:#d00;">Nepodařilo se zobrazit data.</div>';
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showMajakData);
    } else {
        showMajakData();
    }
} 