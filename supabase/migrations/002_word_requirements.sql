-- Apply after 001_school.sql. Existing private conversations are quarantined
-- until explicit participants are reviewed; no historical data is deleted.
begin;
create table public.account_preferences(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 language text not null default 'en' check(language in ('en','id')),
 messages boolean not null default true,tasks boolean not null default true,
 events boolean not null default true,administration boolean not null default true
);
alter table public.account_preferences enable row level security;
grant select,insert,update on public.account_preferences to authenticated;
create policy preferences_self on public.account_preferences for all to authenticated using(user_id=auth.uid() and private.role() is not null) with check(user_id=auth.uid() and private.role() is not null);

create table public.families(id uuid primary key default gen_random_uuid(),name text not null);
alter table public.students add column family_id uuid references public.families(id);
alter table public.families enable row level security;
grant select,insert,update on public.families to authenticated;
create policy family_admin on public.families for all to authenticated using(private.admin()) with check(private.admin());
create policy family_read on public.families for select to authenticated using(exists(select 1 from public.students s where s.family_id=families.id and private.parent(s.id)));
create function private.family_member(f uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.students s where s.family_id=f and private.parent(s.id))$$;
create function private.audience(a text,c uuid,p text) returns boolean language sql stable security definer set search_path='' as $$
 select case when private.role() is null then false when private.admin() then true
 when a in ('public','all') then true when a='class' then private.teacher(c) or private.family(c)
 when a='programme' then exists(select 1 from public.classes where programme=p and (private.teacher(id) or private.family(id))) else false end
$$;

-- Explicit private-chat membership, independent of guardian links alone.
drop index public.one_student_thread;
create unique index one_finance_thread on public.threads(student_id) where kind='finance';
alter table public.threads add column topic text not null default 'General Question';
create table public.thread_participants(thread_id uuid references public.threads(id) on delete cascade,user_id uuid references public.profiles(id) on delete cascade,primary key(thread_id,user_id));
alter table public.thread_participants enable row level security;
grant select on public.thread_participants to authenticated;
create or replace function private.in_thread(t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.threads x where x.id=t and case x.kind
 when 'class' then private.teacher(x.class_id) or private.family(x.class_id)
 when 'private' then exists(select 1 from public.thread_participants m where m.thread_id=x.id and m.user_id=auth.uid()) and (private.parent(x.student_id) or private.teaches_student(x.student_id))
 when 'finance' then private.parent(x.student_id) or private.admin() else false end)
$$;
create policy thread_participant_read on public.thread_participants for select to authenticated using(private.in_thread(thread_id));
create or replace function public.ensure_threads() returns void language plpgsql security definer set search_path='' as $$begin
 if private.role() is null then raise exception 'Account unavailable'; end if;
 insert into public.threads(kind,class_id,title) select 'class',c.id,c.name from public.classes c where private.teacher(c.id) or private.family(c.id) on conflict do nothing;
 insert into public.threads(kind,student_id,title) select 'finance',s.id,s.name from public.students s where private.parent(s.id) or private.admin() on conflict do nothing;
end$$;
create function public.child_teachers(p_student uuid) returns table(id uuid,display_name text) language sql stable security definer set search_path='' as $$
 select p.id,p.display_name from public.profiles p join public.teaching_assignments t on t.teacher_id=p.id join public.students s on s.class_id=t.class_id
 where s.id=p_student and p.active and p.role='teacher' and private.parent(s.id)
$$;
create function public.start_private_chat(p_student uuid,p_teacher uuid,p_topic text) returns uuid language plpgsql security definer set search_path='' as $$declare tid uuid;begin
 if not coalesce(private.parent(p_student),false) or not exists(select 1 from public.child_teachers(p_student) where id=p_teacher) then raise exception 'Not permitted';end if;
 if p_topic not in ('Absence','Wellbeing','Learning Support','General Question') then raise exception 'Invalid topic';end if;
 select x.id into tid from public.threads x where x.kind='private' and x.student_id=p_student and x.topic=p_topic and exists(select 1 from public.thread_participants where thread_id=x.id and user_id=auth.uid()) and exists(select 1 from public.thread_participants where thread_id=x.id and user_id=p_teacher) limit 1;
 if tid is null then
 insert into public.threads(kind,student_id,title,topic) select 'private',id,name,p_topic from public.students where id=p_student returning id into tid;
 insert into public.thread_participants values(tid,auth.uid()),(tid,p_teacher);
 end if;return tid;
end$$;
alter table public.messages add column file_path text;
alter table public.messages add column sender_role text not null default '';
create or replace function private.message_author() returns trigger language plpgsql security definer set search_path='' as $$begin
 new.sender_id:=auth.uid();select display_name into new.sender_name from public.profiles where id=auth.uid() and active;
 new.sender_role:=private.role();new.created_at:=now();new.pinned:=false;return new;
