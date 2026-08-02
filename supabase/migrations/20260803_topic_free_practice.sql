-- ให้แอดมินเลือกได้เองว่าหมวดย่อยไหนทำแบบฝึกหัดฟรีได้โดยไม่ต้องสมัครสมาชิก
-- (เดิม hardcode รายชื่อหัวข้อไว้ใน lib/entitlements.js — ย้ายมาเป็นสิทธิ์ต่อหัวข้อในหลังบ้านแทน)
alter table public.content_topics add column if not exists is_free_practice boolean not null default false;
