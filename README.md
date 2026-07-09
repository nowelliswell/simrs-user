# SIMRS User Setting

Aplikasi manajemen hak akses user untuk sistem SIMRS (Sistem Informasi Manajemen Rumah Sakit). Dibangun dengan **Laravel 10** (Backend) dan **React 18 + TypeScript** (Frontend).

---

## Fitur Utama

### 👤 Manajemen Pegawai
- List semua pegawai dengan fitur pencarian sargable berbasis NIK (indeks awalan) dan Nama (FULLTEXT search).
- Edit username dan password user (terenkripsi AES di database).
- Toggle hak akses per kolom (true/false) untuk setiap user.

### 🔍 Bandingkan Akses
- Pilih dua pegawai (User A dan User B) secara bersamaan.
- Tampilkan perbandingan hak akses side-by-side dalam satu tabel.
- Perbedaan akses di-highlight otomatis (warna kuning).
- Copy hak akses User A → User B atau sebaliknya secara instan (tanpa merusak database mode).

### 👥 Group User
- CRUD group user (tambah, lihat, edit nama grup inline, hapus).
- Tambah / hapus anggota ke dalam group dengan list pegawai yang memiliki paginasi penuh.
- Set leader untuk setiap group dengan respons notifikasi Toast.
- **Sesuaikan Akses** — Copy hak akses leader ke semua anggota group sekaligus menggunakan pemrosesan kueri massal (*Bulk Processing*).

---

## 🚀 Optimasi Performa & Keamanan (Update-1)

Dalam rilis **Update-1**, kami telah menerapkan serangkaian optimasi tingkat lanjut pada sisi database, backend API, dan frontend UI untuk memastikan kecepatan maksimal dan keamanan sistem:

### 1. Optimasi Kueri JOIN & Indeks Kolom (`id_user_plain`)
* **Masalah Awal:** Kueri join antara tabel `pegawai` dan `user` menggunakan fungsi dekripsi dinamis `AES_DECRYPT(user.id_user, 'nur') = pegawai.nik` (Non-Sargable). Hal ini memaksa MySQL melakukan *Full Table Scan* pada memori di setiap request.
* **Solusi:** 
  - Ditambahkan kolom terindeks baru `id_user_plain` pada tabel `user` untuk menyimpan NIK versi plain-text.
  - Menghapus pengecekan skema dinamis (`Schema::hasColumn`) di backend untuk menghemat *round trip metadata query*.
  - Mengubah JOIN kueri agar langsung mengakses `user.id_user_plain` yang terindeks unik. Kecepatan kueri meningkat secara instan.

### 2. Kueri Massal (Bulk Processing) pada Sinkronisasi Akses
* **Masalah Awal:** Menggunakan loop N+1 kueri untuk memproses sinkronisasi akses anggota grup (menghasilkan hingga $3N$ kueri ke database untuk $N$ anggota).
* **Solusi:** Menggunakan kueri massal (*Bulk SELECT* dengan `whereIn`, *Bulk UPDATE*, dan *Bulk INSERT* multi-baris). Komunikasi ke database diringkas menjadi **maksimal 6 kueri** untuk memproses data anggota dalam jumlah tak terbatas sekaligus.

### 3. Pencarian Teks Penuh (FULLTEXT Search) & Sargable NIK
* **Masalah Awal:** Pencarian pegawai menggunakan wildcard di depan (`LIKE '%keyword%'`) pada kolom `nama` dan `nik` memblokir penggunaan indeks database.
* **Solusi:**
  - Menambahkan **FULLTEXT INDEX** pada kolom `nama` di tabel `pegawai`.
  - Mengimplementasikan pencarian dinamis cerdas di backend:
    - Input angka (NIK) memicu kueri sargable awalan: `LIKE 'keyword%'`.
    - Input teks >= 3 karakter memicu kueri teks penuh berkecepatan tinggi: `MATCH(nama) AGAINST(? IN BOOLEAN MODE)`.
    - Input teks < 3 karakter menggunakan kueri *fallback* `LIKE '%keyword%'`.

### 4. Penanganan Error Terpusat & Keamanan Server
* **Pencegahan Timeout:** Menambahkan `set_time_limit(120);` untuk mengamankan proses sinkronisasi anggota grup dalam skala besar dari kegagalan koneksi.
* **Penyembunyian SQL Exception:** Mengamankan backend agar tidak mengirim exception mentah SQL/database ke frontend. Pesan diganti dengan respon ramah pengguna HTTP 500 (*"Terjadi kesalahan sistem saat menyesuaikan akses."*), sementara log kesalahan rinci dicatat secara terpusat di `storage/logs/laravel.log` menggunakan `Log::error`.

