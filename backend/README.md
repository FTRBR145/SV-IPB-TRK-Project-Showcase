# Backend Showcase Projek TRK

REST API untuk landing showcase, portal mahasiswa, dan dashboard admin. Penyimpanan default memakai **Supabase/PostgreSQL** melalui pool koneksi `pg`. Data, pengajuan, pengaturan, moderator, dan log aktivitas bertahan setelah restart. Login JWT tetap ditangani Express dan disimpan dalam cookie HttpOnly; aplikasi ini tidak memakai Supabase Auth.

## Menjalankan backend

```bash
cd backend
npm install
copy .env.example .env
npm run db:seed
npm run dev
```

Sebelum menjalankan `db:seed`, terapkan migrasi `supabase/migrations/20260915025603_showcase_persistence.sql` melalui Supabase SQL Editor / migration tooling ke database kosong, lalu atur password acak yang kuat untuk role `showcase_backend`. Migrasi membuat delapan tabel dalam skema privat `showcase`, mengaktifkan RLS, dan hanya memberi akses ke role backend.

Isi `backend/.env` (file ini diabaikan Git):

```dotenv
REPOSITORY=postgres
DATABASE_URL=postgresql://showcase_backend:PASSWORD@HOST:5432/postgres
DATABASE_CA_FILE=certs/supabase-ca.crt
```

Gunakan hostname dari Supabase **Connect**. Koneksi langsung membutuhkan IPv6; pada jaringan IPv4 gunakan Session pooler dan format user `showcase_backend.PROJECT_REF` dari pengaturan koneksi. Jangan menebak hostname pooler. Sertifikat publik `certs/supabase-ca.crt` berasal dari `https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`; verifikasi TLS tetap aktif. Path CA relatif terhadap folder `backend`. Kredensial database hanya digunakan server, tidak pernah menjadi variabel `VITE_*`.

`db:seed` hanya berjalan pada database yang belum diinisialisasi. Menjalankannya lagi tidak menimpa data. Ubah kredensial akun awal sebelum seed jika digunakan di luar demo. Server tidak melakukan seed/reset otomatis dan berhenti dengan error jika koneksi atau skema belum siap. Endpoint reset demo ditolak pada repository Postgres.

Untuk deployment beberapa instance, tiap proses menggunakan pool maksimal 5 koneksi. Persetujuan mengunci baris pengajuan dan mengubah projek, status, serta log dalam satu transaksi. ID memakai identity sequence, sehingga tidak dipakai ulang setelah penghapusan. Skema menyimpan atribut konten sebagai JSONB per entitas, dengan primary key, indeks identitas/filter, dan foreign key publikasi.

Mode lama tersedia hanya dengan `REPOSITORY=memory` untuk demo lokal; dilarang saat `NODE_ENV=production`. Mode ini tidak menyimpan data permanen.

API tersedia di `http://localhost:3000/api` dan health check di `GET /api/health`.

## Akun demo

| Peran | Email | Password |
|---|---|---|
| Admin | `admin.trk@apps.ipb.ac.id` | `AdminTRK123!` |
| Mahasiswa | `nabila.putri@apps.ipb.ac.id` | `MahasiswaTRK123!` |

Ubah semua kredensial dan `JWT_SECRET` melalui `.env` sebelum deployment.

## Endpoint utama

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| `GET` | `/api/health` | Publik | Status server |
| `POST` | `/api/auth/login` | Publik | Membuat sesi cookie HttpOnly memakai email, NIM, atau NIP |
| `POST` | `/api/auth/logout` | Login/Publik | Menghapus cookie sesi, termasuk cookie kedaluwarsa/tidak valid |
| `GET` | `/api/auth/me` | Login | Profil pengguna aktif |
| `GET` | `/api/projects` | Publik | Daftar, pencarian, filter, pagination projek |
| `GET` | `/api/projects/:id` | Publik | Detail projek |
| `POST` | `/api/projects` | Mahasiswa/Admin | Upload projek atau kirim ke moderasi |
| `PATCH` | `/api/projects/:id` | Admin | Edit projek |
| `DELETE` | `/api/projects/:id` | Admin | Hapus projek |
| `GET` | `/api/submissions/mine` | Mahasiswa | Riwayat pengajuan sendiri |
| `GET` | `/api/submissions` | Admin | Antrean dan histori moderasi |
| `POST` | `/api/submissions/:id/approve` | Admin | Setujui dan publikasikan |
| `POST` | `/api/submissions/:id/reject` | Admin | Tolak pengajuan |
| `POST` | `/api/submissions/:id/restore` | Admin | Kembalikan ke antrean |
| `GET/POST/DELETE` | `/api/courses` | Publik/Admin | Data mata kuliah |
| `GET/POST/PATCH/DELETE` | `/api/moderators` | Admin | Kelola moderator |
| `GET/PATCH` | `/api/settings` | Admin | Pengaturan sistem |
| `GET/DELETE` | `/api/activity-logs` | Admin | Log aktivitas |
| `POST` | `/api/system/reset` | Admin | Reset seed pada mode memory saja; Postgres menolak |

