# Panduan operasional sekolah

Panduan ini harus ditetapkan penanggung jawabnya sebelum penggunaan data asli. Kode tidak menjadwalkan backup, pemusnahan arsip atau pengiriman email/push.

## Akun dan pergantian kelas

1. Verifikasi identitas wali/guru sebelum undangan dan penugasan. Role tidak dipilih sendiri oleh pendaftar.
2. Catat keluarga untuk RSVP per keluarga. Hubungkan setiap anak dengan wali dan kelas yang tepat.
3. Saat hubungan berakhir, nonaktifkan akun atau hapus relasi yang bersangkutan. Periksa sesi aktif melalui pengelola Auth bila perlu.
4. Tinjau antrean Access Settings setelah pindah kelas/pencabutan wali. Hapus anggota lama di Drive dan tambahkan anggota baru yang sah. Tandai selesai hanya setelah pengaturan Drive diperiksa langsung.
5. Periksa akses guru yang berhenti atau dipindahkan. Menghapus penugasan portal tidak menghapus akses Google Drive secara otomatis.

## Foto dan publikasi

Folder anak menggunakan Restricted. Pemeriksaan persetujuan dilakukan untuk seluruh anak yang terlihat; checkbox staf adalah catatan pemeriksaan, bukan analisis otomatis isi foto. Periksa ulang nama, fakta prestasi, dan persetujuan sebelum menerbitkan berita/foto publik. Jangan masukkan nomor pribadi, alasan sakit atau data pembayaran ke CMS.

## Pemulihan akun

Sekolah memverifikasi identitas melalui kontak yang sudah terdaftar sebelum melakukan pemulihan via Auth. Jangan mengirim password bersama. Konfigurasikan URL redirect dan SMTP, uji link undangan kedaluwarsa serta pengaturan password. Kegagalan pembuatan profil setelah undangan harus diperiksa pengelola sebelum mengirim ulang.

## Retensi, backup dan restore

Sekolah menetapkan durasi simpan terpisah untuk chat, tugas, progres, foto, izin, admissions dan bukti keuangan. Sebelum penghapusan: periksa kebutuhan arsip dan permintaan keluarga, catat persetujuan, ekspor bila diperlukan, lalu hapus referensi database dan objek terkait melalui prosedur administrator. Jangan menghapus berkas yang masih menjadi bukti/arsip aktif.

Pilih frekuensi backup berdasarkan kebutuhan sekolah dan kemampuan paket Supabase. Backup database dan objek Storage/Drive perlu diperiksa terpisah. Batasi akses cadangan, simpan catatan waktu/hasil backup, dan uji restore ke lingkungan terpisah secara berkala. Periksa hitungan record, relasi, file, serta RLS sebelum menyatakan pemulihan selesai.

## Penanganan insiden

Nonaktifkan akun yang terdampak dan cabut akses yang salah; simpan catatan audit tanpa menyalin konten sensitif ke laporan umum. Pengelola proyek meninjau token/kunci yang mungkin bocor, melakukan rotasi bila perlu, memeriksa cakupan akses dan menghubungi pihak sekolah yang bertanggung jawab. Lakukan pemulihan serta pengujian pembatasan akses sebelum membuka kembali layanan.

## Notifikasi dan tagihan

Pengingat portal bersifat manual dan memperhatikan preferensi kategori. Periksa rekap yang belum merespons dan hubungi keluarga melalui prosedur sekolah bila mendesak. Pembayaran masih diverifikasi admin: cocokkan bukti dengan penerimaan dana, jangan hanya dengan gambar bukti. Koreksi invoice/refund memerlukan prosedur terpisah; jangan mengedit saldo langsung tanpa jejak penyesuaian.
