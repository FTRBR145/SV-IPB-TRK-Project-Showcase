# Student Project Showcase - TRK Sekolah Vokasi IPB 🎓📹

![Vite](https://img.shields.io/badge/Vite-8.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![IPB University](https://img.shields.io/badge/IPB_University-Sekolah_Vokasi-003366?style=for-the-badge)

Platform web **Showcase Video Projek Praktikum dan Tugas Akhir Mahasiswa Program Studi Teknologi Rekayasa Komputer (TRK) Sekolah Vokasi IPB University**. Aplikasi ini dirancang sebagai ruang digital terpusat untuk memamerkan inovasi sistem IoT, mikrokontroler, jaringan komputer, dan sistem tertanam, sekaligus menyediakan alur moderasi karya yang terkelola antara mahasiswa, dosen, dan publik.

---

## 📌 Fitur Utama

### 1. 🏠 Landing Page Publik
- **Hero Banner & Slideshow**: Transisi foto kegiatan mahasiswa TRK dengan indikator durasi, kontrol *Play/Pause*, efek parallax halus, dan floating badge institusi.
- **Dynamic Stats Counter Bar**: Indikator capaian (*Total Projek, Mahasiswa, Mata Kuliah, Dosen*) yang dihitung dinamis dari data dan memiliki animasi *count-up* saat digulir ke viewport.
- **Katalog & Filter Projek Interaktif**:
  - Filter tab cepat **Semester 1 hingga Semester 8** dan **Semua Semester**.
  - Filter kategori mata kuliah unggulan TRK (IoT, Sistem Tertanam, Aplikasi Mobile, Bengkel Elektromekanik, Rangkaian Logika Digital).
  - Kolom pencarian real-time (berdasarkan judul, nama mahasiswa/NIM, mata kuliah, dan teknologi).
- **Modal Pemutar Video & Detail Projek**:
  - Pemutar video YouTube responsif terintegrasi.
  - Rincian metadata lengkap (nama mahasiswa, NIM, dosen pembimbing, tanggal/tahun, deskripsi, dan *tech stack pills*).
- **Footer Kampus Lengkap**: 4 kolom informasi profil TRK, navigasi cepat, 5 fokus keahlian, alamat detail Kampus IPB Bogor & Sukabumi, serta kontak resmi.

### 2. 🎓 Portal Mahasiswa (`/student` & `/student/upload`)
- **Layout App-Shell Khusus**: Sidebar navigasi kategori mata kuliah, pemisahan tab *"Semua Projek"* dan *"Projek Saya"*.
- **Formulir Pengunggahan Projek**:
  - Input judul, mata kuliah, semester, dosen pembimbing, deskripsi, dan tag teknologi.
  - Validasi URL video YouTube dengan *live video embed preview* otomatis.
  - Alur moderasi transparan: pengajuan langsung masuk ke antrean moderasi admin sebelum diterbitkan.
- **Compact Portal Footer**: Footer 1 baris yang rapi di bagian bawah scroll container agar tidak memakan area kerja.

### 3. 🛡️ Dashboard Admin & Dosen (`/admin`)
- **Antrean Moderasi Pengajuan**: Meninjau pengajuan karya mahasiswa dengan opsi **Setujui (Approve)** atau **Tolak (Reject)** disertai catatan revisi.
- **Manajemen Data Projek & Civitas**: Kelola projek terpublikasi, direktori mahasiswa, akun moderator/dosen, katalog mata kuliah, dan kategori sistem.
- **Audit Log & Pengaturan Sistem**: Riwayat log aktivitas operasional dan kontrol pengaturan publik/mode pemeliharaan.
- **DataTables Integration**: Fitur pencarian instan, sorting multi-kolom, dan pagination tabel data admin.

### 4. ✨ Desain, Mikro-animasi & Aksesibilitas
- **Scroll-Reveal Animations**: Elemen heading dan konten muncul bertahap (*fade-up*, *underline reveal*, *staggered entrance*) saat digulir.
- **Card Micro-interactions**: Efek interaktif **3D Tilt Perspective** dan kilau cahaya (**Shimmer Border Sweep**) saat kursor diarahkan ke kartu projek.
- **Aksesibilitas (a11y)**: Mendukung navigasi keyboard, modal focus trap, skip-to-content link, serta sepenuhnya menghormati preferensi OS **`prefers-reduced-motion`**.

---

## 🛠️ Arsitektur & Teknologi

### Frontend
- **Framework**: React 19 + Vite 8
- **Routing**: React Router v7 (dengan `ProtectedRoute` berbasis peran)
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens
- **Icons**: Lucide React
- **Table Component**: DataTables.net React

### Backend (REST API)
- **Runtime**: Node.js 20+
- **Server Framework**: Express.js
- **Autentikasi**: JSON Web Token (JWT) & bcrypt hashing
- **Arsitektur Data**: Supabase/PostgreSQL melalui repository async, transaksi moderasi, dan skema privat dengan RLS

---

## 📁 Struktur Direktori

```text
SV-IPB-HW-PKL-Project-Showcase/
├── backend/                        # Backend REST API (Express.js)
│   ├── src/
│   │   ├── config/                 # Konfigurasi environment & konstanta
│   │   ├── data/                   # Initial seed data (projek, users, courses)
│   │   ├── middleware/             # Auth JWT & Role authorization guard
│   │   ├── repositories/           # Data layer (Repository pattern)
│   │   ├── routes/                 # API Route handlers (/projects, /auth, /submissions, dll)
│   │   ├── schemas/                # Skema validasi input (422 response)
│   │   ├── app.js                  # Express app setup & CORS
│   │   └── server.js               # Server entry point (Port 3000)
│   ├── test/                       # Backend automated unit tests
│   └── package.json
├── public/                         # Aset publik statis (Logo SV IPB, foto kegiatan TRK)
├── src/                            # Frontend Source Code (React 19)
│   ├── components/
│   │   ├── admin/                  # Komponen panel dashboard admin
│   │   ├── auth/                   # ProtectedRoute role guard
│   │   ├── common/                 # Navbar, Footer, ModalShell, Toast, ErrorBoundary
│   │   ├── landing/                # HeroSection, AboutSection, StatsBar, MataKuliah, Showcase
│   │   ├── modals/                 # LoginModal, ProjectDetailModal, UploadModal
│   │   ├── projects/               # ProjectCard, ProjectForm
│   │   └── student/                # StudentSidebar
│   ├── context/                    # AppContext (Global State & API Synchronization)
│   ├── data/                       # Fallback demo datasets
│   ├── hooks/                      # useApp, useProjectDetail
│   ├── pages/                      # LandingPage, StudentHome, UploadProjectPage, AdminDashboard
│   ├── App.jsx                     # Route definitions & layout wrappers
│   ├── index.css                   # Tailwind v4 directives & keyframe animations
│   └── main.jsx                    # React root entry point
├── tests/                          # Frontend & integration tests
├── index.html                      # HTML root template & SEO meta tags
├── vite.config.js                  # Vite configuration & backend proxy
├── package.json                    # Root package configuration
└── README.md                       # Dokumentasi utama proyek
```

---

## 💻 Panduan Instalasi & Menjalankan

### 1. Prasyarat
- [Node.js](https://nodejs.org/) versi **>= 20.0.0**
- Git

### 2. Kloning Repositori
```bash
git clone https://github.com/FTRBR145/SV-IPB-HW-PKL-Project-Showcase.git
cd SV-IPB-HW-PKL-Project-Showcase
```

### 3. Instalasi Dependensi
```bash
# Install dependensi frontend (root)
npm install

# Install dependensi backend
npm --prefix backend install
```

### 4. Konfigurasi Environment
Salin template konfigurasi environment:
```bash
# Frontend
copy .env.example .env

# Backend
copy backend\.env.example backend\.env
```

Konfigurasikan `DATABASE_URL` dan `DATABASE_CA_FILE`, terapkan migrasi Supabase, lalu jalankan `npm --prefix backend run db:seed`. Lihat [panduan database backend](backend/README.md). Seed tidak menimpa database yang sudah berisi data.

### 5. Menjalankan Fullstack (Frontend + Backend)
Jalankan kedua service secara bersamaan menggunakan script:
```bash
npm run dev:full
```
- **Frontend**: `http://localhost:5173/`
- **Backend API**: `http://localhost:3000/api` (diproyeksikan otomatis via Vite proxy)

*(Atau jalankan terpisah via `npm run dev:frontend` dan `npm run dev:backend`)*.

---

## 🔑 Akun Demo Pengujian

| Peran | Identitas (Email / NIM / NIP) | Password | Hak Akses |
|---|---|---|---|
| **Admin / Dosen** | `admin.trk@apps.ipb.ac.id` / `198503152010121002` | `AdminTRK123!` | Akses penuh dashboard `/admin`, moderasi karya, kelola sistem |
| **Mahasiswa** | `nabila.putri@apps.ipb.ac.id` / `J0304211015` | `MahasiswaTRK123!` | Akses portal `/student`, upload projek `/student/upload` |

---

## 🧪 Pengujian & Kualitas Kode

```bash
# Menjalankan seluruh unit test (Frontend + API Integration)
npm test

# Menjalankan unit test backend secara spesifik
npm --prefix backend test

# Menjalankan linting (Oxlint)
npm run lint

# Build bundle produksi
npm run build
```

---

## 📄 Lisensi & Kredit

Dikembangkan untuk memenuhi tugas Praktik Kerja Lapangan (PKL) pada **Program Studi Teknologi Rekayasa Komputer (TRK), Sekolah Vokasi IPB University**.

© 2026 Sekolah Vokasi IPB University.
