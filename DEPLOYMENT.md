# Panduan Deploy Sistem Penjualan dan Stok

## 📦 Build Production

Untuk membuat file production yang siap di-hosting:

```bash
npm install
npm run build
```

Hasil build akan tersimpan di folder `build/`.

## 🚀 Opsi Hosting Gratis & Mudah

### 1. **Vercel (RECOMMENDED - Paling Mudah)**

**Cara Deploy:**
1. Push project ke GitHub
2. Kunjungi [vercel.com](https://vercel.com)
3. Sign in dengan GitHub
4. Klik "Add New Project" → Import repository
5. Vercel akan auto-detect Vite → Klik "Deploy"
6. **SELESAI!** ✅ URL otomatis tersedia dalam 1-2 menit

**Konfigurasi (otomatis terdeteksi):**
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `build`

---

### 2. **Netlify**

**Cara Deploy:**
1. Push project ke GitHub
2. Kunjungi [netlify.com](https://netlify.com)
3. Klik "Add new site" → "Import an existing project"
4. Connect ke GitHub → Pilih repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
6. Klik "Deploy site"

**Atau via Drag & Drop:**
```bash
npm run build
# Drag folder 'build' ke netlify.com/drop
```

---

### 3. **GitHub Pages**

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Tambahkan di `package.json`:
```json
{
  "homepage": "https://[username].github.io/[repo-name]",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

3. Deploy:
```bash
npm run deploy
```

---

### 4. **Cloudflare Pages**

1. Push ke GitHub
2. Kunjungi [pages.cloudflare.com](https://pages.cloudflare.com)
3. Connect repository
4. Build settings:
   - Build command: `npm run build`
   - Build output directory: `build`
5. Deploy

---

## 📁 Struktur Build

Setelah build, folder `build/` akan berisi:
```
build/
├── index.html
├── assets/
│   ├── index-[hash].js    (JavaScript bundle)
│   └── index-[hash].css   (CSS bundle)
└── favicon.ico
```

Semua file sudah di-bundle dan di-minify menjadi beberapa file saja untuk performa optimal.

---

## 🔧 Konfigurasi Supabase

Jangan lupa set environment variables di hosting:

**Vercel/Netlify/Cloudflare:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

**Cara Setting:**
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site settings → Environment variables
- **Cloudflare**: Settings → Environment variables

---

## 🎯 Rekomendasi

**Untuk kemudahan:** Gunakan **Vercel**
- Deploy otomatis saat push ke GitHub
- Preview URL untuk setiap branch
- Analytics gratis
- SSL otomatis
- Custom domain gratis

**Link dokumentasi:**
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)

---

## 🚨 Checklist Sebelum Deploy

- [ ] Pastikan semua environment variables sudah di-set
- [ ] Test build lokal: `npm run build`
- [ ] Cek tidak ada error di console
- [ ] Test koneksi ke Supabase
- [ ] Push ke GitHub/GitLab
- [ ] Deploy via hosting pilihan
- [ ] Test aplikasi yang sudah di-deploy

---

## 💡 Tips

1. **Auto-deploy**: Semua hosting di atas support auto-deploy ketika push ke GitHub
2. **Preview**: Buat branch baru untuk test features, akan dapat preview URL
3. **Rollback**: Mudah rollback ke versi sebelumnya kapan saja
4. **Monitoring**: Gunakan analytics dari Vercel/Netlify untuk monitor traffic

---

**Butuh bantuan?** Lihat dokumentasi masing-masing platform atau tanyakan di community forum mereka.

