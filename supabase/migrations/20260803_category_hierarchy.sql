-- โครงสร้างหมวดวิชาแบบลำดับชั้นไม่จำกัดระดับ
--   content_subjects            = หมวดวิชาหลัก (เช่น กฎหมายที่ประชาชนควรรู้)
--   content_topics.parent_id=null = หัวข้อหลัก      (เช่น กฎหมายอาญา)
--   content_topics.parent_id=X    = หัวข้อย่อย       (เช่น การบังคับใช้กฎหมายอาญา) ซ้อนได้หลายชั้น
--
-- แทนที่แนวคิด content_topic_groups เดิมที่จำกัดแค่ 2 ชั้น (ตารางนั้นไม่เคยถูกสร้างจริงบน Supabase)

alter table public.content_topics
  add column if not exists parent_id uuid references public.content_topics(id) on delete cascade;

-- ให้แอดมินเลือกได้ว่าหัวข้อไหนเปิดให้ทำฟรีโดยไม่ต้องสมัครสมาชิก
alter table public.content_topics
  add column if not exists is_free_practice boolean not null default false;

create index if not exists content_topics_parent_sort_idx
  on public.content_topics(parent_id, sort_order, name);

create index if not exists content_topics_subject_parent_idx
  on public.content_topics(subject_id, parent_id, sort_order);
