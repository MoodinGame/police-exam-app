'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, X, AlertCircle, Sparkles, Check, Lock } from 'lucide-react';
import { subjects, totalQuestions } from '@/lib/subjects';
import { topics, topicsBySubject } from '@/lib/topics';
import { subjectStyles } from '@/lib/subjectStyles';
import { getSubjectProgress, getTopicProgress, getWrongBySubject } from '@/lib/progress';
import { isFreePracticeTopic } from '@/lib/entitlements';
import { useMembershipStatus } from '@/lib/useMembershipStatus';
import PracticeFilter, { EMPTY_FILTER } from '@/components/PracticeFilter';
import ResumeBanner from '@/components/ResumeBanner';

const PASS_PCT = 60;

function SubjectCard({ subject, progress }) {
  const style = subjectStyles[subject.id];
  const Icon = style.icon;
  const subjectTopics = topicsBySubject(subject.id);

  const progressPct = progress?.progressPct ?? 0;
  const accuracyPct = progress?.accuracyPct ?? null;

  return (
    <Link
      href={`/practice/${subject.id}`}
      className={`rounded-2xl p-6 text-white flex flex-col shadow-[0_14px_30px_rgba(43,45,66,0.15)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(43,45,66,0.24)] ${style.color}`}
    >
      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
        <Icon size={20} />
      </div>
      <h3 className="text-lg font-semibold mb-1">{subject.name}</h3>
      <p className="text-sm text-white/75 mb-4 leading-relaxed">{subject.description}</p>
      <p className="text-xs text-white/70 mb-3">
        {subjectTopics.length} ชุด · {subject.count} ข้อ
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
          {accuracyPct !== null ? `ตอบถูก ${accuracyPct}%` : ' '}
        </p>

        <span className="flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors rounded-xl py-2.5 text-sm font-medium">
          {progressPct > 0 ? 'ทำต่อ' : 'เริ่มทำข้อสอบ'}
          <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

function SetCard({ topic, attempt, isMember, isLoggedIn, accessLoading }) {
  const style = subjectStyles[topic.subjectId];
  const subject = subjects.find((s) => s.id === topic.subjectId);
  const pct = attempt ? Math.round((attempt.score / attempt.total) * 100) : null;
  const passed = pct !== null && pct >= PASS_PCT;
  const isFreeTrial = isFreePracticeTopic(topic.id);
  const canStart = topic.available && !accessLoading && (isMember || (isFreeTrial && isLoggedIn));

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
        <div className="flex flex-wrap items-center gap-1.5 mb-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.chip}`}>{style.short}</span>{topic.available && isFreeTrial && <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700"><Sparkles size={9} /> ทดลองฟรี</span>}{topic.available && !isFreeTrial && !isMember && !accessLoading && <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700"><Lock size={9} /> สมาชิก</span>}</div>
        <h3 className="font-medium text-graydark leading-snug mb-1">{topic.name}</h3>
        <p className="text-xs text-graydark/50 mb-1">วิชา: {subject?.name}</p>
        <p className="text-xs text-graydark/40 mb-4">{topic.questionCount} ข้อ</p>
        {!topic.available ? <span className="mt-auto block text-center text-sm bg-graylight/15 text-graydark/40 rounded-xl py-2.5 font-medium">ยังไม่เปิดให้ทำ</span> : canStart ? <Link href={`/exam/${topic.subjectId}?topic=${topic.id}`} className="mt-auto block text-center text-sm bg-navy text-white rounded-xl py-2.5 font-medium hover:opacity-90">{attempt ? 'ทำอีกครั้ง' : 'ทำข้อสอบ'}</Link> : accessLoading ? <span className="mt-auto block text-center text-sm bg-graylight/15 text-graydark/40 rounded-xl py-2.5 font-medium">กำลังตรวจสอบสิทธิ์</span> : <Link href={isLoggedIn ? '/account' : '/login'} className="mt-auto flex items-center justify-center gap-1.5 text-center text-sm border border-amber-300 text-amber-700 rounded-xl py-2.5 font-medium hover:bg-amber-50"><Lock size={14} />{isLoggedIn ? 'ปลดล็อกสมาชิก' : isFreeTrial ? 'เข้าสู่ระบบเพื่อทดลอง' : 'เข้าสู่ระบบ'}</Link>}
      </div>
    </div>
  );
}

export default function PracticePage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [stats, setStats] = useState(null);
  const { loading: accessLoading, isLoggedIn, isMember } = useMembershipStatus();

  // อ่าน localStorage หลัง mount เท่านั้น เพื่อไม่ให้ markup ตอน SSR กับตอน hydrate ต่างกัน
  useEffect(() => {
    const subjectProgress = {};
    for (const s of subjects) subjectProgress[s.id] = getSubjectProgress(s.id, topicsBySubject(s.id));

    const topicAttempts = {};
    for (const t of topics) topicAttempts[t.id] = getTopicProgress(t.id);

    setStats({ subjectProgress, topicAttempts, wrongBySubject: getWrongBySubject() });
  }, []);

  const q = query.trim().toLowerCase();

  // เลือกหมวดย่อยไว้ = แสดงเป็นการ์ดชุดข้อสอบแทนการ์ดวิชา
  const showingSets = filter.topics.length > 0;

  const visibleSets = useMemo(() => {
    if (!showingSets) return [];
    return topics.filter((t) => {
      if (!filter.topics.includes(t.id)) return false;
      if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
      if (!stats) return true;
      const done = Boolean(stats.topicAttempts[t.id]);
      if (filter.status === 'done' && !done) return false;
      if (filter.status === 'undone' && done) return false;
      return true;
    });
  }, [showingSets, filter, q, stats]);

  const visibleSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (filter.subjects.length > 0 && !filter.subjects.includes(s.id)) return false;

      if (stats && filter.status !== 'all') {
        const pct = stats.subjectProgress[s.id]?.progressPct ?? 0;
        if (filter.status === 'done' && pct === 0) return false;
        if (filter.status === 'undone' && pct > 0) return false;
      }

      if (!q) return true;
      const short = subjectStyles[s.id]?.short ?? '';
      const setNames = topicsBySubject(s.id)
        .map((t) => `${t.name} ${t.description}`)
        .join(' ');
      return `${s.name} ${s.description} ${short} ${setNames}`.toLowerCase().includes(q);
    });
  }, [filter, q, stats]);

  const attemptedTopics = stats ? topics.filter((t) => stats.topicAttempts[t.id]).length : 0;
  const overallPct = topics.length ? Math.round((attemptedTopics / topics.length) * 100) : 0;
  const filterActive =
    filter.subjects.length > 0 || filter.topics.length > 0 || filter.status !== 'all';
  const isFiltering = filterActive || q !== '';

  const recommended = useMemo(() => {
    if (!stats) return [];
    const available = topics.filter((t) => t.available);
    const untouched = available.filter((t) => !stats.topicAttempts[t.id]);
    if (untouched.length > 0) return untouched.slice(0, 8);
    return [...available]
      .sort((a, b) => {
        const ra = stats.topicAttempts[a.id];
        const rb = stats.topicAttempts[b.id];
        return ra.score / ra.total - rb.score / rb.total;
      })
      .slice(0, 8);
  }, [stats]);

  return (
    <div>
      <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy mb-1">แบบฝึกหัดรายวิชา</h1>
          <p className="text-graydark/60">
            เลือกวิชาเพื่อเริ่มทำข้อสอบและพัฒนาคะแนนของคุณ · รวม {totalQuestions} ข้อ
          </p>
        </div>

        <div className="app-card p-5 min-w-[240px]">
          <p className="text-xs text-graydark/50 mb-2">ความก้าวหน้ารวม</p>
          <div className="flex items-center gap-3 mb-3">
            <p className="text-3xl font-bold text-navy">{stats ? `${overallPct}%` : '—'}</p>
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
              style={{ width: `${stats ? overallPct : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-graydark/40 mt-2">
            ทำแล้ว {attemptedTopics} จาก {topics.length} ชุด
          </p>
        </div>
      </div>

      {!accessLoading && !isMember && <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-cyan-50/70 p-4 shadow-[0_10px_24px_rgba(0,180,216,0.08)] sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-accent-cyan shadow-sm"><Sparkles size={17} /></span><div><p className="text-sm font-semibold text-navy">ทดลองใช้ฟรี 6 ชุด · วิชาละ 1 ชุด</p><p className="mt-0.5 text-xs leading-5 text-graydark/60">มองหาป้าย “ทดลองฟรี” แล้วเข้าสู่ระบบด้วย OTP เพื่อเริ่มทำ ส่วนชุดอื่นเปิดสำหรับสมาชิก</p></div></div><Link href={isLoggedIn ? '/account' : '/login'} className="btn-navy shrink-0">{isLoggedIn ? 'ดูสมาชิก' : 'เข้าสู่ระบบ'}</Link></section>}

      <div className="flex items-stretch gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-graydark/40 pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาวิชา หรือหมวดข้อสอบ..."
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

        <PracticeFilter value={filter} onChange={setFilter} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <button
          onClick={() => setFilter({ ...filter, subjects: [], topics: [] })}
          className={`text-sm px-4 py-2 rounded-full border transition-colors ${
            filter.subjects.length === 0
              ? 'bg-navy text-white border-navy'
              : 'border-graylight/30 text-graydark hover:border-accent-cyan/50'
          }`}
        >
          ทั้งหมด
        </button>
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter({ ...filter, subjects: [s.id], topics: [] })}
            className={`text-sm px-4 py-2 rounded-full border transition-colors ${
              filter.subjects.length === 1 && filter.subjects[0] === s.id
                ? 'bg-navy text-white border-navy'
                : 'border-graylight/30 text-graydark hover:border-accent-cyan/50'
            }`}
          >
            {subjectStyles[s.id].short}
          </button>
        ))}
        {isFiltering && (
          <button
            onClick={() => {
              setFilter(EMPTY_FILTER);
              setQuery('');
            }}
            className="flex items-center gap-1 text-xs text-graydark/50 hover:text-navy ml-1"
          >
            <X size={13} />
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <ResumeBanner />

      {stats && stats.wrongBySubject.length > 0 && !showingSets && (
        <section className="border border-red-200 bg-red-50/40 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={17} className="text-red-500" />
            <h2 className="font-semibold text-navy">ข้อที่ทำผิดตามวิชา</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.wrongBySubject.map((w) => {
              const subject = subjects.find((s) => s.id === w.subjectId);
              if (!subject) return null;
              return (
                <div
                  key={w.subjectId}
                  className="flex items-center justify-between gap-3 bg-white border border-red-100 rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-graydark truncate">{subject.name}</p>
                    <p className="text-xs text-graydark/50">
                      ทำผิด {w.wrong} ข้อ · {w.wrongPct}%
                    </p>
                  </div>
                  <Link
                    href={`/practice/${w.subjectId}`}
                    className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-1.5 shrink-0"
                  >
                    ฝึกซ้ำ →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showingSets ? (
        <section className="mb-10">
          <h2 className="font-semibold text-navy mb-4">
            ชุดข้อสอบที่เลือก{' '}
            <span className="text-sm font-normal text-graydark/40">({visibleSets.length} ชุด)</span>
          </h2>
          {visibleSets.length === 0 ? (
            <div className="border border-dashed border-graylight/40 rounded-2xl p-12 text-center">
              <p className="text-graydark/50 mb-1">ไม่พบชุดข้อสอบที่ตรงกับตัวกรอง</p>
              <p className="text-sm text-graydark/40">ลองปรับตัวกรองหรือคำค้นหาดูอีกครั้ง</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleSets.map((t) => (
                <SetCard key={t.id} topic={t} attempt={stats?.topicAttempts[t.id] ?? null} isMember={isMember} isLoggedIn={isLoggedIn} accessLoading={accessLoading} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mb-10">
          <h2 className="font-semibold text-navy mb-4">
            วิชาทั้งหมด{' '}
            <span className="text-sm font-normal text-graydark/40">
              ({visibleSubjects.length} วิชา)
            </span>
          </h2>

          {visibleSubjects.length === 0 ? (
            <div className="border border-dashed border-graylight/40 rounded-2xl p-12 text-center">
              <p className="text-graydark/50 mb-1">ไม่พบวิชาที่ตรงกับตัวกรอง</p>
              <p className="text-sm text-graydark/40">ลองปรับตัวกรองหรือคำค้นหาดูอีกครั้ง</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleSubjects.map((s) => (
                <SubjectCard key={s.id} subject={s} progress={stats?.subjectProgress[s.id] ?? null} />
              ))}
            </div>
          )}
        </section>
      )}

      {recommended.length > 0 && !showingSets && (
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-accent-cyan" />
            <h2 className="font-semibold text-navy">แนะนำสำหรับคุณ</h2>
          </div>
          <p className="text-xs text-graydark/40 mb-4">
            {stats && Object.values(stats.topicAttempts).some((a) => a)
              ? 'ชุดที่ยังไม่เคยทำ — ลองเก็บให้ครบทุกชุด'
              : 'เริ่มจากชุดเหล่านี้ก่อนได้เลย'}
          </p>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {recommended.map((t) => {
              const style = subjectStyles[t.subjectId];
              const isFreeTrial = isFreePracticeTopic(t.id);
              const canStart = !accessLoading && (isMember || (isFreeTrial && isLoggedIn));
              return (
                <div
                  key={t.id}
                  className="border border-graylight/30 rounded-xl p-4 flex flex-col hover:shadow-md hover:border-accent-cyan/50 transition-all"
                >
                  <span
                    className={`self-start text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${style.chip}`}
                  >
                    {style.short}
                  </span>
                  {isFreeTrial && <span className="self-start -mt-1 text-[10px] font-medium text-emerald-600">ทดลองฟรี</span>}
                  <p className="text-sm font-medium text-graydark leading-snug mb-1">{t.name}</p>
                  <p className="text-[11px] text-graydark/40 mb-3">{t.questionCount} ข้อ</p>
                  <Link href={canStart ? `/exam/${t.subjectId}?topic=${t.id}` : isLoggedIn ? '/account' : '/login'} className={`mt-auto text-center text-xs rounded-lg py-2 font-medium ${canStart ? 'bg-navy text-white hover:opacity-90' : 'border border-amber-300 text-amber-700 hover:bg-amber-50'}`}>{canStart ? 'เริ่มทำ' : isLoggedIn ? 'ปลดล็อก' : 'เข้าสู่ระบบ'}</Link>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
