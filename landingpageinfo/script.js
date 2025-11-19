// ===== Dark Mode Toggle =====
const toggle = document.getElementById('darkModeToggle');
const navbar = document.getElementById('navbar');

function applyDarkMode(enabled) {
  document.body.classList.toggle('dark', enabled);
  if (toggle) toggle.textContent = enabled ? '☀️' : '🌙';
}

// Load saved preference or use system preference
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

// ===== Navbar Scroll Effect =====
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  lastScroll = currentScroll;
});

// ===== Scroll Progress Bar =====
const createScrollProgress = () => {
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress';
  progressBar.style.width = '0%';
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.pageYOffset / windowHeight) * 100;
    progressBar.style.width = scrolled + '%';
  });
};

createScrollProgress();

// ===== Smooth Scroll for Navigation Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ===== Intersection Observer for Animations =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
  section.style.opacity = '0';
  section.style.transform = 'translateY(20px)';
  section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(section);
});

// ===== Active Navigation Link =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (pageYOffset >= sectionTop - 100) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('text-blue-600', 'font-semibold');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('text-blue-600', 'font-semibold');
    }
  });
});

console.log('🚀 ServiLink Landing Page Loaded!');
