create or replace function public.get_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'student'
  );
$$;

revoke all on function public.get_user_role() from public;
grant execute on function public.get_user_role() to authenticated, anon, service_role;
