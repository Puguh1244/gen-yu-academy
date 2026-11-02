# Gen-Yu Academy — Paket Supabase

Mulai dengan membuka **PANDUAN_SUPABASE.html**. Panduan dapat dibuka langsung di Chrome dan dapat membuat file `.env` dari Project URL dan Publishable Key Anda.

## Cara cepat

1. Ekstrak ZIP. Pasang Node.js 22.12 atau lebih baru.
2. Buat proyek Supabase kosong.
3. Jalankan tiga SQL di `supabase/migrations/`, berurutan 001 → 002 → 003.
4. Buat akun Auth, edit email pada `supabase/04_AKUN_ADMIN.sql`, lalu jalankan.
5. Buat `.env` melalui panduan dan taruh di samping `package.json`.
6. Klik `MULAI_WINDOWS.bat`; buka `http://127.0.0.1:3000`.
7. Klik Portal Login dan masuk dengan akun yang sudah dibuat.

Alternatif terminal:

```sh
node --env-file-if-exists=.env scripts/build.mjs
node --env-file-if-exists=.env server/index.js
```

SDK browser disertakan. `npm ci` tidak diperlukan untuk menjalankan website, tetapi diperlukan untuk menjalankan seluruh tes dan skrip staging.

## HTML dan aset

- `public/index.html`: halaman publik terbaru, termasuk principal Octavia, tiga guru chibi, teks EN/ID, fasilitas, galeri dan perbaikan kontras.
- `public/portal.html`: login dan portal sungguhan, memerlukan Supabase.
- `public/css/`, `public/js/`, `public/assets/`: kode dan gambar terpisah.
- `public/config.js`: konfigurasi kosong; saat server Node berjalan, `/config.js` berasal dari `.env`.
- `server/`: server Node.js dan endpoint admin opsional.
- `supabase/`: migrasi database dan template profil akun.
- `dist/`: hasil build siap diunggah ke hosting statis. Jangan edit langsung; edit `public/` lalu build.
- `docs/`: pemasangan lanjutan, pembatasan akses dan skenario uji.

Tampilan portal dapat dibuka langsung, termasuk tiga pilihan Orang Tua, Guru, dan Admin. Untuk login sungguhan gunakan server lokal atau hosting HTTPS dengan konfigurasi Supabase. Peran akun diperiksa sebelum dashboard dibuka; memilih kartu Admin tidak menaikkan hak akses. File index memerlukan folder pendampingnya, jadi ekstrak seluruh ZIP.

Untuk mengubah tampilan/kode portal: edit `templates/portal.html`, `public/js/portal/`, atau CSS, lalu jalankan `npm ci`, `npm run build:portal`, dan `npm run build`. HTML portal hasil build sudah menyertakan logo, CSS, dan JavaScript.

## Status

Paket belum terhubung ke proyek Supabase Anda dan tidak berisi akun/password bawaan. Demo di `index.html#portal` memakai data fiktif sementara, terpisah dari portal akun. Formulir admissions tersimpan di database setelah konfigurasi dan migrasi tersedia. Empat profil pendidik yang sudah Anda susun tetap tampil ketika database baru masih kosong.

Footer diselaraskan dengan kontak yang sudah ada pada halaman Contact; validitas alamat dan nomor belum diverifikasi secara eksternal. Fitur undangan akun dari portal memerlukan server key pada Node saja; gunakan Dashboard Supabase untuk pembuatan akun jika tidak mengaktifkan opsi itu.

Untuk publikasi: unggah isi `dist/` ke hosting HTTPS setelah build memakai `.env`, atau gunakan hosting Node.js. URL localhost bukan URL publik. Paket ini tidak mengubah website online yang sebelumnya diterbitkan.

## Pengujian

`npm ci` lalu `npm test` untuk tes lokal. Tes database memakai PGlite dengan simulasi schema Auth/Storage; bukan pengujian Supabase Auth, Storage API, dan Realtime pada layanan sungguhan. Lihat `docs/REVISION_STATUS.md` untuk hasil aktual paket ini.
