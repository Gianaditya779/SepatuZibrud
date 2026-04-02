/**
 * admin.js - JavaScript untuk Admin Panel sepatuzibrud
 * Menangani: login, CRUD produk, statistik
 */

let adminToken = localStorage.getItem('sepatuzibrud_admin_token') || null;
let editingId = null;

// ─── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set tanggal
  const dateEl = document.getElementById('dateDisplay');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // Cek apakah sudah login
  if (adminToken) {
    showDashboard();
  }

  // Enter key untuk login
  const pwInput = document.getElementById('adminPassword');
  if (pwInput) {
    pwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });
  }
});

// ─── Login ─────────────────────────────────────────────────────
async function doLogin() {
  const password = document.getElementById('adminPassword').value.trim();
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');

  if (!password) {
    errEl.textContent = 'Masukkan password terlebih dahulu';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Memverifikasi...';
  errEl.textContent = '';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (res.ok) {
      adminToken = data.token;
      localStorage.setItem('sepatuzibrud_admin_token', adminToken);
      showDashboard();
    } else {
      errEl.textContent = data.error || 'Password salah';
      btn.disabled = false;
      btn.textContent = 'Masuk';
    }
  } catch (e) {
    errEl.textContent = 'Gagal terhubung ke server';
    btn.disabled = false;
    btn.textContent = 'Masuk';
  }
}

// ─── Logout ────────────────────────────────────────────────────
function doLogout() {
  adminToken = null;
  localStorage.removeItem('sepatuzibrud_admin_token');
  document.getElementById('adminLayout').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminPassword').value = '';
}

// ─── Show Dashboard ────────────────────────────────────────────
function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  loadDashboard();
}

// ─── Switch Tab ────────────────────────────────────────────────
function switchTab(tabName, clickedBtn) {
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');

  // Update sidebar links
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  if (clickedBtn) clickedBtn.classList.add('active');

  // Load data for tab
  if (tabName === 'dashboard') loadDashboard();
  if (tabName === 'products') loadAllProducts();
}

// ─── Load Dashboard ────────────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await fetch('/api/products');
    const products = await res.json();

    document.getElementById('statTotal').textContent = products.length;
    document.getElementById('statAvailable').textContent = products.filter(p => p.status === 'available').length;
    document.getElementById('statSold').textContent = products.filter(p => p.status === 'sold_out').length;
    document.getElementById('statNew').textContent = products.filter(p => p.condition === 'baru').length;

    // Recent products (5 terbaru)
    const tbody = document.getElementById('recentTableBody');
    tbody.innerHTML = products.slice(0, 5).map(p => `
      <tr>
        <td><img src="${p.images[0]}" class="table-img" alt="${p.name}"
             onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=60'" /></td>
        <td style="font-weight:600">${p.name}</td>
        <td style="color:var(--gray-text)">${p.brand}</td>
        <td>${formatPrice(p.price)}</td>
        <td>
          <span class="status-badge ${p.status === 'available' ? 'status-available' : 'status-sold'}">
            ${p.status === 'available' ? 'Tersedia' : 'Sold Out'}
          </span>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('Gagal load dashboard:', e);
  }
}

// ─── Load All Products ─────────────────────────────────────────
async function loadAllProducts() {
  try {
    const res = await fetch('/api/products');
    const products = await res.json();

    const tbody = document.getElementById('allProductsBody');
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.images[0]}" class="table-img" alt="${p.name}"
             onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=60'" /></td>
        <td style="font-weight:600; max-width:180px">${p.name}</td>
        <td style="color:var(--gray-text)">${p.brand}</td>
        <td>${formatPrice(p.price)}</td>
        <td>
          <span class="status-badge ${p.condition === 'baru' ? 'status-available' : ''}" style="${p.condition === 'bekas' ? 'background:rgba(255,165,0,0.1);color:orange;border:1px solid rgba(255,165,0,0.3)' : ''}">
            ${p.condition === 'baru' ? 'Baru' : 'Bekas'}
          </span>
        </td>
        <td>
          <span class="status-badge ${p.status === 'available' ? 'status-available' : 'status-sold'}">
            ${p.status === 'available' ? 'Tersedia' : 'Sold Out'}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-action" onclick="editProduct('${p.id}')">Edit</button>
            <button class="btn-action ${p.status === 'available' ? '' : 'success'}" onclick="toggleStatus('${p.id}')">
              ${p.status === 'available' ? 'Sold Out' : 'Tersedia'}
            </button>
            <button class="btn-action danger" onclick="deleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')">Hapus</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('Gagal load produk:', e);
  }
}

// ─── Submit Product (Add / Edit) ───────────────────────────────
async function submitProduct(e) {
  e.preventDefault();

  const name = document.getElementById('fieldName').value.trim();
  const brand = document.getElementById('fieldBrand').value.trim();
  const price = document.getElementById('fieldPrice').value;
  const condition = document.getElementById('fieldCondition').value;
  const description = document.getElementById('fieldDesc').value.trim();
  const imageFiles = document.getElementById('fieldImages').files;

  // Kumpulkan ukuran yang dipilih
  const sizes = Array.from(document.querySelectorAll('.size-check:checked')).map(c => c.value);

  if (!name || !brand || !price || !condition || sizes.length === 0) {
    showToast('Lengkapi semua field yang wajib diisi (termasuk ukuran)');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('brand', brand);
    formData.append('price', price);
    formData.append('condition', condition);
    formData.append('description', description);
    sizes.forEach(s => formData.append('sizes', s));

    // Append gambar jika ada
    Array.from(imageFiles).forEach(file => formData.append('images', file));

    const isEdit = !!editingId;
    const url = isEdit ? `/api/products/${editingId}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'x-admin-token': adminToken },
      body: formData
    });

    if (res.ok) {
      showToast(isEdit ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!');
      resetForm();
      switchTab('products', document.querySelectorAll('.sidebar-link')[1]);
    } else {
      const err = await res.json();
      showToast(err.error || 'Gagal menyimpan produk');
    }
  } catch (err) {
    showToast('Terjadi kesalahan. Coba lagi.');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan Produk';
  }
}

