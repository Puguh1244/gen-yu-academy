# Status paket Supabase — 1 November 2026

- Dibuat dari HTML Gallery Fix terbaru; principal Octavia, tiga guru chibi, deskripsi EN/ID dan kontras galeri dipertahankan.
- HTML/CSS/JavaScript/gambar terpisah. Login mengarah ke portal.html dalam paket yang sama.
- Footer kontak diselaraskan dengan halaman Contact. Kebenaran kontak belum diverifikasi eksternal.
- Ditambah panduan HTML pembuat .env/config.js, peluncur Windows dan template SQL akun admin/guru/wali.
- Build berjalan tanpa instalasi npm karena SDK browser sudah disertakan.
- Sembilan tes otomatis lokal lulus: migrasi, isolasi RLS, privasi peserta chat, draf tugas, respons acara berversi, konfigurasi publik dan pembatasan admin.
- Semua referensi modul dan berkas HTML diperiksa; sintaks JavaScript lolos.
- Koneksi Auth/Storage/Realtime pada Supabase pengguna belum diuji karena URL/key belum diberikan. Tidak ada akun sungguhan dibuat.
- Portal diperiksa di browser desktop: tiga pilihan, pergantian formulir, Bahasa Indonesia, logo, dan tidak ada luapan horizontal. Tampilan mobile dan login Supabase sungguhan belum diuji.
- Website online sebelumnya tidak diperbarui oleh pembuatan paket ini.

Tambahan pemeriksaan: 14 render halaman EN/ID dan jalur gambar lulus; pembuat konfigurasi menolak secret key serta URL dengan path; template SQL akun admin/guru/wali berhasil pada database lokal.

Revisi login: tiga portal Orang Tua/Guru/Admin, validasi peran sebelum dashboard, penolakan profil tidak aktif/tidak dikenal, logo tersemat, dan bundel HTML tanpa dependensi modul eksternal. Tes mencakup sembilan kombinasi peran/portal serta profil hilang, tidak aktif, sesi hilang, dan kegagalan query.
