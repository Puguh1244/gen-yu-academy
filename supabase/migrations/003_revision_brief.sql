-- Apply after 001 and 002. No existing records are deleted.
begin;
alter table public.classes drop constraint classes_programme_check;
update public.classes set programme='Pre-Kindergarten' where programme='Pre-K';
alter table public.classes add constraint classes_programme_check check(programme in ('Toddler','Playgroup','Pre-Kindergarten','Kindergarten'));
update public.announcements set programme='Pre-Kindergarten' where programme='Pre-K';
update public.events set programme='Pre-Kindergarten' where programme='Pre-K';
update public.admission_enquiries set programme='Pre-Kindergarten' where programme='Pre-K';
create or replace function public.submit_enquiry(p_name text,p_email text,p_phone text,p_programme text,p_age numeric,p_visit date,p_message text,p_consent boolean,p_website text default '') returns uuid language plpgsql security definer set search_path='' as $$declare rid uuid;begin
 if coalesce(p_website,'')<>'' then raise exception 'Unable to submit';end if;
 if p_consent is not true or p_name is null or length(trim(p_name)) not between 1 and 120 or p_email is null or p_email!~'^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(p_email)>254 or p_phone is null or length(p_phone) not between 5 and 30 or p_age is null or p_age not between 0 and 10 or length(coalesce(p_message,''))>3000 or p_programme not in ('Toddler','Playgroup','Pre-Kindergarten','Kindergarten') or p_visit<current_date then raise exception 'Please check the enquiry fields and consent';end if;
 perform pg_advisory_xact_lock(hashtext(lower(p_email)));
 if (select count(*) from public.admission_enquiries where lower(email)=lower(p_email) and created_at>now()-interval '1 hour')>=3 then raise exception 'Please wait before submitting another enquiry';end if;
 insert into public.admission_enquiries(guardian_name,email,phone,programme,child_age,preferred_visit,message,consent) values(trim(p_name),lower(p_email),p_phone,p_programme,p_age,p_visit,coalesce(p_message,''),true) returning id into rid;
 return rid;
end$$;
insert into public.school_settings(key,value) values ('schema_revision','"3"'::jsonb) on conflict(key) do update set value=excluded.value;
commit;
