// Run only against an explicitly identified staging project after migrations 001, 002 and 003.
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { stagingConfig, unwrap as ok } from "./lib/staging-config.mjs";
import { createSeedPlan, testIdentities } from "./lib/staging-plan.mjs";
const cfg = stagingConfig();
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(cfg.supabaseUrl, cfg.serverKey, options);
const schema = await ok(
  admin
    .from("school_settings")
    .select("value")
    .eq("key", "schema_revision")
    .maybeSingle(),
);
if (schema?.value !== "3")
  throw new Error(
    "Apply migrations 001, 002 and 003 before creating staging accounts.",
  );
let manifest;
try {
  manifest = JSON.parse(await readFile(cfg.credentials, "utf8"));
  if (manifest.supabaseUrl !== cfg.supabaseUrl)
    throw new Error("Credential manifest belongs to another project.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  manifest = {
    supabaseUrl: cfg.supabaseUrl,
    supabaseKey: cfg.supabaseKey,
    status: "preparing",
    accounts: testIdentities.map((a) => ({
      ...a,
      password: randomBytes(24).toString("base64url"),
    })),
  };
  await mkdir(dirname(cfg.credentials), { recursive: true, mode: 0o700 });
  await writeFile(cfg.credentials, JSON.stringify(manifest, null, 2), {
    flag: "wx",
    mode: 0o600,
  });
}
if (manifest.status === "ready")
  throw new Error(
    "Staging is already seeded. Run verify-staging.mjs; this script does not reset or overwrite existing records.",
  );
const save = () =>
  writeFile(cfg.credentials, JSON.stringify(manifest, null, 2), {
    mode: 0o600,
  });
