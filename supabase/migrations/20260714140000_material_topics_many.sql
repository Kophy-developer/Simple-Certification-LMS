create table if not exists public.material_topics (
  material_id uuid not null references public.materials(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary key (material_id, topic_id)
);

create index if not exists idx_material_topics_topic_id
  on public.material_topics(topic_id);

insert into public.material_topics (material_id, topic_id)
select id, topic_id
from public.materials
where topic_id is not null
on conflict do nothing;

alter table public.materials drop constraint if exists materials_topic_id_fkey;
drop index if exists idx_materials_topic_id;
drop index if exists idx_materials_topic_year;
alter table public.materials drop column if exists topic_id;

alter table public.material_topics enable row level security;

drop policy if exists "material_topics_select_authenticated" on public.material_topics;
drop policy if exists "material_topics_admin_insert" on public.material_topics;
drop policy if exists "material_topics_admin_update" on public.material_topics;
drop policy if exists "material_topics_admin_delete" on public.material_topics;

create policy "material_topics_select_authenticated"
  on public.material_topics for select
  using (auth.uid() is not null);

create policy "material_topics_admin_insert"
  on public.material_topics for insert
  with check (public.get_user_role() = 'admin');

create policy "material_topics_admin_update"
  on public.material_topics for update
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "material_topics_admin_delete"
  on public.material_topics for delete
  using (public.get_user_role() = 'admin');
