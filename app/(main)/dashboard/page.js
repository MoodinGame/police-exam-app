'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  ClipboardList,
  Clock3,
  Trophy,
  Target,
  Flame,
  CheckCircle2,
  XCircle,
  Sparkles,
  History,
  Info,
  Languages,
  ListChecks,
  PlayCircle,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { totalQuestions } from '@/lib/subjects';
import { useCatalog } from '@/lib/subjectCatalog';
import { getDailyQuestions, todayIsoDate } from '@/lib/dailyChallenge';
import { getAttempts, getOverview, getStreaks, getSubjectAccuracy, getWrongBySubject } from '@/lib/progress';
import { getMockAttempts } from '@/lib/mockExamProgress';
import { loadMockExamSets, getCachedMockExamSet } from '@/lib/mockExamClient';
import { getSession } from '@/lib/examSession';
import ResumeBanner from '@/components/ResumeBanner';

const EXAM_DATE = new Date('2026-11-29T00:00:00+07:00');

function useCountdown(target) {
  // เริ่มที่ null เสมอเพื่อให้ markup ตอน SSR กับตอน hydrate ตรงกัน
  // (Date.now() บนเซิร์ฟเวอร์กับตอน hydrate ไม่มีทางเท่ากันเป๊ะ) แล้วค่อยคำนวณจริงหลัง mount
  const [left, setLeft] = useState(null);

  useEffect(() => {
    function tick() {
      setLeft(target.getTime() - Date.now());
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);

  if (left === null) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, reached: false, loading: true };
  }

  const clamped = Math.max(left, 0);
  return {
    days: Math.floor(clamped / 86400000),
    hours: Math.floor((clamped / 3600000) % 24),
    minutes: Math.floor((clamped / 60000) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
    reached: left <= 0,
    loading: false,
  };
}

function CountdownBox({ days, hours, minutes, seconds, reached, loading }) {
  const units = [
    { v: days, l: 'วัน' },
    { v: hours, l: 'ชม.' },
    { v: minutes, l: 'นาที' },
    { v: seconds, l: 'วิ' },
  ];
  return (
    <div className="app-card px-4 py-3 text-right shadow-[0_12px_26px_rgba(30,64,100,0.08)]">
      <p className="text-xs text-graydark/50">สอบข้อเขียน 29 พ.ย. 2569</p>
      {reached ? (
        <p className="text-2xl font-bold text-accent-cyan">ถึงวันสอบแล้ว</p>
      ) : (
        <div className="flex items-end gap-2 justify-end mt-1">
          {units.map((u) => (
            <div key={u.l} className="text-center">
              <p className="text-2xl font-bold text-accent-cyan leading-none tabular-nums">
                {loading ? '--' : String(u.v).padStart(2, '0')}
              </p>
              <p className="text-[10px] text-graydark/40 mt-0.5">{u.l}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileExamBanner({ days, hours, reached, loading }) {
  const remaining = reached ? 'ถึงวันสอบแล้ว' : loading ? 'กำลังคำนวณเวลา' : `เหลืออีก ${days} วัน ${hours} ชม.`;
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-[radial-gradient(circle_at_88%_10%,rgba(216,176,107,0.22),transparent_30%),linear-gradient(135deg,#172856,#263b71)] p-5 text-white shadow-[0_16px_32px_rgba(30,64,100,0.2)] sm:hidden">
      <div className="pointer-events-none absolute -bottom-10 -right-5 h-28 w-28 rounded-full border border-white/10" />
      <div className="relative flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-accent-gold ring-1 ring-white/10"><CalendarClock size={27} /></span>
        <div className="min-w-0"><p className="text-sm font-semibold leading-5 text-white">สายอำนวยการ (อก.) และสายวิทยาการ (สพฐ.ตร.)</p><p className="mt-1 text-2xl font-black leading-none text-accent-gold">{remaining}</p><p className="mt-2 text-xs text-white/65">สอบ 29 พ.ย. 2569</p></div>
      </div>
    </section>
  );
}

function DailyChallenge() {
  const { findSubject } = useCatalog();
  const [shuffleKey, setShuffleKey] = useState(0);
  const dailyQuestions = useMemo(
    () => getDailyQuestions(shuffleKey === 0 ? todayIsoDate() : `${todayIsoDate()}-${shuffleKey}`, 5),
    [shuffleKey]
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const question = dailyQuestions[index];
  const done = index >= dailyQuestions.length;
  const score = dailyQuestions.reduce(
    (acc, q) => acc + (answers[q.id] === q.answerIndex ? 1 : 0),
    0
  );
  const answered = question ? answers[question.id] !== undefined : false;
  const subjectName = question ? findSubject(question.subjectId)?.name || '' : '';

  function selectAnswer(choiceIndex) {
    if (answered) return;
    setAnswers((prev) => ({ ...prev, [question.id]: choiceIndex }));
  }

  function restart() {
    setIndex(0);
    setAnswers({});
    setShuffleKey((k) => k + 1);
  }

  return (
    <div className="app-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-accent-cyan" />
        <p className="text-sm font-medium text-navy">โจทย์ประจำวัน</p>
      </div>
      <p className="text-xs text-graydark/40 mb-5">
        สุ่ม 5 ข้อจากทุกวิชาให้ทำทุกวัน ฝึกสม่ำเสมอเพื่อสร้างนิสัย
      </p>

      {!done ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-navy/5 text-navy">
              {subjectName}
            </span>
            <span className="text-xs text-graydark/40">
              ข้อ {index + 1} / {dailyQuestions.length}
            </span>
          </div>
          <p className="text-sm font-medium text-graydark mb-4 leading-relaxed">{question.question}</p>

          <div className="space-y-2">
            {question.choices.map((choice, i) => {
              const isUser = answers[question.id] === i;
              const isAns = question.answerIndex === i;
              let style = 'border-graylight/40 text-graydark hover:border-navy/40';
              if (answered && isAns) style = 'border-accent-green bg-accent-green/10 text-graydark font-medium';
              else if (answered && isUser && !isAns) style = 'border-red-300 bg-red-50 text-red-600';

              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-colors flex items-center justify-between gap-2 ${style}`}
                >
                  <span>{choice}</span>
                  {answered && isAns && <CheckCircle2 size={16} className="text-accent-green shrink-0" />}
                  {answered && isUser && !isAns && <XCircle size={16} className="text-red-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="mt-4">
              <p className="text-xs text-graydark/60 leading-relaxed mb-4">
                <span className="font-medium text-navy">คำอธิบาย: </span>
                {question.explanation}
              </p>
              <button
                onClick={() => setIndex((i) => i + 1)}
                className="w-full text-sm bg-navy text-white rounded-xl py-2.5 font-medium hover:opacity-90"
              >
                {index < dailyQuestions.length - 1 ? 'ข้อถัดไป' : 'ดูสรุปผล'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-graydark/60 mb-1">วันนี้คุณทำได้</p>
          <p className="text-4xl font-bold text-navy mb-4">
            {score}
            <span className="text-lg text-graydark/40">/{dailyQuestions.length}</span>
          </p>
          <button
            onClick={restart}
            className="text-sm border border-graylight/30 text-graydark rounded-xl px-5 py-2.5 hover:border-accent-cyan/50"
          >
            ทำใหม่ (สุ่มชุดใหม่)
          </button>
        </div>
      )}
    </div>
  );
}

function formatAttemptDate(value) {
  if (!value) return 'ไม่ทราบวันทำ';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ไม่ทราบวันทำ';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function resultStyle(percent) {
  if (percent >= 80) return 'bg-emerald-50 text-emerald-700';
  if (percent >= 60) return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-600';
}

function getDashboardData(findSubject, findTopic) {
  const practice = getAttempts().map((attempt, index) => {
    const topic = findTopic(attempt.topicId);
    const subject = findSubject(attempt.subjectId);
    const percent = attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0;
    return {
      id: `practice-${attempt.at || index}`,
      kind: 'practice',
      title: topic?.name || 'แบบฝึกหัดรายวิชา',
      subject: subject?.name || 'แบบฝึกหัด',
      score: attempt.score,
      total: attempt.total,
      percent,
      at: attempt.at,
    };
  });

  const mock = getMockAttempts().map((attempt, index) => {
    const exam = getCachedMockExamSet(attempt.examId);
    const percent = attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0;
    return {
      id: `mock-${attempt.examId}-${attempt.completedAt || index}`,
      kind: 'mock',
      title: exam?.title || 'ข้อสอบเสมือนจริง',
      subject: 'Mock Exam',
      score: attempt.score,
      total: attempt.total,
      percent,
      at: attempt.completedAt,
      passed: attempt.passed,
    };
  });

  const results = [...practice, ...mock].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  const subjectAccuracy = getSubjectAccuracy();
  const wrongBySubject = getWrongBySubject().map((item) => ({
    ...item,
    subject: findSubject(item.subjectId),
  })).filter((item) => item.subject);
  const weakSubjects = Object.entries(subjectAccuracy)
    .map(([subjectId, value]) => ({ subject: findSubject(subjectId), ...value }))
    .filter((item) => item.subject && item.pct !== null)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);
  const overview = getOverview();
  const session = getSession();
  const completed = results.filter((result) => result.percent >= 60).length;

  return {
    results,
    overview,
    session,
    streaks: getStreaks(),
    weakSubjects,
    wrongBySubject,
    completed,
    highest: results.length ? Math.max(...results.map((result) => result.percent)) : null,
  };
}

function buildDashboardDataFromStats(stats, findSubject) {
  const subjectStats = stats.subjectStats || [];
  const subjectAccuracy = Object.fromEntries(subjectStats.map((item) => [item.id, {
    answered: item.answered,
    correct: item.correct,
    pct: item.pct,
    sessions: item.sessions,
  }]));
  const weakSubjects = (stats.weakSubjects || [])
    .map((item) => ({ ...item, subject: findSubject(item.id) }))
    .filter((item) => item.subject);
  const results = (stats.recentAttempts || []).map((attempt) => ({
    id: `database-${attempt.id}`,
    kind: attempt.bank === 'mock' ? 'mock' : 'practice',
    title: attempt.title,
    subject: attempt.subjectName,
    score: attempt.score,
    total: attempt.total,
    percent: attempt.percent,
    at: attempt.completedAt,
  }));

  return {
    results,
    overview: stats.overview,
    session: getSession(),
    streaks: stats.streaks,
    weakSubjects,
    wrongBySubject: weakSubjects.map((item) => ({ ...item, wrong: item.answered - item.correct })),
    completed: stats.completed,
    highest: stats.highest,
    subjectAccuracy,
  };
}

function TodayStudyPlan({ data, findSubject }) {
  const plannedSubjects = new Set();
  const items = [];
  const colorStyles = [
    'bg-rose-50 text-rose-500',
    'bg-blue-50 text-blue-600',
    'bg-violet-50 text-violet-600',
    'bg-emerald-50 text-emerald-600',
  ];

  const addSubjectPlan = (subject, index, wrong = 0) => {
    if (!subject || plannedSubjects.has(subject.id) || items.length >= 4) return;
    plannedSubjects.add(subject.id);
    const target = wrong ? Math.min(12, wrong) : Math.min(10, subject.count);
    items.push({
      id: subject.id,
      title: wrong ? `ทบทวนข้อที่เคยผิด ${target} ข้อ` : `${subject.name} ${target} ข้อ`,
      subtitle: wrong ? subject.name : `ฝึกเสริมความแม่นยำในรายวิชา`,
      target,
      minutes: wrong ? Math.max(8, target) : 8,
      href: `/practice/${subject.id}`,
      color: colorStyles[index % colorStyles.length],
      icon: wrong ? RotateCcw : subject.id === 'english' ? Languages : BookOpenCheck,
    });
  };

  const firstWrong = data.wrongBySubject?.[0];
  if (firstWrong) addSubjectPlan(firstWrong.subject, 0, firstWrong.wrong);
  data.weakSubjects.forEach((item, index) => addSubjectPlan(item.subject, items.length + index));

  [
    findSubject('law'),
    findSubject('english'),
    findSubject('correspondence'),
    findSubject('it'),
  ].forEach((subject) => addSubjectPlan(subject, items.length));

  return (
    <section className="app-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><div className="flex items-center gap-2"><CalendarClock size={18} className="text-navy" /><h2 className="font-bold text-navy">แผนการเรียนวันนี้</h2></div><p className="mt-1 text-xs text-graydark/45">ปรับตามผลการฝึกและจุดที่ควรทบทวน</p></div>
        <Link href="/practice" className="shrink-0 text-sm font-semibold text-accent-cyan hover:underline">ดูทั้งหมด <ArrowRight className="inline" size={14} /></Link>
      </div>
      <div className="mt-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} href={item.href} className="group flex items-center gap-2.5 rounded-xl px-2 py-2.5 transition hover:bg-slate-50 sm:gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}><Icon size={18} /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold text-navy sm:text-sm">{item.title}</span><span className="mt-0.5 flex items-center gap-1 text-[11px] text-graydark/50 sm:text-xs"><Clock3 size={12} />ประมาณ {item.minutes} นาที<span className="hidden sm:inline"> · {item.subtitle}</span></span></span>
              <span className="flex shrink-0 items-center gap-1.5 sm:gap-2"><span className="text-[13px] font-bold text-graydark/45 sm:text-sm">0/{item.target}</span><span className="h-[18px] w-[18px] rounded-full border-2 border-graylight/55 transition group-hover:border-accent-cyan sm:h-5 sm:w-5" /></span>
            </Link>
          );
        })}
      </div>
      <Link href="/practice" className="btn-navy mt-4 flex w-full items-center justify-center gap-2">เริ่มเรียนตามแผน <ArrowRight size={16} /></Link>
    </section>
  );
}

function getReadiness(data, subjectCount) {
  const accuracy = data.overview.accuracyPct;
  const trainedSubjects = Object.keys(data.subjectAccuracy || getSubjectAccuracy()).length;
  const coverage = subjectCount ? Math.round((trainedSubjects / subjectCount) * 100) : 0;

  if (!data.results.length || accuracy === null) {
    return {
      value: 0,
      accuracy: null,
      coverage,
      scoreRange: null,
      label: 'เริ่มต้นฝึก',
      tone: 'text-graydark/50',
      hint: 'ทำแบบฝึกหัดอย่างน้อย 1 ชุด เพื่อให้ระบบเริ่มประเมินความพร้อม',
    };
  }

  const value = Math.round((accuracy * 0.75) + (coverage * 0.25));
  const projected = Math.round(75 + (value * 0.72));
  const scoreRange = {
    min: Math.max(0, projected - 3),
    max: Math.min(totalQuestions, projected + 3),
  };

  if (value >= 75) return { value, accuracy, coverage, scoreRange, label: 'พร้อมสอบ', tone: 'text-emerald-600', hint: 'รักษาความสม่ำเสมอและทบทวนจุดอ่อนก่อนวันสอบ' };
  if (value >= 55) return { value, accuracy, coverage, scoreRange, label: 'กำลังพัฒนา', tone: 'text-amber-600', hint: 'ฝึกเพิ่มอีกเล็กน้อยเพื่อยกระดับความพร้อม' };
  return { value, accuracy, coverage, scoreRange, label: 'ควรฝึกเพิ่ม', tone: 'text-rose-500', hint: 'เลือกทบทวนวิชาที่คะแนนยังต่ำเพื่อเพิ่มความมั่นใจ' };
}

function ReadinessRing({ value }) {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative h-32 w-32 shrink-0 max-[379px]:self-center sm:h-36 sm:w-36">
      <svg viewBox="0 0 104 104" className="h-full w-full -rotate-90" aria-label={`ความพร้อม ${value} จาก 100`}>
        <circle cx="52" cy="52" r={radius} fill="none" strokeWidth="9" className="stroke-slate-100" />
        <circle cx="52" cy="52" r={radius} fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-emerald-500" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><p className="text-4xl font-black leading-none text-navy">{value}</p><p className="mt-1 text-sm font-semibold text-graydark/45">/100</p></div>
    </div>
  );
}

function ExamReadiness({ data, subjectCount }) {
  const readiness = getReadiness(data, subjectCount);

  return (
    <section className="app-card relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-100/55 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2"><Target size={18} className="shrink-0 text-emerald-600" /><h2 className="font-bold text-navy">ความพร้อมก่อนสอบ</h2><span className="text-[10px] font-semibold text-graydark/40 max-[379px]:hidden">(Exam Readiness)</span><Info size={14} className="shrink-0 text-graydark/35" aria-label="ประเมินจากความแม่นยำและความครอบคลุมของวิชาที่ฝึก" /></div>
        <div className="mt-5 flex items-center gap-4 max-[379px]:flex-col max-[379px]:items-stretch sm:gap-5">
          <ReadinessRing value={readiness.value} />
          <div className="min-w-0 flex-1">
            {readiness.accuracy !== null ? <p className="text-sm text-graydark/60">ความแม่นยำรวม <span className="font-bold text-navy">{readiness.accuracy}%</span> · ฝึกแล้ว {readiness.coverage}% ของวิชา</p> : <p className="text-sm text-graydark/55">ยังไม่มีผลการฝึกเพียงพอสำหรับประเมิน</p>}
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3"><p className="text-xs text-graydark/45">คาดการณ์คะแนน</p>{readiness.scoreRange ? <p className="mt-1 text-2xl font-black tracking-tight text-navy">{readiness.scoreRange.min}–{readiness.scoreRange.max}<span className="ml-1 text-sm font-semibold text-graydark/45">/{totalQuestions}</span></p> : <p className="mt-1 text-lg font-bold text-graydark/40">เริ่มทำข้อสอบเพื่อดูผล</p>}</div>
            <p className={`mt-3 text-sm font-bold ${readiness.tone}`}>ระดับ: {readiness.label}</p>
            <p className="mt-1 text-xs leading-5 text-graydark/50">{readiness.hint}</p>
          </div>
        </div>
        <Link href="/profile#stats-overview" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-cyan hover:underline">ดูรายละเอียดการวิเคราะห์ <ArrowRight size={15} /></Link>
      </div>
    </section>
  );
}

function ContinueTasks({ data }) {
  const tasks = [];
  if (data.session) {
    const href = data.session.kind === 'mock'
      ? `/mock-exam/${data.session.examId || data.session.setId}`
      : `/exam/${data.session.subjectId}${data.session.topicId ? `?topic=${data.session.topicId}` : ''}`;
    const answered = Object.keys(data.session.answers || {}).length;
    tasks.push({
      id: 'resume',
      title: `ทำต่อ: ${data.session.label || 'ข้อสอบที่พักไว้'}`,
      detail: `ทำแล้ว ${answered}/${data.session.total || 0} ข้อ`,
      href,
      tone: 'amber',
      action: 'ทำต่อ',
    });
  }

  data.weakSubjects.slice(0, data.session ? 2 : 3).forEach((item) => {
    tasks.push({
      id: `review-${item.subject.id}`,
      title: `ทบทวน ${item.subject.name}`,
      detail: `ความแม่นยำล่าสุด ${item.pct}% · ฝึกแล้ว ${item.sessions} ครั้ง`,
      href: `/practice/${item.subject.id}`,
      tone: 'rose',
      action: 'เริ่มฝึก',
    });
  });

  if (!tasks.length) {
    tasks.push(
      { id: 'start-practice', title: 'เริ่มแบบฝึกหัดรายวิชา', detail: 'เลือกวิชาที่อยากเริ่มฝึกได้ทันที', href: '/practice', tone: 'cyan', action: 'เลือกวิชา' },
      { id: 'daily', title: 'ทำโจทย์ประจำวัน', detail: 'เริ่มจาก 5 ข้อสั้น ๆ เพื่อสร้างความสม่ำเสมอ', href: '#daily-challenge', tone: 'violet', action: 'เริ่มทำ' },
    );
  }

  const color = {
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-500',
    cyan: 'bg-cyan-50 text-accent-cyan',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <section className="app-card p-5 sm:p-6">
      <div className="mb-4 flex min-w-0 items-start justify-between gap-2.5"><div className="min-w-0"><div className="flex items-center gap-2"><CalendarClock size={18} className="shrink-0 text-accent-cyan" /><h2 className="truncate font-bold text-navy">สิ่งที่ต้องทำต่อ</h2></div><p className="mt-1 truncate text-xs text-graydark/45">เลือกทำทีละเรื่อง เพื่อค่อย ๆ เพิ่มคะแนนของคุณ</p></div><Link href="/practice" className="shrink-0 text-[11px] font-semibold text-accent-cyan hover:underline sm:text-xs"><span className="sm:hidden">ดูทั้งหมด</span><span className="hidden sm:inline">ดูแบบฝึกหัดทั้งหมด</span></Link></div>
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <Link key={task.id} href={task.href} className="group flex min-w-0 items-start gap-2.5 rounded-2xl border border-graylight/20 bg-slate-50/70 px-3 py-3 transition hover:border-accent-cyan/35 hover:bg-white hover:shadow-sm sm:items-center sm:gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color[task.tone]}`}><PlayCircle size={18} /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold text-navy sm:text-sm">{task.title}</span><span className="mt-0.5 block truncate text-[11px] text-graydark/48 sm:text-xs">{task.detail}</span></span>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-white transition group-hover:bg-accent-cyan sm:h-auto sm:w-auto sm:gap-1 sm:px-2.5 sm:py-1.5 sm:text-xs sm:font-semibold"><span className="hidden sm:inline">{task.action}</span><ArrowRight size={14} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentHistory({ results }) {
  return (
    <section className="app-card overflow-hidden p-0">
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-graylight/20 px-4 py-3.5 sm:px-6 sm:py-4"><div className="flex min-w-0 items-center gap-2"><History size={18} className="shrink-0 text-violet-600" /><div className="min-w-0"><h2 className="truncate font-bold text-navy">ประวัติการสอบล่าสุด</h2><p className="mt-0.5 hidden text-xs text-graydark/45 sm:block">ผลการทำข้อสอบและแบบฝึกหัดล่าสุด</p></div></div><Link href="/history" className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-accent-cyan hover:underline sm:text-xs">ดูทั้งหมด <ArrowRight size={13} /></Link></div>
      {results.length ? (
        <div className="divide-y divide-graylight/15">
          {results.slice(0, 3).map((result) => (
            <Link key={result.id} href="/history" className="flex min-w-0 items-center gap-2.5 px-4 py-3.5 transition hover:bg-slate-50 sm:gap-3 sm:px-6">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${result.kind === 'mock' ? 'bg-violet-50 text-violet-600' : 'bg-cyan-50 text-accent-cyan'}`}>{result.kind === 'mock' ? <ClipboardList size={17} /> : <ListChecks size={17} />}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-navy sm:text-sm">{result.title}</span><span className="mt-0.5 block truncate text-[11px] text-graydark/45 sm:text-xs">{formatAttemptDate(result.at)} · {result.subject}</span></span>
              <span className="shrink-0 text-right"><span className="block text-sm font-black text-navy">{result.score}/{result.total}</span><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${resultStyle(result.percent)}`}>{result.percent}%</span></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-6 py-10 text-center"><History className="mx-auto text-graydark/25" size={25} /><p className="mt-3 text-sm text-graydark/55">ยังไม่มีประวัติการสอบ</p><Link href="/practice" className="mt-3 inline-flex text-xs font-semibold text-accent-cyan hover:underline">เริ่มทำแบบฝึกหัด →</Link></div>
      )}
    </section>
  );
}

function CompactMetrics({ stats }) {
  return (
    <section className="app-card p-2.5 sm:p-3">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, sub, tone }) => (
          <div key={label} className="rounded-2xl bg-slate-50/90 px-3.5 py-3 sm:px-4">
            <div className="flex items-center gap-2 text-graydark/55">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}><Icon size={15} /></span>
              <p className="truncate text-[11px] font-medium">{label}</p>
            </div>
            <p className="mt-2 text-xl font-black leading-none text-navy sm:text-2xl">{value}</p>
            <p className="mt-1 truncate text-[10px] text-graydark/42">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FocusPanel({ weakSubjects }) {
  return (
    <section className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><TrendingUp size={17} className="text-rose-500" /><h2 className="font-bold text-navy">จุดที่ควรโฟกัส</h2></div>
          <p className="mt-1 text-xs text-graydark/45">เริ่มจากวิชาที่ควรทบทวนก่อน</p>
        </div>
        <Link href="/profile#stats-overview" className="shrink-0 text-xs font-semibold text-accent-cyan hover:underline">ดูสถิติ</Link>
      </div>

      {weakSubjects.length ? (
        <div className="mt-4 space-y-2.5">
          {weakSubjects.slice(0, 2).map((item) => (
            <Link key={item.subject.id} href={`/practice/${item.subject.id}`} className="group block rounded-xl border border-rose-100 bg-rose-50/55 px-3.5 py-3 transition hover:border-rose-200 hover:bg-rose-50">
              <div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-bold text-navy">{item.subject.name}</p><span className="shrink-0 text-sm font-black text-rose-500">{item.pct}%</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-rose-100"><div className="h-full rounded-full bg-rose-400" style={{ width: `${item.pct}%` }} /></div>
              <p className="mt-1.5 text-[11px] text-graydark/45">ฝึกแล้ว {item.sessions} ครั้ง · เริ่มทบทวน <span className="group-hover:text-rose-500">→</span></p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-graylight/35 px-4 py-5 text-center">
          <p className="text-xs leading-5 text-graydark/55">ทำแบบฝึกหัดสักชุด แล้วระบบจะแนะนำจุดที่ควรทบทวนให้</p>
          <Link href="/practice" className="mt-2 inline-flex text-xs font-semibold text-accent-cyan hover:underline">เลือกแบบฝึกหัด →</Link>
        </div>
      )}
    </section>
  );
}

function QuickActions() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-indigo-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <p className="font-bold text-navy">พร้อมฝึกต่อแล้วใช่ไหม?</p>
        <p className="mt-0.5 text-xs text-graydark/55">เลือกฝึกรายวิชา หรือจำลองสอบเต็มรูปแบบได้ทันที</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/practice" className="btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm">เลือกแบบฝึก <ArrowRight size={15} /></Link>
        <Link href="/mock-exam" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-navy/20 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-white">Mock Exam <ClipboardList size={15} /></Link>
      </div>
    </section>
  );
}


export default function DashboardPage() {
  const { subjects, findSubject, findTopic } = useCatalog();
  const countdown = useCountdown(EXAM_DATE);
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    // โหลดรายชื่อชุด Mock Exam ให้พร้อมก่อน จะได้แสดงชื่อชุดจริงแทนป้ายทั่วไป
    async function loadDashboard() {
      try {
        const response = await fetch('/api/stats', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load dashboard');
        if (active) setData(buildDashboardDataFromStats(payload, findSubject));
      } catch {
        loadMockExamSets().finally(() => {
          if (active) setData(getDashboardData(findSubject, findTopic));
        });
      }
    }
    loadDashboard();
    return () => {
      active = false;
    };
  }, [findSubject, findTopic]);

  const dashboard = data || {
    results: [],
    overview: { answered: 0 },
    completed: 0,
    highest: null,
    streaks: { current: 0 },
    weakSubjects: [],
    wrongBySubject: [],
    session: null,
  };
  const statCards = [
    { icon: ClipboardList, label: 'ทำข้อสอบ', value: String(dashboard.results.length), sub: dashboard.results.length ? `${dashboard.overview.answered} ข้อแล้ว` : 'เริ่มชุดแรกได้เลย', tone: 'bg-cyan-50 text-accent-cyan' },
    { icon: Trophy, label: 'ผ่านเกณฑ์', value: String(dashboard.completed), sub: dashboard.results.length ? `จาก ${dashboard.results.length} ชุด` : 'ยังไม่มีผลสอบ', tone: 'bg-amber-50 text-amber-600' },
    { icon: Target, label: 'คะแนนสูงสุด', value: dashboard.highest === null ? '—' : `${dashboard.highest}%`, sub: dashboard.highest === null ? 'รอผลชุดแรก' : 'จากผลที่บันทึกไว้', tone: 'bg-emerald-50 text-emerald-600' },
    { icon: Flame, label: 'ฝึกต่อเนื่อง', value: `${dashboard.streaks.current} วัน`, sub: dashboard.streaks.current ? 'รักษาจังหวะไว้' : 'ฝึกวันนี้เพื่อเริ่ม', tone: 'bg-rose-50 text-rose-500' },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 pb-3 sm:pb-6">
      <div className="hidden flex-wrap items-center justify-between gap-4 sm:flex">
        <div>
          <h1 className="app-section-heading text-2xl font-semibold text-navy">แดชบอร์ด</h1>
          <p className="text-graydark/60 text-sm">สายอำนวยการ 2569</p>
        </div>
        <CountdownBox {...countdown} />
      </div>

      <MobileExamBanner {...countdown} />

      <div className="hidden sm:block"><CompactMetrics stats={statCards} /></div>

      <ResumeBanner />

      <div className="grid gap-5 xl:grid-cols-2">
        <ExamReadiness data={dashboard} subjectCount={subjects.length} />
        <TodayStudyPlan data={dashboard} findSubject={findSubject} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <ContinueTasks data={dashboard} />
          <RecentHistory results={dashboard.results} />
        </div>

        <aside className="space-y-5">
          <FocusPanel weakSubjects={dashboard.weakSubjects} />
          <div id="daily-challenge" className="scroll-mt-6"><DailyChallenge /></div>
        </aside>
      </div>

      <QuickActions />
    </div>
  );
}
