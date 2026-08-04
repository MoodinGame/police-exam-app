'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock3,
  Eye,
  FileText,
  History,
  ListChecks,
  RotateCcw,
  Target,
  X,
  XCircle,
} from 'lucide-react';
import { getAttempts } from '@/lib/progress';
import { getMockAttempts } from '@/lib/mockExamProgress';
import { loadMockExamSets, getCachedMockExamSet, fetchMockExam } from '@/lib/mockExamClient';
import { questions } from '@/lib/questions';
import { useCatalog } from '@/lib/subjectCatalog';

const TABS = [
  { id: 'mock', label: 'ข้อสอบเสมือนจริง', icon: ClipboardCheck },
  { id: 'practice', label: 'ฝึกซ้อมรายวิชา', icon: ListChecks },
];

function formatDate(value) {
  if (!value) return 'ไม่ทราบวันทำข้อสอบ';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ไม่ทราบวันทำข้อสอบ';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return 'ไม่บันทึกเวลา';
  if (seconds < 60) return `${seconds} วินาที`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours} ชม. ${minutes} นาที` : `${minutes} นาที`;
}

function resultTone(percent) {
  if (percent >= 80) return { label: 'ทำได้ดีมาก', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (percent >= 60) return { label: 'ผ่านเกณฑ์ฝึก', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'ควรทบทวนเพิ่ม', className: 'bg-rose-50 text-rose-700 border-rose-200' };
}

// ใช้เฉพาะตอน /api/attempts ล้มเหลว แล้วอ่านประวัติจากเครื่องแทน
// findSubject ส่งมาจากคอมโพเนนต์ เพราะชื่อวิชาต้องมาจากฐานข้อมูล ไม่ใช่รายการ hardcode
function buildPracticeHistory(findSubject, findTopic) {
  return getAttempts().map((attempt, index) => {
    const subject = findSubject(attempt.subjectId);
    const topic = findTopic(attempt.topicId);
    const percent = attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0;

    return {
      id: `practice-${attempt.at || attempt.date}-${index}`,
      kind: 'practice',
      title: topic?.name || 'แบบฝึกหัดรายวิชา',
      subtitle: subject?.name || 'ไม่พบชื่อวิชา',
      score: attempt.score,
      total: attempt.total,
      percent,
      at: attempt.at,
      durationSeconds: attempt.durationSeconds,
      answers: attempt.answers || null,
      subjectId: attempt.subjectId,
      topicId: attempt.topicId,
    };
  });
}

function buildMockHistory() {
  return getMockAttempts().map((attempt, index) => {
    const exam = getCachedMockExamSet(attempt.examId);
    const percent = attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0;

    return {
      id: `mock-${attempt.examId}-${attempt.completedAt || index}`,
      kind: 'mock',
      title: exam?.title || 'ข้อสอบเสมือนจริง',
      subtitle: exam ? `${exam.totalQuestions} ข้อ · เวลา ${exam.durationMinutes} นาที` : 'ชุดข้อสอบที่บันทึกไว้',
      score: attempt.score,
      total: attempt.total,
      percent,
      at: attempt.completedAt,
      durationSeconds: attempt.durationSeconds,
      answers: attempt.answers || null,
      examId: attempt.examId,
      passed: attempt.passed,
    };
  });
}

function buildDatabaseHistory(rows) {
  return (rows || []).map((attempt) => {
    const total = attempt.total_questions || 0;
    const score = attempt.correct_answers || 0;
    const subjectName = attempt.content_subjects?.name || 'ไม่พบชื่อวิชา';
    const topicName = attempt.content_topics?.name;
    const isMock = attempt.bank === 'mock';

    return {
      id: `database-${attempt.id}`,
      databaseAttemptId: attempt.id,
      kind: isMock ? 'mock' : 'practice',
      title: attempt.title || (isMock ? 'ข้อสอบเสมือนจริง' : 'แบบฝึกหัดรายวิชา'),
      subtitle: isMock
        ? `${total} ข้อ · ${attempt.exam_sets?.title || subjectName}`
        : `${subjectName}${topicName ? ` · ${topicName}` : ''}`,
      score,
      total,
      percent: total ? Math.round((score / total) * 100) : 0,
      at: attempt.completed_at || attempt.started_at,
      durationSeconds: attempt.elapsed_seconds,
      answers: attempt.answers || null,
      subjectId: attempt.subject_id,
      topicId: attempt.content_topics?.legacy_id || null,
      examId: attempt.exam_sets?.slug || null,
      passed: null,
    };
  });
}

function ResultBadge({ percent }) {
  const tone = resultTone(percent);
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.className}`}>{tone.label}</span>;
}

