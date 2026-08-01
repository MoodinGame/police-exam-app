'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Flag,
  PauseCircle,
  Send,
  XCircle,
} from 'lucide-react';
import { getMockExamSet, getMockQuestionsForSet } from '@/lib/mockExamCatalog';
import { saveMockAttempt } from '@/lib/mockExamProgress';
import { clearSessionIf, getSessionFor, mockSessionId, saveSession } from '@/lib/examSession';

const LETTERS = ['A', 'B', 'C', 'D'];

function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds || 0);
  const hours = Math.floor(safeSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((safeSeconds % 3600) / 60).toString().padStart(2, '0');
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${remainingSeconds}`;
}

export default function MockExamTakingPage() {
  const { examId } = useParams();
  const router = useRouter();
  const exam = getMockExamSet(examId);
  const questions = useMemo(() => getMockQuestionsForSet(examId), [examId]);
  const sessionId = mockSessionId(examId);
  const durationSeconds = (exam?.durationMinutes || 0) * 60;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [phase, setPhase] = useState('taking');
  const [restored, setRestored] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const recorded = useRef(false);

  const ready = Boolean(exam?.ready && questions.length === exam?.totalQuestions);
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.keys(flagged).filter((id) => flagged[id]).length;
  const score = questions.reduce(
    (sum, question) => sum + (answers[question.id] === question.answerIndex ? 1 : 0),
    0,
  );

  useEffect(() => {
    if (!exam) {
      setRestored(true);
      return;
    }

    const saved = getSessionFor(sessionId);
    if (saved?.kind === 'mock' && saved.examId === exam.id) {
      setCurrent(Math.min(saved.current || 0, Math.max(questions.length - 1, 0)));
      setAnswers(saved.answers || {});
      setFlagged(saved.flagged || {});
      setSecondsLeft(saved.secondsLeft ?? durationSeconds);
    } else {
      setSecondsLeft(durationSeconds);
    }
    setRestored(true);
  }, [durationSeconds, exam, questions.length, sessionId]);

  useEffect(() => {
    if (!restored || !ready || phase !== 'taking') return;

    saveSession({
      sessionId,
      kind: 'mock',
      examId,
      label: exam.title,
      answers,
      flagged,
      current,
      secondsLeft,
      total: questions.length,
    });
  }, [answers, current, exam, examId, flagged, phase, questions.length, ready, restored, secondsLeft, sessionId]);

  useEffect(() => {
    if (!restored || !ready || phase !== 'taking') return;
    if (secondsLeft <= 0) {
      setPhase('result');
      return;
    }

    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, ready, restored, secondsLeft]);

  useEffect(() => {
    if (phase !== 'result' || recorded.current || !exam) return;

    recorded.current = true;
    saveMockAttempt({
      examId: exam.id,
      score,
      total: questions.length,
      passed: score >= exam.passScore,
    });
    clearSessionIf(sessionId);
  }, [exam, phase, questions.length, score, sessionId]);

  if (!exam) {
    return <ExamMessage title="ไม่พบชุดข้อสอบ" message="ลิงก์นี้อาจไม่ถูกต้อง หรือชุดข้อสอบถูกปิดใช้งานแล้ว" />;
  }

  if (!ready) {
    return (
      <ExamMessage
        title={`${exam.title} ยังไม่พร้อมสอบ`}
        message={`แอดมินกำลังอัปเดตคลังข้อสอบ ชุดนี้มี ${exam.available}/${exam.totalQuestions} ข้อ และจะเปิดให้เริ่มสอบเมื่อครบตามสัดส่วนทุกวิชา`}
      />
    );
  }

  const question = questions[current];
  const progress = Math.round((answeredCount / questions.length) * 100);
  const passed = score >= exam.passScore;

  const submit = () => {
    const remaining = questions.length - answeredCount;
    if (remaining && !window.confirm(`ยังมี ${remaining} ข้อที่ไม่ได้ตอบ ต้องการส่งข้อสอบเลยหรือไม่?`)) return;
    setPhase('result');
  };

  const pause = () => {
    saveSession({
      sessionId,
      kind: 'mock',
      examId: exam.id,
      label: exam.title,
      answers,
      flagged,
      current,
      secondsLeft,
      total: questions.length,
    });
    router.push('/mock-exam');
  };

  if (phase === 'result') {
    return (
      <main className="min-h-screen bg-graylight/10 px-4 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto">
          <section className="bg-navy text-white rounded-2xl p-7 sm:p-9 text-center mb-6">
            <p className="text-white/65 text-sm mb-2">ผลสอบ {exam.title}</p>
            <p className="text-5xl font-bold">{score}<span className="text-2xl text-white/55">/{questions.length}</span></p>
            <p className={`mt-3 font-medium ${passed ? 'text-accent-green' : 'text-orange-300'}`}>
              {passed ? `ผ่านเกณฑ์ ${exam.passScore} คะแนน` : `ยังไม่ถึงเกณฑ์ ${exam.passScore} คะแนน`}
            </p>
          </section>

          <section className="space-y-3">
            {questions.map((item, index) => {
              const correct = answers[item.id] === item.answerIndex;
              return (
                <article key={`${item.id}-${index}`} className="bg-white border border-graylight/25 rounded-xl p-5">
                  <div className="flex gap-3">
                    <span className={correct ? 'text-accent-green' : 'text-red-500'}>{correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}</span>
                    <p className="font-medium text-graydark">{index + 1}. {item.question}</p>
                  </div>
                  <p className="mt-3 text-sm text-graydark/65"><span className="font-medium text-navy">คำตอบ: </span>{item.choices[item.answerIndex]}</p>
                  <p className="mt-1 text-sm text-graydark/60">{item.explanation}</p>
                </article>
              );
            })}
          </section>
          <Link href="/mock-exam" className="mt-6 inline-flex items-center justify-center w-full sm:w-auto bg-navy text-white rounded-xl px-5 py-3 text-sm font-medium">กลับไปหน้าข้อสอบเสมือนจริง</Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-graylight/10">
      <header className="bg-white border-b border-graylight/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-[11px] text-graydark/50">ชุดข้อสอบ</p>
              <p className="text-sm font-semibold text-navy truncate">{exam.title}</p>
            </div>
            <div className="hidden sm:block border-l border-graylight/25 pl-4">
              <p className="text-[11px] text-graydark/50">เวลาที่เหลือ</p>
              <p className="text-sm font-bold tabular-nums text-navy inline-flex items-center gap-1"><Clock3 size={15} /> {formatTime(secondsLeft)}</p>
            </div>
          </div>
          <button type="button" onClick={pause} className="shrink-0 rounded-xl border border-red-300 text-red-500 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-red-50">ออกจากการสอบ</button>
        </div>
      </header>

      <div className="sm:hidden px-4 pt-4 text-sm font-bold tabular-nums text-navy inline-flex items-center gap-1"><Clock3 size={15} /> {formatTime(secondsLeft)}</div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 grid gap-5 xl:grid-cols-[230px_minmax(0,1fr)_250px]">
        <aside className="hidden xl:block bg-white border border-graylight/25 rounded-2xl p-5 h-fit sticky top-5">
          <QuestionNavigator
            questions={questions}
            answers={answers}
            flagged={flagged}
            current={current}
            onPick={setCurrent}
          />
          <button type="button" onClick={submit} className="w-full bg-navy text-white rounded-xl py-3 text-sm font-medium mt-5">ส่งข้อสอบ</button>
        </aside>

        <section className="min-w-0">
          <button type="button" onClick={() => setShowNavigator((value) => !value)} className="xl:hidden w-full mb-3 bg-white border border-graylight/25 rounded-xl px-4 py-3 text-sm font-medium text-navy">
            {showNavigator ? 'ซ่อนรายการข้อสอบ' : 'ดูรายการข้อสอบ'} · ทำแล้ว {answeredCount}/{questions.length}
          </button>
          {showNavigator && (
            <div className="xl:hidden bg-white border border-graylight/25 rounded-2xl p-4 mb-4">
              <QuestionNavigator
                questions={questions}
                answers={answers}
                flagged={flagged}
                current={current}
                onPick={(index) => { setCurrent(index); setShowNavigator(false); }}
              />
            </div>
          )}

          <article className="bg-white border border-graylight/25 rounded-2xl p-5 sm:p-7">
            <p className="text-sm font-semibold text-navy mb-6">ข้อที่ {current + 1} / {questions.length}</p>
            <h1 className="text-lg font-medium text-graydark leading-relaxed mb-7">{question.question}</h1>

            <div className="space-y-3">
              {question.choices.map((choice, index) => {
                const selected = answers[question.id] === index;
                return (
                  <button
                    key={`${choice}-${index}`}
                    type="button"
                    onClick={() => setAnswers((old) => ({ ...old, [question.id]: index }))}
                    className={`w-full flex items-center gap-3 text-left p-3.5 rounded-xl border transition-colors ${selected ? 'border-accent-cyan bg-accent-cyan/10 text-navy' : 'border-graylight/35 text-graydark hover:border-navy/40'}`}
                  >
                    <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${selected ? 'bg-accent-cyan text-white' : 'bg-navy/5 text-navy'}`}>{LETTERS[index]}</span>
                    <span className="text-sm">{choice}</span>
                  </button>
                );
              })}
            </div>

            <label className="mt-6 flex items-center gap-2 text-sm text-graydark/65 cursor-pointer">
              <input type="checkbox" checked={Boolean(flagged[question.id])} onChange={(event) => setFlagged((old) => ({ ...old, [question.id]: event.target.checked }))} className="accent-orange-400 w-4 h-4" />
              <Flag size={15} className="text-orange-400" /> ไม่แน่ใจ ข้ามไปตอบภายหลัง
            </label>
          </article>

          <div className="flex justify-between gap-3 mt-4">
            <button type="button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} className="rounded-xl border border-graylight/35 px-4 py-3 text-sm text-graydark disabled:opacity-40">‹ ข้อก่อนหน้า</button>
            {current < questions.length - 1 ? (
              <button type="button" onClick={() => setCurrent((value) => value + 1)} className="rounded-xl bg-navy text-white px-4 py-3 text-sm">ข้อถัดไป ›</button>
            ) : (
              <button type="button" onClick={submit} className="rounded-xl bg-navy text-white px-4 py-3 text-sm">ส่งข้อสอบ</button>
            )}
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-5 h-fit">
          <section className="bg-white border border-graylight/25 rounded-2xl p-5 text-center">
            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#2B2D42 ${progress}%, #E5E7EB 0)` }}>
              <div className="w-[76px] h-[76px] rounded-full bg-white flex items-center justify-center text-navy font-bold">{progress}%</div>
            </div>
            <p className="text-sm text-graydark/60 mt-3">ทำแล้ว {answeredCount} / {questions.length} ข้อ</p>
            {flaggedCount > 0 && <p className="text-xs text-orange-600 mt-1">ทำเครื่องหมายไว้ {flaggedCount} ข้อ</p>}
          </section>

          <section className="bg-white border border-graylight/25 rounded-2xl p-5">
            <p className="text-xs text-graydark/45 mb-3">รายละเอียดชุดข้อสอบ</p>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-graydark/45 text-xs">ชุดข้อสอบ</dt><dd className="font-semibold text-navy mt-0.5">{exam.title}</dd></div>
              <div><dt className="text-graydark/45 text-xs">จำนวนข้อ</dt><dd className="font-semibold text-navy mt-0.5">{exam.totalQuestions} ข้อ</dd></div>
              <div><dt className="text-graydark/45 text-xs">เวลาสอบ</dt><dd className="font-semibold text-navy mt-0.5">{exam.durationMinutes} นาที</dd></div>
            </dl>
          </section>

          <section className="hidden xl:block bg-white border border-graylight/25 rounded-2xl p-4">
            <button type="button" onClick={pause} className="w-full flex items-center justify-center gap-2 border border-navy/25 text-navy rounded-xl py-2.5 text-sm font-medium"><PauseCircle size={16} /> หยุดพักไว้ก่อน</button>
            <button type="button" onClick={submit} className="w-full flex items-center justify-center gap-2 bg-navy text-white rounded-xl py-2.5 text-sm font-medium mt-2"><Send size={16} /> ส่งข้อสอบ</button>
          </section>
        </aside>
      </main>
    </div>
  );
}

