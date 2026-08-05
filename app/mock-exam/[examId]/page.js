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
const ADMINISTRATION_TRACK_ID = 'general-affairs';
const PATROL_TRACK_ID = 'patrol';
const ADMINISTRATION_PARTS = [
  { id: 'part-1', label: 'ส่วนที่ 1', subjectIds: ['aptitude', 'thai'] },
  { id: 'part-2', label: 'ส่วนที่ 2', subjectIds: ['it', 'correspondence', 'law', 'english'] },
];
const PATROL_PARTS = [
  { id: 'part-1', label: 'ส่วนที่ 1', subjectIds: ['aptitude', 'thai'] },
  { id: 'part-2', label: 'ส่วนที่ 2', subjectIds: ['it', 'english', 'law', 'social'] },
];
const ADMINISTRATION_PASS_SCORE = 120;
const PATROL_PASS_SCORE = 95;

function isAdministrationExam(exam) {
  return exam?.trackId === ADMINISTRATION_TRACK_ID;
}

function isPatrolExam(exam) {
  return exam?.trackId === PATROL_TRACK_ID;
}

function getMockPassScore(exam) {
  if (exam?.trackId === ADMINISTRATION_TRACK_ID) return ADMINISTRATION_PASS_SCORE;
  if (exam?.trackId === PATROL_TRACK_ID) return PATROL_PASS_SCORE;
  return null;
}

function calculateParts(items, definitions) {
  return definitions.map((definition) => {
    const subjects = definition.subjectIds.map((subjectId) => {
      const subjectItems = items.filter((item) => item.categoryId === subjectId);
      const correct = subjectItems.filter((item) => item.selectedIndex === item.answerIndex).length;
      return {
        subjectId,
        subjectName: subjectItems[0]?.categoryName || subjectId,
        correct,
        total: subjectItems.length,
      };
    });
    const total = subjects.reduce((sum, subject) => sum + subject.total, 0);
    const correct = subjects.reduce((sum, subject) => sum + subject.correct, 0);
    const percentage = total ? (correct / total) * 100 : 0;
    return { ...definition, subjects, total, correct, percentage };
  });
}

function mockExamPassed(exam, questions, answers) {
  const passScore = getMockPassScore(exam);
  if (passScore === null) return null;
  const items = questions.map((question) => ({
    categoryId: question.subjectId,
    categoryName: question.subjectName || question.subjectId,
    answerIndex: question.answerIndex,
    selectedIndex: answers[question.id],
  }));
  const score = items.filter((item) => item.selectedIndex === item.answerIndex).length;
  return score >= passScore;
}

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
      passed: mockExamPassed(exam, questions, answers),
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
  const passScore = getMockPassScore(exam);
  const hasPassingCriteria = passScore !== null;

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
              {exam.trackName && <p className="mt-0.5 text-[11px] font-semibold text-cyan-700">{exam.trackName}{hasPassingCriteria ? ` · เกณฑ์ผ่าน ${passScore}/${exam.totalQuestions}` : ''}</p>}
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
              {hasPassingCriteria && <div><dt className="text-[11px] text-graydark/40">เกณฑ์ผ่าน</dt><dd className="font-medium text-navy">{passScore}/{exam.totalQuestions} คะแนน</dd></div>}
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