end$$;
alter table public.messages add column pinned boolean not null default false;
alter table public.messages add constraint message_file_scope check(file_path is null or split_part(file_path,'/',1)=thread_id::text);
create function public.pin_message(p_message uuid,p_pinned boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.messages m join public.threads t on t.id=m.thread_id where m.id=p_message and t.kind='class' and private.teacher(t.class_id)) then raise exception 'Not permitted';end if;
 update public.messages set pinned=p_pinned where id=p_message;
end$$;
create table public.thread_reads(thread_id uuid references public.threads(id) on delete cascade,user_id uuid default auth.uid() references public.profiles(id),read_at timestamptz not null default now(),primary key(thread_id,user_id));
alter table public.thread_reads enable row level security;grant select,insert,update on public.thread_reads to authenticated;
create policy thread_reads_self on public.thread_reads for all to authenticated using(user_id=auth.uid() and private.in_thread(thread_id)) with check(user_id=auth.uid() and private.in_thread(thread_id));

-- Class schedule and class albums.
create table public.class_schedule(id uuid primary key default gen_random_uuid(),class_id uuid not null references public.classes(id),title text not null,title_id text not null,body text not null,body_id text not null,starts_at timestamptz not null,ends_at timestamptz not null,created_by uuid not null default auth.uid() references public.profiles(id),check(ends_at>starts_at));
alter table public.class_schedule enable row level security;grant select,insert,update,delete on public.class_schedule to authenticated;
create policy schedule_read on public.class_schedule for select to authenticated using(private.teacher(class_id) or private.family(class_id));
create policy schedule_write on public.class_schedule for all to authenticated using(private.teacher(class_id)) with check(private.teacher(class_id) and created_by=auth.uid());
alter table public.albums alter column student_id drop not null;
alter table public.albums add column class_id uuid references public.classes(id);
alter table public.albums add column activity_on date not null default current_date;
alter table public.albums add column consent_checked boolean not null default false;
alter table public.albums add constraint album_scope check((student_id is null)<>(class_id is null));
drop policy albums_select on public.albums;drop policy albums_insert on public.albums;
create policy albums_read on public.albums for select to authenticated using(private.parent(student_id) or private.teaches_student(student_id) or private.teacher(class_id) or (consent_checked and private.family(class_id)));
create policy albums_write on public.albums for insert to authenticated with check(created_by=auth.uid() and ((student_id is not null and private.teaches_student(student_id) and (file_path is null or split_part(file_path,'/',1)=student_id::text)) or (class_id is not null and private.teacher(class_id) and consent_checked and (file_path is null or split_part(file_path,'/',1)='class' and split_part(file_path,'/',2)=class_id::text))));

-- Weekly assignment fields, private drafts, structured progress.
alter table public.assignments add column title_id text;
alter table public.assignments add column body_id text;
alter table public.assignments add column goals text not null default '';
alter table public.assignments add column goals_id text not null default '';
alter table public.assignments add column materials text not null default '';
alter table public.assignments add column materials_id text not null default '';
alter table public.assignments add column parent_role text not null default '';
alter table public.assignments add column parent_role_id text not null default '';
alter table public.assignments add column expected_result text not null default '';
alter table public.assignments add column expected_result_id text not null default '';
alter table public.assignments add column published_at timestamptz not null default now();
alter table public.assignments add column allow_late boolean not null default false;
drop policy assignments_select on public.assignments;
create policy assignments_read on public.assignments for select to authenticated using(private.teacher(class_id) or (published_at<=now() and private.family(class_id)));
alter table public.submissions drop constraint submissions_status_check;
alter table public.submissions add constraint submissions_status_check check(status in ('draft','submitted','reviewed','needs_revision'));
alter table public.submissions add column is_late boolean not null default false;
drop policy submissions_select on public.submissions;
create policy submissions_read on public.submissions for select to authenticated using((private.parent(student_id) and (status<>'draft' or submitted_by=auth.uid())) or (status<>'draft' and private.teaches_student(student_id)));
-- A child has one assignment result; drafts are visible only to their author.
create function public.save_activity(p_assignment uuid,p_student uuid,p_note text,p_file text,p_draft boolean) returns void language plpgsql security definer set search_path='' as $$declare a public.assignments;old public.submissions;begin
 select * into a from public.assignments where id=p_assignment;
 if not coalesce(private.parent(p_student),false) or a.id is null or a.published_at>now() or not exists(select 1 from public.students where id=p_student and class_id=a.class_id) then raise exception 'Not permitted';end if;
 if now()>a.due_at and not a.allow_late then raise exception 'Submission deadline has passed';end if;
 if p_note is null or length(p_note)>5000 or (not p_draft and length(trim(p_note))=0) then raise exception 'Invalid activity note';end if;
 if p_file is not null and split_part(p_file,'/',1)<>p_student::text then raise exception 'Invalid file scope';end if;
 perform pg_advisory_xact_lock(hashtext(p_assignment::text),hashtext(p_student::text));
 select * into old from public.submissions where assignment_id=p_assignment and student_id=p_student for update;
 if old.status='draft' and old.submitted_by<>auth.uid() then raise exception 'Another guardian has a private draft. Contact the teacher.';end if;
 insert into public.submissions(assignment_id,student_id,submitted_by,note,file_path,status,is_late) values(p_assignment,p_student,auth.uid(),p_note,p_file,case when p_draft then 'draft' else 'submitted' end,now()>a.due_at)
 on conflict(assignment_id,student_id) do update set note=excluded.note,file_path=excluded.file_path,submitted_by=excluded.submitted_by,status=excluded.status,is_late=excluded.is_late,feedback='',created_at=now();
