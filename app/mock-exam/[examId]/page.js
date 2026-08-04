'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListOrdered,
  LockKeyhole,
  LogIn,
  PauseCircle,
  Send,
} from 'lucide-react';
import { fetchMockExam } from '@/lib/mockExamClient';
import { saveMockAttempt } from '@/lib/mockExamProgress';
import { clearSessionIf, getSessionFor, mockSessionId, saveSession } from '@/lib/examSession';
import { confirmIncompleteAnswers } from '@/lib/sweetAlert';
import { useSubjects } from '@/lib/subjectCatalog';
import { useAttemptHistory } from '@/lib/useAttemptHistory';
import { noCopyHandlers } from '@/lib/copyProtection';
import ExamResultSummary from '@/components/ExamResultSummary';

const LETTERS = ['A', 'B', 'C', 'D'];

// วงแหวนความคืบหน้าชุดเดียวกับแบบฝึกหัดรายวิชา
function ProgressRing({ pct }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-graylight/25" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className="stroke-accent-cyan transition-all duration-300"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-navy">
        {pct}%
      </span>
    </div>
  );
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds || 0);
  const hours = Math.floor(safeSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((safeSeconds % 3600) / 60).toString().padStart(2, '0');
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${remainingSeconds}`;
}

export default function MockExamTakingPage() {
  const { examId: slug } = useParams();
  const router = useRouter();

  // exam+questions มาจาก Supabase ผ่าน API เสมอ (ไม่มีการ mock/แคชแบบ static แล้ว)
  // เพราะต้องเช็คสิทธิ์สมาชิกใหม่ทุกครั้งที่เข้าทำ
  const [examData, setExamData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionId = mockSessionId(slug);
  // ต้องเรียกก่อน early return ด้านล่าง เพื่อให้ลำดับ hook คงที่ทุก render
  const { findSubject } = useSubjects();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    // ถ้ามีที่พักไว้สำหรับชุดนี้ ให้ขอข้อสอบชุดเดิมที่สุ่มไว้ตอนเริ่ม แทนการสุ่มใหม่
    const saved = getSessionFor(sessionId);
    const resumeIds = saved?.kind === 'mock' && saved.examId === slug && Array.isArray(saved.questionIds)
      ? saved.questionIds
      : null;
    fetchMockExam(slug, resumeIds)
      .then((data) => {
        if (active) setExamData(data);
      })
      .catch((err) => {
        if (active) setLoadError({ status: err.status || 500, message: err.message });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, sessionId]);

  const exam = examData?.exam || null;
  const questions = useMemo(() => examData?.questions || [], [examData]);
  const durationSeconds = (exam?.durationMinutes || 0) * 60;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [phase, setPhase] = useState('taking');
  const [restored, setRestored] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const recorded = useRef(false);

  const ready = Boolean(exam && questions.length > 0);
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.keys(flagged).filter((id) => flagged[id]).length;
  const score = questions.reduce(
    (sum, question) => sum + (answers[question.id] === question.answerIndex ? 1 : 0),
    0,
  );

  useEffect(() => {
    if (!exam) return;

    const saved = getSessionFor(sessionId);
    if (saved?.kind === 'mock' && saved.examId === slug) {
      setCurrent(Math.min(saved.current || 0, Math.max(questions.length - 1, 0)));
      setAnswers(saved.answers || {});
      setFlagged(saved.flagged || {});
      setSecondsLeft(saved.secondsLeft ?? durationSeconds);
    } else {
      setSecondsLeft(durationSeconds);
    }
    setRestored(true);
  }, [durationSeconds, exam, questions.length, sessionId, slug]);

  useEffect(() => {
    if (!restored || !ready || phase !== 'taking') return;

    saveSession({
      sessionId,
      kind: 'mock',
      examId: slug,
      label: exam.title,
      answers,
      flagged,
      current,
      secondsLeft,
      total: questions.length,
      questionIds: questions.map((item) => item.id),
    });
  }, [answers, current, exam, slug, flagged, phase, questions, ready, restored, secondsLeft, sessionId]);

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
      examId: slug,
      score,
      total: questions.length,
      passed: score >= exam.passScore,
      answers,
      durationSeconds: Math.max(0, durationSeconds - secondsLeft),
    });
    fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank: 'mock',
        setId: exam.id,
        subjectId: exam.subjectId,
        title: exam.title,
        questionIds: questions.map((question) => question.id),
        answers,
        elapsedSeconds: Math.max(0, durationSeconds - secondsLeft),
      }),
    }).catch(() => {
      // Keep the local attempt as a fallback if the request cannot be saved.
    });
    clearSessionIf(sessionId);
  }, [answers, durationSeconds, exam, phase, questions.length, score, secondsLeft, sessionId, slug]);

  if (loading) {
    return <ExamMessage title="กำลังโหลดชุดข้อสอบ..." message="กรุณารอสักครู่" />;
  }

  if (loadError) {
    if (loadError.status === 401) {
      return (
        <ExamMessage
          icon={LogIn}
          title="เข้าสู่ระบบก่อนเริ่มสอบ"
          message="ใช้ OTP เพื่อเข้าสู่ระบบและเริ่มทำข้อสอบเสมือนจริง"
          actionHref="/login"
          actionLabel="เข้าสู่ระบบด้วย OTP"
        />
      );
    }
    if (loadError.status === 403) {
      return (
        <ExamMessage
          icon={LockKeyhole}
          title="ชุดนี้สำหรับสมาชิก"
          message={loadError.message}
          actionHref="/account"
          actionLabel="ดูแพ็กเกจสมาชิก"
        />
      );
    }
    return <ExamMessage title="ไม่พบชุดข้อสอบ" message={loadError.message || 'ลิงก์นี้อาจไม่ถูกต้อง หรือชุดข้อสอบถูกปิดใช้งานแล้ว'} />;
  }

  if (!ready) {
    return <ExamMessage title="ไม่พบชุดข้อสอบ" message="ลิงก์นี้อาจไม่ถูกต้อง หรือชุดข้อสอบถูกปิดใช้งานแล้ว" />;
  }

  const question = questions[current];
  const progress = Math.round((answeredCount / questions.length) * 100);
  const passed = score >= exam.passScore;

  const submit = async () => {
    const remaining = questions.length - answeredCount;
    if (remaining && !(await confirmIncompleteAnswers(remaining, 'ส่งข้อสอบ'))) return;
    setPhase('result');
  };

  const pause = () => {
    saveSession({
      sessionId,
      kind: 'mock',
      examId: slug,
      label: exam.title,
      answers,
      flagged,
      current,
      secondsLeft,
      total: questions.length,
      questionIds: questions.map((item) => item.id),
    });
    router.push('/mock-exam');
  };

  if (phase === 'result') {
    const elapsedSeconds = Math.max(0, durationSeconds - secondsLeft);
    const items = questions.map((item) => ({
      id: item.id,
      question: item.question,
      choices: item.choices,
      answerIndex: item.answerIndex,
      selectedIndex: answers[item.id],
      explanation: item.explanation,
      categoryId: item.subjectId,
      categoryName: findSubject(item.subjectId)?.name || null,
    }));

    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_8%_0%,rgba(79,134,247,0.12),transparent_24rem),radial-gradient(circle_at_94%_12%,rgba(216,176,107,0.13),transparent_25rem),#f6f8fc] px-4 py-6 sm:py-9">
        <div className="mx-auto max-w-app">
          <Link href="/mock-exam" className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-graydark/65 transition hover:bg-white hover:text-navy">
            <ArrowLeft size={17} /> กลับไปหน้าข้อสอบเสมือนจริง
          </Link>
          <div className="mt-3">
            <MockResult exam={exam} questions={questions} items={items} score={score} elapsedSeconds={elapsedSeconds} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-graylight/10">
      <header className="bg-white border-b border-graylight/30">
        <div className="max-w-app mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-[11px] text-graydark/50">ชุดข้อสอบ</p>
              <p className="text-sm font-semibold text-navy truncate">{exam.title}</p>
              {exam.trackName && <p className="mt-0.5 text-[11px] font-semibold text-cyan-700">{exam.trackName} · เกณฑ์ผ่าน {exam.passScore}/{exam.totalQuestions}</p>}
            </div>
            <div className="hidden sm:block border-l border-graylight/25 pl-4">
              <p className="text-[11px] text-graydark/50">เวลาที่เหลือ</p>
              <p className="text-sm font-bold tabular-nums text-navy inline-flex items-center gap-1"><Clock3 size={15} /> {formatTime(secondsLeft)}</p>
            </div>
          </div>
          <button type="button" onClick={pause} className="shrink-0 rounded-xl border border-red-300 text-red-500 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-red-50">ออกจากการสอบ</button>
        </div>
      </header>

      {/* แถบความคืบหน้าเหมือนแบบฝึกหัด */}
      <div className="h-1 bg-graylight/20">
        <div className="h-full bg-accent-cyan transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="sm:hidden px-4 pt-4 text-sm font-bold tabular-nums text-navy inline-flex items-center gap-1"><Clock3 size={15} /> {formatTime(secondsLeft)}</div>

      <main className="max-w-app mx-auto px-4 sm:px-6 py-5 sm:py-7 grid gap-5 xl:grid-cols-[230px_minmax(0,1fr)_250px]">
        <aside className="hidden xl:block bg-white border border-graylight/30 rounded-2xl p-5 h-fit sticky top-5">
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
          {/* แผงคำถามใช้โครงเดียวกับแบบฝึกหัดรายวิชา เพื่อให้ผู้สอบเจอหน้าตาเดิมทั้งสองโหมด */}
          <div className="border border-graylight/30 rounded-2xl p-5 sm:p-6 bg-white no-copy" {...noCopyHandlers}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="font-semibold text-navy">
                ข้อที่ {current + 1} / {questions.length}
              </p>
              <button
                type="button"
                onClick={() => setShowNavigator((value) => !value)}
                className="xl:hidden flex items-center gap-1.5 text-xs text-graydark/60 border border-graylight/40 rounded-lg px-3 py-1.5"
              >
                <ListOrdered size={13} />
                {showNavigator ? 'ซ่อนรายการข้อ' : 'รายการข้อ'}
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-medium text-graydark leading-relaxed mb-5">
              {question.question}
            </h2>

            <div className="space-y-2.5">
              {question.choices.map((choice, index) => {
                const selected = answers[question.id] === index;
                return (
                  <button
                    key={`${choice}-${index}`}
                    type="button"
                    onClick={() => setAnswers((old) => ({ ...old, [question.id]: index }))}
                    className={`w-full flex items-center gap-3 text-left px-3 sm:px-4 py-3 rounded-xl border transition-colors ${
                      selected
                        ? 'border-accent-cyan bg-accent-cyan/10 text-navy font-medium'
                        : 'border-graylight/40 text-graydark hover:border-navy/40'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-semibold ${
                        selected ? 'bg-accent-cyan text-white' : 'bg-graylight/20 text-graydark/60'
                      }`}
                    >
                      {LETTERS[index]}
                    </span>
                    <span className="text-sm sm:text-base">{choice}</span>
                  </button>
                );
              })}
            </div>

            <label className="flex items-center gap-2 mt-5 text-sm text-graydark/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(flagged[question.id])}
                onChange={(event) => setFlagged((old) => ({ ...old, [question.id]: event.target.checked }))}
                className="w-4 h-4 accent-amber-400"
              />
              ไม่แน่ใจ ข้ามไปตอบภายหลัง
            </label>

            <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-graylight/20">
              <button
                type="button"
                disabled={current === 0}
                onClick={() => setCurrent((value) => value - 1)}
                className="flex items-center gap-1 px-3 sm:px-4 py-2.5 rounded-xl border border-graylight/40 text-graydark text-sm disabled:opacity-30"
              >
                <ChevronLeft size={16} />
                ข้อก่อนหน้า
              </button>

              {current < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrent((value) => value + 1)}
                  className="flex items-center gap-1 px-4 sm:px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-medium hover:opacity-90"
                >
                  ข้อถัดไป
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  className="px-5 py-2.5 rounded-xl bg-accent-green text-navy text-sm font-semibold hover:opacity-90"
                >
                  ส่งข้อสอบ
                </button>
              )}
            </div>
          </div>

          {showNavigator && (
            <div className="mt-5 xl:hidden bg-white border border-graylight/30 rounded-2xl p-5">
              <QuestionNavigator
                questions={questions}
                answers={answers}
                flagged={flagged}
                current={current}
                onPick={(index) => { setCurrent(index); setShowNavigator(false); }}
              />
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-5 h-fit">
          <section className="border border-graylight/30 rounded-2xl p-5 bg-white flex xl:flex-col items-center gap-4 xl:gap-2">
            <ProgressRing pct={progress} />
            <div className="xl:text-center">
              <p className="text-sm text-graydark/60">ทำแล้ว {answeredCount} / {questions.length} ข้อ</p>
              {flaggedCount > 0 && <p className="text-xs text-amber-600 mt-1">ทำเครื่องหมายไม่แน่ใจ {flaggedCount} ข้อ</p>}
            </div>
          </section>

          <section className="bg-white border border-graylight/30 rounded-2xl p-5">
            <p className="text-xs text-graydark/50 mb-3">รายละเอียดชุดข้อสอบ</p>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-[11px] text-graydark/40">ชุดข้อสอบ</dt><dd className="font-medium text-navy">{exam.title}</dd></div>
              <div><dt className="text-[11px] text-graydark/40">จำนวนข้อ</dt><dd className="font-medium text-navy">{exam.totalQuestions} ข้อ</dd></div>
              <div><dt className="text-[11px] text-graydark/40">เวลาสอบ</dt><dd className="font-medium text-navy">{exam.durationMinutes} นาที</dd></div>
              <div><dt className="text-[11px] text-graydark/40">เกณฑ์ผ่าน</dt><dd className="font-medium text-navy">{exam.passScore}/{exam.totalQuestions} คะแนน</dd></div>
            </dl>
          </section>

          <section className="hidden xl:block bg-white border border-graylight/30 rounded-2xl p-4">
            <button type="button" onClick={pause} className="w-full flex items-center justify-center gap-2 border border-navy/25 text-navy rounded-xl py-2.5 text-sm font-medium"><PauseCircle size={16} /> หยุดพักไว้ก่อน</button>
            <button type="button" onClick={submit} className="w-full flex items-center justify-center gap-2 bg-navy text-white rounded-xl py-2.5 text-sm font-medium mt-2"><Send size={16} /> ส่งข้อสอบ</button>
          </section>
        </aside>
      </main>
    </div>
  );
}

// ภาค ก คือวิชาความสามารถทั่วไปตามหลัก ก.พ. (คณิตศาสตร์ + ภาษาไทย) ซึ่งคงที่ทุกสายงาน
// ส่วนภาค ข คือวิชาเฉพาะตำแหน่งที่เหลือในสัดส่วนของแต่ละสายงาน
const PART_A_SUBJECT_IDS = new Set(['aptitude', 'thai']);
const PART_PASS_RATIO = 0.6;

function examPartOf(subjectId) {
  return PART_A_SUBJECT_IDS.has(subjectId) ? 'ก' : 'ข';
}

function MockResult({ exam, questions, items, score, elapsedSeconds }) {
  const history = useAttemptHistory({ bank: 'mock', setId: exam.id });
  const passThreshold = questions.length ? exam.passScore / questions.length : 0.6;

  return (
    <>
      {exam.blueprint?.length > 0 && <PartBreakdown exam={exam} items={items} score={score} />}
      <div className={exam.blueprint?.length > 0 ? 'mt-4' : ''}>
        <ExamResultSummary
          title={exam.title}
          subtitle={`เกณฑ์ผ่าน ${exam.passScore}/${questions.length} ข้อ`}
          score={score}
          total={questions.length}
          elapsedSeconds={elapsedSeconds}
          standardSeconds={exam.durationMinutes ? exam.durationMinutes * 60 : null}
          passThreshold={passThreshold}
          items={items}
          history={history}
          backHref="/mock-exam"
          backLabel="กลับหน้าข้อสอบเสมือนจริง"
          onRetrySame={() => window.location.reload()}
          newHref="/mock-exam"
          newLabel="เลือกชุดใหม่"
          practiceHrefForCategory={(categoryId) => `/practice/${categoryId}`}
        />
      </div>
    </>
  );
}

function PartBreakdown({ exam, items, score }) {
  const subjectScores = exam.blueprint.map((entry) => {
    const subjectItems = items.filter((item) => item.categoryId === entry.subjectId);
    const correct = subjectItems.filter((item) => item.selectedIndex === item.answerIndex).length;
    return { subjectId: entry.subjectId, subjectName: entry.subjectName, total: entry.questionCount, correct };
  });
  const parts = { ก: { correct: 0, total: 0 }, ข: { correct: 0, total: 0 } };
  subjectScores.forEach((item) => {
    const part = parts[examPartOf(item.subjectId)];
    part.correct += item.correct;
    part.total += item.total;
  });
  const partPassed = (part) => part.total > 0 && part.correct / part.total >= PART_PASS_RATIO;
  const totalQuestions = exam.blueprint.reduce((sum, entry) => sum + entry.questionCount, 0);
  const overallPassed = score >= exam.passScore && partPassed(parts.ก) && partPassed(parts.ข);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-navy">คะแนนแยกภาค ก / ภาค ข</h2>
        <p className="mt-1 text-xs text-graydark/50">{exam.trackName ? `สายงาน${exam.trackName} · ` : ''}เกณฑ์ผ่านแต่ละภาคใช้หลักทั่วไป {Math.round(PART_PASS_RATIO * 100)}% ของคะแนนเต็มภาคนั้น โปรดตรวจสอบเกณฑ์จริงจากประกาศรับสมัครของตำแหน่งที่สมัคร</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-center text-sm">
          <thead>
            <tr className="text-xs text-graydark/55">
              {subjectScores.map((item, index) => (
                <th key={item.subjectId} className="border-b border-slate-200 px-2 py-2 font-semibold">{index + 1}. {item.subjectName} ({item.total})</th>
              ))}
              <th className="border-b border-slate-200 bg-amber-50 px-2 py-2 font-bold text-amber-800">ภาค ก (เต็ม {parts.ก.total})</th>
              <th className="border-b border-slate-200 bg-cyan-50 px-2 py-2 font-bold text-cyan-800">ภาค ข (เต็ม {parts.ข.total})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {subjectScores.map((item) => (
                <td key={item.subjectId} className="px-2 py-3 font-bold text-navy">{item.correct}</td>
              ))}
              <td className="bg-amber-50/60 px-2 py-3">
                <p className="font-black text-navy">{parts.ก.correct}</p>
                <p className={`mt-0.5 text-[11px] font-bold ${partPassed(parts.ก) ? 'text-emerald-600' : 'text-red-500'}`}>{partPassed(parts.ก) ? 'ผ่าน' : 'ไม่ผ่าน'}</p>
              </td>
              <td className="bg-cyan-50/60 px-2 py-3">
                <p className="font-black text-navy">{parts.ข.correct}</p>
                <p className={`mt-0.5 text-[11px] font-bold ${partPassed(parts.ข) ? 'text-emerald-600' : 'text-red-500'}`}>{partPassed(parts.ข) ? 'ผ่าน' : 'ไม่ผ่าน'}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-1 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-graydark/55">รวมคะแนนทั้งหมด ({totalQuestions})</p>
          <p className="text-2xl font-black text-navy">{score}</p>
        </div>
        <div className={`flex flex-col items-center justify-center gap-1 p-4 ${overallPassed ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className="text-xs font-semibold text-graydark/55">ผลสอบข้อเขียน</p>
          <p className={`text-sm font-bold ${overallPassed ? 'text-emerald-700' : 'text-red-600'}`}>{overallPassed ? 'อยู่ในกลุ่มให้เข้าสอบความเหมาะสมกับตำแหน่ง (รอบ 2)' : 'ไม่อยู่ในกลุ่มให้เข้าสอบความเหมาะสมกับตำแหน่ง (รอบ 2)'}</p>
        </div>
      </div>
    </section>
  );
}

function ExamMessage({ title, message, icon: Icon = AlertCircle, actionHref = '/mock-exam', actionLabel = 'กลับไป Mock Exam' }) {
  return (
    <main className="min-h-screen bg-graylight/10 px-4 py-10 sm:p-10 flex items-center justify-center">
      <section className="max-w-lg bg-white border border-graylight/30 rounded-2xl p-6 sm:p-8 text-center">
        <Icon className="text-amber-500 mx-auto mb-4" size={34} />
        <h1 className="text-xl font-semibold text-navy mb-2">{title}</h1>
        <p className="text-sm text-graydark/60 leading-relaxed mb-6">{message}</p>
        <Link href={actionHref} className="inline-flex items-center gap-2 bg-navy text-white rounded-xl px-5 py-3 text-sm font-medium"><ArrowLeft size={16} /> {actionLabel}</Link>
      </section>
    </main>
  );
}

function QuestionNavigator({ questions, answers, flagged, current, onPick }) {
  return (
    <>
      <p className="font-medium text-navy mb-3">รายการข้อสอบ</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-4 text-[11px] text-graydark/60">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-400" />ข้อปัจจุบัน</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-graylight/50" />ยังไม่ทำ</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-navy" />ทำแล้ว</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-amber-400" />ไม่แน่ใจ</span>
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-8 xl:grid-cols-4 gap-2 max-h-[340px] overflow-y-auto pr-1">
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
