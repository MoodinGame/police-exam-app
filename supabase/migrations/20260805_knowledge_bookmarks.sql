-- Per-user bookmarks for the Knowledge Library.

create table if not exists public.knowledge_bookmarks (
  user_id uuid not null references public.app_users(id) on delete cascade,
  topic_id uuid not null references public.content_topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create index if not exists knowledge_bookmarks_user_created_idx
  on public.knowledge_bookmarks(user_id, created_at desc);

alter table public.knowledge_bookmarks enable row level security;

-- Bookmarks are exposed only through authenticated Next.js routes using the
-- service key, mirroring the rest of the learner data model.
