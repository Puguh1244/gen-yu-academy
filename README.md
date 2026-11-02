# Gen-Yu Academy

Website publik dan portal sekolah berbasis **JavaScript, Node.js, dan Supabase**, dengan tiga peran: **Admin**, **Teacher (Guru)**, dan **Parent (Orang Tua)**. Repository deployment: [Puguh1244/gen-yu-academy](https://github.com/Puguh1244/gen-yu-academy).

> **Status:** Proyek sudah diuji secara lokal untuk beberapa alur, tetapi jangan menganggap seluruh fitur produksi telah terverifikasi. Deployment Vercel dan akses lintas peran harus diuji kembali setelah setiap perubahan.

## 1. Fitur

| Peran | Fitur utama |
|---|---|
| **Admin** | Dashboard; Data Sekolah (kelas, siswa, keluarga dan relasi akun); Penerimaan; Konten Website; Pengumuman; Acara dan RSVP; Respons; Tagihan/Pembayaran; Pesan; Kalender; Absensi/Izin; Izin Foto; Activity Log; Pengaturan Akses; Notifikasi; Akun. |
| **Teacher** | Dashboard kelas; Kalender/Jadwal; Perkembangan Anak; Pesan; Absensi/Izin; Aktivitas Mingguan dan penilaian pengumpulan; Album Foto; Pengumuman; Acara; Usulan Konten Website; Izin Foto; Notifikasi; Akun. |
| **Parent** | Dashboard anak; Kalender; Pengumuman; RSVP Acara; Pesan; Izin Ketidakhadiran; Aktivitas Mingguan dan pengumpulan tugas; Perkembangan Anak; Album Foto; Tagihan serta unggah bukti pembayaran; Izin Foto; Notifikasi; Akun. |

Fitur yang terlihat **bukan jaminan akses database berhasil**. Hak akses bergantung pada Supabase Auth, relasi pengguna/kelas/anak, dan kebijakan RLS. Pengundangan akun melalui portal membutuhkan server API dan secret key yang hanya tersedia di server.

## 2. Persyaratan

- **Node.js 22.12+** (lebih baik gunakan versi LTS yang didukung oleh Vercel dan proyek; hindari rentang versi terbuka saat deploy produksi).
- npm, Git, VS Code atau editor lain.
- Proyek Supabase dengan URL, *publishable key*, dan migrasi database yang sesuai.
- GitHub untuk deployment Vercel.

Contoh berikut menggunakan **PowerShell Windows**. Jika `npm` terblokir oleh Execution Policy PowerShell, gunakan **`npm.cmd`** seperti di bawah; tidak perlu melonggarkan kebijakan keamanan sistem.

## 3. Struktur proyek

```text
Gen_Yu_Academy/
├── api/                         # Vercel Functions (jika patch Vercel sudah dipasang)
│   ├── health.js
│   └── admin/[action].js
├── public/                      # HTML, CSS, JS, aset website
│   ├── index.html               # Website publik
│   ├── portal.html              # Portal hasil build
│   ├── js/portal/               # Modul portal
│   ├── js/services/supabase.js  # Akses Supabase di browser
│   └── js/demo/                 # Konten/tampilan publik
├── server/                      # Server HTTP lokal dan API admin
├── scripts/                     # Skrip build dan verifikasi
├── supabase/
│   ├── migrations/              # 001, 002, 003
│   ├── 04_AKUN_ADMIN.sql
│   └── 05_AKUN_GURU_ORANG_TUA.sql
├── templates/portal.html        # Template portal sebelum bundling
├── tests/                       # Pengujian otomatis
├── .env.example                 # Contoh environment lokal
├── package.json
├── vercel.json                  # Konfigurasi Vercel (jika sudah dipasang)
└── README.md
```

`dist/` adalah keluaran build, **bukan tempat mengedit kode**. Skrip `build:portal` membuat ulang `public/portal.html` dari template dan modul portal, sedangkan `build` menyalin `public/` ke `dist/` sambil menghasilkan `dist/config.js`.

## 4. Instalasi dan menjalankan lokal

Di terminal VS Code:

```powershell
cd D:\via\Gen_Yu_Academy
npm.cmd ci
Copy-Item .env.example .env
```

Jika `.env` sudah ada, **jangan menimpanya**. Edit `.env` dengan nilai asli dari Supabase:

```dotenv
PORT=3000
HOST=127.0.0.1
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_ISI_DARI_SUPABASE
SUPABASE_SECRET_KEY=
APP_ORIGIN=http://127.0.0.1:3000
```

- `SUPABASE_PUBLISHABLE_KEY` boleh digunakan aplikasi browser; alternatifnya legacy `anon` key yang valid.
- `SUPABASE_SECRET_KEY` adalah **rahasia server**, hanya untuk fitur tertentu seperti undangan akun. Jangan pernah memasukkannya ke `public/`, `dist/`, Git, atau chat.
- `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` harus diisi bersama.
- Simpan `.env.example` sebagai template; `.env` memang harus dikecualikan dari Git.

Bangun portal, lalu jalankan server lokal:

```powershell
npm.cmd run build:portal
npm.cmd run build
npm.cmd start
```

Buka:

- Website publik: **http://127.0.0.1:3000/**
- Portal sekolah: **http://127.0.0.1:3000/portal.html**
- Status konfigurasi: **http://127.0.0.1:3000/api/health**

`/api/health` hanya memeriksa konfigurasi dasar; nilai `supabaseConfigured: true` **tidak membuktikan** database, Auth, RLS, atau Storage dapat diakses.

## 5. Setup database Supabase (hanya untuk proyek baru)

Jika database sekarang **sudah memiliki data dan akun aktif, jangan ulangi migrasi/SQL tanpa memeriksa dampaknya**.

Untuk proyek Supabase yang benar-benar baru, buka **Supabase Dashboard → SQL Editor**, lalu periksa dan jalankan migrasi secara berurutan:

1. `supabase/migrations/001_school.sql`
2. `supabase/migrations/002_word_requirements.sql`
3. `supabase/migrations/003_revision_brief.sql`

Selanjutnya buat pengguna melalui **Authentication → Users** dan gunakan contoh SQL yang sesuai untuk menghubungkan profil/peran:

- `supabase/04_AKUN_ADMIN.sql`
- `supabase/05_AKUN_GURU_ORANG_TUA.sql`

Tinjau dan sesuaikan email serta parameter dalam SQL **sebelum menjalankannya**. Peran pengguna ditentukan oleh data profil dan kebijakan akses, bukan hanya pilihan tab login. Admin perlu menghubungkan guru ke kelas dan orang tua ke anak agar data relevan terlihat.

## 6. Deploy ke Vercel (repository GitHub Puguh1244)

Repository target: **https://github.com/Puguh1244/gen-yu-academy** (branch `main`). Deploy dari source repo, bukan mengunggah `.env` atau `node_modules`.

### A. Pastikan file Vercel tersedia

```powershell
Test-Path vercel.json
Test-Path api\health.js
Test-Path -LiteralPath 'api\admin\[action].js'
```

Ketiganya seharusnya menghasilkan `True` jika patch sudah dipasang. `-LiteralPath` diperlukan karena `[action]` diperlakukan sebagai pola wildcard oleh PowerShell.

**Periksa impor Supabase:** pada `public/js/services/supabase.js`, gunakan:

```javascript
import { createClient } from "@supabase/supabase-js";
```

Jangan mengimpor dari `../../vendor/supabase.js` untuk build Vercel jika `public/vendor/` dikecualikan `.gitignore`. SDK sudah tercatat sebagai dependency dalam `package.json`.

**Periksa konten publik:** `.gitignore` proyek awal juga mengecualikan `public/js/demo/content-data.js`. Jika file ini dibutuhkan oleh kode website dan isinya aman dipublikasikan, pastikan file tersebut masuk ke repository (contohnya `git add -f public/js/demo/content-data.js`). Jangan menyertakan data privat siswa atau kredensial.

### B. Tes sebelum push

```powershell
npm.cmd ci
npm.cmd run build:portal
npm.cmd run build
npm.cmd test
```

Tes otomatis lokal tidak menggantikan tes terhadap Supabase cloud yang sebenarnya.

### C. Commit dan push ke GitHub Puguh

```powershell
git remote -v
git status
git add api vercel.json public/js/services/supabase.js README.md
git commit -m "Prepare Gen-Yu Academy Vercel deployment"
git push origin main
```

Jika `origin` bukan repository Puguh yang dimaksud, periksa kembali remote dan akses akun sebelum push. `nothing to commit` berarti tidak ada perubahan baru; bukan kesalahan.

### D. Import ke Vercel

1. Buka **https://vercel.com/new**.
2. Login dengan GitHub yang punya akses ke `Puguh1244/gen-yu-academy`.
3. **Import** repository, branch `main`.
4. Framework Preset: **Other**; Root Directory: `./`.
5. Pastikan konfigurasi `vercel.json` berlaku. Build: `npm run build:portal && npm run build`; Output: `dist`.
6. Atur variabel di **Project → Settings → Environment Variables** sesuai bagian berikut.
7. Deploy dan periksa Build Logs serta Functions Logs.

Contoh `vercel.json` untuk susunan proyek saat ini:

```json
{
  "framework": null,
  "buildCommand": "npm run build:portal && npm run build",
  "outputDirectory": "dist"
}
```

File `api/health.js` dan `api/admin/[action].js` adalah adaptasi Vercel Functions. Server Node lokal (`server/index.js`) **tidak berjalan terus-menerus** sebagai proses web di Vercel. Pastikan fungsi API bekerja melalui pengujian nyata; jangan berasumsi semua endpoint kompatibel hanya karena halaman statis berhasil terdeploy.

### E. Environment Variables Vercel

Setidaknya isi:

| Nama | Nilai | Keterangan |
|---|---|---|
| `SUPABASE_URL` | URL proyek Supabase | Dibutuhkan untuk build dan API |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key / anon key | Dibutuhkan untuk build dan API |
| `SUPABASE_SECRET_KEY` | Secret key server | Hanya jika menggunakan undangan/status akun dari API admin |
| `APP_ORIGIN` | `https://DOMAIN-ANDA.vercel.app` | Isi setelah mengetahui domain sebenarnya |
| `NODE_ENV` | `production` | Opsional sesuai lingkungan deployment |

Jangan salin placeholder contoh secara literal. Jangan menambahkan key server ke variabel frontend yang diekspos atau ke file publik. Setelah mengubah variabel, **deploy ulang** untuk menerapkan perubahan.

### F. Hubungkan domain ke Authentication Supabase

Setelah Vercel menghasilkan domain HTTPS yang benar:

1. Buka **Supabase → Authentication → URL Configuration**.
2. Set **Site URL** ke domain utama Vercel Anda.
3. Tambahkan Redirect URL untuk domain produksi sesuai rute callback yang benar (misalnya `https://DOMAIN-ANDA.vercel.app/**` saat pengujian, lalu persempit sesuai kebutuhan).
4. Pertahankan URL localhost yang diperlukan untuk pengembangan, bila dipakai.
5. Samakan `APP_ORIGIN` di Vercel dengan domain produksi dan deploy ulang.
6. Uji undangan akun dan reset kata sandi sampai selesai.

> **Penggunaan produksi:** Vercel Hobby memiliki ketentuan penggunaan. Untuk operasional sekolah sebenarnya, verifikasi kesesuaian paket, keamanan data anak, dan kebutuhan privasi sebelum peluncuran.

## 7. Pengujian end-to-end setelah online

Gunakan **data dummy**, bukan data siswa sungguhan, sampai otorisasi dan privasi benar-benar diuji:

- [ ] Website publik dan formulir Penerimaan dapat dibuka serta menyimpan data.
- [ ] Login Admin berhasil dan Admin dapat membuat kelas/siswa.
- [ ] Admin menghubungkan Teacher ke kelas dan Parent ke anak uji.
- [ ] Teacher hanya melihat kelas yang ditugaskan; jadwal dengan `ends_at > starts_at` berhasil tersimpan.
- [ ] Parent hanya melihat anaknya sendiri.
- [ ] Tugas mingguan, laporan perkembangan, izin absensi, dan chat dapat disimpan/dibaca sesuai peran.
- [ ] Upload gambar/dokumen mengikuti batas ukuran dan MIME pada Storage bucket.
- [ ] Pengumuman, RSVP, tagihan, unggah bukti pembayaran, serta verifikasi berjalan.
- [ ] Undangan akun melalui API Admin berhasil; email redirect menuju domain yang benar.
- [ ] Akses akun Parent A terhadap data anak Parent B **ditolak** oleh RLS.
- [ ] Halaman `/api/health` dan endpoint API Admin merespons secara benar.

## 8. Troubleshooting

| Gejala | Penyebab/penanganan |
|---|---|
| `npm.ps1 ... running scripts is disabled` | Gunakan `npm.cmd ci`, `npm.cmd run build`, dan sebagainya di PowerShell. |
| `ERR_MODULE_NOT_FOUND: @supabase/supabase-js` | Instal dependensi: `npm.cmd ci`; pastikan berada di folder dengan `package.json`. |
| `Could not resolve ../../vendor/supabase.js` | Gunakan impor dari package `@supabase/supabase-js`, instal dependensi, build ulang, dan push ke GitHub. |
| `new row for relation class_schedule violates check constraint` | Pastikan `ends_at` benar-benar setelah `starts_at`, termasuk tanggal dan zona waktu. Validasi form sebelum insert. |
| Penerimaan kosong | Kirim formulir dari website publik lalu lihat tabel `admission_enquiries`; periksa RLS bila record ada tetapi tidak tampil. |
| Login berhasil tetapi data kosong | Periksa relasi profil, siswa, wali, guru, kelas serta RLS; tidak selalu berarti bug. |
| Upload ditolak | Cocokkan ukuran dan jenis file di frontend dengan batas `learning-files` pada Supabase Storage. |
| Undangan akun gagal online | Periksa secret key server, otorisasi admin pada API, URL redirect, dan logs Vercel. |
| GitHub `403 denied to ...` | Git masih login dengan akun yang tidak punya akses push; autentikasi ulang menggunakan akun berizin. |
| `Test-Path 'api\admin\[action].js'` menghasilkan `False` | Gunakan `Test-Path -LiteralPath 'api\admin\[action].js'`. |
| Vercel build berhasil tetapi portal rusak | Periksa browser console, keberadaan konten yang dikecualikan `.gitignore`, file `dist/config.js`, dan Functions Logs. |

## 9. Keamanan dan pemeliharaan

- Jangan commit `.env`, secret key, token, atau data pribadi siswa.
- Terapkan dan **uji** Supabase RLS pada semua tabel yang menyimpan data sekolah.
- Bedakan akun Supabase Auth, `profiles`, relasi siswa-keluarga, dan penugasan kelas.
- Jangan menghapus `CHECK`, foreign key, atau kebijakan keamanan hanya untuk menghilangkan error input.
- Buat backup sebelum migrasi SQL atau mengubah kebijakan akses pada database yang sudah berisi data.
- Setelah mengedit modul portal, jalankan `build:portal` lalu `build`; setelah perubahan push, tinjau deploy terbaru.
- Gunakan satu sumber deployment yang disepakati: **repository `Puguh1244/gen-yu-academy`**.

---

**Catatan dokumentasi:** README ini disusun berdasarkan arsip proyek Gen-Yu Academy yang tersedia dan riwayat troubleshooting deployment. Jika branch GitHub terbaru mengandung perubahan lain, cek kesesuaian skrip, rute, migrasi, dan nama environment variable sebelum melakukan deploy produksi.
