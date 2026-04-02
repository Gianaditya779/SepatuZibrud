/**
 * screenshot.js - Fitur Screenshot & WhatsApp
 * Menggunakan html2canvas untuk capture halaman produk
 * lalu redirect ke WhatsApp dengan pesan otomatis
 */

const WHATSAPP_ADMIN = '6281234567890'; // Ganti dengan nomor admin

/**
 * Ambil screenshot dari elemen produk dan buka WhatsApp
 * @param {string} productName - Nama produk
 * @param {string} productPrice - Harga produk (sudah diformat)
 * @param {string} productBrand - Merek produk
 */
async function takeScreenshotAndWhatsApp(productName, productPrice, productBrand) {
  const btn = document.getElementById('screenshotBtn');
  const originalText = btn.innerHTML;

  // Update button state
  btn.innerHTML = `
    <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
    Mengambil Screenshot...
  `;
  btn.disabled = true;

  try {
    // Target elemen yang akan di-screenshot
    const target = document.getElementById('productDetail');

    // Load html2canvas dari CDN
    if (typeof html2canvas === 'undefined') {
      throw new Error('html2canvas belum dimuat');
    }

    const canvas = await html2canvas(target, {
      backgroundColor: '#111111',
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 10000,
      onclone: (doc) => {
        // Pastikan font dan style ter-render dengan benar
        doc.body.style.fontFamily = 'Inter, sans-serif';
      }
    });

    // Convert canvas ke blob
    canvas.toBlob(async (blob) => {
      if (!blob) throw new Error('Gagal membuat gambar');

      // Buat URL untuk preview (opsional)
      const imgUrl = URL.createObjectURL(blob);

      // Pesan WhatsApp
      const message = encodeURIComponent(
        `Halo admin, saya tertarik dengan sepatu ini:\n\n` +
        `👟 *${productName}*\n` +
        `🏷️ Brand: ${productBrand}\n` +
        `💰 Harga: ${productPrice}\n\n` +
        `Apakah masih tersedia? Terima kasih 🙏`
      );

      const waUrl = `https://wa.me/${WHATSAPP_ADMIN}?text=${message}`;

      // Tampilkan preview screenshot sebelum redirect
      showScreenshotPreview(imgUrl, waUrl);

      // Reset button
      btn.innerHTML = originalText;
      btn.disabled = false;

    }, 'image/png', 0.9);

  } catch (error) {
    conSepatuZibrud.error('Screenshot error:', error);

    // Fallback: langsung buka WhatsApp tanpa screenshot
    const message = encodeURIComponent(
      `Halo admin, saya tertarik dengan sepatu ini:\n\n` +
      `👟 *${productName}*\n` +
      `🏷️ Brand: ${productBrand}\n` +
      `💰 Harga: ${productPrice}\n\n` +
      `Apakah masih tersedia? Terima kasih 🙏`
    );

    window.open(`https://wa.me/${WHATSAPP_ADMIN}?text=${message}`, '_blank');

    btn.innerHTML = originalText;
    btn.disabled = false;

    if (typeof showToast === 'function') {
      showToast('Membuka WhatsApp...');
    }
  }
}

/**
 * Tampilkan modal preview screenshot sebelum kirim ke WhatsApp
 */
function showScreenshotPreview(imgUrl, waUrl) {
  // Hapus modal lama jika ada
  const existing = document.getElementById('screenshotModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'screenshotModal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; animation: fadeIn 0.3s ease;
  `;

  modal.innerHTML = `
    <div style="
      background: #161616; border: 1px solid #2e2e2e;
      border-radius: 24px; padding: 32px; max-width: 480px; width: 100%;
      text-align: center;
    ">
      <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:8px; color:#fff">
        Screenshot Siap!
      </h3>
      <p style="font-size:0.875rem; color:#888; margin-bottom:20px">
        Screenshot produk berhasil dibuat. Klik tombol di bawah untuk melanjutkan ke WhatsApp.
      </p>
      <img src="${imgUrl}" alt="Screenshot Produk" style="
        width:100%; border-radius:12px; margin-bottom:24px;
        border:1px solid #2e2e2e; max-height:300px; object-fit:contain;
      " />
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap">
        <a href="${waUrl}" target="_blank" onclick="closeScreenshotModal()" style="
          display:inline-flex; align-items:center; gap:8px;
          background:#25D366; color:#fff; padding:12px 28px;
          border-radius:100px; font-size:0.9rem; font-weight:600;
          text-decoration:none; transition:all 0.3s;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Kirim ke WhatsApp
        </a>
        <button onclick="closeScreenshotModal()" style="
          background:transparent; color:#888; border:1px solid #2e2e2e;
          padding:12px 24px; border-radius:100px; font-size:0.9rem;
          font-weight:600; cursor:pointer; transition:all 0.3s;
        ">
          Tutup
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Tutup saat klik backdrop
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeScreenshotModal();
  });
}

function closeScreenshotModal() {
  const modal = document.getElementById('screenshotModal');
  if (modal) {
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 300);
  }
}

// CSS untuk animasi spin
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }
`;
document.head.appendChild(spinStyle);
