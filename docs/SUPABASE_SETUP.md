# Menghubungkan Supabase

## 1. Proyek dan migrasi

Buat proyek Supabase untuk sekolah. Gunakan proyek kosong/staging untuk pemasangan pertama. Buka SQL Editor dan jalankan seluruh `supabase/migrations/001_school.sql` sekali, lalu `supabase/migrations/002_word_requirements.sql` sekali, lalu `supabase/migrations/003_revision_brief.sql` sekali, secara berurutan. Pada instalasi lama, jalankan hanya migrasi yang belum diterapkan. Migrasi membungkus perubahan dalam transaksi; jangan memotong sebagian skrip. Jika sudah memiliki tabel dengan nama yang sama, tinjau konflik sebelum menjalankannya. Tidak ada migrasi destruktif/reset database pada paket ini.

Migrasi menyediakan empat bucket privat: **learning-files** (25 MB: JPG/PNG/PDF/MP4/WebM), **payment-receipts** dan **chat-files** (10 MB: JPG/PNG/PDF), serta **school-media** (10 MB: JPG/PNG). Media publik hanya dapat diakses jika merujuk konten terbit yang telah diverifikasi/izin foto diperiksa. Periksa pengaturan bucket yang sudah ada: bucket harus tetap privat.

Migrasi 002 mengarantina akses chat pribadi lama sampai peserta eksplisit diperiksa pengelola. Arsip tidak dihapus dan peserta tidak diisi otomatis. RSVP versi lama tetap tersimpan di tabel lama sebagai arsip read-only; respons baru memakai tabel per anak/keluarga.

Pastikan tabel `public.messages` terdaftar pada publication `supabase_realtime`. Skrip menambahkannya jika publication sudah tersedia, tanpa menghapus publication yang ada. Aktifkan replication tabel itu melalui Dashboard bila diperlukan.

## 2. Konfigurasi lokal

Isi `.env`:

```dotenv
PORT=3000
HOST=127.0.0.1
SUPABASE_URL=https://PROJECT_REFERENCE.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_WITH_YOUR_PUBLIC_KEY
```

Gunakan **publishable key**, atau legacy **anon** key. Jangan isi variabel `SUPABASE_PUBLISHABLE_KEY` dengan secret key, service_role, database password, atau JWT signing secret. Build memvalidasi tipe key dan menolak secret/service-role. `.env` diabaikan Git; ZIP tidak berisi `.env`.

Jalankan `npm run build`, lalu `npm start`. Build menyisipkan URL dan publishable key ke `dist/config.js` untuk static hosting. Node membaca `.env` dan menyajikan `config.js` secara dinamis. Ubah keduanya melalui sumber konfigurasi yang benar ketika mengganti lingkungan.

## 3. Akun yang diverifikasi sekolah

- Atur metode email/password di Supabase Auth; nonaktifkan pendaftaran terbuka jika akun hanya dibuat oleh sekolah.
- Buat akun uji untuk admin, guru, dan dua keluarga yang berbeda melalui Dashboard. Gunakan kata sandi uji yang unik, bukan data keluarga nyata.
- Salin UUID akun dari Auth. Gunakan template `supabase/bootstrap.example.sql` untuk membuat baris profil dengan role yang tepat.
- Login admin melalui `/portal.html`. Buat kelas dan murid contoh di **School Records**; hubungkan guru ke kelas dan orang tua ke murid.
- Logout dan uji setiap role secara terpisah.

Paket tidak menyediakan publik signup atau pilihan role di layar login. Role diberikan sekolah saat pembuatan profil/undangan. Akun admin pertama tetap dibuat melalui Dashboard dan bootstrap.

Opsional pada host Node: isi `SUPABASE_SECRET_KEY` dengan server key Supabase pada environment server saja, dan `APP_ORIGIN=https://DOMAIN_SEKOLAH`. Jangan memasukkannya ke frontend/build publik. Admin kemudian dapat mengundang dan mengaktifkan/nonaktifkan akun di School Records. Atur Site URL/Redirect URLs agar mencakup `APP_ORIGIN/portal.html`, dan SMTP pengiriman Auth. Penerima undangan membuka tautan lalu menetapkan kata sandi di Account. Uji alur ini pada staging. Static hosting Sites tidak menjalankan endpoint Node; gunakan Dashboard untuk pengelolaan akun bila hanya memakai static hosting.

Pemulihan password oleh sekolah dilakukan lewat Dashboard setelah verifikasi identitas. Belum ada formulir reset-password mandiri di halaman login.

## 4. RLS dan izin

| Data                      | Orang tua              | Guru                                      | Admin sekolah    |
| ------------------------- | ---------------------- | ----------------------------------------- | ---------------- |
| Identitas murid           | Anak terkait           | Kelas diampu                              | Data pendaftaran |
| Progres & tugas           | Anak sendiri           | Pembelajaran kelas                        | Tidak diberikan  |
| Chat kelas                | Kelas anak             | Kelas diampu                              | Tidak diberikan  |
| Chat pribadi pembelajaran | Wali peserta eksplisit | Guru peserta eksplisit dan masih mengampu | Tidak diberikan  |
| Chat keuangan             | Anak sendiri           | Tidak diberikan                           | Diberikan        |
| Tagihan & bukti           | Anak sendiri           | Tidak diberikan                           | Diberikan        |
| Album individual          | Anak sendiri           | Guru yang mengampu                        | Tidak diberikan  |
| Izin foto                 | Pilihan wali sendiri   | Baca lingkup kelas                        | Baca izin        |
| Log administrasi          | Tidak diberikan        | Tidak diberikan                           | Baca             |

RLS bergantung pada relasi guardian/student/class, bukan nilai role dari form. Admin dapat mengatur penugasan akun sebagai fungsi administrasi; perubahan relasi harus diaudit. Pemilik proyek Supabase tetap memiliki akses istimewa melalui dashboard, berbeda dari akun admin sekolah di portal.

## 5. Storage dan Drive

Path berkas anak memakai `<student_uuid>/<random_uuid>.<extension>`; album kelas memakai `class/<class_uuid>/...`, chat memakai `<thread_uuid>/...`, dan media CMS memakai `<uploader_uuid>/...`. File tugas/album dan bukti bayar berada pada bucket terpisah. Signed URL berlaku 60 detik, lalu perlu dibuat ulang oleh pengguna yang masih berhak.

Supabase tidak mengatur sharing Google Drive. Gunakan akun sekolah sebagai pemilik, set **Restricted**, dan tambahkan hanya akun keluarga/guru yang berhak. Jangan memakai “Anyone with the link” untuk dokumentasi anak. Portal menyediakan album individual/kelas dan publikasi CMS; staf harus memeriksa izin semua anak yang terlihat. Pergantian kelas/pencabutan wali membuat tugas peninjauan izin Drive, bukan mengubah sharing Drive otomatis.

## 6. Pengujian staging

Jalankan seluruh checklist `ACCEPTANCE.md`. Pastikan akses juga ditolak lewat request langsung dengan JWT pengguna yang salah, bukan hanya melalui menu yang disembunyikan. Aktifkan kebijakan session expiry yang sesuai, verifikasi email/invitation, serta prosedur pencabutan sesi ketika akun dinonaktifkan.

## Referensi resmi

- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://supabase.com/docs/guides/realtime/postgres-changes
- https://supabase.com/docs/reference/javascript/auth

## Akun uji brief revisi

Ikuti [STAGING_GUIDE.md](STAGING_GUIDE.md). Jangan menggunakan akun demo sebagai bukti login Supabase.