end$$;
create or replace function public.submit_assignment(p_assignment uuid,p_student uuid,p_note text,p_file text default null) returns void language plpgsql security definer set search_path='' as $$begin perform public.save_activity(p_assignment,p_student,p_note,p_file,false);end$$;
create or replace function public.review_submission(p_submission uuid,p_feedback text,p_status text) returns void language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.submissions where id=p_submission and status<>'draft' and private.teaches_student(student_id)) then raise exception 'Not permitted';end if;
 if p_status not in ('reviewed','needs_revision') or p_feedback is null or length(trim(p_feedback)) not between 1 and 5000 then raise exception 'Invalid review';end if;
 update public.submissions set feedback=p_feedback,status=p_status where id=p_submission;
end$$;
alter table public.progress_reports add column observed_on date not null default current_date;
alter table public.progress_reports add column area text not null default '';
alter table public.progress_reports add column achievement text not null default '';
alter table public.progress_reports add column support text not null default '';
alter table public.progress_reports add column home_activity text not null default '';

alter table public.progress_reports add column title_id text;
alter table public.progress_reports add column body_id text;
alter table public.progress_reports add column achievement_id text not null default '';
alter table public.progress_reports add column support_id text not null default '';
alter table public.progress_reports add column home_activity_id text not null default '';

-- Absence privacy: author and assigned teacher only. Corrections are retained.
alter table public.absences add column category text not null default 'Other' check(category in ('Unwell','Family Matter','Other'));
alter table public.absences add column cancelled boolean not null default false;
alter table public.absences add column updated_at timestamptz not null default now();
drop policy absences_select on public.absences;
create policy absence_private_read on public.absences for select to authenticated using((created_by=auth.uid() and private.parent(student_id)) or private.teaches_student(student_id));
create table public.absence_history(id bigint generated always as identity primary key,absence_id uuid references public.absences(id),snapshot jsonb not null,changed_by uuid not null default auth.uid(),changed_at timestamptz not null default now());
alter table public.absence_history enable row level security;grant select on public.absence_history to authenticated;
create policy absence_history_read on public.absence_history for select to authenticated using(exists(select 1 from public.absences a where a.id=absence_id));
create function public.edit_absence(p_id uuid,p_start date,p_end date,p_category text,p_reason text,p_cancel boolean) returns void language plpgsql security definer set search_path='' as $$declare a public.absences;begin
 select * into a from public.absences where id=p_id for update;
 if a.id is null or a.created_by<>auth.uid() or not coalesce(private.parent(a.student_id),false) then raise exception 'Not permitted';end if;
 insert into public.absence_history(absence_id,snapshot) values(a.id,to_jsonb(a));
 update public.absences set starts_on=p_start,ends_on=p_end,category=p_category,reason=p_reason,cancelled=p_cancel,updated_at=now(),acknowledged_at=null where id=p_id;
end$$;
create function public.absence_summary() returns table(id uuid,student_id uuid,starts_on date,ends_on date,cancelled boolean,acknowledged boolean) language sql stable security definer set search_path='' as $$select id,student_id,starts_on,ends_on,cancelled,acknowledged_at is not null from public.absences where private.admin()$$;

