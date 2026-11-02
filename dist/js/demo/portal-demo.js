// Visual preview only. In-memory data; independent from the Supabase portal.
const menu = {
  parent: [
    ["dashboard", "Dashboard", "Beranda"],
    ["progress", "My Child’s Progress", "Perkembangan Anak"],
    ["calendar", "Calendar", "Kalender"],
    ["announcements", "Announcements", "Pengumuman"],
    ["class", "Class Chat", "Chat Kelas"],
    ["private", "Private Messages", "Pesan Pribadi"],
    ["absence", "Report an Absence", "Izin Tidak Hadir"],
    ["activities", "Weekly Activities", "Kegiatan Mingguan"],
    ["albums", "Photo Albums", "Album Foto"],
    ["fees", "Fees and Payments", "Biaya & Pembayaran"],
    ["account", "Account", "Akun"],
  ],
  teacher: [
    ["dashboard", "Dashboard", "Beranda"],
    ["classes", "My Classes", "Kelas Saya"],
    ["progress", "Child Progress", "Perkembangan Anak"],
    ["calendar", "Class Schedule", "Jadwal Kelas"],
    ["class", "Class Chat", "Chat Kelas"],
    ["private", "Private Messages", "Pesan Pribadi"],
    ["absence", "Absence Reports", "Laporan Izin"],
    ["activities", "Weekly Activities", "Kegiatan Mingguan"],
    ["submissions", "Submissions", "Pengumpulan Tugas"],
    ["albums", "Photo Albums", "Album Foto"],
    ["announcements", "Announcements", "Pengumuman"],
  ],
  admin: [
    ["dashboard", "Dashboard", "Beranda"],
    ["accounts", "Accounts and Classes", "Akun & Kelas"],
    ["public", "Public Website", "Website Publik"],
    ["teachers", "Teacher Profiles", "Profil Guru"],
    ["admissions", "Admissions", "Penerimaan"],
    ["announcements", "Announcements and Events", "Pengumuman & Acara"],
    ["responses", "Responses", "Respons"],
    ["news", "News", "Berita"],
    ["fees", "Fees and Payments", "Biaya & Pembayaran"],
    ["verification", "Verification", "Verifikasi"],
    ["access", "Access Settings", "Pengaturan Akses"],
  ],
};
function portal() {
  if (!role)
    return `<div class="wrap">${heading(T("School portal", "Portal sekolah"), T("One community.<br>Connected every day.", "Satu komunitas.<br>Terhubung setiap hari."), T("A shared space for families, teachers, and school administration.", "Ruang bersama untuk keluarga, guru, dan administrasi sekolah."))}<div class="notice">${T("INTERACTIVE PREVIEW · These are demonstration roles, not real logins. Use fictional information only. Entries remain in memory until this page is refreshed; no data is sent to school.", "PRATINJAU INTERAKTIF · Pilihan ini merupakan simulasi peran, bukan login sungguhan. Gunakan data fiktif. Isian hanya tersimpan selama halaman tidak dimuat ulang; tidak dikirim ke sekolah.")}</div><section class="section" style="padding-top:25px"><div class="grid g3">${[
      [
        "parent",
        "Parent Portal",
        "Portal Orang Tua",
        "Follow your child’s day, connect with teachers, and manage activities.",
        "Pantau keseharian anak, hubungi guru, dan kelola kegiatan.",
      ],
      [
        "teacher",
        "Teacher Portal",
        "Portal Guru",
        "Support your class, share progress, and guide weekly learning.",
        "Dampingi kelas, bagikan perkembangan, dan kelola pembelajaran.",
      ],
      [
        "admin",
        "Admin Portal",
        "Portal Admin",
        "Manage admissions, school information, accounts, and fee administration.",
        "Kelola penerimaan, informasi sekolah, akun, dan administrasi biaya.",
      ],
    ]
      .map(
        (r, i) =>
          `<article class="card"><span class="num">0${i + 1}</span><h3>${T(r[1], r[2])}</h3><p class="muted">${T(r[3], r[4])}</p>${button(T("Explore preview", "Buka simulasi"), `enterPortal('${r[0]}')`)}</article>`,
      )
      .join(
        "",
      )}</div><p class="notice">${T("The operational website requires verified accounts and server-side access controls. This HTML file is a design and workflow prototype, not a secure system for real student records.", "Website operasional memerlukan akun terverifikasi dan kontrol akses di server. File HTML ini adalah prototipe tampilan dan alur, bukan sistem aman untuk data siswa sungguhan.")}</p></section></div>`;
  if (!menu[role].some((x) => x[0] === tab)) tab = "dashboard";
  const item = menu[role].find((x) => x[0] === tab);
  return `<div class="demo-bar">${T("INTERACTIVE PREVIEW · Fictional records only · Session-only changes · Not a real school account", "SIMULASI INTERAKTIF · Hanya data fiktif · Perubahan selama sesi · Bukan akun sekolah sungguhan")}</div><div class="portal-layout"><aside class="sidebar"><h3>${T(role === "parent" ? "Parent Portal" : role === "teacher" ? "Teacher Portal" : "Admin Portal", role === "parent" ? "Portal Orang Tua" : role === "teacher" ? "Portal Guru" : "Portal Admin")}</h3><div class="side-links">${menu[role].map((m) => `<button class="${tab === m[0] ? "active" : ""}" onclick="setTab('${m[0]}')" ${tab === m[0] ? 'aria-current="page"' : ""}>${T(m[1], m[2])}</button>`).join("")}<button onclick="logout()">↩ ${T("Exit preview", "Keluar simulasi")}</button></div></aside><div class="portal-main"><div class="portal-top"><div><div class="eyebrow">Gen-Yu Academy</div><h1>${T(item[1], item[2])}</h1><span class="small muted">${role === "admin" ? T("School operations overview", "Ringkasan operasional sekolah") : T("Sample Child · Kindergarten K2A", "Anak Contoh · Kindergarten K2A")}</span></div>${role !== "admin" ? `<select aria-label="${T("Child or class", "Anak atau kelas")}"><option>${role === "parent" ? T("Sample Child · K2A", "Anak Contoh · K2A") : "Kindergarten K2A"}</option></select>` : ""}</div>${portalContent()}</div></div>`;
}
function setTab(v) {
  tab = v;
  render(false);
}
function enterPortal(r) {
  role = r;
  tab = "dashboard";
  render();
}
function logout() {
  role = null;
  tab = "dashboard";
  render();
}
function cardLink(title, desc, destination, num) {
  return `<article class="card"><span class="badge">${num}</span><h3>${title}</h3><p>${desc}</p><button class="link" onclick="setTab('${destination}')">${T("Open", "Buka")} ↗</button></article>`;
}
function dashboard() {
  if (role === "parent")
    return `<div class="actions" style="margin-bottom:25px">${button(T("Report an Absence", "Izin Tidak Hadir"), "setTab('absence')")}${button(T("Messages", "Pesan"), "setTab('private')", true)}</div><div class="grid g2 dashboard">${cardLink(T("Important Announcements", "Pengumuman Penting"), T("United Nations Day · Draft event. Read the details and explore the response flow.", "United Nations Day · Draf acara. Baca detail dan coba alur respons."), "announcements", "01")}${cardLink(T("Today’s Schedule", "Jadwal Hari Ini"), T("Explore the planned daily learning routine.", "Lihat rencana rutinitas belajar harian."), "calendar", "02")}${cardLink(T("Messages", "Pesan"), T("Class updates and private conversations with your teacher.", "Kabar kelas dan percakapan privat dengan guru."), "private", "03")}${cardLink(T("Activity Deadlines", "Tenggat Kegiatan"), state.activities.length ? `${state.activities.length} ${T("activities available", "kegiatan tersedia")}` : T("Try the “My Independent Morning” sample activity.", "Coba kegiatan contoh “Pagi Mandiriku”."), "activities", "04")}${cardLink(T("Fees Due", "Tagihan"), state.invoices.length ? `${state.invoices.filter((i) => i.status !== "Paid").length} ${T("unpaid preview invoices", "tagihan simulasi belum lunas")}` : T("No invoices have been entered in this preview.", "Belum ada tagihan di simulasi ini."), "fees", "05")}${cardLink(T("Latest Progress and Photos", "Perkembangan & Foto Terbaru"), T("Read shared observations and view album information.", "Baca pengamatan yang dibagikan dan informasi album."), "progress", "06")}</div>`;
  const a =
    role === "teacher"
      ? [
          ["Class Schedule", "Jadwal Kelas", "calendar"],
          ["Absence Reports", "Laporan Izin", "absence"],
          ["Private Messages", "Pesan Pribadi", "private"],
          ["Submissions to Review", "Tugas untuk Ditinjau", "submissions"],
          ["Create Weekly Activity", "Buat Kegiatan Mingguan", "activities"],
          [
            "Update Progress / Photos",
            "Perbarui Perkembangan / Foto",
            "progress",
          ],
        ]
      : [
          ["Admission Enquiries", "Permintaan Pendaftaran", "admissions"],
          ["Announcement Responses", "Respons Pengumuman", "responses"],
          ["Event Attendance", "Kehadiran Acara", "responses"],
          [
            "Payments to Verify",
            "Pembayaran untuk Diverifikasi",
            "verification",
          ],
          ["Publish School News", "Terbitkan Berita", "news"],
          ["Manage Accounts / Access", "Kelola Akun / Akses", "accounts"],
        ];
  return `<div class="grid g2 dashboard">${a.map((x, i) => cardLink(T(x[0], x[1]), T("Open and manage this part of your school workspace.", "Buka dan kelola bagian ini di ruang kerja sekolah."), x[2], "0" + (i + 1))).join("")}</div>${role === "teacher" ? `<p class="notice">${T("Teacher workspace includes learning and class communication. Financial information is not part of this role.", "Ruang guru mencakup pembelajaran dan komunikasi kelas. Informasi keuangan tidak tersedia bagi peran guru.")}</p>` : ""}`;
}
function portalContent() {
  switch (tab) {
    case "dashboard":
      return dashboard();
    case "class":
    case "private":
      return chatPage(tab);
    case "calendar":
      return calendarPage();
    case "announcements":
      return announcementsPage();
    case "progress":
      return progressPage();
    case "absence":
      return absencePage();
    case "activities":
      return activitiesPage();
    case "submissions":
      return submissionsPage();
    case "albums":
      return albumsPage();
    case "fees":
    case "verification":
      return feesPage();
    case "admissions":
      return admissionsAdmin();
    case "responses":
      return responsesPage();
    case "accounts":
      return adminRecords("accounts");
    case "teachers":
      return adminRecords("teachers");
    case "news":
      return adminRecords("news");
    case "classes":
      return `<div class="card"><span class="badge">${T("Assigned sample class", "Contoh kelas yang diampu")}</span><h2>Kindergarten K2A</h2><p>${T("Child: Sample Child. Only the assigned class is shown in this preview.", "Anak: Anak Contoh. Hanya kelas yang diampu ditampilkan dalam simulasi.")}</p>${button(T("View Child Progress", "Lihat Perkembangan"), "setTab('progress')")}</div>`;
    case "public":
      return `<div class="grid g2">${cardLink(T("School information", "Informasi sekolah"), T("Review public pages in this prototype. Static school copy is edited in the HTML file.", "Tinjau halaman publik. Naskah sekolah statis diedit di file HTML."), "announcements", "01")}${cardLink(T("News & achievements", "Berita & prestasi"), T("Create a preview news entry and review publication details.", "Buat berita simulasi dan periksa detail publikasinya."), "news", "02")}</div><div class="spacer"></div><a class="btn secondary" href="#home">${T("View public website", "Lihat website publik")} ↗</a>`;
    case "access":
      return accessPage();
    case "account":
      return accountPage();
    default:
      return "";
  }
}
function empty(text) {
  return `<div class="empty">${text}</div>`;
}
function chatPage(kind) {
  const privateChat = kind === "private";
  return `<div class="card"><span class="badge">${privateChat ? T("Parent ↔ Assigned class teacher", "Orang tua ↔ Guru kelas") : T("Kindergarten K2A · Class group", "Kindergarten K2A · Grup kelas")}</span><h3>${privateChat ? T("A private space for your child’s needs", "Ruang privat untuk kebutuhan anak") : T("Our classroom conversation", "Percakapan kelas kita")}</h3><p class="small muted">${T("School accounts only. Teachers’ personal phone numbers are not shown.", "Hanya akun sekolah. Nomor pribadi guru tidak ditampilkan.")}</p>${!privateChat ? `<div class="notice">${T("Pinned: please label your child’s water bottle and belongings. Share health or personal information through Private Messages.", "Disematkan: beri nama pada botol dan perlengkapan anak. Sampaikan informasi kesehatan atau pribadi melalui Pesan Pribadi.")}</div>` : ""}${role === "teacher" && !privateChat ? `<label class="check"><input type="checkbox" ${state.readonly ? "checked" : ""} onchange="state.readonly=this.checked;render(false)">${T("Only teachers may post to this group", "Hanya guru yang boleh mengirim ke grup")}</label>` : ""}<div class="chat" aria-live="polite">${state.messages[kind].length ? state.messages[kind].map((m) => `<div class="bubble ${m.role === role ? "mine" : ""}"><small>${m.role === "parent" ? T("Sample Parent", "Orang Tua Contoh") : T("Class Teacher", "Guru Kelas")} · ${esc(m.time)}</small><p>${esc(m.text)}</p></div>`).join("") : empty(T("No preview messages yet. Start a conversation using fictional information.", "Belum ada pesan simulasi. Mulai percakapan menggunakan data fiktif."))}</div>${state.readonly && role === "parent" && !privateChat ? `<p class="notice">${T("This group is currently set to teacher-only announcements.", "Grup sedang dalam mode pengumuman khusus guru.")}</p>` : `<form class="chat-form" onsubmit="sendChat(event,'${kind}')"><input name="message" required aria-label="${T("Message", "Pesan")}" placeholder="${T("Write a preview message…", "Tulis pesan simulasi…")}" maxlength="2000"><button class="btn" type="submit">${T("Send preview", "Kirim simulasi")} ↗</button></form>`}<p class="small muted" style="margin-top:15px">${T("Messages stay in this browser session. No teacher receives a notification.", "Pesan hanya berada di sesi browser ini. Tidak ada notifikasi kepada guru.")}</p></div>`;
}
function sendChat(e, k) {
  e.preventDefault();
  const text = new FormData(e.target).get("message").trim();
  if (!text) return;
  state.messages[k].push({
    text,
    role,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  render(false);
}
function calendarPage() {
  return `<div class="card"><span class="badge">${T("Planned daily sequence", "Rencana urutan harian")}</span><h3>A Day at Gen-Yu</h3><ul class="list">${day.map((x) => `<li><b>${T(x[0], x[1])}</b><br><span class="muted small">${T(x[2], x[3])}</span></li>`).join("")}</ul><p class="notice">${T("Class hours and event dates have not been confirmed. No actual appointment is booked from this schedule.", "Jam kelas dan tanggal acara belum dikonfirmasi. Jadwal ini tidak membuat janji temu sungguhan.")}</p></div><div class="spacer"></div>${state.schedule.map((x) => `<div class="card"><h3>${esc(x.title)}</h3><p>${esc(x.date)} · ${esc(x.time)}</p><p>${esc(x.note)}</p></div>`).join("")}${role === "teacher" ? button(T("Add Class Activity", "Tambah Kegiatan Kelas"), "recordForm('schedule')") : ""}`;
}
function announcementsPage() {
  return `<article class="card"><span class="badge gold">${T("Event template · Date not confirmed", "Contoh acara · Tanggal belum dikonfirmasi")}</span><h2>United Nations Day</h2><p>${T("Children will explore cultures, share classroom activities, and celebrate friendship. Parent attendance: Required.", "Anak mengenal budaya, berbagi kegiatan kelas, dan merayakan persahabatan. Kehadiran orang tua: Wajib.")}</p><p class="muted">${T("Date, venue, arrival time, finish time, and preparation will be confirmed by the school.", "Tanggal, lokasi, jam kedatangan, jam selesai, dan perlengkapan dikonfirmasi sekolah.")}</p><div class="actions">${button(T("View Details", "Lihat Detail"), "eventDetail(true)", true)}${role === "parent" ? `<button class="btn ${state.ack ? "secondary" : ""}" onclick="state.ack=true;toast(T('Acknowledgement recorded in preview.','Konfirmasi membaca dicatat di simulasi.'));render(false)">${state.ack ? T("✓ Acknowledged", "✓ Sudah Dibaca") : T("I Have Read This", "Saya Sudah Membaca")}</button>${button(T("Confirm Attendance", "Konfirmasi Kehadiran"), "rsvpForm()", true)}` : ""}</div>${state.rsvp ? `<p class="small" style="margin-top:15px">${T("Preview response", "Respons simulasi")}: ${esc(state.rsvp)}</p>` : ""}</article><div class="spacer"></div>${state.announcements.map((x) => `<div class="card"><span class="badge">${esc(x.audience)}</span><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></div>`).join("")}${role === "admin" ? button(T("Create Announcement / Event", "Buat Pengumuman / Acara"), "recordForm('announcements')") : ""}`;
}
function progressPage() {
  const rows =
    role === "parent"
      ? state.progress.filter((x) => x.status === "Shared")
      : state.progress;
  return `${role === "teacher" ? button(T("Add Progress Observation", "Tambah Catatan Perkembangan"), "recordForm('progress')") : ""}<div class="spacer"></div>${rows.length ? rows.map((x) => `<article class="card"><span class="badge">${esc(x.status)}</span><h3>${esc(x.title)}</h3><p class="small muted">${esc(x.date)} · ${esc(x.area)}</p><p>${esc(x.observation)}</p><h3>${T("Support & next steps", "Dukungan & langkah berikutnya")}</h3><p>${esc(x.support)}</p><p>${esc(x.home)}</p>${role === "teacher" && x.status === "Draft" ? button(T("Share with Parent", "Bagikan kepada Orang Tua"), `shareProgress('${x.id}')`) : ""}</article>`).join("") : empty(T("No observations shared yet. Teachers can add a draft and share it with the sample parent.", "Belum ada catatan dibagikan. Guru dapat membuat draf dan membagikannya kepada orang tua contoh."))}<p class="notice">${T("Progress notes describe observations and support needs. Children are not compared or ranked.", "Catatan perkembangan berisi pengamatan dan kebutuhan dukungan. Anak tidak dibandingkan atau diperingkat.")}</p>`;
}
function shareProgress(id) {
  const x = state.progress.find((x) => x.id === id);
  if (x) x.status = "Shared";
  render(false);
}
function absencePage() {
  return `${role === "parent" ? button(T("Report an Absence", "Laporkan Izin Tidak Hadir"), "absenceForm()") : ""}<div class="spacer"></div>${state.absences.length ? state.absences.map((x) => `<article class="card"><span class="badge">${esc(x.status)}</span><h3>${esc(x.from)} — ${esc(x.to)}</h3><p>${esc(x.reason)}</p><p>${esc(x.note)}</p><div class="actions">${role === "teacher" && x.status === "Sent" ? button(T("Acknowledge", "Tandai Diterima"), `ackAbsence('${x.id}')`) : ""}${role === "parent" && x.status !== "Cancelled" ? `${button(T("Edit", "Ubah"), `absenceForm('${x.id}')`, true)}${button(T("Cancel report", "Batalkan laporan"), `cancelAbsence('${x.id}')`, true)}` : ""}</div><p class="small muted">${T("History", "Riwayat")}: ${esc(x.history.join(" → "))}</p></article>`).join("") : empty(T("No absence reports in this preview.", "Belum ada laporan izin di simulasi ini."))}<p class="notice">${T("A sent report is not automatically acknowledged. Reasons are not posted in the class group, and a report does not set actual attendance.", "Laporan terkirim tidak otomatis diterima guru. Alasan tidak tampil di grup dan laporan tidak menetapkan kehadiran aktual.")}</p>`;
}
function absenceForm(id) {
  const x = state.absences.find((x) => x.id === id) || {};
  openModal(
    T("Report an Absence", "Izin Tidak Hadir"),
    `<form onsubmit="saveAbsence(event,'${id || ""}')"><p>${T("Child: Sample Child · K2A", "Anak: Anak Contoh · K2A")}</p><div class="grid g2">${input("from", T("Date From", "Tanggal Mulai"), "date", true, x.from || "")}${input("to", T("Date To", "Tanggal Selesai"), "date", true, x.to || "")}</div>${select(
      "reason",
      T("Reason", "Alasan"),
      [
        ["Unwell", T("Unwell", "Sakit")],
        ["Family Matter", T("Family Matter", "Keperluan Keluarga")],
        ["Other", T("Other", "Lainnya")],
      ],
    )}${area("note", T("Note to Teacher (fictional information only)", "Catatan untuk Guru (hanya data fiktif)"), false, x.note || "")}<button class="btn" type="submit">${T("Send Preview Report", "Kirim Laporan Simulasi")}</button></form>`,
  );
  if (x.reason) document.getElementById("f-reason").value = x.reason;
}
function saveAbsence(e, id) {
  e.preventDefault();
  let v = Object.fromEntries(new FormData(e.target));
  if (v.to < v.from) {
    toast(
      T(
        "End date must not be before start date.",
        "Tanggal selesai tidak boleh sebelum mulai.",
      ),
    );
    return;
  }
  let x = state.absences.find((x) => x.id === id);
  if (x) {
    Object.assign(x, v, { status: "Sent" });
    x.history.push("Updated");
  } else
    state.absences.push({ ...v, id: uid(), status: "Sent", history: ["Sent"] });
  closeModal();
  toast(
    T(
      "Preview report saved. Awaiting teacher acknowledgement.",
      "Laporan simulasi disimpan. Menunggu konfirmasi guru.",
    ),
  );
  render(false);
}
function ackAbsence(id) {
  let x = state.absences.find((x) => x.id === id);
  x.status = "Acknowledged";
  x.history.push("Acknowledged");
  render(false);
}
function cancelAbsence(id) {
  let x = state.absences.find((x) => x.id === id);
  x.status = "Cancelled";
  x.history.push("Cancelled");
  render(false);
}
function activitiesPage() {
  return `${role === "teacher" ? button(T("Create Weekly Activity", "Buat Kegiatan Mingguan"), "recordForm('activities')") : ""}<div class="spacer"></div><article class="card"><span class="badge">${T("Sample activity", "Contoh kegiatan")}</span><h3>${T("My Independent Morning", "Pagi Mandiriku")}</h3><p>${T("Practise preparing a school bag and water bottle with support when needed.", "Berlatih menyiapkan tas sekolah dan botol minum dengan bantuan seperlunya.")}</p><p><b>${T("Goal:", "Tujuan:")}</b> ${T("Independence and responsibility.", "Kemandirian dan tanggung jawab.")}<br><b>${T("Materials:", "Bahan:")}</b> ${T("Bag, bottle, and labelled belongings.", "Tas, botol, dan perlengkapan berlabel nama.")}<br><b>${T("Parent’s role:", "Peran orang tua:")}</b> ${T("Offer prompts and allow time to try.", "Beri petunjuk dan waktu untuk mencoba.")}<br><b>${T("Submission:", "Pengumpulan:")}</b> ${T("A short note or a photo of the prepared bag. A child’s face is not required.", "Catatan singkat atau foto tas yang siap. Wajah anak tidak wajib.")}<br><b>${T("Due:", "Tenggat:")}</b> ${T("Not yet scheduled", "Belum dijadwalkan")}</p>${role === "parent" ? button(T("Open Activity / Submit", "Buka Kegiatan / Kumpulkan"), "submissionForm('sample')") : ""}</article><div class="spacer"></div>${state.activities.map((x) => `<article class="card"><span class="badge">K2A · ${esc(x.due)}</span><h3>${esc(x.title)}</h3><p>${esc(x.goal)}</p><p>${esc(x.instructions)}</p><p><b>${T("Materials", "Bahan")}:</b> ${esc(x.materials)}</p><p><b>${T("Parent support", "Pendampingan")}:</b> ${esc(x.parent)}</p><p><b>${T("Submission format", "Bentuk hasil")}:</b> ${esc(x.format)}</p>${role === "parent" ? button(T("Submit Activity", "Kumpulkan Tugas"), `submissionForm('${x.id}')`) : ""}</article>`).join("")}`;
}
function submissionForm(id) {
  let s = state.submissions.find((x) => x.activity === id) || {};
  let a = state.activities.find((x) => x.id === id);
  openModal(
    a ? esc(a.title) : T("My Independent Morning", "Pagi Mandiriku"),
    `<form onsubmit="saveSubmission(event,'${id}')"><span class="badge">${esc(s.status || "Not Started")}</span>${s.feedback ? `<p class="notice">${T("Teacher feedback", "Umpan balik guru")}: ${esc(s.feedback)}</p>` : ""}${area("note", T("Activity notes", "Catatan kegiatan"), true, s.note || "")}${input("file", T("Optional attachment (preview filename only)", "Lampiran opsional (hanya nama file simulasi)"), "file", false)}<p class="small muted">${T("The file is not uploaded or retained. Its name is displayed only in this session.", "Berkas tidak diunggah atau disimpan. Namanya hanya ditampilkan selama sesi.")}</p><div class="actions"><button class="btn secondary" type="submit" name="status" value="Draft">${T("Save Draft", "Simpan Draf")}</button><button class="btn" type="submit" name="status" value="Submitted">${T("Submit Preview", "Kumpulkan Simulasi")}</button></div></form>`,
  );
}
function saveSubmission(e, id) {
  e.preventDefault();
  let f = new FormData(e.target),
    file = f.get("file"),
    a = state.activities.find((x) => x.id === id);
  if (a?.due && new Date(a.due + "T23:59:59") < new Date()) {
    toast(
      T(
        "The activity deadline has passed. Ask your teacher for an extension.",
        "Tenggat sudah lewat. Hubungi guru untuk perpanjangan.",
      ),
    );
    return;
  }
  let v = {
    activity: id,
    note: f.get("note"),
    file: file?.name || "",
    status: e.submitter.value,
    at: new Date().toLocaleString(),
  };
  let x = state.submissions.find((x) => x.activity === id);
  if (x) Object.assign(x, v);
  else state.submissions.push({ ...v, id: uid() });
  closeModal();
  toast(
    T(
      "Activity saved in this preview session.",
      "Kegiatan disimpan di sesi simulasi.",
    ),
  );
  render(false);
}
function submissionsPage() {
  return state.submissions.filter((x) => x.status !== "Draft").length
    ? state.submissions
        .filter((x) => x.status !== "Draft")
        .map(
          (x) =>
            `<article class="card"><span class="badge">${esc(x.status)}</span><h3>${esc(state.activities.find((a) => a.id === x.activity)?.title || "My Independent Morning")}</h3><p>${esc(x.note)}</p><p class="small muted">${esc(x.file || T("No attachment", "Tanpa lampiran"))} · ${esc(x.at)}</p>${x.feedback ? `<p>${esc(x.feedback)}</p>` : ""}${button(T("Review & Give Feedback", "Tinjau & Beri Umpan Balik"), `reviewSubmission('${x.id}')`)}</article>`,
        )
        .join("")
    : empty(
        T(
          "No submitted activities to review. Parent drafts are not shown here.",
          "Belum ada tugas terkumpul. Draf orang tua tidak ditampilkan di sini.",
        ),
      );
}
function reviewSubmission(id) {
  openModal(
    T("Review Activity", "Tinjau Kegiatan"),
    `<form onsubmit="event.preventDefault();let f=new FormData(this);Object.assign(state.submissions.find(x=>x.id==='${id}'),{feedback:f.get('feedback'),status:f.get('status')});closeModal();render(false)">${area("feedback", T("Feedback", "Umpan balik"), true)}${select("status", T("Status", "Status"), ["Reviewed", "Needs Revision"])}<button class="btn">${T("Save Review", "Simpan Tinjauan")}</button></form>`,
  );
}
function albumsPage() {
  return `<p class="notice">${T("Class albums and individual albums are separate. A real Google Drive folder must use Restricted sharing for verified accounts. No live album is connected in this prototype.", "Album kelas dan individual terpisah. Folder Google Drive sungguhan harus memakai berbagi Restricted ke akun terverifikasi. Prototipe belum terhubung album sungguhan.")}</p>${role === "teacher" ? button(T("Add Album Information", "Tambah Informasi Album"), "recordForm('albums')") : ""}<div class="spacer"></div>${state.albums.length ? `<div class="grid g2">${state.albums.map((x) => `<article class="card"><div class="gallery-art">${scene}</div><span class="badge">${esc(x.scope)}</span><h3>${esc(x.title)}</h3><p>${esc(x.date)}</p><p>${esc(x.description)}</p><button class="btn secondary" onclick="toast(T('Preview only. Connect a school-owned, restricted Drive folder before enabling album access.','Hanya simulasi. Hubungkan folder Drive milik sekolah dengan akses terbatas sebelum membuka album.'))">${T("Album Access Details", "Detail Akses Album")}</button></article>`).join("")}</div>` : empty(T("No approved albums yet. Teacher can add sample album information.", "Belum ada album berizin. Guru dapat menambah informasi album contoh."))}`;
}
function money(v) {
  return new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);
}
function feesPage() {
  if (role === "teacher")
    return empty(
      T(
        "Access unavailable for this role.",
        "Akses tidak tersedia untuk peran ini.",
      ),
    );
  let rows =
    tab === "verification"
      ? state.invoices.filter((x) => x.status === "Awaiting Verification")
      : state.invoices;
  return `${role === "admin" ? button(T("Create Preview Invoice", "Buat Tagihan Simulasi"), "recordForm('invoices')") : ""}<p class="notice">${T("No actual fees are assumed. This module uses only invoices entered for the preview. Receipt selection does not mark an invoice as paid.", "Tidak ada nominal biaya yang diasumsikan. Modul hanya memakai tagihan yang dimasukkan saat simulasi. Memilih bukti bayar tidak membuat tagihan lunas.")}</p>${rows.length ? rows.map((x) => `<article class="card"><span class="badge">${esc(x.status)}${x.status !== "Paid" && new Date(x.due) < new Date() ? " · Overdue" : ""}</span><h3>${esc(x.title)}</h3><p>${esc(x.number)} · ${esc(x.period)} · Sample Child / K2A</p><h2>${money(x.amount - (x.paid || 0))}</h2><p>${T("Due", "Jatuh tempo")}: ${esc(x.due)}<br>${T("Total", "Total")}: ${money(x.amount)} · ${T("Verified payment", "Pembayaran terverifikasi")}: ${money(x.paid)}</p>${x.receipt ? `<p class="small">${T("Preview receipt filename", "Nama bukti simulasi")}: ${esc(x.receipt)}</p>` : ""}${x.reason ? `<p>${esc(x.reason)}</p>` : ""}<div class="actions">${button(T("View Invoice", "Lihat Tagihan"), `invoiceDetail('${x.id}')`, true)}${role === "parent" && x.status !== "Paid" && x.status !== "Awaiting Verification" ? button(T("Add Payment Evidence", "Tambahkan Bukti Bayar"), `receiptForm('${x.id}')`) : ""}${role === "admin" && x.status === "Awaiting Verification" ? button(T("Verify Payment", "Verifikasi Pembayaran"), `verifyForm('${x.id}')`) : ""}</div></article>`).join("") : empty(T("No invoices available in this view.", "Belum ada tagihan pada tampilan ini."))}${role === "parent" || role === "admin" ? `<div class="spacer"></div>${button(T("Finance Messages", "Pesan Administrasi"), "financeChat()", true)}` : ""}`;
}
function invoiceDetail(id) {
  let x = state.invoices.find((x) => x.id === id);
  openModal(
    T("Preview Invoice", "Tagihan Simulasi"),
    `<span class="badge">${esc(x.status)}</span><h3>${esc(x.number)} · ${esc(x.title)}</h3><p>Sample Child · K2A<br>${esc(x.period)}</p><p>${T("Amount", "Jumlah")}: ${money(x.amount)}<br>${T("Verified", "Terverifikasi")}: ${money(x.paid)}<br>${T("Balance", "Sisa")}: ${money(x.amount - (x.paid || 0))}<br>${T("Due", "Jatuh tempo")}: ${esc(x.due)}</p>${x.history?.length ? `<h3>${T("Verification History", "Riwayat Verifikasi")}</h3>${x.history.map((h) => `<p class="small">${esc(h.date)} · ${money(h.amount)} · ${esc(h.decision)}<br>${esc(h.note)}</p>`).join("")}` : ""}<p class="notice">${T("Payment instructions are provided by school administration. No bank account or live payment service is configured in this preview.", "Petunjuk pembayaran diberikan administrasi sekolah. Tidak ada rekening atau layanan pembayaran aktif dalam simulasi.")}</p>`,
  );
}
function receiptForm(id) {
  openModal(
    T("Payment Evidence", "Bukti Pembayaran"),
    `<form onsubmit="saveReceipt(event,'${id}')">${input("amount", T("Payment amount (IDR)", "Jumlah pembayaran (Rp)"), "number")}${input("file", T("Receipt filename preview", "Simulasi berkas bukti"), "file")}<p class="notice">${T("Use a dummy file only. File contents are not uploaded or stored.", "Gunakan berkas contoh. Isi berkas tidak diunggah atau disimpan.")}</p><button class="btn">${T("Submit for Preview Verification", "Ajukan Verifikasi Simulasi")}</button></form>`,
  );
}
function saveReceipt(e, id) {
  e.preventDefault();
  let f = new FormData(e.target),
    x = state.invoices.find((x) => x.id === id),
    amount = Number(f.get("amount"));
  if (amount <= 0 || amount > x.amount - (x.paid || 0)) {
    toast(
      T(
        "Enter a positive amount no greater than the outstanding balance.",
        "Masukkan jumlah positif tidak melebihi sisa tagihan.",
      ),
    );
    return;
  }
  x.receipt = f.get("file").name;
  x.pending = amount;
  x.status = "Awaiting Verification";
  closeModal();
  render(false);
}
function verifyForm(id) {
  let x = state.invoices.find((x) => x.id === id);
  openModal(
    T("Verify Payment", "Verifikasi Pembayaran"),
    `<p>${esc(x.number)} · ${money(x.pending)}</p><form onsubmit="verifyPayment(event,'${id}')">${select(
      "decision",
      T("Decision", "Keputusan"),
      [
        ["accept", T("Accept", "Terima")],
        ["reject", T("Reject", "Tolak")],
      ],
    )}${area("reason", T("Verification note", "Catatan verifikasi"), true)}<button class="btn">${T("Save Verification", "Simpan Verifikasi")}</button></form>`,
  );
}
function verifyPayment(e, id) {
  e.preventDefault();
  let f = new FormData(e.target),
    x = state.invoices.find((x) => x.id === id);
  x.reason = f.get("reason");
  (x.history || (x.history = [])).push({
    date: new Date().toLocaleString(),
    amount: x.pending,
    decision: f.get("decision"),
    note: x.reason,
  });
  if (f.get("decision") === "accept")
    x.paid = (Number(x.paid) || 0) + Number(x.pending);
  x.status =
    x.paid >= Number(x.amount)
      ? "Paid"
      : x.paid > 0
        ? "Partially Paid"
        : "Unpaid";
  x.pending = 0;
  closeModal();
  render(false);
}
function financeChat() {
  if (role === "teacher") return;
  openModal(
    T("Contact Administration", "Hubungi Administrasi"),
    `<p>${T("Finance channel · Parent and administration only.", "Kanal keuangan · Hanya orang tua dan administrasi.")}</p>${state.messages.finance.map((x) => `<div class="bubble"><p>${esc(x.sender || "Parent")} · ${esc(x.text)}</p></div>`).join("")}<form onsubmit="event.preventDefault();state.messages.finance.push({sender:role,text:new FormData(this).get('text')});financeChat()">${area("text", T("Preview message", "Pesan simulasi"), true)}<button class="btn">${T("Save Preview Message", "Simpan Pesan Simulasi")}</button></form>`,
  );
}
function admissionsAdmin() {
  return state.enquiries.length
    ? state.enquiries
        .map(
          (x) =>
            `<article class="card"><span class="badge">${esc(x.status)}</span><h3>${esc(x.name)}</h3><p>${esc(x.programme)} · ${esc(x.age)} ${T("years", "tahun")}<br>${esc(x.email)} · ${esc(x.phone)}</p><p>${esc(x.message)}</p><p>${T("Requested visit", "Permintaan kunjungan")}: ${esc(x.date || "—")}</p><label class="small" for="status-${x.id}">${T("Update status", "Perbarui status")}</label><select id="status-${x.id}" onchange="state.enquiries.find(x=>x.id==='${x.id}').status=this.value;toast(T('Preview status updated.','Status simulasi diperbarui.'))">${["Received", "Contacted", "Visit Scheduled", "Registration in Progress", "Completed"].map((s) => `<option ${s === x.status ? "selected" : ""}>${s}</option>`).join("")}</select></article>`,
        )
        .join("")
    : empty(
        T(
          "No enquiries in this session. Try the preview form on the Admissions page.",
          "Belum ada permintaan pada sesi ini. Coba formulir simulasi di halaman Pendaftaran.",
        ),
      );
}
function responsesPage() {
  return `<div class="card"><h3>United Nations Day · ${T("Preview responses", "Respons simulasi")}</h3><div class="table-wrap"><table><thead><tr><th>${T("Child / family", "Anak / keluarga")}</th><th>${T("Acknowledgement", "Konfirmasi membaca")}</th><th>${T("Attendance", "Kehadiran")}</th></tr></thead><tbody><tr><td>Sample Child · K2A</td><td>${state.ack ? "Acknowledged" : "Awaiting Acknowledgement"}</td><td>${esc(state.rsvp || "No response")}<br>${esc(state.rsvpNote)}</td></tr></tbody></table></div><p class="notice">${T("Reading acknowledgement and event attendance are separate. A material event change requires a new confirmation.", "Konfirmasi membaca dan kehadiran terpisah. Perubahan penting acara memerlukan konfirmasi ulang.")}</p>${button(T("Simulate Event Change", "Simulasikan Perubahan Acara"), "state.responseHistory.push({date:new Date().toLocaleString(),ack:state.ack,rsvp:state.rsvp,note:state.rsvpNote});state.ack=false;state.rsvp='';state.rsvpNote='';toast(T('Confirmation reset for the updated event.','Konfirmasi direset untuk acara yang diperbarui.'));render(false)", true)}${state.responseHistory.length ? `<h3 style="margin-top:24px">${T("Previous Event Responses", "Riwayat Respons Acara")}</h3>${state.responseHistory.map((x) => `<p class="small">${esc(x.date)} · ${x.ack ? "Acknowledged" : "Not acknowledged"} · ${esc(x.rsvp || "No RSVP")}<br>${esc(x.note)}</p>`).join("")}` : ""}</div>`;
}
function adminRecords(kind) {
  const title =
    kind === "teachers"
      ? T("Add Teacher Profile", "Tambah Profil Guru")
      : kind === "accounts"
        ? T("Add Sample Account", "Tambah Akun Contoh")
        : T("Draft School News", "Draf Berita Sekolah");
  return `${button(title, `recordForm('${kind}')`)}<div class="spacer"></div>${state[kind].length ? state[kind].map((x) => `<article class="card"><span class="badge">${T("Preview record", "Data simulasi")}</span><h3>${esc(x.title || x.name)}</h3><p>${esc(x.body || x.approach || x.role)}</p><p class="small muted">${esc(x.class || x.date || "")}</p></article>`).join("") : empty(T("No records yet. Add fictional information to explore this workflow.", "Belum ada data. Tambahkan informasi fiktif untuk mencoba alur."))}${kind === "accounts" ? `<p class="notice">${T("Adding a preview record does not create a login. Operational accounts require school verification, role assignment, and server-side controls.", "Menambah data simulasi tidak membuat login. Akun operasional memerlukan verifikasi sekolah, penugasan peran, dan kontrol server.")}</p>` : ""}`;
}
function accessPage() {
  return `<div class="card"><h3>${T("Role permissions", "Hak akses peran")}</h3><div class="table-wrap"><table><thead><tr><th>${T("Information", "Informasi")}</th><th>Parent</th><th>Teacher</th><th>Admin</th></tr></thead><tbody><tr><td>${T("Child progress", "Perkembangan anak")}</td><td>${T("Own child", "Anak sendiri")}</td><td>${T("Assigned class", "Kelas diampu")}</td><td>—</td></tr><tr><td>${T("Learning messages", "Pesan pembelajaran")}</td><td>${T("Participant only", "Peserta saja")}</td><td>${T("Participant only", "Peserta saja")}</td><td>—</td></tr><tr><td>${T("Invoices", "Tagihan")}</td><td>${T("Own child", "Anak sendiri")}</td><td>—</td><td>${T("Manage", "Kelola")}</td></tr><tr><td>${T("Public content & admissions", "Konten publik & penerimaan")}</td><td>${T("View / enquire", "Lihat / ajukan")}</td><td>${T("View / propose", "Lihat / usulkan")}</td><td>${T("Manage", "Kelola")}</td></tr></tbody></table></div><p class="notice">${T("This static prototype demonstrates different menus. It does not enforce real authentication or server-side privacy. Do not enter confidential data.", "Prototipe statis memperagakan menu berbeda. Belum ada autentikasi dan privasi di server. Jangan masukkan data rahasia.")}</p><p>${T("Operational requirements: verify parent–child relationships and teacher assignments; revoke access on class changes; restrict Drive folders; log sensitive actions; define retention, backups, and account recovery.", "Kebutuhan operasional: verifikasi relasi wali–anak dan penugasan guru; cabut akses saat pindah kelas; batasi folder Drive; catat tindakan sensitif; tetapkan retensi, pencadangan, dan pemulihan akun.")}</p></div>`;
}
function accountPage() {
  return `<div class="card"><h3>${T("Your preferences", "Preferensi Anda")}</h3><p>${T("Language", "Bahasa")}: ${lang === "en" ? "English" : "Bahasa Indonesia"}</p>${button(T("Switch to Bahasa Indonesia", "Ganti ke English"), "switchLang()", true)}<label class="check"><input type="checkbox" ${state.notifications ? "checked" : ""} onchange="state.notifications=this.checked;toast(T('Preview preference updated. No external notifications are sent.','Preferensi simulasi diperbarui. Tidak ada notifikasi eksternal.'))">${T("Activity and event notifications (preview preference)", "Notifikasi kegiatan dan acara (preferensi simulasi)")}</label><p>${T("Notification previews should not display sensitive health or financial information.", "Pratinjau notifikasi tidak menampilkan rincian kesehatan atau keuangan.")}</p></div>`;
}
const schemas = {
  activities: [
    ["title", "Activity title", "Judul kegiatan"],
    ["goal", "Development goal", "Tujuan perkembangan"],
    ["instructions", "Instructions", "Petunjuk", "area"],
    ["materials", "Materials", "Bahan"],
    ["parent", "Parent’s role", "Peran pendamping"],
    ["format", "Expected submission", "Bentuk hasil"],
    ["due", "Due date", "Tenggat", "date"],
  ],
  progress: [
    ["title", "Activity observed", "Kegiatan yang diamati"],
    ["date", "Observation date", "Tanggal pengamatan", "date"],
    ["area", "Development area", "Area perkembangan"],
    [
      "observation",
      "What the child is beginning to master",
      "Hal yang mulai dikuasai",
      "area",
    ],
    ["support", "Support needed", "Dukungan yang dibutuhkan", "area"],
    ["home", "Suggested home activity", "Saran kegiatan rumah", "area"],
  ],
  albums: [
    ["title", "Album title", "Judul album"],
    ["date", "Activity date", "Tanggal kegiatan", "date"],
    ["description", "Description", "Deskripsi", "area"],
  ],
  schedule: [
    ["title", "Class activity", "Kegiatan kelas"],
    ["date", "Date", "Tanggal", "date"],
    ["time", "Time", "Waktu", "time"],
    ["note", "Preparation / note", "Persiapan / catatan", "area"],
  ],
  announcements: [
    ["title", "Title", "Judul"],
    [
      "body",
      "Announcement or event details",
      "Isi pengumuman atau detail acara",
      "area",
    ],
  ],
  accounts: [
    ["name", "Display name", "Nama tampilan"],
    ["class", "Class / linked child", "Kelas / anak terkait"],
  ],
  teachers: [
    ["name", "Professional name", "Nama profesional"],
    ["class", "Assigned class", "Kelas diampu"],
    [
      "qualification",
      "Verified qualifications and experience",
      "Kualifikasi dan pengalaman terverifikasi",
    ],
    ["approach", "Teaching approach", "Pendekatan mengajar", "area"],
  ],
  news: [
    ["title", "News title", "Judul berita"],
    ["date", "Date", "Tanggal", "date"],
    [
      "body",
      "Verified story and result",
      "Cerita dan hasil terverifikasi",
      "area",
    ],
  ],
  invoices: [
    ["number", "Invoice number", "Nomor tagihan"],
    ["title", "Fee description", "Jenis biaya"],
    ["period", "Period", "Periode"],
    ["amount", "Preview amount (IDR)", "Nominal simulasi (Rp)", "number"],
    ["due", "Due date", "Jatuh tempo", "date"],
  ],
};
function recordForm(kind) {
  if (
    role !== "admin" &&
    ["announcements", "accounts", "teachers", "news", "invoices"].includes(kind)
  )
    return;
  openModal(
    T("Create Preview Record", "Buat Data Simulasi"),
    `<form onsubmit="saveRecord(event,'${kind}')"><p class="small muted">${T("Use fictional information only. Records last until page refresh.", "Gunakan data fiktif. Data bertahan sampai halaman dimuat ulang.")}</p>${schemas[kind].map((f) => (f[3] === "area" ? area(f[0], T(f[1], f[2]), true) : input(f[0], T(f[1], f[2]), f[3] || "text"))).join("")}${kind === "albums" ? select("scope", T("Visibility", "Lingkup"), ["Class: K2A", "Individual: Sample Child"]) : ""}${kind === "announcements" ? select("audience", T("Audience", "Sasaran"), ["Public", "All Families", "Kindergarten K2A"]) : ""}${kind === "accounts" ? select("role", T("Role", "Peran"), ["Parent", "Teacher", "Admin"]) : ""}${kind === "progress" ? select("status", T("Publication", "Publikasi"), ["Draft", "Shared"]) : ""}${["news", "teachers"].includes(kind) ? `<label class="check"><input type="checkbox" required>${T("I have reviewed accuracy and publication permission for this preview.", "Saya telah memeriksa ketepatan dan izin publikasi untuk simulasi ini.")}</label>` : ""}<button class="btn">${T("Save Preview Record", "Simpan Data Simulasi")}</button></form>`,
  );
}
function saveRecord(e, kind) {
  e.preventDefault();
  let v = Object.fromEntries(new FormData(e.target));
  if (kind === "invoices") {
    v.amount = Number(v.amount);
    if (v.amount <= 0) {
      toast(T("Enter a positive amount.", "Masukkan jumlah positif."));
      return;
    }
    v.paid = 0;
    v.status = "Unpaid";
  }
  state[kind].push({ ...v, id: uid() });
  closeModal();
  render(false);
  toast(T("Saved in the preview session.", "Disimpan pada sesi simulasi."));
}
