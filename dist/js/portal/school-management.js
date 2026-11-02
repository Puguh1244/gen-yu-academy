import { statusText } from "./i18n.js";
import { db, result, uploadFile, cleanupFile } from "../services/supabase.js";
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
} from "./spec-ui.js";
import { fileButton, bindFiles, pageRenderers } from "./pages.js";
const baseOperations = pageRenderers.operations;
export async function content(ctx) {
  const rows = await all("school_content");
  const admin = ctx.profile.role === "admin";
  const fields = () =>
    select(
      "kind",
      B("Content type", "Jenis konten"),
      (admin
        ? ["news", "teacher", "article", "gallery", "page"]
        : ["news"]
      ).map((id) => ({
        id,
        name: {
          news: B("News & achievements", "Berita & prestasi"),
          teacher: B("Teacher profile", "Profil guru"),
          article: B("Parent resource", "Artikel edukatif"),
          gallery: B("Public gallery", "Galeri publik"),
          page: B("School information", "Informasi sekolah"),
        }[id],
      })),
    ) +
    bilingual(
      "title",
      B("Title / professional name", "Judul / nama profesional"),
    ) +
    bilingual(
      "body",
      B("Content / teaching approach", "Isi / pendekatan mengajar"),
      true,
    ) +
    bilingual("summary", B("Summary", "Ringkasan")) +
    select("class_id", B("Related class", "Kelas terkait"), [
      { id: "", name: "—" },
      ...ctx.classes,
    ]).replace(" required", "") +
    field(
      "qualifications",
      B(
        "Verified qualifications (teacher profile)",
        "Pendidikan terverifikasi (profil guru)",
      ),
      "text",
      false,
    ) +
    field(
      "experience",
      B("Verified experience", "Pengalaman terverifikasi"),
      "text",
      false,
    ) +
    field("role", B("Professional role", "Peran profesional"), "text", false) +
    field(
      "file",
      B(
        "Official photo / approved documentation (JPG or PNG)",
        "Foto resmi / dokumentasi berizin (JPG atau PNG)",
      ),
      "file",
      false,
    ) +
    select(
      "status",
      B("Publication status", "Status publikasi"),
      (admin
        ? ["draft", "submitted", "published"]
        : ["draft", "submitted"]
      ).map((id) => ({
        id,
        name: {
          draft: B("Draft", "Draf"),
          submitted: B("Submit for admin review", "Ajukan tinjauan admin"),
          published: B("Publish", "Terbitkan"),
        }[id],
      })),
    ) +
    (admin
      ? `<label class="check"><input name="verified" type="checkbox">${B("I have verified the facts, names, dates and qualifications", "Saya telah memverifikasi fakta, nama, tanggal, dan pendidikan")}</label><label class="check"><input name="photo_permission" type="checkbox">${B("Required photo and identity permissions have been confirmed", "Izin foto dan identitas yang diperlukan telah dikonfirmasi")}</label>`
      : "");
  ctx.root.innerHTML = `<p class="notice">${B("Teachers submit achievement material; administration reviews and publishes. Public teacher profiles do not contain personal phone numbers or email addresses.", "Guru mengusulkan bahan prestasi; admin memeriksa dan menerbitkan. Profil guru publik tidak memuat nomor atau email pribadi.")}</p>${details("new-content", admin ? B("Create public content", "Buat konten publik") : B("Propose school news", "Usulkan berita sekolah"), fields())}<div class="records">${rows.map((x) => `<article class="card"><span class="badge">${e(x.kind)} · ${e(statusText(x.status))}</span><h3>${e(textOf(x, "title"))}</h3><p class="record-body" data-content>${e(textOf(x, "body"))}</p>${fileButton("school-media", x.file_path)}${admin || (x.created_by === ctx.profile.id && x.status !== "published") ? details("edit-content-" + x.id, B("Edit / review", "Ubah / tinjau"), fields()) : ""}</article>`).join("")}</div>`;
  bindFiles(ctx.root);
  async function save(f, old) {
    let file = await uploadFile("school-media", ctx.profile.id, f.get("file"));
    try {
      const row = {
        kind: f.get("kind"),
        title: f.get("title"),
        title_id: f.get("title_id"),
        body: f.get("body"),
        body_id: f.get("body_id"),
        summary: f.get("summary"),
        summary_id: f.get("summary_id"),
        class_id: f.get("class_id") || null,
        status: f.get("status"),
        metadata: {
          qualifications: f.get("qualifications"),
          experience: f.get("experience"),
          role: f.get("role"),
        },
        file_path: file || old?.file_path || null,
        ...(admin
          ? {
              verified: f.has("verified"),
              photo_permission: f.has("photo_permission"),
              published_at:
                f.get("status") === "published"
                  ? new Date().toISOString()
                  : null,
            }
          : {}),
      };
      await result(
        old
          ? db.from("school_content").update(row).eq("id", old.id)
          : db.from("school_content").insert(row),
      );
    } catch (err) {
      await cleanupFile("school-media", file);
      throw err;
    }
    await ctx.refresh();
  }
  bindForm("new-content", (f) => save(f));
  rows.forEach((x) => {
    fillForm(document.getElementById("edit-content-" + x.id), {
      ...x,
      ...x.metadata,
    });
    bindForm("edit-content-" + x.id, (f) => save(f, x));
  });
}
export async function admissions(ctx) {
  const rows = await all("admission_enquiries");
  ctx.root.innerHTML = `<p class="notice">${B("An enquiry is not admission confirmation. Confirm school visits directly; do not offer trial sessions until the school has approved their availability.", "Permintaan belum berarti diterima. Konfirmasi kunjungan secara langsung; jangan menawarkan trial sebelum layanan dan jadwal disahkan sekolah.")}</p><div class="records">${
    rows
      .map(
        (x) =>
          `<article class="card"><span class="badge">${e(statusText(x.status))}</span><h3>${e(x.guardian_name)}</h3><p>${e(x.programme)} · ${e(x.child_age)}<br>${e(x.email)} · ${e(x.phone)}</p><p>${B("Preferred visit", "Usulan kunjungan")}: ${e(x.preferred_visit || "—")}</p><p class="record-body" data-content>${e(x.message)}</p><form id="enquiry-${x.id}">${select(
            "status",
            B("Status", "Status"),
            [
              "Received",
              "Contacted",
              "Visit Scheduled",
              "Registration in Progress",
              "Completed",
            ].map((id) => ({ id, name: statusText(id) })),
          )}${field("confirmed_visit", B("Confirmed visit (optional; local time)", "Kunjungan terkonfirmasi (opsional; waktu lokal)"), "datetime-local", false)}${textarea("follow_up", B("Follow-up record / next step", "Catatan tindak lanjut / langkah berikutnya"), false)}${submit()}</form></article>`,
      )
      .join("") || empty(B("No enquiries yet.", "Belum ada permintaan."))
  }</div>`;
  rows.forEach((x) => {
    fillForm(document.getElementById("enquiry-" + x.id), x);
    bindForm("enquiry-" + x.id, async (f) => {
      await result(
        db
          .from("admission_enquiries")
          .update({
            status: f.get("status"),
            follow_up: f.get("follow_up"),
            confirmed_visit: f.get("confirmed_visit")
              ? new Date(f.get("confirmed_visit")).toISOString()
              : null,
          })
          .eq("id", x.id),
      );
      await ctx.refresh();
    });
  });
}
export async function albums(ctx) {
  const rows = (await all("albums")).filter((x) => relevant(ctx, x));
  ctx.root.innerHTML =
    `<p class="notice">${B("Class albums require class-sharing consent. Individual albums stay with authorised guardians and teachers. Drive folders must be owned by the school and shared as Restricted.", "Album kelas membutuhkan izin berbagi dalam kelas. Album individual hanya untuk wali dan guru berwenang. Folder Drive harus dimiliki sekolah dan memakai Restricted.")}</p>` +
    (ctx.profile.role === "teacher"
      ? details(
          "album",
          B("Add activity album", "Tambah album kegiatan"),
          select("scope", B("Album audience", "Sasaran album"), [
            {
              id: "individual",
              name: B("Individual child", "Anak individual"),
            },
            { id: "class", name: B("Class", "Kelas") },
          ]) +
            select(
              "student_id",
              B("Child (individual album)", "Anak (album individual)"),
              [{ id: "", name: "—" }, ...ctx.students],
            ).replace(" required", "") +
            select("class_id", B("Class", "Kelas"), ctx.classes) +
            field("title", B("Album title", "Judul album")) +
            field(
              "activity_on",
              B("Activity date", "Tanggal kegiatan"),
              "date",
            ) +
            textarea("body", B("Description", "Deskripsi"), false) +
            field(
              "file",
              B(
                "Photo, document or short video (25 MB)",
                "Foto, dokumen atau video singkat (25 MB)",
              ),
              "file",
              false,
            ) +
            field(
              "drive_url",
              B(
                "Restricted Google Drive link (optional)",
                "Tautan Google Drive Restricted (opsional)",
              ),
              "url",
              false,
            ) +
            `<label class="check"><input type="checkbox" name="consent_checked">${B("Class-sharing permissions have been checked for everyone shown", "Izin berbagi kelas telah diperiksa untuk semua anak dalam dokumentasi")}</label>`,
        )
      : "") +
    `<div class="records">${rows.map((x) => `<article class="card"><span class="badge">${x.class_id ? e(ctx.classes.find((c) => c.id === x.class_id)?.name) : e(ctx.students.find((s) => s.id === x.student_id)?.name)}</span><h3>${e(x.title)}</h3><p>${e(x.activity_on)}</p><p class="record-body" data-content>${e(x.body)}</p>${fileButton("learning-files", x.file_path)}${x.drive_url && /^https:\/\/drive\.google\.com\//.test(x.drive_url) ? `<a class="btn secondary" href="${e(x.drive_url)}" target="_blank" rel="noopener noreferrer">${B("Open Album", "Buka Album")}</a>` : ""}</article>`).join("") || empty(B("No approved albums yet.", "Belum ada album berizin."))}</div>`;
  bindFiles(ctx.root);
  bindForm("album", async (f) => {
    const isClass = f.get("scope") === "class",
      student = isClass ? null : f.get("student_id"),
      classId = isClass ? f.get("class_id") : null,
      drive = f.get("drive_url").trim();
    if (!isClass && !student)
      throw new Error(B("Select a child.", "Pilih anak."));
    if (isClass && !f.has("consent_checked"))
      throw new Error(
        B(
          "Confirm class-sharing consent first.",
          "Konfirmasi izin berbagi kelas dahulu.",
        ),
      );
    if (drive && !/^https:\/\/drive\.google\.com\//.test(drive))
      throw new Error("Use https://drive.google.com/");
    const path = await uploadFile(
      "learning-files",
      isClass ? "class/" + classId : student,
      f.get("file"),
    );
    try {
      if (!path && !drive)
        throw new Error(
          B("Choose a file or Drive link.", "Pilih berkas atau tautan Drive."),
        );
      await result(
        db.from("albums").insert({
          student_id: student,
          class_id: classId,
          title: f.get("title"),
          body: f.get("body"),
          activity_on: f.get("activity_on"),
          file_path: path,
          drive_url: drive || null,
          consent_checked: f.has("consent_checked"),
        }),
      );
    } catch (err) {
      await cleanupFile("learning-files", path);
      throw err;
    }
    await ctx.refresh();
  });
}
export async function operations(ctx) {
  await baseOperations(ctx);
  await accountAdministration(ctx);
  const families = await result(db.from("families").select("*").order("name"));
  ctx.root.insertAdjacentHTML(
    "beforeend",
    `<h2>${B("Family and class placement", "Keluarga dan penempatan kelas")}</h2>${details("family", B("Create a family record", "Buat data keluarga"), field("name", B("Family display name", "Nama tampilan keluarga")))}${ctx.students.length ? details("placement", B("Update class / family", "Ubah kelas / keluarga"), select("student", B("Child", "Anak"), ctx.students) + select("class_id", B("Class", "Kelas"), ctx.classes) + select("family_id", B("Family (for family RSVP)", "Keluarga (untuk RSVP keluarga)"), [{ id: "", name: "—" }, ...families]).replace(" required", "")) : ""}<p class="notice">${B("Moving class immediately changes portal class access. Complete the separate Drive-access review in Access Settings.", "Pindah kelas langsung mengubah akses kelas pada portal. Selesaikan pemeriksaan izin Drive terpisah pada Pengaturan Akses.")}</p>`,
  );
  bindForm("family", async (f) => {
    await result(db.from("families").insert({ name: f.get("name") }));
    await ctx.refresh();
  });
  bindForm("placement", async (f) => {
    await result(
      db
        .from("students")
        .update({
          class_id: f.get("class_id"),
          family_id: f.get("family_id") || null,
        })
        .eq("id", f.get("student")),
    );
    await ctx.refresh();
  });
}

export async function accountAdministration(ctx) {
  let available = false;
  try {
    const r = await fetch("/api/health");
    if (r.ok) available = (await r.json()).adminAccountsConfigured === true;
  } catch {}
  const node = document.createElement("section");
  ctx.root.append(node);
  if (!available) {
    node.innerHTML = `<p class="notice">${B("Account invitations and activation are available on the Node server when its private server key is configured. On static hosting, use Supabase Auth and the profile setup guide.", "Undangan dan aktivasi akun tersedia pada server Node bila server key privat dikonfigurasi. Pada hosting statis, gunakan Supabase Auth dan panduan profil.")}</p>`;
    return;
  }
  const profiles = await result(
    db.from("profiles").select("id,display_name,role,active"),
  );
  node.innerHTML =
    details(
      "invite-account",
      B("Invite verified school account", "Undang akun sekolah terverifikasi"),
      field("name", B("Display name", "Nama tampilan")) +
        field("email", "Email", "email") +
        select(
          "role",
          B("Role approved by school", "Peran yang disahkan sekolah"),
          [
            { id: "parent", name: B("Parent", "Orang tua") },
            { id: "teacher", name: B("Teacher", "Guru") },
            { id: "admin", name: B("Administrator", "Admin") },
          ],
        ),
    ) +
    `<div class="records">${profiles
      .filter((p) => p.id !== ctx.profile.id)
      .map(
        (p) =>
          `<article class="card"><b>${e(p.display_name)} · ${e(p.role)}</b><button class="btn secondary" data-account-status="${p.id}">${p.active ? B("Deactivate account", "Nonaktifkan akun") : B("Activate account", "Aktifkan akun")}</button></article>`,
      )
      .join("")}</div>`;
  async function api(path, payload) {
    const {
      data: { session },
    } = await db.auth.getSession();
    const response = await fetch("/api/admin/" + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session.access_token,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Account request failed");
    return data;
  }
  bindForm("invite-account", async (f) => {
    await api("invite", Object.fromEntries(f));
    await ctx.refresh();
  });
  action(node, "[data-account-status]", async (b) => {
    const p = profiles.find((x) => x.id === b.dataset.accountStatus);
    if (
      !confirm(
        B(
          "Change access for this school account?",
          "Ubah akses akun sekolah ini?",
        ),
      )
    )
      return;
    await api("account-status", { id: p.id, active: !p.active });
    await ctx.refresh();
  });
}
