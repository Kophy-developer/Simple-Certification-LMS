create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'student')) default 'student',
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  status text not null check (status in ('pending', 'accepted', 'expired', 'revoked')) default 'pending',
  expires_at timestamptz not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  topic_id uuid references public.topics(id) on delete restrict not null,
  session_date date not null,
  source_type text not null check (source_type in ('zoom', 'google_meet', 'manual_upload')),
  source_ref text not null,
  video_source_url text,
  passcode text,
  duration_seconds int,
  sort_order int not null default 0,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz not null default now()
);

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  watched_seconds int not null default 0,
  completed boolean not null default false,
  last_watched_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index idx_lessons_topic_id on public.lessons(topic_id);
create index idx_lessons_session_date on public.lessons(session_date desc);
create index idx_progress_user_id on public.progress(user_id);
create index idx_progress_lesson_id on public.progress(lesson_id);
create index idx_invites_token on public.invites(token);
create index idx_invites_email on public.invites(email);

insert into public.topics (name, sort_order) values
  ('Ethics', 1),
  ('Quant Methods', 2),
  ('Economics', 3),
  ('Financial Statement Analysis', 4),
  ('Corporate Issuers', 5),
  ('Equity', 6),
  ('Fixed Income', 7),
  ('Derivatives', 8),
  ('Alternative Investments', 9),
  ('Portfolio Management', 10);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, invited_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_app_meta_data->>'role', 'student'),
    (new.raw_user_meta_data->>'invited_by')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.get_user_role()
returns text
language sql
stable
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'student'
  );
$$;

alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.topics enable row level security;
alter table public.lessons enable row level security;
alter table public.progress enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.get_user_role() = 'admin');

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "invites_admin_all"
  on public.invites for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "invites_select_by_token"
  on public.invites for select
  using (status = 'pending' and expires_at > now());

create policy "topics_select_authenticated"
  on public.topics for select
  using (auth.uid() is not null);

create policy "topics_admin_write"
  on public.topics for insert
  with check (public.get_user_role() = 'admin');

create policy "topics_admin_update"
  on public.topics for update
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "topics_admin_delete"
  on public.topics for delete
  using (public.get_user_role() = 'admin');

create policy "lessons_select_authenticated"
  on public.lessons for select
  using (auth.uid() is not null);

create policy "lessons_admin_insert"
  on public.lessons for insert
  with check (public.get_user_role() = 'admin');

create policy "lessons_admin_update"
  on public.lessons for update
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "lessons_admin_delete"
  on public.lessons for delete
  using (public.get_user_role() = 'admin');

create policy "progress_select_own_or_admin"
  on public.progress for select
  using (user_id = auth.uid() or public.get_user_role() = 'admin');

create policy "progress_insert_own"
  on public.progress for insert
  with check (user_id = auth.uid());

create policy "progress_update_own"
  on public.progress for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "progress_delete_own"
  on public.progress for delete
  using (user_id = auth.uid());
