'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  LockKeyhole,
  PauseCircle,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { mockExamSets } from '@/lib/mockExamCatalog';
import { getLatestMockAttempts } from '@/lib/mockExamProgress';
import { getSession } from '@/lib/examSession';
import ResumeBanner from '@/components/ResumeBanner';

export default function MockExamPage() {
  const [activeSession, setActiveSession] = useState(null);
  const [attempts, setAttempts] = useState({});
  const [startingExam, setStartingExam] = useState(null);

  useEffect(() => {
    const session = getSession();
    setActiveSession(session?.kind === 'mock' ? session : null);
    setAttempts(getLatestMockAttempts());
  }, []);

  const exams = [...mockExamSets].reverse();

  return (
    <div className="max-w-5xl">
      <ResumeBanner />

      <header className="mb-7 sm:mb-9">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="border-l-4 border-amber-500 pl-4">
            <h1 className="text-2xl sm:text-3xl font-semibold text-navy">ข้อสอบเสมือนจริง</h1>
            <p className="text-sm sm:text-base text-graydark/60 mt-1">เลือกชุดข้อสอบจำลอง ทำในเวลาจริง และกลับมาทำต่อได้ทุกเมื่อ</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-navy/5 px-4 py-2.5 text-sm text-navy">
            <ShieldCheck size={18} className="text-accent-cyan" />
            <span>{exams.length} ชุดข้อสอบ</span>
          </div>
        </div>
      </header>

      <section className="space-y-3" aria-label="รายการข้อสอบเสมือนจริง">
        {exams.map((exam) => {
          const isActive = activeSession?.examId === exam.id;
          const attempt = attempts[exam.id];

          return (
            <article
              key={exam.id}
              className="bg-white border border-graylight/25 rounded-2xl px-4 py-4 sm:px-6 sm:py-5 shadow-sm flex items-center gap-3 sm:gap-5"
            >
              <div className="w-12 h-12 shrink-0 rounded-xl bg-navy flex items-center justify-center text-amber-400">
                <FileText size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-navy text-base sm:text-lg truncate">{exam.title}</h2>
                  {exam.ready ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">
                      <CheckCircle2 size={13} /> พร้อมสอบ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium">
                      <LockKeyhole size={12} /> รออัปเดต
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-sm text-graydark/60 mt-1.5">
                  <span className="inline-flex items-center gap-1.5"><FileText size={14} /> {exam.totalQuestions} ข้อ</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {exam.durationMinutes} นาที</span>
                  {attempt && <span className="font-medium text-amber-700">ครั้งล่าสุด {attempt.score}/{attempt.total}</span>}
                </div>

                {!exam.ready && (
                  <p className="text-xs text-graydark/45 mt-2">แอดมินกำลังจัดชุดคำถาม ({exam.available}/{exam.totalQuestions} ข้อ)</p>
                )}
              </div>

              <ExamAction
                exam={exam}
                isActive={isActive}
                hasAttempt={Boolean(attempt)}
                onStart={() => setStartingExam(exam)}
              />
            </article>
          );
        })}
      </section>

      <section className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:p-5 flex gap-3">
        <CircleAlert className="text-accent-cyan shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-graydark/70 leading-relaxed">
          ข้อสอบแต่ละชุดใช้คลังคำถามแยกจากแบบฝึกหัดรายวิชา เมื่อแอดมินเผยแพร่คำถามครบ 150 ข้อตามสัดส่วน ระบบจะเปิดให้เริ่มสอบอัตโนมัติ
        </p>
      </section>

      {startingExam && <StartMockModal exam={startingExam} onClose={() => setStartingExam(null)} />}
    </div>
  );
}

function ExamAction({ exam, isActive, hasAttempt, onStart }) {
  const className = 'shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 sm:px-4 py-2.5 text-sm font-medium transition-colors';

  if (!exam.ready) {
    return <span className={`${className} bg-graylight/15 text-graydark/45 cursor-not-allowed`}><LockKeyhole size={15} /><span className="hidden sm:inline">กำลังจัดทำ</span></span>;
  }

  if (isActive) {
    return <Link href={`/mock-exam/${exam.id}`} className={`${className} bg-navy text-white hover:bg-navy/90`}><PauseCircle size={16} /> ทำต่อ <ChevronRight size={16} /></Link>;
  }

  if (hasAttempt) {
    return <button type="button" onClick={onStart} className={`${className} bg-navy text-white hover:bg-navy/90`}><RotateCcw size={16} /><span className="hidden sm:inline">ทำอีกครั้ง</span><ChevronRight size={16} /></button>;
  }

  return <button type="button" onClick={onStart} className={`${className} bg-navy text-white hover:bg-navy/90`}><span className="hidden sm:inline">เริ่มสอบ</span><span className="sm:hidden">เริ่ม</span><ChevronRight size={16} /></button>;
}

function StartMockModal({ exam, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-navy/55 px-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="start-mock-title">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center relative">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-graydark/40 hover:text-graydark" aria-label="ปิดหน้าต่าง"><X size={20} /></button>
        <div className="w-20 h-20 mx-auto rounded-full border-4 border-amber-300 text-amber-500 flex items-center justify-center mb-5">
          <CircleAlert size={36} />
        </div>
        <h2 id="start-mock-title" className="text-2xl font-semibold text-navy">เริ่มข้อสอบเสมือนจริง?</h2>
        <p className="font-medium text-graydark mt-5">{exam.title}</p>
        <p className="text-sm text-graydark/60 mt-1">ข้อสอบ {exam.totalQuestions} ข้อ · จับเวลา {exam.durationMinutes} นาที</p>
        <p className="text-xs text-graydark/50 mt-3">เมื่อเริ่มแล้ว นาฬิกาจะเดินทันที แต่สามารถหยุดพักและกลับมาทำต่อได้</p>
        <div className="flex justify-center gap-3 mt-7">
          <Link href={`/mock-exam/${exam.id}`} className="rounded-xl bg-navy text-white px-5 py-3 text-sm font-medium hover:bg-navy/90">เริ่มสอบเลย</Link>
          <button type="button" onClick={onClose} className="rounded-xl bg-graylight text-white px-5 py-3 text-sm font-medium hover:bg-graylight/90">ยังไม่พร้อม</button>
        </div>
      </div>
    </div>
  );
}
