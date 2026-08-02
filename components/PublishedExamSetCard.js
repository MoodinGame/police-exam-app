import Link from 'next/link';
import { ArrowRight, Clock3, FileText, Lock, Sparkles } from 'lucide-react';
import { subjectStyles } from '@/lib/subjectStyles';

const difficulty = {
  easy: { label: 'ง่าย', className: 'bg-emerald-50 text-emerald-700' },
  medium: { label: 'ปานกลาง', className: 'bg-amber-50 text-amber-700' },
  hard: { label: 'ยาก', className: 'bg-red-50 text-red-700' },
};

export default function PublishedExamSetCard({ set, isLoggedIn = false }) {
  const style = subjectStyles[set.subjectId] || subjectStyles.aptitude;
  const level = difficulty[set.difficulty] || difficulty.medium;
  const href = set.canAccess ? `/exam/${set.subjectId}?set=${encodeURIComponent(set.slug)}` : isLoggedIn ? '/account' : '/login';

  return (
    <article className="app-card app-card-hover flex min-h-64 flex-col overflow-hidden">
      <div className={`h-1.5 ${style.color}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${style.chip}`}>{style.short}</span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${level.className}`}>{level.label}</span>
          {set.isFree && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><Sparkles size={12} /> ฟรี</span>}
        </div>
        <h3 className="mt-4 text-base font-bold leading-6 text-navy">{set.title}</h3>
        <p className="mt-1 text-xs text-graydark/55">{set.topicName || set.subjectName}</p>
        {set.description && <p className="mt-3 line-clamp-2 text-sm leading-5 text-graydark/65">{set.description}</p>}
        <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-5 text-xs text-graydark/55"><span className="inline-flex items-center gap-1"><FileText size={13} /> {set.questionCount} ข้อ</span>{set.durationMinutes && <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {set.durationMinutes} นาที</span>}</div>
        <Link href={href} className={`mt-4 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${set.canAccess ? 'bg-navy text-white hover:bg-navy/90' : 'border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>{set.canAccess ? <>ทำข้อสอบ <ArrowRight size={15} /></> : <><Lock size={14} /> {isLoggedIn ? 'ปลดล็อกสมาชิก' : 'เข้าสู่ระบบเพื่อทำข้อสอบ'}</>}</Link>
      </div>
    </article>
  );
}
