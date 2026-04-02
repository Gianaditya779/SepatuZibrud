/**
 * server.js - Backend Express untuk Katalog Sepatu
 * Menangani API produk, upload gambar, dan admin panel
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { v4: uuidv4 } = require('uuid');

// ─── Google Apps Script URL ───────────────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbF817Nkla1EGEtd39u9aPKC1fTgy05FLrWuuR9TmonhAXTiC80yfO-u-isZV98Uzc/exec';

// Helper: kirim data ke Google Sheets via Apps Script
function syncToSheets(payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const url = new URL(APPS_SCRIPT_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ ok: true, data }));
    });
    req.on('error', (e) => {
      console.error('Sheets sync error:', e.message);
      resolve({ ok: false });
    });
    req.write(body);
    req.end();
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
// admin folder removed, admin.html now in public/

// ─── Database sederhana (JSON file) ──────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'data', 'products.json');

// Pastikan folder data & uploads ada
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Inisialisasi database jika belum ada
if (!fs.existsSync(DB_PATH)) {
  const sampleData = [
    {
      id: uuidv4(),
      name: "Nike Air Max 270",
      brand: "Nike",
      price: 1850000,
      sizes: ["39", "40", "41", "42", "43"],
      condition: "baru",
      status: "available",
      description: "Sepatu Nike Air Max 270 original dengan teknologi Air unit terbesar di tumit untuk kenyamanan maksimal. Cocok untuk aktivitas sehari-hari maupun olahraga ringan.",
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"],
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Adidas Ultraboost 22",
      brand: "Adidas",
      price: 2200000,
      sizes: ["40", "41", "42", "43", "44"],
      condition: "baru",
      status: "available",
      description: "Adidas Ultraboost 22 dengan teknologi Boost terbaru memberikan energi balik yang luar biasa. Upper Primeknit+ yang adaptif mengikuti bentuk kaki.",
      images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80"],
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "New Balance 574",
      brand: "New Balance",
      price: 1350000,
      sizes: ["38", "39", "40", "41", "42"],
      condition: "baru",
      status: "available",
      description: "New Balance 574 klasik dengan desain timeless yang cocok untuk berbagai outfit. Dibuat dengan bahan premium untuk kenyamanan sepanjang hari.",
      images: ["https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80"],
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Converse Chuck Taylor",
      brand: "Converse",
      price: 750000,
      sizes: ["37", "38", "39", "40", "41", "42"],
      condition: "baru",
      status: "available",
      description: "Converse Chuck Taylor All Star klasik yang tidak pernah ketinggalan zaman. Kanvas premium dengan sol karet vulkanisir yang tahan lama.",
      images: ["https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=600&q=80"],
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Vans Old Skool",
      brand: "Vans",
      price: 850000,
      sizes: ["38", "39", "40", "41", "42", "43"],
      condition: "bekas",
      status: "available",
      description: "Vans Old Skool kondisi 95% mulus, hanya dipakai beberapa kali. Signature side stripe yang ikonik dengan upper canvas dan suede.",
      images: ["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80"],
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Jordan 1 Retro High",
      brand: "Jordan",
      price: 3500000,
      sizes: ["41", "42", "43"],
      condition: "baru",
      status: "sold_out",
      description: "Air Jordan 1 Retro High OG original dengan colorway terbaru. Leather premium dengan Air cushioning untuk kenyamanan dan gaya yang tak tertandingi.",
      images: ["https://images.unsplash.com/photo-1556906781-9a412961a28c?w=600&q=80"],
      createdAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(DB_PATH, JSON.stringify(sampleData, null, 2));
}

// Helper: baca & tulis database
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// ─── Multer config untuk upload gambar ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Hanya file gambar yang diizinkan'));
  }
});

// ─── Admin Auth Middleware ────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const adminAuth = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (token === ADMIN_PASSWORD) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

// ─── API Routes ───────────────────────────────────────────────────────────────

// GET semua produk (dengan filter & search)
app.get('/api/products', (req, res) => {
  let products = readDB();
  const { search, brand, size, condition, minPrice, maxPrice, status } = req.query;

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    );
  }
  if (brand) products = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  if (size) products = products.filter(p => p.sizes.includes(size));
  if (condition) products = products.filter(p => p.condition === condition);
  if (status) products = products.filter(p => p.status === status);
  if (minPrice) products = products.filter(p => p.price >= parseInt(minPrice));
  if (maxPrice) products = products.filter(p => p.price <= parseInt(maxPrice));

  res.json(products);
});

// GET produk by ID
app.get('/api/products/:id', (req, res) => {
  const products = readDB();
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  res.json(product);
});

// POST tambah produk (admin)
app.post('/api/products', adminAuth, upload.array('images', 5), (req, res) => {
  const { name, brand, price, sizes, condition, description } = req.body;
  const products = readDB();

  const images = req.files && req.files.length > 0
    ? req.files.map(f => `/uploads/${f.filename}`)
    : [req.body.imageUrl || ''];

  const newProduct = {
    id: uuidv4(),
    name,
    brand,
    price: parseInt(price),
    sizes: Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim()),
    condition,
    status: 'available',
    description,
    images,
    createdAt: new Date().toISOString()
  };

  products.unshift(newProduct);
  writeDB(products);

  // Sync ke Google Sheets
  syncToSheets({ action: 'add', ...newProduct });

  res.status(201).json(newProduct);
});

// PUT update produk (admin)
app.put('/api/products/:id', adminAuth, upload.array('images', 5), (req, res) => {
  const products = readDB();
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Produk tidak ditemukan' });

  const { name, brand, price, sizes, condition, status, description } = req.body;

  const newImages = req.files && req.files.length > 0
    ? req.files.map(f => `/uploads/${f.filename}`)
    : null;

  products[idx] = {
    ...products[idx],
    name: name || products[idx].name,
    brand: brand || products[idx].brand,
    price: price ? parseInt(price) : products[idx].price,
    sizes: sizes ? (Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim())) : products[idx].sizes,
    condition: condition || products[idx].condition,
    status: status || products[idx].status,
    description: description || products[idx].description,
    images: newImages || products[idx].images,
    updatedAt: new Date().toISOString()
  };

  writeDB(products);
  res.json(products[idx]);
});

// DELETE produk (admin)
app.delete('/api/products/:id', adminAuth, (req, res) => {
  let products = readDB();
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });

  products = products.filter(p => p.id !== req.params.id);
  writeDB(products);

  // Sync ke Google Sheets
  syncToSheets({ action: 'delete', id: req.params.id });

  res.json({ message: 'Produk berhasil dihapus' });
});

// PATCH toggle sold out (admin)
app.patch('/api/products/:id/status', adminAuth, (req, res) => {
  const products = readDB();
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Produk tidak ditemukan' });

  products[idx].status = products[idx].status === 'available' ? 'sold_out' : 'available';
  writeDB(products);

  // Sync ke Google Sheets
  syncToSheets({ action: 'update_status', id: products[idx].id, status: products[idx].status });

  res.json(products[idx]);
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_PASSWORD, message: 'Login berhasil' });
  } else {
    res.status(401).json({ error: 'Password salah' });
  }
});

// ─── Serve HTML pages ─────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/catalog', (req, res) => res.sendFile(path.join(__dirname, 'public', 'catalog.html')));
app.get('/detail', (req, res) => res.sendFile(path.join(__dirname, 'public', 'detail.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  console.log(`🔑 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🔐 Admin password: ${ADMIN_PASSWORD}`);
});
