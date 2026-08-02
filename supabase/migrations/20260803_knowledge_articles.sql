-- Knowledge Library CMS
-- Run this after 20260801_content_admin.sql in the Supabase SQL Editor.
-- Articles are deliberately separate from question-bank content: a topic can
-- have questions, a long-form lesson, or both without one replacing the other.

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.content_subjects(id) on update cascade on delete restrict,
  topic_id uuid references public.content_topics(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  summary text not null default '',
  body text not null default '',
  key_points jsonb not null default '[]'::jsonb check (jsonb_typeof(key_points) = 'array'),
  pitfalls text not null default '',
  exam_guide text not null default '',
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One canonical article per topic keeps the learner experience unambiguous.
-- Topic-less articles are allowed for subject-wide introductions.
create unique index if not exists knowledge_articles_one_article_per_topic_idx
  on public.knowledge_articles(topic_id)
  where topic_id is not null;

create index if not exists knowledge_articles_catalog_idx
  on public.knowledge_articles(subject_id, is_published, sort_order, updated_at desc);

alter table public.knowledge_articles enable row level security;

-- This project serves data only through authenticated Next.js routes using
-- the service key, so no browser-facing RLS policy is created here.
