# Cakupan fitur sesuai Word terbaru

Acuan: `PROYEK 3 EDU TECH WEBSITE(1).docx`. Tabel ini menjelaskan kode yang disertakan, bukan klaim layanan sekolah sudah aktif. Portal memerlukan proyek Supabase, migrasi, akun, dan penugasan; pratinjau tanpa konfigurasi tetap menggunakan demo terpisah.

| Bagian                  | Implementasi                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beranda dan profil      | English sebagai bahasa utama, pilihan Indonesia, visi-misi, empat jenjang, IEYC/Cambridge Early Years/STEAM, Little Leaders/Explorers/Young Innovators                                                              |
| Situs publik            | Home, About Us, Programmes, School Life, Admissions, Contact; berita, pengumuman publik, acara, profil guru terverifikasi, galeri/artikel dari CMS setelah Supabase terhubung                                       |
| Tiga peran              | Parent, teacher, admin; role sekolah dari database, bukan pilihan bebas saat login                                                                                                                                  |
| Dashboard               | Wali: pengumuman penting → jadwal hari ini → pesan belum dibaca → tenggat → biaya → perkembangan/foto. Guru dan admin memiliki menu sesuai tugas                                                                    |
| Multi-anak / kelas      | Pemilih anak untuk wali; pemilih kelas untuk guru; relasi diperiksa kembali oleh RLS                                                                                                                                |
| Bahasa                  | Preferensi EN/ID tersimpan per akun; bidang bilingual untuk pengumuman, acara, penugasan, perkembangan, tagihan, CMS dan jadwal. Konten bebas harus diisi/diterjemahkan staf; tidak ada penerjemahan otomatis pesan |
| Chat kelas              | Realtime, cap waktu, identitas pengirim dari database, hanya-guru dapat diaktifkan, sematan, lampiran, indikator belum dibaca                                                                                       |
| Chat pribadi            | Dibuka wali dengan anak, guru peserta, dan topik. Wali lain maupun guru kelas lain tidak otomatis mendapat akses. Tidak memuat nomor pribadi guru                                                                   |
| Chat biaya              | Kanal wali–admin terpisah; guru tidak dapat membaca                                                                                                                                                                 |
| Penugasan mingguan      | Tujuan, instruksi, bahan, peran wali, tanggal terbit, tenggat, hasil yang diharapkan; catatan/file, draf privat, kirim, revisi, reviewed, aturan keterlambatan                                                      |
| Perkembangan            | Tanggal, kegiatan, area perkembangan, capaian, dukungan, kegiatan rumah; draf guru belum terlihat wali                                                                                                              |
| Izin ketidakhadiran     | Alasan hanya wali pengirim dan guru terkait; ubah/batalkan dengan riwayat; admin menerima ringkasan tanggal/status                                                                                                  |
| Album                   | Album individual dan kelas, unggahan privat atau tautan Drive; kelas membutuhkan pemeriksaan izin foto. Izin Drive tetap harus diatur di Google Drive                                                               |
| Pengumuman              | Sasaran publik/semua/jenjang/kelas, versi, tenggat konfirmasi, rekap pembaca dan yang belum merespons                                                                                                               |
| Kalender dan acara      | Kalender memakai record acara yang sama dengan detail; jam, lokasi, persiapan, kewajiban wali, RSVP per anak/keluarga, jumlah pendamping, ekspor ICS                                                                |
| Perubahan acara         | Setiap edit menaikkan versi, menyimpan riwayat, mempertahankan respons lama, dan membutuhkan respons baru. Dua wali tidak menggandakan satu peserta                                                                 |
| Administrasi biaya      | Nomor/jenis/periode tagihan, nominal, tenggat, instruksi bilingual, paid/balance/overdue, bukti, cicilan, verifikasi transaksional, unduhan pengakuan pembayaran berbentuk teks                                     |
| Pendaftaran / kunjungan | Formulir tersimpan setelah terhubung, persetujuan kontak, honeypot dan pembatasan per-email; status Received sampai Completed, tindak lanjut, kunjungan dikonfirmasi admin                                          |
| Editorial               | Guru mengusulkan berita kelas; admin memeriksa fakta, nama, dan izin foto sebelum publikasi; profil guru tidak meminta kontak pribadi                                                                               |
| Notifikasi              | Pusat notifikasi dalam portal, preferensi kategori, cuplikan generik; notifikasi tugas terjadwal disinkronkan saat masuk portal; pengingat penerima belum merespons dipicu admin, maksimum satu per item/versi/hari |
| Akun dan hubungan       | Admin mengelola kelas, murid, keluarga, relasi wali/guru, perubahan kelas. Undangan dan nonaktifkan akun melalui Node dengan server key opsional; atur kata sandi dalam akun                                        |
| Audit dan pencabutan    | Audit administrasi, riwayat informasi/RSVP/izin; akses portal mengikuti relasi terbaru; antrean pemeriksaan izin Drive setelah perubahan kelas atau penghapusan wali                                                |

## Hal yang memerlukan konfigurasi atau pengembangan lanjutan

- URL/key Supabase, Auth, SMTP, Storage, Realtime, akun dan penugasan asli belum dihubungkan atau diuji secara end-to-end.
- Hosting Sites menyajikan `dist/`. Endpoint pengelolaan akun Node hanya berjalan pada host Node; alternatifnya akun dibuat lewat Supabase Dashboard.
- Email/push notifikasi, scheduler pengingat di luar portal, payment gateway dan sinkronisasi izin Drive otomatis belum dipasang. Jangan menganggap notifikasi portal sebagai pesan yang dikirim ke ponsel saat aplikasi tertutup.
- Pencegahan spam pendaftaran saat trafik publik memerlukan rate limit di edge/CAPTCHA tambahan. Pembatasan per-email tidak mencegah serangan dengan banyak alamat.
- Arsip chat penuh/pagination, ekspor rapor PDF, refund/koreksi invoice, check-in/penjemputan, daily care dan konsultasi terjadwal adalah pengembangan berikutnya.
- Batas daftar: 100 pesan terakhir, sebagian daftar 100–500 record. Rencana retensi, backup berkas, restore, pemulihan akun, dan prosedur insiden tersedia sebagai panduan operasional, bukan otomatisasi.
