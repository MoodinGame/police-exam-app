-- POLREADY content administration foundation
-- Run this in Supabase SQL Editor after supabase/schema.sql.
-- The application uses server-side routes with SUPABASE_SECRET_KEY; no browser
-- receives direct access to these tables.

create table if not exists public.content_subjects (
  id text primary key,
  name text not null,
  short_name text,
  description text,
  accent text not null default 'cyan',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_topics (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  subject_id text not null references public.content_subjects(id) on update cascade on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A question belongs to one bank. Mock questions must remain separate from
-- practice questions even when the two cover the same subject or topic.
create table if not exists public.question_bank_questions (
  id uuid primary key default gen_random_uuid(),
  bank text not null check (bank in ('practice', 'mock')),
  subject_id text not null references public.content_subjects(id) on update cascade on delete restrict,
  topic_id uuid references public.content_topics(id) on delete set null,
  stem text not null check (char_length(trim(stem)) > 0),
  choices jsonb not null default '[]'::jsonb check (
    case
      when jsonb_typeof(choices) = 'array' then jsonb_array_length(choices) between 2 and 6
      else false
    end
  ),
  correct_choice text not null,
  explanation text,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  source_reference text,
  is_active boolean not null default true,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The administrator controls a set simply by adding or removing questions.
-- No question count is stored here, so it cannot drift from the real content.
create table if not exists public.exam_sets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,90}$'),
  bank text not null check (bank in ('practice', 'mock')),
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text,
  subject_id text references public.content_subjects(id) on update cascade on delete set null,
  topic_id uuid references public.content_topics(id) on delete set null,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  is_free boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_set_questions (
  set_id uuid not null references public.exam_sets(id) on delete cascade,
  question_id uuid not null references public.question_bank_questions(id) on delete restrict,
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  primary key (set_id, question_id),
  unique (set_id, position)
);

create or replace function public.ensure_exam_set_uses_same_bank()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  set_bank text;
  question_bank text;
begin
  select bank into set_bank from public.exam_sets where id = new.set_id;
  select bank into question_bank from public.question_bank_questions where id = new.question_id;

  if set_bank is null or question_bank is null then
    raise exception 'Exam set or question was not found';
  end if;
  if set_bank <> question_bank then
    raise exception 'Questions from the % bank cannot be added to a % set', question_bank, set_bank;
  end if;
  return new;
end;
$$;

drop trigger if exists exam_set_questions_require_same_bank on public.exam_set_questions;
create trigger exam_set_questions_require_same_bank
before insert or update of set_id, question_id on public.exam_set_questions
for each row execute function public.ensure_exam_set_uses_same_bank();

-- Persists actual test results for history, analytics, weak-topic reports,
-- and leaderboards. Answers are intentionally stored as JSON so question
-- choices can evolve without a migration for each format change.
create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  set_id uuid references public.exam_sets(id) on delete set null,
  bank text not null check (bank in ('practice', 'mock', 'random')),
  subject_id text references public.content_subjects(id) on update cascade on delete set null,
  topic_id uuid references public.content_topics(id) on delete set null,
  title text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  total_questions integer not null default 0 check (total_questions >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (correct_answers <= total_questions)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  summary text not null check (char_length(trim(summary)) between 1 and 360),
  body text,
  tone text not null default 'info' check (tone in ('info', 'success', 'warning', 'important')),
  audience text not null default 'all' check (audience in ('all', 'free', 'member')),
  show_on_login boolean not null default false,
  is_published boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

-- Personal study plans are private to the signed-in learner and are exposed
-- only through server-side routes.
create table if not exists public.calendar_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  plan_date date not null,
  plan_type text not null default 'study' check (plan_type in ('study', 'practice')),
  subject_id text references public.content_subjects(id) on update cascade on delete set null,
  duration_minutes integer not null default 30 check (duration_minutes between 0 and 1440),
  time_of_day time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.app_users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists content_topics_subject_sort_idx
  on public.content_topics(subject_id, sort_order, name);
create index if not exists question_bank_questions_catalog_idx
  on public.question_bank_questions(bank, subject_id, topic_id, is_active, created_at desc);
create index if not exists exam_sets_catalog_idx
  on public.exam_sets(bank, status, subject_id, topic_id, created_at desc);
create index if not exists exam_set_questions_set_position_idx
  on public.exam_set_questions(set_id, position);
create index if not exists exam_attempts_user_completed_idx
  on public.exam_attempts(user_id, completed_at desc);
create index if not exists announcements_visible_idx
  on public.announcements(is_published, show_on_login, starts_at, ends_at);
create index if not exists calendar_plans_user_date_idx
  on public.calendar_plans(user_id, plan_date, time_of_day);
create index if not exists admin_audit_logs_admin_created_idx
  on public.admin_audit_logs(admin_id, created_at desc);

drop trigger if exists content_subjects_touch_updated_at on public.content_subjects;
create trigger content_subjects_touch_updated_at before update on public.content_subjects
for each row execute function public.touch_updated_at();

drop trigger if exists content_topics_touch_updated_at on public.content_topics;
create trigger content_topics_touch_updated_at before update on public.content_topics
for each row execute function public.touch_updated_at();

drop trigger if exists question_bank_questions_touch_updated_at on public.question_bank_questions;
create trigger question_bank_questions_touch_updated_at before update on public.question_bank_questions
for each row execute function public.touch_updated_at();

drop trigger if exists exam_sets_touch_updated_at on public.exam_sets;
create trigger exam_sets_touch_updated_at before update on public.exam_sets
for each row execute function public.touch_updated_at();

drop trigger if exists exam_attempts_touch_updated_at on public.exam_attempts;
create trigger exam_attempts_touch_updated_at before update on public.exam_attempts
for each row execute function public.touch_updated_at();

drop trigger if exists announcements_touch_updated_at on public.announcements;
create trigger announcements_touch_updated_at before update on public.announcements
for each row execute function public.touch_updated_at();

drop trigger if exists calendar_plans_touch_updated_at on public.calendar_plans;
create trigger calendar_plans_touch_updated_at before update on public.calendar_plans
for each row execute function public.touch_updated_at();

insert into public.content_subjects (id, name, short_name, accent, sort_order)
values
  ('law', 'กฎหมายที่ประชาชนควรรู้', 'กฎหมาย', 'navy', 1),
  ('english', 'ภาษาต่างประเทศ (ภาษาอังกฤษ)', 'อังกฤษ', 'violet', 2),
  ('correspondence', 'สารบรรณ', 'สารบรรณ', 'emerald', 3),
  ('police-correspondence', 'สารบรรณตำรวจ', 'สารบรรณตำรวจ', 'indigo', 4),
  ('it', 'คอมพิวเตอร์', 'คอมพิวเตอร์', 'sky', 5),
  ('social', 'สังคม', 'สังคม', 'orange', 6),
  ('aptitude', 'ความรู้ความสามารถทั่วไป', 'คณิตศาสตร์', 'cyan', 7),
  ('thai', 'ภาษาไทย', 'ภาษาไทย', 'rose', 8)
on conflict (id) do nothing;

alter table public.content_subjects enable row level security;
alter table public.content_topics enable row level security;
alter table public.question_bank_questions enable row level security;
alter table public.exam_sets enable row level security;
alter table public.exam_set_questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.announcements enable row level security;
alter table public.calendar_plans enable row level security;
alter table public.admin_audit_logs enable row level security;

-- No public RLS policies are created: every read or write must go through a
-- validated Next.js API route. The Supabase service role bypasses RLS.
