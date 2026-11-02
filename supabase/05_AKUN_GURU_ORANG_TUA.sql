-- Buat kedua akun terlebih dahulu lewat Authentication > Users.
-- Ganti kedua email contoh dengan email akun yang telah Anda buat.
-- Jalankan melalui SQL Editor sebagai pemilik proyek.
begin;
do $$
declare r record; account_id uuid;
begin
  for r in select * from (values
    ('via@teacher.com','Guru Gen-Yu Academy','teacher'),
    ('via@parent.com','Orang Tua Gen-Yu Academy','parent')
  ) as x(email,display_name,school_role)
  loop
    select id into account_id from auth.users where lower(email)=lower(r.email);
    if account_id is null then
      raise exception 'Akun Auth belum ditemukan: %. Buat akun dan ganti email contoh terlebih dahulu.',r.email;
    end if;
    insert into public.profiles(id,display_name,role,active)
    values(account_id,r.display_name,r.school_role,true)
    on conflict(id) do update set display_name=excluded.display_name,role=excluded.role,active=true;
  end loop;
end $$;
commit;
-- Setelah itu, tautkan guru/kelas serta wali/anak melalui School Records.
