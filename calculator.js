// Ochrana stránky pro přihlášené uživatele
(function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        document.querySelector('main').innerHTML = '<section class="hero"><h1>&gt; Kalkulačka hypotéky_</h1><div class="message" style="font-size:1.3rem;color:#d00;margin-top:2rem;">Tato sekce je pouze pro přihlášené členy.</div></section>';
        return false;
    }
    return true;
})();

// Výpočet hypotéky
function calculateMortgage(loan, years, rate) {
    const n = years * 12;
    const r = rate / 100 / 12;
    if (r === 0) return loan / n;
    return loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

const form = document.getElementById('mortgage-form');
if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const purpose = document.querySelector('input[name="purpose"]:checked').value;
        const loanAmount = parseFloat(document.getElementById('loanAmount').value);
        const years = parseInt(document.getElementById('years').value);
        const interest = parseFloat(document.getElementById('interest').value);
        const fixation = parseInt(document.getElementById('fixation').value);
        const income = parseFloat(document.getElementById('income').value);
        const propertyValue = document.querySelector('input[name="propertyValue"]:checked').value;

        const monthly = calculateMortgage(loanAmount, years, interest);
        const total = monthly * years * 12;
        const totalInterest = total - loanAmount;
        const taxSave = Math.round(totalInterest * 0.15); // 15% z úroků
        const totalCost = total - taxSave;

        document.getElementById('result').innerHTML = `
            <div class="calculator-result-box">
                <div class="result-section-title">Přehled</div>
                <table class="result-table">
                    <tr><th>Data</th><th>Hodnoty</th></tr>
                    <tr><td>Doba:</td><td class="right">${years} let</td></tr>
                    <tr><td>Úroková sazba:</td><td class="right">${interest.toLocaleString('cs-CZ', {minimumFractionDigits:2, maximumFractionDigits:2})} % p.a.</td></tr>
                    <tr><td>Fixace:</td><td class="right">${fixation ? fixation + ' roky' : '-'}</td></tr>
                    <tr><td>Splátka:</td><td class="right">${monthly.toLocaleString('cs-CZ', {maximumFractionDigits:0})},- Kč</td></tr>
                    <tr><td>Minimální příjem:</td><td class="right">${income ? income.toLocaleString('cs-CZ') + ',- Kč' : '0,- Kč'}</td></tr>
                    <tr><td>Minimální odhad nemovitosti:</td><td class="right">${(loanAmount / (propertyValue/100)).toLocaleString('cs-CZ')},- Kč</td></tr>
                </table>
                <div class="result-section-title">Úvěr</div>
                <table class="result-table">
                    <tr><th>Data</th><th>Hodnoty</th></tr>
                    <tr><td>Zaplaceno za ${years} let:</td><td class="right">${total.toLocaleString('cs-CZ')},- Kč</td></tr>
                    <tr><td>Celkové úroky (${interest.toLocaleString('cs-CZ', {minimumFractionDigits:2, maximumFractionDigits:2})} % p.a.):</td><td class="right">${totalInterest.toLocaleString('cs-CZ')},- Kč</td></tr>
                    <tr><td>Daňová úspora:</td><td class="right">${taxSave.toLocaleString('cs-CZ')},- Kč</td></tr>
                    <tr><td><span class="red">Celkový náklad:</span></td><td class="right red">${totalCost.toLocaleString('cs-CZ')},- Kč</td></tr>
                </table>
            </div>
        `;
    });
} 