function ExamMessage({ title, message }) {
  return (
    <main className="min-h-screen bg-graylight/10 px-4 py-10 sm:p-10 flex items-center justify-center">
      <section className="max-w-lg bg-white border border-graylight/30 rounded-2xl p-6 sm:p-8 text-center">
        <AlertCircle className="text-amber-500 mx-auto mb-4" size={34} />
        <h1 className="text-xl font-semibold text-navy mb-2">{title}</h1>
        <p className="text-sm text-graydark/60 leading-relaxed mb-6">{message}</p>
        <Link href="/mock-exam" className="inline-flex items-center gap-2 bg-navy text-white rounded-xl px-5 py-3 text-sm font-medium"><ArrowLeft size={16} /> กลับไป Mock Exam</Link>
      </section>
    </main>
  );
}

function QuestionNavigator({ questions, answers, flagged, current, onPick }) {
  return (
    <>
      <p className="font-semibold text-navy text-sm mb-3">รายการข้อสอบ</p>
      <div className="flex items-center gap-2.5 text-[11px] text-graydark/55 mb-4 flex-wrap">
        <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-orange-400" />ข้อปัจจุบัน</span>
        <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded border border-graylight/40 bg-white" />ยังไม่ตอบ</span>
        <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-navy" />ทำแล้ว</span>
      </div>
      <div className="grid grid-cols-4 gap-2 max-h-[340px] overflow-y-auto pr-1">
        {questions.map((item, index) => {
          const active = index === current;
          const answered = answers[item.id] !== undefined;
          return (
            <button
              key={`${item.id}-${index}`}
              type="button"
              onClick={() => onPick(index)}
              className={`relative aspect-square rounded-lg text-xs font-semibold border ${active ? 'bg-orange-400 border-orange-400 text-white' : answered ? 'bg-navy border-navy text-white' : 'border-graylight/35 text-graydark hover:border-navy/50'} ${flagged[item.id] && !active ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </>
  );
}
