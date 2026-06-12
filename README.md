# SIMRS User Setting

Aplikasi manajemen hak akses user untuk sistem SIMRS (Sistem Informasi Manajemen Rumah Sakit). Dibangun dengan **Laravel 10** (Backend) dan **React 18 + TypeScript** (Frontend).

---

## Fitur

### 👤 Manajemen Pegawai
- List semua pegawai dengan fitur pencarian by nama / NIK
- Edit username dan password user (terenkripsi AES di database)
- Toggle hak akses per kolom (true/false) untuk setiap user

### 🔍 Bandingkan Akses
- Pilih dua pegawai (User A dan User B) secara bersamaan
- Tampilkan perbandingan hak akses side-by-side dalam satu tabel
- Perbedaan akses di-highlight otomatis (warna kuning)
- Copy hak akses User A → User B atau sebaliknya (tanpa group)

### 👥 Group User
- CRUD group user (tambah, lihat, hapus)
- Tambah / hapus anggota ke dalam group
- Set leader untuk setiap group
- Sesuaikan akses — copy hak akses leader ke semua anggota group sekaligus

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Laravel 10, PHP 8.1, MySQL |
| Frontend | React 18, TypeScript, Vite |
| UI | Flowbite React, Tailwind CSS |
| State | Zustand |
| HTTP | Axios |
| Auth | Laravel Sanctum (tersedia, belum aktif) |

---

## Struktur Project

```
├── BACKEND/          # Laravel 10 REST API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── PegawaiController.php       # Pegawai, detail user, edit akses, copy akses
│   │   │   ├── GroupUserController.php     # CRUD group + copy akses group
│   │   │   └── AnggotaControllerController.php  # Manajemen anggota group
│   │   └── Models/
│   │       ├── GroupUser.php
│   │       └── UserToGroupUser.php
│   ├── routes/api.php                      # Semua API routes
│   └── database/migrations/               # Migrasi tabel group_users & user_to_group_users
│
└── FRONTEND/         # React + TypeScript
    └── src/
        ├── components/
        │   ├── PegawaiComponent.tsx        # List pegawai + halaman bandingkan akses
        │   ├── DetailUserComponent.tsx     # Edit username, password & toggle akses
        │   ├── GroupUserComponent.tsx      # CRUD group user
        │   ├── TambahAnggota.tsx           # Manajemen anggota group
        │   └── RootComponent.tsx          # Layout + sidebar
        ├── store/                          # Zustand state management
        ├── utils/                          # Axios service layer
        └── interface/                      # TypeScript interfaces
```

---

## API Endpoints

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/pegawai` | List semua pegawai |
| GET | `/api/detail-user/{nik}` | Detail + akses user by NIK |
| POST | `/api/ganti-akses-user/{nik}` | Toggle satu kolom akses |
| POST | `/api/edit-username-password/{nik}` | Edit username & password |
| POST | `/api/copy-akses` | Copy akses 1 user ke user lain |
| GET | `/api/group-user` | List semua group |
| POST | `/api/group-user` | Buat group baru |
| PATCH | `/api/group-user` | Update group |
| DELETE | `/api/group-user/{id}` | Hapus group |
| GET | `/api/anggota-group-user` | List anggota group |
| POST | `/api/anggota-group-user` | Tambah anggota ke group |
| DELETE | `/api/anggota-group-user/{id}` | Hapus anggota dari group |
| POST | `/api/set-leader` | Set leader group |
| GET | `/api/copy-user-group/{id}` | Copy akses leader ke semua anggota group |

---

## Cara Menjalankan

### Prasyarat
- PHP >= 8.1
- Composer
- Node.js >= 18
- MySQL (koneksi ke server DB yang dikonfigurasi di `.env`)

### Backend

```bash
cd BACKEND

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Isi konfigurasi database di .env
# DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD

# Generate app key
php artisan key:generate

# Jalankan migrasi
php artisan migrate

# Jalankan server
php artisan serve
```

Backend berjalan di `http://localhost:8000`

### Frontend

```bash
cd FRONTEND

# Install dependencies
npm install

# Sesuaikan URL API di .env
# VITE_API_URL=http://127.0.0.1:8000

# Jalankan development server
npm run dev
```

Frontend berjalan di `http://localhost:5173`

---

## Catatan Database

- Tabel `pegawai` dan `user` sudah ada di database SIMRS existing — **tidak ada migrasi untuk keduanya**
- Kolom `id_user` dan `password` di tabel `user` dienkripsi menggunakan **MySQL AES_ENCRYPT/AES_DECRYPT**
- NIK pegawai digunakan sebagai identifier tetap — username (`id_user`) bisa diubah tanpa mempengaruhi relasi data

---

## Keamanan

> ⚠️ File `.env` tidak ikut di-commit. Salin dari `.env.example` dan isi konfigurasi database sesuai environment masing-masing.
