import {
  BookText,
  Calculator,
  Cpu,
  FileSignature,
  Gavel,
  Landmark,
  Languages,
  PenTool,
  ShieldCheck,
} from 'lucide-react';

// คลาสสีต้องเขียนเป็นสตริงเต็ม เพื่อให้ Tailwind สแกนเจอ (ห้ามต่อสตริงแบบ dynamic)
// ค่าสีจริงอยู่ที่ tailwind.config.js › colors.subject — ปรับที่นั่นแล้วเปลี่ยนทั้งระบบ
export const subjectStyles = {
  law: {
    short: 'กฎหมาย',
    color: 'bg-subject-law',
    chip: 'bg-subject-law/10 text-subject-law',
    icon: Gavel,
  },
  thai: {
    short: 'ภาษาไทย',
    color: 'bg-subject-thai',
    chip: 'bg-subject-thai/10 text-subject-thai',
    icon: PenTool,
  },
  aptitude: {
    short: 'ความรู้ความสามารถทั่วไป',
    color: 'bg-subject-aptitude',
    chip: 'bg-subject-aptitude/10 text-subject-aptitude',
    icon: Calculator,
  },
  it: {
    short: 'คอมพิวเตอร์',
    color: 'bg-subject-it',
    chip: 'bg-subject-it/10 text-subject-it',
    icon: Cpu,
  },
  english: {
    short: 'ภาษาอังกฤษ',
    color: 'bg-subject-english',
    chip: 'bg-subject-english/10 text-subject-english',
    icon: Languages,
  },
  social: {
    short: 'สังคม',
    color: 'bg-subject-social',
    chip: 'bg-subject-social/10 text-subject-social',
    icon: Landmark,
  },
  correspondence: {
    short: 'สารบรรณ',
    color: 'bg-subject-correspondence',
    chip: 'bg-subject-correspondence/10 text-subject-correspondence',
    icon: FileSignature,
  },
  'police-correspondence': {
    short: 'สารบรรณตำรวจ',
    color: 'bg-subject-police',
    chip: 'bg-subject-police/10 text-subject-police',
    icon: ShieldCheck,
  },
};

// สไตล์กลางสำหรับวิชาที่แอดมินเพิ่งสร้าง ซึ่งยังไม่มีสี/ไอคอนประจำวิชาในไฟล์นี้
const DEFAULT_SUBJECT_STYLE = {
  short: '',
  color: 'bg-navy',
  chip: 'bg-navy/10 text-navy',
  icon: BookText,
};

/**
 * ดึงสไตล์ของวิชาแบบไม่พัง — รายชื่อวิชามาจากฐานข้อมูลแล้ว จึงมีวิชาที่ไม่มีคีย์ในนี้ได้เสมอ
 * @param {string} subjectId
 * @param {string} [fallbackShort] ชื่อย่อจากฐานข้อมูล ใช้เมื่อยังไม่ได้กำหนดสไตล์ไว้
 */
export function getSubjectStyle(subjectId, fallbackShort = '') {
  const style = subjectStyles[subjectId];
  if (style) return style;
  return { ...DEFAULT_SUBJECT_STYLE, short: fallbackShort || subjectId };
}
