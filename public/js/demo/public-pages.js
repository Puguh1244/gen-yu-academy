// Visual preview only. In-memory data; independent from the Supabase portal.
function header(page) {
  const labels = [
    ["home", "Home", "Beranda"],
    ["about", "About Us", "Tentang Kami"],
    ["programmes", "Programmes", "Program"],
    ["school-life", "School Life", "Kegiatan"],
    ["admissions", "Admissions", "Pendaftaran"],
    ["contact", "Contact", "Kontak"],
    ["about-website", "About This Website", "Profil Pengembang"],
  ];
  return `<div class="topline">${T("A world of discovery. A childhood full of possibility.", "Dunia penuh penemuan. Masa kecil penuh kemungkinan.")}</div><header class="header"><div class="wrap header-inner">${brand()}<nav class="nav" id="nav" aria-label="${T("Main navigation", "Navigasi utama")}">${labels.map((x) => `<a href="#${x[0]}" class="${page === x[0] ? "active" : ""}" ${page === x[0] ? 'aria-current="page"' : ""}>${T(x[1], x[2])}</a>`).join("")}</nav><div class="tools"><button class="lang" onclick="switchLang()" aria-label="${T("Switch to Bahasa Indonesia", "Ganti ke English")}">${lang === "en" ? "<b>EN</b> / ID" : "EN / <b>ID</b>"}</button><a class="btn compact" href="portal.html">${T("Portal Login", "Masuk Portal")}</a><button class="menu-toggle" aria-controls="nav" aria-expanded="false" onclick="let n=document.getElementById('nav');n.classList.toggle('open');this.setAttribute('aria-expanded',n.classList.contains('open'))">☰</button></div></div></header>`;
}
function footer() {
  return `<footer class="footer"><div class="wrap"><div class="grid"><div><a class="footer-logo" href="#home" aria-label="Gen-Yu Academy"><img class="school-logo" src="${offlineAsset(`assets/gen-yu-academy-logo.png`)}" width="440" height="367" alt="Gen-Yu Academy"></a><p>${T("Growing independent learners and caring young leaders. Small steps, meaningful discoveries, every day.", "Menumbuhkan anak mandiri dan pemimpin yang peduli melalui langkah kecil dan penemuan bermakna setiap hari.")}</p></div><div><b>${T("Explore", "Jelajahi")}</b><a href="#about">${T("About Us & Our Teachers", "Tentang Kami & Guru")}</a><a href="#programmes">${T("Our Programmes", "Program Kami")}</a><a href="#school-life">${T("School Life & Resources", "Kegiatan & Artikel")}</a><a href="#admissions">${T("Admissions & FAQ", "Pendaftaran & FAQ")}</a><a href="portal.html">${T("School Account Portal", "Portal Akun Sekolah")}</a><a href="#portal">${T("Explore Portal Demo", "Coba Demo Portal")}</a></div><div><b>${T("Contact", "Kontak")}</b><p>${T("PGPAUD FIP UNESA, Gedung O6 Lantai 1, Kampus Lidah Wetan, Surabaya 60123 · WhatsApp: 089-533-578-6197", "PGPAUD FIP UNESA, Gedung O6 Lantai 1, Kampus Lidah Wetan, Surabaya 60123 · WhatsApp: 089-533-578-6197")}</p><a href="#contact">${T("Contact the school", "Hubungi sekolah")}</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Gen-Yu Academy</span><button class="link" style="color:#e4eee6" onclick="privacy()">${T("Privacy & Photo Permissions", "Privasi & Izin Foto")}</button><span>${T("Academic project · Fictional demonstration data", "Proyek kuliah · Data demonstrasi fiktif")}</span></div></div></footer>`;
}
function heading(kicker, title, desc = "") {
  return `<div class="page-title"><div class="eyebrow">${kicker}</div><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ""}</div>`;

function programmeCards() {
  const programmeImages = [
    "toddler.jpg",
    "playgroup.jpg",
    "pre-kindergarten.jpg",
    "kindergarten.jpg",
  ];

  const programmeAlts = [
    "Toddler programme photo",
    "Playgroup programme photo",
    "Pre-Kindergarten programme photo",
    "Kindergarten programme photo",
  ];

  return `<div class="grid g4">${programs.map((p, i) => `
    <article class="card programme">
      <img
        class="programme-photo"
        src="${offlineAsset(`assets/programmes/${programmeImages[i]}`)}"
        alt="${programmeAlts[i]}"
        loading="lazy">
      <div class="body">
        <span class="badge">${p[1]} ${T("years · proposed", "tahun · rancangan")}</span>
        <h3>${p[0]}</h3>
        <p>${T(p[2], p[3])}</p>
        <button class="link" onclick="programmeDetail(${i})">${T("Discover programme", "Lihat program")} ↗</button>
      </div>
    </article>`).join("")}</div>`;
}
function eventsCards() {
  return `<div class="grid g3"><article class="card around-school-card"><img class="around-school-image" src="${offlineAsset(`assets/around-school/your-next-chapter.jpg`)}" alt="Parent welcoming child to school" loading="lazy" onerror="this.style.display='none'"><span class="badge">${T("School announcements", "Pengumuman sekolah")}</span><h3>${T("Your next chapter starts here", "Awal perjalanan bersama")}</h3><p class="muted">${T("Explore our early years programmes and enquire about a school visit. Our team will confirm availability.", "Kenali program PAUD dan ajukan kunjungan. Tim sekolah akan mengonfirmasi ketersediaan.")}</p><a class="link" href="#admissions">${T("Visit admissions", "Lihat pendaftaran")} ↗</a></article><article class="card around-school-card"><img class="around-school-image" src="${offlineAsset(`assets/around-school/united-nations-day.jpg`)}" alt="Children celebrating cultural diversity" loading="lazy" onerror="this.style.display='none'"><span class="badge gold">${T("Upcoming event · Draft", "Acara mendatang · Draf")}</span><h3>United Nations Day</h3><p class="muted">${T("A celebration of cultures, friendship, and learning together. Date and venue to be confirmed.", "Perayaan budaya, persahabatan, dan belajar bersama. Tanggal dan lokasi menunggu konfirmasi.")}</p><button class="link" onclick="eventDetail(false)">${T("View event", "Lihat acara")} ↗</button></article><article class="card around-school-card"><img class="around-school-image" src="${offlineAsset(`assets/around-school/meaningful-milestones.jpg`)}" alt="Child celebrating a learning milestone" loading="lazy" onerror="this.style.display='none'"><span class="badge pink">${T("News & achievements", "Berita & prestasi")}</span><h3>${T("Small efforts. Meaningful milestones.", "Usaha kecil. Pencapaian bermakna.")}</h3><p class="muted">${T("A space to celebrate classroom discoveries and verified school achievements.", "Ruang berbagi penemuan di kelas dan prestasi sekolah yang telah dikonfirmasi.")}</p><button class="link" onclick="newsDetail()">${T("Read more", "Baca selengkapnya")} ↗</button></article></div>${state.announcements
    .filter((x) => x.audience === "Public")
    .map(
      (x) =>
        `<article class="card" style="margin-top:20px"><span class="badge">${T("Preview announcement", "Pengumuman simulasi")}</span><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></article>`,
    )
    .join("")}`;
}
function home() {
  return `<div class="wrap"><section class="hero"><div class="hero-copy"><div class="eyebrow">${T("A joyful beginning, a world of possibilities", "Awal yang menyenangkan, penuh kemungkinan")}</div><h1>${T("Small Steps Today.<br><em>Confident Leaders</em><br>Tomorrow.", "Langkah Kecil Hari Ini.<br><em>Pemimpin Percaya Diri</em><br>Esok Hari.")}</h1><p>${T("At Gen-Yu Academy, every child has room to explore, grow, and shine. Through playful learning and everyday discoveries, we nurture independence, curiosity, and the confidence to take small steps forward.", "Di Gen-Yu Academy, setiap anak memiliki ruang untuk bereksplorasi, tumbuh, dan bersinar. Melalui bermain dan penemuan sehari-hari, kami menumbuhkan kemandirian, rasa ingin tahu, dan percaya diri.")}</p><div class="actions"><a class="btn" href="#programmes">${T("Explore Our Programmes", "Jelajahi Program")} ↗</a><a class="btn secondary" href="#admissions">${T("Book a School Visit", "Ajukan Kunjungan")}</a></div><p class="small" style="margin-top:25px">Toddler · Playgroup · Pre-Kindergarten · Kindergarten</p></div><figure class="hero-campus"><img src="${offlineAsset(`assets/campus/school-building.png`)}" alt="${T("Gen-Yu Academy school building surrounded by tropical greenery", "Gedung sekolah Gen-Yu Academy dengan tanaman tropis")}" width="1672" height="941" fetchpriority="high"><figcaption><strong>${T("A place for little discoveries.", "Tempat untuk penemuan kecil.")}</strong><span>${T("Our campus · Design visualisation", "Lingkungan sekolah · Visualisasi rancangan")}</span><a class="link" href="#about">${T("Explore our facilities", "Jelajahi fasilitas kami")} ↗</a></figcaption></figure></section></div><div class="curriculum"><div class="wrap"><small>${T("A connected approach to whole-child development", "Pendekatan terpadu untuk perkembangan menyeluruh")}</small><span>IEYC</span><span>Cambridge Early Years</span><span>STEAM</span></div></div><section class="section"><div class="wrap"><div class="section-head"><div><div class="eyebrow">${T("Stay connected", "Tetap terhubung")}</div><h2>${T("Around our school", "Kabar dari sekolah")}</h2></div><p>${T("The latest updates, moments, and things to look forward to.", "Informasi terbaru, cerita, dan kegiatan yang dinantikan.")}</p></div>${eventsCards()}</div></section>${signatureCards()}<section class="section feature"><div class="wrap"><div class="section-head"><div><div class="eyebrow">${T("Every age, a new adventure", "Setiap usia, petualangan baru")}</div><h2>${T("Room to grow, at every step.", "Ruang tumbuh di setiap langkah.")}</h2></div><a class="link" href="#programmes">${T("All programmes", "Semua program")} ↗</a></div>${programmeCards()}</div></section><section class="section"><div class="wrap split"><div><div class="eyebrow">${T("The Gen-Yu way", "Cara belajar Gen-Yu")}</div><h2>${T("A Place to Belong.<br>A Space to Grow.", "Tempat untuk Diterima.<br>Ruang untuk Bertumbuh.")}</h2><p class="muted">${T("Every child arrives with their own interests, abilities, and ways of understanding the world. We welcome these differences and create opportunities for children to learn at their own pace, build friendships, and feel proud of their progress.", "Setiap anak memiliki minat, kemampuan, dan cara memahami dunia yang unik. Kami menghargai perbedaan dan memberi ruang untuk belajar sesuai ritmenya, berteman, dan bangga atas perkembangannya.")}</p><a class="link" href="#about">${T("Get to know us", "Kenali kami")} ↗</a></div><div><h3>${T("Growing Independence, Every Day", "Menumbuhkan Kemandirian Setiap Hari")}</h3><p class="muted">${T("Choosing an activity, putting away belongings, asking for help, and caring for shared spaces are meaningful steps towards independence. Our teachers offer guidance while giving children time to try things for themselves.", "Memilih kegiatan, merapikan barang, meminta bantuan, dan menjaga ruang bersama merupakan langkah menuju kemandirian. Guru mendampingi sambil memberi waktu anak mencoba sendiri.")}</p><h3>${T("Learning to Lead with Care", "Belajar Memimpin dengan Peduli")}</h3><p class="muted">${T("Leadership begins with everyday kindness and responsibility. Children practise sharing ideas, listening to others, taking turns, and helping their friends. We help them discover that being a leader also means being thoughtful, cooperative, and willing to learn.", "Kepemimpinan dimulai dari kebaikan dan tanggung jawab. Anak berlatih berbagi ide, mendengarkan, bergiliran, dan membantu teman. Memimpin juga berarti peduli, bekerja sama, dan mau belajar.")}</p></div></div></section><section class="section" style="padding-top:0"><div class="wrap"><div class="big-quote split"><div><div class="eyebrow">${T("Every language journey is welcome", "Setiap perjalanan bahasa diterima")}</div><h2>${T("New to English?<br>You Are Welcome Here.", "Baru Mengenal Bahasa Inggris?<br>Kamu Diterima di Sini.")}</h2></div><div><p>${T("Your child does not need to speak English before joining us. English is our main language of learning, supported by stories, songs, visual cues, gestures, and familiar routines. Bahasa Indonesia is used when needed to help children feel secure, understood, and ready to participate.", "Anak tidak harus sudah bisa bahasa Inggris. Bahasa Inggris menjadi bahasa utama pembelajaran dengan dukungan cerita, lagu, gambar, gerak, dan rutinitas. Bahasa Indonesia digunakan jika dibutuhkan agar anak merasa aman, dipahami, dan siap berpartisipasi.")}</p><a href="#admissions" class="btn gold">${T("Let’s take the first step", "Mulai langkah pertama")} ↗</a></div></div></div></section>`;
}
function about() {
  return `<div class="wrap">${heading(T("About us", "Tentang kami"), T("A childhood full<br>of possibility.", "Masa kecil yang penuh<br>kemungkinan."))}<div class="split"><div><h3>${T("Welcome to Gen-Yu Academy", "Selamat Datang di Gen-Yu Academy")}</h3><p>${T("Gen-Yu Academy is an English-medium early years school with an international outlook. We offer Toddler, Playgroup, Pre-Kindergarten, and Kindergarten programmes that nurture children’s development through play, exploration, and meaningful relationships.", "Gen-Yu Academy adalah sekolah PAUD berbahasa pengantar Inggris dengan wawasan internasional. Jenjang Toddler, Playgroup, Pre-Kindergarten, dan Kindergarten mendukung perkembangan melalui bermain, eksplorasi, dan hubungan bermakna.")}</p><p>${T("Our learning approach combines IEYC, Cambridge Early Years, and STEAM, with experiences adapted to each age group. We support children’s language, thinking, physical development, creativity, and social and emotional growth.", "Pendekatan kami memadukan IEYC, Cambridge Early Years, dan STEAM sesuai kelompok usia. Kami mendukung bahasa, berpikir, fisik, kreativitas, serta perkembangan sosial dan emosional.")}</p><p>${T("We believe independence grows through practice and encouragement. Children have opportunities to make choices, solve everyday problems, and take responsibility in ways that match their stage of development.", "Kami percaya kemandirian tumbuh melalui latihan dan dukungan. Anak belajar memilih, menyelesaikan masalah sehari-hari, dan bertanggung jawab sesuai perkembangannya.")}</p><p>${T("Families are an essential part of this journey. Through regular communication and shared observations, we work together to understand each child and support their next steps.", "Keluarga menjadi bagian penting perjalanan ini. Melalui komunikasi dan pengamatan bersama, kami memahami setiap anak dan mendukung langkah berikutnya.")}</p></div><div class="big-quote"><div class="eyebrow">${T("Our vision", "Visi kami")}</div><h2>${T("To nurture curious, independent, and compassionate children who approach learning with confidence and lead with care.", "Menumbuhkan anak yang ingin tahu, mandiri, dan peduli, yang belajar dengan percaya diri serta memimpin dengan kepedulian.")}</h2></div></div><section class="section"><div class="section-head"><h2>${T("Our mission", "Misi kami")}</h2><span class="eyebrow">${T("Growing with purpose", "Bertumbuh dengan tujuan")}</span></div><div class="grid g3">${missions.map((m, i) => `<div class="card"><span class="num">0${i + 1}</span><p>${T(...m)}</p></div>`).join("")}</div></section><section class="section" style="padding-top:0"><div class="section-head"><div><div class="eyebrow">Our Teachers</div><h2>${T("People who help<br>little minds grow.", "Pendamping tumbuhnya<br>pikiran kecil.")}</h2></div><p>${T("Meet the people who support your child’s learning. Get to know each educator’s background, classroom role, and approach.", "Kenali pendidik yang mendampingi anak, latar belakang, peran kelas, dan pendekatan mengajarnya.")}</p></div>${window.schoolTeacherCards ? window.schoolTeacherCards() : sampleTeacherCards()}<div class="spacer"></div><h3>${T("Our learning environment", "Lingkungan belajar kami")}</h3><p class="muted">${T("Explore our school building, classroom, playground and library, designed around play, curiosity and growing independence.", "Kenali gedung sekolah, ruang kelas, area bermain, dan perpustakaan yang dirancang untuk bermain, membangun rasa ingin tahu, dan menumbuhkan kemandirian.")}</p>${facilitiesCards()}</section><section class="section"><h2>${T("Our learning approach", "Pendekatan pembelajaran")}</h2>${learningApproach()}</section></div>`;
}
function programmesPage() {
  return `<div class="wrap">${heading(T("Our programmes", "Program kami"), T("A little more curious.<br>A little more independent.", "Semakin ingin tahu.<br>Semakin mandiri."), T("Thoughtfully planned experiences for every stage of early childhood.", "Pengalaman belajar yang disusun untuk setiap tahap usia dini."))}${programmeCards()}<section class="section"><div class="grid g2">${programs.map((p, i) => `<article class="card"><h2>${p[0]}</h2><span class="badge">${p[1]} ${T("years · proposed", "tahun · rancangan")}</span><p>${T(p[4], p[5])}</p>${programmeLearning(i)}</article>`).join("")}</div></section><p class="notice">${T("Age ranges are proposed, not yet approved. Placement, school days, and class hours are confirmed with Admissions.", "Rentang usia masih berupa rancangan, belum disahkan. Penempatan, hari belajar, dan jam kelas dikonfirmasi dengan tim penerimaan.")}</p><section class="section"><div class="section-head"><div><div class="eyebrow">${T("Our signature programmes", "Program unggulan")}</div><h2>${T("Big possibilities<br>for little learners.", "Kemungkinan besar<br>untuk pembelajar kecil.")}</h2></div></div><div class="grid g3">${signatures.map((s, i) => `<article class="card"><span class="num">0${i + 1}</span><h3>${s[0]}</h3><p class="muted">${T(s[1], s[2])}</p></article>`).join("")}</div><p class="small muted" style="margin-top:20px">${T("All programmes are adapted to each age group and use materials suitable and safe for young children.", "Seluruh program disesuaikan dengan usia dan menggunakan bahan yang sesuai serta aman bagi anak.")}</p></section><section class="section" style="padding-top:0"><div class="big-quote"><div class="eyebrow">${T("Our learning approach", "Pendekatan pembelajaran")}</div><h2>${T("Connected Learning for Growing Minds", "Pembelajaran Terhubung untuk Anak yang Bertumbuh")}</h2>${learningApproach()}<p>${T("We bring together IEYC, Cambridge Early Years, and STEAM to create connected learning experiences. Themes and playful exploration invite curiosity, while age-appropriate experiences support development across different areas of learning.", "Kami memadukan IEYC, Cambridge Early Years, dan STEAM untuk pengalaman belajar terhubung. Tema dan eksplorasi bermain mengundang rasa ingin tahu, dengan kegiatan yang sesuai usia.")}</p><p>${T("Through science, technology, engineering, the arts, and mathematics, children investigate, build, create, and try again. Everyday routines give them opportunities to practise independence and care for others.", "Melalui sains, teknologi, rekayasa, seni, dan matematika, anak menyelidiki, membangun, berkarya, dan mencoba kembali. Rutinitas memberi kesempatan berlatih mandiri dan peduli.")}</p><a class="btn gold" href="#admissions">${T("Book a School Visit", "Ajukan Kunjungan")} ↗</a></div><p class="small muted" style="margin-top:15px">${T("Curriculum references are adapted to age and development; they do not imply an accreditation or affiliation claim.", "Acuan pembelajaran disesuaikan usia dan perkembangan; penyebutannya tidak menunjukkan klaim akreditasi atau afiliasi.")}</p></section></div>`;
}
function schoolLife() {
  const cats = [
    ["all", "All", "Semua"],
    [
      "steam",
      "Exploration & STEAM",
      "Eksplorasi & STEAM",
      "Building a block bridge, testing ideas and making discoveries together.",
      "Membangun jembatan balok, menguji ide, dan menemukan hal baru bersama.",
    ],
    [
      "art",
      "Art & Creativity",
      "Seni & Kreativitas",
      "Exploring colours and expressing ideas through painting.",
      "Mengenal warna dan mengekspresikan ide melalui kegiatan melukis.",
    ],
    [
      "independent",
      "Independence",
      "Kemandirian",
      "Putting away belongings and practising everyday independence with teacher support.",
      "Menyimpan perlengkapan sendiri dan berlatih mandiri dengan pendampingan guru.",
    ],
    [
      "together",
      "Togetherness",
      "Kebersamaan",
      "Sharing puzzle pieces, taking turns and solving a challenge with friends.",
      "Berbagi kepingan puzzle, bergiliran, dan menyelesaikan tantangan bersama teman.",
    ],
  ];
  return `<div class="wrap">${heading(T("School Life", "Kegiatan Sekolah"), T("Little moments.<br>Lasting discoveries.", "Momen kecil.<br>Penemuan bermakna."), T("Take a look at a day of learning at Gen-Yu Academy. Everyday routines give children opportunities to practise independence, cooperation, and care.", "Lihat keseharian belajar di Gen-Yu Academy. Rutinitas memberi kesempatan berlatih mandiri, bekerja sama, dan peduli."))}<h2>${T("A Day at Gen-Yu", "Sehari di Gen-Yu")}</h2><div class="timeline">${day.map((x) => `<article class="step"><h3>${T(x[0], x[1])}</h3><p>${T(x[2], x[3])}</p></article>`).join("")}</div><p class="small muted">${T("Illustrative daily sequence. Times, duration, rest, and support are adjusted for each age group.", "Contoh urutan harian. Waktu, durasi, istirahat, dan pendampingan disesuaikan setiap jenjang.")}</p><section class="section"><div class="split"><div><div class="eyebrow">${T("Parent Partnership", "Kemitraan Orang Tua")}</div><h2>${T("Growing together,<br>school and home.", "Tumbuh bersama,<br>sekolah dan keluarga.")}</h2><p>${T("We work closely with families to support every child. The Parent Portal brings together progress updates, photos, weekly activities, messages, fee information, and absence reports.", "Kami bermitra dengan keluarga untuk mendukung setiap anak. Portal menyatukan perkembangan, foto, tugas mingguan, pesan, informasi biaya, dan laporan izin.")}</p><a class="btn" href="portal.html">${T("Explore Parent Portal", "Jelajahi Portal Orang Tua")} ↗</a></div><div class="card"><h3>${T("Getting Ready for School", "Persiapan Sebelum Sekolah")}</h3><ul class="list"><li>${T("A change of clothes and a water bottle.", "Pakaian ganti dan botol minum.")}</li><li>${T("Clearly labelled personal belongings.", "Perlengkapan pribadi berlabel nama.")}</li><li>${T("Share health and support needs privately with the school.", "Sampaikan kesehatan dan kebutuhan pendampingan secara privat.")}</li><li>${T("Introduce familiar routines and allow time to adjust.", "Kenalkan rutinitas dan beri waktu beradaptasi.")}</li></ul></div></div></section><section class="section" style="padding-top:0"><h2>${T("Announcements & Calendar", "Pengumuman & Kalender")}</h2>${eventsCards()}</section><section class="section" style="padding-top:0"><div class="section-head"><div><div class="eyebrow">${T("A glimpse of learning", "Sekilas pembelajaran")}</div><h2>${T("Our gallery", "Galeri kami")}</h2></div><p>${T("Illustrations of exploration, creativity, independence and learning together.", "Ilustrasi eksplorasi, kreativitas, kemandirian, dan belajar bersama.")}</p></div><div class="filters">${cats.map((c) => `<button aria-pressed="${galleryFilter === c[0]}" class="${galleryFilter === c[0] ? "active" : ""}" onclick="galleryFilter='${c[0]}';render(false)">${T(c[1], c[2])}</button>`).join("")}</div><div class="grid g4 activity-gallery">${cats
    .slice(1)
    .filter((c) => galleryFilter === "all" || galleryFilter === c[0])
    .map(
      (c) =>
        `<article class="card activity-card"><img class="activity-photo" src="${offlineAsset(`assets/activities/${c[0]}.png`)}" alt="${T(c[3], c[4])}" width="1086" height="1448" loading="lazy" decoding="async"><div class="activity-copy"><span class="badge">${T("Activity illustration", "Ilustrasi kegiatan")}</span><h3>${T(c[1], c[2])}</h3><p class="small muted">${T(c[3], c[4])}</p></div></article>`,
    )
    .join(
      "",
    )}</div><p class="small muted">${T("Class and individual albums are accessed separately through the portal. Contact the school to request removal of a photograph.", "Album kelas dan individual diakses terpisah melalui portal. Hubungi sekolah untuk permintaan penarikan foto.")}</p></section><section class="section" style="padding-top:0"><h2>${T("Little ideas for home", "Ide kecil untuk di rumah")}</h2>${resourceCards()}</section></div>`;
}
function input(name, label, type = "text", required = true, value = "") {
  return `<div class="field"><label for="f-${name}">${label}${required ? " *" : ""}</label><input id="f-${name}" name="${name}" type="${type}" ${required ? "required" : ""} value="${esc(value)}"></div>`;
}
function select(name, label, options) {
  return `<div class="field"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${options.map((o) => `<option value="${esc(Array.isArray(o) ? o[0] : o)}">${esc(Array.isArray(o) ? o[1] : o)}</option>`).join("")}</select></div>`;
}
function area(name, label, required = false, value = "") {
  return `<div class="field"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" ${required ? "required" : ""}>${esc(value)}</textarea></div>`;
}
function enquiryForm() {
  return `<form onsubmit="submitEnquiry(event)"><div class="grid g2">${input("name", T("Parent or guardian name", "Nama orang tua atau wali"))}${input("email", T("Email address", "Alamat email"), "email")}${input("phone", T("Phone number", "Nomor telepon"), "tel")}${select(
    "programme",
    T("Interested programme", "Program yang diminati"),
    programs.map((p) => p[0]),
  )}${input("age", T("Child’s age (years)", "Usia anak (tahun)"), "number")}${input("date", T("Preferred visit date (request only)", "Tanggal kunjungan yang diinginkan"), "date", false)}</div>${area("message", T("Your question", "Pertanyaan Anda"))}<label class="check"><input type="checkbox" name="consent" required> <span>${T("I agree that the school may use these contact details to respond to this enquiry.", "Saya setuju sekolah menggunakan kontak ini untuk menanggapi permintaan.")}</span></label><p class="notice">${T("Preview form: this saves a demonstration request for this session only. Nothing is sent to the school. Operational contact information is awaiting verification.", "Formulir pratinjau: permintaan simulasi disimpan hanya selama sesi. Tidak dikirim ke sekolah. Informasi kontak operasional menunggu verifikasi.")}</p><button class="btn" type="submit">${T("Save Preview Enquiry", "Simpan Simulasi Permintaan")} ↗</button></form>`;
}
function admissions() {
  const steps = [
    [
      "Explore the Programme",
      "Kenali Program",
      "Find the programme that matches your child’s stage and needs.",
      "Kenali jenjang sesuai tahap perkembangan dan kebutuhan anak.",
    ],
    [
      "Submit an Enquiry",
      "Ajukan Pertanyaan",
      "Tell us your contact details, your child’s age, and your preferred programme.",
      "Sampaikan kontak, usia anak, dan program yang diminati.",
    ],
    [
      "Visit the School",
      "Kunjungi Sekolah",
      "Our team will confirm your visit. Trial classes are subject to availability.",
      "Tim mengonfirmasi kunjungan. Trial mengikuti ketersediaan layanan.",
    ],
    [
      "Discuss Your Child’s Needs",
      "Diskusikan Kebutuhan Anak",
      "Talk privately about language, settling in, and support.",
      "Diskusikan bahasa, adaptasi, dan pendampingan secara privat.",
    ],
    [
      "Complete Registration",
      "Lengkapi Pendaftaran",
      "Receive confirmed availability, fees, hours, and required documents.",
      "Terima informasi tempat, biaya, jadwal, dan dokumen resmi.",
    ],
    [
      "Receive Confirmation",
      "Terima Konfirmasi",
      "Once admission is complete, receive your family’s portal access.",
      "Setelah penerimaan selesai, keluarga memperoleh akses portal.",
    ],
  ];
  return `<div class="wrap">${heading(T("Admissions", "Pendaftaran"), T("Let’s take the<br>first step together.", "Mari mulai<br>langkah pertama."), T("We look forward to getting to know your child and your family.", "Kami menantikan kesempatan mengenal anak dan keluarga Anda."))}<div class="timeline">${steps.map((x) => `<article class="step"><h3>${T(x[0], x[1])}</h3><p>${T(x[2], x[3])}</p></article>`).join("")}</div><section class="section"><h2>${T("Find your starting point", "Temukan langkah awal")}</h2><div class="table-wrap"><table><thead><tr><th>${T("Programme", "Program")}</th><th>${T("Age guide", "Panduan usia")}</th><th>${T("School days & hours", "Hari & jam belajar")}</th></tr></thead><tbody>${programs.map((p) => `<tr><td>${p[0]}</td><td>${p[1]} ${T("years", "tahun")}</td><td>${T("To be confirmed by Admissions", "Dikonfirmasi tim penerimaan")}</td></tr>`).join("")}</tbody></table></div><p class="small muted">${T("Ages are a proposed guide; final cut-off dates and placement are confirmed by the school. A visit request does not confirm enrolment. Fees, documents and places are provided by Admissions.", "Usia merupakan panduan usulan; batas tanggal dan penempatan ditetapkan sekolah. Permintaan kunjungan tidak berarti diterima sebagai siswa. Biaya, dokumen, dan tempat dikonfirmasi tim penerimaan.")}</p></section><section class="section" style="padding-top:0"><div class="split" style="align-items:start"><div><div class="eyebrow">${T("Start a conversation", "Mulai percakapan")}</div><h2>${T("Book a school visit.", "Ajukan kunjungan sekolah.")}</h2><p class="muted">${T("Choose a preferred date and tell us which programme interests you. The school will confirm the arrangements.", "Pilih tanggal yang diinginkan dan program yang diminati. Sekolah akan mengonfirmasi pengaturannya.")}</p><a class="link" href="#contact">${T("Contact our admissions team", "Hubungi tim penerimaan")} ↗</a></div><div class="card">${enquiryForm()}</div></div></section><section class="section" style="padding-top:0">${admissionDocuments()}<div class="eyebrow">FAQ</div><h2>${T("A few things you may wonder.", "Hal yang mungkin ingin Anda ketahui.")}</h2>${faqs.map((f) => `<details><summary>${T(f[0], f[1])}</summary><p>${T(f[2], f[3])}</p></details>`).join("")}</section></div>`;
}
function aboutWebsite() {
  const contributors = [
    {
      index: "01",
      label: T("Developer", "Pengembang"),
      name: "Octavia Prima Gennuita",
      detail: "23010584251",
      description: T(
        "Student of the S1 Early Childhood Teacher Education Study Programme, Universitas Negeri Surabaya.",
        "Mahasiswa S1 Pendidikan Guru Pendidikan Anak Usia Dini, Universitas Negeri Surabaya."
      )
    },
    {
      index: "02",
      label: T("Academic Supervisor", "Dosen Pembimbing"),
      name: "Fatiha Khoirotunnisa Elfahmi, M.Ed., M.Pd"
    },
    {
      index: "03",
      label: T("Course", "Mata Kuliah"),
      name: "Edu-Tech for Young Children"
    },
    {
      index: "04",
      label: T("Website Development Support", "Dukungan Pengembangan Website"),
      name: "Mr PSW"
    }
  ];
  return `<div class="wrap about-website-page">
    <section class="about-website-intro" aria-labelledby="about-website-title">
      <div class="eyebrow">${T("Behind the website", "Di balik website")}</div>
      <h1 id="about-website-title">${T("About This Website", "Profil Pengembang")}</h1>
      <p>${T(
        "People and academic context behind the development of the Gen-Yu Academy website.",
        "Pengembang dan konteks akademik di balik pembuatan website Gen-Yu Academy."
      )}</p>
    </section>
    <section class="about-website-grid" aria-label="${T("Project contributors", "Kontributor proyek")}">
      ${contributors.map(person => `<article class="about-website-card">
        <span class="about-website-number" aria-hidden="true">${person.index}</span>
        <div class="eyebrow">${person.label}</div>
        <h2>${person.name}</h2>
        ${person.detail ? `<p class="about-website-id">${person.detail}</p>` : ""}
        ${person.description ? `<p class="about-website-description">${person.description}</p>` : ""}
      </article>`).join("")}
    </section>
  </div>`;
}

function contact() {
  const mapsUrl = "https://maps.app.goo.gl/wE2TXmyovp334FoD7";
  return `<div class="wrap contact-page"><section class="contact-layout" aria-labelledby="contact-title"><div class="contact-location"><a class="contact-brand" href="#home" aria-label="Gen-Yu Academy"><img src="${offlineAsset(`assets/gen-yu-academy-logo.png`)}" width="440" height="367" alt="Gen-Yu Academy"></a><figure class="contact-map"><iframe src="https://maps.google.com/maps?q=-7.3026065%2C112.6712849&z=17&output=embed" title="${T("Map of PGPAUD FIP Universitas Negeri Surabaya", "Peta PGPAUD FIP Universitas Negeri Surabaya")}" width="613" height="484" style="display:block;width:100%;height:484px;border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><figcaption><a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${T("Open in Google Maps", "Buka di Google Maps")} ↗</a></figcaption></figure></div><div class="contact-information"><div class="eyebrow">${T("Let’s connect", "Mari terhubung")}</div><h1 id="contact-title">${T("Contact Gen-Yu Academy", "Kontak Gen-Yu Academy")}</h1><p class="contact-programmes">Toddler · Playgroup · Pre-K · Kindergarten</p><dl class="contact-list"><div><dt>${T("Office", "Alamat")}</dt><dd>PGPAUD FIP UNESA, Gedung O6 Lantai 1,<br>Kampus Lidah Wetan, Surabaya 60123</dd></div><div><dt>WhatsApp / WA</dt><dd><a href="https://wa.me/62895335786197" target="_blank" rel="noopener noreferrer">089-533-578-6197</a></dd></div><div><dt>${T("Phone", "Telepon")}</dt><dd><a href="tel:+62895335786197">089-533-578-6197</a></dd></div></dl><a class="btn contact-whatsapp" href="https://wa.me/62895335786197" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.5-4.6A8.5 8.5 0 1 1 20.5 11.6Z"/><path d="M8.1 7.3c-.8 1-.4 3.1 1.3 4.9s3.9 2.9 5.1 2.2l1.2-1.2-2.5-1.4-.9.9c-1.2-.5-2.2-1.5-2.8-2.7l.9-.9-1.3-2.3Z"/></svg>${T("CHAT GEN-YU ACADEMY", "CHAT GEN-YU ACADEMY")}</a><p class="small muted contact-help">${T("Ask about our programmes, admissions or a school visit.", "Tanyakan program, pendaftaran, atau kunjungan sekolah.")}</p></div></section><section class="contact-enquiry" aria-labelledby="enquiry-title"><div><div class="eyebrow">${T("We’re here to help", "Kami siap membantu")}</div><h2 id="enquiry-title">${T("Send an enquiry", "Ajukan pertanyaan")}</h2><p class="muted">${T("Tell us a little about your family and what you would like to know.", "Ceritakan sedikit tentang keluarga Anda dan informasi yang ingin diketahui.")}</p></div><div class="card">${enquiryForm()}</div></section></div>`;
}
