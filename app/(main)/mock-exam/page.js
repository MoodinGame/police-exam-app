'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight,
  Clock3,
  FileText,
  LockKeyhole,
  PauseCircle,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { loadMockExamSets } from '@/lib/mockExamClient';
import { getLatestMockAttempts } from '@/lib/mockExamProgress';
import { MOCK_EXAM_TRACKS } from '@/lib/mockExamTracks';
import { getSession } from '@/lib/examSession';
import { useMembershipStatus } from '@/lib/useMembershipStatus';
import ResumeBanner from '@/components/ResumeBanner';

const difficultyMeta = {
  easy: { label: 'เริ่มต้น', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  medium: { label: 'ปานกลาง', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  hard: { label: 'ท้าทาย', className: 'border-rose-200 bg-rose-50 text-rose-700' },
};

function getDifficultyMeta(difficulty) {
  return difficultyMeta[difficulty] || { label: 'ทุกระดับ', className: 'border-slate-200 bg-slate-50 text-slate-600' };
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
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const session = getSession();
    setActiveSession(session?.kind === 'mock' ? session : null);
    setAttempts(getLatestMockAttempts());
  }, []);

  const availableExams = exams || [];
  // API ส่งมาเรียงตามวันเผยแพร่ล่าสุด ทำให้อ่านเป็น "ชุดที่ 3 → 2 → 1" สลับไปมา
  // จัดใหม่ให้เรียงตามสายงานแล้วตามชื่อชุด โดยใช้ numeric เพื่อให้ ชุดที่ 2 มาก่อน ชุดที่ 10
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
    <div className="pb-10">
      <ResumeBanner />

      {/* หัวเรื่อง: เหลือข้อความหลักกับตัวเลขสรุปสามค่า ไม่มีกล่องซ้อนกล่องอีก */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#17345B] via-[#22406b] to-[#0d6f92] px-5 py-7 text-white sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[26px] border-white/[0.06]" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-cyan-50">
            <Sparkles size={13} className="text-cyan-200" />
            MOCK EXAM
          </span>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">ข้อสอบเสมือนจริง</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
            จับเวลาเหมือนสนามสอบจริง พักกลางคันได้ และเก็บผลไว้ทบทวนย้อนหลัง
          </p>

          <dl className="mt-6 grid max-w-lg grid-cols-3 gap-3 border-t border-white/15 pt-5">
            <HeroStat value={loading ? '—' : availableExams.length} label="ชุดที่เปิดสอบ" />
            <HeroStat value={loading ? '—' : totalQuestions} label="ข้อสอบทั้งหมด" />
            <HeroStat value="180" label="นาทีต่อชุด" />
          </dl>
        </div>
      </section>

      {loadError && (
        <div className="mt-5 rounded-2xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}

      {/* แถบเลือกสายงาน อยู่บรรทัดเดียวกับหัวข้อ ลดจำนวนบล็อกบนหน้า */}
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="app-section-heading text-lg font-semibold text-navy sm:text-xl">เลือกชุดข้อสอบ</h2>
          <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5 ring-1 ring-line" role="group" aria-label="เลือกสายงาน">
            <TrackChip active={trackFilter === 'all'} onClick={() => setTrackFilter('all')}>ทั้งหมด</TrackChip>
            {MOCK_EXAM_TRACKS.map((track) => (
              <TrackChip key={track.id} active={trackFilter === track.id} onClick={() => setTrackFilter(track.id)}>
                {track.shortName || track.name}
              </TrackChip>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => <div key={item} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : visibleExams.length === 0 ? (
          <EmptyMockState hasAnyExam={availableExams.length > 0} />
        ) : (
          // เรียงลงมาเป็นรายการ อ่านลำดับชุดได้จากบนลงล่างโดยไม่ต้องกวาดสายตาซ้าย-ขวา
          <ol className="space-y-3" aria-label="รายการข้อสอบเสมือนจริง">
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

      {/* รายละเอียดสัดส่วนข้อสอบเก็บไว้ในหัวข้อที่กดเปิดได้ เพื่อไม่ให้หน้าหลักแน่น */}
      <section className="mt-6 space-y-3">
        {MOCK_EXAM_TRACKS.map((track) => <TrackScopeDetails key={track.id} track={track} />)}
      </section>

      <p className="mt-6 text-xs leading-6 text-graydark/55">
        ข้อสอบแต่ละชุดสุ่มจากคลังแบบฝึกหัดรายวิชาตามสัดส่วนของสายงาน · หยุดพักแล้วกลับมาทำต่อได้ ระบบจะเก็บคำตอบและเวลาที่เหลือไว้ให้
      </p>

      {startingExam && <StartMockModal exam={startingExam} onClose={() => setStartingExam(null)} />}
    </div>
  );
}

function HeroStat({ value, label }) {
  return (
    <div className="min-w-0">
      <dd className="text-2xl font-bold leading-none sm:text-3xl">{value}</dd>
      <dt className="mt-1.5 truncate text-[11px] text-white/60">{label}</dt>
    </div>
  );
}

function TrackChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
        active ? 'bg-navy text-white' : 'text-graydark hover:bg-accent-cyan/10 hover:text-navy'
      }`}
    >
      {children}
    </button>
  );
}

function TrackScopeDetails({ track }) {
  return (
    <details className="app-card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy">ขอบเขตข้อสอบ · {track.name}</p>
          <p className="mt-0.5 text-xs text-graydark/55">{track.totalQuestions} ข้อ · {track.durationMinutes} นาที · เกณฑ์ผ่าน {track.passScore}</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-graylight transition group-open:rotate-90" />
      </summary>
      <div className="grid gap-2 border-t border-line px-4 py-4 sm:grid-cols-2 sm:px-5">
        {track.blueprint.map((item) => (
          <div key={item.subjectId} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs">
            <span className="min-w-0 truncate text-graydark/75">{item.subjectName}</span>
            <strong className="shrink-0 text-navy">{item.questionCount} ข้อ</strong>
          </div>
        ))}
      </div>
    </details>
  );
}

function MockExamCard({ order, exam, attempt, isActive, canStart, isLoggedIn, onStart }) {
  const difficulty = getDifficultyMeta(exam.difficulty);

  return (
    <li className="app-card app-card-hover p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* เลขลำดับต้องอยู่ข้างชื่อชุดเสมอ ไม่งั้นบนมือถือจะกินบรรทัดเปล่าไปหนึ่งบรรทัด */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy/5 text-sm font-bold text-navy" aria-hidden="true">
            {order}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-6 text-navy [overflow-wrap:anywhere]">{exam.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {exam.trackName && <Badge className="bg-navy/5 text-navy">{exam.trackName}</Badge>}
              <Badge className={`border ${difficulty.className}`}>{difficulty.label}</Badge>
              {exam.isFree
                ? <Badge className="bg-emerald-50 text-emerald-700">ทดลองฟรี</Badge>
                : <Badge className="bg-amber-50 text-amber-700">สมาชิก</Badge>}
              {isActive && <Badge className="bg-accent-cyan/10 text-accent-cyan">กำลังทำอยู่</Badge>}
              {attempt && (
                <Badge className="bg-slate-100 text-graydark">ผลล่าสุด {attempt.score}/{attempt.total}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* ตัวเลขสำคัญเรียงแนวนอน คั่นด้วยเส้น อ่านเทียบระหว่างชุดได้ง่าย */}
        <dl className="flex shrink-0 divide-x divide-line rounded-2xl bg-slate-50/80 px-1 py-2">
          <Metric icon={FileText} value={exam.totalQuestions} label="ข้อสอบ" />
          <Metric icon={Clock3} value={exam.durationMinutes} label="นาที" />
          <Metric icon={Target} value={exam.passScore} label="เกณฑ์ผ่าน" />
        </dl>

        <div className="shrink-0 lg:w-52">
          <ExamAction exam={exam} isActive={isActive} hasAttempt={Boolean(attempt)} canStart={canStart} isLoggedIn={isLoggedIn} onStart={onStart} />
        </div>
      </div>
    </li>
  );
}

function Badge({ className, children }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${className}`}>{children}</span>;
}

function Metric({ icon: Icon, value, label }) {
  return (
    <div className="min-w-0 px-3 text-center sm:px-4">
      <dt className="sr-only">{label}</dt>
      <Icon size={14} className="mx-auto text-graylight" />
      <dd className="mt-1 truncate text-lg font-bold leading-tight text-navy">{value}</dd>
      <p className="text-[10px] text-graydark/50">{label}</p>
    </div>
  );
}

function ExamAction({ exam, isActive, hasAttempt, canStart, isLoggedIn, onStart }) {
  if (!canStart) {
    return (
      <Link href={isLoggedIn ? '/account' : '/login'} className="btn-outline w-full">
        <LockKeyhole size={16} />
        {isLoggedIn ? 'ปลดล็อกสิทธิ์สมาชิก' : 'เข้าสู่ระบบเพื่อเริ่มสอบ'}
      </Link>
    );
  }

  if (isActive) {
    return (
      <Link href={`/mock-exam/${exam.slug}`} className="btn-navy w-full">
        <PauseCircle size={17} />ทำข้อสอบต่อ<ChevronRight size={17} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onStart} className={`w-full ${hasAttempt ? 'btn-navy' : 'btn-primary'}`}>
      {hasAttempt ? <RotateCcw size={17} /> : <Play size={16} fill="currentColor" />}
      {hasAttempt ? 'ทำข้อสอบอีกครั้ง' : 'เริ่มข้อสอบ'}
      <ChevronRight size={17} />
    </button>
  );
}

function EmptyMockState({ hasAnyExam }) {
  return (
    <section className="rounded-3xl border border-dashed border-line bg-surface px-5 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-graylight"><FileText size={26} /></div>
      <h3 className="mt-4 text-base font-semibold text-navy">
        {hasAnyExam ? 'ยังไม่มีชุดข้อสอบของสายงานนี้' : 'ยังไม่มีชุดข้อสอบที่เปิดให้สอบ'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-graydark/55">
        {hasAnyExam
          ? 'ลองเลือกสายงานอื่น หรือกลับมาดูใหม่เมื่อแอดมินเปิดชุดสอบเพิ่ม'
          : 'แอดมินกำลังจัดเตรียมและตรวจทานคลังข้อสอบ ชุดใหม่จะปรากฏที่นี่เมื่อเผยแพร่แล้ว'}
      </p>
    </section>
  );
}

function StartMockModal({ exam, onClose }) {
  const difficulty = getDifficultyMeta(exam.difficulty);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    // ล็อกสกรอลล์พื้นหลัง ไม่งั้นหน้าใต้ modal ยังเลื่อนตามนิ้วได้
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  // ต้อง portal ไปที่ body เพราะ layout ด้านนอกมี transform ค้างจาก .animate-enter
  // ซึ่งทำให้ position: fixed ยึดกับ element นั้นแทนที่จะเป็นทั้งหน้าจอ
  return createPortal(
    // ใช้ items-start + my-auto เพราะถ้า center ตรง ๆ แล้วกล่องสูงกว่าจอ ส่วนหัวจะถูกดันขึ้นไปจนเลื่อนขึ้นไปดูไม่ได้
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#111a38]/60 px-4 py-6 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="start-mock-title">
      <div className="relative my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-surface shadow-[0_26px_70px_rgba(15,23,42,0.35)] animate-enter">
        <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-accent-cyan">พร้อมเริ่มสอบหรือยัง</p>
            <h2 id="start-mock-title" className="mt-1 text-lg font-semibold leading-7 text-navy [overflow-wrap:anywhere]">{exam.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-xl p-2 text-graylight transition hover:bg-slate-100 hover:text-navy" aria-label="ปิดหน้าต่าง"><X size={19} /></button>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {exam.trackName && <Badge className="bg-navy/5 text-navy">{exam.trackName}</Badge>}
            <Badge className={`border ${difficulty.className}`}>{difficulty.label}</Badge>
            {exam.isFree
              ? <Badge className="bg-emerald-50 text-emerald-700">ทดลองฟรี</Badge>
              : <Badge className="bg-amber-50 text-amber-700">สิทธิ์สมาชิก</Badge>}
          </div>

          <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-slate-50/70 py-4">
            <Metric icon={FileText} value={exam.totalQuestions} label="ข้อสอบ" />
            <Metric icon={Clock3} value={exam.durationMinutes} label="นาที" />
            <Metric icon={Target} value={exam.passScore} label="เกณฑ์ผ่าน" />
          </dl>

          {exam.blueprint?.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {exam.blueprint.map((item) => (
                <div key={item.subjectId} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                  <span className="min-w-0 truncate text-graydark/75">{item.subjectName}</span>
                  <strong className="shrink-0 text-navy">{item.questionCount} ข้อ</strong>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs leading-5 text-graydark/60">
            เมื่อกดเริ่ม ระบบจะเริ่มจับเวลาทันที · หากทำไม่จบสามารถหยุดพักได้ คำตอบและเวลาที่เหลือจะถูกบันทึกไว้
          </p>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-outline sm:w-auto">ไว้ก่อน</button>
            <Link href={`/mock-exam/${exam.slug}`} className="btn-primary sm:w-auto">
              <Play size={16} fill="currentColor" />เริ่มข้อสอบเลย
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
