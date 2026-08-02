'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Gauge,
  LockKeyhole,
  PauseCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
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
  const visibleExams = trackFilter === 'all'
    ? availableExams
    : availableExams.filter((exam) => exam.trackId === trackFilter);
  const totalQuestions = availableExams.reduce((sum, exam) => sum + exam.totalQuestions, 0);

  return (
    <div className="max-w-6xl pb-8">
      <ResumeBanner />

      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#172856] via-[#26365f] to-[#0b7497] px-5 py-6 text-white shadow-[0_22px_48px_rgba(23,40,86,0.24)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[28px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-28 left-[38%] h-52 w-52 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-50 backdrop-blur-sm">
              <Sparkles size={14} className="text-cyan-200" />
              MOCK EXAM EXPERIENCE
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">ข้อสอบเสมือนจริง</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
              จำลองบรรยากาศการสอบจริง จับเวลา ดูความคืบหน้า และบันทึกผลไว้ทบทวนภายหลัง
            </p>
            <div className="mt-5 grid max-w-2xl gap-2 sm:grid-cols-3">
              <HeroFeature icon={Clock3} label="จับเวลาตามชุดสอบ" />
              <HeroFeature icon={Target} label="เป้าหมายผ่านชัดเจน" />
              <HeroFeature icon={PauseCircle} label="พักแล้วกลับมาทำต่อได้" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-slate-950/20 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-white/65">
              <span>พร้อมให้คุณฝึก</span>
              <ShieldCheck size={17} className="text-cyan-200" />
            </div>
            <p className="mt-2 text-4xl font-black">{exams === null ? '—' : availableExams.length}</p>
            <p className="text-sm font-medium text-white/80">ชุดข้อสอบที่เปิดใช้งาน</p>
            <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/65">
              รวม <span className="font-bold text-white">{exams === null ? '…' : totalQuestions}</span> ข้อในคลัง Mock Exam
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2" aria-label="ขอบเขตข้อสอบ Mock Exam">
        {MOCK_EXAM_TRACKS.map((track) => <TrackScopeCard key={track.id} track={track} />)}
      </section>

      {loadError && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}

      <section className="mt-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-accent-cyan">เลือกชุดที่พร้อมสำหรับคุณ</p>
            <h2 className="mt-1 text-xl font-bold text-navy sm:text-2xl">เริ่มฝึกแบบเสมือนจริง</h2>
          </div>
          {exams !== null && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-graydark/65 shadow-sm">
              {availableExams.length} ชุดที่เผยแพร่
            </span>
          )}
        </div>

        <div className="mb-5 flex flex-wrap gap-2" aria-label="เลือกสายงาน Mock Exam">
          <button type="button" onClick={() => setTrackFilter('all')} className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${trackFilter === 'all' ? 'bg-navy text-white shadow-sm' : 'border border-slate-200 bg-white text-graydark hover:border-cyan-300 hover:text-cyan-700'}`}>ทุกสายงาน</button>
          {MOCK_EXAM_TRACKS.map((track) => <button key={track.id} type="button" onClick={() => setTrackFilter(track.id)} className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${trackFilter === track.id ? 'border-navy bg-navy text-white shadow-sm' : 'border-slate-200 bg-white text-graydark hover:border-cyan-300 hover:text-cyan-700'}`}>{track.name}</button>)}
        </div>

        {exams === null && !loadError ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((item) => <div key={item} className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white/70" />)}
          </div>
        ) : exams && exams.length === 0 ? (
          <EmptyMockState />
        ) : visibleExams.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm"><p className="text-lg font-bold text-navy">ยังไม่มีชุด Mock Exam ของสายงานนี้</p><p className="mt-2 text-sm text-graydark/55">แอดมินจะเปิดชุดสอบเมื่อจัดข้อสอบครบตามสัดส่วน 150 ข้อ</p></div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2" aria-label="รายการข้อสอบเสมือนจริง">
            {visibleExams.map((exam) => (
              <MockExamCard
                key={exam.id}
                exam={exam}
                attempt={attempts[exam.slug]}
                isActive={activeSession?.examId === exam.slug}
                canStart={!accessLoading && Boolean(exam.canAccess)}
                isLoggedIn={isLoggedIn}
                onStart={() => setStartingExam(exam)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-7 grid gap-3 md:grid-cols-3">
        <InfoCard icon={Play} title="เริ่มเมื่อพร้อม" description="กดเริ่มสอบแล้วนาฬิกาจะทำงานตามเวลาของชุดนั้น" tone="cyan" />
        <InfoCard icon={CheckCircle2} title="เลือกตอบได้ทุกข้อ" description="ข้ามข้อไว้ก่อน และย้อนกลับมาตรวจคำตอบได้ตลอด" tone="emerald" />
        <InfoCard icon={Trophy} title="ดูผลหลังส่งคำตอบ" description="คะแนนและประวัติการทำข้อสอบจะบันทึกไว้ในบัญชีของคุณ" tone="amber" />
      </section>

      <section className="mt-5 flex gap-3 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50/50 p-4 sm:p-5">
        <CircleAlert className="mt-0.5 shrink-0 text-accent-cyan" size={20} />
        <p className="text-sm leading-relaxed text-graydark/70">
          ข้อสอบ Mock ใช้คลังคำถามแยกจากแบบฝึกหัดรายวิชา แอดมินจะเปิดแต่ละชุดหลังตรวจทานและเผยแพร่เรียบร้อยแล้ว
        </p>
      </section>

      {startingExam && <StartMockModal exam={startingExam} onClose={() => setStartingExam(null)} />}
    </div>
  );
}

function HeroFeature({ icon: Icon, label }) {
  return <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-medium text-white/85"><Icon size={15} className="text-cyan-200" />{label}</span>;
}

function TrackScopeCard({ track }) {
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-cyan-50/60 px-4 py-3"><div><p className="text-sm font-black text-navy">{track.name}</p><p className="mt-0.5 text-xs text-graydark/55">{track.totalQuestions} ข้อ · {track.durationMinutes} นาที</p></div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">ผ่าน {track.passScore}</span></div><div className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-3 text-xs leading-5 text-graydark/70">{track.blueprint.map((item) => <span key={item.subjectId}><b className="text-navy">{item.subjectName}</b> {item.questionCount}</span>)}</div></article>;
}

function MockExamCard({ exam, attempt, isActive, canStart, isLoggedIn, onStart }) {
  const difficulty = getDifficultyMeta(exam.difficulty);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_30px_rgba(43,45,66,0.07)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_20px_40px_rgba(43,45,66,0.13)] sm:p-6">
      <div className="pointer-events-none absolute -right-9 -top-10 h-36 w-36 rounded-full bg-cyan-100/55 blur-2xl transition group-hover:bg-cyan-200/70" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-[#354474] text-amber-300 shadow-lg shadow-navy/15">
              <FileText size={23} />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                {exam.isFree ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700"><Sparkles size={12} /> ชุดทดลองฟรี</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700"><LockKeyhole size={11} /> สมาชิก</span>
                )}
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${difficulty.className}`}>{difficulty.label}</span>
                {exam.trackName && <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-700">{exam.trackName}</span>}
              </div>
              <h3 className="truncate text-lg font-bold text-navy">{exam.title}</h3>
            </div>
          </div>
          {isActive && <span className="shrink-0 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-700">กำลังทำอยู่</span>}
        </div>

        <p className="mt-4 min-h-[3rem] text-sm leading-6 text-graydark/60">{exam.description || 'ข้อสอบจำลองพร้อมจับเวลา เพื่อทดสอบความพร้อมก่อนสอบจริง'}</p>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3">
          <Metric icon={FileText} value={`${exam.totalQuestions}`} label="ข้อสอบ" />
          <Metric icon={Clock3} value={`${exam.durationMinutes}`} label="นาที" />
          <Metric icon={Target} value={`${exam.passScore}`} label="เป้าหมายผ่าน" />
        </div>

        {exam.blueprint?.length > 0 && (
          <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/50 px-3 py-2.5">
            <p className="text-[11px] font-bold text-cyan-800">สัดส่วนข้อสอบ</p>
            <p className="mt-1 text-xs leading-5 text-cyan-950/70">{exam.blueprint.map((item) => `${item.subjectName} ${item.questionCount}`).join(' · ')} ข้อ</p>
          </div>
        )}

        {attempt ? (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-800"><BarChart3 size={15} /> ผลล่าสุด</span>
            <span className="font-bold text-amber-700">{attempt.score}/{attempt.total} ข้อ</span>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-xs text-graydark/45"><Gauge size={15} className="text-accent-cyan" /> เริ่มทำเพื่อเก็บสถิติความแม่นยำของคุณ</div>
        )}

        <div className="mt-5"><ExamAction exam={exam} isActive={isActive} hasAttempt={Boolean(attempt)} canStart={canStart} isLoggedIn={isLoggedIn} onStart={onStart} /></div>
      </div>
    </article>
  );
}

function Metric({ icon: Icon, value, label }) {
  return <div className="min-w-0 text-center"><Icon size={15} className="mx-auto text-graylight" /><p className="mt-1 truncate text-base font-black text-navy">{value}</p><p className="text-[10px] text-graydark/50">{label}</p></div>;
}

function ExamAction({ exam, isActive, hasAttempt, canStart, isLoggedIn, onStart }) {
  const className = 'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition duration-200';

  if (!canStart) {
    return (
      <Link href={isLoggedIn ? '/account' : '/login'} className={`${className} border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100`}>
        <LockKeyhole size={16} />{isLoggedIn ? 'ปลดล็อกสิทธิ์สมาชิก' : 'เข้าสู่ระบบเพื่อเริ่มสอบ'}
      </Link>
    );
  }

  if (isActive) {
    return <Link href={`/mock-exam/${exam.slug}`} className={`${className} bg-gradient-to-r from-navy to-[#36416c] text-white shadow-lg shadow-navy/15 hover:-translate-y-0.5`}><PauseCircle size={17} />ทำข้อสอบต่อ<ChevronRight size={17} /></Link>;
  }

  if (hasAttempt) {
    return <button type="button" onClick={onStart} className={`${className} bg-gradient-to-r from-navy to-[#36416c] text-white shadow-lg shadow-navy/15 hover:-translate-y-0.5`}><RotateCcw size={17} />ทำข้อสอบอีกครั้ง<ChevronRight size={17} /></button>;
  }

  return <button type="button" onClick={onStart} className={`${className} bg-gradient-to-r from-accent-cyan to-[#168bb4] text-white shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5 hover:shadow-cyan-500/30`}><Play size={17} fill="currentColor" />เริ่มข้อสอบ<ChevronRight size={17} /></button>;
}

function InfoCard({ icon: Icon, title, description, tone }) {
  const toneClass = {
    cyan: 'border-cyan-100 bg-cyan-50/55 text-cyan-700',
    emerald: 'border-emerald-100 bg-emerald-50/55 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/55 text-amber-700',
  }[tone];
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}><Icon size={18} /></div><h3 className="mt-3 text-sm font-bold text-navy">{title}</h3><p className="mt-1 text-xs leading-5 text-graydark/55">{description}</p></article>;
}

function EmptyMockState() {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-graylight"><FileText size={27} /></div>
      <h3 className="mt-4 text-lg font-bold text-navy">ยังไม่มีชุดข้อสอบที่เปิดให้สอบ</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-graydark/55">แอดมินกำลังจัดเตรียมและตรวจทานคลังข้อสอบ ชุดใหม่จะปรากฏที่หน้านี้เมื่อเผยแพร่แล้ว</p>
    </section>
  );
}

