/**
 * admin.js - Admin Panel SepatuZibrud
 * Database: Google Sheets via Apps Script
 */

const ADMIN_PASSWORD = 'admin123';

let adminToken = localStorage.getItem('sepatuzibrud_admin_token') || null;
let editingId = null;

// ─── Helper API ───────────────────────────────────────────────
async function apiGet(params = {}) {
  const url = new URL(APPS_SCRIPT_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

async function apiPost(data) {
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return { success: true };
}

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const dateEl = document.getElementById('dateDisplay');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  if (adminToken) showDashboard();

  const pwInput = document.getElementById('adminPassword');
  if (pwInput) pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});

// ─── Login ────────────────────────────────────────────────────
function doLogin() {
  const password = document.getElementById('adminPassword').value.trim();
  const errEl = document.getElementById('loginError');
  if (password === ADMIN_PASSWORD) {
    adminToken = ADMIN_PASSWORD;
    localStorage.setItem('sepatuzibrud_admin_token', adminToken);
    showDashboard();
  } else {
    errEl.textContent = 'Password salah';
  }
}

function doLogout() {
  adminToken = null;
  localStorage.removeItem('sepatuzibrud_admin_token');
  document.getElementById('adminLayout').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminPassword').value = '';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  loadDashboard();
}

// ─── Switch Tab ───────────────────────────────────────────────
function switchTab(tabName, clickedBtn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  if (clickedBtn) clickedBtn.classList.add('active');
  if (tabName === 'dashboard') loadDashboard();
  if (tabName === 'products') loadAllProducts();
}

// ─── Load Dashboard ───────────────────────────────────────────
async function loadDashboard() {
  try {
    const products = await apiGet({ action: 'getAll' });
    document.getElementById('statTotal').textContent = products.length;
    document.getElementById('statAvailable').textContent = products.filter(p => p.status === 'available').length;
    document.getElementById('statSold').textContent = products.filter(p => p.status === 'sold_out').length;
    document.getElementById('statNew').textContent = products.filter(p => p.condition === 'baru').length;

    const tbody = document.getElementById('recentTableBody');
    tbody.innerHTML = products.slice(0, 5).map(p => `
      <tr>
        <td><img src="${p.imageUrl || p.images?.[0] || ''}" class="table-img" alt="${p.name}"
             onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=60'" /></td>
        <td style="font-weight:600">${p.name}</td>
        <td style="color:var(--gray-text)">${p.brand}</td>
        <td>${formatPrice(p.price)}</td>
        <td><span class="status-badge ${p.status === 'available' ? 'status-available' : 'status-sold'}">
          ${p.status === 'available' ? 'Tersedia' : 'Sold Out'}
        </span></td>
      </tr>
    `).join('');
  } catch (e) { console.error(e); }
}

// ─── Load All Products ────────────────────────────────────────
async function loadAllProducts() {
  try {
    const products = await apiGet({ action: 'getAll' });
    const tbody = document.getElementById('allProductsBody');
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.imageUrl || p.images?.[0] || ''}" class="table-img" alt="${p.name}"
             onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=60'" /></td>
        <td style="font-weight:600">${p.name}</td>
        <td style="color:var(--gray-text)">${p.brand}</td>
        <td>${formatPrice(p.price)}</td>
        <td><span class="status-badge ${p.condition === 'baru' ? 'status-available' : ''}"
            style="${p.condition === 'bekas' ? 'background:rgba(255,165,0,0.1);color:orange;border:1px solid rgba(255,165,0,0.3)' : ''}">
          ${p.condition === 'baru' ? 'Baru' : 'Bekas'}
        </span></td>
        <td><span class="status-badge ${p.status === 'available' ? 'status-available' : 'status-sold'}">
          ${p.status === 'available' ? 'Tersedia' : 'Sold Out'}
        </span></td>
        <td>
          <div class="table-actions">
            <button class="btn-action" onclick="editProduct('${p.id}')">Edit</button>
            <button class="btn-action ${p.status === 'available' ? '' : 'success'}" onclick="toggleStatus('${p.id}')">
              ${p.status === 'available' ? 'Sold Out' : 'Tersedia'}
            </button>
            <button class="btn-action danger" onclick="deleteProduct('${p.id}', '${p.name.replace(/'/g,"\\'")}')">Hapus</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) { console.error(e); }
}

// ─── Submit Product ───────────────────────────────────────────
async function submitProduct(e) {
  e.preventDefault();
  const name = document.getElementById('fieldName').value.trim();
  const brand = document.getElementById('fieldBrand').value.trim();
  const price = document.getElementById('fieldPrice').value;
  const condition = document.getElementById('fieldCondition').value;
  const description = document.getElementById('fieldDesc').value.trim();
  const imageUrl = document.getElementById('fieldImageUrl').value.trim();
  const sizes = Array.from(document.querySelectorAll('.size-check:checked')).map(c => c.value);

  if (!name || !brand || !price || !condition || sizes.length === 0) {
    showToast('Lengkapi semua field yang wajib diisi');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const payload = {
    action: editingId ? 'update' : 'add',
    id: editingId || crypto.randomUUID(),
    name, brand,
    price: parseInt(price),
    sizes, condition, description, imageUrl
  };

  await apiPost(payload);
  showToast(editingId ? 'Produk diperbarui!' : 'Produk ditambahkan!');
  resetForm();

  setTimeout(() => {
    switchTab('products', document.querySelectorAll('.sidebar-link')[1]);
  }, 1500);

  btn.disabled = false;
  btn.textContent = 'Simpan Produk';
}

// ─── Edit Product ─────────────────────────────────────────────
async function editProduct(id) {
  const p = await apiGet({ action: 'getOne', id });
  if (!p) return;
  editingId = id;
  document.getElementById('formTitle').textContent = 'Edit Produk';
  document.getElementById('fieldName').value = p.name;
  document.getElementById('fieldBrand').value = p.brand;
  document.getElementById('fieldPrice').value = p.price;
  document.getElementById('fieldCondition').value = p.condition;
  document.getElementById('fieldDesc').value = p.description || '';
  document.getElementById('fieldImageUrl').value = p.imageUrl || p.images?.[0] || '';
  document.querySelectorAll('.size-check').forEach(cb => {
    cb.checked = p.sizes.includes(cb.value);
  });
  switchTab('add', document.querySelectorAll('.sidebar-link')[2]);
}

// ─── Toggle Status ────────────────────────────────────────────
async function toggleStatus(id) {
  await apiPost({ action: 'toggle_status', id });
  showToast('Status berhasil diubah');
  setTimeout(() => { loadAllProducts(); loadDashboard(); }, 1500);
}

// ─── Delete Product ───────────────────────────────────────────
async function deleteProduct(id, name) {
  if (!confirm(`Hapus produk "${name}"?`)) return;
  await apiPost({ action: 'delete', id });
  showToast('Produk dihapus');
  setTimeout(() => { loadAllProducts(); loadDashboard(); }, 1500);
}

// ─── Reset Form ───────────────────────────────────────────────
function resetForm() {
  editingId = null;
  document.getElementById('formTitle').textContent = 'Tambah Produk';
  document.getElementById('productForm').reset();
  document.querySelectorAll('.size-check').forEach(cb => cb.checked = false);
}