// ─── Edit Product ──────────────────────────────────────────────
async function editProduct(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    const p = await res.json();

    editingId = id;
    document.getElementById('editProductId').value = id;
    document.getElementById('formTitle').textContent = 'Edit Produk';
    document.getElementById('fieldName').value = p.name;
    document.getElementById('fieldBrand').value = p.brand;
    document.getElementById('fieldPrice').value = p.price;
    document.getElementById('fieldCondition').value = p.condition;
    document.getElementById('fieldDesc').value = p.description || '';

    // Set ukuran
    document.querySelectorAll('.size-check').forEach(cb => {
      cb.checked = p.sizes.includes(cb.value);
    });

    // Preview gambar existing
    const previewWrap = document.getElementById('imgPreviewWrap');
    previewWrap.innerHTML = p.images.map(img =>
      `<img src="${img}" class="img-preview" alt="preview" />`
    ).join('');

    switchTab('add', document.querySelectorAll('.sidebar-link')[2]);
  } catch (e) {
    showToast('Gagal memuat data produk');
  }
}

// ─── Toggle Status ─────────────────────────────────────────────
async function toggleStatus(id) {
  try {
    const res = await fetch(`/api/products/${id}/status`, {
      method: 'PATCH',
      headers: { 'x-admin-token': adminToken }
    });

    if (res.ok) {
      const p = await res.json();
      showToast(`Status diubah ke: ${p.status === 'available' ? 'Tersedia' : 'Sold Out'}`);
      loadAllProducts();
      loadDashboard();
    }
  } catch (e) {
    showToast('Gagal mengubah status');
  }
}

// ─── Delete Product ────────────────────────────────────────────
async function deleteProduct(id, name) {
  if (!confirm(`Hapus produk "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': adminToken }
    });

    if (res.ok) {
      showToast('Produk berhasil dihapus');
      loadAllProducts();
      loadDashboard();
    }
  } catch (e) {
    showToast('Gagal menghapus produk');
  }
}

// ─── Reset Form ────────────────────────────────────────────────
function resetForm() {
  editingId = null;
  document.getElementById('editProductId').value = '';
  document.getElementById('formTitle').textContent = 'Tambah Produk';
  document.getElementById('productForm').reset();
  document.querySelectorAll('.size-check').forEach(cb => cb.checked = false);
  document.getElementById('imgPreviewWrap').innerHTML = '';
}

// ─── Preview Images ────────────────────────────────────────────
function previewImages(input) {
  const wrap = document.getElementById('imgPreviewWrap');
  wrap.innerHTML = '';
  Array.from(input.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'img-preview';
      img.alt = 'preview';
      wrap.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}
