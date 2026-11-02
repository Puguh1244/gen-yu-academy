# Panduan staging Gen-Yu Academy

## Status saat penyerahan revisi

Supabase belum terhubung. Empat akun di bawah **belum dibuat**. Skrip setup dan pengujian tersedia, tetapi belum diuji terhadap layanan Supabase. Jangan menggunakan laporan tes lokal sebagai bukti keberhasilan login, Realtime, atau Storage API.

## Persiapan oleh pemilik proyek

1. Hubungkan Supabase melalui integrasi yang ditawarkan, lalu tentukan proyek staging kosong khusus tugas ini. Jangan gunakan proyek produksi.
2. Jalankan SQL `001_school.sql`, `002_word_requirements.sql`, lalu `003_revision_brief.sql` satu kali masing-masing di SQL Editor.
3. Salin `.env.example` menjadi `.env` dan isi URL serta publishable key. Masukkan server-only `SUPABASE_SECRET_KEY` hanya pada mesin setup/server Node, tidak dalam frontend atau laporan.
4. Isi `GENYU_ENV=staging` serta `GENYU_STAGING_PROJECT_REF` dengan referensi proyek yang sama dengan hostname URL. Jika diperlukan, tetapkan `GENYU_STAGING_CREDENTIALS_FILE` ke lokasi privat di luar repository.
5. Jalankan `npm ci`, `npm run setup:staging`, `npm run test:staging`, lalu `npm run build` dan `npm start`.

Skrip setup memeriksa penanda migrasi 003 serta target staging dan menolak target berisi siswa lama. Skrip ini tidak mereset database. Jika terputus, gunakan file manifest privat yang sama untuk melanjutkan; jika terjadi ketidakpastian pembuatan akun, periksa Auth sebelum mengulang agar tidak membuat akun ganda.

## Akun dan password

| Identitas uji          | Role database | Data contoh          |
| ---------------------- | ------------- | -------------------- |
| rahaya@genyuparent.id  | parent        | Alya, K2A            |
| nabila@genyuparent.id  | parent        | Nara, K2B            |
| rahayu@genyuteacher.id | teacher       | K2A                  |
| rahayu@genyuadmin.id   | admin         | Administrasi sekolah |

Password berbeda dihasilkan secara acak saat setup. Akun dibuat melalui admin API dengan email terkonfirmasi khusus staging; keamanan email produksi tidak diubah. Setelah sukses, `../genyu-private/PRIVATE_LOGIN_GUIDE.md` berisi panduan privat dengan password dan `staging-accounts.json` menyimpan manifest. Lokasi dapat diubah melalui environment. Jangan unggah folder tersebut ke Sites, ZIP publik, atau repository. Hak file privat dibatasi pada sistem yang mendukung permission Unix; pemilik Windows perlu membatasi ACL folder.

Role berasal dari tabel profiles. Domain email tidak menentukan kewenangan. Tidak ada tombol login Admin otomatis di portal sungguhan.

## Data contoh dan batasnya

Fixture mencakup lima kelas T1, PG1, PK1, K2A, K2B pada empat jenjang; dua anak; tiga profil guru editorial fiktif; kalender Januari–Juni 2027; jadwal hari kerja; tugas, pengumpulan, umpan balik, progres draft/terbit, pengumuman, percakapan, izin, admissions, album dan tagihan.

Kalender adalah rancangan simulasi. Hari libur sekolah/nasional belum disahkan dan tidak dihitung. Jadwal rutin disimpan pada setiap tanggal, dengan kalender portal memuat bulan yang dipilih. Nama, biaya, dan semua catatan bersifat fiktif. Berkas contoh memakai aset logo milik proyek dan ditandai demonstrasi, bukan bukti transfer atau foto siswa nyata.

## Pengujian nyata dan bukti

`npm run test:staging` menggunakan Auth, PostgREST, Storage, dan Realtime sungguhan. Hasil disimpan sebagai `reports/staging-results.json`, termasuk langkah/nama skenario, expected, actual, dan PASS/FAIL. Skrip melakukan mutasi hanya pada fixture staging dan menyisakan catatan QA fiktif. Bila login gagal, laporan parsial tetap ditulis. Penugasan guru dan status akun dikembalikan dalam blok finally pada skenario pencabutan akses.

Setelah tes API lulus, tetap wajib menguji browser untuk keempat akun: login, navigasi role, bahasa, kirim chat, tugas/umpan balik, progres, album/file, izin, invoice/verifikasi, CMS/admissions, logout, dan URL privat. Simpan screenshot tiap role dan penolakan akses, tanpa password atau token. Uji ponsel/laptop nyata; tes SQL saja tidak membuktikan layout mobile.

## Hosting

Build menghasilkan config publik berisi URL dan publishable key saja. Hosting Sites pada paket ini adalah statis. CRUD dengan RLS mengakses Supabase langsung setelah dikonfigurasi, tetapi endpoint undangan/status Auth di `server/admin-api.js` membutuhkan host Node dan server key. Gunakan server Node yang sama origin dengan frontend untuk fungsi tersebut. Pada Sites statis, fitur administrasi akun yang bergantung pada endpoint Node belum operasional.

## Retensi data uji

Pemilik proyek bertanggung jawab atas staging. Simpan backup database dan Storage secara privat sebelum presentasi dan perubahan besar; uji restore pada lingkungan terpisah. Tinjau dan hapus data uji paling lambat 30 hari setelah penilaian selesai, setelah pemilik memastikan tidak lagi dibutuhkan. Cabut akun/token uji, hapus objek Storage yang terkait, relasi database, lalu akun Auth melalui admin. Jangan menjalankan penghapusan otomatis pada produksi. Catat hasil pembersihan tanpa menyimpan password. Detail operasional umum tersedia di OPERATIONS.md.
