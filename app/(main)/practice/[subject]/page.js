'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Search, Check, Lock, Sparkles, X } from 'lucide-react';
import { subjects } from '@/lib/subjects';
import { topicsBySubject } from '@/lib/topics';
import { subjectStyles } from '@/lib/subjectStyles';
import { getTopicProgress } from '@/lib/progress';
import { isFreePracticeTopic } from '@/lib/entitlements';
import { useMembershipStatus } from '@/lib/useMembershipStatus';
import { useExamCatalog } from '@/lib/useExamCatalog';
import PracticeFilter, { EMPTY_FILTER } from '@/components/PracticeFilter';

const PASS_PCT = 60; // เกณฑ์ผ่านของแบบฝึกหัดรายชุด
// ต้องเป็น reference คงที่ — ถ้าใช้ `{}` ตรง ๆ ตรง fallback จะได้ object ใหม่ทุก render
// ทำให้ subjectTopics (useMemo ด้านล่าง) คำนวณใหม่ทุกครั้ง จนเข้าลูป render ไม่รู้จบ
const EMPTY_TOPIC_COUNTS = {};

function SetCard({ topic, attempt, isMember, isLoggedIn, accessLoading, databaseQuestionCount }) {
  const style = subjectStyles[topic.subjectId];
  const pct = attempt ? Math.round((attempt.score / attempt.total) * 100) : null;
  const passed = pct !== null && pct >= PASS_PCT;
  const isFreeTrial = isFreePracticeTopic(topic.id);
  const hasDatabaseQuestions = Number.isFinite(databaseQuestionCount) && databaseQuestionCount > 0;
  const questionCount = hasDatabaseQuestions ? databaseQuestionCount : topic.questionCount;
  const isAvailable = topic.available || hasDatabaseQuestions;
  const canStart = isAvailable && !accessLoading && (isMember || (isFreeTrial && isLoggedIn));
  const lockedForMember = isAvailable && !accessLoading && !canStart;

  return (
    <div className="app-card app-card-hover overflow-hidden flex flex-col">
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
          {!isAvailable && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-graylight/20 text-graydark/50">
              <Lock size={9} />
              เร็วๆ นี้
            </span>
          )}
          {isAvailable && isFreeTrial && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              <Sparkles size={9} />
              ทดลองฟรี
            </span>
          )}
          {lockedForMember && !isFreeTrial && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              <Lock size={9} />
              สมาชิก
            </span>
          )}
        </div>

        <h3 className="font-medium text-graydark leading-snug mb-1">{topic.name}</h3>
        <p className="text-xs text-graydark/50 mb-4 leading-relaxed">{topic.description}</p>
        {isAvailable && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-graydark/55">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">{questionCount} ข้อ</span>
            {hasDatabaseQuestions && <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">ไม่จับเวลา</span>}
          </div>
        )}

        <div className="mt-auto">
          {canStart ? (
            <Link
              href={`/exam/${topic.subjectId}?topic=${topic.id}`}
              className="block text-center text-sm bg-navy text-white rounded-xl py-2.5 font-medium hover:opacity-90"
            >
              {attempt ? 'ทำอีกครั้ง' : 'ทำข้อสอบ'}
            </Link>
          ) : isAvailable && accessLoading ? (
            <span className="block text-center text-sm bg-graylight/15 text-graydark/40 rounded-xl py-2.5 font-medium">กำลังตรวจสอบสิทธิ์</span>
          ) : isAvailable ? (
            <Link
              href={isLoggedIn ? '/account' : '/login'}
              className="flex items-center justify-center gap-1.5 text-center text-sm border border-amber-300 text-amber-700 rounded-xl py-2.5 font-medium hover:bg-amber-50"
            >
              <Lock size={14} />
              {isLoggedIn ? 'ปลดล็อกสมาชิก' : isFreeTrial ? 'เข้าสู่ระบบเพื่อทดลอง' : 'เข้าสู่ระบบ'}
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

function FreePracticeCard({ topic, subject, isLoggedIn }) {
  const style = subjectStyles[subject.id];
  const href = isLoggedIn
    ? `/exam/${topic.subjectId}?topic=${topic.id}`
    : '/login';

  return (
    <article className="max-w-md overflow-hidden rounded-3xl border border-graylight/25 bg-white shadow-[0_12px_28px_rgba(32,48,92,0.12)]">
      <div className="p-6">
        <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${style.chip}`}>
          {style.short}
        </span>
        <h2 className="mt-4 text-lg font-bold text-navy">ข้อสอบแจกฟรี {style.short}</h2>
        <p className="mt-1 text-sm text-graydark/55">วิชา: {subject.name}</p>
      </div>
      <div className="border-t border-graylight/20 bg-slate-50/50 p-4">
        <Link
          href={href}
          className="block rounded-2xl bg-navy py-3 text-center text-base font-semibold text-white transition hover:bg-navy/90"
        >
          {isLoggedIn ? 'ทำข้อสอบ' : 'เข้าสู่ระบบเพื่อทำข้อสอบ'}
        </Link>
      </div>
    </article>
  );
}

export default function SubjectTopicsPage() {
  const { subject: subjectId } = useParams();
  const subject = subjects.find((s) => s.id === subjectId);
  const style = subjectStyles[subjectId];

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [progress, setProgress] = useState(null);
  const { loading: accessLoading, isLoggedIn, isMember } = useMembershipStatus();
  const { data: examCatalog } = useExamCatalog('practice', subjectId);
  const topicQuestionCounts = examCatalog?.topicQuestionCounts || EMPTY_TOPIC_COUNTS;
  const subjectTopics = useMemo(() => {
    const databaseTopics = (examCatalog?.topics || [])
      .filter((topic) => topic.subject_id === subjectId)
      .map((topic) => {
        const id = topic.legacy_id || topic.id;
        return {
          id,
          subjectId,
          groupId: topic.group_id || '',
          name: topic.name,
          description: topic.description || 'แบบฝึกหัดตามหัวข้อที่ผู้ดูแลกำหนด',
          questionCount: topicQuestionCounts[id] || 0,
          available: (topicQuestionCounts[id] || 0) > 0,
        };
      });
    return databaseTopics.length ? databaseTopics : topicsBySubject(subjectId);
  }, [examCatalog, subjectId, topicQuestionCounts]);
  const topicGroups = useMemo(
    () => (examCatalog?.topicGroups || []).filter((group) => group.subject_id === subjectId),
    [examCatalog, subjectId],
  );

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
    return subjectTopics
      .filter((t) => {
        if (filter.topics.length > 0 && !filter.topics.includes(t.id)) return false;

        if (progress && filter.status !== 'all') {
          const done = Boolean(progress[t.id]);
          if (filter.status === 'done' && !done) return false;
          if (filter.status === 'undone' && done) return false;
        }

        if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'th'));
  }, [subjectTopics, query, filter, progress]);

  const freeTopic = useMemo(
    () => subjectTopics.find((topic) => topic.available && isFreePracticeTopic(topic.id)) ?? null,
    [subjectTopics],
  );

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
      <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
        <div className={`rounded-2xl p-6 text-white flex-1 min-w-[280px] shadow-[0_14px_30px_rgba(43,45,66,0.15)] ${style.color}`}>
          <Link
            href="/practice"
            className="group mb-5 inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15 transition-transform group-hover:-translate-x-0.5">
              <ArrowLeft size={15} />
            </span>
            กลับไปเลือกวิชา
          </Link>
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
            <Icon size={20} />
          </div>
          <h1 className="text-xl font-semibold mb-1">{subject.name}</h1>
          <p className="text-sm text-white/75">{subject.description}</p>
        </div>

        <div className="app-card p-5 min-w-[240px]">
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

        <PracticeFilter value={filter} onChange={setFilter} scopeSubjectId={subjectId} topicItems={subjectTopics} topicGroups={topicGroups} />
      </div>

      {!accessLoading && !isMember && (
        <section className="mb-7">
          <div className="mb-3 flex items-center gap-2"><Sparkles size={17} className="text-accent-cyan" /><h2 className="font-semibold text-navy">เริ่มฝึกได้ฟรี</h2></div>
          {freeTopic ? (
            <FreePracticeCard topic={freeTopic} subject={subject} isLoggedIn={isLoggedIn} />
          ) : (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-graydark/65">กำลังเตรียมข้อสอบแจกฟรีสำหรับวิชานี้</div>
          )}
        </section>
      )}

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
      ) : topicGroups.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <SetCard
              key={t.id}
              topic={t}
              attempt={progress?.[t.id] ?? null}
              isMember={isMember}
              isLoggedIn={isLoggedIn}
              accessLoading={accessLoading}
              databaseQuestionCount={topicQuestionCounts[t.id]}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-7">
          {[...topicGroups, { id: 'ungrouped', name: 'หัวข้ออื่น', subject_id: subjectId }]
            .map((group) => ({ ...group, topics: filtered.filter((topic) => (group.id === 'ungrouped' ? !topic.groupId : topic.groupId === group.id)) }))
            .filter((group) => group.topics.length > 0)
            .map((group, index) => (
              <details key={group.id} open={index === 0} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3"><span className="flex items-center gap-2"><span className="h-5 w-1 rounded-full bg-accent-cyan" /><span className="font-bold text-navy">{group.name}</span></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-graydark/60">{group.topics.length} หัวข้อ</span></summary>
                <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.topics.map((t) => (
                    <SetCard
                      key={t.id}
                      topic={t}
                      attempt={progress?.[t.id] ?? null}
                      isMember={isMember}
                      isLoggedIn={isLoggedIn}
                      accessLoading={accessLoading}
                      databaseQuestionCount={topicQuestionCounts[t.id]}
                    />
                  ))}
                </div>
              </details>
            ))}
        </div>
      )}
    </div>
  );
}
