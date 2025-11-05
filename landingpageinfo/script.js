// --- Saludo dinámico ---
const saludo = document.getElementById("saludo");
if (saludo) {
  const hora = new Date().getHours();
  if (hora < 12) saludo.textContent = "¡Buenos días!";
  else if (hora < 18) saludo.textContent = "¡Buenas tardes!";
  else saludo.textContent = "¡Buenas noches!";
}

// --- Modo oscuro persistente y ajuste de navbar ---
const toggle = document.getElementById("darkModeToggle");
const navbar = document.querySelector('.navbar');

function applyDarkMode(enabled) {
  document.body.classList.toggle('dark', enabled);
  if (toggle) toggle.textContent = enabled ? '☀️' : '🌙';

  // Cambiar clases del navbar para que uso de Bootstrap refleje el modo
  if (navbar) {
    if (enabled) {
      navbar.classList.remove('navbar-light', 'bg-white');
      navbar.classList.add('navbar-dark', 'bg-dark');
    } else {
      navbar.classList.remove('navbar-dark', 'bg-dark');
      navbar.classList.add('navbar-light', 'bg-white');
    }
  }
}

// Leer preferencia guardada o usar prefers-color-scheme si no existe
const saved = localStorage.getItem('darkMode');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const initial = saved === '1' ? true : (saved === '0' ? false : prefersDark);
applyDarkMode(initial);

if (toggle) {
  toggle.addEventListener('click', () => {
    const next = !document.body.classList.contains('dark');
    applyDarkMode(next);
    localStorage.setItem('darkMode', next ? '1' : '0');
  });
}
