-- สายงาน (exam track) สำหรับ Mock Exam — แต่ละสายมีโครงสร้างจำนวนข้อสอบต่อวิชาของตัวเอง
-- เพื่อให้ประกอบข้อสอบเสมือนจริงได้ตรงสัดส่วนจริงของแต่ละสายงาน (150 ข้อ / 180 นาที / ผ่านเกณฑ์ 60%)

create table if not exists public.exam_tracks (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  name text not null check (char_length(trim(name)) between 1 and 160),
  short_name text,
  description text,
  total_questions integer not null default 150 check (total_questions > 0),
  duration_minutes integer not null default 180 check (duration_minutes > 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- จำนวนข้อที่ต้องออกต่อวิชาในแต่ละสายงาน ผลรวมต่อ track ควรเท่ากับ total_questions ของ track นั้น
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
  on public.question_bank_questions(track_id, subject_id);
create index if not exists exam_sets_track_idx
  on public.exam_sets(track_id);

drop trigger if exists exam_tracks_touch_updated_at on public.exam_tracks;
create trigger exam_tracks_touch_updated_at before update on public.exam_tracks
for each row execute function public.touch_updated_at();

insert into public.exam_tracks (id, name, short_name, description, total_questions, duration_minutes, sort_order, is_active) values
  ('general-affairs', 'สายอำนวยการ', 'อำนวยการ', 'สายงานอำนวยการ ประจำปี 2569', 150, 180, 1, true),
  ('patrol', 'สายป้องกันปราบปราม', 'ปราบปราม', 'สายงานป้องกันปราบปราม ประจำปี 2569', 150, 180, 2, true),
  ('forensic', 'สายพิสูจน์หลักฐาน', 'พฐ.', 'สายงานพิสูจน์หลักฐาน — ยังไม่กำหนดโครงสร้างข้อสอบ', 150, 180, 3, false)
on conflict (id) do nothing;

insert into public.exam_track_blueprints (track_id, subject_id, question_count) values
  ('general-affairs', 'it', 40),
  ('general-affairs', 'correspondence', 30),
  ('general-affairs', 'law', 25),
  ('general-affairs', 'aptitude', 20),
  ('general-affairs', 'thai', 20),
  ('general-affairs', 'english', 15),
  ('patrol', 'aptitude', 30),
  ('patrol', 'thai', 25),
  ('patrol', 'english', 30),
  ('patrol', 'it', 25),
  ('patrol', 'law', 20),
  ('patrol', 'social', 20)
on conflict (track_id, subject_id) do nothing;

alter table public.exam_tracks enable row level security;
alter table public.exam_track_blueprints enable row level security;
