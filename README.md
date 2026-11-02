<div align="center">

# Gen-Yu Academy

### Website Sekolah & Portal Informasi Terintegrasi

**Menghubungkan sekolah, guru, dan orang tua dalam satu platform.**

[Website Sekolah](#website-publik) · [Fitur Portal](#fitur-portal) · [Teknologi](#teknologi) · [Repository](https://github.com/Puguh1244/gen-yu-academy)

</div>

---

## Tentang Gen-Yu Academy

**Gen-Yu Academy** adalah proyek website sekolah dan portal informasi yang dirancang untuk mendukung komunikasi, administrasi, serta pemantauan kegiatan belajar anak. Platform ini menggabungkan website publik dengan portal berbasis peran untuk **Administrator**, **Teacher (Guru)**, dan **Parent (Orang Tua)**.

Website publik memperkenalkan sekolah dan menyediakan jalur komunikasi bagi calon orang tua. Portal sekolah menyediakan ruang kerja dengan fitur sesuai kebutuhan dan hak akses setiap pengguna.

## Website Publik

Website publik Gen-Yu Academy mencakup:

- **Profil sekolah** — pengenalan Gen-Yu Academy, pendekatan pendidikan, dan informasi sekolah.
- **Program pembelajaran** — penjelasan jenjang dan aktivitas belajar anak.
- **Tim sekolah** — profil staf pengajar dan administrasi.
- **Fasilitas** — informasi lingkungan dan sarana belajar.
- **Artikel** — bacaan serta aktivitas edukatif untuk keluarga.
- **Penerimaan** — formulir pertanyaan dan minat pendaftaran yang dapat ditindaklanjuti sekolah.
- **Kontak** — kanal komunikasi sekolah.

## Fitur Portal

Setiap akun masuk melalui portal yang sama, dengan menu dan akses berdasarkan perannya.

### Administrator

Pengelolaan operasional sekolah melalui:

- **Dashboard** — ringkasan informasi sekolah.
- **Data Sekolah** — pengelolaan kelas, siswa, keluarga, serta hubungan akun guru dan orang tua.
- **Penerimaan** — peninjauan dan tindak lanjut permintaan pendaftaran.
- **Website Publik** — pengelolaan konten sekolah.
- **Pengumuman & Acara** — publikasi informasi, konfirmasi penerimaan, serta RSVP.
- **Respons** — pemantauan tanggapan pengguna.
- **Tagihan & Pembayaran** — pembuatan tagihan dan verifikasi bukti pembayaran.
- **Pesan** — komunikasi administrasi dengan pengguna terkait.
- **Kalender & Absensi** — informasi jadwal dan izin ketidakhadiran.
- **Izin Foto** — pemantauan persetujuan penggunaan dokumentasi anak.
- **Log Aktivitas & Pengaturan Akses** — pemantauan aktivitas dan pengelolaan akses akun.
- **Notifikasi & Akun** — informasi terbaru dan pengaturan profil.

### Teacher (Guru)

Fitur untuk mendukung pembelajaran dan komunikasi kelas:

- **Dashboard Kelas** — ringkasan kelas dan siswa yang ditugaskan.
- **Kalender** — jadwal kegiatan kelas.
- **Perkembangan Anak** — pencatatan dan publikasi laporan perkembangan.
- **Aktivitas Mingguan** — penyusunan kegiatan, penerimaan, dan peninjauan tugas.
- **Pesan** — komunikasi kelas dan percakapan terkait siswa.
- **Absensi** — peninjauan izin ketidakhadiran.
- **Album Foto** — dokumentasi kegiatan pembelajaran.
- **Pengumuman & Acara** — informasi kegiatan sekolah.
- **Usulan Konten Website** — kontribusi materi untuk website sekolah.
- **Izin Foto, Notifikasi & Akun** — informasi persetujuan dan pengaturan profil.

### Parent (Orang Tua)

Fitur untuk mengikuti informasi dan aktivitas anak:

- **Dashboard Anak** — informasi anak yang terhubung dengan akun.
- **Kalender, Pengumuman & Acara** — jadwal sekolah, pengumuman, dan RSVP.
- **Pesan** — komunikasi dengan guru dan administrasi sekolah.
- **Izin Ketidakhadiran** — pengajuan izin anak.
- **Aktivitas Mingguan** — melihat kegiatan dan mengirim hasil aktivitas.
- **Perkembangan Anak** — melihat laporan perkembangan yang dipublikasikan.
- **Album Foto** — dokumentasi yang dapat diakses sesuai izin.
- **Tagihan & Pembayaran** — melihat tagihan dan mengunggah bukti pembayaran.
- **Izin Foto, Notifikasi & Akun** — pengelolaan persetujuan, informasi terbaru, dan profil.

## Alur Penggunaan

1. **Administrator** mengelola data sekolah, kelas, akun, dan informasi utama.
2. **Teacher** mengelola kegiatan kelas dan mencatat perkembangan anak.
3. **Parent** mengakses informasi anak yang telah dihubungkan dengan akunnya serta berkomunikasi dengan sekolah.

Portal dirancang menggunakan **autentikasi berbasis peran** dan kebijakan akses data pada Supabase. Ketersediaan suatu menu tidak dengan sendirinya berarti seluruh alurnya telah terverifikasi pada lingkungan produksi.

## Teknologi

| Komponen | Teknologi |
|---|---|
| Website & antarmuka | HTML, CSS, JavaScript |
| Server & API administrasi | Node.js |
| Database | PostgreSQL melalui Supabase |
| Autentikasi & hak akses | Supabase Auth dan Row Level Security (RLS) |
| Penyimpanan berkas | Supabase Storage |
| Build frontend | esbuild |
| Versi kode & deployment | GitHub dan Vercel |

## Status Proyek

Gen-Yu Academy merupakan proyek yang sedang dikembangkan dan diuji. Website publik dan modul portal telah tersedia dalam kode sumber. Pengujian integrasi, otorisasi antarperan, serta seluruh proses online harus diselesaikan sebelum penggunaan dengan data sekolah sebenarnya.

## Repository

Kode sumber: **[Puguh1244/gen-yu-academy](https://github.com/Puguh1244/gen-yu-academy)**

---

<div align="center">

**Gen-Yu Academy**  
*Learning, growing, and connecting together.*

</div>
