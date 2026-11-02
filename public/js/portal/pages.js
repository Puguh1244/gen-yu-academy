import {
  db,
  result,
  uploadFile,
  cleanupFile,
  fileUrl,
} from "../services/supabase.js";
import {
  escapeHTML as e,
  field,
  textarea,
  select,
  empty,
  bindForm,
  date,
  showError,
} from "./ui.js";
import { tasks, progress, absences } from "./learning.js";
import { fees, operations, audit } from "./administration.js";
const submit = '<button class="btn" type="submit">Save / Simpan</button>';
const detailForm = (id, title, body) =>
  `<details class="card record-form"><summary>${title}</summary><form id="${id}">${body}${submit}</form></details>`;
export async function openFile(bucket, path) {
  const url = await fileUrl(bucket, path);
  window.open(url, "_blank", "noopener,noreferrer");
}
export function bindFiles(root) {
  root
    .querySelectorAll("[data-file]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          openFile(b.dataset.bucket, b.dataset.file).catch(showError)),
    );
}
export const fileButton = (bucket, path) =>
  path
    ? `<button class="btn secondary" data-bucket="${bucket}" data-file="${e(path)}">Open private file</button>`
    : "";
async function overview(ctx) {
  ctx.root.innerHTML = `<div class="grid g3"><article class="card"><span class="badge">${e(ctx.profile.role)}</span><h3>Welcome, ${e(ctx.profile.display_name)}.</h3><p>Your school access is determined by your verified account and class assignments.</p></article><article class="card"><h3>${ctx.students.length} linked students</h3><p>${ctx.profile.role === "admin" ? "School enrolment records." : "Only students within your access are shown."}</p></article><article class="card"><h3>${ctx.classes.length} linked classes</h3><p>Secure school communication, in one place.</p></article></div><h2 style="margin-top:32px">${ctx.profile.role === "parent" ? "My children" : "School students"}</h2><div class="grid g3">${ctx.students.map((s) => `<article class="card"><h3>${e(s.name)}</h3><p>${e(ctx.classes.find((c) => c.id === s.class_id)?.name || "Class")}</p></article>`).join("") || empty("Your account has no linked students yet. Ask the school to link your account.")}</div><p class="notice">${ctx.profile.role === "teacher" ? "Your role has no access to invoices or payment evidence." : ctx.profile.role === "admin" ? "Private learning conversations, learning files and child progress are not accessible from the administration role." : "Multiple children can be linked to one parent account. Choose the child when submitting an activity, absence or permission."}</p>`;
}
async function announcements(ctx) {
  const rows = await result(
    db
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  );
  const acknowledgements = await result(
    db.from("acknowledgements").select("*"),
  );
  ctx.root.innerHTML =
    (ctx.profile.role === "admin"
      ? detailForm(
          "announcement",
          "Publish an announcement",
          field("title", "Title") +
            textarea("body", "Announcement") +
            select("class", "Audience", [
              { id: "all", name: "All school accounts" },
              ...ctx.classes,
            ]),
        )
      : "") +
    `<div class="records">${rows.map((x) => `<article class="card"><span class="badge">${x.class_id ? e(ctx.classes.find((c) => c.id === x.class_id)?.name) : "School-wide"}</span><h3>${e(x.title)}</h3><p class="record-body">${e(x.body)}</p><small>${e(date(x.created_at))}</small><div class="live-actions">${ctx.profile.role === "admin" ? `<span>${acknowledgements.filter((a) => a.announcement_id === x.id).length} acknowledgements</span>` : acknowledgements.some((a) => a.announcement_id === x.id && a.user_id === ctx.profile.id) ? '<span class="badge">Acknowledged / Sudah dibaca</span>' : `<button class="btn" data-ack="${x.id}">I have read this / Sudah membaca</button>`}</div></article>`).join("") || empty("No announcements yet.")}</div>`;
  bindForm("announcement", async (f) => {
    await result(
      db.from("announcements").insert({
        title: f.get("title"),
        body: f.get("body"),
        class_id: f.get("class") === "all" ? null : f.get("class"),
      }),
    );
    await ctx.refresh();
  });
  ctx.root.querySelectorAll("[data-ack]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await result(
            db
              .from("acknowledgements")
              .insert({ announcement_id: b.dataset.ack }),
          );
          await ctx.refresh();
        } catch (err) {
          showError(err);
        }
      }),
  );
}
async function events(ctx) {
  const rows = await result(
    db
      .from("events")
      .select("*")
      .order("starts_at", { ascending: false })
      .limit(100),
  );
  const responses = await result(db.from("event_responses").select("*"));
  ctx.root.innerHTML =
    (ctx.profile.role === "admin"
      ? detailForm(
          "new-event",
          "Create an event",
          field("title", "Title") +
            textarea(
              "body",
              "Event details, dress code, and parent participation",
            ) +
            field("start", "Start (your device local time)", "datetime-local") +
            field("end", "End (your device local time)", "datetime-local") +
            field("location", "Location") +
            select("class", "Audience", [
              { id: "all", name: "All school accounts" },
              ...ctx.classes,
            ]),
        )
      : "") +
    `<div class="records">${
      rows
        .map((x) => {
          const own = responses.find(
            (r) => r.event_id === x.id && r.user_id === ctx.profile.id,
          );
          return `<article class="card"><h3>${e(x.title)}</h3><p class="record-body">${e(x.body)}</p><p>${e(date(x.starts_at))} — ${e(date(x.ends_at))}<br>${e(x.location)}</p>${
            ctx.profile.role === "parent"
              ? `<p>${own ? "Your response: " + e(own.response) + " · " + own.adult_count + " adult(s)" : "No response yet."}</p><details><summary>Confirm or update attendance</summary><form id="rsvp-${x.id}">${select(
                  "response",
                  "Attendance",
                  [
                    { id: "attending", name: "Will attend" },
                    { id: "unable", name: "Unable to attend" },
                  ],
                )}${field("count", "Adults attending (1–10; ignored when unable)", "number")}${textarea("note", "Optional note", false)}${submit}</form></details>`
              : ctx.profile.role === "admin"
                ? `<p>${responses.filter((r) => r.event_id === x.id && r.response === "attending").reduce((n, r) => n + r.adult_count, 0)} adults attending · ${responses.filter((r) => r.event_id === x.id).length} responses</p>`
                : ""
          }</article>`;
        })
        .join("") || empty("No events scheduled.")
    }</div>`;
  bindForm("new-event", async (f) => {
    const start = new Date(f.get("start")),
      end = new Date(f.get("end"));
    if (end <= start) throw new Error("End must be later than start.");
    await result(
      db.from("events").insert({
        title: f.get("title"),
        body: f.get("body"),
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        location: f.get("location"),
        class_id: f.get("class") === "all" ? null : f.get("class"),
      }),
    );
    await ctx.refresh();
  });
  if (ctx.profile.role === "parent")
    rows.forEach((x) =>
      bindForm("rsvp-" + x.id, async (f) => {
        await result(
          db.from("event_responses").upsert({
            event_id: x.id,
            user_id: ctx.profile.id,
            response: f.get("response"),
            adult_count:
              f.get("response") === "attending" ? Number(f.get("count")) : 0,
            note: f.get("note"),
            updated_at: new Date().toISOString(),
          }),
        );
        await ctx.refresh();
      }),
    );
}
async function albums(ctx) {
  const rows = await result(
    db
      .from("albums")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  );
  ctx.root.innerHTML =
    `<p class="notice">Individual albums are visible to authorised family members and assigned teachers. For a Drive folder, the school must separately set sharing to Restricted and grant the correct Google accounts.</p>` +
    (ctx.profile.role === "teacher" && ctx.students.length
      ? detailForm(
          "album",
          "Add individual activity documentation",
          select("student", "Child", ctx.students) +
            field("title", "Title") +
            textarea("body", "Description", false) +
            field(
              "file",
              "Private JPG / PNG / PDF (max 10 MB)",
              "file",
              false,
            ) +
            field(
              "drive",
              "Optional restricted Google Drive link",
              "url",
              false,
            ),
        )
      : "") +
    `<div class="records">${rows.map((x) => `<article class="card"><span class="badge">${e(ctx.students.find((s) => s.id === x.student_id)?.name)}</span><h3>${e(x.title)}</h3><p class="record-body">${e(x.body)}</p><div class="live-actions">${fileButton("learning-files", x.file_path)}${x.drive_url && /^https:\/\/drive\.google\.com\//.test(x.drive_url) ? `<a class="btn secondary" href="${e(x.drive_url)}" target="_blank" rel="noopener noreferrer">Open restricted Drive album</a>` : ""}</div></article>`).join("") || empty("No albums available.")}</div>`;
  bindFiles(ctx.root);
  bindForm("album", async (f) => {
    const student = f.get("student"),
      drive = f.get("drive").trim();
    if (drive && !/^https:\/\/drive\.google\.com\//.test(drive))
      throw new Error("Use an HTTPS drive.google.com link.");
    let path = await uploadFile("learning-files", student, f.get("file"));
    try {
      if (!path && !drive)
        throw new Error("Choose a file or a restricted Drive link.");
      await result(
        db.from("albums").insert({
          student_id: student,
          title: f.get("title"),
          body: f.get("body"),
          file_path: path,
          drive_url: drive || null,
        }),
      );
    } catch (err) {
      await cleanupFile("learning-files", path);
      throw err;
    }
    await ctx.refresh();
  });
}
async function consents(ctx) {
  const rows = await result(db.from("photo_consents").select("*"));
  ctx.root.innerHTML = `<p class="notice">No consent is assumed. This records each guardian’s choice; it does not automatically publish photographs. School staff must confirm agreement from all required guardians before class or public use.</p><div class="records">${
    ctx.students
      .map((s) => {
        const own = rows.find(
          (r) => r.student_id === s.id && r.parent_id === ctx.profile.id,
        );
        return `<article class="card"><h3>${e(s.name)}</h3>${
          ctx.profile.role === "parent"
            ? `<form id="consent-${s.id}"><label class="check"><input type="checkbox" name="class" ${own?.class_use ? "checked" : ""}>Allow use in the restricted class gallery.</label><label class="check"><input type="checkbox" name="public" ${own?.public_use ? "checked" : ""}>Allow use on the public school website.</label>${submit}</form>`
            : rows
                .filter((r) => r.student_id === s.id)
                .map(
                  (r) =>
                    `<p>Guardian ${e(r.parent_id.slice(0, 8))} · Class use: ${r.class_use ? "Yes" : "No"} · Public use: ${r.public_use ? "Yes" : "No"}<br><small>${e(date(r.updated_at))}</small></p>`,
                )
                .join("") || empty("No guardian permission has been recorded.")
        }</article>`;
      })
      .join("") || empty("No students linked.")
  }</div>`;
  if (ctx.profile.role === "parent")
    ctx.students.forEach((s) =>
      bindForm("consent-" + s.id, async (f) => {
        await result(
          db.from("photo_consents").upsert({
            student_id: s.id,
            parent_id: ctx.profile.id,
            class_use: f.has("class"),
            public_use: f.has("public"),
            updated_at: new Date().toISOString(),
          }),
        );
        await ctx.refresh();
      }),
    );
}
export const pageRenderers = {
  overview,
  announcements,
  events,
  tasks,
  progress,
  absences,
  albums,
  consents,
  fees,
  operations,
  audit,
};
