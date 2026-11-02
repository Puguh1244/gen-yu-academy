import { db, result } from "../services/supabase.js";
import { date, empty, showStatus } from "./ui.js";
import {
  B,
  textOf,
  e,
  field,
  textarea,
  select,
  bindForm,
  submit,
  action,
  all,
  relevant,
  details,
} from "./spec-ui.js";
import { setLanguage } from "./i18n.js";
export async function overview(ctx) {
  const parent = ctx.profile.role === "parent",
    teacher = ctx.profile.role === "teacher";
  let cards = [];
  if (parent) {
    const [ann, schedule, notifications, tasks, invoices, progress, albums] =
      await Promise.all(
        [
          "announcements",
          "class_schedule",
          "notifications",
          "assignments",
          "invoices",
          "progress_reports",
          "albums",
        ].map((t) =>
          t === "class_schedule"
            ? result(
                db
                  .from(t)
                  .select("*")
                  .gte(
                    "starts_at",
                    new Intl.DateTimeFormat("en-CA", {
                      timeZone: "Asia/Jakarta",
                    }).format(new Date()) + "T00:00:00+07:00",
                  )
                  .lt(
                    "starts_at",
                    new Date(Date.now() + 86400000).toISOString(),
                  )
                  .order("starts_at")
                  .limit(100),
              )
            : all(t),
        ),
      );
    const unread = await result(db.rpc("unread_messages"));
    const scoped = (x) => x.filter((r) => relevant(ctx, r));
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
    }).format(new Date());
    cards = [
      [
        "announcements",
        B("Important Announcements", "Pengumuman Penting"),
        scoped(ann)
          .slice(0, 2)
          .map((x) => textOf(x, "title"))
          .join(" · ") || B("No new announcements", "Belum ada pengumuman"),
      ],
      [
        "calendar",
        B("Today’s Schedule", "Jadwal Hari Ini"),
        scoped(schedule)
          .filter(
            (x) =>
              new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Jakarta",
              }).format(new Date(x.starts_at)) === today,
          )
          .map((x) => textOf(x, "title"))
          .join(" · ") || B("View the class calendar", "Lihat kalender kelas"),
      ],
      [
        "chat",
        B("Unread Messages", "Pesan Baru"),
        `${scoped(unread).reduce((sum, row) => sum + Number(row.total), 0)} ${B("unread messages", "pesan belum dibaca")}`,
      ],
      [
        "tasks",
        B("Upcoming Activity Deadlines", "Tenggat Kegiatan"),
        scoped(tasks)
          .filter((x) => new Date(x.due_at) > new Date())
          .sort((a, b) => new Date(a.due_at) - new Date(b.due_at))
          .slice(0, 2)
          .map((x) => textOf(x, "title") + " · " + date(x.due_at))
          .join(" / ") ||
          B("View weekly activities", "Lihat kegiatan mingguan"),
      ],
      [
        "fees",
        B("Fees Due", "Tagihan Jatuh Tempo"),
        `${scoped(invoices).filter((x) => Number(x.paid) < Number(x.amount)).length} ${B("outstanding invoices", "tagihan belum lunas")}`,
      ],
      [
        "progress",
        B("Latest Progress and Photos", "Perkembangan dan Foto Terbaru"),
        `${scoped(progress).length} ${B("shared reports", "laporan")} · ${scoped(albums).length} ${B("albums", "album")}`,
      ],
    ];
  } else if (teacher) {
    const [abs, sub] = await Promise.all([all("absences"), all("submissions")]);
    cards = [
      [
        "calendar",
        B("Class Agenda", "Agenda Kelas"),
        B("Review today’s learning plan", "Lihat rencana belajar"),
      ],
      [
        "absences",
        B("New Absence Reports", "Laporan Izin Baru"),
        String(
          abs.filter(
            (x) => relevant(ctx, x) && !x.acknowledged_at && !x.cancelled,
          ).length,
        ),
      ],
      [
        "chat",
        B("Family Messages", "Pesan Wali"),
        B(
          "Class and invited private conversations",
          "Percakapan kelas dan pribadi berizin",
        ),
      ],
      [
        "tasks",
        B("Submissions to Review", "Hasil untuk Ditinjau"),
        String(
          sub.filter((x) => relevant(ctx, x) && x.status === "submitted")
            .length,
        ),
      ],
      [
        "progress",
        B("Child Progress", "Perkembangan Anak"),
        B("Draft and share observations", "Buat dan bagikan pengamatan"),
      ],
      [
        "albums",
        B("Update Photo Albums", "Perbarui Album"),
        B(
          "Class or individual documentation",
          "Dokumentasi kelas atau individual",
        ),
      ],
    ];
  } else {
    const [enquiries, proofs, content] = await Promise.all([
      all("admission_enquiries"),
      all("payment_proofs"),
      all("school_content"),
    ]);
    cards = [
      [
        "admissions",
        B("Admission Enquiries", "Permintaan Penerimaan"),
        String(enquiries.filter((x) => x.status !== "Completed").length),
      ],
      [
        "responses",
        B("Announcement & Event Responses", "Respons Pengumuman dan Acara"),
        B(
          "Review acknowledgements and RSVP",
          "Lihat konfirmasi membaca dan hadir",
        ),
      ],
      [
        "fees",
        B("Payments to Verify", "Pembayaran untuk Diverifikasi"),
        String(proofs.filter((x) => x.status === "pending").length),
      ],
      [
        "content",
        B("Publication Review", "Tinjauan Publikasi"),
        String(content.filter((x) => x.status === "submitted").length),
      ],
      [
        "operations",
        B("Accounts and Classes", "Akun dan Kelas"),
        B("Verify and link school accounts", "Verifikasi dan hubungkan akun"),
      ],
      [
        "access",
        B("Access Follow-up", "Tindak Lanjut Akses"),
        B(
          "Drive access and school procedures",
          "Akses Drive dan prosedur sekolah",
        ),
      ],
    ];
  }
  ctx.root.innerHTML = `<p>${e(date(new Date()))}</p><div class="actions" style="margin-bottom:24px">${parent ? `<button class="btn" data-go="absences">${B("Report an Absence", "Laporkan Izin")}</button>` : ""}<button class="btn secondary" data-go="chat">${B("Messages", "Pesan")}</button><button class="btn secondary" data-go="notifications">${B("Notifications", "Notifikasi")}</button></div><div class="grid g3 dashboard">${cards.map(([page, title, body], i) => `<article class="card"><span class="num">0${i + 1}</span><h3>${title}</h3><p data-content>${e(body)}</p><button class="link" data-go="${page}">${B("Open", "Buka")} ↗</button></article>`).join("")}</div>`;
  action(ctx.root, "[data-go]", (b) => ctx.navigate(b.dataset.go));
}
export async function accountPage(ctx) {
  const p = ctx.preferences || {};
  ctx.root.innerHTML = `<div class="card"><h3>${B("Language and notifications", "Bahasa dan notifikasi")}</h3><form id="preferences">${select(
    "language",
    B("Language", "Bahasa"),
    [
      { id: "en", name: "English" },
      { id: "id", name: "Bahasa Indonesia" },
    ],
  )}${[
    ["messages", B("Messages", "Pesan")],
    ["tasks", B("Activities and learning", "Kegiatan dan pembelajaran")],
    ["events", B("Events and announcements", "Acara dan pengumuman")],
    ["administration", B("Administration", "Administrasi")],
  ]
    .map(
      ([k, label]) =>
        `<label class="check"><input type="checkbox" name="${k}" ${p[k] !== false ? "checked" : ""}>${label}</label>`,
    )
    .join(
      "",
    )}${submit()}</form><p class="notice">${B("Preferences apply to portal notifications. Important information remains on your dashboard. Email/push delivery requires a separately configured provider.", "Preferensi berlaku untuk notifikasi portal. Informasi penting tetap tampil di dashboard. Email/push membutuhkan penyedia yang dikonfigurasi terpisah.")}</p></div>`;
  ctx.root.insertAdjacentHTML(
    "beforeend",
    details(
      "set-password",
      B("Set / change account password", "Atur / ubah kata sandi akun"),
      field(
        "password",
        B(
          "New password (at least 12 characters)",
          "Kata sandi baru (minimal 12 karakter)",
        ),
        "password",
      ) +
        field(
          "confirm",
          B("Confirm password", "Konfirmasi kata sandi"),
          "password",
        ),
    ),
  );
  bindForm("set-password", async (f) => {
    if (f.get("password").length < 12 || f.get("password") !== f.get("confirm"))
      throw new Error(
        B(
          "Use matching passwords of at least 12 characters.",
          "Gunakan kata sandi cocok dengan minimal 12 karakter.",
        ),
      );
    await result(db.auth.updateUser({ password: f.get("password") }));
    document.getElementById("set-password").reset();
    showStatus(B("Password updated.", "Kata sandi diperbarui."));
  });
  document.querySelector("#preferences [name=language]").value =
    p.language || "en";
  bindForm("preferences", async (f) => {
    const row = {
      user_id: ctx.profile.id,
      language: f.get("language"),
      messages: f.has("messages"),
      tasks: f.has("tasks"),
      events: f.has("events"),
      administration: f.has("administration"),
    };
    await result(db.from("account_preferences").upsert(row));
    setLanguage(row.language);
    await ctx.refresh();
  });
}
export async function notifications(ctx) {
  const rows = await all("notifications");
  ctx.root.innerHTML = `<div class="records">${rows.map((x) => `<article class="card"><span class="badge">${x.read_at ? B("Read", "Dibaca") : B("New", "Baru")}</span><h3>${e(textOf(x, "title"))}</h3><p>${e(date(x.created_at))}</p><button class="btn" data-notification="${x.id}">${B("Open", "Buka")}</button></article>`).join("") || empty(B("No notifications.", "Belum ada notifikasi."))}</div>`;
  action(ctx.root, "[data-notification]", async (b) => {
    const x = rows.find((x) => String(x.id) === b.dataset.notification);
    await result(db.rpc("mark_notification", { p_id: x.id }));
    await ctx.navigate(
      {
        messages: "chat",
        tasks: "tasks",
        events: "events",
        administration: "fees",
      }[x.category],
    );
  });
}
export async function access(ctx) {
  const rows = await all("access_tasks");
  const settings = await result(db.from("school_settings").select("*"));
  ctx.root.innerHTML = `<div class="card"><h3>${B("Access boundaries", "Batas akses")}</h3><p>${B("Parents access linked children. Private messages require explicit participation; another guardian of the same child has no automatic access. Teachers cannot access fees. Operational administrators cannot read private learning conversations.", "Orang tua mengakses anak yang terhubung. Pesan pribadi membutuhkan keanggotaan eksplisit; wali lain dari anak yang sama tidak otomatis mendapat akses. Guru tidak mengakses biaya. Admin operasional tidak membaca percakapan belajar privat.")}</p><p>${B("Drive access must be reviewed in Google Drive, including inherited folder permissions. A portal change does not automatically change Google permissions.", "Akses Drive harus diperiksa di Google Drive, termasuk izin folder induk. Perubahan portal tidak otomatis mengubah izin Google.")}</p></div><div class="records">${rows.map((x) => `<article class="card"><p>${e(x.description)}</p><span class="badge">${x.completed ? B("Completed", "Selesai") : B("Needs action", "Perlu tindakan")}</span>${!x.completed ? `<button class="btn" data-access="${x.id}">${B("Mark completed after review", "Tandai selesai setelah pemeriksaan")}</button>` : ""}</article>`).join("")}</div>${details("school-settings", B("Teacher service hours and admission guidance", "Jam layanan guru dan panduan penerimaan"), textarea("hours_en", "Teacher response hours · English") + textarea("hours_id", "Jam layanan guru · Bahasa Indonesia") + textarea("admissions_en", "Hours, vacancies, documents, trial availability · English") + textarea("admissions_id", "Jadwal, kuota, dokumen, ketersediaan trial · Bahasa Indonesia"))}<p class="notice">${B("Set retention, backups, account recovery and incident-access procedures before using real records. No exceptional private-data access is granted automatically.", "Tetapkan retensi, backup, pemulihan akun, dan prosedur akses insiden sebelum memakai data nyata. Akses khusus tidak diberikan otomatis.")}</p>`;
  const f = document.getElementById("school-settings"),
    hours =
      settings.find((s) => s.key === "teacher_service_hours")?.value || {},
    admissions = settings.find((s) => s.key === "admissions")?.value || {};
  f.elements.hours_en.value = hours.en || "";
  f.elements.hours_id.value = hours.id || "";
  f.elements.admissions_en.value = admissions.en || "";
  f.elements.admissions_id.value = admissions.id || "";
  bindForm("school-settings", async (f) => {
    await result(
      db.from("school_settings").upsert([
        {
          key: "teacher_service_hours",
          value: { en: f.get("hours_en"), id: f.get("hours_id") },
        },
        {
          key: "admissions",
          value: { en: f.get("admissions_en"), id: f.get("admissions_id") },
        },
      ]),
    );
    await ctx.refresh();
  });
  action(ctx.root, "[data-access]", async (b) => {
    await result(
      db
        .from("access_tasks")
        .update({ completed: true })
        .eq("id", b.dataset.access),
    );
    await ctx.refresh();
  });
}
export async function responses(ctx) {
  const [events, entries, families] = await Promise.all([
    all("events", "starts_at"),
    all("attendance_responses", "updated_at"),
    all("families", "name"),
  ]);
  ctx.root.innerHTML = `<button id="remind" class="btn">${B("Send portal reminders to pending recipients", "Kirim pengingat portal kepada yang belum merespons")}</button><p class="notice">${B("At most one reminder per account, item and version each day. Only pending recipients are targeted; notification preferences are respected.", "Maksimal satu pengingat per akun, informasi, dan versi per hari. Hanya penerima yang belum merespons, sesuai preferensi notifikasi.")}</p><div class="records">${events
    .map(
      (ev) =>
        `<article class="card"><h3>${e(textOf(ev, "title"))} · v${ev.version}</h3>${
          entries
            .filter((r) => r.event_id === ev.id)
            .map(
              (r) =>
                `<p>${e(ctx.allStudents.find((s) => s.id === r.scope_id)?.name || families.find((f) => f.id === r.scope_id)?.name || r.scope_id)} · v${r.version} · ${e(r.response)} · ${r.adult_count}<br>${e(r.note)}<br><small>${e(date(r.updated_at))} · ${e(r.actor_name || r.actor_id)}</small></p>`,
            )
            .join("") || empty(B("No responses yet.", "Belum ada respons."))
        }</article>`,
    )
    .join(
      "",
    )}</div><button class="btn secondary" data-ann>${B("View announcement acknowledgement recaps", "Lihat rekap konfirmasi pengumuman")}</button>`;
  action(ctx.root, "#remind", async () => {
    await result(db.rpc("send_pending_reminders"));
    showStatus(
      B(
        "Pending-recipient reminders have been processed.",
        "Pengingat penerima yang belum merespons telah diproses.",
      ),
    );
  });
  action(ctx.root, "[data-ann]", () => ctx.navigate("announcements"));
}
