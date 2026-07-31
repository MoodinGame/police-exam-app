'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { subjects } from '@/lib/subjects';
import { topicsBySubject } from '@/lib/topics';
import { subjectStyles } from '@/lib/subjectStyles';
import { getTopicProgress } from '@/lib/progress';

function TopicRow({ topic }) {
  const [attempt, setAttempt] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setAttempt(getTopicProgress(topic.id));
    setMounted(true);
  }, [topic.id]);

  if (!topic.available) {
    return (
      <div className="flex items-center justify-between gap-4 border border-graylight/20 rounded-2xl p-5 opacity-60">
        <div>
          <p className="font-medium text-graydark">{topic.name}</p>
          <p className="text-sm text-graydark/50 mt-0.5">{topic.description}</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-graydark/40 shrink-0">
          <Lock size={13} />
          เร็วๆ นี้
        </span>
      </div>
    );
  }

  const done = mounted && attempt;

  return (
    <Link
      href={`/exam/${topic.subjectId}?topic=${topic.id}`}
      className="flex items-center justify-between gap-4 border border-graylight/30 rounded-2xl p-5 hover:shadow-md hover:border-accent-cyan/50 transition-all"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-graydark">{topic.name}</p>
          {done && <CheckCircle2 size={15} className="text-accent-green shrink-0" />}
        </div>
        <p className="text-sm text-graydark/50 mt-0.5">{topic.description}</p>
        {done && (
          <p className="text-xs text-accent-green mt-1.5">
            ทำแล้ว {attempt.score}/{attempt.total} ข้อ
          </p>
        )}
      </div>
      <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-navy/5 text-navy shrink-0">
        {topic.questionCount} ข้อ
      </span>
    </Link>
  );
}

export default function SubjectTopicsPage() {
  const { subject: subjectId } = useParams();
  const subject = subjects.find((s) => s.id === subjectId);
  const subjectTopics = topicsBySubject(subjectId);
  const style = subjectStyles[subjectId];

  if (!subject) {
    return (
      <div>
        <p className="text-graydark mb-4">ไม่พบวิชานี้</p>
        <Link href="/practice" className="text-accent-cyan underline">
          กลับไปเลือกวิชา
        </Link>
      </div>
    );
  }

  const Icon = style.icon;

  return (
    <div>
      <Link
        href="/practice"
        className="inline-flex items-center gap-1.5 text-sm text-graydark/60 hover:text-navy mb-6"
      >
        <ArrowLeft size={16} />
        กลับไปเลือกวิชา
      </Link>

      <div className={`rounded-2xl p-6 text-white mb-8 ${style.color}`}>
        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
          <Icon size={20} />
        </div>
        <h1 className="text-xl font-semibold mb-1">{subject.name}</h1>
        <p className="text-sm text-white/75">{subject.description}</p>
      </div>

      <p className="text-sm text-graydark/60 mb-4">
        เลือกหัวข้อย่อยที่ต้องการฝึก — ทำแล้วจะมีเครื่องหมาย ✓ กำกับไว้ให้เห็นชัดว่าอ่านอะไรไปบ้างแล้ว
      </p>

      <div className="space-y-3">
        {subjectTopics.map((t) => (
          <TopicRow key={t.id} topic={t} />
        ))}
      </div>
    </div>
  );
}
