// Visual preview only. In-memory data; independent from the Supabase portal.
function submitEnquiry(e) {
  e.preventDefault();
  if (window.GENYU_LIVE) {
    window.GENYU_LIVE.submitEnquiry(e.target);
    return;
  }
  let v = Object.fromEntries(new FormData(e.target));
  if (Number(v.age) < 0 || Number(v.age) > 18) {
    toast(T("Please check the child’s age.", "Periksa usia anak."));
    return;
  }
  if (v.date && v.date < new Date().toLocaleDateString("en-CA")) {
    toast(
      T("Choose a future visit date.", "Pilih tanggal kunjungan mendatang."),
    );
    return;
  }
  state.enquiries.push({ ...v, id: uid(), status: "Received" });
  e.target.reset();
  openModal(
    T("Preview enquiry saved", "Permintaan simulasi disimpan"),
    `<p>${T("Your sample enquiry is now available in the Admin Portal preview. Nothing was sent to the school. Operational visits are not available until the school confirms its details.", "Permintaan contoh tersedia pada simulasi Portal Admin. Tidak ada yang dikirim ke sekolah. Kunjungan operasional menunggu konfirmasi informasi sekolah.")}</p><a href="#contact" class="btn" onclick="closeModal()">${T("School Contact", "Kontak Sekolah")}</a>`,
  );
}
function programmeDetail(i) {
  let p = programs[i];
  openModal(
    p[0],
    `<span class="badge">${p[1]} ${T("years", "tahun")}</span><h3>${T(p[2], p[3])}</h3><p>${T(p[4], p[5])}</p>${programmeLearning(i)}<p class="notice">${T("School hours, admission age cut-offs, and placement are confirmed by the admissions team.", "Jam sekolah, batas usia penerimaan, dan penempatan dikonfirmasi tim penerimaan.")}</p><a class="btn" href="#admissions" onclick="closeModal()">${T("Enquire About This Programme", "Tanyakan Program Ini")} ↗</a>`,
  );
}
function eventDetail(internal) {
  openModal(
    "United Nations Day",
    `<span class="badge gold">${T("Draft event template", "Draf contoh acara")}</span><p>${T("Children will explore cultures, share classroom activities, and celebrate friendship.", "Anak mengenal budaya, berbagi kegiatan kelas, dan merayakan persahabatan.")}</p><ul class="list"><li><b>${T("Date & venue", "Tanggal & lokasi")}</b><br>${T("To be confirmed", "Menunggu konfirmasi")}</li>${internal ? `<li><b>${T("Audience", "Peserta")}</b><br>${T("Invited classes to be confirmed", "Kelas undangan akan dikonfirmasi")}</li><li><b>${T("Parent attendance", "Kehadiran orang tua")}</b><br>${T("Required for invited families", "Wajib untuk keluarga yang diundang")}</li><li><b>${T("Arrival, finish time & preparation", "Kedatangan, selesai & perlengkapan")}</b><br>${T("School administration will confirm the details.", "Administrasi sekolah akan mengonfirmasi detail.")}</li>` : ""}</ul><p class="notice">${T("This is a planning example, not a confirmed event announcement. Calendar download becomes available after a date is set.", "Ini contoh rancangan, bukan pengumuman acara yang sudah dikonfirmasi. Unduhan kalender tersedia setelah tanggal ditetapkan.")}</p>${!internal ? `<a href="#portal" class="btn" onclick="closeModal()">${T("Family Portal", "Portal Keluarga")} ↗</a>` : ""}`,
  );
}
function rsvpForm() {
  openModal(
    T("Confirm Attendance", "Konfirmasi Kehadiran"),
    `<p class="notice">${T("Simulate a response to the draft event. This does not register you for a real event.", "Simulasikan respons untuk draf acara. Tidak mendaftarkan Anda pada acara sungguhan.")}</p><form onsubmit="event.preventDefault();let f=new FormData(this);state.rsvp=f.get('response')+(f.get('response')==='Will Attend'?' · '+f.get('count')+' adult(s)':'');state.rsvpNote=f.get('note');closeModal();render(false)">${select(
      "response",
      T("Your response", "Respons Anda"),
      [
        ["Will Attend", T("Will Attend", "Akan Hadir")],
        ["Unable to Attend", T("Unable to Attend", "Berhalangan")],
      ],
    )}${input("count", T("Number of adults attending", "Jumlah wali yang hadir"), "number", true, "1")}${area("note", T("Optional note", "Catatan opsional"))}<button class="btn">${T("Save Preview Response", "Simpan Respons Simulasi")}</button></form>`,
  );
  document.getElementById("f-count").min = 1;
  document.getElementById("f-count").max = 10;
}
function newsDetail() {
  openModal(
    T("News & Achievements", "Berita & Prestasi"),
    `<span class="badge">${T("Fictional classroom story", "Cerita kelas fiktif")}</span><h3>${T("K2A Builds a Bridge Together", "K2A Membangun Jembatan Bersama")}</h3><p>${T("In this demonstration story, K2A children work in small teams to build a bridge from blocks. They agree on a design, take turns choosing materials and test whether a toy car can cross safely.", "Dalam cerita demonstrasi ini, anak K2A bekerja dalam kelompok kecil membangun jembatan balok. Mereka menyepakati desain, bergiliran memilih bahan, dan menguji apakah mobil mainan dapat melintas.")}</p><p>${T("When one bridge falls, the team widens its base and tries again. Their achievement is the process: listening to a friend, explaining an idea and helping rebuild. Teachers celebrate persistence and cooperation instead of comparing children.", "Ketika satu jembatan roboh, kelompok memperlebar dasarnya lalu mencoba lagi. Pencapaiannya terletak pada proses: mendengarkan teman, menjelaskan ide, dan membantu membangun ulang. Guru menghargai ketekunan dan kerja sama tanpa membandingkan anak.")}</p><p class="notice">${T("Fictional example for the academic project; no real event, competition result or award is claimed.", "Contoh fiktif untuk proyek kuliah; tidak menyatakan kegiatan, hasil lomba, atau penghargaan nyata.")}</p>${state.news.map((x) => `<h3>${esc(x.title)}</h3><p>${esc(x.body)}</p>`).join("")}`,
  );
}
function article(i) {
  const x = SCHOOL_CONTENT.articles[i];
  openModal(
    T(...x.title),
    `<div class="figure-card"><img src="${offlineAsset(`assets/${x.art}.svg`)}" alt="" width="360" height="280"></div><span class="badge">${T("Family learning resource", "Sumber belajar keluarga")}</span><div class="article-body">${x.paragraphs.map((p) => `<p>${T(...p)}</p>`).join("")}</div>`,
  );
}
function privacy() {
  openModal(
    T("Privacy & Photo Permissions", "Privasi & Izin Foto"),
    `<p>${T("Public galleries use photographs approved for publication. Class albums are shared only with verified members of that class; individual documentation is limited to authorised parents and teachers.", "Galeri publik memakai foto dengan izin publikasi. Album kelas hanya untuk anggota kelas terverifikasi; dokumentasi individual terbatas untuk wali dan guru yang berhak.")}</p><p>${T("Teachers communicate through school accounts. Personal phone numbers are not displayed. Sensitive learning and health conversations are kept separate from class groups and finance channels.", "Guru berkomunikasi melalui akun sekolah. Nomor pribadi tidak ditampilkan. Percakapan belajar dan kesehatan sensitif terpisah dari grup kelas dan kanal keuangan.")}</p><p>${T("Google Drive albums require restricted sharing. Families may contact the school to request removal of a photograph.", "Album Google Drive memerlukan berbagi terbatas. Keluarga dapat menghubungi sekolah untuk penarikan foto.")}</p><p class="notice">${T(window.GENYU_LIVE ? "Connected forms are stored in the school database. The separate interactive demo uses temporary fictional data. Account records and files require authorised access." : "This unconnected preview keeps sample messages and forms in temporary memory until refresh. Real account access requires Supabase configuration.", window.GENYU_LIVE ? "Formulir terhubung disimpan dalam database sekolah. Demo interaktif terpisah memakai data fiktif sementara. Data akun dan berkas memerlukan akses berwenang." : "Pratinjau belum terhubung menyimpan pesan dan formulir contoh di memori sampai halaman dimuat ulang. Akun sungguhan membutuhkan konfigurasi Supabase.")}</p>`,
  );
}
function openModal(title, body) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = body;
  let d = document.getElementById("modal");
  if (!d.open) d.showModal();
}
function closeModal() {
  document.getElementById("modal").close();
}
let toastTimer;
function toast(message) {
  let el = document.getElementById("toast");
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 4500);
}
function switchLang() {
  lang = lang === "en" ? "id" : "en";
  try {
    localStorage.setItem("genyu-language", lang);
  } catch (e) {}
  closeModal();
  render(false);
}
function render(scroll = true) {
  let page = location.hash.slice(1) || "home";
  let pages = {
    home,
    about,
    programmes: programmesPage,
    "school-life": schoolLife,
    admissions,
    contact,
    "about-website": aboutWebsite,
    portal,
  };
  if (!pages[page]) page = "home";
  document.documentElement.lang = lang;
  document.title = `Gen-Yu Academy · ${page === "home" ? "Small Steps Today. Confident Leaders Tomorrow." : page.replace("-", " ")}`;
  document.getElementById("app").innerHTML =
    header(page) +
    `<main id="main" tabindex="-1">${pages[page]()}</main>` +
    footer();
  if (scroll) window.scrollTo(0, 0);
  window.dispatchEvent(new Event("genyu:render"));
}
window.addEventListener("hashchange", () => {
  closeModal();
  render();
});
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    const r = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      closeModal();
  }
});
render();
