import { db, configured, result, fileUrl } from "./services/supabase.js";
const e = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const tr = (en, id) => (document.documentElement.lang === "id" ? id : en);
const value = (x, k) =>
  document.documentElement.lang === "id"
    ? x[k + "_id"] || x[k] || ""
    : x[k] || "";
let feed = null;
async function boot() {
  window.GENYU_LIVE = {
    submitEnquiry: async (form) => {
      const f = new FormData(form),
        button = form.querySelector("[type=submit]");
      button.disabled = true;
      try {
        const response = await fetch("/api/enquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: f.get("name"),
            email: f.get("email"),
            phone: f.get("phone"),
            programme: f.get("programme"),
            age: f.get("age"),
            date: f.get("date") || null,
            message: f.get("message") || "",
            consent: f.has("consent"),
            website: f.get("website") || "",
            language: document.documentElement.lang,
          }),
        });
        const receipt = await response.json().catch(() => null);
        if (!response.ok || !receipt?.ok)
          throw new Error(receipt?.error || tr("Unable to send your request. Please try again.", "Permintaan belum terkirim. Silakan coba lagi."));
        form.reset();
        window.openModal(
          tr("Request received", "Permintaan diterima"),
          `<p>${tr("Thank you. Your request has been received. Our school team will contact you to confirm the schedule.", "Terima kasih. Permintaan Anda telah diterima. Tim sekolah akan menghubungi Anda untuk mengonfirmasi jadwal.")}</p><p>${receipt.emailSent
            ? tr("A confirmation email has been sent to the address you entered. Please check your inbox and spam folder.", "Email konfirmasi telah dikirim ke alamat yang Anda isi. Silakan periksa kotak masuk dan folder spam.")
            : tr("Your request is saved, but we could not send the confirmation email. You do not need to submit the form again.", "Permintaan sudah tersimpan, tetapi email konfirmasi belum dapat dikirim. Anda tidak perlu mengisi ulang formulir.")}</p><p class="small muted">${tr("Request reference", "Nomor permintaan")}: ${e(receipt.id)}</p>`,
        );
      } catch (error) {
        window.toast(error instanceof TypeError
          ? tr("Your request could not be confirmed. Please try again later.", "Permintaan belum dapat dikonfirmasi. Silakan coba lagi nanti.")
          : error.message);
      } finally {
        button.disabled = false;
      }
    },
  };
  function image(x) {
    return x.file_path
      ? `<img data-public-photo="${e(x.file_path)}" alt="${e(value(x, "title"))}" loading="lazy" style="width:100%;max-height:260px;object-fit:cover;border-radius:16px;margin-bottom:18px">`
      : "";
  }
  function contentCards(kind) {
    return (feed?.content || [])
      .filter((x) => x.kind === kind)
      .map(
        (x) =>
          `<article class="card">${image(x)}<h3>${e(value(x, "title"))}</h3><p>${e(value(x, "summary"))}</p>${kind === "teacher" ? `<p>${e(value(x.metadata || {}, "role"))} · ${e(value(x.metadata || {}, "qualifications"))}<br>${e(value(x.metadata || {}, "experience"))}</p><p>${e(x.metadata?.class_name || x.summary || "")}</p>${x.metadata?.fictional ? `<span class="badge">${tr("Fictional profile — qualifications unverified", "Profil fiktif — kualifikasi belum diverifikasi")}</span>` : ""}<p>${e(value(x, "body"))}</p>` : `<button class="link" data-content-id="${x.id}">${tr("Read More", "Baca Selengkapnya")} ↗</button>`}</article>`,
      )
      .join("");
  }
  // Keep the approved four profiles; newly published CMS profiles appear below.
  window.schoolTeacherCards = () => {
    const curated = window.sampleTeacherCards();
    const published = contentCards("teacher");
    return curated + (published ? `<div class="grid g3" style="margin-top:24px">${published}</div>` : "");
  };
  window.liveSchoolUpdates = () =>
    `<div class="grid g3">${(feed?.announcements || []).map((x) => `<article class="card"><span class="badge">${tr("School Announcements", "Pengumuman Sekolah")}</span><h3>${e(value(x, "title"))}</h3><p>${e(value(x, "body"))}</p></article>`).join("")}${(feed?.events || []).map((x) => `<article class="card"><span class="badge">${tr("Upcoming Events", "Acara Mendatang")}</span><h3>${e(value(x, "title"))}</h3><p>${e(new Date(x.starts_at).toLocaleString(document.documentElement.lang === "id" ? "id-ID" : "en-GB", { timeZone: "Asia/Jakarta" }))} WIB<br>${e(x.location)}</p><p>${e(value(x, "body"))}</p><a class="link" href="portal.html">${tr("Family event details in the portal", "Rincian acara keluarga di portal")} ↗</a></article>`).join("")}${contentCards("news") || ""}</div>${!feed?.announcements?.length && !feed?.events?.length && !feed?.content?.some((x) => x.kind === "news") ? `<p class="notice">${tr("Published school updates will appear here.", "Informasi sekolah yang diterbitkan akan tampil di sini.")}</p>` : ""}`;
  async function enhance() {
    document
      .querySelectorAll('form[onsubmit="submitEnquiry(event)"]')
      .forEach((form) => {
        form.querySelector(".notice").textContent = tr(
          "Your contact details are used only to respond to your request. A visit request is not an admission offer.",
          "Kontak digunakan untuk menanggapi permintaan. Permintaan kunjungan bukan konfirmasi penerimaan.",
        );
        form.querySelector("[type=submit]").textContent = tr(
          "Send Enquiry",
          "Kirim Permintaan",
        );
        if (!form.querySelector("[name=website]")) {
          const trap = document.createElement("input");
          trap.name = "website";
          trap.type = "text";
          trap.tabIndex = -1;
          trap.autocomplete = "off";
          trap.hidden = true;
          form.append(trap);
        }
      });
    const main = document.getElementById("main");
    if (!main || !feed) return;
    const page = location.hash.slice(1) || "home";
    // Keep the three curated Around Our School cards visible while
    // displaying verified Supabase updates in a separate section.
    if (
      page === "home" &&
      !document.getElementById("published-school-updates") &&
      ((feed.announcements?.length || 0) +
        (feed.events?.length || 0) +
        (feed.content?.filter((x) => x.kind === "news").length || 0)) > 0
    ) {
      main.insertAdjacentHTML(
        "beforeend",
        `<section class="section" id="published-school-updates"><div class="wrap"><div class="section-head"><div><div class="eyebrow">${tr("School updates", "Pembaruan sekolah")}</div><h2>${tr("Latest from our school", "Kabar terbaru dari sekolah")}</h2></div></div>${window.liveSchoolUpdates()}</div></section>`,
      );
    }

    if (
      page === "school-life" &&
      !document.getElementById("published-resources")
    )
      main.insertAdjacentHTML(
        "beforeend",
        `<section class="wrap section" id="published-resources"><h2>${tr("School Gallery and Family Resources", "Galeri Sekolah dan Artikel Keluarga")}</h2><div class="grid g3">${contentCards("gallery")}${contentCards("article")}</div></section>`,
      );
    if (
      (page === "admissions" || page === "contact") &&
      !document.getElementById("admissions-guidance")
    )
      main.insertAdjacentHTML(
        "beforeend",
        `<section class="wrap section" id="admissions-guidance"><h2>${tr("School Hours and Admissions", "Jadwal dan Penerimaan")}</h2><p style="white-space:pre-wrap">${e(feed.settings?.admissions?.[document.documentElement.lang] || "")}</p></section>`,
      );
    if (page === "about" && !document.getElementById("published-pages"))
      main.insertAdjacentHTML(
        "beforeend",
        `<section class="wrap section" id="published-pages"><div class="grid g2">${contentCards("page")}</div></section>`,
      );
    main.querySelectorAll("[data-content-id]").forEach(
      (button) =>
        (button.onclick = () => {
          const x = feed.content.find((x) => x.id === button.dataset.contentId);
          window.openModal(
            value(x, "title"),
            `${image(x)}<p style="white-space:pre-wrap">${e(value(x, "body"))}</p><button class="btn secondary" onclick="closeModal()">${tr("Back to list", "Kembali ke daftar")}</button>`,
          );
          loadImages(document.getElementById("modal"));
        }),
    );
    await loadImages(main);
  }
  async function loadImages(root) {
    for (const img of root.querySelectorAll(
      "img[data-public-photo]:not([src])",
    )) {
      try {
        img.src = await fileUrl("school-media", img.dataset.publicPhoto);
      } catch {
        img.replaceWith(
          document.createTextNode(
            tr("Photo unavailable.", "Foto belum tersedia."),
          ),
        );
      }
    }
  }
  window.addEventListener("genyu:render", () => enhance().catch(() => {}));
  try {
    feed = await result(db.rpc("website_feed"));
    window.render(false);
    await enhance();
  } catch (error) {
    window.toast(
      tr(
        "School updates could not load. Please try again.",
        "Informasi sekolah belum dapat dimuat. Silakan coba lagi.",
      ),
    );
    await enhance();
  }
}

if (configured) {
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
}

