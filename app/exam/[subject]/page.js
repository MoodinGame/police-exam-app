'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { subjects } from '@/lib/subjects';
import { questions } from '@/lib/questions';
import { topics } from '@/lib/topics';
import { recordTopicAttempt } from '@/lib/progress';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  ListOrdered,
  RotateCcw,
} from 'lucide-react';

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

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

export default function ExamPage() {
  const { subject: subjectId } = useParams();
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topic');
  const topic = topicId ? topics.find((t) => t.id === topicId) : null;

  const subject = subjects.find((s) => s.id === subjectId);
  const subjectQuestions = useMemo(
    () =>
      questions.filter(
        (q) => q.subjectId === subjectId && (!topicId || q.topicId === topicId)
      ),
    [subjectId, topicId]
  );

  const [phase, setPhase] = useState('taking'); // taking | result
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(subjectQuestions.length * 60); // demo: 1 นาที/ข้อ
  const [showNav, setShowNav] = useState(false); // รายการข้อสอบบนจอเล็ก
  const recordedRef = useRef(false);

  useEffect(() => {
    if (phase !== 'taking') return;
    if (secondsLeft <= 0) {
      setPhase('result');
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, phase]);

  const score = subjectQuestions.reduce(
    (acc, item) => acc + (answers[item.id] === item.answerIndex ? 1 : 0),
    0
  );

  useEffect(() => {
    if (phase === 'result' && topicId && !recordedRef.current) {
      recordedRef.current = true;
      recordTopicAttempt({ topicId, subjectId, score, total: subjectQuestions.length });
    }
  }, [phase, topicId, subjectId, score, subjectQuestions.length]);

  if (!subject || subjectQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-graydark mb-4">ไม่พบชุดข้อสอบนี้</p>
          <Link href="/practice" className="text-accent-cyan underline">
            กลับไปเลือกวิชา
          </Link>
        </div>
      </div>
    );
  }

  const q = subjectQuestions[current];
  const total = subjectQuestions.length;
  const answeredCount = subjectQuestions.filter((item) => answers[item.id] !== undefined).length;
  const progressPct = Math.round((answeredCount / total) * 100);
  const setName = topic ? topic.name : subject.name;

  const selectAnswer = (qId, choiceIndex) => {
    if (phase !== 'taking') return;
    setAnswers((prev) => ({ ...prev, [qId]: choiceIndex }));
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  function restart() {
    setAnswers({});
    setFlagged({});
    setCurrent(0);
    setSecondsLeft(total * 60);
    recordedRef.current = false;
    setPhase('taking');
  }

  function submit() {
    const left = total - answeredCount;
    if (left > 0 && !window.confirm(`ยังเหลืออีก ${left} ข้อที่ยังไม่ได้ตอบ ต้องการส่งข้อสอบเลยหรือไม่?`)) {
      return;
    }
    setPhase('result');
  }

  // ---------- หน้าผลคะแนน ----------
  if (phase === 'result') {
    return (
      <div className="min-h-screen bg-white px-4 sm:px-6 py-6 sm:py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-navy text-white rounded-2xl p-6 sm:p-8 text-center mb-8">
            <p className="text-graylight mb-1">ผลคะแนน · {setName}</p>
            <p className="text-5xl font-bold mb-1">
              {score}
              <span className="text-2xl text-graylight">/{total}</span>
            </p>
            <p className="text-accent-cyan">{Math.round((score / total) * 100)}% ถูกต้อง</p>
          </div>

          <div className="space-y-4">
            {subjectQuestions.map((item, idx) => {
              const userAnswer = answers[item.id];
              const isCorrect = userAnswer === item.answerIndex;
              return (
                <div key={item.id} className="border border-graylight/30 rounded-xl p-4 sm:p-5">
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle2 className="text-accent-green shrink-0 mt-0.5" size={20} />
                    ) : (
                      <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    )}
                    <p className="font-medium text-graydark">
                      {idx + 1}. {item.question}
                    </p>
                  </div>
                  <div className="sm:pl-8 space-y-1.5 text-sm">
                    {item.choices.map((c, i) => {
                      const isUser = userAnswer === i;
                      const isAns = item.answerIndex === i;
                      return (
                        <div
                          key={i}
                          className={`px-3 py-1.5 rounded-lg ${
                            isAns
                              ? 'bg-accent-green/15 text-graydark font-medium'
                              : isUser
                              ? 'bg-red-50 text-red-600'
                              : 'text-graydark/70'
                          }`}
                        >
                          {c} {isAns && '✓'} {isUser && !isAns && '(คำตอบของคุณ)'}
                        </div>
                      );
                    })}
                  </div>
                  <p className="sm:pl-8 mt-3 text-sm text-graydark/60">
                    <span className="font-medium text-navy">คำอธิบาย: </span>
                    {item.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href={topicId ? `/practice/${subjectId}` : '/practice'}
              className="flex-1 text-center border border-navy text-navy rounded-xl py-3 font-medium hover:bg-navy/5"
            >
              กลับไปเลือกชุดข้อสอบ
            </Link>
            <button
              onClick={restart}
              className="flex-1 bg-accent-cyan text-white rounded-xl py-3 font-medium hover:opacity-90"
            >
              ทำใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- ตัวนำทางข้อสอบ (ใช้ทั้งจอเล็กและจอใหญ่) ----------
  const navigator = (
    <div className="border border-graylight/30 rounded-2xl p-4 sm:p-5 bg-white">
      <p className="font-medium text-navy mb-3">รายการข้อสอบ</p>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-4 text-[11px] text-graydark/60">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-400" />
          ข้อปัจจุบัน
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-graylight/50" />
          ยังไม่ทำ
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-navy" />
          ทำแล้ว
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-amber-400" />
          ไม่แน่ใจ
        </span>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-4 gap-2 mb-4">
        {subjectQuestions.map((item, i) => {
          const isCurrent = i === current;
          const isAnswered = answers[item.id] !== undefined;
          const isFlagged = flagged[item.id];

          let cls = 'border border-graylight/40 text-graydark hover:border-navy/50';
          if (isAnswered) cls = 'bg-navy text-white border border-navy';
          if (isCurrent) cls = 'bg-orange-400 text-white border border-orange-400';

          return (
            <button
              key={item.id}
              onClick={() => setCurrent(i)}
              aria-label={`ไปข้อที่ ${i + 1}`}
              aria-current={isCurrent ? 'true' : undefined}
              className={`aspect-square rounded-lg text-sm font-medium transition-colors ${cls} ${
                isFlagged && !isCurrent ? 'ring-2 ring-amber-400' : ''
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <button
        onClick={submit}
        className="w-full bg-navy text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 mb-2"
      >
        ส่งข้อสอบ
      </button>
      <button
        onClick={restart}
        className="w-full flex items-center justify-center gap-1.5 border border-graylight/40 text-graydark rounded-xl py-2.5 text-sm font-medium hover:bg-graylight/10"
      >
        <RotateCcw size={14} />
        เริ่มทำใหม่
      </button>
    </div>
  );

  // ---------- หน้าทำข้อสอบ ----------
  return (
    <div className="min-h-screen bg-graylight/5">
      {/* แถบข้อมูลด้านบน */}
      <header className="bg-white border-b border-graylight/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={16} className="text-accent-cyan shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-graydark/40 leading-none mb-0.5">ชุดข้อสอบ</p>
                <p className="text-sm font-medium text-navy truncate">{setName}</p>
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] text-graydark/40 leading-none mb-0.5">จำนวนข้อ</p>
              <p className="text-sm font-medium text-navy">{total} ข้อ</p>
            </div>
            <div>
              <p className="text-[10px] text-graydark/40 leading-none mb-0.5">เวลาที่เหลือ</p>
              <p className="text-sm font-medium text-navy flex items-center gap-1 tabular-nums">
                <Clock size={13} />
                {formatTime(secondsLeft)}
              </p>
            </div>
          </div>

          <Link
            href={topicId ? `/practice/${subjectId}` : '/practice'}
            className="text-xs sm:text-sm font-medium text-red-500 border border-red-300 rounded-xl px-3 sm:px-4 py-2 hover:bg-red-50 shrink-0"
          >
            ออกจากการทำข้อสอบ
          </Link>
        </div>
      </header>

      <div className="h-1 bg-graylight/20">
        <div
          className="h-full bg-accent-cyan transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid gap-5 lg:grid-cols-[210px_1fr] xl:grid-cols-[210px_1fr_240px]">
        {/* ซ้าย: รายการข้อสอบ (จอใหญ่) */}
        <aside className="hidden lg:block">{navigator}</aside>

        {/* กลาง: คำถาม */}
        <main className="min-w-0">
          <div className="border border-graylight/30 rounded-2xl p-5 sm:p-6 bg-white">
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="font-semibold text-navy">
                ข้อที่ {current + 1} / {total}
              </p>
              <button
                onClick={() => setShowNav((s) => !s)}
                className="lg:hidden flex items-center gap-1.5 text-xs text-graydark/60 border border-graylight/40 rounded-lg px-3 py-1.5"
              >
                <ListOrdered size={13} />
                {showNav ? 'ซ่อนรายการข้อ' : 'รายการข้อ'}
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-medium text-graydark leading-relaxed mb-5">
              {q.question}
            </h2>

            <div className="space-y-2.5">
              {q.choices.map((choice, i) => {
                const selected = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(q.id, i)}
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
                      {CHOICE_LABELS[i]}
                    </span>
                    <span className="text-sm sm:text-base">{choice}</span>
                  </button>
                );
              })}
            </div>

            <label className="flex items-center gap-2 mt-5 text-sm text-graydark/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(flagged[q.id])}
                onChange={(e) =>
                  setFlagged((f) => ({ ...f, [q.id]: e.target.checked }))
                }
                className="w-4 h-4 accent-amber-400"
              />
              ไม่แน่ใจ ข้ามไปตอบภายหลัง
            </label>

            <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-graylight/20">
              <button
                disabled={current === 0}
                onClick={() => setCurrent((c) => c - 1)}
                className="flex items-center gap-1 px-3 sm:px-4 py-2.5 rounded-xl border border-graylight/40 text-graydark text-sm disabled:opacity-30"
              >
                <ChevronLeft size={16} />
                ข้อก่อนหน้า
              </button>

              {current < total - 1 ? (
                <button
                  onClick={() => setCurrent((c) => c + 1)}
                  className="flex items-center gap-1 px-4 sm:px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-medium hover:opacity-90"
                >
                  ข้อถัดไป
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={submit}
                  className="px-5 py-2.5 rounded-xl bg-accent-green text-navy text-sm font-semibold hover:opacity-90"
                >
                  ส่งข้อสอบ
                </button>
              )}
            </div>
          </div>

          {/* รายการข้อสอบแบบพับได้ (จอเล็ก) */}
          {showNav && <div className="mt-5 lg:hidden">{navigator}</div>}
        </main>

        {/* ขวา: ความคืบหน้า + รายละเอียด */}
        <aside className="space-y-5 lg:col-span-2 xl:col-span-1">
          <div className="border border-graylight/30 rounded-2xl p-5 bg-white flex xl:flex-col items-center gap-4 xl:gap-2">
            <ProgressRing pct={progressPct} />
            <div className="xl:text-center">
              <p className="text-sm text-graydark/60">
                ทำแล้ว {answeredCount} / {total} ข้อ
              </p>
              {Object.values(flagged).some(Boolean) && (
                <p className="text-xs text-amber-600 mt-1">
                  ทำเครื่องหมายไม่แน่ใจ {Object.values(flagged).filter(Boolean).length} ข้อ
                </p>
              )}
            </div>
          </div>

          <div className="border border-graylight/30 rounded-2xl p-5 bg-white">
            <p className="text-xs text-graydark/50 mb-3">รายละเอียดชุดข้อสอบ</p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] text-graydark/40">วิชา</dt>
                <dd className="font-medium text-navy">{subject.name}</dd>
              </div>
              {topic && (
                <div>
                  <dt className="text-[11px] text-graydark/40">ชุดข้อสอบ</dt>
                  <dd className="font-medium text-navy">{topic.name}</dd>
                </div>
              )}
              <div>
                <dt className="text-[11px] text-graydark/40">จำนวนข้อ</dt>
                <dd className="font-medium text-navy">{total} ข้อ</dd>
              </div>
              <div>
                <dt className="text-[11px] text-graydark/40">เวลา</dt>
                <dd className="font-medium text-navy">{total} นาที</dd>
              </div>
              <div>
                <dt className="text-[11px] text-graydark/40">คะแนนเต็ม</dt>
                <dd className="font-medium text-navy">{total} คะแนน</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
