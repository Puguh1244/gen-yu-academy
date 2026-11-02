-- Gen-Yu Academy / fresh Supabase project. Apply once through the SQL editor.
-- No sample children or default passwords are inserted.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 100),
 role text not null check(role in ('parent','teacher','admin')),
 active boolean not null default true
);
create table public.classes(id uuid primary key default gen_random_uuid(),name text not null unique,programme text not null check(programme in ('Toddler','Playgroup','Pre-K','Kindergarten')));
create table public.students(id uuid primary key default gen_random_uuid(),name text not null,class_id uuid not null references public.classes(id),created_at timestamptz not null default now());
create table public.guardians(student_id uuid references public.students(id) on delete cascade,parent_id uuid references public.profiles(id) on delete cascade,primary key(student_id,parent_id));
create table public.teaching_assignments(class_id uuid references public.classes(id) on delete cascade,teacher_id uuid references public.profiles(id) on delete cascade,primary key(class_id,teacher_id));

create function private.role() returns text language sql stable security definer set search_path='' as $$select role from public.profiles where id=auth.uid() and active$$;
create function private.admin() returns boolean language sql stable security definer set search_path='' as $$select coalesce(private.role()='admin',false)$$;
create function private.parent(s uuid) returns boolean language sql stable security definer set search_path='' as $$select private.role()='parent' and exists(select 1 from public.guardians where student_id=s and parent_id=auth.uid())$$;
create function private.teacher(c uuid) returns boolean language sql stable security definer set search_path='' as $$select private.role()='teacher' and exists(select 1 from public.teaching_assignments where class_id=c and teacher_id=auth.uid())$$;
create function private.family(c uuid) returns boolean language sql stable security definer set search_path='' as $$select private.role()='parent' and exists(select 1 from public.students s join public.guardians g on g.student_id=s.id where s.class_id=c and g.parent_id=auth.uid())$$;
create function private.teaches_student(s uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.students where id=s and private.teacher(class_id))$$;