function MockResult({ exam, questions, items, score, elapsedSeconds }) {
  const history = useAttemptHistory({ bank: 'mock', setId: exam.id });
  const hasAdministrationCriteria = isAdministrationExam(exam);
  const hasPatrolCriteria = isPatrolExam(exam);
  const passScore = getMockPassScore(exam);
  const tableTrack = hasAdministrationCriteria ? 'administration' : hasPatrolCriteria ? 'patrol' : null;

  return (
    <>
      {tableTrack && <PartBreakdown items={items} score={score} track={tableTrack} />}
      <div className={tableTrack ? 'mt-4' : ''}>
        <ExamResultSummary
          title={exam.title}
          subtitle={passScore !== null ? `เกณฑ์ผ่าน ${passScore}/${questions.length} คะแนน` : 'สรุปผลเพื่อใช้ทบทวนความพร้อม'}
          score={score}
          total={questions.length}
          elapsedSeconds={elapsedSeconds}
          standardSeconds={exam.durationMinutes ? exam.durationMinutes * 60 : null}
          passThreshold={passScore !== null && questions.length ? passScore / questions.length : null}
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

function PartBreakdown({ items, score, track }) {
  const scoreTable = track === 'patrol'
    ? {
      parts: PATROL_PARTS,
      passScore: PATROL_PASS_SCORE,
      eyebrow: 'PATROL SCORECARD',
      title: 'เกณฑ์ผลสอบสายปราบปราม',
      description: 'สรุปคะแนนแยกวิชา และวัดผลจากคะแนนรวมเท่านั้น',
      mobileNote: 'สายปราบปรามใช้เกณฑ์ผ่านคะแนนรวม 95 คะแนน ไม่มีเกณฑ์ผ่านรายส่วน',
    }
    : {
      parts: ADMINISTRATION_PARTS,
      passScore: ADMINISTRATION_PASS_SCORE,
      eyebrow: 'ADMINISTRATION SCORECARD',
      title: 'เกณฑ์ผลสอบสายอำนวยการ',
      description: 'สรุปคะแนนแยกวิชา พร้อมเกณฑ์ผ่านคะแนนรวม',
      mobileNote: 'คะแนนรวมใช้เกณฑ์ผ่าน 120 คะแนน',
  };
  const parts = calculateParts(items, scoreTable.parts);
  const subjects = parts.flatMap((part) => part.subjects);
  const totalQuestions = parts.reduce((sum, part) => sum + part.total, 0);
  const overallPassed = score >= scoreTable.passScore;
  const overallPercentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;
  const passPercentage = totalQuestions ? (scoreTable.passScore / totalQuestions) * 100 : 0;
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-accent-cyan">{scoreTable.eyebrow}</p>
          <h2 className="mt-1 text-lg font-bold text-navy">{scoreTable.title}</h2>
          <p className="mt-1 text-xs text-graydark/55">{scoreTable.description}</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${overallPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{overallPassed ? `ผ่านเกณฑ์ ${scoreTable.passScore} คะแนน` : `ขาดอีก ${Math.max(0, scoreTable.passScore - score)} คะแนน`}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <div className="flex items-end justify-between gap-3"><div><span className="text-3xl font-black tabular-nums text-navy">{score}</span><span className="ml-1 text-sm font-semibold text-graydark/45">/ {totalQuestions} คะแนน</span></div><span className="text-sm font-bold text-graydark/65">{overallPercentage}%</span></div>
          <div className="relative mt-3 h-3 overflow-visible rounded-full bg-slate-100">
            <div className="admin-score-bar h-full rounded-full bg-gradient-to-r from-accent-cyan to-[#4f86f7]" style={{ width: `${Math.min(overallPercentage, 100)}%` }} />
            <span className="absolute -top-1 h-5 w-0.5 bg-accent-gold" style={{ left: `${passPercentage}%` }} aria-label={`เกณฑ์ผ่าน ${scoreTable.passScore} คะแนน`} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-graydark/50"><span>0 คะแนน</span><span className="font-bold text-[#aa7a21]">เกณฑ์ผ่าน {scoreTable.passScore}</span><span>{totalQuestions} คะแนน</span></div>
        </div>
        <div className={`rounded-2xl border px-4 py-3 text-center ${overallPassed ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}><p className={`text-lg font-black ${overallPassed ? 'text-emerald-700' : 'text-amber-700'}`}>{overallPassed ? 'ผ่าน' : 'ยังไม่ผ่าน'}</p><p className="mt-0.5 text-[11px] text-graydark/55">เกณฑ์ {scoreTable.passScore} คะแนน</p></div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 p-3 md:hidden">
        <p className="px-1 pb-2 text-xs font-bold text-graydark/60">คะแนนรายวิชา</p>
        <dl className="grid grid-cols-2 gap-2">
          {subjects.map((subject, index) => <div key={subject.subjectId} className={`rounded-xl px-3 py-2.5 ${index < 2 ? 'bg-blue-50/55' : 'bg-emerald-50/55'}`}><dt className="truncate text-[11px] font-medium text-graydark/55">{subject.subjectName}</dt><dd className="mt-1 text-base font-black tabular-nums text-navy">{subject.correct}<span className="text-xs font-semibold text-graydark/40"> / {subject.total}</span></dd></div>)}
        </dl>
        <p className="px-1 text-center text-[11px] text-graydark/45">{scoreTable.mobileNote}</p>
      </div>

      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full min-w-[720px] border-collapse text-center text-sm">
          <thead className="text-xs font-bold">
            <tr className="bg-white text-graydark/60">
              {subjects.map((subject, index) => <th key={subject.subjectId} className={`border-b px-2 py-3 font-semibold ${index < 2 ? 'border-blue-100 bg-blue-50/35 text-blue-800' : 'border-emerald-100 bg-emerald-50/35 text-emerald-800'} ${index < subjects.length - 1 ? 'border-r' : ''}`}>{subject.subjectName}<span className="mt-0.5 block text-[10px] font-medium text-graydark/40">เต็ม {subject.total}</span></th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="text-base font-bold tabular-nums text-navy">
              {subjects.map((subject, index) => <td key={subject.subjectId} className={`${index < subjects.length - 1 ? 'border-r' : ''} px-2 py-4 ${index < 2 ? 'border-blue-100 bg-blue-50/20' : 'border-emerald-100 bg-emerald-50/20'}`}>{subject.correct}</td>)}
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td colSpan="2" className="px-4 py-3 text-left text-xs font-bold text-graydark/60">รวมคะแนนทั้งหมด</td>
              <td colSpan="2" className="px-4 py-3 text-lg font-black tabular-nums text-navy">{score}/{totalQuestions}</td>
              <td colSpan="1" className="px-4 py-3 text-sm font-bold text-graydark/65">{overallPercentage.toFixed(2)}%</td>
              <td colSpan="1" className={`px-4 py-3 text-sm font-bold ${overallPassed ? 'text-emerald-700' : 'text-amber-700'}`}>{overallPassed ? `ผ่าน ${scoreTable.passScore}` : `ขาด ${Math.max(0, scoreTable.passScore - score)}`}</td>
            </tr>
          </tfoot>
        </table>
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
