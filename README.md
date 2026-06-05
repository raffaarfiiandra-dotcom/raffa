# WealthManager - Premium Finance Web Application

WealthManager adalah aplikasi manajemen keuangan terpadu kelas premium yang dibangun menggunakan **Next.js 15 (App Router)**, **TypeScript**, dan **Tailwind CSS**. Aplikasi ini terintegrasi penuh dengan **Supabase** untuk basis data, otentikasi (RLS), dan didesain ramah pengguna (responsif) berbasis tangkapan layar referensi WealthManager.

## 🚀 Fitur Utama
- **Dashboard Finansial**: Total saldo kekayaan bersih, grafik arus kas (cashflow) visual interaktif 6 bulan terakhir, aktivitas terbaru, dan target tabungan.
- **Transaksi Komprehensif (CRUD)**: Pencatatan pengeluaran & pemasukan, penentuan kategori otomatis berbasis AI heuristik (mendeteksi input deskripsi), upload bukti transaksi (base64 database fallback).
- **Hutang & Piutang**: Pengingat pencatatan hutang/piutang beserta tanggal jatuh tempo, status tagihan (Lunas, Belum Lunas, Terlambat).
- **Aset Portofolio**: Manajemen investasi, properti, kas/tabungan, kendaraan, beserta visualisasi Donut Chart porsi alokasi aset.
- **Laporan & Ekspor Multi-Format**:
  - **PDF** (dokumen cetak summary tabel dengan jspdf)
  - **Excel** (format spreadsheet .xlsx dengan xlsx)
  - **CSV** & **JSON** (data dump lengkap)
- **AI Financial Insights**: Rekomendasi pengelolaan anggaran berdasarkan pengeluaran aktif pengguna.
- **PWA (Progressive Web App)**: Bisa diinstal di HP, mendukung caching lokal untuk akses cepat offline.

---

## 🛠️ Langkah Instalasi Lokal

### 1. Kloning / Unduh Repositori
Ekstrak berkas proyek ini di mesin lokal Anda.

### 2. Pasang Dependensi
Buka terminal di direktori proyek dan jalankan:
```bash
npm install
```

### 3. Konfigurasi Environment Variables (Supabase)
Salin berkas `.env.example` menjadi `.env.local` atau `.env`:
```bash
cp .env.example .env.local
```
Lalu isi variabel dengan kredensial proyek Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Catatan: Jika Anda tidak mengonfigurasi variabel di atas, aplikasi akan mendeteksi secara otomatis dan beralih menggunakan **Local Storage Fallback Mode**, sehingga semua fitur otentikasi, grafik, transaksi, aset, laporan tetap dapat dicoba langsung 100% interaktif di browser).*

### 4. Setup Basis Data Supabase
Jika Anda ingin menggunakan Supabase Cloud:
1. Buka SQL Editor di Dashboard Supabase Anda.
2. Salin isi berkas `supabase/schema.sql`.
3. Tempel dan jalankan (Run) kode SQL tersebut untuk membuat tabel, relasi, Row Level Security (RLS) policies, serta registrasi trigger profil otomatis.

### 5. Jalankan Server Dev Lokal
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## ⚡ Deployment ke Vercel

Aplikasi ini 100% siap dideploy ke **Vercel** tanpa konfigurasi tambahan yang rumit:
1. Hubungkan repositori Git Anda ke Vercel.
2. Saat proses konfigurasi proyek di Vercel, masukkan Environment Variables berikut:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Klik **Deploy**. Selesai!

---

## 📂 Struktur Direktori Proyek
```
├── public/                # File statis, manifest.json, sw.js (service worker)
├── src/
│   ├── app/               # Routing Next.js App Router (Layouts & Pages)
│   │   ├── dashboard/     # Halaman Dashboard utama
│   │   ├── transactions/  # Riwayat transaksi & filter
│   │   ├── debts-receivables/ # Catatan Hutang & Piutang
│   │   ├── assets/        # Manajemen Aset & Donut Chart
│   │   ├── reports/       # Laporan & Ekspor file (PDF, Excel, dll)
│   │   ├── settings/      # Preferensi, Kategori, & Target Keuangan
│   │   └── login/ & register/ # Otentikasi Masuk & Daftar Akun
│   ├── components/        # Komponen UI Reusable (Header, Sidebar, Modals)
│   ├── lib/
│   │   ├── db/            # Wrapper Database Hibrida (Supabase / LocalStorage)
│   │   ├── ai-engine.ts   # Algoritma klasifikasi & analisis AI lokal
│   │   └── supabase.ts    # Inisialisasi Klien Supabase SDK
```
