-- ─── Sprints ─────────────────────────────────────────────────────────────────
create table if not exists public.sprints (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  department   text not null default 'engineering',
  name         text not null,
  start_date   date,
  end_date     date,
  is_active    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.sprints enable row level security;
create policy "sprints_all" on public.sprints using (true) with check (true);

-- ─── Tasks: add sprint_id and labels ─────────────────────────────────────────
alter table public.tasks
  add column if not exists sprint_id uuid references public.sprints(id) on delete set null,
  add column if not exists labels    text[] not null default '{}';

-- ─── Task comments / activity log ────────────────────────────────────────────
create table if not exists public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  author_id   uuid references auth.users(id),
  author_name text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

alter table public.task_comments enable row level security;
create policy "task_comments_select" on public.task_comments for select using (true);
create policy "task_comments_insert" on public.task_comments for insert with check (true);
create policy "task_comments_delete" on public.task_comments for delete using (auth.uid() = author_id);
