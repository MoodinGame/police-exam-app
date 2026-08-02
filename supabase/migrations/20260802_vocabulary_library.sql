-- Vocabulary / flashcard library managed from the admin panel.
-- Card and deck IDs are text on purpose: the original learner-side cards use
-- stable human-readable IDs (for example `ox-ability`), and keeping them
-- preserves a learner's locally saved progress while content is moved to DB.

create table if not exists public.vocabulary_decks (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,90}$'),
  subject_id text references public.content_subjects(id) on update cascade on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 120),
  short_title text not null check (char_length(trim(short_title)) between 1 and 60),
  description text,
  note text,
  icon text not null default 'book',
  tone text not null default 'cyan',
  kind text not null default 'subject' check (kind in ('subject', 'english', 'police', 'custom')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocabulary_cards (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,120}$'),
  deck_id text not null references public.vocabulary_decks(id) on update cascade on delete cascade,
  subject_id text references public.content_subjects(id) on update cascade on delete set null,
  word text not null check (char_length(trim(word)) between 1 and 240),
  phonetic text,
  thai_reading text,
  part_of_speech text,
  level text,
  translation text not null default '',
  meaning text,
  example text,
  kind text not null default 'vocabulary' check (kind in ('vocabulary', 'subject', 'custom')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vocabulary_decks_visible_idx
  on public.vocabulary_decks(is_active, sort_order, title);
create index if not exists vocabulary_cards_deck_visible_idx
  on public.vocabulary_cards(deck_id, is_active, sort_order, word);
create index if not exists vocabulary_cards_subject_visible_idx
  on public.vocabulary_cards(subject_id, is_active, sort_order);

drop trigger if exists vocabulary_decks_touch_updated_at on public.vocabulary_decks;
create trigger vocabulary_decks_touch_updated_at before update on public.vocabulary_decks
for each row execute function public.touch_updated_at();

drop trigger if exists vocabulary_cards_touch_updated_at on public.vocabulary_cards;
create trigger vocabulary_cards_touch_updated_at before update on public.vocabulary_cards
for each row execute function public.touch_updated_at();

alter table public.vocabulary_decks enable row level security;
alter table public.vocabulary_cards enable row level security;

-- No browser RLS policies: application routes verify the current user before
-- writes and use the Supabase service key on the server.
