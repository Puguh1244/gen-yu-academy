import { db, result } from "../services/supabase.js";
import { date, empty } from "./ui.js";
import {
  B,
  textOf,
  e,
  field,
  textarea,
  select,
  bindForm,
  submit,
  bilingual,
  action,
  fillForm,
  relevant,
  all,
  details,
  instant,
  audienceFields,
  audienceData,
} from "./spec-ui.js";
import { statusText } from "./i18n.js";
export function calendarDownload(event) {
  const clean = (s) =>
    String(s || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const utc = (x) =>
    new Date(x)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const text = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gen-Yu Academy//School Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@genyu.local`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(event.starts_at)}`,
    `DTEND:${utc(event.ends_at)}`,
    `SUMMARY:${clean(textOf(event, "title"))}`,
    `LOCATION:${clean(event.location)}`,
    `DESCRIPTION:${clean(textOf(event, "body"))}`,
    `SEQUENCE:${event.version || 1}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a"),
    url = URL.createObjectURL(
      new Blob([text], { type: "text/calendar;charset=utf-8" }),
    );
  a.href = url;
  a.download = "Gen-Yu-Event.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function announcements(ctx) {
  const rows = (await all("announcements")).filter((x) => relevant(ctx, x)),
    acks = await all("acknowledgements");
  const fields = () =>
    bilingual("title", B("Title", "Judul")) +
    bilingual("body", B("Announcement", "Pengumuman"), true) +
    audienceFields(ctx) +
    field(
      "response_due",
      B(
        "Response deadline (optional; local time)",
        "Batas respons (opsional; waktu lokal)",
      ),
      "datetime-local",
      false,
    ) +
    `<label class="check"><input name="requires_ack" type="checkbox" checked>${B("Require reading acknowledgement", "Minta konfirmasi membaca")}</label>`;
  ctx.root.innerHTML =
    (ctx.profile.role === "admin"
      ? details(
          "new-announcement",
          B("Publish announcement", "Terbitkan pengumuman"),
          fields(),
        )
      : "") +
    `<div class="records">${rows.map((x) => `<article class="card"><span class="badge">${e(x.audience)} · ${B("Version", "Versi")} ${x.version}</span><h3>${e(textOf(x, "title"))}</h3><p class="record-body" data-content>${e(textOf(x, "body"))}</p><p>${e(date(x.created_at))}${x.response_due ? "<br>" + B("Respond by", "Batas respons") + ": " + e(date(x.response_due)) : ""}</p>${x.requires_ack ? (acks.some((a) => a.announcement_id === x.id && a.user_id === ctx.profile.id && a.version === x.version) ? `<span class="badge">${B("Acknowledged", "Sudah membaca")}</span>` : ctx.profile.role === "parent" ? `<button class="btn" data-ack="${x.id}" ${x.response_due && new Date(x.response_due) < new Date() ? "disabled" : ""}>${B("I Have Read This", "Saya Sudah Membaca")}</button>` : "") : ""}${ctx.profile.role === "admin" || (ctx.profile.role === "teacher" && x.audience === "class") ? `<button class="btn secondary" data-recap="${x.id}">${B("Response recap", "Rekap respons")}</button><div id="recap-${x.id}"></div>` : ""}${ctx.profile.role === "admin" ? details("edit-announcement-" + x.id, B("Revise / request acknowledgement again", "Revisi / minta konfirmasi ulang"), fields()) : ""}</article>`).join("") || empty(B("No announcements.", "Belum ada pengumuman."))}</div>`;
  async function save(f, id) {
    const row = {
      title: f.get("title"),
      title_id: f.get("title_id"),
      body: f.get("body"),
      body_id: f.get("body_id"),
      ...audienceData(f),
      requires_ack: f.has("requires_ack"),
      response_due: instant(f.get("response_due")),
    };
    await result(
      id
        ? db.from("announcements").update(row).eq("id", id)
        : db.from("announcements").insert(row),
    );
    await ctx.refresh();
  }
  bindForm("new-announcement", (f) => save(f));
  rows.forEach((x) => {
    fillForm(document.getElementById("edit-announcement-" + x.id), x);
    bindForm("edit-announcement-" + x.id, (f) => save(f, x.id));
  });
  action(ctx.root, "[data-ack]", async (b) => {
    const x = rows.find((x) => x.id === b.dataset.ack);
    await result(
      db
        .from("acknowledgements")
        .insert({ announcement_id: x.id, version: x.version }),
    );
    await ctx.refresh();
  });
  action(ctx.root, "[data-recap]", async (b) => {
    const list = await result(
      db.rpc("announcement_recap", { p_id: b.dataset.recap }),
    );
    document.getElementById("recap-" + b.dataset.recap).innerHTML =
      list
        .map(
          (p) =>
            `<p>${e(p.display_name)} · ${p.acknowledged_at ? e(date(p.acknowledged_at)) : B("Awaiting acknowledgement", "Belum mengonfirmasi")}</p>`,
        )
        .join("") || "—";
  });
}
export async function events(ctx) {
  const rows = (await all("events", "starts_at")).filter((x) =>
      relevant(ctx, x),
    ),
    responses = await all("attendance_responses", "updated_at");
  const fields = () =>
    bilingual("title", B("Title", "Judul")) +
    bilingual("body", B("Event details", "Penjelasan acara"), true) +
    audienceFields(ctx) +
    field(
      "starts_at",
      B("Starts (local time)", "Mulai (waktu lokal)"),
      "datetime-local",
    ) +
    field(
      "ends_at",
      B("Ends (local time)", "Selesai (waktu lokal)"),
      "datetime-local",
    ) +
    field(
      "arrival_at",
      B("Arrival (optional; local time)", "Waktu kedatangan (opsional)"),
      "datetime-local",
      false,
    ) +
    field("location", B("Venue", "Lokasi")) +
    bilingual(
      "preparation",
      B(
        "Items / dress code / preparation",
        "Perlengkapan / pakaian / persiapan",
      ),
      true,
    ) +
    field(
      "response_due",
      B("RSVP deadline (local time)", "Batas konfirmasi (waktu lokal)"),
      "datetime-local",
    ) +
    select("scope_kind", B("Count responses per", "Hitung respons per"), [
      { id: "student", name: B("Child", "Anak") },
      { id: "family", name: B("Family", "Keluarga") },
    ]) +
    `<label class="check"><input name="parent_required" type="checkbox">${B("Parent attendance required", "Kehadiran orang tua wajib")}</label>`;
  ctx.root.innerHTML =
    (ctx.profile.role === "admin"
      ? details("new-event", B("Publish event", "Terbitkan acara"), fields())
      : "") +
    `<div class="records">${
      rows
        .map((x) => {
          const current = responses.filter(
              (r) => r.event_id === x.id && r.version === x.version,
            ),
            previous = responses.filter(
              (r) => r.event_id === x.id && r.version !== x.version,
            );
          const targets =
            x.scope_kind === "student"
              ? ctx.students.filter(
                  (s) => x.audience !== "class" || s.class_id === x.class_id,
                )
              : [
                  ...new Map(
                    ctx.students
                      .filter((s) => s.family_id)
                      .map((s) => [
                        s.family_id,
                        {
                          id: s.family_id,
                          name: B("Family of ", "Keluarga ") + s.name,
                        },
                      ]),
                  ).values(),
                ];
          return `<article class="card"><span class="badge">${B("Version", "Versi")} ${x.version} · ${e(x.audience)}</span><h3>${e(textOf(x, "title"))}</h3><p class="record-body" data-content>${e(textOf(x, "body"))}</p><p>${e(date(x.starts_at))} — ${e(date(x.ends_at))}<br>${e(x.location)}</p>${x.arrival_at ? `<p>${B("Please arrive at", "Harap tiba pada")} ${e(date(x.arrival_at))}</p>` : ""}<p class="record-body" data-content>${e(textOf(x, "preparation"))}</p>${x.parent_required ? `<strong>${B("Parent Attendance Required", "Kehadiran Orang Tua Wajib")}</strong>` : ""}<p>${B("RSVP deadline", "Batas konfirmasi")}: ${e(date(x.response_due))}</p><button class="btn secondary" data-calendar="${x.id}">${B("Add to Calendar", "Tambahkan ke Kalender")}</button><p>${current.length ? current.map((r) => `${e(ctx.students.find((s) => s.id === r.scope_id)?.name || B("Family", "Keluarga"))}: ${e(statusText(r.response))} · ${r.adult_count} ${B("adult(s)", "wali")} (${B("account", "akun")} ${e(r.actor_name || r.actor_id.slice(0, 8))})`).join("<br>") : B("Awaiting confirmation for this version.", "Menunggu konfirmasi untuk versi ini.")}</p>${ctx.profile.role === "admin" ? `<p>${B("Total adults attending", "Total wali hadir")}: ${current.filter((r) => r.response === "attending").reduce((n, r) => n + r.adult_count, 0)}</p>` : ""}${
            ctx.profile.role === "parent" &&
            targets.length &&
            (!x.response_due || new Date(x.response_due) > new Date())
              ? details(
                  "rsvp-" + x.id,
                  B(
                    "Confirm / update attendance",
                    "Konfirmasi / perbarui kehadiran",
                  ),
                  select(
                    "scope",
                    x.scope_kind === "student"
                      ? B("Child", "Anak")
                      : B("Family", "Keluarga"),
                    targets,
                  ) +
                    select("response", B("Response", "Respons"), [
                      { id: "attending", name: statusText("attending") },
                      { id: "unable", name: statusText("unable") },
                    ]) +
                    field(
                      "count",
                      B(
                        "Number of adults (0 if unable)",
                        "Jumlah wali (0 jika berhalangan)",
                      ),
                      "number",
                    ) +
                    textarea(
                      "note",
                      B("Optional note", "Catatan opsional"),
                      false,
                    ),
                )
              : ctx.profile.role === "parent" && !targets.length
                ? `<p class="notice">${B("Ask administration to link your family before responding.", "Minta admin menghubungkan keluarga sebelum memberikan respons.")}</p>`
                : ""
          }${previous.length ? `<details><summary>${B("Previous versions’ responses", "Respons versi sebelumnya")}</summary>${previous.map((r) => `<p>${B("Version", "Versi")} ${r.version}: ${e(statusText(r.response))} · ${e(date(r.updated_at))}</p>`).join("")}</details>` : ""}${ctx.profile.role === "admin" ? details("edit-event-" + x.id, B("Revise event and request new confirmations", "Revisi acara dan minta konfirmasi ulang"), fields()) : ""}</article>`;
        })
        .join("") || empty(B("No events scheduled.", "Belum ada acara."))
    }</div>`;
  async function save(f, id) {
    const row = {
      title: f.get("title"),
      title_id: f.get("title_id"),
      body: f.get("body"),
      body_id: f.get("body_id"),
      ...audienceData(f),
      starts_at: instant(f.get("starts_at")),
      ends_at: instant(f.get("ends_at")),
      arrival_at: instant(f.get("arrival_at")),
      response_due: instant(f.get("response_due")),
      location: f.get("location"),
      preparation: f.get("preparation"),
      preparation_id: f.get("preparation_id"),
      scope_kind: f.get("scope_kind"),
      parent_required: f.has("parent_required"),
    };
    await result(
      id
        ? db.from("events").update(row).eq("id", id)
        : db.from("events").insert(row),
    );
    await ctx.refresh();
  }
  bindForm("new-event", (f) => save(f));
  rows.forEach((x) => {
    fillForm(document.getElementById("edit-event-" + x.id), x);
    bindForm("edit-event-" + x.id, (f) => save(f, x.id));
    bindForm("rsvp-" + x.id, async (f) => {
      await result(
        db.rpc("respond_to_event", {
          p_event: x.id,
          p_scope: f.get("scope"),
          p_response: f.get("response"),
          p_count: f.get("response") === "unable" ? 0 : Number(f.get("count")),
          p_note: f.get("note"),
        }),
      );
      await ctx.refresh();
    });
  });
  action(ctx.root, "[data-calendar]", async (b) =>
    calendarDownload(rows.find((x) => x.id === b.dataset.calendar)),
  );
}
let calendarMonth = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
}).format(new Date());
export async function calendar(ctx) {
  const [year, month] = calendarMonth.split("-").map(Number);
  const start = new Date(
    Date.UTC(year, month - 1, 1) - 7 * 3600000,
  ).toISOString();
  const end = new Date(Date.UTC(year, month, 1) - 7 * 3600000).toISOString();
  let query = db
    .from("class_schedule")
    .select("*")
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at")
    .limit(1000);
  if (ctx.profile.role !== "admin" && ctx.classes.length)
    query = query.in(
      "class_id",
      ctx.classes.map((c) => c.id),
    );
  const schedule = (await result(query)).filter((x) => relevant(ctx, x));
  const events = (
    await result(
      db
        .from("events")
        .select("*")
        .gte("starts_at", start)
        .lt("starts_at", end)
        .order("starts_at"),
    )
  ).filter((x) => relevant(ctx, x));
  const fields = () =>
    select("class_id", B("Class", "Kelas"), ctx.classes) +
    bilingual("title", B("Activity", "Kegiatan")) +
    bilingual(
      "body",
      B("Details and materials", "Penjelasan dan perlengkapan"),
      true,
    ) +
    field(
      "starts_at",
      B("Starts (local time)", "Mulai (waktu lokal)"),
      "datetime-local",
    ) +
    field(
      "ends_at",
      B("Ends (local time)", "Selesai (waktu lokal)"),
      "datetime-local",
    );
  ctx.root.innerHTML =
    `<label class="field">${B("Calendar month", "Bulan kalender")}<input id="calendar-month" type="month" value="${calendarMonth}"></label><p class="small muted">${B("Choose a month to view the class schedule and school events. Staging semester fixtures cover January–June 2027 and are fictional.", "Pilih bulan untuk melihat jadwal kelas dan acara sekolah. Data semester staging mencakup Januari–Juni 2027 dan bersifat fiktif.")}</p>` +
    (ctx.profile.role === "teacher"
      ? details(
          "schedule",
          B("Add class schedule", "Tambah jadwal kelas"),
          fields(),
        )
      : "") +
    `<div class="records">${
      [
        ...schedule.map((x) => ({ ...x, type: "class" })),
        ...events.map((x) => ({ ...x, type: "event" })),
      ]
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
        .map(
          (x) =>
            `<article class="card"><span class="badge">${x.type === "class" ? B("Class schedule", "Jadwal kelas") : B("School event", "Acara sekolah")}</span><h3>${e(textOf(x, "title"))}</h3><p>${e(date(x.starts_at))} — ${e(date(x.ends_at))}</p><p class="record-body" data-content>${e(textOf(x, "body"))}</p><button class="btn secondary" data-export="${x.id}">${B("Add to Calendar", "Tambahkan ke Kalender")}</button>${ctx.profile.role === "teacher" && x.type === "class" ? details("edit-schedule-" + x.id, B("Edit schedule", "Ubah jadwal"), fields()) : ""}</article>`,
        )
        .join("") || empty(B("No schedule yet.", "Belum ada jadwal."))
    }</div>`;
  document.getElementById("calendar-month").onchange = (event) => {
    if (/^\d{4}-\d{2}$/.test(event.target.value)) {
      calendarMonth = event.target.value;
      ctx.refresh();
    }
  };
  const save = async (f, id) => {
    const row = Object.fromEntries(f);
    row.starts_at = instant(f.get("starts_at"));
    row.ends_at = instant(f.get("ends_at"));
    row.created_by = ctx.profile.id;
    await result(
      id
        ? db.from("class_schedule").update(row).eq("id", id)
        : db.from("class_schedule").insert(row),
    );
    await ctx.refresh();
  };
  bindForm("schedule", (f) => save(f));
  schedule.forEach((x) => {
    fillForm(document.getElementById("edit-schedule-" + x.id), x);
    bindForm("edit-schedule-" + x.id, (f) => save(f, x.id));
  });
  action(ctx.root, "[data-export]", async (b) =>
    calendarDownload(
      [...schedule, ...events].find((x) => x.id === b.dataset.export),
    ),
  );
}
