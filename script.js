// Plynulé scrollování pro navigační odkazy
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const section = document.querySelector(this.getAttribute('href'));
        section.scrollIntoView({ behavior: 'smooth' });
    });
});

// Zpracování formuláře
const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Získání hodnot z formuláře
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    
    // Zde by normálně byl kód pro odeslání dat na server
    alert('Děkujeme za vaši zprávu! Budeme vás kontaktovat co nejdříve.');
    this.reset();
});

// Animace při scrollování
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.backgroundColor = 'rgba(44, 62, 80, 0.9)';
    } else {
        header.style.backgroundColor = '#2c3e50';
    }
}); 