-- Versioned information and deduplicated invitation responses.
alter table public.announcements add column title_id text;
alter table public.announcements add column body_id text;
alter table public.announcements add column audience text not null default 'all' check(audience in ('public','all','programme','class'));
alter table public.announcements add column programme text;
alter table public.announcements add column response_due timestamptz;
alter table public.announcements add column requires_ack boolean not null default true;
alter table public.announcements add column version integer not null default 1;
update public.announcements set audience='class' where class_id is not null;
alter table public.acknowledgements add column version integer not null default 1;
alter table public.acknowledgements drop constraint acknowledgements_pkey;
alter table public.acknowledgements add primary key(announcement_id,user_id,version);
drop policy announcements_select on public.announcements;
create policy announcements_read on public.announcements for select to authenticated using(private.audience(audience,class_id,programme));
drop policy acknowledgements_insert on public.acknowledgements;
create policy acknowledge_current on public.acknowledgements for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.announcements a where a.id=announcement_id and a.version=acknowledgements.version and a.requires_ack and (a.response_due is null or a.response_due>=now())));
alter table public.events add column title_id text;
alter table public.events add column body_id text;
alter table public.events add column audience text not null default 'all' check(audience in ('public','all','programme','class'));
alter table public.events add column programme text;
alter table public.events add column scope_kind text not null default 'student' check(scope_kind in ('student','family'));
alter table public.events add column response_due timestamptz;
alter table public.events add column parent_required boolean not null default false;
alter table public.events add column arrival_at timestamptz;
alter table public.events add column preparation text not null default '';
alter table public.events add column preparation_id text not null default '';
alter table public.events add column version integer not null default 1;
update public.events set audience='class' where class_id is not null;
drop policy events_select on public.events;
create policy event_read on public.events for select to authenticated using(private.audience(audience,class_id,programme));
create table public.information_history(id bigint generated always as identity primary key,kind text not null,record_id uuid not null,version integer not null,snapshot jsonb not null,changed_at timestamptz not null default now(),changed_by uuid not null default auth.uid());
alter table public.information_history enable row level security;grant select on public.information_history to authenticated;
create policy information_history_read on public.information_history for select to authenticated using(private.admin() or (kind='event' and exists(select 1 from public.events where id=record_id)) or (kind='announcement' and exists(select 1 from public.announcements where id=record_id)));
create table public.attendance_responses(event_id uuid references public.events(id),scope_kind text not null check(scope_kind in ('student','family')),scope_id uuid not null,version integer not null,actor_id uuid not null default auth.uid() references public.profiles(id),actor_name text not null default '',response text not null check(response in ('attending','unable')),adult_count integer not null check(adult_count between 0 and 10),note text not null default '',updated_at timestamptz not null default now(),primary key(event_id,scope_kind,scope_id,version),check((response='attending' and adult_count>=1) or (response='unable' and adult_count=0)));
alter table public.attendance_responses enable row level security;grant select on public.attendance_responses to authenticated;
create policy attendance_read on public.attendance_responses for select to authenticated using(private.admin() or (scope_kind='student' and private.parent(scope_id)) or (scope_kind='family' and private.family_member(scope_id)));
create table public.attendance_history(id bigint generated always as identity primary key,event_id uuid references public.events(id),scope_kind text not null,scope_id uuid not null,snapshot jsonb not null,changed_at timestamptz not null default now());
alter table public.attendance_history enable row level security;grant select on public.attendance_history to authenticated;
create policy attendance_history_read on public.attendance_history for select to authenticated using(private.admin() or (scope_kind='student' and private.parent(scope_id)) or (scope_kind='family' and private.family_member(scope_id)));
create function public.respond_to_event(p_event uuid,p_scope uuid,p_response text,p_count integer,p_note text) returns void language plpgsql security definer set search_path='' as $$declare ev public.events;old public.attendance_responses;begin
 select * into ev from public.events where id=p_event for update;
 if ev.id is null or private.role()<>'parent' or not private.audience(ev.audience,ev.class_id,ev.programme) then raise exception 'Not permitted';end if;
 if ev.response_due is not null and ev.response_due<now() then raise exception 'Response deadline has passed';end if;
 if ev.scope_kind='student' and not coalesce(private.parent(p_scope),false) or ev.scope_kind='family' and not coalesce(private.family_member(p_scope),false) then raise exception 'Invalid invitation target';end if;
 if not exists(select 1 from public.students s join public.classes c on c.id=s.class_id where (ev.scope_kind='student' and s.id=p_scope or ev.scope_kind='family' and s.family_id=p_scope and private.parent(s.id)) and (ev.audience in ('all','public') or ev.audience='class' and ev.class_id=c.id or ev.audience='programme' and ev.programme=c.programme)) then raise exception 'Target not invited';end if;
 select * into old from public.attendance_responses where event_id=p_event and scope_kind=ev.scope_kind and scope_id=p_scope and version=ev.version;
 if old.event_id is not null then insert into public.attendance_history(event_id,scope_kind,scope_id,snapshot) values(p_event,ev.scope_kind,p_scope,to_jsonb(old));end if;
 insert into public.attendance_responses(event_id,scope_kind,scope_id,version,actor_name,response,adult_count,note) values(p_event,ev.scope_kind,p_scope,ev.version,(select display_name from public.profiles where id=auth.uid()),p_response,p_count,coalesce(p_note,'')) on conflict(event_id,scope_kind,scope_id,version) do update set actor_id=auth.uid(),actor_name=excluded.actor_name,response=excluded.response,adult_count=excluded.adult_count,note=excluded.note,updated_at=now();
end$$;
-- Legacy account-level RSVP is read-only; new writes must use the scoped RPC.
revoke insert,update on public.event_responses from authenticated;

-- Billing metadata; no payment gateway required.
alter table public.invoices add column invoice_number text;
alter table public.invoices add column fee_type text not null default '';
alter table public.invoices add column period text not null default '';
alter table public.invoices add column title_id text;
alter table public.invoices add column instructions text not null default '';
alter table public.invoices add column instructions_id text not null default '';
create unique index invoice_numbers_unique on public.invoices(invoice_number) where invoice_number is not null;

