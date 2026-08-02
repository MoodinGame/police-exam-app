-- Mock Exam ใช้คลังแบบฝึกหัดรายวิชา (bank = 'practice') เป็นแหล่งข้อสอบเดียว
-- เก็บ exam_sets ของ Mock ไว้ เพื่อกำหนดสายงาน สิทธิ์ และสถานะเผยแพร่
-- แต่ลบคำถาม Mock เก่าและการผูกคำถามแบบเดิมออกทั้งหมด

begin;

-- ลบความสัมพันธ์คำถามของทุกชุด Mock ก่อน เพื่อไม่ให้ Mock Exam ใช้ชุดคำถามคงที่อีกต่อไป
delete from public.exam_set_questions as links
using public.exam_sets as sets
where links.set_id = sets.id
  and sets.bank = 'mock';

-- กันข้อมูลผิดปกติ: ลบความสัมพันธ์ที่อาจยังอ้างถึงคำถาม bank = mock
delete from public.exam_set_questions as links
using public.question_bank_questions as questions
where links.question_id = questions.id
  and questions.bank = 'mock';

-- ลบเฉพาะคำถาม Mock เก่า ไม่แตะคำถามแบบฝึกหัด (bank = 'practice')
delete from public.question_bank_questions
where bank = 'mock';

-- ป้องกันการสร้างคลังคำถาม Mock แยกผ่าน SQL โดยไม่ตั้งใจในอนาคต
create or replace function public.prevent_mock_question_bank()
returns trigger
language plpgsql
as $$
begin
  if new.bank = 'mock' then
    raise exception 'Mock Exam must use practice questions; insert questions with bank = practice';
  end if;
  return new;
end;
$$;

drop trigger if exists question_bank_questions_prevent_mock on public.question_bank_questions;
create trigger question_bank_questions_prevent_mock
before insert or update of bank on public.question_bank_questions
for each row execute function public.prevent_mock_question_bank();

commit;
