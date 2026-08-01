'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Search, Check, Lock, X } from 'lucide-react';
import { subjects } from '@/lib/subjects';
import { topicsBySubject } from '@/lib/topics';
import { subjectStyles } from '@/lib/subjectStyles';
import { getTopicProgress } from '@/lib/progress';
import PracticeFilter, { EMPTY_FILTER } from '@/components/PracticeFilter';

const PASS_PCT = 60; // เกณฑ์ผ่านของแบบฝึกหัดรายชุด

function SetCard({ topic, subject, attempt }) {
  const style = subjectStyles[topic.subjectId];
  const pct = attempt ? Math.round((attempt.score / attempt.total) * 100) : null;
  const passed = pct !== null && pct >= PASS_PCT;

  return (
    <div className="border border-graylight/30 rounded-2xl overflow-hidden flex flex-col hover:shadow-md hover:border-accent-cyan/50 transition-all">
      {attempt ? (
        <div
          className={`flex items-center justify-between gap-2 px-4 py-2 text-xs font-medium text-white ${
            passed ? 'bg-emerald-600' : 'bg-orange-500'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Check size={13} />
            เคยทำแล้ว
          </span>
          <span>
            {attempt.score}/{attempt.total} · {passed ? 'ผ่าน' : 'ไม่ผ่าน'}
          </span>
        </div>
      ) : (
        <div className="h-[33px] bg-graylight/10 border-b border-graylight/20" />
      )}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.chip}`}>
            {style.short}
          </span>
          {!topic.available && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-graylight/20 text-graydark/50">
              <Lock size={9} />
              เร็วๆ นี้
            </span>
          )}
        </div>

        <h3 className="font-medium text-graydark leading-snug mb-1">{topic.name}</h3>
        <p className="text-xs text-graydark/50 mb-2 leading-relaxed">{topic.description}</p>
        <p className="text-xs text-graydark/40 mb-4">{topic.questionCount} ข้อ</p>

        <div className="mt-auto">
          {topic.available ? (
            <Link
              href={`/exam/${topic.subjectId}?topic=${topic.id}`}
              className="block text-center text-sm bg-navy text-white rounded-xl py-2.5 font-medium hover:opacity-90"
            >
              {attempt ? 'ทำอีกครั้ง' : 'ทำข้อสอบ'}
            </Link>
          ) : (
            <span className="block text-center text-sm bg-graylight/20 text-graydark/40 rounded-xl py-2.5 font-medium cursor-not-allowed">
              ยังไม่เปิดให้ทำ
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubjectTopicsPage() {
  const { subject: subjectId } = useParams();
  const subject = subjects.find((s) => s.id === subjectId);
  const subjectTopics = useMemo(() => topicsBySubject(subjectId), [subjectId]);
  const style = subjectStyles[subjectId];

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [progress, setProgress] = useState(null);

  // อ่าน localStorage หลัง mount เท่านั้น เพื่อไม่ให้ markup ตอน SSR กับตอน hydrate ต่างกัน
  useEffect(() => {
    const map = {};
    for (const t of subjectTopics) map[t.id] = getTopicProgress(t.id);
    setProgress(map);
  }, [subjectTopics]);

  // เปลี่ยนวิชา = ล้างตัวกรองเดิม ไม่งั้นจะเหลือหมวดย่อยของวิชาก่อนหน้าค้างอยู่
  useEffect(() => {
    setFilter(EMPTY_FILTER);
    setQuery('');
  }, [subjectId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subjectTopics.filter((t) => {
      if (filter.topics.length > 0 && !filter.topics.includes(t.id)) return false;

      if (progress && filter.status !== 'all') {
        const done = Boolean(progress[t.id]);
        if (filter.status === 'done' && !done) return false;
        if (filter.status === 'undone' && done) return false;
      }

      if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [subjectTopics, query, filter, progress]);

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
  const attemptedCount = progress ? subjectTopics.filter((t) => progress[t.id]).length : 0;
  const overallPct = subjectTopics.length
    ? Math.round((attemptedCount / subjectTopics.length) * 100)
    : 0;

  return (
    <div>
      <Link
        href="/practice"
        className="inline-flex items-center gap-1.5 text-sm text-graydark/60 hover:text-navy mb-6"
      >
        <ArrowLeft size={16} />
        กลับไปเลือกวิชา
      </Link>

      <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
        <div className={`rounded-2xl p-6 text-white flex-1 min-w-[280px] ${style.color}`}>
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
            <Icon size={20} />
          </div>
          <h1 className="text-xl font-semibold mb-1">{subject.name}</h1>
          <p className="text-sm text-white/75">{subject.description}</p>
        </div>

        <div className="border border-graylight/30 rounded-2xl p-5 min-w-[240px]">
          <p className="text-xs text-graydark/50 mb-2">ความก้าวหน้าวิชานี้</p>
          <div className="flex items-center gap-3 mb-3">
            <p className="text-3xl font-bold text-navy">{progress ? `${overallPct}%` : '—'}</p>
            <Link
              href="/profile"
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20"
            >
              ดูรายงานผล
            </Link>
          </div>
          <div className="h-1.5 bg-graylight/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-cyan transition-all"
              style={{ width: `${progress ? overallPct : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-graydark/40 mt-2">
            ทำแล้ว {attemptedCount} จาก {subjectTopics.length} ชุด
          </p>
        </div>
      </div>

      <div className="flex items-stretch gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-graydark/40 pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`ค้นหาชุดข้อสอบในวิชา${subject.name}...`}
            className="w-full h-full border border-graylight/30 rounded-xl pl-11 pr-10 py-3 text-sm text-graydark placeholder:text-graydark/40 focus:outline-none focus:border-accent-cyan"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="ล้างคำค้นหา"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-graydark/40 hover:text-navy"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <PracticeFilter value={filter} onChange={setFilter} scopeSubjectId={subjectId} />
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-semibold text-navy">
          ชุดข้อสอบ{' '}
          <span className="text-sm font-normal text-graydark/40">({filtered.length} ชุด)</span>
        </h2>
        {(filter.topics.length > 0 || filter.status !== 'all' || query.trim() !== '') && (
          <button
            onClick={() => {
              setFilter(EMPTY_FILTER);
              setQuery('');
            }}
            className="flex items-center gap-1 text-xs text-graydark/50 hover:text-navy"
          >
            <X size={13} />
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-graylight/40 rounded-2xl p-12 text-center">
          <p className="text-graydark/50 mb-1">ไม่พบชุดข้อสอบที่ตรงกับการค้นหา</p>
          <p className="text-sm text-graydark/40">ลองเปลี่ยนคำค้นหาดูอีกครั้ง</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <SetCard
              key={t.id}
              topic={t}
              subject={subject}
              attempt={progress?.[t.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