-- Editorial workflow / public school content.
create table public.school_content(
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in ('news','teacher','article','gallery','page')),
 title text not null,title_id text not null,body text not null,body_id text not null,
 summary text not null default '',summary_id text not null default '',class_id uuid references public.classes(id),
 metadata jsonb not null default '{}',file_path text,status text not null default 'draft' check(status in ('draft','submitted','published')),
 verified boolean not null default false,photo_permission boolean not null default false,
 created_by uuid not null default auth.uid() references public.profiles(id),published_at timestamptz,created_at timestamptz not null default now(),
 check(status<>'published' or verified and (file_path is null or photo_permission))
);
alter table public.school_content enable row level security;grant select,insert,update,delete on public.school_content to authenticated;
create policy content_read on public.school_content for select to authenticated using(private.admin() or created_by=auth.uid() and private.role()='teacher' or status='published' and private.role() is not null);
create policy content_create on public.school_content for insert to authenticated with check(created_by=auth.uid() and (private.admin() or private.role()='teacher' and kind='news' and status in ('draft','submitted') and not verified and not photo_permission and private.teacher(class_id)));
create policy content_update on public.school_content for update to authenticated using(private.admin() or created_by=auth.uid() and private.role()='teacher' and status in ('draft','submitted')) with check(private.admin() or created_by=auth.uid() and kind='news' and status in ('draft','submitted') and not verified and not photo_permission and private.teacher(class_id));
create policy content_delete on public.school_content for delete to authenticated using(private.admin());
create table public.school_settings(key text primary key,value jsonb not null);
alter table public.school_settings enable row level security;grant select,insert,update on public.school_settings to authenticated;
create policy settings_read on public.school_settings for select to authenticated using(private.role() is not null);
create policy settings_admin on public.school_settings for all to authenticated using(private.admin()) with check(private.admin());
insert into public.school_settings values
 ('teacher_service_hours','{"en":"Please contact the school to confirm teacher response hours.","id":"Hubungi sekolah untuk memastikan jam respons guru."}'),
 ('admissions','{"en":"School hours, required documents, vacancies and trial classes will be confirmed by admissions.","id":"Jam sekolah, dokumen, ketersediaan tempat, dan trial class dikonfirmasi administrasi penerimaan."}');
create table public.admission_enquiries(id uuid primary key default gen_random_uuid(),guardian_name text not null,email text not null,phone text not null,programme text not null,child_age numeric,preferred_visit date,message text not null default '',consent boolean not null check(consent),status text not null default 'Received' check(status in ('Received','Contacted','Visit Scheduled','Registration in Progress','Completed')),follow_up text not null default '',confirmed_visit timestamptz,created_at timestamptz not null default now());
alter table public.admission_enquiries enable row level security;grant select,update on public.admission_enquiries to authenticated;
create policy enquiries_admin on public.admission_enquiries for all to authenticated using(private.admin()) with check(private.admin());
create function public.submit_enquiry(p_name text,p_email text,p_phone text,p_programme text,p_age numeric,p_visit date,p_message text,p_consent boolean,p_website text default '') returns uuid language plpgsql security definer set search_path='' as $$declare rid uuid;begin
 if coalesce(p_website,'')<>'' then raise exception 'Unable to submit';end if;
 if p_consent is not true or p_name is null or length(trim(p_name)) not between 1 and 120 or p_email is null or p_email!~'^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(p_email)>254 or p_phone is null or length(p_phone) not between 5 and 30 or p_age is null or p_age not between 0 and 10 or length(coalesce(p_message,''))>3000 or p_programme not in ('Toddler','Playgroup','Pre-K','Kindergarten') or p_visit<current_date then raise exception 'Please check the enquiry fields and consent';end if;
 perform pg_advisory_xact_lock(hashtext(lower(p_email)));
 if (select count(*) from public.admission_enquiries where lower(email)=lower(p_email) and created_at>now()-interval '1 hour')>=3 then raise exception 'Please wait before submitting another enquiry';end if;
 insert into public.admission_enquiries(guardian_name,email,phone,programme,child_age,preferred_visit,message,consent) values(trim(p_name),lower(p_email),p_phone,p_programme,p_age,p_visit,coalesce(p_message,''),true) returning id into rid;
 return rid;
end$$;

-- Notification contents are generic. No health notes, message body or payment amounts.
create table public.notifications(id bigint generated always as identity primary key,recipient uuid not null references public.profiles(id),category text not null check(category in ('messages','tasks','events','administration')),source_id uuid,title text not null,title_id text not null,created_at timestamptz not null default now(),read_at timestamptz,version integer not null default 1,reminder_day date);
create unique index notification_reminder_once on public.notifications(recipient,category,source_id,version,reminder_day) where reminder_day is not null;
alter table public.notifications enable row level security;grant select on public.notifications to authenticated;
create policy notifications_self on public.notifications for select to authenticated using(recipient=auth.uid() and private.role() is not null);
create function public.mark_notification(p_id bigint) returns void language plpgsql security definer set search_path='' as $$begin update public.notifications set read_at=now() where id=p_id and recipient=auth.uid() and private.role() is not null;end$$;
create function private.notify(p_user uuid,p_category text,p_source uuid,p_en text,p_id text,p_version integer default 1,p_day date default null) returns void language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.profiles where id=p_user and active) then return;end if;
 if exists(select 1 from public.account_preferences where user_id=p_user and (p_category='messages' and not messages or p_category='tasks' and not tasks or p_category='events' and not events or p_category='administration' and not administration)) then return;end if;
 insert into public.notifications(recipient,category,source_id,title,title_id,version,reminder_day) values(p_user,p_category,p_source,p_en,p_id,p_version,p_day) on conflict do nothing;
