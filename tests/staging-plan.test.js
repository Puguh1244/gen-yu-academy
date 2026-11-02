import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import {
  createSeedPlan,
  testIdentities,
} from "../scripts/lib/staging-plan.mjs";
import { stagingConfig } from "../scripts/lib/staging-config.mjs";
test("staging setup refuses missing, production and repository-contained credentials", () => {
  assert.throws(() => stagingConfig({}));
  const base = {
    SUPABASE_URL: "https://staging-test.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    SUPABASE_SECRET_KEY: "server-only-test",
    GENYU_STAGING_PROJECT_REF: "staging-test",
    GENYU_STAGING_CREDENTIALS_FILE: "/tmp/genyu-private/accounts.json",
  };
  assert.throws(() => stagingConfig({ ...base, GENYU_ENV: "production" }));
  assert.throws(() =>
    stagingConfig({
      ...base,
      GENYU_ENV: "staging",
      GENYU_STAGING_PROJECT_REF: "different",
    }),
  );
  assert.throws(() =>
    stagingConfig({
      ...base,
      GENYU_ENV: "staging",
      GENYU_STAGING_CREDENTIALS_FILE: "public/accounts.json",
    }),
  );
  assert.equal(
    stagingConfig({ ...base, GENYU_ENV: "staging" }).credentials,
    "/tmp/genyu-private/accounts.json",
  );
});
test("all three migrations accept the complete fictional semester plan and retain role boundaries", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,storage to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text default auth.uid()::text);
 alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;`);
  for (const name of [
    "001_school",
    "002_word_requirements",
    "003_revision_brief",
  ])
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/" + name + ".sql", import.meta.url),
        "utf8",
      ),
    );
  const ids = Object.fromEntries(
    testIdentities.map((a) => [a.key, randomUUID()]),
  );
  for (const id of Object.values(ids))
    await db.query("insert into auth.users(id) values($1)", [id]);
  const plan = createSeedPlan(ids);
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
    const groups = new Map();
    for (const row of plan[table]) {
      const key = Object.keys(row).sort().join(",");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    for (const [columns, rows] of groups)
      await db.query(
        `insert into public.${table}(${columns}) select ${columns} from jsonb_populate_recordset(null::public.${table},$1::jsonb)`,
        [JSON.stringify(rows)],
      );
  }
  assert.equal(plan.classes.length, 5);
  assert.equal(new Set(plan.classes.map((c) => c.programme)).size, 4);
  assert.ok(plan.class_schedule.length > 3000);
  assert.equal(
    plan.school_content.filter((c) => c.kind === "article").length,
    3,
  );
  const as = async (key) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      ids[key],
    ]);
    await db.exec("set role authenticated");
  };
  const rows = async (q) => (await db.query(q)).rows;
  await as("parent1");
  assert.deepEqual(
    (await rows("select id from public.students")).map((x) => x.id),
    [plan.students[0].id],
  );
  assert.equal((await rows("select * from public.progress_reports")).length, 1);
  await as("parent2");
  assert.deepEqual(
    (await rows("select id from public.students")).map((x) => x.id),
    [plan.students[1].id],
  );
  assert.equal((await rows("select * from public.progress_reports")).length, 0);
  await as("teacher");
  assert.equal((await rows("select * from public.invoices")).length, 0);
  assert.ok(
    (await rows("select * from public.class_schedule")).every(
      (s) => s.class_id === plan.classes[3].id,
    ),
  );
  await as("admin");
  assert.equal((await rows("select * from public.progress_reports")).length, 0);
  await db.exec("reset role;set role anon");
  const feed = (await rows("select public.website_feed() as feed"))[0].feed;
  assert.equal(feed.content.filter((c) => c.kind === "article").length, 3);
  assert.equal(feed.announcements.length, 1);
  await db.query(
    "select public.submit_enquiry('Test','test@example.test','000000','Pre-Kindergarten',4,null,'Test',true,'')",
  );
  await assert.rejects(
    db.query(
      "select public.submit_enquiry('Test','test@example.test','000000','Pre-K',4,null,'Test',true,'')",
    ),
  );
  await db.exec("reset role");
  await db.query("update public.profiles set active=false where id=$1", [
    ids.parent1,
  ]);
  await as("parent1");
  assert.equal((await rows("select * from public.students")).length, 0);
  assert.equal((await rows("select * from public.invoices")).length, 0);
});
