'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { subjects, totalQuestions } from '@/lib/subjects';
import { topicsBySubject } from '@/lib/topics';
import { subjectStyles } from '@/lib/subjectStyles';
import { getSubjectProgress } from '@/lib/progress';

function SubjectCard({ subject }) {
  const style = subjectStyles[subject.id];
  const Icon = style.icon;
  const subjectTopics = topicsBySubject(subject.id);

  // อ่าน localStorage หลัง mount เท่านั้น เพื่อไม่ให้ SSR/CSR render ไม่ตรงกัน
  const [progress, setProgress] = useState(null);
  useEffect(() => {
    setProgress(getSubjectProgress(subject.id, subjectTopics));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressPct = progress?.progressPct ?? 0;
  const accuracyPct = progress?.accuracyPct ?? null;

  return (
    <Link
      href={`/practice/${subject.id}`}
      className={`rounded-2xl p-6 text-white flex flex-col ${style.color} hover:opacity-95 transition-opacity`}
    >
      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
        <Icon size={20} />
      </div>
      <h3 className="text-lg font-semibold mb-1">{subject.name}</h3>
      <p className="text-sm text-white/75 mb-4 leading-relaxed">{subject.description}</p>
      <p className="text-xs text-white/70 mb-3">
        {subjectTopics.length} หัวข้อ · {subject.count} ข้อ
      </p>

      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs text-white/70 mb-1">
          <span>ความก้าวหน้า</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-1">
          <div className="h-full bg-white transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-xs text-white/70 mb-4 h-4">
          {accuracyPct !== null ? `ตอบถูก ${accuracyPct}%` : ' '}
        </p>

        <span className="flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors rounded-xl py-2.5 text-sm font-medium">
          {progressPct > 0 ? 'ทำต่อ' : 'เริ่มทำข้อสอบ'}
          <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

export default function PracticePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy mb-1">แบบฝึกหัดรายวิชา</h1>
      <p className="text-graydark/60 mb-8">สายอำนวยการ 2569 · รวม {totalQuestions} ข้อ</p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <SubjectCard key={s.id} subject={s} />
        ))}
      </div>
    </div>
  );
}