if (!manifest.plan) {
  const existing = await ok(admin.from("students").select("id").limit(1));
  if (existing.length)
    throw new Error(
      "Use an empty dedicated staging project; no accounts have been created in this run.",
    );
}
for (const a of manifest.accounts) {
  if (!a.id) {
    const { user } = await ok(
      admin.auth.admin.createUser({
        email: a.email,
        password: a.password,
        email_confirm: true,
        user_metadata: { fixture: "genyu-academic-staging" },
      }),
    );
    a.id = user.id;
    await save();
  }
}
if (!manifest.plan) {
  const existing = await ok(admin.from("students").select("id").limit(1));
  if (existing.length)
    throw new Error(
      "Project contains existing student records. Use an empty dedicated staging project.",
    );
  manifest.plan = createSeedPlan(
    Object.fromEntries(manifest.accounts.map((a) => [a.key, a.id])),
  );
  await save();
}
const plan = manifest.plan;
manifest.completedTables ??= [];
for (const table of [
  "profiles",
  "classes",
  "families",
  "students",
  "guardians",
  "teaching_assignments",
  "assignments",
  "progress_reports",
  "invoices",
  "announcements",
  "events",
  "class_schedule",
  "school_content",
]) {
  if (manifest.completedTables.includes(table)) continue;
  for (let offset = 0; offset < plan[table].length; offset += 200)
    await ok(
      admin.from(table).upsert(plan[table].slice(offset, offset + 200), {
        ignoreDuplicates: true,
        defaultToNull: false,
      }),
    );
  manifest.completedTables.push(table);
  await save();
}
const clients = {};
for (const a of manifest.accounts) {
  clients[a.key] = createClient(cfg.supabaseUrl, cfg.supabaseKey, options);
  await ok(
    clients[a.key].auth.signInWithPassword({
      email: a.email,
      password: a.password,
    }),
  );
}
manifest.actions ??= {};
async function once(name, fn) {
  if (manifest.actions[name]) return;
  manifest.actions[name] = (await fn()) || true;
  await save();
}
await once("group-message", async () => {
  await ok(clients.teacher.rpc("ensure_threads"));
  const ts = await ok(
    clients.teacher.from("threads").select("*").eq("kind", "class"),
  );
  const tid = ts[0].id;
  await ok(
    clients.teacher.from("messages").insert({
      thread_id: tid,
      body: "DEMO: Welcome to K2A. Please use fictional information for this exercise.",
    }),
  );
  return tid;
});
await once("private-message", async () => {
  const tid = await ok(
    clients.parent1.rpc("start_private_chat", {
      p_student: plan.students[0].id,
      p_teacher: manifest.accounts.find((a) => a.key === "teacher").id,
      p_topic: "General Question",
    }),
  );
  await ok(
    clients.parent1.from("messages").insert({
      thread_id: tid,
      body: "DEMO: Could you share a simple activity to practise independence?",
    }),
  );
  return tid;
});
await once("submission", async () => {
  await ok(
    clients.parent1.rpc("save_activity", {
      p_assignment: plan.assignments[0].id,
      p_student: plan.students[0].id,
      p_note:
        "DEMO: Alya chose a bag and packed a water bottle with one reminder.",
      p_file: null,
      p_draft: false,
    }),
  );
  const sub = await ok(
    clients.teacher
      .from("submissions")
      .select("id")
      .eq("assignment_id", plan.assignments[0].id)
      .single(),
  );
  await ok(
    clients.teacher.rpc("review_submission", {
      p_submission: sub.id,
      p_feedback:
        "DEMO: Thank you. Invite another small choice tomorrow. / Terima kasih. Ajak memilih satu hal kecil besok.",
      p_status: "reviewed",
    }),
  );
  return sub.id;
});
await once("absence", () =>
  ok(
    clients.parent1.from("absences").insert({
      student_id: plan.students[0].id,
      starts_on: new Date().toISOString().slice(0, 10),
      ends_on: new Date().toISOString().slice(0, 10),
      category: "Family Matter",
      reason: "DEMO only: a fictional family activity.",
    }),
  ),
);
await once("admissions", () =>
  ok(
    clients.admin.rpc("submit_enquiry", {
      p_name: "Demo Prospective Parent",
      p_email: "prospective@example.test",
      p_phone: "0000000000",
      p_programme: "Pre-Kindergarten",
      p_age: 4,
      p_visit: null,
      p_message: "DEMO only: please explain the visit process.",
      p_consent: true,
      p_website: "",
    }),
  ),
);
// Original project logo is an authorised illustration for fixtures, never a photograph of a child.
const png = await readFile(
  new URL("../public/assets/gen-yu-academy-logo.png", import.meta.url),
);
for (const kind of ["class", "individual", "public"])
  await once("album-" + kind, async () => {
    const publicMedia = kind === "public",
      bucket = publicMedia ? "school-media" : "learning-files";
    const prefix = publicMedia
      ? manifest.accounts.find((a) => a.key === "admin").id
      : kind === "class"
        ? "class/" + plan.classes[3].id
        : plan.students[0].id;
    const path = prefix + "/" + randomUUID() + ".png",
      client = publicMedia ? clients.admin : clients.teacher;
    await ok(
      client.storage
        .from(bucket)
        .upload(path, png, { contentType: "image/png" }),
    );
    if (publicMedia)
      await ok(
        client.from("school_content").insert({
          kind: "gallery",
          title: "Demo school identity",
          title_id: "Identitas sekolah demo",
          summary: "Original logo from Proyek 3. No real child photograph.",
          summary_id: "Logo asli Proyek 3. Bukan foto anak asli.",
          body: "An illustration for the public gallery exercise.",
          body_id: "Ilustrasi untuk latihan galeri publik.",
          file_path: path,
          status: "published",
          verified: true,
          photo_permission: true,
        }),
      );
    else
      await ok(
        client.from("albums").insert({
          student_id: kind === "individual" ? plan.students[0].id : null,
          class_id: kind === "class" ? plan.classes[3].id : null,
          title: "DEMO: " + kind + " album",
          body: "Original school logo used as a fictional activity illustration.",
          file_path: path,
          consent_checked: true,
        }),
      );
    return { bucket, path };
  });
await once("payment-proof", async () => {
  const path = plan.students[0].id + "/" + randomUUID() + ".png";
  await ok(
    clients.parent1.storage
      .from("payment-receipts")
      .upload(path, png, { contentType: "image/png" }),
  );
  await ok(
    clients.parent1.rpc("submit_payment", {
      p_invoice: plan.invoices[0].id,
      p_amount: 100000,
      p_file: path,
    }),
  );
  return path;
});
for (const client of Object.values(clients)) await client.auth.signOut();
manifest.status = "ready";
manifest.seededAt = new Date().toISOString();
await save();
const guide = [
  "# PRIVATE — Gen-Yu staging login guide",
  "These are fictional staging accounts. Do not put this guide in the website, repository or presentation.",
  ...manifest.accounts.map(
    (a) =>
      `\n## ${a.name}\nEmail: ${a.email}\nTemporary password: ${a.password}\nRole: ${a.role}`,
  ),
  "\nOpen /portal.html on the configured website. Use each account separately and sign out after use. The semester dates and financial amounts are fictional.",
];
await writeFile(
  dirname(cfg.credentials) + "/PRIVATE_LOGIN_GUIDE.md",
  guide.join("\n"),
  { mode: 0o600 },
);
console.log(
  "Staging accounts and fixtures created. Credentials saved outside the repository; passwords are not printed. Run the staging verification next.",
);