create table public.announcements(id uuid primary key default gen_random_uuid(),title text not null,body text not null,class_id uuid references public.classes(id),created_by uuid not null default auth.uid() references public.profiles(id),created_at timestamptz not null default now());
create table public.acknowledgements(announcement_id uuid references public.announcements(id) on delete cascade,user_id uuid default auth.uid() references public.profiles(id),created_at timestamptz not null default now(),primary key(announcement_id,user_id));
create table public.events(id uuid primary key default gen_random_uuid(),title text not null,body text not null,starts_at timestamptz not null,ends_at timestamptz not null,location text not null,class_id uuid references public.classes(id),created_by uuid not null default auth.uid() references public.profiles(id),check(ends_at>starts_at));
create table public.event_responses(event_id uuid references public.events(id) on delete cascade,user_id uuid default auth.uid() references public.profiles(id),response text not null check(response in ('attending','unable')),adult_count integer not null default 0 check(adult_count between 0 and 10),note text not null default '',updated_at timestamptz not null default now(),primary key(event_id,user_id),check((response='attending' and adult_count>=1) or (response='unable' and adult_count=0)));
create table public.assignments(id uuid primary key default gen_random_uuid(),class_id uuid not null references public.classes(id),title text not null,body text not null,due_at timestamptz not null,created_by uuid not null default auth.uid() references public.profiles(id),created_at timestamptz not null default now());
create table public.submissions(id uuid primary key default gen_random_uuid(),assignment_id uuid not null references public.assignments(id),student_id uuid not null references public.students(id),submitted_by uuid not null references public.profiles(id),note text not null,file_path text,status text not null default 'submitted' check(status in ('submitted','reviewed','needs_revision')),feedback text not null default '',created_at timestamptz not null default now(),unique(assignment_id,student_id));
create table public.progress_reports(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id),title text not null,body text not null,published boolean not null default false,created_by uuid not null default auth.uid() references public.profiles(id),created_at timestamptz not null default now());
create table public.absences(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id),starts_on date not null,ends_on date not null,reason text not null,created_by uuid not null default auth.uid() references public.profiles(id),acknowledged_at timestamptz,created_at timestamptz not null default now(),check(ends_on>=starts_on));
create table public.threads(id uuid primary key default gen_random_uuid(),kind text not null check(kind in ('class','private','finance')),class_id uuid references public.classes(id),student_id uuid references public.students(id),title text not null,read_only boolean not null default false,check((kind='class' and class_id is not null and student_id is null) or (kind in ('private','finance') and student_id is not null and class_id is null)));
create unique index one_class_thread on public.threads(class_id) where kind='class';
create unique index one_student_thread on public.threads(student_id,kind) where kind<>'class';
create function private.in_thread(t uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.threads where id=t and case kind when 'class' then private.teacher(class_id) or private.family(class_id) when 'private' then private.parent(student_id) or private.teaches_student(student_id) when 'finance' then private.parent(student_id) or private.admin() else false end)$$;
create table public.messages(id uuid primary key default gen_random_uuid(),thread_id uuid not null references public.threads(id) on delete cascade,sender_id uuid not null default auth.uid() references public.profiles(id),sender_name text not null default '',body text not null check(length(body) between 1 and 5000),created_at timestamptz not null default now());
create table public.invoices(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id),title text not null,amount numeric(14,2) not null check(amount>0),paid numeric(14,2) not null default 0 check(paid>=0 and paid<=amount),due_on date not null,created_by uuid not null default auth.uid() references public.profiles(id),created_at timestamptz not null default now());
create table public.payment_proofs(id uuid primary key default gen_random_uuid(),invoice_id uuid not null references public.invoices(id),submitted_by uuid not null references public.profiles(id),amount numeric(14,2) not null check(amount>0),file_path text not null,status text not null default 'pending' check(status in ('pending','accepted','rejected')),review_note text,reviewed_at timestamptz,reviewed_by uuid references public.profiles(id),created_at timestamptz not null default now());
create unique index one_pending_payment on public.payment_proofs(invoice_id) where status='pending';
create table public.albums(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id),title text not null,body text not null default '',file_path text,drive_url text,created_by uuid not null default auth.uid() references public.profiles(id),created_at timestamptz not null default now(),check(file_path is not null or drive_url is not null),check(drive_url is null or drive_url ~ '^https://drive[.]google[.]com/'));
create table public.photo_consents(student_id uuid references public.students(id),parent_id uuid default auth.uid() references public.profiles(id),class_use boolean not null default false,public_use boolean not null default false,updated_at timestamptz not null default now(),primary key(student_id,parent_id));
create table public.audit_logs(id bigint generated always as identity primary key,actor_id uuid,action text not null,table_name text not null,record_id text,created_at timestamptz not null default now());

