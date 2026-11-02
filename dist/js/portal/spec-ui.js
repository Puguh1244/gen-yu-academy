import { db, result } from "../services/supabase.js";
import { B, textOf } from "./i18n.js";
import {
  escapeHTML as e,
  field,
  textarea,
  select,
  bindForm,
  showError,
} from "./ui.js";
export { B, textOf, e, field, textarea, select, bindForm, showError };
export const submit = () =>
  `<button class="btn" type="submit">${B("Save", "Simpan")}</button>`;
export const bilingual = (key, label, multiline = false) =>
  (multiline ? textarea : field)(key, label + " · English") +
  (multiline ? textarea : field)(key + "_id", label + " · Bahasa Indonesia");
export function action(root, selector, fn) {
  root.querySelectorAll(selector).forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        try {
          await fn(b);
        } catch (err) {
          showError(err);
        } finally {
          b.disabled = false;
        }
      }),
  );
}
export function fillForm(form, row) {
  if (!form) return;
  for (const el of form.elements) {
    if (!(el.name in row) || el.type === "file") continue;
    if (el.type === "checkbox") el.checked = !!row[el.name];
    else if (el.type === "datetime-local" && row[el.name]) {
      let d = new Date(row[el.name]);
      d = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      el.value = d.toISOString().slice(0, 16);
    } else el.value = row[el.name] ?? "";
  }
}
export function audienceFields(ctx) {
  return (
    select(
      "audience",
      B("Audience", "Sasaran"),
      ["public", "all", "programme", "class"].map((id) => ({
        id,
        name: {
          public: B("Public", "Publik"),
          all: B("All families", "Semua keluarga"),
          programme: B("Programme", "Jenjang"),
          class: B("Class", "Kelas"),
        }[id],
      })),
    ) +
    select(
      "class_id",
      B(
        "Target class (for Class audience)",
        "Kelas sasaran (untuk sasaran Kelas)",
      ),
      [{ id: "", name: "—" }, ...ctx.classes],
    ).replace(" required", "") +
    select(
      "programme",
      B("Target programme (for Programme audience)", "Jenjang sasaran"),
      [
        { id: "", name: "—" },
        ...["Toddler", "Playgroup", "Pre-Kindergarten", "Kindergarten"].map(
          (id) => ({
            id,
            name: id,
          }),
        ),
      ],
    ).replace(" required", "")
  );
}
export function audienceData(f) {
  const a = f.get("audience");
  if (
    (a === "class" && !f.get("class_id")) ||
    (a === "programme" && !f.get("programme"))
  )
    throw new Error(
      B("Choose the target audience.", "Pilih sasaran informasi."),
    );
  return {
    audience: a,
    class_id: a === "class" ? f.get("class_id") : null,
    programme: a === "programme" ? f.get("programme") : null,
  };
}
export function relevant(ctx, row) {
  if (ctx.profile.role === "admin") return true;
  if (row.student_id) return ctx.students.some((s) => s.id === row.student_id);
  if (row.class_id) return ctx.classes.some((c) => c.id === row.class_id);
  if (row.audience === "programme")
    return ctx.classes.some((c) => c.programme === row.programme);
  return true;
}
export async function all(table, order = "created_at") {
  return result(
    db.from(table).select("*").order(order, { ascending: false }).limit(500),
  );
}
export const record = (title, body) =>
  `<article class="card"><h3>${e(title)}</h3>${body}</article>`;
export function details(id, title, body) {
  return `<details class="card record-form"><summary>${title}</summary><form id="${id}">${body}${submit()}</form></details>`;
}
export function instant(value) {
  return value ? new Date(value).toISOString() : null;
}
