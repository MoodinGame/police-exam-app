'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { subjects } from '@/lib/subjects';
import { questions } from '@/lib/questions';
import { topics } from '@/lib/topics';
import { recordTopicAttempt } from '@/lib/progress';
import { CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react';

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
  const [secondsLeft, setSecondsLeft] = useState(subjectQuestions.length * 60); // demo: 1 นาที/ข้อ
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

  const selectAnswer = (qId, choiceIndex) => {
    if (phase !== 'taking') return;
    setAnswers((prev) => ({ ...prev, [qId]: choiceIndex }));
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  if (phase === 'result') {
    return (
      <div className="min-h-screen bg-white px-4 sm:px-6 py-6 sm:py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-navy text-white rounded-2xl p-6 sm:p-8 text-center mb-8">
            <p className="text-graylight mb-1">ผลคะแนน · {topic ? topic.name : subject.name}</p>
            <p className="text-5xl font-bold mb-1">
              {score}
              <span className="text-2xl text-graylight">/{subjectQuestions.length}</span>
            </p>
            <p className="text-accent-cyan">
              {Math.round((score / subjectQuestions.length) * 100)}% ถูกต้อง
            </p>
          </div>

          <div className="space-y-4">
            {subjectQuestions.map((item, idx) => {
              const userAnswer = answers[item.id];
              const isCorrect = userAnswer === item.answerIndex;
              return (
                <div key={item.id} className="border border-graylight/30 rounded-xl p-5">
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
                  <div className="pl-8 space-y-1.5 text-sm">
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
                  <p className="pl-8 mt-3 text-sm text-graydark/60">
                    <span className="font-medium text-navy">คำอธิบาย: </span>
                    {item.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 mt-8">
            <Link
              href="/practice"
              className="flex-1 text-center border border-navy text-navy rounded-xl py-3 font-medium hover:bg-navy/5"
            >
              กลับไปเลือกวิชา
            </Link>
            <button
              onClick={() => {
                setAnswers({});
                setCurrent(0);
                setSecondsLeft(subjectQuestions.length * 60);
                recordedRef.current = false;
                setPhase('taking');
              }}
              className="flex-1 bg-accent-cyan text-white rounded-xl py-3 font-medium hover:opacity-90"
            >
              ทำใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-graylight/30 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <Link
          href="/practice"
          className="flex items-center gap-1.5 text-graydark/60 hover:text-navy text-sm shrink-0"
        >
          <ArrowLeft size={16} />
          {/* จอเล็กเหลือแค่ลูกศร ไม่งั้นหัวข้อกับเวลาจะถูกบีบจนอ่านไม่ออก */}
          <span className="hidden sm:inline">ออกจากการทำข้อสอบ</span>
        </Link>
        <p className="font-medium text-navy text-sm sm:text-base truncate min-w-0">
          {topic ? topic.name : subject.name}
        </p>
        <div className="flex items-center gap-1.5 text-navy font-medium shrink-0 tabular-nums">
          <Clock size={16} />
          {formatTime(secondsLeft)}
        </div>
      </header>

      <div className="h-1.5 bg-graylight/20">
        <div
          className="h-full bg-accent-cyan transition-all"
          style={{ width: `${((current + 1) / subjectQuestions.length) * 100}%` }}
        />
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <p className="text-sm text-graydark/50 mb-2">
          ข้อ {current + 1} / {subjectQuestions.length}
        </p>
        <h2 className="text-lg font-medium text-graydark mb-6">{q.question}</h2>

        <div className="space-y-3">
          {q.choices.map((choice, i) => {
            const selected = answers[q.id] === i;
            return (
              <button
                key={i}
                onClick={() => selectAnswer(q.id, i)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selected
                    ? 'border-accent-cyan bg-accent-cyan/10 text-navy font-medium'
                    : 'border-graylight/40 text-graydark hover:border-navy/40'
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-10">
          <button
            disabled={current === 0}
            onClick={() => setCurrent((c) => c - 1)}
            className="px-5 py-2.5 rounded-xl border border-graylight/40 text-graydark disabled:opacity-30"
          >
            ก่อนหน้า
          </button>
          {current < subjectQuestions.length - 1 ? (
            <button
              onClick={() => setCurrent((c) => c + 1)}
              className="ml-auto px-6 py-2.5 rounded-xl bg-navy text-white font-medium hover:opacity-90"
            >
              ข้อถัดไป
            </button>
          ) : (
            <button
              onClick={() => setPhase('result')}
              className="ml-auto px-6 py-2.5 rounded-xl bg-accent-green text-navy font-semibold hover:opacity-90"
            >
              ส่งคำตอบ
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
