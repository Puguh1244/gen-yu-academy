# Arsitektur

HTML/CSS/JavaScript disajikan Node.js atau static hosting. Browser mengakses Supabase Auth, Postgres/RLS, Storage dan Realtime dengan token akun. SDK dibundel lokal. JavaScript adalah bahasa Node.js; proyek ini tidak memakai Java/Spring Boot.

## Pemisahan modul

- `public/js/demo/`: halaman sekolah dan simulasi portal tanpa data asli.
- `public/js/public-school.js`: CMS publik dan pengiriman formulir ke Supabase ketika dikonfigurasi.
- `public/js/portal/app.js`: navigasi, autentikasi, pemilih anak/kelas.
- `i18n.js`: bahasa; `information.js`: pengumuman/acara/kalender; `workspace.js`: dashboard, akun/notifikasi/rekap.
- `learning.js`: tugas, perkembangan, izin; `chat.js`: komunikasi dan realtime.
- `school-management.js`: CMS, admissions, album, relasi; `fees.js`: tagihan/verifikasi.
- `services/supabase.js`: client dan unggahan/signed URL. `ui.js` dan `spec-ui.js`: form/escaping/helper.
- `server/app.js`: file publik, konfigurasi dan health; `admin-api.js`: undangan dan status akun khusus admin terautentikasi.
- `supabase/migrations/001_school.sql` lalu `002_word_requirements.sql`: schema, policy, RPC dan trigger.

## Identitas dan batas akses

`auth.users → profiles`; wali terhubung melalui `guardians → students → classes`; guru melalui `teaching_assignments → classes`. Profil harus aktif. Hubungan dan RLS diperiksa pada setiap request; menu bukan batas keamanan.

Chat pribadi memiliki `thread_participants` yang eksplisit dan masih mensyaratkan relasi sekolah aktif. Perubahan kelas dapat mencabut akses guru lama. Admin sekolah hanya mendapat chat biaya, bukan catatan/chat pembelajaran. Wali lain tidak otomatis mendapat alasan izin atau draf milik wali pengirim. Pengelola proyek Supabase memiliki kewenangan terpisah dari role admin sekolah.

Record anak tidak digunakan di notifikasi sebagai cuplikan sensitif. Berkas privat merujuk izin record terkait; draf pengumpulan belum dapat dibaca guru. Album kelas memerlukan pemeriksaan izin foto. Tautan Drive tidak memindahkan kendali izin ke portal.

## Transaksi dan versi

Pembayaran dikunci dan diverifikasi dalam transaksi; verifikasi ganda ditolak. Nominal invoice tidak dapat diubah klien setelah dibuat. RSVP memiliki kunci `(event, scope_kind, scope_id, version)` sehingga dua wali mengubah satu respons per anak/keluarga. Edit acara/pengumuman mencatat snapshot dan menaikkan versi di database. Riwayat tidak ditimpa klien.

## Operasi server

`POST /api/admin/invite` dan `/api/admin/account-status` memeriksa token Auth, profil admin aktif, origin dan pembatasan request. Hanya endpoint ini memakai server key opsional; key tidak masuk `config.js` maupun bundle. Server tidak menyediakan proxy query bebas. Audit dan undangan adalah operasi lintas layanan; kegagalan parsial perlu ditinjau admin, tanpa penghapusan akun otomatis.

Static hosting tetap mendukung portal langsung ke Supabase, tetapi tidak menjalankan endpoint Node ini. `GET /api/health` mengukur konfigurasi lokal, bukan keterjangkauan layanan Supabase.

## Batas data dan realtime

Realtime digunakan pada chat aktif. Informasi lainnya diperbarui saat membuka/memuat ulang halaman. Pengingat dalam portal dipicu admin, bukan scheduler latar. Daftar dibatasi 100–500 record; pagination lengkap perlu ditambahkan untuk arsip besar. Signed URL berlaku 60 detik dan dapat dipakai pembawanya sampai kedaluwarsa, meskipun relasi sudah dicabut.
