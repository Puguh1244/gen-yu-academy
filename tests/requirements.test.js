import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
test("updated Word requirements: participant privacy, drafts, versions and RSVP scope", async (t) => {
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
  await sql.exec(
    await readFile(
      new URL(
        "../supabase/migrations/002_word_requirements.sql",
        import.meta.url,
      ),
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
  assert.equal(threads.length, 2);
  await sql.query("select public.start_private_chat($1,$2,$3)", [
    id(20),
    id(2),
    "Wellbeing",
  ]);
  threads.push(
    ...(await rows("select * from public.threads where kind='private'")),
  );
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

  await sql.exec("reset role");
  await sql.exec(`insert into auth.users values('${id(5)}'),('${id(6)}');
  insert into public.profiles values('${id(5)}','Second guardian','parent',true),('${id(6)}','Second teacher','teacher',true);
  insert into public.guardians values('${id(20)}','${id(5)}');
  insert into public.teaching_assignments values('${id(10)}','${id(6)}');`);
  await asUser(5);
  assert.equal(
    (await rows("select * from public.messages")).length,
    0,
    "Another guardian cannot read private messages",
  );
  await asUser(6);
  assert.equal(
    (await rows("select * from public.messages")).length,
    0,
    "An uninvited class teacher cannot read private messages",
  );
  await asUser(3);
  await sql.query(
    "insert into public.absences(student_id,starts_on,ends_on,reason) values($1,current_date,current_date,$2)",
    [id(20), "Confidential note"],
  );
  const absence = (await rows("select id from public.absences"))[0].id;
  await sql.query(
    "select public.edit_absence($1,current_date,current_date,$2,$3,false)",
    [absence, "Unwell", "Updated private note"],
  );
  assert.equal((await rows("select * from public.absence_history")).length, 1);
  await asUser(5);
  assert.equal(
    (await rows("select * from public.absences")).length,
    0,
    "Second guardian cannot read private absence note",
  );
  await asUser(3);
  await sql.query("select public.save_activity($1,$2,$3,null,true)", [
    id(30),
    id(20),
    "Private draft",
  ]);
  await asUser(2);
  assert.equal(
    (await rows("select * from public.submissions")).length,
    0,
    "Teacher cannot read draft submission",
  );
  await asUser(1);
  await sql.query(
    `insert into public.events(id,title,body,starts_at,ends_at,location,response_due) values($1,'Event','Details',now()+interval '2 days',now()+interval '3 days','School',now()+interval '1 day')`,
    [id(50)],
  );
  await asUser(3);
  await sql.query("select public.respond_to_event($1,$2,$3,$4,$5)", [
    id(50),
    id(20),
    "attending",
    1,
    "First guardian",
  ]);
  await asUser(5);
  await sql.query("select public.respond_to_event($1,$2,$3,$4,$5)", [
    id(50),
    id(20),
    "attending",
    2,
    "Updated by another guardian",
  ]);
  assert.equal(
    (await rows("select * from public.attendance_responses")).length,
    1,
    "One current response per child, not per account",
  );
  assert.equal(
    (await rows("select * from public.attendance_history")).length,
    1,
  );
  await asUser(1);
  await sql.exec(
    `update public.events set location='New venue' where id='${id(50)}'`,
  );
  assert.equal(
    (await rows(`select version from public.events where id='${id(50)}'`))[0]
      .version,
    2,
  );
  assert.equal(
    (await rows(`select * from public.attendance_responses where version=2`))
      .length,
    0,
    "New version needs a new response",
  );
  assert.equal(
    (await rows("select * from public.information_history")).length,
    1,
  );
  await sql.exec("select public.send_pending_reminders()");
  await sql.exec("select public.send_pending_reminders()");
  await sql.exec("reset role");
  const reminder = await rows(
    "select * from public.notifications where reminder_day is not null",
  );
  assert.equal(reminder.length, 3, "One reminder per invited parent per day");
  await asUser(3);
  await sql.query("select public.respond_to_event($1,$2,$3,$4,$5)", [
    id(50),
    id(20),
    "unable",
    0,
    "Cannot attend new date",
  ]);
  assert.equal(
    (await rows("select * from public.attendance_responses")).length,
    2,
    "Old version preserved",
  );
  await assert.rejects(
    sql.query("select public.respond_to_event($1,$2,$3,$4,$5)", [
      id(50),
      id(21),
      "attending",
      1,
      "Other family",
    ]),
  );
  // Unread counts do not depend on notification opt-in.
  await asUser(2);
  assert.equal(
    Number(
      (await rows("select * from public.unread_messages()")).find(
        (x) => x.thread_id === privateThread.id,
      ).total,
    ),
    1,
  );
  await sql.query(
    "insert into public.thread_reads(thread_id,user_id) values($1,$2)",
    [privateThread.id, id(2)],
  );
  assert.equal(
    (await rows("select * from public.unread_messages()")).length,
    0,
  );
  await asUser(3);
  await sql.exec("select public.sync_my_notifications()");
  await sql.exec("select public.sync_my_notifications()");
  assert.equal(
    (
      await rows(
        `select * from public.notifications where category='tasks' and source_id='${id(30)}'`,
      )
    ).length,
    1,
  );
  // Private draft file is not visible to another guardian or teacher.
  const draftFile = id(20) + "/draft.pdf";
  await sql.query(
    "insert into storage.objects(bucket_id,name) values('learning-files',$1)",
    [draftFile],
  );
  await sql.query("select public.save_activity($1,$2,$3,$4,true)", [
    id(30),
    id(20),
    "Draft attachment",
    draftFile,
  ]);
  await asUser(5);
  assert.equal(
    (await rows(`select * from storage.objects where name='${draftFile}'`))
      .length,
    0,
  );
  await assert.rejects(
    sql.query("select public.save_activity($1,$2,$3,null,true)", [
      id(30),
      id(20),
      "Overwrite another draft",
    ]),
  );
  await asUser(2);
  assert.equal(
    (await rows(`select * from storage.objects where name='${draftFile}'`))
      .length,
    0,
  );
  const classThread = threads.find((x) => x.kind === "class");
  await sql.query("select public.set_class_read_only($1,true)", [
    classThread.id,
  ]);
  await asUser(3);
  await assert.rejects(
    sql.query("insert into public.messages(thread_id,body) values($1,$2)", [
      classThread.id,
      "Not allowed",
    ]),
  );
  await asUser(2);
  await sql.query("select public.set_class_read_only($1,false)", [
    classThread.id,
  ]);
  await asUser(3);
  await sql.query(
    "insert into public.messages(thread_id,body,pinned) values($1,$2,true)",
    [classThread.id, "Cannot self-pin"],
  );
  assert.equal(
    (
      await rows(
        `select pinned from public.messages where thread_id='${classThread.id}'`,
      )
    )[0].pinned,
    false,
  );
  // Family-level responses share one key across guardians.
  await asUser(1);
  await sql.query("insert into public.families(id,name) values($1,$2)", [
    id(60),
    "Family A",
  ]);
  await sql.query("update public.students set family_id=$1 where id=$2", [
    id(60),
    id(20),
  ]);
  await sql.query(
    `insert into public.events(id,title,body,starts_at,ends_at,location,scope_kind) values($1,'Family Event','Details',now()+interval '2 days',now()+interval '3 days','School','family')`,
    [id(51)],
  );
  await asUser(3);
  await sql.query("select public.respond_to_event($1,$2,$3,$4,$5)", [
    id(51),
    id(60),
    "attending",
    1,
    "First",
  ]);
  await asUser(5);
  await sql.query("select public.respond_to_event($1,$2,$3,$4,$5)", [
    id(51),
    id(60),
    "attending",
    2,
    "Second",
  ]);
  assert.equal(
    (
      await rows(
        `select * from public.attendance_responses where event_id='${id(51)}'`,
      )
    ).length,
    1,
  );
  // Teacher proposals cannot publish themselves; public feed exposes only verified content.
  await asUser(2);
  await assert.rejects(
    sql.query(
      "insert into public.school_content(kind,title,title_id,body,body_id,class_id,status,verified) values('news','Title','Judul','Body','Isi',$1,'published',true)",
      [id(10)],
    ),
  );
  await sql.query(
    "insert into public.school_content(id,kind,title,title_id,body,body_id,class_id,status) values($1,'news','Title','Judul','Body','Isi',$2,'submitted')",
    [id(70), id(10)],
  );
  await asUser(1);
  assert.equal(
    (await rows("select public.website_feed() as feed"))[0].feed.content.length,
    0,
  );
  await sql.query(
    "update public.school_content set status='published',verified=true where id=$1",
    [id(70)],
  );
  await sql.exec("reset role;set role anon");
  assert.equal(
    (await rows("select public.website_feed() as feed"))[0].feed.content.length,
    1,
  );
  await assert.rejects(sql.exec("select * from public.students"));
  await sql.query(
    "select public.submit_enquiry('Prospective Parent','test@example.test','08000000','Toddler',2,null,'Question',true,'')",
  );
  await assert.rejects(
    sql.query(
      "select public.submit_enquiry('Prospective Parent','test@example.test','08000000','Toddler',2,null,'Question',false,'')",
    ),
  );
  await asUser(1);
  assert.equal(
    (await rows("select * from public.admission_enquiries")).length,
    1,
  );

  await sql.exec(`delete from public.guardians where student_id='${id(20)}'`);
  await asUser(3);
  assert.equal((await rows("select * from public.messages")).length, 0);
  assert.equal((await rows("select * from public.invoices")).length, 0);
  assert.equal((await rows("select * from storage.objects")).length, 0);
});
