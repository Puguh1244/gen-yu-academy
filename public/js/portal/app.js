import { db, result } from "../services/supabase.js";
import { loginView, account, signOut } from "./auth.js";
import { escapeHTML as e, showError, showStatus } from "./ui.js";
import { pageRenderers } from "./pages.js";
import { chatPage, stopChat } from "./chat.js";
import { announcements, events, calendar } from "./information.js";
import {
  overview,
  accountPage,
  notifications,
  access,
  responses,
} from "./workspace.js";
import {
  content,
  admissions,
  albums,
  operations,
} from "./school-management.js";
import { fees } from "./fees.js";
import { B, setLanguage, translateDOM } from "./i18n.js";
const renderers = {
  ...pageRenderers,
  fees,
  overview,
  announcements,
  events,
  calendar,
  account: accountPage,
  notifications,
  access,
  responses,
  content,
  admissions,
  albums,
  operations,
};
const root = document.getElementById("portal-root"),
  identity = document.getElementById("identity");
const labels = {
  overview: "Overview",
  announcements: "Announcements",
  events: "Events & RSVP",
  calendar: "Calendar",
  tasks: "Weekly Activities",
  progress: "Child Progress",
  absences: "Absences",
  chat: "Messages",
  albums: "Photo Albums",
  consents: "Photo Permissions",
  fees: "Fees & Payments",
  operations: "School Records",
  audit: "Activity Log",
  account: "Account",
  notifications: "Notifications",
  admissions: "Admissions",
  content: "Public Website",
  responses: "Responses",
  access: "Access Settings",
};
const menus = {
  parent: [
    "overview",
    "calendar",
    "announcements",
    "events",
    "chat",
    "absences",
    "tasks",
    "progress",
    "albums",
    "fees",
    "consents",
    "notifications",
    "account",
  ],
  teacher: [
    "overview",
    "calendar",
    "progress",
    "chat",
    "absences",
    "tasks",
    "albums",
    "announcements",
    "events",
    "content",
    "consents",
    "notifications",
    "account",
  ],
  admin: [
    "overview",
    "operations",
    "content",
    "admissions",
    "announcements",
    "events",
    "responses",
    "fees",
    "chat",
    "calendar",
    "absences",
    "consents",
    "audit",
    "access",
    "notifications",
    "account",
  ],
};
let profile = null,
  selected = "overview",
  selection = "",
  generation = 0;