-- Every exposed table is deny-by-default. No anonymous access to school records.
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
alter table public.classes enable row level security;
revoke all on public.classes from anon, authenticated;
grant select on public.classes to authenticated;
alter table public.students enable row level security;
revoke all on public.students from anon, authenticated;
grant select on public.students to authenticated;
alter table public.guardians enable row level security;
revoke all on public.guardians from anon, authenticated;
grant select on public.guardians to authenticated;
alter table public.teaching_assignments enable row level security;
revoke all on public.teaching_assignments from anon, authenticated;
grant select on public.teaching_assignments to authenticated;
alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;
grant select on public.announcements to authenticated;
alter table public.acknowledgements enable row level security;
revoke all on public.acknowledgements from anon, authenticated;
grant select on public.acknowledgements to authenticated;
alter table public.events enable row level security;
revoke all on public.events from anon, authenticated;
grant select on public.events to authenticated;
alter table public.event_responses enable row level security;
revoke all on public.event_responses from anon, authenticated;
grant select on public.event_responses to authenticated;
alter table public.assignments enable row level security;
revoke all on public.assignments from anon, authenticated;
grant select on public.assignments to authenticated;
alter table public.submissions enable row level security;
revoke all on public.submissions from anon, authenticated;
grant select on public.submissions to authenticated;
alter table public.progress_reports enable row level security;
revoke all on public.progress_reports from anon, authenticated;
grant select on public.progress_reports to authenticated;
alter table public.absences enable row level security;
revoke all on public.absences from anon, authenticated;
grant select on public.absences to authenticated;
alter table public.threads enable row level security;
revoke all on public.threads from anon, authenticated;
grant select on public.threads to authenticated;
alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
alter table public.invoices enable row level security;
revoke all on public.invoices from anon, authenticated;
grant select on public.invoices to authenticated;
alter table public.payment_proofs enable row level security;
revoke all on public.payment_proofs from anon, authenticated;
grant select on public.payment_proofs to authenticated;
alter table public.albums enable row level security;
revoke all on public.albums from anon, authenticated;
grant select on public.albums to authenticated;
alter table public.photo_consents enable row level security;
revoke all on public.photo_consents from anon, authenticated;
grant select on public.photo_consents to authenticated;
alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
create policy profiles_select on public.profiles for select to authenticated using ((id=auth.uid() and active) or private.admin());
create policy classes_select on public.classes for select to authenticated using (private.admin() or private.teacher(id) or private.family(id));
create policy students_select on public.students for select to authenticated using (private.admin() or private.parent(id) or private.teacher(class_id));
create policy guardians_select on public.guardians for select to authenticated using (private.admin() or parent_id=auth.uid());
create policy teaching_assignments_select on public.teaching_assignments for select to authenticated using (private.admin() or teacher_id=auth.uid());
grant insert, update, delete on public.classes to authenticated;
create policy classes_insert on public.classes for insert to authenticated with check (private.admin());
create policy classes_update on public.classes for update to authenticated using (private.admin()) with check (private.admin());
create policy classes_delete on public.classes for delete to authenticated using (private.admin());
grant insert, update, delete on public.students to authenticated;
create policy students_insert on public.students for insert to authenticated with check (private.admin());
create policy students_update on public.students for update to authenticated using (private.admin()) with check (private.admin());
create policy students_delete on public.students for delete to authenticated using (private.admin());
grant insert, update, delete on public.guardians to authenticated;
create policy guardians_insert on public.guardians for insert to authenticated with check (private.admin());
create policy guardians_update on public.guardians for update to authenticated using (private.admin()) with check (private.admin());
create policy guardians_delete on public.guardians for delete to authenticated using (private.admin());
grant insert, update, delete on public.teaching_assignments to authenticated;
create policy teaching_assignments_insert on public.teaching_assignments for insert to authenticated with check (private.admin());
create policy teaching_assignments_update on public.teaching_assignments for update to authenticated using (private.admin()) with check (private.admin());
create policy teaching_assignments_delete on public.teaching_assignments for delete to authenticated using (private.admin());
create policy announcements_select on public.announcements for select to authenticated using (private.role() is not null and (class_id is null or private.admin() or private.teacher(class_id) or private.family(class_id)));
grant insert on public.announcements to authenticated;
create policy announcements_insert on public.announcements for insert to authenticated with check (private.admin() and created_by=auth.uid());
create policy events_select on public.events for select to authenticated using (private.role() is not null and (class_id is null or private.admin() or private.teacher(class_id) or private.family(class_id)));
grant insert on public.events to authenticated;
create policy events_insert on public.events for insert to authenticated with check (private.admin() and created_by=auth.uid());
create policy acknowledgements_select on public.acknowledgements for select to authenticated using (user_id=auth.uid() or private.admin());
grant insert on public.acknowledgements to authenticated;
create policy acknowledgements_insert on public.acknowledgements for insert to authenticated with check (user_id=auth.uid() and private.role() is not null and exists(select 1 from public.announcements where id=announcement_id));
create policy event_responses_select on public.event_responses for select to authenticated using (user_id=auth.uid() or private.admin());
grant insert, update on public.event_responses to authenticated;
create policy event_responses_insert on public.event_responses for insert to authenticated with check (user_id=auth.uid() and private.role()='parent' and exists(select 1 from public.events where id=event_id));
create policy event_responses_update on public.event_responses for update to authenticated using (user_id=auth.uid() and private.role()='parent' and exists(select 1 from public.events where id=event_id)) with check (user_id=auth.uid() and private.role()='parent' and exists(select 1 from public.events where id=event_id));
create policy assignments_select on public.assignments for select to authenticated using (private.teacher(class_id) or private.family(class_id));
grant insert on public.assignments to authenticated;
create policy assignments_insert on public.assignments for insert to authenticated with check (private.teacher(class_id) and created_by=auth.uid());
create policy submissions_select on public.submissions for select to authenticated using (private.parent(student_id) or private.teaches_student(student_id));
create policy progress_reports_select on public.progress_reports for select to authenticated using (private.teaches_student(student_id) or (published and private.parent(student_id)));
grant insert, update on public.progress_reports to authenticated;
create policy progress_reports_insert on public.progress_reports for insert to authenticated with check (private.teaches_student(student_id) and created_by=auth.uid());
create policy progress_reports_update on public.progress_reports for update to authenticated using (private.teaches_student(student_id) and created_by=auth.uid()) with check (private.teaches_student(student_id) and created_by=auth.uid());
create policy absences_select on public.absences for select to authenticated using (private.parent(student_id) or private.teaches_student(student_id));
grant insert on public.absences to authenticated;
create policy absences_insert on public.absences for insert to authenticated with check (private.parent(student_id) and created_by=auth.uid() and acknowledged_at is null);
create policy threads_select on public.threads for select to authenticated using (private.in_thread(id));
create policy messages_select on public.messages for select to authenticated using (private.in_thread(thread_id));
grant insert on public.messages to authenticated;
create policy messages_insert on public.messages for insert to authenticated with check (sender_id=auth.uid() and private.in_thread(thread_id) and exists(select 1 from public.threads t where t.id=thread_id and (not t.read_only or private.teacher(t.class_id))));
create policy invoices_select on public.invoices for select to authenticated using (private.admin() or private.parent(student_id));
grant insert on public.invoices to authenticated;
create policy invoices_insert on public.invoices for insert to authenticated with check (private.admin() and created_by=auth.uid() and paid=0);
create policy payment_proofs_select on public.payment_proofs for select to authenticated using (private.admin() or exists(select 1 from public.invoices i where i.id=invoice_id and private.parent(i.student_id)));
create policy albums_select on public.albums for select to authenticated using (private.parent(student_id) or private.teaches_student(student_id));
grant insert on public.albums to authenticated;
create policy albums_insert on public.albums for insert to authenticated with check (private.teaches_student(student_id) and created_by=auth.uid() and (file_path is null or split_part(file_path,'/',1)=student_id::text));
create policy photo_consents_select on public.photo_consents for select to authenticated using (private.admin() or private.parent(student_id) or private.teaches_student(student_id));
grant insert, update on public.photo_consents to authenticated;
create policy photo_consents_insert on public.photo_consents for insert to authenticated with check (private.parent(student_id) and parent_id=auth.uid());
create policy photo_consents_update on public.photo_consents for update to authenticated using (private.parent(student_id) and parent_id=auth.uid()) with check (private.parent(student_id) and parent_id=auth.uid());
create policy audit_logs_select on public.audit_logs for select to authenticated using (private.admin());

