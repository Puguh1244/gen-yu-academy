import { db, result, uploadFile, cleanupFile } from "../services/supabase.js";
import { date, money, empty } from "./ui.js";
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
  relevant,
  all,
  details,
} from "./spec-ui.js";
import { fileButton, bindFiles } from "./pages.js";
import { statusText } from "./i18n.js";
export async function fees(ctx) {
  if (ctx.profile.role === "teacher") throw new Error("Finance access denied");
  const invoices = (await all("invoices")).filter((x) => relevant(ctx, x)),
    payments = await all("payment_proofs");
  ctx.root.innerHTML =
    `<p class="notice">${B("Evidence is reviewed by administration. Uploading does not mark an invoice Paid.", "Bukti diperiksa admin. Mengunggah bukti tidak langsung membuat tagihan Lunas.")}</p>` +
    (ctx.profile.role === "admin" && ctx.students.length
      ? details(
          "invoice",
          B("Create invoice", "Buat tagihan"),
          select("student_id", B("Child", "Anak"), ctx.students) +
            field("invoice_number", B("Invoice number", "Nomor tagihan")) +
            bilingual("title", B("Description", "Keterangan")) +
            field("fee_type", B("Fee type", "Jenis biaya")) +
            field("period", B("Billing period", "Periode tagihan")) +
            field("amount", B("Amount (IDR)", "Jumlah (Rp)"), "number") +
            field("due_on", B("Due date", "Jatuh tempo"), "date") +
            bilingual(
              "instructions",
              B("School payment instructions", "Petunjuk pembayaran sekolah"),
              true,
            ),
        )
      : "") +
    `<div class="records">${
      invoices
        .map((x) => {
          const remaining = Number(x.amount) - Number(x.paid),
            proofs = payments.filter((p) => p.invoice_id === x.id),
            pending = proofs.some((p) => p.status === "pending"),
            overdue =
              remaining > 0 &&
              x.due_on < new Date().toLocaleDateString("en-CA");
          return `<article class="card"><span class="badge">${remaining <= 0 ? B("Paid", "Lunas") : pending ? B("Awaiting Verification", "Menunggu Verifikasi") : Number(x.paid) > 0 ? B("Partially Paid", "Dibayar Sebagian") : B("Unpaid", "Belum Dibayar")}${overdue ? " · " + B("Overdue", "Lewat Jatuh Tempo") : ""}</span><h3>${e(textOf(x, "title"))} · ${e(ctx.students.find((s) => s.id === x.student_id)?.name)}</h3><p>${e(x.invoice_number || x.id)} · ${e(x.fee_type)} · ${e(x.period)}<br>${B("Due", "Jatuh tempo")}: ${e(x.due_on)}</p><h2>${money(remaining)}</h2><p>${B("Total", "Total")}: ${money(x.amount)} · ${B("Verified", "Terverifikasi")}: ${money(x.paid)}</p><details><summary>${B("Payment instructions", "Petunjuk pembayaran")}</summary><p class="record-body" data-content>${e(textOf(x, "instructions") || B("Contact school administration for payment instructions.", "Hubungi administrasi untuk petunjuk pembayaran."))}</p></details>${proofs
            .map(
              (p) =>
                `<div class="portal-record"><strong>${money(p.amount)} · ${e(statusText(p.status))}</strong><p>${e(date(p.created_at))}</p>${fileButton("payment-receipts", p.file_path)}${p.review_note ? `<p class="record-body" data-content>${e(p.review_note)}</p>` : ""}${p.status === "accepted" ? `<button class="btn secondary" data-receipt="${p.id}">${B("Download payment acknowledgement", "Unduh bukti penerimaan")}</button>` : ""}${
                  ctx.profile.role === "admin" && p.status === "pending"
                    ? details(
                        "verify-" + p.id,
                        B("Verify payment", "Verifikasi pembayaran"),
                        select("decision", B("Decision", "Keputusan"), [
                          { id: "accept", name: B("Accept", "Terima") },
                          { id: "reject", name: B("Reject", "Tolak") },
                        ]) +
                          textarea(
                            "note",
                            B("Verification note", "Catatan verifikasi"),
                          ),
                      )
                    : ""
                }</div>`,
            )
            .join(
              "",
            )}${ctx.profile.role === "parent" && remaining > 0 && !pending ? details("payment-" + x.id, B("Submit payment evidence", "Kirim bukti pembayaran"), field("amount", B("Transferred amount (IDR)", "Jumlah transfer (Rp)"), "number") + field("file", B("Receipt: JPG / PNG / PDF, 10 MB", "Bukti: JPG / PNG / PDF, 10 MB"), "file")) : ""}</article>`;
        })
        .join("") || empty(B("No invoices.", "Belum ada tagihan."))
    }</div><button class="btn secondary" data-finance-chat>${B("Contact Administration", "Hubungi Administrasi")}</button>`;
  bindFiles(ctx.root);
  bindForm("invoice", async (f) => {
    const row = Object.fromEntries(f);
    row.amount = Number(row.amount);
    await result(db.from("invoices").insert(row));
    await ctx.refresh();
  });
  invoices.forEach((x) =>
    bindForm("payment-" + x.id, async (f) => {
      const amount = Number(f.get("amount"));
      if (amount <= 0 || amount > Number(x.amount) - Number(x.paid))
        throw new Error(
          B(
            "Enter a positive amount within the balance.",
            "Masukkan jumlah positif tidak melebihi saldo.",
          ),
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
  action(ctx.root, "[data-finance-chat]", () => ctx.navigate("chat"));
  action(ctx.root, "[data-receipt]", (b) => {
    const p = payments.find((p) => p.id === b.dataset.receipt),
      x = invoices.find((x) => x.id === p.invoice_id);
    if (!x || p.status !== "accepted") return;
    const text = [
      "GEN-YU ACADEMY",
      B("PAYMENT ACKNOWLEDGEMENT", "BUKTI PENERIMAAN PEMBAYARAN"),
      `${B("Receipt", "Bukti")}: ${p.id}`,
      `${B("Invoice", "Tagihan")}: ${x.invoice_number || x.id}`,
      `${B("Child", "Anak")}: ${ctx.students.find((s) => s.id === x.student_id)?.name}`,
      `${B("Amount accepted", "Jumlah diterima")}: ${money(p.amount)}`,
      `${B("Verified at", "Waktu verifikasi")}: ${date(p.reviewed_at)}`,
      `${B("Note", "Catatan")}: ${p.review_note || ""}`,
    ].join("\n");
    const a = document.createElement("a"),
      url = URL.createObjectURL(
        new Blob([text], { type: "text/plain;charset=utf-8" }),
      );
    a.href = url;
    a.download = "Gen-Yu-Payment-" + p.id.slice(0, 8) + ".txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