Browser harus mengirim request dengan kredensial agar cookie sesi ikut terkirim. Cookie memakai `HttpOnly`, `SameSite=Lax`, `Secure` di production, dan tidak pernah dikembalikan di body respons login. `AUTH_COOKIE_MAX_AGE_MS` sebaiknya disamakan dengan `JWT_EXPIRES_IN`.

Percobaan login gagal dibatasi per kombinasi alamat IP/akun dan per alamat IP. Batas dalam proses mencegah brute force dasar; deployment multi-instance sebaiknya menambahkan kebijakan global yang sama di Vercel Firewall.

## Format respons

Berhasil:

```json
{
  "success": true,
  "data": {}
}
```

Gagal:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim belum valid.",
    "details": []
  }
}
```

## Pengujian

```bash
npm test
```

Tes backend menjalankan migrasi yang sama pada mesin PostgreSQL PGlite dengan database sementara, bukan database Supabase Anda. Cakupannya: login, 401/403, validasi, unggah, privasi pengajuan, persetujuan ganda, reject/restore, edit/hapus, pagination >100, rollback, RLS, dan buka ulang database. Untuk multi-instance, uji tambahan pada Supabase menguji dua koneksi terpisah sebelum deployment.

Database tes disimpan di `.test-data/` pada root proyek (diabaikan Git), sehingga tidak memerlukan akses ke direktori Temp Windows. Setiap proses membuat subdirektori unik dan menghapusnya setelah database ditutup; direktori induk tetap ada. `TEST_DATA_DIR` dapat mengganti lokasi ini. Path relatif selalu dihitung dari root proyek, termasuk saat menjalankan `npm --prefix backend test`. Gunakan subdirektori `.test-data/` agar data tetap diabaikan Git; lokasi lain perlu aturan Git ignore sendiri.

Jalankan kedua suite dari root proyek di PowerShell:

```powershell
node --test tests/*.test.js
npm --prefix backend test

# Opsional: lokasi lain yang writable di dalam proyek
$env:TEST_DATA_DIR = '.test-data/windows'
npm --prefix backend test
Remove-Item Env:TEST_DATA_DIR
```

Suite backend juga memvalidasi preview/impor 120 mahasiswa, penolakan duplikat, batch invalid tanpa penyimpanan parsial, serta login akun hasil impor.

Frontend mengambil setiap halaman `/projects?page=N&limit=100` menggunakan metadata pagination untuk menjaga filter dan statistik lokal tetap lengkap. Detail publik diambil dari `/projects/:id`, sedangkan pratinjau pengajuan sendiri memakai parameter URL `submission` agar ID-nya tidak bentrok dengan ID projek publik.

## Manajemen akun mahasiswa

Menu Mahasiswa membaca akun berperan student dari `showcase.users`, termasuk akun yang belum memiliki projek. Admin dapat menambahkan satu akun atau mengimpor Excel/CSV melalui frontend. Format dokumen: `nama,nim,email,semester,angkatan`; kolom NIM harus berupa teks. Batas 500 mahasiswa dan 5 MB per dokumen; Excel menggunakan lembar pertama dan tidak menerima rumus.

- `GET /api/students`: direktori mahasiswa (admin saja, tanpa hash/password).
- `POST /api/students/preview`: validasi `{ students: [...] }` tanpa menyimpan.
- `POST /api/students`: validasi ulang dan pembuatan akun dalam satu transaksi.

NIM/email duplikat (termasuk akun admin) ditolak tanpa menimpa akun lama. Preview bukan reservasi: repository memeriksa kembali identitas di dalam transaksi untuk menangani impor bersamaan. Setiap akun mendapat password acak, disimpan sebagai hash bcrypt; respons pembuatan berisi kredensial satu kali dan memakai Cache-Control no-store. Admin dapat mengunduh kredensial CSV pada layar hasil dan membagikannya sendiri. Aplikasi tidak mengirim email otomatis. File sumber diproses di browser, lalu hanya kolom mahasiswa yang dikirim ke backend.
