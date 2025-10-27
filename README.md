# Sistem POS (Point of Sale)

Sistem Point of Sale lengkap dengan fitur manajemen produk, transaksi penjualan, stok, laporan keuangan, dan manajemen pengguna.

## Fitur Utama

### 1. **Sistem Penjualan**
- Keranjang belanja interaktif
- Perhitungan otomatis subtotal, diskon, dan PPN (11%)
- Pilihan metode pembayaran (Tunai, Transfer, Kartu Kredit/Debit)
- Pengurangan stok otomatis setelah transaksi
- Struk pembayaran digital yang dapat dicetak
- Validasi stok sebelum transaksi

### 2. **Manajemen Stok**
- Daftar stok real-time untuk semua produk
- Penyesuaian stok manual (restock, penyesuaian, barang rusak, retur)
- Peringatan otomatis untuk stok rendah (< 10 unit)
- Riwayat perubahan stok lengkap
- Tracking stok per transaksi

### 3. **Manajemen Produk**
- CRUD lengkap untuk produk
- Informasi detail: nama, kategori, harga jual, HPP, stok, deskripsi
- Perhitungan margin profit otomatis
- Pencarian produk berdasarkan nama/kategori
- Validasi data produk

### 4. **Pemisahan Profit dan HPP**
- Perhitungan profit otomatis (Harga Jual - HPP)
- Tracking HPP per produk dan transaksi
- Laporan profit per hari/minggu/bulan
- Margin profit per produk
- Analisis profitabilitas

### 5. **Dashboard Kasir**
- Ringkasan penjualan hari ini
- Total profit dan HPP hari ini
- Daftar produk dengan pencarian cepat
- Peringatan stok rendah
- Statistik transaksi real-time

### 6. **Laporan Keuangan**
- Laporan penjualan dengan grafik tren
- Laporan profit per periode (hari/minggu/bulan)
- Laporan performa per produk
- Grafik analisis penjualan (Line, Bar, Pie Chart)
- Export laporan ke CSV
- Filter berdasarkan tanggal

### 7. **Sistem Pengguna & Role**
- Autentikasi dengan Supabase
- 3 Level akses:
  - **Kasir**: Transaksi penjualan, lihat stok
  - **Admin**: Kelola produk, stok, lihat laporan
  - **Manajer**: Akses penuh + kelola pengguna
- Manajemen pengguna untuk manajer

## Cara Menggunakan

### Pertama Kali (Setup)

1. Klik tombol **"Buat Akun Baru"** di halaman login
2. Isi form dengan data:
   - Nama Lengkap
   - Email
   - Password (minimal 6 karakter)
   - Pilih Role: **Admin** atau **Manajer** (untuk akses penuh)
3. Klik **"Buat Akun & Mulai"**
4. Kembali ke halaman login dan masuk dengan email & password yang dibuat

### Alur Kerja Kasir

1. **Login** dengan akun kasir
2. **Dashboard**: Lihat ringkasan penjualan hari ini
3. **Transaksi Penjualan**:
   - Cari produk yang ingin dijual
   - Klik produk untuk menambah ke keranjang
   - Sesuaikan jumlah jika perlu
   - Masukkan diskon (jika ada)
   - Pilih metode pembayaran
   - Klik **"Proses Pembayaran"**
   - Cetak struk untuk pelanggan

### Alur Kerja Admin

1. **Login** dengan akun admin
2. **Manajemen Produk**:
   - Tambah produk baru dengan klik **"Tambah Produk"**
   - Isi: nama, kategori, harga jual, HPP, stok awal
   - Edit atau hapus produk yang ada
3. **Manajemen Stok**:
   - Lihat stok saat ini di tab "Stok Saat Ini"
   - Klik **"Sesuaikan Stok"** untuk update manual
   - Pilih tipe: Restock, Penyesuaian, Barang Rusak, atau Retur
   - Masukkan jumlah perubahan (+ untuk tambah, - untuk kurang)
   - Lihat riwayat di tab "Riwayat Perubahan"
4. **Laporan Keuangan**:
   - Pilih periode tanggal
   - Pilih grouping (Harian/Mingguan/Bulanan)
   - Lihat laporan penjualan atau produk
   - Export ke CSV jika perlu

### Alur Kerja Manajer

Semua akses Admin plus:

1. **Manajemen Pengguna**:
   - Tambah pengguna baru (kasir, admin, manajer)
   - Edit role atau informasi pengguna
   - Lihat statistik pengguna per role

## Teknologi

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions (Hono)
- **Database**: Supabase KV Store
- **Auth**: Supabase Authentication
- **Charts**: Recharts
- **UI Components**: shadcn/ui

## Struktur Data

### Produk
```typescript
{
  id: string
  name: string
  category: string
  sellingPrice: number
  costPrice: number
  stock: number
  description: string
}
```

### Transaksi
```typescript
{
  id: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    sellingPrice: number
    costPrice: number
    total: number
    cogs: number
  }>
  subtotal: number
  discount: number
  tax: number
  total: number
  cogs: number
  profit: number
  paymentMethod: string
  cashierId: string
  cashierName: string
  timestamp: string
  date: string
}
```

## Tips Penggunaan

1. **Stok Rendah**: Perhatikan peringatan stok rendah di dashboard
2. **HPP Akurat**: Pastikan HPP diisi dengan benar untuk perhitungan profit yang akurat
3. **Diskon**: Diskon dalam rupiah, bukan persen
4. **Laporan**: Gunakan filter tanggal untuk analisis periode tertentu
5. **Export**: Export laporan CSV untuk backup atau analisis lebih lanjut
6. **Role**: Buat kasir untuk karyawan, admin untuk supervisor, manajer untuk owner

## Catatan Keamanan

⚠️ **PENTING**: Sistem ini menggunakan Figma Make yang tidak dirancang untuk data produksi yang sangat sensitif. Untuk penggunaan bisnis nyata, pertimbangkan:
- Hosting dedicated dengan keamanan yang lebih kuat
- Enkripsi data tambahan
- Backup database regular
- SSL/TLS certificate
- Audit log yang lebih detail

## 🚀 Deployment ke Hosting

### Quick Start (5 Menit!)

Aplikasi ini mudah di-deploy ke hosting gratis seperti **Vercel**, **Netlify**, atau **Cloudflare Pages**.

**Cara Tercepat:**
1. Push project ke GitHub
2. Connect ke [Vercel.com](https://vercel.com) atau [Netlify.com](https://netlify.com)
3. Import repository
4. Klik Deploy
5. Set environment variables untuk Supabase
6. **SELESAI!** ✅

**Panduan Lengkap:**
- 📖 [QUICK-START-HOSTING.md](QUICK-START-HOSTING.md) - Panduan cepat (5 menit)
- 📚 [DEPLOYMENT.md](DEPLOYMENT.md) - Panduan detail semua platform

### File Konfigurasi Sudah Tersedia
- ✅ `vercel.json` - Konfigurasi Vercel
- ✅ `netlify.toml` - Konfigurasi Netlify
- ✅ `env.example.txt` - Template environment variables

Setelah deploy, jangan lupa set environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

---

## Support

Untuk pertanyaan atau bantuan, hubungi administrator sistem Anda.
