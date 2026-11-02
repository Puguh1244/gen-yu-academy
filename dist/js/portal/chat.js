import { db, result, uploadFile, cleanupFile } from "../services/supabase.js";
import { date, empty } from "./ui.js";
import {
  B,
  e,
  field,
  textarea,
  select,
  bindForm,
  showError,
  submit,
  action,
  relevant,
} from "./spec-ui.js";
import { fileButton, bindFiles } from "./pages.js";
let subscription = null,
  activeToken = 0,
  chosenThread = null;
export function stopChat() {
  activeToken++;
  if (subscription) {
    db.removeChannel(subscription);
    subscription = null;
  }
}
export async function chatPage(ctx) {
  const token = ++activeToken;
  await result(db.rpc("ensure_threads"));
  const threads = (
    await result(db.from("threads").select("*").order("kind").order("title"))
  ).filter((t) => relevant(ctx, t));
  const unread = await result(db.rpc("unread_messages"));
  const unreadByThread = new Map(
    unread.map((row) => [row.thread_id, Number(row.total)]),
  );
  const threadTitle = (t) =>
    `${{ class: B("Class", "Kelas"), private: B("Private", "Pribadi"), finance: B("Finance", "Keuangan") }[t.kind]} · ${t.title}${t.kind === "private" ? " · " + t.topic : ""}`;
  const settings = await result(
    db
      .from("school_settings")
      .select("value")
      .eq("key", "teacher_service_hours")
      .maybeSingle(),
  );
  if (token !== activeToken) return;
  ctx.root.innerHTML = `<p class="notice">${ctx.profile.role === "admin" ? B("Finance conversations only.", "Hanya percakapan keuangan.") : B("Class messages are shared. Private conversations require explicit participants; another guardian is not automatically included.", "Pesan kelas dibaca bersama. Percakapan pribadi membutuhkan peserta eksplisit; wali lain tidak otomatis ikut.")} ${B("Personal phone numbers and email addresses are not displayed.", "Nomor dan email pribadi tidak ditampilkan.")}</p><p>${e(B(settings?.value?.en, settings?.value?.id) || "")}</p>${
    ctx.profile.role === "parent" && ctx.students.length
      ? `<details class="card"><summary>${B("Start a private conversation", "Mulai percakapan pribadi")}</summary><form id="start-private">${select("student", B("Child", "Anak"), ctx.students)}<div id="teacher-choice"></div>${select(
          "topic",
          B("Topic", "Topik"),
          [
            { id: "Absence", name: B("Absence", "Ketidakhadiran") },
            { id: "Wellbeing", name: B("Wellbeing", "Kondisi anak") },
            {
              id: "Learning Support",
              name: B("Learning Support", "Dukungan belajar"),
            },
            {
              id: "General Question",
              name: B("General Question", "Pertanyaan umum"),
            },
          ],
        )}<button class="btn" type="submit">${B("Open private conversation", "Buka percakapan pribadi")}</button></form></details>`
      : ""
  }${
    threads.length
      ? select(
          "thread",
          B("Conversation", "Percakapan"),
          threads.map((t) => ({
            id: t.id,
            title:
              threadTitle(t) +
              (unreadByThread.get(t.id)
                ? ` (${unreadByThread.get(t.id)} ${B("new", "baru")})`
                : ""),
          })),
        ) + '<div id="chat-content"></div>'
      : empty(B("No conversations yet.", "Belum ada percakapan."))
  }`;
  const start = document.getElementById("start-private");
  if (start) {
    const choose = async () => {
      const teachers = await result(
        db.rpc("child_teachers", { p_student: start.elements.student.value }),
      );
      document.getElementById("teacher-choice").innerHTML = teachers.length
        ? select(
            "teacher",
            B("Teacher participant", "Guru peserta"),
            teachers.map((p) => ({ id: p.id, name: p.display_name })),
          )
        : empty(B("No teacher assigned yet.", "Belum ada guru ditugaskan."));
    };
    start.elements.student.onchange = () => choose().catch(showError);
    await choose();
    bindForm("start-private", async (f) => {
      chosenThread = await result(
        db.rpc("start_private_chat", {
          p_student: f.get("student"),
          p_teacher: f.get("teacher"),
          p_topic: f.get("topic"),
        }),
      );
      await ctx.refresh();
    });
  }
  if (!threads.length) return;
  const selector = ctx.root.querySelector("select[name=thread]");
  if (threads.some((t) => t.id === chosenThread)) selector.value = chosenThread;
  let localVersion = 0;
  async function open() {
    const local = ++localVersion,
      t = threads.find((t) => t.id === selector.value);
    if (subscription) {
      await db.removeChannel(subscription);
      subscription = null;
    }
    chosenThread = t.id;
    const container = document.getElementById("chat-content");
    const locked = t.read_only && ctx.profile.role !== "teacher";
    container.innerHTML = `<span class="badge">${e(t.kind)}${t.read_only ? " · " + B("Teachers post only", "Hanya guru menulis") : ""}</span><p class="small muted">${B("Latest 100 messages.", "100 pesan terbaru.")} <span id="connection"></span></p><div id="messages" class="chat" aria-live="polite"></div>${!locked ? `<form id="send-message">${textarea("body", B("Your message", "Pesan Anda"), false)}${field("file", B("Optional JPG, PNG or PDF (10 MB)", "JPG, PNG, atau PDF opsional (10 MB)"), "file", false)}<button type="submit" class="btn">${B("Send message", "Kirim pesan")}</button></form>` : empty(B("Only the teacher can post here.", "Hanya guru dapat menulis di kanal ini."))}<div class="live-actions"><button id="refresh-messages" class="btn secondary">${B("Refresh messages", "Muat ulang pesan")}</button>${ctx.profile.role === "teacher" && t.kind === "class" ? `<button id="lock-chat" class="btn secondary">${t.read_only ? B("Allow family replies", "Izinkan balasan wali") : B("Teachers post only", "Hanya guru menulis")}</button>` : ""}</div>`;
    async function messages() {
      const rows = await result(
        db
          .from("messages")
          .select("*")
          .eq("thread_id", t.id)
          .order("created_at", { ascending: false })
          .limit(100),
      );
      if (token !== activeToken || local !== localVersion) return;
      const list = document.getElementById("messages");
      if (!list) return;
      list.innerHTML =
        rows
          .sort(
            (a, b) =>
              Number(b.pinned) - Number(a.pinned) ||
              new Date(a.created_at) - new Date(b.created_at),
          )
          .map(
            (m) =>
              `<div class="live-message ${m.sender_id === ctx.profile.id ? "mine" : ""}">${m.pinned ? `<span class="badge">${B("Pinned", "Disematkan")}</span>` : ""}<strong>${e(m.sender_name)} · ${e(m.sender_role || "")}</strong><p data-content>${e(m.body)}</p>${fileButton("chat-files", m.file_path)}<small>${e(date(m.created_at))}</small>${ctx.profile.role === "teacher" && t.kind === "class" ? `<button class="link" data-pin="${m.id}">${m.pinned ? B("Unpin", "Lepas sematan") : B("Pin", "Sematkan")}</button>` : ""}</div>`,
          )
          .join("") ||
        empty(B("Start a school conversation.", "Mulai percakapan sekolah."));
      bindFiles(list);
      action(list, "[data-pin]", async (b) => {
        const m = rows.find((x) => x.id === b.dataset.pin);
        await result(
          db.rpc("pin_message", { p_message: m.id, p_pinned: !m.pinned }),
        );
        await messages();
      });
      await result(
        db.from("thread_reads").upsert({
          thread_id: t.id,
          user_id: ctx.profile.id,
          read_at: rows.length
            ? new Date(
                Math.max(...rows.map((m) => new Date(m.created_at).getTime())),
              ).toISOString()
            : new Date().toISOString(),
        }),
      );
      const option = [...selector.options].find((o) => o.value === t.id);
      if (option) option.textContent = threadTitle(t);
      const notices = await result(
        db
          .from("notifications")
          .select("id")
          .eq("category", "messages")
          .eq("source_id", t.id)
          .is("read_at", null),
      );
      for (const n of notices)
        await result(db.rpc("mark_notification", { p_id: n.id }));
    }
    await messages();
    bindForm("send-message", async (f) => {
      let body = f.get("body").trim();
      const file = await uploadFile("chat-files", t.id, f.get("file"));
      try {
        if (!body && !file)
          throw new Error(
            B(
              "Write a message or choose a file.",
              "Tulis pesan atau pilih berkas.",
            ),
          );
        await result(
          db.from("messages").insert({
            thread_id: t.id,
            body: body || B("Attachment", "Lampiran"),
            file_path: file,
          }),
        );
      } catch (err) {
        await cleanupFile("chat-files", file);
        throw err;
      }
      document.getElementById("send-message")?.reset();
      await messages();
    });
    action(container, "#refresh-messages", messages);
    action(container, "#lock-chat", async () => {
      await result(
        db.rpc("set_class_read_only", {
          p_thread: t.id,
          p_value: !t.read_only,
        }),
      );
      await ctx.refresh();
    });
    if (token !== activeToken || local !== localVersion) return;
    subscription = db
      .channel(`thread-${t.id}-${token}-${local}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${t.id}`,
        },
        () => messages().catch(showError),
      )
      .subscribe((status) => {
        const label = document.getElementById("connection");
        if (label && token === activeToken && local === localVersion)
          label.textContent =
            status === "SUBSCRIBED"
              ? B("Live updates connected.", "Pembaruan langsung tersambung.")
              : B(
                  "Use Refresh messages if live updates are unavailable.",
                  "Gunakan Muat ulang pesan jika pembaruan langsung tidak tersedia.",
                );
      });
  }
  selector.onchange = () => open().catch(showError);
  await open();
}
