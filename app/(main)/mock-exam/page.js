'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  LockKeyhole,
  PauseCircle,
  Play,
  RotateCcw,
  Target,
  X,
} from 'lucide-react';
import { loadMockExamSets } from '@/lib/mockExamClient';
import { getLatestMockAttempts } from '@/lib/mockExamProgress';
import { MOCK_EXAM_TRACKS } from '@/lib/mockExamTracks';
import { getSession } from '@/lib/examSession';
import { useMembershipStatus } from '@/lib/useMembershipStatus';

const difficultyMeta = {
  easy: { label: 'เริ่มต้น', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  medium: { label: 'ปานกลาง', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  hard: { label: 'ท้าทาย', className: 'border-rose-200 bg-rose-50 text-rose-700' },
};

const trackTone = {
  'general-affairs': {
    label: 'text-[#4d78bc]',
    number: 'bg-[#eaf2ff] text-[#4d78bc]',
    badge: 'border border-[#cfe0fb] bg-[#f2f7ff] text-[#4d78bc]',
    filter: 'border-[#cfe0fb] bg-[#f7faff] text-[#4d78bc] hover:border-[#9fc2f2] hover:bg-[#f0f6ff]',
    filterActive: 'border-[#c0d7f8] bg-[#eaf2ff] text-[#3968ac] shadow-none',
  },
  patrol: {
    label: 'text-[#378b70]',
    number: 'bg-[#e8f7f1] text-[#378b70]',
    badge: 'border border-[#c4eadc] bg-[#f1fbf7] text-[#378b70]',
    filter: 'border-[#c4eadc] bg-[#f7fcfa] text-[#378b70] hover:border-[#92d8c0] hover:bg-[#effaf5]',
    filterActive: 'border-[#b6e4d4] bg-[#e8f7f1] text-[#2d765e] shadow-none',
  },
};

function getDifficultyMeta(difficulty) {
  return difficultyMeta[difficulty] || { label: 'ทุกระดับ', className: 'border-slate-200 bg-slate-50 text-slate-600' };
}

function getTrackTone(trackId) {
  return trackTone[trackId] || {
    label: 'text-accent-cyan',
    number: 'bg-navy text-white',
    badge: 'border border-line bg-white text-navy',
    filter: 'border border-line bg-white text-graydark hover:border-accent-cyan/45 hover:bg-cyan-50/40 hover:text-navy',
    filterActive: 'bg-navy text-white shadow-[0_7px_16px_rgba(23,52,91,0.18)]',
  };
}

export default function MockExamPage() {
  const [exams, setExams] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [attempts, setAttempts] = useState({});
  const [startingExam, setStartingExam] = useState(null);
  const [trackFilter, setTrackFilter] = useState('all');
  const { loading: accessLoading, isLoggedIn } = useMembershipStatus();

  useEffect(() => {
    let active = true;
    loadMockExamSets()
      .then((list) => {
        if (active) setExams(list);
      })
      .catch(() => {
        if (active) setLoadError('โหลดรายการชุดข้อสอบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const session = getSession();
    setActiveSession(session?.kind === 'mock' ? session : null);
    setAttempts(getLatestMockAttempts());
  }, []);

  const availableExams = exams || [];
  const orderedExams = useMemo(() => [...availableExams].sort((a, b) => (
    (a.trackName || '').localeCompare(b.trackName || '', 'th')
    || a.title.localeCompare(b.title, 'th', { numeric: true })
  )), [availableExams]);
  const visibleExams = trackFilter === 'all'
    ? orderedExams
    : orderedExams.filter((exam) => exam.trackId === trackFilter);
  const totalQuestions = availableExams.reduce((sum, exam) => sum + exam.totalQuestions, 0);
  const loading = exams === null && !loadError;

  return (
    <div className="pb-12">
      <MockExamHero
        activeSession={activeSession}
        examCount={availableExams.length}
        isLoggedIn={isLoggedIn}
        loading={loading}
        totalQuestions={totalQuestions}
      />

      {loadError && (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}

      <section className="mt-9" aria-labelledby="mock-exam-list-title">
        <div className="flex flex-col gap-5 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-accent-cyan">EXAM LIBRARY</p>
            <h2 id="mock-exam-list-title" className="mt-1 text-xl font-bold tracking-tight text-navy sm:text-2xl">เลือกสนามสอบที่ต้องการฝึก</h2>
            <p className="mt-1 text-sm text-graydark/60">เลือกชุดที่พร้อม แล้วเริ่มฝึกได้ทันที</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-graydark/55">
            <span className="rounded-full border border-line bg-white px-3 py-1.5">{loading ? 'กำลังเตรียมชุดสอบ' : `${visibleExams.length} ชุดที่แสดง`}</span>
            {!loading && <span className="rounded-full bg-navy/5 px-3 py-1.5 text-navy">รวม {totalQuestions.toLocaleString('th-TH')} ข้อ</span>}
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="เลือกสายงาน">
          <TrackFilterButton active={trackFilter === 'all'} onClick={() => setTrackFilter('all')}>ทั้งหมด</TrackFilterButton>
          {MOCK_EXAM_TRACKS.map((track) => (
            <TrackFilterButton key={track.id} active={trackFilter === track.id} tone={getTrackTone(track.id)} onClick={() => setTrackFilter(track.id)}>
              {track.shortName || track.name}
            </TrackFilterButton>
          ))}
        </div>

        {loading ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => <div key={item} className="skeleton h-[22rem] rounded-3xl" />)}
          </div>
        ) : visibleExams.length === 0 ? (
          <EmptyMockState hasAnyExam={availableExams.length > 0} />
        ) : (
          <ol className="mt-5 grid gap-4 md:grid-cols-2" aria-label="รายการข้อสอบเสมือนจริง">
            {visibleExams.map((exam, index) => (
              <MockExamCard
                key={exam.id}
                order={index + 1}
                exam={exam}
                attempt={attempts[exam.slug]}
                isActive={activeSession?.examId === exam.slug}
                canStart={!accessLoading && Boolean(exam.canAccess)}
                isLoggedIn={isLoggedIn}
                onStart={() => setStartingExam(exam)}
              />
            ))}
          </ol>
        )}
      </section>

      {startingExam && <StartMockModal exam={startingExam} onClose={() => setStartingExam(null)} />}
    </div>
  );
}

function MockExamHero({ activeSession, examCount, isLoggedIn, loading, totalQuestions }) {
  return (
    <section className="rounded-3xl border border-line bg-white px-5 py-6 shadow-[0_12px_35px_rgba(30,64,100,0.06)] sm:px-8 sm:py-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-accent-cyan"><span className="h-2 w-2 rounded-full bg-accent-cyan animate-pulse" />MOCK EXAM</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-3xl">ข้อสอบเสมือนจริง</h1>
          <p className="mt-1.5 text-sm text-graydark/60">ฝึกทำข้อสอบแบบจับเวลา ก่อนลงสนามจริง</p>
        </div>
        {activeSession ? <Link href={`/mock-exam/${activeSession.examId}`} className="btn-primary shrink-0"><PauseCircle size={16} />ทำต่อ<ArrowRight size={16} /></Link> : <p className="text-xs text-graydark/45">{isLoggedIn ? 'บันทึกผลอัตโนมัติ' : 'เข้าสู่ระบบเพื่อบันทึกผล'}</p>}
      </div>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-xs font-medium text-graydark/60">
        <span className="inline-flex items-center gap-1.5"><FileText size={15} className="text-accent-cyan" />{loading ? 'กำลังเตรียมชุดสอบ' : `${examCount} ชุด · ${totalQuestions.toLocaleString('th-TH')} ข้อ`}</span>
        <span className="inline-flex items-center gap-1.5"><Clock3 size={15} className="text-accent-cyan" />จับเวลา 180 นาที</span>
      </div>
    </section>
  );
}

function TrackFilterButton({ active, onClick, children, tone }) {
  return (
    <button type="button" onClick={onClick} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 ${active ? (tone?.filterActive || 'bg-navy text-white shadow-[0_7px_16px_rgba(23,52,91,0.18)]') : (tone?.filter || 'border border-line bg-white text-graydark hover:border-accent-cyan/45 hover:bg-cyan-50/40 hover:text-navy')}`}>
      {children}
    </button>
  );
}

function MockExamCard({ order, exam, attempt, isActive, canStart, isLoggedIn, onStart }) {
  const difficulty = getDifficultyMeta(exam.difficulty);
  const tone = getTrackTone(exam.trackId);

  return (
    <li className="mock-exam-card" style={{ animationDelay: `${Math.min((order - 1) * 70, 280)}ms` }}>
      <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-accent-cyan/40 hover:shadow-[0_18px_42px_rgba(30,64,100,0.12)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold shadow-[0_6px_16px_rgba(23,52,91,0.08)] sm:h-11 sm:w-11 sm:rounded-2xl ${tone.number}`}>{String(order).padStart(2, '0')}</span>
            <div className="min-w-0">
              <p className={`truncate text-xs font-semibold ${tone.label}`}>{exam.trackName || 'MOCK EXAM'}</p>
              <h3 className="mt-0.5 text-[17px] font-bold leading-6 text-navy [overflow-wrap:anywhere] sm:mt-1 sm:text-lg sm:leading-7">{exam.title}</h3>
            </div>
          </div>
          <Badge className={`hidden shrink-0 border sm:inline-flex ${difficulty.className}`}>{difficulty.label}</Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge className={`border sm:hidden ${difficulty.className}`}>{difficulty.label}</Badge>
          {exam.isFree ? <Badge className="bg-emerald-50 text-emerald-700">ทดลองฟรี</Badge> : <Badge className="bg-amber-50 text-amber-700">สำหรับสมาชิก</Badge>}
          {isActive && <Badge className="bg-accent-cyan/10 text-accent-cyan">กำลังทำอยู่</Badge>}
          {attempt && <Badge className="bg-slate-100 text-graydark">ล่าสุด {attempt.score}/{attempt.total} คะแนน</Badge>}
        </div>

        <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-slate-50/75 py-2.5 sm:mt-5 sm:py-3">
          <Metric icon={FileText} value={exam.totalQuestions} label="ข้อสอบ" />
          <Metric icon={Clock3} value={exam.durationMinutes} label="นาที" />
          <Metric icon={Target} value={exam.passScore} label="ผ่าน" />
        </dl>

        <div className="mt-auto pt-4 sm:pt-5">
          <ExamAction exam={exam} isActive={isActive} hasAttempt={Boolean(attempt)} canStart={canStart} isLoggedIn={isLoggedIn} onStart={onStart} />
        </div>
      </article>
    </li>
  );
}

function Badge({ className, children }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}>{children}</span>;
}

function Metric({ icon: Icon, value, label }) {
  return (
    <div className="min-w-0 px-2 text-center sm:px-3">
      <dt className="sr-only">{label}</dt>
      <Icon size={14} className="mx-auto text-graylight" />
      <dd className="mt-1 truncate text-base font-bold leading-tight text-navy sm:text-lg">{value}</dd>
      <p className="text-[10px] font-medium text-graydark/50">{label}</p>
    </div>
  );
}

function ExamAction({ exam, isActive, hasAttempt, canStart, isLoggedIn, onStart }) {
  if (!canStart) {
    return <Link href={isLoggedIn ? '/account' : '/login'} className="btn-outline w-full !py-2.5"><LockKeyhole size={16} />{isLoggedIn ? 'ดูสิทธิ์สมาชิก' : 'เข้าสู่ระบบเพื่อเริ่มสอบ'}<ArrowRight size={16} /></Link>;
  }
  if (isActive) {
    return <Link href={`/mock-exam/${exam.slug}`} className="btn-navy w-full !py-2.5"><PauseCircle size={17} />ทำข้อสอบต่อ<ChevronRight size={17} /></Link>;
  }
  return <button type="button" onClick={onStart} className={`w-full !py-2.5 ${hasAttempt ? 'btn-navy' : 'btn-primary'}`}>{hasAttempt ? <RotateCcw size={17} /> : <Play size={16} fill="currentColor" />}{hasAttempt ? 'ทำข้อสอบอีกครั้ง' : 'เริ่มข้อสอบ'}<ChevronRight size={17} /></button>;
}

function EmptyMockState({ hasAnyExam }) {
  return (
    <section className="mt-5 rounded-3xl border border-dashed border-line bg-white px-5 py-9 text-center sm:py-10">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-navy/[0.05] text-navy"><BookOpenCheck size={21} /></div>
      <h3 className="mt-4 text-base font-bold text-navy">{hasAnyExam ? 'ยังไม่มีชุดข้อสอบของสายงานนี้' : 'กำลังเตรียมชุดข้อสอบ'}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-graydark/60">{hasAnyExam ? 'ลองเลือกสายงานอื่น หรือกลับมาดูอีกครั้งในภายหลัง' : 'ระหว่างนี้ คุณสามารถฝึกแบบรายวิชาได้'}</p>
      <Link href="/practice" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-cyan transition hover:text-navy">ฝึกแบบรายวิชา <ArrowRight size={16} /></Link>
    </section>
  );
}

function StartMockModal({ exam, onClose }) {
  const difficulty = getDifficultyMeta(exam.difficulty);
  const tone = getTrackTone(exam.trackId);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#111a38]/60 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="start-mock-title">
      <div className="mock-exam-modal-card relative my-auto w-full max-w-xl overflow-hidden rounded-[2rem] bg-surface shadow-[0_26px_70px_rgba(15,23,42,0.35)] animate-enter">
        <div className="border-b border-line bg-[linear-gradient(135deg,rgba(32,43,82,0.07),rgba(112,207,237,0.12))] px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="text-[11px] font-bold tracking-[0.14em] text-accent-cyan">READY TO BEGIN</p><h2 id="start-mock-title" className="mt-1 text-xl font-bold leading-7 text-navy [overflow-wrap:anywhere]">{exam.title}</h2></div>
            <button type="button" onClick={onClose} className="shrink-0 rounded-xl p-2 text-graylight transition hover:bg-white hover:text-navy" aria-label="ปิดหน้าต่าง"><X size={19} /></button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {exam.trackName && <Badge className={tone.badge}>{exam.trackName}</Badge>}
            <Badge className={`border ${difficulty.className}`}>{difficulty.label}</Badge>
            {exam.isFree ? <Badge className="bg-emerald-50 text-emerald-700">ทดลองฟรี</Badge> : <Badge className="bg-amber-50 text-amber-700">สิทธิ์สมาชิก</Badge>}
          </div>
        </div>
        <div className="px-6 py-5 sm:px-7 sm:py-6">
          <dl className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-slate-50/70 py-4"><Metric icon={FileText} value={exam.totalQuestions} label="ข้อสอบ" /><Metric icon={Clock3} value={exam.durationMinutes} label="นาที" /><Metric icon={Target} value={exam.passScore} label="เกณฑ์ผ่าน" /></dl>
          {exam.blueprint?.length > 0 && <div className="mt-5 grid gap-2 sm:grid-cols-2">{exam.blueprint.map((item) => <div key={item.subjectId} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs"><span className="min-w-0 truncate text-graydark/75">{item.subjectName}</span><strong className="shrink-0 text-navy">{item.questionCount} ข้อ</strong></div>)}</div>}
          <div className="mt-5 flex gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3.5 text-xs leading-5 text-cyan-950"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent-cyan" /><p>เมื่อเริ่มสอบ ระบบจะจับเวลาทันที คุณพักการสอบได้ และคำตอบพร้อมเวลาที่เหลือจะถูกบันทึกไว้เพื่อกลับมาทำต่อ</p></div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="btn-outline sm:w-auto">ไว้ก่อน</button><Link href={`/mock-exam/${exam.slug}`} className="btn-primary sm:w-auto"><Play size={16} fill="currentColor" />เริ่มข้อสอบเลย</Link></div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