-- Business mutations run inside transactions. Roles are never accepted from browser payloads.
create function public.ensure_threads() returns void language plpgsql security definer set search_path='' as $$
begin
 if private.role() is null then raise exception 'Account unavailable'; end if;
 insert into public.threads(kind,class_id,title)
 select 'class',c.id,c.name from public.classes c where private.teacher(c.id) or private.family(c.id)
 on conflict do nothing;
 insert into public.threads(kind,student_id,title)
 select k.kind,s.id,s.name from public.students s cross join (values ('private'),('finance')) k(kind)
 where private.parent(s.id) or (k.kind='private' and private.teaches_student(s.id)) or (k.kind='finance' and private.admin())
 on conflict do nothing;
end $$;
create function public.set_class_read_only(p_thread uuid,p_value boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.threads where id=p_thread and kind='class' and private.teacher(class_id)) then raise exception 'Not permitted'; end if;
 update public.threads set read_only=p_value where id=p_thread;
end $$;
create function private.message_author() returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.sender_id:=auth.uid();
 select display_name into new.sender_name from public.profiles where id=auth.uid() and active;
 new.created_at:=now();
 return new;
end $$;
create trigger set_message_author before insert on public.messages for each row execute function private.message_author();

create function public.submit_assignment(p_assignment uuid,p_student uuid,p_note text,p_file text default null) returns void language plpgsql security definer set search_path='' as $$
declare a public.assignments; s public.students;
begin
 select * into a from public.assignments where id=p_assignment;
 select * into s from public.students where id=p_student;
 if not coalesce(private.parent(p_student),false) or a.id is null or a.class_id<>s.class_id then raise exception 'Not permitted'; end if;
 if a.due_at<now() then raise exception 'Submission deadline has passed'; end if;
 if p_note is null or length(trim(p_note)) not between 1 and 5000 then raise exception 'Add a note of 1–5000 characters'; end if;
 if p_file is not null and split_part(p_file,'/',1)<>p_student::text then raise exception 'Invalid file scope'; end if;
 insert into public.submissions(assignment_id,student_id,submitted_by,note,file_path) values(p_assignment,p_student,auth.uid(),p_note,p_file)
 on conflict(assignment_id,student_id) do update set note=excluded.note,file_path=excluded.file_path,submitted_by=auth.uid(),status='submitted',feedback='',created_at=now();