export async function refresh() {
  stopChat();
  const version = ++generation;
  try {
    profile = await account();
    if (version !== generation) return;
    if (!profile) {
      identity.innerHTML = `<a class="btn secondary" href="index.html">${B("School website", "Website sekolah")}</a>`;
      loginView(root, refresh);
      return;
    }
    const prefs = await result(
      db
        .from("account_preferences")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle(),
    );
    setLanguage(prefs?.language || "en");
    await result(db.rpc("sync_my_notifications"));
    if (!menus[profile.role].includes(selected)) selected = "overview";
    identity.innerHTML = `<span class="badge">${e(profile.display_name)} · ${e(profile.role)}</span> <button class="btn secondary" id="language">EN / ID</button> <button class="btn secondary" id="logout">${B("Sign out", "Keluar")}</button>`;
    document.getElementById("logout").onclick = async () => {
      try {
        stopChat();
        await signOut();
        profile = null;
        selection = "";
        showStatus(B("Signed out.", "Berhasil keluar."));
        await refresh();
      } catch (err) {
        showError(err);
      }
    };
    document.getElementById("language").onclick = async () => {
      try {
        await result(
          db.from("account_preferences").upsert({
            ...prefs,
            user_id: profile.id,
            language: (prefs?.language || "en") === "en" ? "id" : "en",
          }),
        );
        await refresh();
      } catch (err) {
        showError(err);
      }
    };
    const [students, classes] = await Promise.all([
      result(db.from("students").select("*").order("name")),
      result(db.from("classes").select("*").order("name")),
    ]);
    if (version !== generation) return;
    const options = profile.role === "parent" ? students : classes;
    let scopedStudents = students,
      scopedClasses = classes;
    if (profile.role !== "admin" && options.length) {
      if (!options.some((x) => x.id === selection)) selection = options[0].id;
      if (profile.role === "parent") {
        scopedStudents = students.filter((s) => s.id === selection);
        scopedClasses = classes.filter(
          (c) => c.id === scopedStudents[0]?.class_id,
        );
      } else {
        scopedClasses = classes.filter((c) => c.id === selection);
        scopedStudents = students.filter((s) => s.class_id === selection);
      }
    }
    root.innerHTML = `<button type="button" class="portal-menu-toggle" id="portal-menu-toggle" aria-expanded="false" aria-controls="portal-navigation"><span aria-hidden="true">☰</span> ${B("Dashboard menu", "Menu Dashboard")}</button><button type="button" class="portal-nav-backdrop" id="portal-nav-backdrop" aria-label="${B("Close menu", "Tutup menu")}"></button><nav class="portal-nav" id="portal-navigation" aria-label="Portal navigation">${menus[profile.role].map((k) => `<button data-page="${k}" class="${selected === k ? "active" : ""}">${labels[k]}</button>`).join("")}</nav><div class="portal-top"><h1 class="live-heading">${labels[selected]}</h1>${profile.role !== "admin" && options.length ? `<label>${profile.role === "parent" ? B("Select your child", "Pilih anak") : B("Select your class", "Pilih kelas")}<select id="scope">${options.map((x) => `<option value="${x.id}" ${x.id === selection ? "selected" : ""}>${e(x.name)}${profile.role === "parent" ? " · " + e(classes.find((c) => c.id === x.class_id)?.name || "") : ""}</option>`).join("")}</select></label>` : ""}</div><section id="live-content"><p>${B("Loading…", "Memuat…")}</p></section>`;
    const menuToggle = document.getElementById("portal-menu-toggle");
    const navBackdrop = document.getElementById("portal-nav-backdrop");
    const closeMobileMenu = () => {
      root.classList.remove("portal-menu-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    };
    menuToggle?.addEventListener("click", () => {
      const open = root.classList.toggle("portal-menu-open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
    navBackdrop?.addEventListener("click", closeMobileMenu);
    root.querySelectorAll("[data-page]").forEach(
      (b) =>
        (b.onclick = () => {
          selected = b.dataset.page;
          closeMobileMenu();
          showStatus("");
          refresh();
        }),
    );
    const scope = document.getElementById("scope");
    if (scope)
      scope.onchange = () => {
        selection = scope.value;
        refresh();
      };
    const ctx = {
      profile,
      preferences: prefs || {},
      students: scopedStudents,
      classes: scopedClasses,
      allStudents: students,
      allClasses: classes,
      refresh,
      root: document.getElementById("live-content"),
      navigate: (page) => {
        if (!menus[profile.role].includes(page)) page = "overview";
        selected = page;
        return refresh();
      },
    };
    if (selected === "chat") await chatPage(ctx);
    else await renderers[selected](ctx);
    if (version === generation) {
      translateDOM(root);
      showStatus("");
    }
  } catch (err) {
    if (version === generation) {
      if (!profile) {
        root.innerHTML = "";
        identity.innerHTML = "";
        loginView(root, refresh);
      }
      showError(err);
      const content = document.getElementById("live-content");
      if (content)
        content.innerHTML = `<p class="empty">${B("Unable to load this page. Check the connection, migrations and account access.", "Halaman belum dapat dimuat. Periksa koneksi, migrasi, dan hak akses akun.")}</p>`;
      else loginView(root, refresh);
    }
  }
}
if (db)
  db.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      stopChat();
      profile = null;
      selected = "overview";
      setTimeout(refresh, 0);
    }
  });
refresh();

let checkingAccess = false;
async function recheckAccess() {
  if (!db || !profile || checkingAccess || document.hidden) return;
  checkingAccess = true;
  try {
    const current = await account();
    if (!current || current.role !== profile.role) {
      stopChat();
      profile = null;
      root.innerHTML = "";
      identity.innerHTML = "";
      await refresh();
    }
  } catch (error) {
    stopChat();
    profile = null;
    root.innerHTML = "";
    identity.innerHTML = "";
    loginView(root, refresh);
    showError(error);
  } finally {
    checkingAccess = false;
  }
}
document.addEventListener("visibilitychange", recheckAccess);
setInterval(recheckAccess, 30000);
