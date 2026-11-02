import { db, result, uploadFile, cleanupFile } from "../services/supabase.js";
import { date, empty } from "./ui.js";
import { statusText } from "./i18n.js";
import {
  B,
  textOf,
  e,
  field,
  textarea,
  select,
  bindForm,
  showError,
  submit,
  bilingual,
  action,
  fillForm,
  relevant,
  all,
  details,
  instant,
} from "./spec-ui.js";
import { fileButton, bindFiles } from "./pages.js";
export async function tasks(ctx) {
  const assignments = (await all("assignments", "due_at")).filter((a) =>
    relevant(ctx, a),
  );
  const submissions = (await all("submissions")).filter((a) =>
    relevant(ctx, a),
  );
  ctx.root.innerHTML =
    (ctx.profile.role === "teacher" && ctx.classes.length
      ? details(
          "assignment",
          B("Create weekly activity", "Buat kegiatan mingguan"),
          select("class_id", B("Class", "Kelas"), ctx.classes) +
            bilingual("title", B("Title", "Judul")) +
            bilingual("body", B("Instructions", "Petunjuk"), true) +
            bilingual("goals", B("Development goals", "Tujuan perkembangan")) +
            bilingual("materials", B("Materials", "Bahan")) +
            bilingual("parent_role", B("Parent’s role", "Peran pendamping")) +
            bilingual(
              "expected_result",
              B("Expected submission", "Bentuk hasil"),
            ) +
            field(
              "published_at",
              B(
                "Publish at (device local time)",
                "Waktu terbit (waktu perangkat)",
              ),
              "datetime-local",
            ) +
            field(
              "due_at",
              B("Deadline (device local time)", "Tenggat (waktu perangkat)"),
              "datetime-local",
            ) +
            `<label class="check"><input type="checkbox" name="allow_late">${B("Allow late submissions", "Izinkan pengumpulan terlambat")}</label>`,
        )
      : "") +
    `<div class="records">${
      assignments
        .map((a) => {
          const children = ctx.students.filter(
              (s) => s.class_id === a.class_id,
            ),
            entries = submissions.filter((s) => s.assignment_id === a.id);
          return `<article class="card"><span class="badge">${e(ctx.classes.find((c) => c.id === a.class_id)?.name)}</span><h3>${e(textOf(a, "title"))}</h3><p class="record-body" data-content>${e(textOf(a, "body"))}</p><dl>${[
            ["goals", B("Goals", "Tujuan")],
            ["materials", B("Materials", "Bahan")],
            ["parent_role", B("Parent’s role", "Peran wali")],
            ["expected_result", B("Submission", "Bentuk hasil")],
          ]
            .map(
              ([k, l]) =>
                `<dt><b>${l}</b></dt><dd data-content>${e(textOf(a, k))}</dd>`,
            )
            .join(
              "",
            )}</dl><p>${B("Deadline", "Tenggat")}: ${e(date(a.due_at))}${a.allow_late ? " · " + B("Late submissions allowed", "Pengumpulan terlambat diizinkan") : ""}</p>${entries
            .map(
              (s) =>
                `<div class="portal-record"><strong>${e(ctx.students.find((c) => c.id === s.student_id)?.name)} · ${e(statusText(s.status))}${s.is_late ? " · " + B("Late", "Terlambat") : ""}</strong><p class="record-body" data-content>${e(s.note)}</p><small>${e(date(s.created_at))}</small><div>${fileButton("learning-files", s.file_path)}</div>${s.feedback ? `<p data-content>${B("Feedback", "Umpan balik")}: ${e(s.feedback)}</p>` : ""}${
                  ctx.profile.role === "teacher"
                    ? `<details><summary>${B("Review submission", "Tinjau hasil")}</summary><form id="review-${s.id}">${textarea("feedback", B("Feedback", "Umpan balik"))}${select(
                        "status",
                        B("Result", "Hasil"),
                        [
                          { id: "reviewed", name: statusText("reviewed") },
                          {
                            id: "needs_revision",
                            name: statusText("needs_revision"),
                          },
                        ],
                      )}${submit()}</form></details>`
                    : ""
                }</div>`,
            )
            .join(
              "",
            )}${ctx.profile.role === "parent" && children.length ? (a.allow_late || new Date(a.due_at) > new Date() ? `<details><summary>${B("Save draft / submit activity", "Simpan draf / kumpulkan kegiatan")}</summary><form id="submit-${a.id}">${select("student", B("Child", "Anak"), children)}${textarea("note", B("Activity note", "Catatan kegiatan"), false)}${field("file", B("Optional photo, document or short video (25 MB)", "Foto, dokumen, atau video singkat opsional (25 MB)"), "file", false)}<label class="check"><input type="checkbox" name="keep_file" checked>${B("Keep previous file if no replacement is selected", "Simpan berkas lama bila tidak memilih pengganti")}</label><div class="actions"><button type="submit" name="mode" value="draft" class="btn secondary">${B("Save Draft", "Simpan Draf")}</button><button type="submit" name="mode" value="submitted" class="btn">${B("Submit Activity", "Kumpulkan Kegiatan")}</button></div></form></details>` : `<span class="badge">${B("Submissions closed", "Pengumpulan ditutup")}</span>`) : ""}${ctx.profile.role === "parent" && !entries.length ? `<span class="badge">${B("Not Started", "Belum Dimulai")}</span>` : ""}</article>`;
        })
        .join("") ||
      empty(B("No weekly activities yet.", "Belum ada kegiatan mingguan."))
    }</div>`;
  bindFiles(ctx.root);
  bindForm("assignment", async (f) => {
    let row = Object.fromEntries(f);
    row.allow_late = f.has("allow_late");
    row.published_at = instant(f.get("published_at"));
    row.due_at = instant(f.get("due_at"));
    if (row.due_at <= row.published_at)
      throw new Error(
        B(
          "Deadline must follow publication.",
          "Tenggat harus setelah waktu terbit.",
        ),
      );
    await result(db.from("assignments").insert(row));
    await ctx.refresh();
  });
  if (ctx.profile.role === "parent")
    assignments.forEach((a) => {
      const form = document.getElementById("submit-" + a.id);
      if (!form) return;
      const previous = submissions.find(
        (s) =>
          s.assignment_id === a.id &&
          s.student_id === form.elements.student.value,
      );
      if (previous) form.elements.note.value = previous.note;
      bindForm(form.id, async (f) => {
        const student = f.get("student"),
          old = submissions.find(
            (s) => s.assignment_id === a.id && s.student_id === student,
          ),
          path = await uploadFile("learning-files", student, f.get("file"));
        try {
          await result(
            db.rpc("save_activity", {
              p_assignment: a.id,
              p_student: student,
              p_note: f.get("note"),
              p_file:
                path || (f.has("keep_file") ? old?.file_path : null) || null,
              p_draft: f.get("mode") === "draft",
            }),
          );
        } catch (err) {
          await cleanupFile("learning-files", path);
          throw err;
        }
        await ctx.refresh();
      });
    });
  if (ctx.profile.role === "teacher")
    submissions.forEach((s) =>
      bindForm("review-" + s.id, async (f) => {
        await result(
          db.rpc("review_submission", {
            p_submission: s.id,
            p_feedback: f.get("feedback"),
            p_status: f.get("status"),
          }),
        );
        await ctx.refresh();
      }),
    );
}
export async function progress(ctx) {
  const rows = (await all("progress_reports")).filter((x) => relevant(ctx, x));
  ctx.root.innerHTML =
    (ctx.profile.role === "teacher" && ctx.students.length
      ? details(
          "progress",
          B("Add a learning observation", "Tambah catatan perkembangan"),
          select("student_id", B("Child", "Anak"), ctx.students) +
            field(
              "observed_on",
              B("Observation date", "Tanggal pengamatan"),
              "date",
            ) +
            field("area", B("Development area", "Area perkembangan")) +
            bilingual("title", B("Activity", "Kegiatan")) +
            bilingual("body", B("Observation", "Pengamatan"), true) +
            bilingual(
              "achievement",
              B("Emerging skills", "Hal yang mulai dikuasai"),
              true,
            ) +
            bilingual(
              "support",
              B("Support needed", "Kebutuhan dukungan"),
              true,
            ) +
            bilingual(
              "home_activity",
              B("Home activity suggestion", "Saran kegiatan rumah"),
              true,
            ) +
            select("published", B("Visibility", "Visibilitas"), [
              { id: "false", name: B("Teacher draft", "Draf guru") },
              {
                id: "true",
                name: B("Share with family", "Bagikan kepada wali"),
              },
            ]),
        )
      : "") +
    `<div class="records">${
      rows
        .map(
          (x) =>
            `<article class="card"><span class="badge">${e(ctx.students.find((s) => s.id === x.student_id)?.name)} · ${x.published ? B("Shared", "Dibagikan") : B("Draft", "Draf")}</span><h3>${e(textOf(x, "title"))}</h3><p>${e(x.observed_on)} · ${e(x.area)}</p>${[
              ["body", B("Observation", "Pengamatan")],
              ["achievement", B("Emerging skills", "Kemampuan")],
              ["support", B("Support", "Dukungan")],
              ["home_activity", B("Try at home", "Kegiatan rumah")],
            ]
              .map(
                ([k, l]) =>
                  `<b>${l}</b><p class="record-body" data-content>${e(textOf(x, k))}</p>`,
              )
              .join(
                "",
              )}${ctx.profile.role === "teacher" && !x.published && x.created_by === ctx.profile.id ? `<button class="btn" data-share="${x.id}">${B("Share with family", "Bagikan kepada wali")}</button>` : ""}</article>`,
        )
        .join("") ||
      empty(
        B("No shared progress reports yet.", "Belum ada laporan perkembangan."),
      )
    }</div>`;
  bindForm("progress", async (f) => {
    let row = Object.fromEntries(f);
    row.published = f.get("published") === "true";
    await result(db.from("progress_reports").insert(row));
    await ctx.refresh();
  });
  action(ctx.root, "[data-share]", async (b) => {
    await result(
      db
        .from("progress_reports")
        .update({ published: true })
        .eq("id", b.dataset.share),
    );
    await ctx.refresh();
  });
}
export async function absences(ctx) {
  if (ctx.profile.role === "admin") {
    const rows = await result(db.rpc("absence_summary"));
    ctx.root.innerHTML =
      rows
        .map(
          (x) =>
            `<article class="card"><h3>${e(ctx.students.find((s) => s.id === x.student_id)?.name)}</h3><p>${e(x.starts_on)} — ${e(x.ends_on)} · ${x.cancelled ? B("Cancelled", "Dibatalkan") : x.acknowledged ? B("Acknowledged", "Diterima guru") : B("Sent", "Terkirim")}</p></article>`,
        )
        .join("") || empty(B("No absence records.", "Belum ada laporan izin."));
    return;
  }
  const rows = (await all("absences")).filter((x) => relevant(ctx, x));
  const history = await all("absence_history", "changed_at");
  const fields = () =>
    field("starts_on", B("Date from", "Tanggal mulai"), "date") +
    field("ends_on", B("Date to", "Tanggal akhir"), "date") +
    select("category", B("Reason", "Alasan"), [
      { id: "Unwell", name: B("Unwell", "Sakit") },
      { id: "Family Matter", name: B("Family Matter", "Urusan keluarga") },
      { id: "Other", name: B("Other", "Lainnya") },
    ]) +
    textarea("reason", B("Note to teacher", "Catatan untuk guru"));
  ctx.root.innerHTML =
    `<p class="notice">${B("Private to the reporting guardian and assigned teachers. Sending is not the same as acknowledgement or actual attendance.", "Hanya wali pengirim dan guru yang berwenang. Terkirim tidak berarti sudah dibaca atau menjadi catatan kehadiran aktual.")}</p>` +
    (ctx.profile.role === "parent" && ctx.students.length
      ? details(
          "absence",
          B("Report an absence", "Laporkan izin"),
          select("student_id", B("Child", "Anak"), ctx.students) + fields(),
        )
      : "") +
    `<div class="records">${
      rows
        .map(
          (x) =>
            `<article class="card"><h3>${e(ctx.students.find((s) => s.id === x.student_id)?.name)}</h3><p>${e(x.starts_on)} — ${e(x.ends_on)}</p><p class="record-body" data-content>${e(x.category)} · ${e(x.reason)}</p><span class="badge">${x.cancelled ? B("Cancelled", "Dibatalkan") : x.acknowledged_at ? B("Acknowledged", "Diterima guru") : B("Sent", "Terkirim")}</span><small>${e(date(x.acknowledged_at || x.updated_at))}</small>${ctx.profile.role === "teacher" && !x.cancelled && !x.acknowledged_at ? `<button class="btn" data-absence="${x.id}">${B("Acknowledge", "Tandai diterima")}</button>` : ""}${ctx.profile.id === x.created_by ? `<details><summary>${B("Correct / cancel report", "Koreksi / batalkan laporan")}</summary><form id="edit-${x.id}">${fields()}<label class="check"><input type="checkbox" name="cancelled">${B("Cancel this report", "Batalkan laporan ini")}</label>${submit()}</form></details>` : ""}<details><summary>${B("Change history", "Riwayat perubahan")}</summary>${
              history
                .filter((h) => h.absence_id === x.id)
                .map(
                  (h) =>
                    `<p>${e(date(h.changed_at))}<br>${e(h.snapshot.starts_on)} — ${e(h.snapshot.ends_on)}<br><span data-content>${e(h.snapshot.reason)}</span></p>`,
                )
                .join("") || "—"
            }</details></article>`,
        )
        .join("") || empty(B("No absence reports.", "Belum ada laporan izin."))
    }</div>`;
  bindForm("absence", async (f) => {
    await result(db.from("absences").insert(Object.fromEntries(f)));
    await ctx.refresh();
  });
  rows.forEach((x) => {
    fillForm(document.getElementById("edit-" + x.id), x);
    bindForm("edit-" + x.id, async (f) => {
      await result(
        db.rpc("edit_absence", {
          p_id: x.id,
          p_start: f.get("starts_on"),
          p_end: f.get("ends_on"),
          p_category: f.get("category"),
          p_reason: f.get("reason"),
          p_cancel: f.has("cancelled"),
        }),
      );
      await ctx.refresh();
    });
  });
  action(ctx.root, "[data-absence]", async (b) => {
    await result(
      db.rpc("acknowledge_absence", { p_absence: b.dataset.absence }),
    );
    await ctx.refresh();
  });
}
