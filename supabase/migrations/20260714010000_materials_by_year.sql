create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.topics(id) on delete cascade not null,
  year int not null check (year >= 2000 and year <= 2100),
  title text not null,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_materials_topic_id on public.materials(topic_id);
create index if not exists idx_materials_year on public.materials(year desc);
create index if not exists idx_materials_topic_year on public.materials(topic_id, year desc);

alter table public.materials enable row level security;

drop policy if exists "materials_select_authenticated" on public.materials;
drop policy if exists "materials_admin_insert" on public.materials;
drop policy if exists "materials_admin_update" on public.materials;
drop policy if exists "materials_admin_delete" on public.materials;

create policy "materials_select_authenticated"
  on public.materials for select
  using (auth.uid() is not null);

create policy "materials_admin_insert"
  on public.materials for insert
  with check (public.get_user_role() = 'admin');

create policy "materials_admin_update"
  on public.materials for update
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "materials_admin_delete"
  on public.materials for delete
  using (public.get_user_role() = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  false,
  52428800,
  array['application/pdf']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "materials_storage_select_authenticated" on storage.objects;
drop policy if exists "materials_storage_insert_admin" on storage.objects;
drop policy if exists "materials_storage_update_admin" on storage.objects;
drop policy if exists "materials_storage_delete_admin" on storage.objects;

create policy "materials_storage_select_authenticated"
  on storage.objects for select
  using (
    bucket_id = 'materials'
    and auth.uid() is not null
  );

create policy "materials_storage_insert_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'materials'
    and public.get_user_role() = 'admin'
  );

create policy "materials_storage_update_admin"
  on storage.objects for update
  using (
    bucket_id = 'materials'
    and public.get_user_role() = 'admin'
  )
  with check (
    bucket_id = 'materials'
    and public.get_user_role() = 'admin'
  );

create policy "materials_storage_delete_admin"
  on storage.objects for delete
  using (
    bucket_id = 'materials'
    and public.get_user_role() = 'admin'
  );