function EmptyState({ kind }) {
  const isMock = kind === 'mock';
  return (
    <section className="app-card border-dashed px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5 text-navy"><History size={26} /></div>
      <h2 className="mt-4 text-lg font-bold text-navy">ยังไม่มีประวัติ{isMock ? 'ข้อสอบเสมือนจริง' : 'การฝึกซ้อม'}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-graydark/55">เมื่อส่งข้อสอบแล้ว ระบบจะเก็บคะแนนและสรุปผลไว้ที่หน้านี้ เพื่อให้คุณกลับมาทบทวนได้ทุกเมื่อ</p>
      <Link href={isMock ? '/mock-exam' : '/practice'} className="btn-primary mt-6 inline-flex items-center gap-2"><RotateCcw size={16} />{isMock ? 'ไปเลือก Mock Exam' : 'เริ่มฝึกซ้อม'}</Link>
    </section>
  );
}

function HistoryItem({ item, selected, onSelect }) {
  const isMock = item.kind === 'mock';
  const Icon = isMock ? ClipboardCheck : ListChecks;

  return (
    <article className={`app-card transition ${selected ? 'border-accent-cyan/45 ring-2 ring-accent-cyan/10' : 'app-card-hover'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isMock ? 'bg-violet-50 text-violet-600' : 'bg-cyan-50 text-accent-cyan'}`}><Icon size={22} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold text-navy">{item.title}</h2><ResultBadge percent={item.percent} /></div>
          <p className="mt-1 text-sm text-graydark/55">{item.subtitle}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-graydark/45"><span className="inline-flex items-center gap-1"><CalendarDays size={13} />{formatDate(item.at)}</span><span className="inline-flex items-center gap-1"><Clock3 size={13} />{formatDuration(item.durationSeconds)}</span></div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-graylight/20 pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <div className="text-right"><p className="text-2xl font-black text-navy">{item.score}<span className="text-sm font-medium text-graydark/45">/{item.total}</span></p><p className="text-xs text-graydark/45">{item.percent}% ถูกต้อง</p></div>
          <button type="button" onClick={() => onSelect(item)} className="inline-flex items-center gap-1.5 rounded-xl border border-navy/20 px-3 py-2 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white"><Eye size={15} />ดูผล</button>
        </div>
      </div>
    </article>
  );
}

