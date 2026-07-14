create table if not exists public.lesson_parts (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  title text not null default 'Part 1',
  drive_file_id text not null,
  drive_url text not null,
  sort_order int not null default 1,
  duration_seconds int,
  created_at timestamptz not null default now()
);

create index if not exists idx_lesson_parts_lesson_id on public.lesson_parts(lesson_id);

alter table public.progress
  add column if not exists lesson_part_id uuid references public.lesson_parts(id) on delete cascade;

alter table public.progress drop constraint if exists progress_user_id_lesson_id_key;

create unique index if not exists progress_user_part_unique
  on public.progress (user_id, lesson_part_id)
  where lesson_part_id is not null;

create unique index if not exists progress_user_lesson_unique
  on public.progress (user_id, lesson_id)
  where lesson_part_id is null;

alter table public.lessons alter column source_ref drop not null;

alter table public.lessons drop constraint if exists lessons_source_type_check;
alter table public.lessons
  add constraint lessons_source_type_check
  check (source_type in ('zoom', 'google_meet', 'google_drive', 'manual_upload'));

alter table public.lesson_parts enable row level security;

create policy "lesson_parts_select_authenticated"
  on public.lesson_parts for select
  using (auth.uid() is not null);

create policy "lesson_parts_admin_insert"
  on public.lesson_parts for insert
  with check (public.get_user_role() = 'admin');

create policy "lesson_parts_admin_update"
  on public.lesson_parts for update
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "lesson_parts_admin_delete"
  on public.lesson_parts for delete
  using (public.get_user_role() = 'admin');
