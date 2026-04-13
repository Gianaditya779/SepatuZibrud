/**
 * script.js - Global JavaScript untuk Katalog Sepatu
 * Database: Google Sheets via Apps Script
 */

// ─── Config ───────────────────────────────────────────────────
const WHATSAPP_NUMBER = '6281234567890';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbF817Nkla1EGEtd39u9aPKC1fTgy05FLrWuuR9TmonhAXTiC80yfO-u-isZV98Uzc/exec';

// ─── API Helper ───────────────────────────────────────────────
async function apiGet(params = {}) {
  const url = new URL(APPS_SCRIPT_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    redirect: 'follow',
    method: 'GET'
  });
  return res.json();
}

async function apiPost(data) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
}

// ─── Navbar scroll effect ─────────────────────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ─── Hamburger menu ───────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    const spans = hamburger.querySelectorAll('span');
    if (mobileNav.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  // Tutup mobile nav saat klik di luar
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

// ─── Format harga ke Rupiah ───────────────────────────────────
function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

// ─── Render product card HTML ─────────────────────────────────
function renderCard(product) {
  const isSoldOut = product.status === 'sold_out';
  const isNew = product.condition === 'baru';
  // Support both imageUrl (Sheets) and images array (local)
  const imgSrc = product.imageUrl || (product.images && product.images[0]) || '';
  const sizesHtml = product.sizes.slice(0, 4).map(s =>
    `<span class="size-chip">${s}</span>`
  ).join('') + (product.sizes.length > 4 ? `<span class="size-chip">+${product.sizes.length - 4}</span>` : '');

  return `
    <div class="product-card" onclick="goToDetail('${product.id}')" role="button" tabindex="0"
         onkeydown="if(event.key==='Enter') goToDetail('${product.id}')">
      <div class="product-card-img">
        <img src="${imgSrc}" alt="${product.name}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=60'" />
        ${isSoldOut ? `
          <div class="sold-overlay"><span>SOLD OUT</span></div>
          <span class="badge badge-sold">Sold Out</span>
        ` : `<span class="badge ${isNew ? 'badge-new' : 'badge-used'}">${isNew ? 'Baru' : 'Bekas'}</span>`}
      </div>
      <div class="product-card-body">
        <div class="product-brand">${product.brand}</div>
        <div class="product-name">${product.name}</div>
        <div class="product-price">${formatPrice(product.price)}</div>
        <div class="product-sizes">${sizesHtml}</div>
        <div class="product-condition">
          <span class="condition-dot ${product.condition}"></span>
          ${product.condition === 'baru' ? 'Kondisi Baru' : 'Kondisi Bekas'}
        </div>
      </div>
    </div>
  `;
}

// ─── Navigasi ke halaman detail ───────────────────────────────
function goToDetail(id) {
  window.location.href = `/detail.html?id=${id}`;
}

// ─── Toast notification ───────────────────────────────────────
function showToast(message, duration = 3000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── Intersection Observer untuk animasi scroll ───────────────
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe semua elemen animasi
document.querySelectorAll('.animate-fade-up-delay-1, .animate-fade-up-delay-2, .animate-fade-up-delay-3, .animate-fade-up-delay-4').forEach(el => {
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  el.style.transform = 'translateY(30px)';
  observer.observe(el);
});

// ─── Lazy loading images dengan IntersectionObserver ─────────
const imgObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
      imgObserver.unobserve(img);
    }
  });
}, { rootMargin: '200px' });

document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
