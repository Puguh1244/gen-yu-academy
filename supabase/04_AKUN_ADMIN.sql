-- Jalankan setelah tiga migrasi dan akun Auth berhasil dibuat.
-- Ubah EMAIL_ADMIN_ANDA di bawah dengan email akun milik Anda.
-- Jalankan lewat SQL Editor sebagai pemilik proyek Supabase.
do $$
declare admin_id uuid;
begin
  select id into admin_id from auth.users where lower(email) = lower('via@admin.com');
  if admin_id is null then
    raise exception 'Email belum ditemukan. Buat akun melalui Authentication > Users lalu ganti EMAIL_ADMIN_ANDA.';
  end if;
  insert into public.profiles(id,display_name,role,active)
  values(admin_id,'Administrator Gen-Yu Academy','admin',true)
  on conflict(id) do update set display_name=excluded.display_name,role='admin',active=true;
end $$;
