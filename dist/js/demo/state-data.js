// Visual preview only. In-memory data; independent from the Supabase portal.

"use strict";
const T = (en, id) => (lang === "id" ? id : en);
let lang = "en";
try {
  lang = localStorage.getItem("genyu-language") || "en";
} catch (e) {}
let role = null,
  tab = "dashboard",
  child = "Sample Child",
  galleryFilter = "all";
const state = {
  messages: { class: [], private: [], finance: [] },
  activities: [],
  submissions: [],
  progress: [],
  absences: [],
  enquiries: [],
  announcements: [],
  invoices: [],
  albums: [],
  teachers: [],
  accounts: [],
  news: [],
  schedule: [],
  responseHistory: [],
  rsvpNote: "",
  ack: false,
  rsvp: "",
  notifications: true,
  readonly: false,
};
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const scene = `<svg viewBox="0 0 500 500" role="img" aria-label="Illustration of playful building blocks, a growing plant, a book and sunshine"><circle cx="375" cy="104" r="39" fill="#f5b841"/><path d="M74 158q30-35 60 0q30-35 60 0" fill="none" stroke="#fffdf8" stroke-width="19" stroke-linecap="round"/><path d="M90 397h337" stroke="#c2ceba" stroke-width="3"/><rect x="91" y="307" width="87" height="90" rx="7" fill="#006b68"/><rect x="180" y="307" width="87" height="90" rx="7" fill="#efad88"/><path d="M90 299l87-109 88 109Z" fill="#f5b841"/><path d="M115 395v-47a20 20 0 0140 0v47" fill="#fff7e8"/><rect x="199" y="326" width="21" height="24" rx="2" fill="#fff7e8"/><rect x="230" y="326" width="21" height="24" rx="2" fill="#fff7e8"/><path d="M290 326h99l-12 71h-75Z" fill="#c98364"/><path d="M339 326V204" stroke="#006b68" stroke-width="8"/><path d="M339 278c-53 7-71-30-65-57 42-1 62 20 65 57ZM340 249c-7-45 20-68 53-65 9 39-13 66-53 65Z" fill="#43816c"/><path d="M335 207c-28-19-27-53-4-66 24 14 29 45 4 66Z" fill="#006b68"/><g transform="translate(96 417) rotate(-7)"><rect width="177" height="23" rx="5" fill="#e4b24d"/><rect x="14" y="-20" width="157" height="22" rx="5" fill="#629486"/><path d="M31-14h127" stroke="#fff7e8" stroke-width="3"/></g><circle cx="414" cy="426" r="24" fill="#f5b841"/><path d="M397 425h34M414 405v42" stroke="#d08c30" stroke-width="2"/><path d="M64 235l10 8-10 9-10-9Z" fill="#006b68"/><path d="M422 279l8 8-8 8-8-8Z" fill="#f5b841"/><circle cx="235" cy="120" r="6" fill="#e9ad91"/></svg>`;
const programs = [
  [
    "Toddler",
    "2–3",
    "A Gentle Beginning",
    "Awal yang Hangat",
    "A welcoming introduction to learning through sensory play, movement, simple language, and reassuring routines. Children begin exploring their surroundings and practising small steps towards independence.",
    "Awal belajar yang hangat melalui permainan sensorik, gerak, bahasa sederhana, dan rutinitas yang menenangkan. Anak mulai menjelajahi lingkungan dan berlatih mandiri.",
    "◒",
  ],
  [
    "Playgroup",
    "3–4",
    "Discovering Together",
    "Menemukan Bersama",
    "Playful experiences encourage children to communicate, imagine, and connect with others. Sharing, taking turns, and making simple choices become part of everyday learning.",
    "Pengalaman bermain mendorong komunikasi, imajinasi, dan hubungan dengan teman. Berbagi, bergiliran, dan membuat pilihan menjadi bagian belajar setiap hari.",
    "△",
  ],
  [
    "Pre-Kindergarten",
    "4–5",
    "Exploring Ideas",
    "Menjelajahi Gagasan",
    "Stories, creative activities, early literacy and numeracy, and hands-on investigations invite children to ask questions and test their ideas. Collaborative play helps them practise problem-solving and responsibility.",
    "Cerita, kegiatan kreatif, literasi dan numerasi awal, serta eksplorasi mengajak anak bertanya dan menguji ide. Bermain bersama melatih pemecahan masalah dan tanggung jawab.",
    "✳",
  ],
  [
    "Kindergarten",
    "5–6",
    "Growing in Confidence",
    "Tumbuh Percaya Diri",
    "Children deepen their communication, thinking, and self-care skills as they prepare for the transition to primary school. Meaningful projects and shared responsibilities encourage initiative, cooperation, and caring leadership.",
    "Anak memperkuat komunikasi, berpikir, dan perawatan diri untuk transisi ke sekolah dasar. Proyek bermakna dan tanggung jawab bersama melatih inisiatif, kerja sama, dan kepemimpinan yang peduli.",
    "▥",
  ],
];
const signatures = [
  [
    "Little Leaders",
    "Children build independence and confidence by taking on classroom helper roles, choosing activities, and sharing their ideas. Everyday experiences encourage responsibility, cooperation, and caring leadership.",
    "Anak membangun kemandirian dan percaya diri melalui peran pembantu kelas, memilih kegiatan, dan menyampaikan gagasan. Pengalaman harian melatih tanggung jawab, kerja sama, dan kepemimpinan yang peduli.",
  ],
  [
    "Little Explorers",
    "Children discover the world around them through nature observations and simple science activities. They ask questions, explore, and make discoveries that nurture their curiosity.",
    "Anak mengenal dunia melalui pengamatan alam dan sains sederhana. Mereka bertanya, bereksplorasi, dan membuat penemuan yang menumbuhkan rasa ingin tahu.",
  ],
  [
    "Young Innovators",
    "Children bring their ideas to life through hands-on STEAM projects, such as building block bridges and creating simple plant-watering tools. Each experience encourages creativity, problem-solving, and teamwork.",
    "Anak mewujudkan ide melalui proyek STEAM seperti jembatan balok dan alat penyiram tanaman sederhana. Setiap pengalaman melatih kreativitas, pemecahan masalah, dan kerja sama.",
  ],
];
const missions = [
  [
    "Inspire joyful learning through play, exploration, creativity, and discovery.",
    "Menghadirkan belajar menyenangkan melalui bermain, eksplorasi, kreativitas, dan penemuan.",
  ],
  [
    "Support the whole child through learning experiences that connect language, thinking, movement, and social and emotional development.",
    "Mendukung perkembangan menyeluruh melalui bahasa, berpikir, gerak, serta perkembangan sosial dan emosional.",
  ],
  [
    "Build everyday independence by encouraging children to make choices, care for their belongings, and take age-appropriate responsibility.",
    "Membangun kemandirian melalui pilihan, merawat barang milik sendiri, dan tanggung jawab sesuai usia.",
  ],
  [
    "Nurture caring leadership through kindness, cooperation, listening, and opportunities to contribute.",
    "Menumbuhkan kepemimpinan yang peduli melalui kebaikan, kerja sama, mendengarkan, dan kesempatan berkontribusi.",
  ],
  [
    "Welcome every language journey by helping children develop confidence in English while respecting their home languages and cultures.",
    "Mendampingi kepercayaan diri berbahasa Inggris sambil menghargai bahasa dan budaya keluarga.",
  ],
  [
    "Partner with families through open communication and a shared commitment to each child’s growth.",
    "Bermitra dengan keluarga melalui komunikasi terbuka dan komitmen terhadap perkembangan anak.",
  ],
];
const day = [
  [
    "Welcome and Choice Play",
    "Penyambutan dan Bermain Pilihan",
    "Put away a bag, choose an activity, and settle into the day.",
    "Menyimpan tas, memilih kegiatan, dan memulai hari.",
  ],
  [
    "Circle Time",
    "Lingkar Cerita",
    "Listen to stories, name feelings, and take turns sharing ideas.",
    "Mendengarkan cerita, mengenali perasaan, dan berbagi ide bergiliran.",
  ],
  [
    "Explore and Create",
    "Eksplorasi dan Berkarya",
    "Build block bridges, investigate the little garden, or create in the art studio.",
    "Membangun jembatan balok, mengamati kebun kecil, atau berkarya di studio seni.",
  ],
  [
    "Snack and Self Care",
    "Makan dan Perawatan Diri",
    "Wash hands, prepare belongings, and practise self-care with support.",
    "Mencuci tangan, menyiapkan perlengkapan, dan merawat diri dengan bantuan.",
  ],
  [
    "Movement and Outdoor Play",
    "Gerak dan Bermain di Luar",
    "Move, observe nature, follow shared agreements, and care for friends.",
    "Bergerak, mengamati alam, mengikuti kesepakatan, dan peduli teman.",
  ],
  [
    "Reflection and Goodbye",
    "Refleksi dan Pulang",
    "Share discoveries, recognise effort, and put materials away together.",
    "Berbagi penemuan, menghargai usaha, dan merapikan alat bersama.",
  ],
];
const faqs = [
  [
    "Does my child need to speak English before joining?",
    "Apakah anak harus sudah bisa bahasa Inggris?",
    "No. Children who are new to English are welcome. Teachers use visuals, songs, stories, familiar routines, and Bahasa Indonesia when needed.",
    "Tidak. Anak yang baru mengenal bahasa Inggris tetap diterima. Guru menggunakan gambar, lagu, cerita, rutinitas, dan Bahasa Indonesia jika diperlukan.",
  ],
  [
    "What if my child finds separation difficult?",
    "Bagaimana jika anak sulit berpisah dengan orang tua?",
    "We work with families on a gradual settling-in plan that responds to each child. Initial arrangements are discussed during your visit.",
    "Sekolah dan keluarga menyusun adaptasi bertahap sesuai respons anak. Pendampingan awal dibahas saat kunjungan.",
  ],
  [
    "Does my child need to be toilet independent?",
    "Apakah anak harus sudah mandiri ke toilet?",
    "Please discuss your child’s needs with our admissions team so we can explain the support available for their age group.",
    "Diskusikan kebutuhan anak dengan tim penerimaan agar dukungan sesuai jenjang dapat dijelaskan.",
  ],
  [
    "How can I contact my child’s teacher?",
    "Bagaimana cara menghubungi guru anak?",
    "Use Class Chat for classroom matters and Private Messages for personal information. Communication uses school accounts, without sharing teachers’ personal phone numbers.",
    "Gunakan Chat Kelas untuk urusan kelas dan Pesan Pribadi untuk informasi anak. Komunikasi menggunakan akun sekolah tanpa nomor pribadi guru.",
  ],
  [
    "Where can I find school hours, fees, and trial information?",
    "Di mana informasi jam sekolah, biaya, dan trial?",
    "Contact Admissions for confirmed school hours and fees. A trial class is offered only when the school confirms availability.",
    "Hubungi tim penerimaan untuk jadwal dan biaya resmi. Trial hanya tersedia setelah sekolah mengonfirmasi layanannya.",
  ],
  [
    "How can I view photos and activities?",
    "Bagaimana melihat foto dan kegiatan anak?",
    "Open Photo Albums or Weekly Activities in the Parent Portal. Class albums and individual records are available only to authorised families and teachers.",
    "Buka Album Foto atau Kegiatan Mingguan di portal. Album dan data individual hanya tersedia bagi keluarga dan guru yang berhak.",
  ],
];
function brand() {
  return `<a class="brand" href="#home" aria-label="Gen-Yu Academy Home"><img class="school-logo" src="${offlineAsset(`assets/gen-yu-academy-logo.png`)}" width="440" height="367" alt="Gen-Yu Academy"></a>`;
}
function button(label, action, secondary = false) {
  return `<button class="btn ${secondary ? "secondary" : ""}" onclick="${action}">${label} <span aria-hidden="true">↗</span></button>`;
}
