# Pemeriksaan sebelum produksi

## Sudah diuji secara lokal

`npm test` menjalankan migrasi SQL aplikasi pada Postgres WASM/PGlite dengan schema auth/storage tiruan. Skenario: keluarga A tidak melihat keluarga B; guru tidak melihat biaya/bukti; admin tidak melihat progres/chat belajar; role tidak dapat dinaikkan sendiri; submission lintas anak ditolak; pengirim chat tidak bisa memalsukan nama; bukti tidak melunaskan tagihan sebelum verifikasi; verifikasi ganda ditolak; pencabutan relasi menghapus akses pada query berikutnya. Tes Node memeriksa konfigurasi aman, file privat server tidak terlayani, dan health endpoint.

## Harus dijalankan pada Supabase staging

- [ ] Jalankan 001 lalu 002 pada proyek kosong dan pastikan setiap policy/bucket terpasang.
- [ ] Akun tanpa profil atau profil nonaktif ditolak; login/logout bekerja di perangkat sasaran.
- [ ] Uji semua kombinasi parent A/B, teacher A/B, admin dengan JWT masing-masing lewat API langsung.
- [ ] Orang tua yang memiliki dua anak dapat melihat keduanya, namun tidak anak lain.
- [ ] Chat baru muncul pada dua browser terpisah; putus koneksi memberi pesan fallback dan refresh manual bekerja.
- [ ] Mode kelas hanya-guru menolak kiriman wali melalui API, bukan hanya menyembunyikan form.
- [ ] Upload JPG/PNG/PDF pada chat/bukti ≤10 MB dan JPG/PNG/PDF/MP4/WebM pembelajaran ≤25 MB; berkas di luar tipe/batas ditolak Storage.
- [ ] File privat tidak terbuka melalui public URL; signed URL kedaluwarsa; guru ditolak untuk bukti pembayaran.
- [ ] Draf tugas privat hanya terlihat pengirim termasuk berkas; pengiriman melewati tenggat ditolak bila allow_late=false dan ditandai late bila true; review hanya oleh guru kelas yang tepat.
- [ ] Dua tab admin tidak bisa mengesahkan bukti sama dua kali; saldo cicilan benar; penolakan tidak menambah paid.
- [ ] Persetujuan wali tersimpan terpisah; jangan tampilkan foto publik hanya karena satu wali memilih Ya.
- [ ] Uji perubahan kelas dan pencabutan akun, termasuk sesi/realtime aktif dan signed URL yang masih berlaku sampai kedaluwarsa.
- [ ] Set Google Drive Restricted; uji akun tidak berhak dari luar portal.
- [ ] Verifikasi school email, nomor telepon, alamat, informasi kurikulum, dan izin publikasi konten.
- [ ] Tetapkan retensi, penghapusan, backup/restore, SMTP, prosedur pemulihan akun, serta tanggung jawab admin proyek.

Pengujian lokal tidak membuktikan konfigurasi layanan Supabase eksternal. Jangan menggunakan data siswa nyata sebelum checklist staging diselesaikan.

## Tambahan Word terbaru

- [ ] Dua wali satu anak dan dua guru satu kelas: hanya peserta eksplisit yang membaca chat pribadi dan lampirannya. Menghapus relasi mencabut akses peserta.
- [ ] Dua wali satu anak tidak saling membaca alasan izin/draf pribadi; admin hanya melihat ringkasan izin.
- [ ] Preferensi bahasa tersimpan dan tampil setelah login ulang. Pesan bebas tidak diterjemahkan otomatis.
- [ ] Memilih anak/kelas menyaring seluruh daftar; unread chat tetap dihitung meski notifikasi pesan dimatikan.
- [ ] Draf laporan guru tidak tampak wali; album kelas yang belum diperiksa izinnya tidak tampak wali.
- [ ] RSVP per anak dan per keluarga: dua wali tidak menggandakan peserta; perubahan versi membutuhkan respons baru, riwayat tetap terbaca.
- [ ] Pengumuman versi baru meminta acknowledge baru; pengingat hanya kepada sasaran belum merespons dan tidak berulang hari yang sama.
- [ ] Guru tidak bisa menerbitkan berita sendiri; admin memeriksa sebelum publikasi; public feed tidak mengandung data portal privat.
- [ ] Formulir admissions tersimpan dan status dikelola admin; consent, field tidak valid, honeypot dan kuota per-email diuji.
- [ ] Undangan Node membutuhkan admin aktif dan server key; request tanpa bearer / origin tidak sah ditolak. Uji Auth SMTP, redirect undangan, set password, dan akun nonaktif.
- [ ] Kalender mengambil record acara yang sama dan memakai zona waktu operasional yang disetujui sekolah.
- [ ] Uji backup database + berkas, restore terpisah, dan prosedur di OPERATIONS.md.

Lokal: migrasi 001/002, privasi peserta, keluarga, draf, RSVP/revisi/pengingat dan transaksi biaya diuji otomatis. Integrasi eksternal Auth/Storage/Realtime/SMTP/Drive belum diuji karena belum ada proyek dan kredensial nyata.
