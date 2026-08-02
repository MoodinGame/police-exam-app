-- Topic hierarchy for the practice catalogue.
-- A subject has many topic groups (for example: Law > Criminal law),
-- and a group has many existing content_topics (for example: Application of criminal law).

create table if not exists public.content_topic_groups (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.content_subjects(id) on update cascade on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, name)
);

alter table public.content_topics
  add column if not exists group_id uuid references public.content_topic_groups(id) on delete set null;

create index if not exists content_topic_groups_subject_sort_idx
  on public.content_topic_groups(subject_id, sort_order, name);

create index if not exists content_topics_group_sort_idx
  on public.content_topics(group_id, sort_order, name);

drop trigger if exists content_topic_groups_touch_updated_at on public.content_topic_groups;
create trigger content_topic_groups_touch_updated_at
before update on public.content_topic_groups
for each row execute function public.touch_updated_at();

alter table public.content_topic_groups enable row level security;