end $$;
create function public.review_submission(p_submission uuid,p_feedback text,p_status text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.submissions where id=p_submission and private.teaches_student(student_id)) then raise exception 'Not permitted'; end if;
 if p_status not in ('reviewed','needs_revision') or length(trim(p_feedback)) not between 1 and 5000 then raise exception 'Invalid review'; end if;
 update public.submissions set feedback=p_feedback,status=p_status where id=p_submission;
end $$;
create function public.acknowledge_absence(p_absence uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.absences where id=p_absence and private.teaches_student(student_id)) then raise exception 'Not permitted'; end if;
 update public.absences set acknowledged_at=now() where id=p_absence;
end $$;
create function public.submit_payment(p_invoice uuid,p_amount numeric,p_file text) returns void language plpgsql security definer set search_path='' as $$
declare i public.invoices;
begin
 select * into i from public.invoices where id=p_invoice for update;
 if i.id is null or not coalesce(private.parent(i.student_id),false) then raise exception 'Not permitted'; end if;
 if p_amount is null or p_amount<=0 or p_amount>i.amount-i.paid then raise exception 'Amount exceeds balance or is invalid'; end if;
 if p_file is null or split_part(p_file,'/',1)<>i.student_id::text then raise exception 'Invalid receipt'; end if;
 if not exists(select 1 from storage.objects where bucket_id='payment-receipts' and name=p_file) then raise exception 'Upload the receipt first'; end if;
 insert into public.payment_proofs(invoice_id,submitted_by,amount,file_path) values(p_invoice,auth.uid(),p_amount,p_file);
