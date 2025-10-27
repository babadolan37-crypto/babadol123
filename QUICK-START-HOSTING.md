# 🚀 Quick Start - Deploy ke Hosting (5 Menit!)

## Cara Tercepat & Termudah: VERCEL

### Step 1: Push ke GitHub
```bash
# Di folder project ini, jalankan:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/nama-repo.git
git push -u origin main
```

### Step 2: Deploy ke Vercel
1. Buka [vercel.com](https://vercel.com)
2. Klik **"Sign Up"** → Login dengan **GitHub**
3. Klik **"Add New Project"**
4. Pilih repository yang baru di-push
5. Klik **"Deploy"** (jangan ubah apapun, sudah auto-detect!)
6. **Tunggu 1-2 menit** ⏳
7. **SELESAI!** ✅ 

Link aplikasi Anda akan muncul seperti:
`https://nama-project.vercel.app`

---

## ⚙️ Setting Supabase (PENTING!)

Setelah deploy, tambahkan environment variables:

1. Di Vercel dashboard, buka project Anda
2. Klik **Settings** → **Environment Variables**
3. Tambahkan:
   ```
   Name: VITE_SUPABASE_URL
   Value: [URL Supabase Anda]
   
   Name: VITE_SUPABASE_ANON_KEY  
   Value: [Key Supabase Anda]
   ```
4. Klik **Save**
5. Klik **Redeploy** (di tab Deployments)

**Cara dapat Supabase URL & Key:**
- Login ke [supabase.com](https://supabase.com)
- Pilih project Anda
- Settings → API
- Copy "Project URL" dan "anon public"

---

## 🎉 Selesai!

Aplikasi Anda sudah online dan bisa diakses dari mana saja!

### Update Aplikasi

Setiap kali push ke GitHub, Vercel akan auto-deploy:
```bash
git add .
git commit -m "Update fitur X"
git push
```

**Auto-deploy dalam 1-2 menit!** 🚀

---

## 📌 Custom Domain (Opsional)

Ingin domain sendiri? (contoh: tokoku.com)

1. Di Vercel → Settings → Domains
2. Masukkan domain Anda
3. Ikuti instruksi setting DNS
4. Selesai! Domain custom siap dalam 24 jam

---

## 💡 Alternative Hosting Lain

Kalau tidak mau pakai Vercel, bisa pakai:

### **Netlify** (Sama mudahnya)
- [netlify.com](https://netlify.com) 
- Cara sama persis seperti Vercel

### **Cloudflare Pages** (Paling cepat)
- [pages.cloudflare.com](https://pages.cloudflare.com)
- Setting sama, build command: `npm run build`

---

## ❓ Troubleshooting

**Q: Error saat build?**
A: Pastikan `npm install` dan `npm run build` jalan di lokal dulu

**Q: Aplikasi blank/error?**
A: Cek environment variables Supabase sudah di-set belum

**Q: Perlu bantuan?**
A: Baca file `DEPLOYMENT.md` untuk panduan lengkap

---

**Selamat! Aplikasi Anda sudah online! 🎊**

