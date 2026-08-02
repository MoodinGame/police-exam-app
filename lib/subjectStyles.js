import { Cpu, FileText, Scale, Calculator, BookText, Globe, ShieldCheck, Users } from 'lucide-react';

// คลาสสีต้องเขียนเป็นสตริงเต็ม เพื่อให้ Tailwind สแกนเจอ (ห้ามต่อสตริงแบบ dynamic)
export const subjectStyles = {
  it: { short: 'คอมพิวเตอร์', color: 'bg-sky-600', chip: 'bg-sky-50 text-sky-700', icon: Cpu },
  correspondence: {
    short: 'สารบรรณ',
    color: 'bg-emerald-600',
    chip: 'bg-emerald-50 text-emerald-700',
    icon: FileText,
  },
  'police-correspondence': {
    short: 'สารบรรณตำรวจ',
    color: 'bg-indigo-700',
    chip: 'bg-indigo-50 text-indigo-700',
    icon: ShieldCheck,
  },
  law: { short: 'กฎหมาย', color: 'bg-navy', chip: 'bg-navy/10 text-navy', icon: Scale },
  aptitude: {
    short: 'ความรู้ความสามารถทั่วไป',
    color: 'bg-teal-600',
    chip: 'bg-teal-50 text-teal-700',
    icon: Calculator,
  },
  thai: { short: 'ภาษาไทย', color: 'bg-rose-600', chip: 'bg-rose-50 text-rose-700', icon: BookText },
  english: {
    short: 'ภาษาอังกฤษ',
    color: 'bg-purple-600',
    chip: 'bg-purple-50 text-purple-700',
    icon: Globe,
  },
  social: {
    short: 'สังคม',
    color: 'bg-orange-600',
    chip: 'bg-orange-50 text-orange-700',
    icon: Users,
  },
};
