-- ติดตามผู้เข้าชมที่ยังออนไลน์อยู่ตอนนี้ สำหรับป้าย "กำลังใช้งานอยู่" บนหน้าแรก
-- เข้าถึงผ่าน service role (server-side) เท่านั้น ไม่เปิด policy ให้ anon/authenticated อ่านตรง ๆ

create table if not exists public.site_presence (
  client_id text primary key check (char_length(client_id) between 1 and 100),
  last_seen_at timestamptz not null default now()
);

create index if not exists site_presence_last_seen_idx on public.site_presence (last_seen_at);

alter table public.site_presence enable row level security;
