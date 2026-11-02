export let language = "en";
try {
  language = localStorage.getItem("genyu-language") === "id" ? "id" : "en";
} catch {}
export const B = (en, id) => (language === "id" ? id : en);
export function setLanguage(value) {
  language = value === "id" ? "id" : "en";
  try {
    localStorage.setItem("genyu-language", language);
  } catch {}
  document.documentElement.lang = language;
}
export const textOf = (row, key) =>
  language === "id" ? row[key + "_id"] || row[key] || "" : row[key] || "";
export const statusText = (value) =>
  ({
    Received: B("Received", "Diterima"),
    Contacted: B("Contacted", "Dihubungi"),
    "Visit Scheduled": B("Visit Scheduled", "Kunjungan Dijadwalkan"),
    "Registration in Progress": B(
      "Registration in Progress",
      "Pendaftaran Diproses",
    ),
    Completed: B("Completed", "Selesai"),
    published: B("Published", "Diterbitkan"),
    draft: B("Draft", "Draf"),
    submitted: B("Submitted", "Terkumpul"),
    reviewed: B("Reviewed", "Ditinjau"),
    needs_revision: B("Needs Revision", "Perlu Revisi"),
    pending: B("Awaiting Verification", "Menunggu Verifikasi"),
    accepted: B("Accepted", "Diterima"),
    rejected: B("Rejected", "Ditolak"),
    attending: B("Will Attend", "Akan Hadir"),
    unable: B("Unable to Attend", "Berhalangan"),
  })[value] || value;
const translations = {
  Overview: "Beranda",
  Announcements: "Pengumuman",
  "Events & RSVP": "Acara & Kehadiran",
  "Weekly Activities": "Kegiatan Mingguan",
  "Child Progress": "Perkembangan Anak",
  Absences: "Izin Tidak Hadir",
  Messages: "Pesan",
  "Photo Albums": "Album Foto",
  "Photo Permissions": "Izin Foto",
  "Fees & Payments": "Biaya & Pembayaran",
  "School Records": "Data Sekolah",
  "Activity Log": "Riwayat Aktivitas",
  Calendar: "Kalender",
  Account: "Akun",
  Notifications: "Notifikasi",
  Admissions: "Penerimaan",
  "Public Website": "Website Publik",
  Responses: "Respons",
  "Access Settings": "Pengaturan Akses",
  "Sign out": "Keluar",
  "Loading…": "Memuat…",
  "School website": "Website sekolah",
  "Save / Simpan": "Simpan",
  Title: "Judul",
  Child: "Anak",
  Class: "Kelas",
  Parent: "Orang Tua",
  Teacher: "Guru",
  "School accounts": "Akun sekolah",
  Name: "Nama",
  Role: "Peran",
  Status: "Status",
  Active: "Aktif",
  Inactive: "Nonaktif",
  "Open private file": "Buka berkas privat",
  "Contact Administration": "Hubungi Administrasi",
  Save: "Simpan",
  "Create an invoice": "Buat tagihan",
  "Invoice description / billing period": "Keterangan tagihan / periode",
  "Amount (IDR)": "Jumlah (Rp)",
  "Due date": "Tanggal jatuh tempo",
  "Submit payment evidence": "Kirim bukti pembayaran",
  "Transferred amount (IDR)": "Jumlah transfer (Rp)",
  "Receipt (JPG, PNG or PDF; max 10 MB)":
    "Bukti (JPG, PNG atau PDF; maks. 10 MB)",
  "Verify payment": "Verifikasi pembayaran",
  Decision: "Keputusan",
  "Accept payment": "Terima pembayaran",
  "Reject evidence": "Tolak bukti",
  "Verification note": "Catatan verifikasi",
  Unpaid: "Belum Dibayar",
  Paid: "Lunas",
  "Partially paid": "Dibayar Sebagian",
  "Awaiting verification": "Menunggu Verifikasi",
  "No invoices available.": "Belum ada tagihan.",
  "Add a class": "Tambah kelas",
  "Class name": "Nama kelas",
  Programme: "Jenjang",
  "Add a student": "Tambah anak",
  "Student name": "Nama anak",
  "Link a parent to a child": "Hubungkan wali dengan anak",
  "Assign a teacher to a class": "Tugaskan guru ke kelas",
  "Account relationships": "Hubungan akun",
  "Remove parent link": "Cabut hubungan wali",
  "Remove teacher assignment": "Cabut penugasan guru",
  "No students linked.": "Belum ada anak terhubung.",
  "Allow use in the restricted class gallery.":
    "Izinkan penggunaan di galeri kelas terbatas.",
  "Allow use on the public school website.":
    "Izinkan penggunaan pada website publik sekolah.",
  "No guardian permission has been recorded.":
    "Belum ada persetujuan wali tercatat.",
  "A receipt is not a confirmed payment. School administration must verify it before the balance changes. No payment gateway or bank transfer is initiated by this website.":
    "Bukti transfer belum berarti pembayaran terkonfirmasi. Admin harus memverifikasi sebelum saldo berubah. Website tidak menjalankan transfer bank atau payment gateway.",
  "No consent is assumed. This records each guardian’s choice; it does not automatically publish photographs. School staff must confirm agreement from all required guardians before class or public use.":
    "Persetujuan tidak diasumsikan. Pilihan setiap wali dicatat tanpa memublikasikan foto otomatis. Sekolah harus memastikan izin seluruh wali yang diperlukan sebelum pemakaian kelas atau publik.",
};
export function translateDOM(root = document.body) {
  if (language !== "id") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.parentElement?.closest("[data-content],script,style,textarea"))
      continue;
    const raw = n.textContent,
      trim = raw.trim();
    if (translations[trim])
      n.textContent = raw.replace(trim, translations[trim]);
  }
}

export function friendlyError(error) {
  const message = String(error?.message || "");
  if (
    error?.code === "invalid_credentials" ||
    /invalid login credentials/i.test(message)
  )
    return B(
      "The email or password is incorrect. Please try again.",
      "Email atau kata sandi salah. Silakan coba kembali.",
    );
  if (/email not confirmed/i.test(message))
    return B(
      "This account is not confirmed. Contact school administration.",
      "Akun belum dikonfirmasi. Hubungi administrasi sekolah.",
    );
  if (/user is banned|user_banned/i.test(message))
    return B(
      "This account is inactive. Contact school administration.",
      "Akun ini nonaktif. Hubungi administrasi sekolah.",
    );
  if (/row-level security|permission denied|not permitted/i.test(message))
    return B(
      "You do not have access to this record or action.",
      "Anda tidak memiliki akses ke data atau tindakan ini.",
    );
  if (/failed to fetch|network|fetch failed/i.test(message))
    return B(
      "Unable to reach the school service. Check your connection and try again.",
      "Layanan sekolah tidak dapat dijangkau. Periksa koneksi dan coba kembali.",
    );
  return (
    message ||
    B(
      "Something went wrong. Please try again.",
      "Terjadi kesalahan. Silakan coba kembali.",
    )
  );
}
