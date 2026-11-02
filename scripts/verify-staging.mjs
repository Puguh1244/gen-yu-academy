// Integration tests on the explicitly configured staging project; uses real Auth/PostgREST/Storage.
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { stagingConfig, unwrap as ok } from "./lib/staging-config.mjs";
const cfg = stagingConfig(),
  manifest = JSON.parse(await readFile(cfg.credentials, "utf8"));
if (manifest.status !== "ready" || manifest.supabaseUrl !== cfg.supabaseUrl)
  throw new Error("Seeded staging manifest is required.");
const opts = { auth: { persistSession: false, autoRefreshToken: false } },
  clients = {},
  sessions = {},
  results = [];
const service = createClient(cfg.supabaseUrl, cfg.serverKey, opts),
  anon = createClient(cfg.supabaseUrl, cfg.supabaseKey, opts);
const plan = manifest.plan,
  student = plan.students[0].id,
  other = plan.students[1].id,
  cls = plan.classes[3].id;
const users = Object.fromEntries(manifest.accounts.map((a) => [a.key, a.id]));
const run = async (name, expected, fn) => {
  try {
    const actual = await fn();
    results.push({
      name,
      expected,
      status: "PASS",
      actual: actual || "Assertion passed",
    });
  } catch (error) {
    results.push({ name, expected, status: "FAIL", actual: error.message });
  }
};
const denied = async (p) => {
  const { data, error } = await p;
  assert.ok(
    error || (Array.isArray(data) && data.length === 0),
    "Expected permission error or zero rows",
  );
};
for (const a of manifest.accounts) {
  clients[a.key] = createClient(cfg.supabaseUrl, cfg.supabaseKey, opts);
  await run(
    "Login " + a.key,
    "Authenticated profile has the assigned database role",
    async () => {
      const { session } = await ok(
        clients[a.key].auth.signInWithPassword({
          email: a.email,
          password: a.password,
        }),
      );
      sessions[a.key] = session;
      const profile = await ok(
        clients[a.key].from("profiles").select("*").eq("id", a.id).single(),
      );
      assert.equal(profile.role, a.role);
      assert.equal(profile.active, true);
    },
  );
}
if (
  !sessions.admin ||
  !sessions.parent1 ||
  !sessions.parent2 ||
  !sessions.teacher
) {
  await mkdir("reports", { recursive: true });
  await writeFile(
    "reports/staging-results.json",
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        environment: "Supabase staging (real API)",
        status: "STOPPED_AT_LOGIN",
        results,
      },
      null,
      2,
    ),
  );
  for (const client of Object.values(clients)) await client.auth.signOut();
  throw new Error(
    "Not all staging accounts can log in; resolve Auth before continuing feature tests.",
  );
}
await run("Wrong password", "Authentication is rejected", async () => {
  const c = createClient(cfg.supabaseUrl, cfg.supabaseKey, opts);
  const r = await c.auth.signInWithPassword({
    email: manifest.accounts[0].email,
    password: "intentionally-invalid-" + randomUUID(),
  });
  assert.ok(r.error);
});
await run(
  "Parent isolation including direct REST URL",
  "Parent 1 has Alya only; Parent 2 has Nara only; direct query for other child returns no rows",
  async () => {
    for (const [key, id, excluded] of [
      ["parent1", student, other],
      ["parent2", other, student],
    ]) {
      const rows = await ok(clients[key].from("students").select("*"));
      assert.deepEqual(
        rows.map((s) => s.id),
        [id],
      );
      const r = await fetch(
        `${cfg.supabaseUrl}/rest/v1/students?select=*&id=eq.${excluded}`,
        {
          headers: {
            apikey: cfg.supabaseKey,
            Authorization: "Bearer " + sessions[key].access_token,
          },
        },
      );
      assert.equal(r.status, 200);
      assert.deepEqual(await r.json(), []);
    }
  },
);
await run(
  "Teacher assignment and no finance",
  "Only K2A; no invoices, receipts or cross-class students",
  async () => {
    assert.deepEqual(
      (await ok(clients.teacher.from("classes").select("id"))).map((c) => c.id),
      [cls],
    );
    for (const table of ["invoices", "payment_proofs"])
      await denied(clients.teacher.from(table).select("*"));
    await denied(clients.teacher.from("students").select("*").eq("id", other));
  },
);
await run(
  "Admin learning privacy",
  "No learning reports, submissions or private learning threads",
  async () => {
    for (const table of ["progress_reports", "submissions"])
      await denied(clients.admin.from(table).select("*"));
    await denied(
      clients.admin
        .from("threads")
        .select("*")
        .in("kind", ["private", "class"]),
    );
  },
);
await run(
  "Unauthenticated access",
  "No private child records or class files",
  async () => {
    await denied(anon.from("students").select("*"));
    await denied(
      anon.storage
        .from("learning-files")
        .download(manifest.actions["album-class"].path),
    );
  },
);
await run(
  "Published progress only",
  "Parent sees shared observations but no teacher draft",
  async () => {
    const rows = await ok(clients.parent1.from("progress_reports").select("*"));
    assert.ok(rows.length);
    assert.ok(rows.every((x) => x.published));
    await denied(
      clients.parent2
        .from("progress_reports")
        .select("*")
        .eq("student_id", student),
    );
  },
);
await run(
  "Class chat persisted",
  "Teacher post is visible to own-class parent and invisible to other class",
  async () => {
    const tid = manifest.actions["group-message"],
      body = "QA class message " + randomUUID();
    await ok(clients.teacher.from("messages").insert({ thread_id: tid, body }));
    const rows = await ok(
      clients.parent1
        .from("messages")
        .select("*")
        .eq("thread_id", tid)
        .eq("body", body),
    );
    assert.equal(rows.length, 1);
    await denied(
      clients.parent2.from("messages").select("*").eq("thread_id", tid),
    );
  },
);
await run(
  "Private chat isolation",
  "Only explicit parent and teacher participants see the message",
  async () => {
    const tid = manifest.actions["private-message"];
    assert.ok(
      (
        await ok(
          clients.teacher.from("messages").select("*").eq("thread_id", tid),
        )
      ).length,
    );
    await denied(
      clients.parent2.from("messages").select("*").eq("thread_id", tid),
    );
    await denied(
      clients.admin.from("messages").select("*").eq("thread_id", tid),
    );
  },
);
await run(
  "Realtime class message",
  "Subscribed parent receives an inserted teacher message",
  async () => {
    const tid = manifest.actions["group-message"],
      body = "QA realtime " + randomUUID();
    let channel;
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () =>
            reject(
              new Error("Realtime message not received within 12 seconds"),
            ),
          12000,
        );
        channel = clients.parent1
          .channel("qa-" + randomUUID())
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `thread_id=eq.${tid}`,
            },
            (payload) => {
              if (payload.new.body === body) {
                clearTimeout(timer);
                resolve();
              }
            },
          )
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              try {
                await ok(
                  clients.teacher
                    .from("messages")
                    .insert({ thread_id: tid, body }),
                );
              } catch (e) {
                clearTimeout(timer);
                reject(e);
              }
            }
            if (status === "CHANNEL_ERROR") {
              clearTimeout(timer);
              reject(new Error("Realtime subscription failed"));
            }
          });
      });
    } finally {
      if (channel) await clients.parent1.removeChannel(channel);
    }
  },
);
const png = await readFile(
  new URL("../public/assets/gen-yu-academy-logo.png", import.meta.url),
);
await run(
  "Task → draft → submission → feedback, including private file",
  "Draft/file private until submitted; assigned teacher can review",
  async () => {
    const task = await ok(
      clients.teacher
        .from("assignments")
        .insert({
          class_id: cls,
          title: "QA weekly activity",
          title_id: "Kegiatan QA",
          body: "Fictional test instruction.",
          body_id: "Instruksi uji fiktif.",
          due_at: new Date(Date.now() + 86400000).toISOString(),
        })
        .select()
        .single(),
    );
    const path = student + "/" + randomUUID() + ".png";
    await ok(
      clients.parent1.storage
        .from("learning-files")
        .upload(path, png, { contentType: "image/png" }),
    );
    await ok(
      clients.parent1.rpc("save_activity", {
        p_assignment: task.id,
        p_student: student,
        p_note: "QA draft",
        p_file: path,
        p_draft: true,
      }),
    );
    await denied(
      clients.teacher
        .from("submissions")
        .select("*")
        .eq("assignment_id", task.id),
    );
    await denied(clients.teacher.storage.from("learning-files").download(path));
    await ok(
      clients.parent1.rpc("save_activity", {
        p_assignment: task.id,
        p_student: student,
        p_note: "QA submitted",
        p_file: path,
        p_draft: false,
      }),
    );
    const sub = await ok(
      clients.teacher
        .from("submissions")
        .select("*")
        .eq("assignment_id", task.id)
        .single(),
    );
    await ok(clients.teacher.storage.from("learning-files").download(path));
    await denied(clients.parent2.storage.from("learning-files").download(path));
    await ok(
      clients.teacher.rpc("review_submission", {
        p_submission: sub.id,
        p_feedback: "QA reviewed / Sudah ditinjau",
        p_status: "reviewed",
      }),
    );
    assert.equal(
      (
        await ok(
          clients.parent1
            .from("submissions")
            .select("*")
            .eq("id", sub.id)
            .single(),
        )
      ).status,
      "reviewed",
    );
  },
);
await run(
  "Albums and public media",
  "Public approved image visible anonymously; class/individual media deny other family",
  async () => {
    for (const key of ["album-class", "album-individual"]) {
      const a = manifest.actions[key];
      await ok(clients.parent1.storage.from(a.bucket).download(a.path));
      await denied(clients.parent2.storage.from(a.bucket).download(a.path));
      await denied(clients.admin.storage.from(a.bucket).download(a.path));
    }
    const a = manifest.actions["album-public"];
    await ok(anon.storage.from(a.bucket).download(a.path));
  },
);
await run(
  "Absence privacy",
  "Saved reason visible to sender/teacher but not other family/admin",
  async () => {
    const row = await ok(
      clients.parent1
        .from("absences")
        .insert({
          student_id: student,
          starts_on: "2027-01-12",
          ends_on: "2027-01-12",
          reason: "QA fictional absence",
        })
        .select()
        .single(),
    );
    assert.equal(
      (await ok(clients.teacher.from("absences").select("*").eq("id", row.id)))
        .length,
      1,
    );
    await denied(clients.admin.from("absences").select("*").eq("id", row.id));
    await denied(clients.parent2.from("absences").select("*").eq("id", row.id));
    const summary = await ok(clients.admin.rpc("absence_summary"));
    assert.ok(summary.some((x) => x.id === row.id));
    assert.ok(summary.every((x) => !("reason" in x)));
  },
);
await run(
  "Payments require admin verification",
  "Receipt leaves paid=0; teacher cannot approve; admin approval changes balance exactly once",
  async () => {
    const invoice = await ok(
      clients.admin
        .from("invoices")
        .insert({
          student_id: student,
          title: "QA fictional payment",
          title_id: "Pembayaran fiktif QA",
          amount: 10000,
          due_on: "2027-02-01",
        })
        .select()
        .single(),
    );
    const path = student + "/" + randomUUID() + ".png";
    await ok(
      clients.parent1.storage
        .from("payment-receipts")
        .upload(path, png, { contentType: "image/png" }),
    );
    await ok(
      clients.parent1.rpc("submit_payment", {
        p_invoice: invoice.id,
        p_amount: 10000,
        p_file: path,
      }),
    );
    assert.equal(
      Number(
        (
          await ok(
            clients.parent1
              .from("invoices")
              .select("paid")
              .eq("id", invoice.id)
              .single(),
          )
        ).paid,
      ),
      0,
    );
    const proof = await ok(
      clients.admin
        .from("payment_proofs")
        .select("*")
        .eq("invoice_id", invoice.id)
        .single(),
    );
    await denied(
      clients.teacher.rpc("verify_payment", {
        p_payment: proof.id,
        p_accept: true,
        p_note: "Not authorised",
      }),
    );
    await ok(
      clients.admin.rpc("verify_payment", {
        p_payment: proof.id,
        p_accept: true,
        p_note: "QA fictional evidence verified",
      }),
    );
    assert.equal(
      Number(
        (
          await ok(
            clients.parent1
              .from("invoices")
              .select("paid")
              .eq("id", invoice.id)
              .single(),
          )
        ).paid,
      ),
      10000,
    );
    await denied(
      clients.admin.rpc("verify_payment", {
        p_payment: proof.id,
        p_accept: true,
        p_note: "Duplicate",
      }),
    );
  },
);
await run(
  "News review and publication",
  "Teacher submits; cannot publish; admin approval appears in public feed",
  async () => {
    const item = await ok(
      clients.teacher
        .from("school_content")
        .insert({
          kind: "news",
          class_id: cls,
          title: "QA classroom story",
          title_id: "Cerita kelas QA",
          body: "A fictional cooperative activity.",
          body_id: "Kegiatan kerja sama fiktif.",
          status: "submitted",
        })
        .select()
        .single(),
    );
    await denied(
      clients.teacher
        .from("school_content")
        .update({ status: "published", verified: true })
        .eq("id", item.id)
        .select(),
    );
    await ok(
      clients.admin
        .from("school_content")
        .update({
          status: "published",
          verified: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", item.id),
    );
    assert.ok(
      (await ok(anon.rpc("website_feed"))).content.some(
        (x) => x.id === item.id,
      ),
    );
  },
);
await run(
  "Announcements and event revisions",
  "Class announcement excluded from other family; one event record updates version consistently",
  async () => {
    const a = await ok(
      clients.admin
        .from("announcements")
        .insert({
          title: "QA class notice",
          title_id: "Pengumuman kelas QA",
          body: "Test",
          body_id: "Uji",
          audience: "class",
          class_id: cls,
        })
        .select()
        .single(),
    );
    await denied(
      clients.parent2.from("announcements").select("*").eq("id", a.id),
    );
    const ev = await ok(
      clients.admin
        .from("events")
        .insert({
          title: "QA event",
          title_id: "Acara QA",
          body: "Test",
          body_id: "Uji",
          starts_at: "2027-03-01T02:00:00Z",
          ends_at: "2027-03-01T03:00:00Z",
          location: "Demo only",
          audience: "class",
          class_id: cls,
        })
        .select()
        .single(),
    );
    await ok(
      clients.parent1.rpc("respond_to_event", {
        p_event: ev.id,
        p_scope: student,
        p_response: "attending",
        p_count: 1,
        p_note: "QA",
      }),
    );
    await ok(
      clients.admin
        .from("events")
        .update({ location: "Revised demo venue" })
        .eq("id", ev.id),
    );
    const newer = await ok(
      clients.parent1.from("events").select("*").eq("id", ev.id).single(),
    );
    assert.equal(newer.version, 2);
    assert.equal(newer.location, "Revised demo venue");
    assert.equal(
      (
        await ok(
          clients.parent1
            .from("attendance_responses")
            .select("*")
            .eq("event_id", ev.id)
            .eq("version", 2),
        )
      ).length,
      0,
    );
  },
);
await run(
  "Admissions and follow-up",
  "Anonymous enquiry saved; admin updates status; parents cannot enumerate enquiries",
  async () => {
    const rid = await ok(
      anon.rpc("submit_enquiry", {
        p_name: "QA Enquirer",
        p_email: "qa-" + randomUUID() + "@example.test",
        p_phone: "0000000000",
        p_programme: "Pre-Kindergarten",
        p_age: 4,
        p_visit: null,
        p_message: "Fictional visit enquiry",
        p_consent: true,
        p_website: "",
      }),
    );
    await ok(
      clients.admin
        .from("admission_enquiries")
        .update({
          status: "Contacted",
          follow_up: "QA simulated follow-up; no message actually sent.",
        })
        .eq("id", rid),
    );
    assert.equal(
      (
        await ok(
          clients.admin
            .from("admission_enquiries")
            .select("status")
            .eq("id", rid)
            .single(),
        )
      ).status,
      "Contacted",
    );
    await denied(clients.parent1.from("admission_enquiries").select("*"));
  },
);
await run(
  "Language preference persists",
  "Database stores Indonesian preference for the signed-in account",
  async () => {
    await ok(
      clients.parent1
        .from("account_preferences")
        .upsert({ user_id: users.parent1, language: "id" }),
    );
    assert.equal(
      (
        await ok(
          clients.parent1
            .from("account_preferences")
            .select("language")
            .single(),
        )
      ).language,
      "id",
    );
    await ok(
      clients.parent1
        .from("account_preferences")
        .update({ language: "en" })
        .eq("user_id", users.parent1),
    );
  },
);
await run(
  "Deactivation blocks an existing JWT",
  "Inactive profile has no private data even with preexisting access token",
  async () => {
    try {
      await ok(
        service
          .from("profiles")
          .update({ active: false })
          .eq("id", users.parent2),
      );
      await denied(clients.parent2.from("students").select("*"));
      await denied(clients.parent2.from("invoices").select("*"));
    } finally {
      await ok(
        service
          .from("profiles")
          .update({ active: true })
          .eq("id", users.parent2),
      );
    }
  },
);
await run(
  "Removing teacher assignment revokes access",
  "Current teacher session loses class access after reassignment",
  async () => {
    try {
      await ok(
        service
          .from("teaching_assignments")
          .delete()
          .eq("class_id", cls)
          .eq("teacher_id", users.teacher),
      );
      await denied(clients.teacher.from("students").select("*"));
      await denied(clients.teacher.from("messages").select("*"));
    } finally {
      await ok(
        service
          .from("teaching_assignments")
          .upsert({ class_id: cls, teacher_id: users.teacher }),
      );
    }
  },
);
await run(
  "Logout ends the client session",
  "Session becomes null and unsigned private requests are denied",
  async () => {
    await ok(clients.parent1.auth.signOut());
    assert.equal((await ok(clients.parent1.auth.getSession())).session, null);
    await denied(clients.parent1.from("students").select("*"));
  },
);
for (const client of Object.values(clients)) await client.auth.signOut();
await mkdir("reports", { recursive: true });
const report = {
  testedAt: new Date().toISOString(),
  environment: "Supabase staging (real API)",
  results,
};
await writeFile(
  "reports/staging-results.json",
  JSON.stringify(report, null, 2),
);
console.log(results.map((r) => `${r.status}: ${r.name}`).join("\n"));
if (results.some((r) => r.status === "FAIL")) process.exitCode = 1;