end$$;
create function private.user_audience(u uuid,a text,c uuid,p text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles pr where pr.id=u and pr.active and (pr.role='admin' or a in ('public','all') or exists(select 1 from public.classes cl where (a='class' and cl.id=c or a='programme' and cl.programme=p) and (pr.role='teacher' and exists(select 1 from public.teaching_assignments where teacher_id=u and class_id=cl.id) or pr.role='parent' and exists(select 1 from public.guardians g join public.students s on s.id=g.student_id where g.parent_id=u and s.class_id=cl.id)))))
$$;
create function private.school_notice() returns trigger language plpgsql security definer set search_path='' as $$declare u record;tid uuid;begin
 if tg_table_name='messages' then
 for u in select distinct p.id from public.profiles p join public.threads t on t.id=new.thread_id where p.active and p.id<>new.sender_id and (
 t.kind='class' and (p.role='teacher' and exists(select 1 from public.teaching_assignments where teacher_id=p.id and class_id=t.class_id) or p.role='parent' and exists(select 1 from public.guardians g join public.students s on s.id=g.student_id where g.parent_id=p.id and s.class_id=t.class_id)) or
 t.kind='private' and exists(select 1 from public.thread_participants where thread_id=t.id and user_id=p.id) and (p.role='parent' and exists(select 1 from public.guardians where parent_id=p.id and student_id=t.student_id) or p.role='teacher' and exists(select 1 from public.teaching_assignments ta join public.students s on s.class_id=ta.class_id where s.id=t.student_id and ta.teacher_id=p.id)) or
 t.kind='finance' and (p.role='admin' or p.role='parent' and exists(select 1 from public.guardians where parent_id=p.id and student_id=t.student_id))) loop
 perform private.notify(u.id,'messages',new.thread_id,'You have a new school message.','Anda memiliki pesan sekolah baru.');end loop;
 elsif tg_table_name='assignments' then
 if new.published_at>now() then return new;end if;
 for u in select distinct g.parent_id id from public.guardians g join public.students s on s.id=g.student_id where s.class_id=new.class_id loop perform private.notify(u.id,'tasks',new.id,'A weekly activity is available.','Kegiatan mingguan tersedia.');end loop;
 elsif tg_table_name='absences' then
 for u in select ta.teacher_id id from public.teaching_assignments ta join public.students s on s.class_id=ta.class_id where s.id=new.student_id loop perform private.notify(u.id,'tasks',new.id,'An absence report needs your attention.','Laporan izin perlu ditinjau.');end loop;
 elsif tg_table_name='invoices' then
 for u in select parent_id id from public.guardians where student_id=new.student_id loop perform private.notify(u.id,'administration',new.id,'A school administration update is available.','Informasi administrasi sekolah tersedia.');end loop;
 elsif tg_table_name in ('events','announcements') then
 for u in select id from public.profiles where private.user_audience(id,new.audience,new.class_id,new.programme) loop perform private.notify(u.id,'events',new.id,'School information has been published or updated. Please review it.','Informasi sekolah diterbitkan atau diperbarui. Silakan baca kembali.',new.version);end loop;
 end if;return new;
end$$;
create trigger message_notice after insert on public.messages for each row execute function private.school_notice();
create trigger task_notice after insert on public.assignments for each row execute function private.school_notice();
create trigger absence_notice after insert or update on public.absences for each row execute function private.school_notice();
create trigger invoice_notice after insert on public.invoices for each row execute function private.school_notice();
create trigger event_notice after insert or update on public.events for each row execute function private.school_notice();
create trigger announcement_notice after insert or update on public.announcements for each row execute function private.school_notice();

-- Versioning occurs in the database, not a client flag.
create function private.version_information() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into public.information_history(kind,record_id,version,snapshot) values(case tg_table_name when 'events' then 'event' else 'announcement' end,old.id,old.version,to_jsonb(old));
 new.version:=old.version+1;return new;
end$$;
create trigger version_event before update on public.events for each row execute function private.version_information();
create trigger version_announcement before update on public.announcements for each row execute function private.version_information();
grant update on public.events,public.announcements to authenticated;
create policy event_admin_update on public.events for update to authenticated using(private.admin()) with check(private.admin());
create policy announcement_admin_update on public.announcements for update to authenticated using(private.admin()) with check(private.admin());

-- Recap targets, including accounts that have not acknowledged.
create function public.announcement_recap(p_id uuid) returns table(user_id uuid,display_name text,acknowledged_at timestamptz) language sql stable security definer set search_path='' as $$
 select p.id,p.display_name,k.created_at from public.announcements a join public.profiles p on p.role='parent' and private.user_audience(p.id,a.audience,a.class_id,a.programme) left join public.acknowledgements k on k.announcement_id=a.id and k.user_id=p.id and k.version=a.version
 where a.id=p_id and (private.admin() or a.audience='class' and private.teacher(a.class_id))
