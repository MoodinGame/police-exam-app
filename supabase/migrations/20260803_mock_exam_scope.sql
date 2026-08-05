-- ขอบเขต Mock Exam สำหรับการสอบนักเรียนนายสิบตำรวจ
-- อำนวยการ: ผ่าน 135/150 | ปราบปราม: ผ่าน 110/150

-- Make this migration safe to run on a database that has not run the
-- earlier exam-track migration yet.
create table if not exists public.exam_tracks (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  name text not null check (char_length(trim(name)) between 1 and 160),
  short_name text,
  description text,
  total_questions integer not null default 150 check (total_questions > 0),
  duration_minutes integer not null default 180 check (duration_minutes > 0),
  pass_score integer,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_track_blueprints (
  track_id text not null references public.exam_tracks(id) on delete cascade,
  subject_id text not null references public.content_subjects(id) on update cascade on delete restrict,
  question_count integer not null check (question_count > 0),
  primary key (track_id, subject_id)
);

alter table public.question_bank_questions
  add column if not exists track_id text references public.exam_tracks(id) on update cascade on delete set null;

alter table public.exam_sets
  add column if not exists track_id text references public.exam_tracks(id) on update cascade on delete set null;

create index if not exists question_bank_questions_track_idx
  on public.question_bank_questions (track_id, subject_id);

create index if not exists exam_sets_track_idx
  on public.exam_sets (track_id);

alter table public.exam_tracks
  add column if not exists pass_score integer;

insert into public.exam_tracks (
  id, name, short_name, description, total_questions, duration_minutes, pass_score, sort_order, is_active
) values
  ('general-affairs', 'สายอำนวยการ', 'อำนวยการ', 'Mock Exam สายอำนวยการ: 150 ข้อ 180 นาที ผ่าน 135 คะแนน', 150, 180, 135, 1, true),
  ('patrol', 'สายปราบปราม', 'ปราบปราม', 'Mock Exam สายปราบปราม: 150 ข้อ 180 นาที ผ่าน 110 คะแนน', 150, 180, 110, 2, true)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  total_questions = excluded.total_questions,
  duration_minutes = excluded.duration_minutes,
  pass_score = excluded.pass_score,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- ไม่ลบข้อมูลเดิมของสายอื่น แต่ซ่อนจากการสร้าง Mock Exam ใหม่
update public.exam_tracks
set is_active = false
where id not in ('general-affairs', 'patrol');

delete from public.exam_track_blueprints
where track_id in ('general-affairs', 'patrol');

insert into public.exam_track_blueprints (track_id, subject_id, question_count) values
  ('general-affairs', 'aptitude', 20),
  ('general-affairs', 'thai', 20),
  ('general-affairs', 'it', 40),
  ('general-affairs', 'correspondence', 30),
  ('general-affairs', 'law', 25),
  ('general-affairs', 'english', 15),
  ('patrol', 'aptitude', 30),
  ('patrol', 'thai', 25),
  ('patrol', 'it', 25),
  ('patrol', 'english', 30),
  ('patrol', 'law', 20),
  ('patrol', 'social', 20);
