import { B, language, friendlyError } from "./i18n.js";
export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const money = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);
export const date = (v) =>
  v
    ? new Date(v).toLocaleString(language === "id" ? "id-ID" : "en-GB", {
        timeZone: "Asia/Jakarta",
      }) + " WIB"
    : "—";
export function field(name, label, type = "text", required = true) {
  return `<label class="field">${escapeHTML(label)}<input name="${name}" type="${type}" ${required ? "required" : ""} ${type === "file" ? 'accept="image/jpeg,image/png,application/pdf,video/mp4,video/webm"' : ""}></label>`;
}
export function textarea(name, label, required = true) {
  return `<label class="field">${escapeHTML(label)}<textarea name="${name}" ${required ? "required" : ""} maxlength="5000"></textarea></label>`;
}
export function select(name, label, items) {
  return `<label class="field">${escapeHTML(label)}<select name="${name}" required>${items.map((x) => `<option value="${escapeHTML(x.id)}">${escapeHTML(x.title || x.name)}</option>`).join("")}</select></label>`;
}
export const empty = (text) => `<p class="empty">${escapeHTML(text)}</p>`;
export function showError(error) {
  const el = document.querySelector("#status");
  el.textContent = friendlyError(error);
  el.className = "notice error";
}
export function showStatus(message) {
  const el = document.querySelector("#status");
  el.textContent = message;
  el.className = "notice";
}
export function bindForm(id, handler) {
  const form = document.getElementById(id);
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form, event.submitter);
    const button = event.submitter || form.querySelector("[type=submit]");
    if (button) button.disabled = true;
    try {
      await handler(data);
    } catch (e) {
      showError(e);
    } finally {
      if (button) button.disabled = false;
    }
  });
}
