function learningApproach() {
  return `<div class="grid g3"><article class="card"><h3>IEYC</h3><p>${T("A reference for thematic learning and playful exploration. Children connect stories, questions and discoveries across meaningful experiences.", "Acuan pembelajaran tematik dan eksplorasi bermain. Anak menghubungkan cerita, pertanyaan, dan penemuan melalui pengalaman bermakna.")}</p></article><article class="card"><h3>Cambridge Early Years</h3><p>${T("A reference for holistic, play-based development for the relevant 3–6 age range. Toddler experiences are planned separately around their developmental needs.", "Acuan perkembangan menyeluruh melalui bermain untuk rentang usia 3–6 tahun yang relevan. Pengalaman Toddler disusun tersendiri sesuai kebutuhan perkembangannya.")}</p></article><article class="card"><h3>STEAM</h3><p>${T("An approach connecting science, technology, engineering, arts and mathematics through making, observing, testing and working together.", "Pendekatan yang menghubungkan sains, teknologi, rekayasa, seni, dan matematika melalui berkarya, mengamati, menguji, serta bekerja sama.")}</p></article></div><p class="small muted">${T("This school design refers to these approaches without claiming accreditation, affiliation or provider approval.", "Rancangan sekolah mengacu pada pendekatan tersebut tanpa mengklaim akreditasi, afiliasi, atau pengesahan penyedia.")}</p>`;
}
function sampleTeacherCards() {
  const portraits = [
    "assets/teachers/rahayu.webp",
    "assets/teachers/maya.webp",
    "assets/teachers/bima.webp",
  ];

  const principalCard = `
    <article class="card teacher-card principal-teacher-card">
      <div class="teacher-photo-frame principal-teacher-photo-frame">
        <img class="teacher-photo" src="${offlineAsset("assets/teachers/principal-octavia.webp")}" alt="Octavia Prima Gennuita — ${T("Principal", "Kepala Sekolah")}" loading="lazy" decoding="async">
      </div>
      <div class="teacher-card-copy">
        <span class="badge">${T("School leadership", "Pimpinan sekolah")}</span>
        <h3>Octavia Prima Gennuita</h3>
        <p>${T("Principal", "Kepala Sekolah")}<br>${T("Student ID (NIM)", "NIM")}: 23010684251</p>
        <p class="principal-bio">${T(
          "A passionate student navigating the challenges of university life, one assignment at a time. Dedicated to continuous learning, personal growth, and building a brighter future. Currently working towards becoming a future leader while bravely facing the ultimate academic adventure: completing a thesis. Powered by ambition, determination, endless revisions, and a little hope for graduation day.",
          "Seorang mahasiswa yang sedang menjalani perjalanan akademik dengan semangat untuk terus belajar, berkembang, dan membangun masa depan yang lebih cerah. Berkomitmen untuk menjadi pribadi yang bermanfaat dan calon pemimpin inspiratif. Saat ini, sedang berjuang menyelesaikan misi akademik tingkat akhir, yaitu skripsi, dengan bekal ambisi, tekad, revisi tanpa henti, dan harapan besar untuk segera menyandang gelar sarjana."
        )}</p>
      </div>
    </article>`;

  const teacherCards = SCHOOL_CONTENT.teachers.map((t, i) => `
    <article class="card teacher-card">
      <div class="teacher-photo-frame">
        <img class="teacher-photo" src="${offlineAsset(portraits[i])}" alt="${esc(t.name)} — illustrated teacher portrait" loading="lazy" decoding="async">
      </div>
      <div class="teacher-card-copy">
        <span class="badge">${T("Teaching team", "Tim pengajar")}</span>
        <h3>${t.name}</h3>
        <p>${T(...t.role)}<br>${t.className}</p>
        <p class="small muted">${T(...t.qualification)}</p>
        <p>${T(...t.approach)}</p>
      </div>
    </article>`).join("");

  return `
    <p class="notice">${T(
      "Teacher portraits are character illustrations for this school project. Staff details and qualifications should be confirmed by the school before publication.",
      "Potret guru berupa ilustrasi karakter untuk proyek website ini. Data pendidik dan kualifikasi perlu dikonfirmasi sekolah sebelum dipublikasikan."
    )}</p>
    <div class="grid g4 staff-grid" aria-label="${T("School leadership and teaching team", "Pimpinan sekolah dan tim pengajar")}">
      ${principalCard}${teacherCards}
    </div>`;
}
function facilitiesCards() {
  return `<p class="small muted">${T("Campus design visualisations for Gen-Yu Academy.", "Visualisasi rancangan lingkungan Gen-Yu Academy.")}</p><div class="grid g2 campus-grid">${SCHOOL_CONTENT.facilities.map((f) => `<article class="card campus-card"><img src="${offlineAsset(`assets/campus/${f.image}`)}" alt="${esc(T(...f.title))} — Gen-Yu Academy" width="1672" height="941" loading="lazy" decoding="async"><div class="campus-card-copy"><h3>${T(...f.title)}</h3><p>${T(...f.body)}</p></div></article>`).join("")}</div>`;
}
function signatureCards() {
  return `<section class="section"><div class="wrap"><div class="eyebrow">${T("Our signature programmes", "Program unggulan")}</div><h2>${T("Little steps. Lasting skills.", "Langkah kecil. Bekal bermakna.")}</h2><div class="grid g3">${signatures.map((s, i) => `<article class="card"><span class="num">0${i + 1}</span><h3>${s[0]}</h3><p>${T(s[1], s[2])}</p></article>`).join("")}</div></div></section>`;
}
function programmeLearning(i) {
  const p = SCHOOL_CONTENT.programmes[i];
  return `<h3>${T("Development goals", "Tujuan perkembangan")}</h3><p>${T(...p.goals)}</p><h3>${T("Example activities", "Contoh kegiatan")}</h3><p>${T(...p.examples)}</p>`;
}
function resourceCards() {
  return SCHOOL_CONTENT.articles
    .map(
      (a, i) =>
        `<article class="resource"><img src="${offlineAsset(`assets/${a.art}.svg`)}" alt="" width="100" height="80" loading="lazy"><div><h3>${T(...a.title)}</h3><p>${T(...a.summary)}</p><button class="link" onclick="article(${i})">${T("Read article", "Baca artikel")} ↗</button></div></article>`,
    )
    .join("");
}
function contactDetails() {
  return `<div class="contact-state"><p><strong>${T("School address", "Alamat sekolah")}</strong><br>Gen-Yu Academy<br>Jalan Lidah Wetan, Gang VIII, No. 27<br>Lakarsantri, Surabaya</p><p><strong>${T("Phone", "Telepon")}</strong><br><a href="tel:+62895335786197">089-533-578-6197</a></p></div>`;
}
function admissionDocuments() {
  return `<section class="section"><h2>${T("Documents to prepare", "Dokumen yang perlu disiapkan")}</h2><p class="notice">${T("Proposed checklist only. Admissions must confirm the final requirements. Do not upload identity or health documents through the general enquiry form.", "Daftar rancangan. Tim penerimaan perlu mengonfirmasi persyaratan final. Jangan unggah dokumen identitas atau kesehatan melalui formulir pertanyaan umum.")}</p><ul class="list"><li>${T("Completed registration form and verified guardian contact.", "Formulir pendaftaran dan kontak wali yang terverifikasi.")}</li><li>${T("Child’s identity and proof of date of birth, if requested by the school.", "Identitas anak dan bukti tanggal lahir jika diminta sekolah.")}</li><li>${T("Relevant support information, shared privately through an agreed channel.", "Informasi pendampingan yang relevan melalui saluran privat yang disepakati.")}</li><li>${T("Photo-use and school communication preferences.", "Pilihan izin penggunaan foto serta komunikasi sekolah.")}</li></ul><h3>${T("What happens after an enquiry?", "Apa yang terjadi setelah mengirim permintaan?")}</h3><p>${T("Requests progress through Received, Contacted, Visit Scheduled, Registration in Progress and Completed. The administrator records follow-up and confirms arrangements using the contact you supplied. A preferred date is not a confirmed booking.", "Permintaan melalui status Diterima, Dihubungi, Kunjungan Dijadwalkan, Pendaftaran Diproses, dan Selesai. Admin mencatat tindak lanjut serta mengonfirmasi melalui kontak yang Anda berikan. Tanggal pilihan belum merupakan jadwal pasti.")}</p></section>`;
}