function AnswerReview({ item }) {
  // ข้อสอบ Mock ต้องดึงคำถามจาก API ใหม่ทุกครั้ง (มีเช็คสิทธิ์สมาชิก) ต่างจากแบบฝึกหัดที่ยังอ่านจากไฟล์ static
  const [reviewQuestions, setReviewQuestions] = useState(null);
  const [reviewLoadFailed, setReviewLoadFailed] = useState(false);

  useEffect(() => {
    if (!item || !item.answers) return undefined;
    let active = true;
    setReviewQuestions(null);
    setReviewLoadFailed(false);

    if (item.databaseAttemptId) {
      fetch(`/api/attempts/${item.databaseAttemptId}`, { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok) throw new Error('Unable to load attempt');
          return response.json();
        })
        .then((data) => {
          if (active) setReviewQuestions(data.questions || []);
        })
        .catch(() => {
          if (active) setReviewLoadFailed(true);
        });
    } else if (item.kind === 'mock' && item.examId) {
      fetchMockExam(item.examId)
        .then((data) => {
          if (active) setReviewQuestions(data.questions || []);
        })
        .catch(() => {
          if (active) setReviewLoadFailed(true);
        });
    }
    return () => {
      active = false;
    };
  }, [item]);

  const itemQuestions = useMemo(() => {
    if (!item?.answers) return [];
    if (item.databaseAttemptId || item.kind === 'mock') return reviewQuestions || [];
    return questions.filter((question) => question.subjectId === item.subjectId && (!item.topicId || question.topicId === item.topicId));
  }, [item, reviewQuestions]);

  if (!item) return null;
  const hasSavedAnswers = Boolean(item.answers && Object.keys(item.answers).length);
  const reviewPending = (item.databaseAttemptId || item.kind === 'mock') && hasSavedAnswers && reviewQuestions === null && !reviewLoadFailed;
  const canReview = hasSavedAnswers && itemQuestions.length > 0;

  return (
    <section className="app-card overflow-hidden p-0">
      <div className="bg-gradient-to-r from-navy to-[#244b73] px-5 py-5 text-white sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-white/60">สรุปผลย้อนหลัง</p><h2 className="mt-1 text-lg font-bold">{item.title}</h2><p className="mt-1 text-sm text-white/70">{item.subtitle}</p></div><ResultBadge percent={item.percent} /></div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-white/10 p-3"><p className="text-xl font-black">{item.score}/{item.total}</p><p className="mt-1 text-xs text-white/60">คะแนน</p></div><div className="rounded-xl bg-white/10 p-3"><p className="text-xl font-black">{item.percent}%</p><p className="mt-1 text-xs text-white/60">ความแม่นยำ</p></div><div className="rounded-xl bg-white/10 p-3"><p className="text-sm font-bold">{formatDuration(item.durationSeconds)}</p><p className="mt-1 text-xs text-white/60">เวลาที่ใช้</p></div></div>
      </div>

      <div className="p-5 sm:p-6">
        {reviewPending ? (
          <div className="h-40 rounded-2xl bg-graylight/10 animate-pulse" />
        ) : canReview ? (
          <>
            <div className="mb-4 flex items-center gap-2"><FileText size={18} className="text-accent-cyan" /><div><h3 className="font-bold text-navy">เฉลยและคำตอบที่เลือก</h3><p className="text-xs text-graydark/45">แสดงคำตอบที่บันทึกไว้ในการทำครั้งนี้</p></div></div>
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {itemQuestions.map((question, index) => {
                const selectedIndex = item.answers[question.id];
                const correct = selectedIndex === question.answerIndex;
                return <article key={question.id} className={`rounded-2xl border p-4 ${correct ? 'border-emerald-200 bg-emerald-50/45' : 'border-rose-200 bg-rose-50/45'}`}><div className="flex gap-3"><span className={correct ? 'text-emerald-600' : 'text-rose-500'}>{correct ? <CheckCircle2 size={19} /> : <XCircle size={19} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-navy">ข้อ {index + 1}. {question.question}</p><p className="mt-2 text-xs text-graydark/65">คำตอบของคุณ: <span className="font-semibold">{selectedIndex === undefined ? 'ไม่ได้ตอบ' : question.choices[selectedIndex]}</span></p><p className="mt-1 text-xs text-graydark/65">คำตอบที่ถูก: <span className="font-semibold text-emerald-700">{question.choices[question.answerIndex]}</span></p>{question.explanation && <p className="mt-2 rounded-lg bg-white/70 p-2.5 text-xs leading-5 text-graydark/65">{question.explanation}</p>}</div></div></article>;
              })}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-graylight/40 bg-slate-50 p-6 text-center"><Target className="mx-auto text-accent-cyan" size={25} /><h3 className="mt-3 font-bold text-navy">บันทึกผลคะแนนไว้แล้ว</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-graydark/55">รายการที่ทำก่อนเพิ่มฟีเจอร์นี้จะมีเฉพาะคะแนนรวม ส่วนรายการใหม่จะบันทึกคำตอบเพื่อเปิดดูเฉลยย้อนหลังได้</p></div>
        )}
      </div>
    </section>
  );
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState('mock');
  const [history, setHistory] = useState({ mock: [], practice: [] });
  const [selected, setSelected] = useState(null);
  const { findSubject, findTopic } = useCatalog();

  useEffect(() => {
    let active = true;
    const sortLatest = (items) => [...items].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
    // โหลดรายชื่อชุด Mock Exam ให้พร้อมก่อน จะได้แสดงชื่อชุดจริงแทนป้ายทั่วไป
    async function loadHistory() {
      try {
        const response = await fetch('/api/attempts?limit=200', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load attempts');
        const databaseItems = buildDatabaseHistory(payload.attempts);
        if (!active) return;
        setHistory({
          mock: sortLatest(databaseItems.filter((item) => item.kind === 'mock')),
          practice: sortLatest(databaseItems.filter((item) => item.kind === 'practice')),
        });
      } catch {
        // Keep the local data readable for attempts made before the database was connected.
        loadMockExamSets().finally(() => {
          if (!active) return;
          setHistory({ mock: sortLatest(buildMockHistory()), practice: sortLatest(buildPracticeHistory(findSubject, findTopic)) });
        });
      }
    }

    loadHistory();
    return () => {
      active = false;
    };
  }, [findSubject, findTopic]);

  const activeItems = history[activeTab];
  const summary = useMemo(() => {
    const totalQuestions = activeItems.reduce((sum, item) => sum + item.total, 0);
    const totalScore = activeItems.reduce((sum, item) => sum + item.score, 0);
    return { count: activeItems.length, totalQuestions, accuracy: totalQuestions ? Math.round((totalScore / totalQuestions) * 100) : null };
  }, [activeItems]);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    setSelected(null);
  };

  return (
    <div className="space-y-6 pb-6">
      <header className="app-card overflow-hidden bg-gradient-to-br from-navy via-[#193b66] to-[#23667b] p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100"><History size={14} />ย้อนดูทุกผลการทำข้อสอบ</div><h1 className="mt-3 text-3xl font-black">ประวัติการสอบ</h1><p className="mt-2 text-sm leading-6 text-white/70">ดูคะแนน ความแม่นยำ และเฉลยที่คุณทำไว้ในแต่ละครั้ง</p></div><div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm"><p className="text-xs text-white/60">ผลการทำทั้งหมด</p><p className="mt-1 text-3xl font-black">{history.mock.length + history.practice.length}<span className="ml-1 text-sm font-medium text-white/65">ครั้ง</span></p></div></div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="app-card p-5"><p className="text-xs text-graydark/50">รายการในแท็บนี้</p><p className="mt-2 text-2xl font-black text-navy">{summary.count}<span className="ml-1 text-sm font-medium text-graydark/45">ครั้ง</span></p></div>
        <div className="app-card p-5"><p className="text-xs text-graydark/50">ความแม่นยำเฉลี่ย</p><p className="mt-2 text-2xl font-black text-navy">{summary.accuracy === null ? '—' : `${summary.accuracy}%`}</p></div>
        <div className="app-card p-5"><p className="text-xs text-graydark/50">จำนวนข้อที่ทำ</p><p className="mt-2 text-2xl font-black text-navy">{summary.totalQuestions}<span className="ml-1 text-sm font-medium text-graydark/45">ข้อ</span></p></div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex w-full gap-2 rounded-2xl border border-graylight/25 bg-white p-1.5 lg:w-auto">
          {TABS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => switchTab(id)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition lg:flex-none ${activeTab === id ? 'bg-navy text-white shadow-sm' : 'text-graydark/55 hover:bg-navy/5'}`}><Icon size={16} />{label}</button>)}
        </div>
        <p className="text-sm leading-6 text-graydark/50">เลือก “ดูผล” เพื่อเปิดสรุปคะแนนและเฉลยของรายการนั้น</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
        <section className="space-y-3">{activeItems.length ? activeItems.map((item) => <HistoryItem key={item.id} item={item} selected={selected?.id === item.id} onSelect={setSelected} />) : <EmptyState kind={activeTab} />}</section>
        <aside className="xl:sticky xl:top-6 xl:h-fit">{selected ? <AnswerReview item={selected} /> : <section className="app-card border-dashed p-8 text-center"><Eye className="mx-auto text-graydark/35" size={28} /><h2 className="mt-3 font-bold text-navy">เลือกผลที่ต้องการทบทวน</h2><p className="mt-2 text-sm leading-6 text-graydark/50">กดปุ่ม “ดูผล” ในรายการเพื่อดูคะแนน เวลา และเฉลยที่บันทึกไว้</p></section>}</aside>
      </div>
    </div>
  );
}