$$;
create function public.send_pending_reminders() returns integer language plpgsql security definer set search_path='' as $$declare ev record;u record;n integer:=0;begin
 if not coalesce(private.admin(),false) then raise exception 'Not permitted';end if;
 for ev in select * from public.announcements where requires_ack and response_due>=now() loop
 for u in select * from public.announcement_recap(ev.id) where acknowledged_at is null loop
 perform private.notify(u.user_id,'events',ev.id,'Please acknowledge the school announcement.','Mohon konfirmasi membaca pengumuman sekolah.',ev.version,current_date);n:=n+1;end loop;end loop;
 for ev in select * from public.events where response_due>=now() loop
 for u in select distinct p.id from public.profiles p where p.role='parent' and private.user_audience(p.id,ev.audience,ev.class_id,ev.programme) and exists(select 1 from public.guardians g join public.students s on s.id=g.student_id join public.classes c on c.id=s.class_id where g.parent_id=p.id and (ev.audience in ('all','public') or ev.audience='class' and c.id=ev.class_id or ev.audience='programme' and c.programme=ev.programme) and not exists(select 1 from public.attendance_responses r where r.event_id=ev.id and r.version=ev.version and r.scope_kind=ev.scope_kind and r.scope_id=case when ev.scope_kind='student' then s.id else s.family_id end)) loop
 perform private.notify(u.id,'events',ev.id,'Please confirm attendance for a school event.','Mohon konfirmasi kehadiran acara sekolah.',ev.version,current_date);n:=n+1;end loop;end loop;return n;
end$$;

create function public.website_feed() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'content',coalesce((select jsonb_agg(jsonb_build_object('id',id,'kind',kind,'title',title,'title_id',title_id,'body',body,'body_id',body_id,'summary',summary,'summary_id',summary_id,'metadata',metadata,'file_path',file_path,'published_at',published_at)) from public.school_content where status='published' and verified and (file_path is null or photo_permission)),'[]'::jsonb),
 'announcements',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'title_id',title_id,'body',body,'body_id',body_id,'version',version,'created_at',created_at)) from public.announcements where audience='public'),'[]'::jsonb),
 'events',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'title_id',title_id,'body',body,'body_id',body_id,'starts_at',starts_at,'ends_at',ends_at,'location',location,'version',version)) from public.events where audience='public'),'[]'::jsonb),
 'settings',coalesce((select jsonb_object_agg(key,value) from public.school_settings where key in ('admissions','teacher_service_hours')),'{}'::jsonb))
$$;

-- Media restrictions: drafts and private-message files share the same ACL as their rows.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('chat-files','chat-files',false,10485760,array['image/jpeg','image/png','application/pdf']),
 ('school-media','school-media',false,10485760,array['image/jpeg','image/png']) on conflict(id) do nothing;
update storage.buckets set file_size_limit=26214400,allowed_mime_types=array['image/jpeg','image/png','application/pdf','video/mp4','video/webm'] where id='learning-files';
create or replace function private.file_access(bucket text,path text) returns boolean language sql stable security definer set search_path='' as $$
 select case when bucket='chat-files' then exists(select 1 from public.threads where id::text=split_part(path,'/',1) and private.in_thread(id))
 when bucket='school-media' then private.admin() or private.role()='teacher' and split_part(path,'/',1)=auth.uid()::text
 when bucket='learning-files' and split_part(path,'/',1)='class' then exists(select 1 from public.classes where id::text=split_part(path,'/',2) and (private.teacher(id) or private.family(id)))
 else exists(select 1 from public.students s where s.id::text=split_part(path,'/',1) and case bucket when 'learning-files' then private.parent(s.id) or private.teaches_student(s.id) when 'payment-receipts' then private.parent(s.id) or private.admin() else false end) end
$$;
create function private.file_read(bucket text,path text,owner text) returns boolean language sql stable security definer set search_path='' as $$
 select case when bucket='school-media' then exists(select 1 from public.school_content where file_path=path and status='published' and verified and photo_permission) or (private.file_access(bucket,path) and private.role() is not null)
 when not coalesce(private.file_access(bucket,path),false) then false
 when bucket='payment-receipts' then true
 when owner=auth.uid()::text then true
 when bucket='chat-files' then exists(select 1 from public.messages where file_path=path and private.in_thread(thread_id))
 when bucket='learning-files' then exists(select 1 from public.submissions where file_path=path and status<>'draft' and (private.parent(student_id) or private.teaches_student(student_id))) or exists(select 1 from public.albums where file_path=path and (private.parent(student_id) or private.teaches_student(student_id) or private.teacher(class_id) or consent_checked and private.family(class_id)))
 else false end