end $$;
create function public.verify_payment(p_payment uuid,p_accept boolean,p_note text) returns void language plpgsql security definer set search_path='' as $$
declare p public.payment_proofs; i public.invoices;
begin
 if not coalesce(private.admin(),false) then raise exception 'Not permitted'; end if;
 if p_accept is null or p_note is null or length(trim(p_note))<1 then raise exception 'Decision and note required'; end if;
 select * into p from public.payment_proofs where id=p_payment;
 if p.id is null then raise exception 'Payment not found'; end if;
 -- Invoice lock first, same ordering as submit_payment; double verification cannot double-charge.
 select * into i from public.invoices where id=p.invoice_id for update;
 select * into p from public.payment_proofs where id=p_payment for update;
 if p.status<>'pending' then raise exception 'Already reviewed'; end if;
 if p_accept and p.amount>i.amount-i.paid then raise exception 'Amount exceeds remaining balance'; end if;
 if p_accept then update public.invoices set paid=paid+p.amount where id=i.id; end if;
 update public.payment_proofs set status=case when p_accept then 'accepted' else 'rejected' end,review_note=p_note,reviewed_at=now(),reviewed_by=auth.uid() where id=p.id;
end $$;

-- Audits intentionally contain action/IDs only, never private chat or health content.
create function private.audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_logs(actor_id,action,table_name,record_id) values(auth.uid(),tg_op,tg_table_name,coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id',to_jsonb(new)->>'student_id'));
 return coalesce(new,old);
end $$;
create trigger invoice_audit after insert or update on public.invoices for each row execute function private.audit();
create trigger payment_audit after insert or update on public.payment_proofs for each row execute function private.audit();
create trigger consent_audit after insert or update on public.photo_consents for each row execute function private.audit();
create trigger student_audit after insert or update or delete on public.students for each row execute function private.audit();
create trigger guardians_audit after insert or update or delete on public.guardians for each row execute function private.audit();

-- Private file buckets; all download access rechecks the current user's relationship.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('learning-files','learning-files',false,10485760,array['image/jpeg','image/png','application/pdf']),
 ('payment-receipts','payment-receipts',false,10485760,array['image/jpeg','image/png','application/pdf'])
on conflict(id) do nothing;
create function private.file_access(bucket text,path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.students s where s.id::text=split_part(path,'/',1) and case bucket
 when 'learning-files' then private.parent(s.id) or private.teaches_student(s.id)
 when 'payment-receipts' then private.parent(s.id) or private.admin()
 else false end)
$$;
create policy genyu_file_read on storage.objects for select to authenticated using(private.file_access(bucket_id,name));
create policy genyu_file_insert on storage.objects for insert to authenticated with check(private.file_access(bucket_id,name) and (bucket_id<>'payment-receipts' or private.role()='parent'));
-- Allows cleanup of failed uploads only while the uploader still has the student access.
create policy genyu_file_delete on storage.objects for delete to authenticated using(owner_id=auth.uid()::text and private.file_access(bucket_id,name) and not exists(select 1 from public.submissions where file_path=name) and not exists(select 1 from public.albums where file_path=name) and not exists(select 1 from public.payment_proofs where file_path=name));

revoke all on all functions in schema private from public,anon;
grant execute on all functions in schema private to authenticated;
revoke all on function public.ensure_threads(),public.set_class_read_only(uuid,boolean),public.submit_assignment(uuid,uuid,text,text),public.review_submission(uuid,text,text),public.acknowledge_absence(uuid),public.submit_payment(uuid,numeric,text),public.verify_payment(uuid,boolean,text) from public,anon;
grant execute on function public.ensure_threads(),public.set_class_read_only(uuid,boolean),public.submit_assignment(uuid,uuid,text,text),public.review_submission(uuid,text,text),public.acknowledge_absence(uuid),public.submit_payment(uuid,numeric,text),public.verify_payment(uuid,boolean,text) to authenticated;

create index messages_thread_time on public.messages(thread_id,created_at);
create index students_class on public.students(class_id);
create index guardians_parent on public.guardians(parent_id);
create index teaching_teacher on public.teaching_assignments(teacher_id);
create index assignments_class on public.assignments(class_id);
create index invoice_student on public.invoices(student_id);
create index submissions_student on public.submissions(student_id);
create index payment_invoice on public.payment_proofs(invoice_id);
-- Add only our table; never recreate an existing publication.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
  alter publication supabase_realtime add table public.messages;
 end if;
end $$;
commit;