function StartMockModal({ exam, onClose }) {
  const difficulty = getDifficultyMeta(exam.difficulty);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111a38]/65 px-4 py-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="start-mock-title">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] bg-white shadow-[0_26px_70px_rgba(15,23,42,0.38)] animate-enter">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#172856] via-[#293864] to-[#0b789c] px-6 pb-8 pt-7 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-9 -top-10 h-36 w-36 rounded-full border-[18px] border-white/10" />
          <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="ปิดหน้าต่าง"><X size={20} /></button>
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-amber-300"><FileText size={24} /></div>
            <div><p className="text-xs font-semibold tracking-[0.16em] text-cyan-100">READY TO BEGIN</p><h2 id="start-mock-title" className="mt-1 text-2xl font-black">พร้อมเริ่มสอบไหม?</h2></div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {exam.isFree ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">ชุดทดลองฟรี</span> : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">สิทธิ์สมาชิก</span>}
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${difficulty.className}`}>{difficulty.label}</span>
          </div>
          <h3 className="mt-4 text-xl font-bold leading-8 text-navy">{exam.title}</h3>
          <p className="mt-1 text-sm leading-6 text-graydark/60">เมื่อกดเริ่ม ระบบจะเปิดข้อสอบและเริ่มนับเวลาตามชุดที่เลือก</p>

          {exam.trackName && <p className="mt-3 inline-flex rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">{exam.trackName} · ข้อสอบเต็มรูปแบบ</p>}

          <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-4">
            <ModalMetric icon={FileText} value={`${exam.totalQuestions} ข้อ`} label="จำนวนข้อสอบ" />
            <ModalMetric icon={Clock3} value={`${exam.durationMinutes} นาที`} label="เวลาทำข้อสอบ" />
            <ModalMetric icon={Target} value={`${exam.passScore} ข้อ`} label="เป้าหมายผ่าน" />
          </div>

          {exam.blueprint?.length > 0 && (
            <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-sm font-bold text-navy">สัดส่วนรายวิชา</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {exam.blueprint.map((item) => <div key={item.subjectId} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs"><span className="font-medium text-graydark/75">{item.subjectName}</span><strong className="text-navy">{item.questionCount} ข้อ</strong></div>)}
              </div>
            </section>
          )}

          <div className="mt-5 flex gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3.5">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-accent-cyan" />
            <p className="text-xs leading-5 text-cyan-950/75">หากยังทำไม่เสร็จ คุณหยุดพักหรือออกจากหน้าได้ ระบบจะบันทึกคำตอบและเวลาที่เหลือไว้ให้ทำต่อภายหลัง</p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-graydark/70 transition hover:bg-slate-50">ไว้ก่อน</button>
            <Link href={`/mock-exam/${exam.slug}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-[#168bb4] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5"><Play size={17} fill="currentColor" />เริ่มข้อสอบเลย</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalMetric({ icon: Icon, value, label }) {
  return <div className="min-w-0 px-2 text-center"><Icon size={16} className="mx-auto text-accent-cyan" /><p className="mt-1.5 whitespace-nowrap text-sm font-black text-navy">{value}</p><p className="mt-0.5 text-[10px] text-graydark/50">{label}</p></div>;
}
