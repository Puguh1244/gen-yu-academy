import nodemailer from "nodemailer";

export function enquiryEmailConfigured(env = process.env) {
  return Boolean(env.GMAIL_USER?.trim() && env.GMAIL_APP_PASSWORD?.trim());
}

export async function sendEnquiryReceipt(env, enquiry, id, language) {
  if (!enquiryEmailConfigured(env)) return false;
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.GMAIL_USER.trim(),
      pass: env.GMAIL_APP_PASSWORD.replace(/\s/g, ""),
    },
    connectionTimeout: 8000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  const indonesian = language === "id";
  // Only include validated programme/date fields, never a visitor's free-form message.
  const text = indonesian
    ? [
        "Terima kasih telah menghubungi Gen-Yu Academy.",
        "Permintaan pendaftaran atau kunjungan Anda telah kami terima.",
        "",
        `Nomor permintaan: ${id}`,
        `Program: ${enquiry.p_programme}`,
        `Tanggal kunjungan yang diajukan: ${enquiry.p_visit || "Belum dipilih"}`,
        "",
        "Tim sekolah akan menghubungi Anda untuk tindak lanjut dan konfirmasi jadwal.",
        "Email ini adalah bukti permintaan diterima. Penerimaan siswa dan jadwal kunjungan akan dikonfirmasi oleh sekolah.",
        "",
        "Gen-Yu Academy",
      ]
    : [
        "Thank you for contacting Gen-Yu Academy.",
        "We have received your admissions or school visit enquiry.",
        "",
        `Request reference: ${id}`,
        `Programme: ${enquiry.p_programme}`,
        `Requested visit date: ${enquiry.p_visit || "Not selected"}`,
        "",
        "Our school team will contact you to follow up and confirm arrangements.",
        "This email acknowledges your request. Admission and visit dates will be confirmed by the school.",
        "",
        "Gen-Yu Academy",
      ];
  const sent = await transport.sendMail({
    from: { name: "Gen-Yu Academy", address: env.GMAIL_USER.trim() },
    to: { address: enquiry.p_email },
    subject: indonesian
      ? "Permintaan pendaftaran diterima — Gen-Yu Academy"
      : "Admissions enquiry received — Gen-Yu Academy",
    text: text.join("\n"),
  });
  return (
    sent.accepted?.some(
      (address) => address.toLowerCase() === enquiry.p_email,
    ) === true
  );
}
