import { db, result, uploadFile, cleanupFile } from "../services/supabase.js";
import {
  escapeHTML as e,
  field,
  textarea,
  select,
  empty,
  bindForm,
  money,
  date,
  showError,
} from "./ui.js";
import { fileButton, bindFiles } from "./pages.js";
const submit = '<button class="btn" type="submit">Save / Simpan</button>';
export async function fees(ctx) {
  if (ctx.profile.role === "teacher")
    throw new Error("Finance is not available to this role.");
  const invoices = await result(
    db
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  );
  const payments = await result(
    db
      .from("payment_proofs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
  );
  ctx.root.innerHTML =
    `<p class="notice">A receipt is not a confirmed payment. School administration must verify it before the balance changes. No payment gateway or bank transfer is initiated by this website.</p>` +
    (ctx.profile.role === "admin" && ctx.students.length
      ? `<details class="card record-form"><summary>Create an invoice</summary><form id="invoice">${select("student", "Child", ctx.students)}${field("title", "Invoice description / billing period")}${field("amount", "Amount (IDR)", "number")}${field("due", "Due date", "date")}${submit}</form></details>`
      : "") +
    `<div class="records">${
      invoices
        .map((x) => {
          const paid = Number(x.paid),
            remaining = Number(x.amount) - paid,
            proofs = payments.filter((p) => p.invoice_id === x.id),
            pending = proofs.some((p) => p.status === "pending");
          return `<article class="card"><span class="badge">${remaining <= 0 ? "Paid" : pending ? "Awaiting verification" : paid > 0 ? "Partially paid" : "Unpaid"}</span><h3>${e(x.title)} · ${e(ctx.students.find((s) => s.id === x.student_id)?.name)}</h3><p>Invoice ${e(x.id.slice(0, 8))} · Due ${e(x.due_on)}</p><h2>${money(remaining)}</h2><p>Total ${money(x.amount)} · Verified payments ${money(paid)}</p>${proofs
            .map(
              (p) =>
                `<div class="portal-record"><strong>${money(p.amount)} · ${e(p.status)}</strong><p>${e(date(p.created_at))}</p>${fileButton("payment-receipts", p.file_path)}${p.review_note ? `<p class="record-body">${e(p.review_note)}</p>` : ""}${
                  ctx.profile.role === "admin" && p.status === "pending"
                    ? `<details><summary>Verify payment</summary><form id="verify-${p.id}">${select(
                        "decision",
                        "Decision",
                        [
                          { id: "accept", name: "Accept payment" },
                          { id: "reject", name: "Reject evidence" },
                        ],
                      )}${textarea("note", "Verification note")}${submit}</form></details>`
                    : ""
                }</div>`,
            )
            .join(
              "",
            )}${ctx.profile.role === "parent" && remaining > 0 && !pending ? `<details><summary>Submit payment evidence</summary><form id="payment-${x.id}">${field("amount", "Transferred amount (IDR)", "number")}${field("file", "Receipt (JPG, PNG or PDF; max 10 MB)", "file")}${submit}</form></details>` : ""}</article>`;
        })
        .join("") || empty("No invoices available.")
    }</div>`;
  bindFiles(ctx.root);
  bindForm("invoice", async (f) => {
    await result(
      db.from("invoices").insert({
        student_id: f.get("student"),
        title: f.get("title"),
        amount: Number(f.get("amount")),
        due_on: f.get("due"),
      }),
    );
    await ctx.refresh();
  });
  if (ctx.profile.role === "parent")
    invoices.forEach((x) =>
      bindForm("payment-" + x.id, async (f) => {
        const amount = Number(f.get("amount"));
        if (amount <= 0 || amount > Number(x.amount) - Number(x.paid))
          throw new Error(
            "Enter a positive amount no greater than the balance.",
          );
        const path = await uploadFile(
          "payment-receipts",
          x.student_id,
          f.get("file"),
        );
        try {
          await result(
            db.rpc("submit_payment", {
              p_invoice: x.id,
              p_amount: amount,
              p_file: path,
            }),
          );
        } catch (err) {
          await cleanupFile("payment-receipts", path);
          throw err;
        }
        await ctx.refresh();
      }),
    );
  if (ctx.profile.role === "admin")
    payments.forEach((p) =>
      bindForm("verify-" + p.id, async (f) => {
        await result(
          db.rpc("verify_payment", {
            p_payment: p.id,
            p_accept: f.get("decision") === "accept",
            p_note: f.get("note"),
          }),
        );
        await ctx.refresh();
      }),
    );
}
export async function operations(ctx) {
  if (ctx.profile.role !== "admin")
    throw new Error("Administration access required.");
  const profiles = await result(
    db.from("profiles").select("*").order("display_name"),
  );
  const parents = profiles
    .filter((p) => p.role === "parent" && p.active)
    .map((p) => ({ id: p.id, name: p.display_name }));
  const teachers = profiles
    .filter((p) => p.role === "teacher" && p.active)
    .map((p) => ({ id: p.id, name: p.display_name }));
  const guardians = await result(db.from("guardians").select("*"));
  const teaching = await result(db.from("teaching_assignments").select("*"));
  ctx.root.innerHTML = `<p class="notice">Create or invite accounts through Supabase Auth, then assign their profile role using the setup guide. This page links existing, verified accounts to students and classes. No one can choose their own role at login.</p><div class="grid g2"><details class="card"><summary>Add a class</summary><form id="class">${field("name", "Class name")}${select(
    "programme",
    "Programme",
    ["Toddler", "Playgroup", "Pre-Kindergarten", "Kindergarten"].map((n) => ({
      id: n,
      name: n,
    })),
  )}${submit}</form></details>${ctx.classes.length ? `<details class="card"><summary>Add a student</summary><form id="student">${field("name", "Student name")}${select("class", "Class", ctx.classes)}${submit}</form></details>` : ""}${parents.length && ctx.students.length ? `<details class="card"><summary>Link a parent to a child</summary><form id="guardian">${select("parent", "Parent", parents)}${select("student", "Child", ctx.students)}${submit}</form></details>` : ""}${teachers.length && ctx.classes.length ? `<details class="card"><summary>Assign a teacher to a class</summary><form id="teacher">${select("teacher", "Teacher", teachers)}${select("class", "Class", ctx.classes)}${submit}</form></details>` : ""}</div><h2 style="margin-top:32px">Account relationships</h2><div class="records">${guardians.map((g) => `<article class="card"><strong>${e(profiles.find((p) => p.id === g.parent_id)?.display_name)} → ${e(ctx.students.find((s) => s.id === g.student_id)?.name)}</strong><div class="live-actions"><button class="btn secondary" data-unlink-parent="${g.parent_id}" data-student="${g.student_id}">Remove parent link</button></div></article>`).join("")}${teaching.map((t) => `<article class="card"><strong>${e(profiles.find((p) => p.id === t.teacher_id)?.display_name)} → ${e(ctx.classes.find((c) => c.id === t.class_id)?.name)}</strong><div class="live-actions"><button class="btn secondary" data-unlink-teacher="${t.teacher_id}" data-class="${t.class_id}">Remove teacher assignment</button></div></article>`).join("")}</div><h2 style="margin-top:32px">School accounts</h2><div class="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead><tbody>${profiles.map((p) => `<tr><td>${e(p.display_name)}</td><td>${e(p.role)}</td><td>${p.active ? "Active" : "Inactive"}</td></tr>`).join("")}</tbody></table></div>`;
  bindForm("class", async (f) => {
    await result(
      db
        .from("classes")
        .insert({ name: f.get("name"), programme: f.get("programme") }),
    );
    await ctx.refresh();
  });
  bindForm("student", async (f) => {
    await result(
      db
        .from("students")
        .insert({ name: f.get("name"), class_id: f.get("class") }),
    );
    await ctx.refresh();
  });
  bindForm("guardian", async (f) => {
    await result(
      db
        .from("guardians")
        .upsert({ parent_id: f.get("parent"), student_id: f.get("student") }),
    );
    await ctx.refresh();
  });
  bindForm("teacher", async (f) => {
    await result(
      db
        .from("teaching_assignments")
        .upsert({ teacher_id: f.get("teacher"), class_id: f.get("class") }),
    );
    await ctx.refresh();
  });
  ctx.root.querySelectorAll("[data-unlink-parent]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (!confirm("Remove this parent–child access link?")) return;
        try {
          await result(
            db
              .from("guardians")
              .delete()
              .eq("parent_id", b.dataset.unlinkParent)
              .eq("student_id", b.dataset.student),
          );
          await ctx.refresh();
        } catch (err) {
          showError(err);
        }
      }),
  );
  ctx.root.querySelectorAll("[data-unlink-teacher]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (!confirm("Remove this teacher’s class access?")) return;
        try {
          await result(
            db
              .from("teaching_assignments")
              .delete()
              .eq("teacher_id", b.dataset.unlinkTeacher)
              .eq("class_id", b.dataset.class),
          );
          await ctx.refresh();
        } catch (err) {
          showError(err);
        }
      }),
  );
}
export async function audit(ctx) {
  if (ctx.profile.role !== "admin")
    throw new Error("Administration access required.");
  const rows = await result(
    db
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  );
  ctx.root.innerHTML = `<p class="notice">Latest 100 changes to invoices, payment reviews, student records, family links and photo permissions. This log excludes message contents and sensitive learning notes.</p><div class="table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>Record</th><th>Actor</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${e(date(x.created_at))}</td><td>${e(x.action)} ${e(x.table_name)}</td><td>${e(x.record_id)}</td><td>${e(x.actor_id || "School setup")}</td></tr>`).join("")}</tbody></table></div>`;
}
