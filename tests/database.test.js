import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
test("migration, RLS isolation, role restrictions and atomic payment verification", async (t) => {
  const sql = new PGlite();
  t.after(() => sql.close());
  // Supabase-managed auth/storage surfaces are mocked; application SQL is unchanged.
  await sql.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,storage to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text default auth.uid()::text);
 alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;
 `);
  await sql.exec(
    await readFile(
      new URL("../supabase/migrations/001_school.sql", import.meta.url),
      "utf8",
    ),
  );
  await sql.exec(`insert into auth.users values ('${id(1)}'),('${id(2)}'),('${id(3)}'),('${id(4)}');
 insert into public.profiles values ('${id(1)}','Admin','admin',true),('${id(2)}','Teacher A','teacher',true),('${id(3)}','Parent A','parent',true),('${id(4)}','Parent B','parent',true);
 insert into public.classes values ('${id(10)}','K2A','Kindergarten'),('${id(11)}','K2B','Kindergarten');
 insert into public.students(id,name,class_id) values ('${id(20)}','Child A','${id(10)}'),('${id(21)}','Child B','${id(11)}');
 insert into public.guardians values ('${id(20)}','${id(3)}'),('${id(21)}','${id(4)}');
 insert into public.teaching_assignments values ('${id(10)}','${id(2)}');
 insert into public.assignments(id,class_id,title,body,due_at,created_by) values ('${id(30)}','${id(10)}','A task','Instructions',now()+interval '7 days','${id(2)}');
 insert into public.invoices(id,student_id,title,amount,due_on,created_by) values ('${id(40)}','${id(20)}','A invoice',100000,current_date+7,'${id(1)}'),('${id(41)}','${id(21)}','B invoice',200000,current_date+7,'${id(1)}');
 insert into public.progress_reports(student_id,title,body,published,created_by) values ('${id(20)}','Draft','Private teacher note',false,'${id(2)}'),('${id(20)}','Shared','Family observation',true,'${id(2)}');`);
  async function asUser(n) {
    await sql.exec("reset role");
    await sql.query("select set_config('request.jwt.claim.sub',$1,false)", [
      id(n),
    ]);
    await sql.exec("set role authenticated");
  }
  const rows = async (q) => (await sql.query(q)).rows;
  await asUser(3);
  assert.equal((await rows("select * from public.students")).length, 1);
  assert.equal((await rows("select * from public.invoices")).length, 1);
  assert.equal((await rows("select * from public.progress_reports")).length, 1);
  await assert.rejects(sql.exec("update public.profiles set role='admin'"));
  await assert.rejects(sql.exec("update public.invoices set paid=amount"));
  await assert.rejects(
    sql.query("select public.submit_assignment($1,$2,$3,null)", [
      id(30),
      id(21),
      "Cross-child",
    ]),
  );
  await sql.query("select public.submit_assignment($1,$2,$3,null)", [
    id(30),
    id(20),
    "Independent morning",
  ]);
  await sql.exec("select public.ensure_threads()");
  const threads = await rows("select * from public.threads");
  assert.equal(threads.length, 3);
  const privateThread = threads.find((x) => x.kind === "private");
  await sql.query(
    "insert into public.messages(thread_id,body,sender_name) values($1,$2,$3)",
    [privateThread.id, "Family note", "Forged teacher"],
  );
  assert.equal(
    (await rows("select * from public.messages"))[0].sender_name,
    "Parent A",
  );
  const receipt = id(20) + "/sample.pdf";
  await sql.query(
    "insert into storage.objects(bucket_id,name) values('payment-receipts',$1)",
    [receipt],
  );
  await sql.query("select public.submit_payment($1,$2,$3)", [
    id(40),
    40000,
    receipt,
  ]);
  assert.equal(
    Number(
      (await rows(`select paid from public.invoices where id='${id(40)}'`))[0]
        .paid,
    ),
    0,
  );
  await assert.rejects(
    sql.query("select public.submit_payment($1,$2,$3)", [
      id(40),
      40000,
      receipt,
    ]),
  );
  const payment = (await rows("select id from public.payment_proofs"))[0].id;
  await assert.rejects(
    sql.query("select public.verify_payment($1,true,$2)", [
      payment,
      "Self approval",
    ]),
  );
  await asUser(2);
  assert.equal((await rows("select * from public.invoices")).length, 0);
  assert.equal((await rows("select * from public.payment_proofs")).length, 0);
  assert.equal((await rows("select * from storage.objects")).length, 0);
  assert.equal((await rows("select * from public.messages")).length, 1);
  assert.equal((await rows("select * from public.progress_reports")).length, 2);
  const submission = (await rows("select id from public.submissions"))[0].id;
  await sql.query("select public.review_submission($1,$2,$3)", [
    submission,
    "Great effort",
    "reviewed",
  ]);
  await asUser(4);
  assert.equal((await rows("select * from public.messages")).length, 0);
  assert.equal((await rows("select * from public.submissions")).length, 0);
  assert.equal((await rows("select * from storage.objects")).length, 0);
  await assert.rejects(
    sql.query("insert into public.messages(thread_id,body) values($1,$2)", [
      privateThread.id,
      "Not my child",
    ]),
  );
  await asUser(1);
  assert.equal((await rows("select * from public.progress_reports")).length, 0);
  assert.equal((await rows("select * from public.messages")).length, 0);
  assert.equal((await rows("select * from public.submissions")).length, 0);
  assert.equal((await rows("select * from public.invoices")).length, 2);
  await sql.query("select public.verify_payment($1,true,$2)", [
    payment,
    "Verified by administration",
  ]);
  assert.equal(
    Number(
      (await rows(`select paid from public.invoices where id='${id(40)}'`))[0]
        .paid,
    ),
    40000,
  );
  await assert.rejects(
    sql.query("select public.verify_payment($1,true,$2)", [
      payment,
      "Duplicate click",
    ]),
  );
  assert.equal(
    Number(
      (await rows(`select paid from public.invoices where id='${id(40)}'`))[0]
        .paid,
    ),
    40000,
  );
  assert.ok((await rows("select * from public.audit_logs")).length > 0);
  await sql.exec(`delete from public.guardians where student_id='${id(20)}'`);
  await asUser(3);
  assert.equal((await rows("select * from public.messages")).length, 0);
  assert.equal((await rows("select * from public.invoices")).length, 0);
  assert.equal((await rows("select * from storage.objects")).length, 0);
});