$$;
drop policy genyu_file_read on storage.objects;
create policy genyu_file_read on storage.objects for select to authenticated using(private.file_read(bucket_id,name,owner_id));
create policy genyu_public_media_read on storage.objects for select to anon using(bucket_id='school-media' and private.file_read(bucket_id,name,owner_id));
drop policy genyu_file_insert on storage.objects;
create policy genyu_file_insert on storage.objects for insert to authenticated with check(private.file_access(bucket_id,name) and (bucket_id<>'payment-receipts' or private.role()='parent') and (bucket_id<>'learning-files' or split_part(name,'/',1)<>'class' or private.role()='teacher'));
drop policy genyu_file_delete on storage.objects;
create function private.file_unreferenced(path text) returns boolean language sql stable security definer set search_path='' as $$select not exists(select 1 from public.submissions where file_path=path) and not exists(select 1 from public.albums where file_path=path) and not exists(select 1 from public.payment_proofs where file_path=path) and not exists(select 1 from public.messages where file_path=path) and not exists(select 1 from public.school_content where file_path=path)$$;
create policy genyu_file_delete on storage.objects for delete to authenticated using(owner_id=auth.uid()::text and private.file_access(bucket_id,name) and private.file_unreferenced(name));

create table public.access_tasks(id bigint generated always as identity primary key,student_id uuid references public.students(id),description text not null,completed boolean not null default false,created_at timestamptz not null default now());
alter table public.access_tasks enable row level security;grant select,update on public.access_tasks to authenticated;
create policy access_tasks_admin on public.access_tasks for all to authenticated using(private.admin()) with check(private.admin());
create function private.access_change() returns trigger language plpgsql security definer set search_path='' as $$begin
 if tg_table_name='students' then if old.class_id is distinct from new.class_id then insert into public.access_tasks(student_id,description) values(new.id,'Review and revoke old Google Drive class access; grant verified new class access. Portal access already follows the new class.');end if;
 elsif tg_table_name='guardians' then insert into public.access_tasks(student_id,description) values(old.student_id,'Review Google Drive permissions after removal of a guardian link.');end if;return coalesce(new,old);
end$$;
create trigger student_access_task after update on public.students for each row execute function private.access_change();
create trigger guardian_access_task after delete on public.guardians for each row execute function private.access_change();
create trigger teacher_assignment_audit after insert or update or delete on public.teaching_assignments for each row execute function private.audit();
create trigger content_audit after insert or update or delete on public.school_content for each row execute function private.audit();

create function public.unread_messages() returns table(thread_id uuid,kind text,student_id uuid,class_id uuid,total bigint) language sql stable security definer set search_path='' as $$
 select t.id,t.kind,t.student_id,t.class_id,count(m.id) from public.threads t join public.messages m on m.thread_id=t.id left join public.thread_reads r on r.thread_id=t.id and r.user_id=auth.uid()
 where private.in_thread(t.id) and m.sender_id<>auth.uid() and m.created_at>coalesce(r.read_at,'epoch'::timestamptz) group by t.id
$$;
create function public.sync_my_notifications() returns void language plpgsql security definer set search_path='' as $$declare a record;begin
 if private.role()<>'parent' then return;end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 for a in select * from public.assignments where published_at<=now() and private.family(class_id) and not exists(select 1 from public.notifications n where n.recipient=auth.uid() and n.source_id=assignments.id and n.category='tasks') loop
 perform private.notify(auth.uid(),'tasks',a.id,'A weekly activity is available.','Kegiatan mingguan tersedia.');end loop;
end$$;
revoke all on function public.unread_messages(),public.sync_my_notifications() from public,anon;
grant execute on function public.unread_messages(),public.sync_my_notifications() to authenticated;

revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.role(),private.admin(),private.parent(uuid),private.teacher(uuid),private.family(uuid),private.teaches_student(uuid),private.in_thread(uuid),private.family_member(uuid),private.audience(text,uuid,text),private.file_access(text,text),private.file_read(text,text,text),private.file_unreferenced(text) to authenticated;
grant usage on schema private to anon;
grant execute on function private.file_read(text,text,text) to anon;
revoke all on function public.child_teachers(uuid),public.start_private_chat(uuid,uuid,text),public.pin_message(uuid,boolean),public.save_activity(uuid,uuid,text,text,boolean),public.edit_absence(uuid,date,date,text,text,boolean),public.absence_summary(),public.respond_to_event(uuid,uuid,text,integer,text),public.mark_notification(bigint),public.announcement_recap(uuid),public.send_pending_reminders(),public.website_feed(),public.submit_enquiry(text,text,text,text,numeric,date,text,boolean,text) from public,anon,authenticated;
grant execute on function public.child_teachers(uuid),public.start_private_chat(uuid,uuid,text),public.pin_message(uuid,boolean),public.save_activity(uuid,uuid,text,text,boolean),public.edit_absence(uuid,date,date,text,text,boolean),public.absence_summary(),public.respond_to_event(uuid,uuid,text,integer,text),public.mark_notification(bigint),public.announcement_recap(uuid),public.send_pending_reminders() to authenticated;
grant execute on function public.website_feed(),public.submit_enquiry(text,text,text,text,numeric,date,text,boolean,text) to anon,authenticated;
create index notifications_recipient_time on public.notifications(recipient,created_at desc);
create index thread_participants_user on public.thread_participants(user_id);
create index schedule_class_start on public.class_schedule(class_id,starts_at);
commit;