### 5. Peningkatan UX & Paginasi Frontend
* **Paginasi Tambah Anggota:** Menambahkan navigasi halaman (halaman saat ini, total data, tombol Prev & Next) pada panel daftar pegawai di `TambahAnggota.tsx`.
* **Indikator Loading:** Menambahkan indikator status loading reaktif dan menonaktifkan tombol (Double Click Protection) secara dinamis saat proses *Sesuaikan Akses* berlangsung.
* **Modern Toast Notifications:** Mengganti *browser alert* bawaan dengan animasi notifikasi toast interaktif menggunakan `react-toastify`.

### 6. TypeScript Type Safety
* Menghilangkan seluruh warning compiler dan error `Property does not exist on type 'never'` dengan mendeklarasikan kontrak `interface Anggota` dan menggunakan generic state `useState<Anggota[]>([]);`.
* Mendeklarasikan tipe input event handler secara eksplisit.
* Mengecualikan kolom pembantu `id_user_plain` dari tabel perbandingan akses.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Laravel 10, PHP >= 8.1, MySQL |
| Frontend | React 18, TypeScript, Vite |
| UI | Flowbite React, Tailwind CSS |
| State | Zustand |
| Notifikasi | React Toastify |
| HTTP Client | Axios |

---

## Struktur Project

```
├── BACKEND/          # Laravel 10 REST API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── PegawaiController.php            # Pegawai, detail user, edit akses sargable, fulltext search
│   │   │   ├── GroupUserController.php          # CRUD group + copy akses grup (Bulk Processing)
│   │   │   └── AnggotaControllerController.php  # Manajemen anggota group & pencarian teroptimasi
│   │   └── Models/
│   │       ├── GroupUser.php
│   │       └── UserToGroupUser.php
│   ├── routes/api.php                           # RESTful API routes (PUT untuk edit grup)
│   └── database/migrations/                     # Migrasi tabel group_users & id_user_plain
│
└── FRONTEND/         # React + TypeScript
    └── src/
        ├── components/
        │   ├── PegawaiComponent.tsx             # List pegawai + perbandingan akses (tanpa id_user_plain)
        │   ├── DetailUserComponent.tsx          # Edit username, password & toggle akses
        │   ├── GroupUserComponent.tsx           # CRUD inline edit + tombol loading "Sesuaikan Akses"
        │   ├── TambahAnggota.tsx                # Paginasi pegawai + react-toastify + typed states
        │   └── RootComponent.tsx                # Layout + sidebar
        ├── store/                               # Zustand state management
        ├── utils/                               # Axios service layer
        └── interface/                           # TypeScript interfaces
```

---

## API Endpoints Utama

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/pegawai` | List pegawai (Pencarian Sargable/FULLTEXT) |
| GET | `/api/detail-user/{nik}` | Detail + akses user by NIK |
| POST | `/api/ganti-akses-user/{nik}` | Toggle satu kolom akses |
| POST | `/api/edit-username-password/{nik}` | Edit username & password |
| POST | `/api/copy-akses` | Copy akses 1 user ke user lain |
| GET | `/api/group-user` | List semua group |
| POST | `/api/group-user` | Buat group baru |
| PUT | `/api/group-user/{id}` | Update nama group (RESTful) |
| DELETE | `/api/group-user/{id}` | Hapus group |
| GET | `/api/anggota-group-user` | List anggota group (Pencarian teroptimasi) |
| POST | `/api/anggota-group-user` | Tambah anggota ke group |
| DELETE | `/api/anggota-group-user/{id}` | Hapus anggota dari group |
| POST | `/api/set-leader` | Set leader group |
| GET | `/api/copy-user-group/{id}` | Copy akses leader ke semua anggota group (Bulk) |

---

## Cara Menjalankan

### Prasyarat
- PHP >= 8.1
- Composer
- Node.js >= 18
- MySQL (koneksi ke server DB yang dikonfigurasi di `.env`)

### Backend Setup

```bash
cd BACKEND

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Jalankan migrasi database
php artisan migrate

# Jalankan server
php artisan serve
```

Backend berjalan di `http://localhost:8000`

### Frontend Setup

```bash
cd FRONTEND

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend berjalan di `http://localhost:5173`
