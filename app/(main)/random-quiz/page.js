'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Lightbulb,
  Shuffle,
} from 'lucide-react';
import { questions } from '@/lib/questions';
import { subjects } from '@/lib/subjects';
import { subjectStyles } from '@/lib/subjectStyles';
import { topics as allTopics, topicsBySubject } from '@/lib/topics';
import { confirmIncompleteAnswers } from '@/lib/sweetAlert';
import { useExamCatalog } from '@/lib/useExamCatalog';
import { useMembershipStatus } from '@/lib/useMembershipStatus';
import { useAttemptHistory } from '@/lib/useAttemptHistory';
import { noCopyHandlers } from '@/lib/copyProtection';
import ExamResultSummary from '@/components/ExamResultSummary';

const QUESTION_OPTIONS = [5, 10, 20, 30, 50];
const CHOICE_LABELS = ['A', 'B', 'C', 'D'];
const FREE_RANDOM_QUIZ_LIMIT = 3;

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function difficultyLabel(value) {
  if (value === 'easy') return 'ง่าย';
  if (value === 'hard') return 'ยาก';
  return 'ปานกลาง';
}

function difficultyClass(value) {
  if (value === 'easy') return 'bg-emerald-50 text-emerald-700';
  if (value === 'hard') return 'bg-red-50 text-red-600';
  return 'bg-amber-50 text-amber-700';
}

function countOptionsFor(availableCount) {
  return availableCount < 10 ? QUESTION_OPTIONS : QUESTION_OPTIONS.slice(1);
}

function SubjectSelector({ selectedSubjectId, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {subjects.map((subject) => {
        const selected = subject.id === selectedSubjectId;
        const style = subjectStyles[subject.id];
        const Icon = style.icon;

        return (
          <button
            key={subject.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(subject.id)}
            className={`flex min-h-[3.25rem] items-center gap-2 rounded-2xl border px-3 py-3 text-left text-xs font-bold transition sm:gap-3 sm:px-4 sm:text-sm ${
              selected
                ? 'border-navy bg-navy text-white shadow-[0_8px_18px_rgba(18,31,62,0.16)]'
                : 'border-graylight/35 bg-white text-graydark hover:border-navy/35 hover:bg-slate-50'
            }`}
          >
            <Icon size={18} className={selected ? 'text-accent-gold' : 'text-accent-cyan'} />
            <span>{style.short}</span>
          </button>
        );
      })}
    </div>
  );
}

function Setup({
  subjectId,
  selectedTopics,
  setSelectedTopics,
  count,
  setCount,
  showAnswers,
  setShowAnswers,
  availableCount,
  availableTopics,
  topicGroups,
  selectedGroupId,
  setSelectedGroupId,
  onSelectSubject,
  onStart,
  isUnlimited,
}) {
  const subject = subjects.find((item) => item.id === subjectId);
  const subjectTopics = availableTopics || topicsBySubject(subjectId);
  const subjectGroups = (topicGroups || []).filter((group) => group.subject_id === subjectId);
  const selectedGroup = subjectGroups.find((group) => group.id === selectedGroupId) || null;
  const selectedGroupTopics = selectedGroup
    ? subjectTopics.filter((topic) => topic.groupId === selectedGroup.id)
    : subjectTopics;
  const countOptions = countOptionsFor(availableCount);
  const selectedTopicNames = subjectTopics
    .filter((topic) => selectedTopics.includes(topic.id))
    .map((topic) => topic.name);
  const selectionLabel = selectedTopicNames.length
    ? selectedTopicNames.join(', ')
    : 'ทุกหัวข้อ';
  const canStart = availableCount >= count && count > 0;

  function selectGroup(groupId) {
    setSelectedGroupId(groupId);
    if (!groupId) {
      setSelectedTopics([]);
      return;
    }
    setSelectedTopics(subjectTopics
      .filter((topic) => topic.groupId === groupId && topic.available)
      .map((topic) => topic.id));
  }

  function selectTopic(topicId) {
    if (!topicId) {
      setSelectedTopics(selectedGroupTopics.filter((topic) => topic.available).map((topic) => topic.id));
      return;
    }
    setSelectedTopics([topicId]);
  }

  return (
    <div className="mx-auto max-w-4xl pb-8">
      <header className="border-l-4 border-accent-gold pl-4 sm:pl-5">
        <h1 className="text-2xl font-black tracking-tight text-navy sm:text-3xl">Random Quiz</h1>
        <p className="mt-1 text-sm text-graydark/60">สุ่มข้อสอบจากหัวข้อที่เลือก ฝึกได้ทุกเมื่อ</p>
      </header>

      <section className="app-card mt-7 overflow-hidden p-5 shadow-[0_12px_30px_rgba(18,31,62,0.08)] sm:p-8">
        <div>
          <p className="text-xs font-bold text-graydark/55">เลือกวิชา</p>
          <div className="mt-3">
            <SubjectSelector selectedSubjectId={subjectId} onSelect={onSelectSubject} />
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-graydark/55">เลือกหมวดหลักและหมวดย่อย</p>
              <p className="mt-1 text-xs text-graydark/45">ลดรายการยาวบนมือถือ โดยเลือกได้ทั้งหมวดหลักหรือเจาะจงหมวดย่อย</p>
            </div>
            {selectedTopics.length > 0 && (
              <button type="button" onClick={() => selectGroup('')} className="text-xs font-bold text-accent-cyan hover:underline">ล้างตัวเลือก</button>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-graydark/65">
              หมวดหลัก
              <select
                value={selectedGroupId}
                onChange={(event) => selectGroup(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-navy outline-none focus:border-accent-cyan focus:ring-4 focus:ring-cyan-500/10"
              >
                <option value="">ทุกหมวดหลัก</option>
                {subjectGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                {!subjectGroups.length && <option value="" disabled>ยังไม่ได้จัดหมวดหลักโดยผู้ดูแล</option>}
              </select>
            </label>
            <label className="text-xs font-bold text-graydark/65">
              หมวดย่อย
              <select
                value={selectedTopics.length === 1 ? selectedTopics[0] : ''}
                onChange={(event) => selectTopic(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-navy outline-none focus:border-accent-cyan focus:ring-4 focus:ring-cyan-500/10"
              >
                <option value="">{selectedGroup ? `ทุกหัวข้อใน ${selectedGroup.name}` : 'ทุกหมวดย่อย'}</option>
                {selectedGroupTopics.map((topic) => (
                  <option key={topic.id} value={topic.id} disabled={!topic.available}>
                    {topic.name}{!topic.available ? ' · ยังไม่เปิด' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-7">
          <p className="text-xs font-bold text-graydark/55">จำนวนข้อ</p>
          {isUnlimited ? (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {countOptions.map((value) => {
                const isAvailable = availableCount >= value;
                const selected = count === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setCount(value)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-35 ${
                      selected
                        ? 'border-navy bg-navy text-white shadow-[0_8px_18px_rgba(18,31,62,0.14)]'
                        : 'border-graylight/35 bg-white text-navy hover:border-navy/35'
                    }`}
                  >
                    {value} ข้อ
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-navy">บัญชีฟรีทดลองได้ {FREE_RANDOM_QUIZ_LIMIT} ข้อต่อวิชา</p>
              <p className="mt-1 text-xs leading-5 text-graydark/60">ทดลองใช้งานก่อนตัดสินใจสมัครสมาชิก เพื่อปลดล็อกทำ Random Quiz ได้ไม่จำกัดจำนวนข้อ</p>
              <Link href="/account" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-accent-cyan hover:underline">สมัครสมาชิกเพื่อทำไม่จำกัด →</Link>
            </div>
          )}
          <p className="mt-2 text-xs text-graydark/50">คลังข้อสอบที่ตรงกับตัวเลือก: {availableCount} ข้อ</p>
        </div>

        <label className="mt-6 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/65 px-4 py-3">
          <span>
            <span className="block text-sm font-bold text-navy">เฉลยทันทีหลังเลือกคำตอบ</span>
            <span className="mt-0.5 block text-xs text-graydark/55">เหมาะสำหรับโหมดฝึกและทบทวนจุดพลาด</span>
          </span>
          <input
            type="checkbox"
            checked={showAnswers}
            onChange={(event) => setShowAnswers(event.target.checked)}
            className="h-5 w-5 shrink-0 rounded border-graylight/60 text-accent-cyan focus:ring-accent-cyan"
          />
        </label>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-navy">
          <span className="font-bold text-accent-cyan">สุ่ม {count} ข้อ</span>
          <span> จากวิชา {subject?.name} · {selectionLabel}</span>
        </div>

        {!canStart && (
          <p className="mt-3 text-xs font-semibold text-red-500">จำนวนข้อในคลังยังไม่เพียงพอ กรุณาเลือกหมวดเพิ่ม หรือลดจำนวนข้อ</p>
        )}
        <button
          type="button"
          disabled={!canStart}
          onClick={onStart}
          className="btn-navy mt-6 flex w-full items-center justify-center gap-2 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Shuffle size={19} />
          สุ่มข้อสอบ
        </button>
      </section>
    </div>
  );
}

function Navigator({ quiz, current, answers, onSelect, onFinish }) {
  return (
    <aside className="rounded-2xl border border-graylight/25 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-navy">รายการข้อ</p>
        <span className="text-xs text-graydark/50">ตอบแล้ว {Object.keys(answers).length}/{quiz.length}</span>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {quiz.map((question, index) => {
          const active = index === current;
          const answered = answers[question.id] !== undefined;
          return (
            <button
              key={question.id}
              type="button"
              aria-label={`ข้อที่ ${index + 1}`}
              aria-current={active ? 'true' : undefined}
              onClick={() => onSelect(index)}
              className={`aspect-square rounded-lg text-xs font-black transition ${
                active
                  ? 'bg-accent-gold text-navy shadow-sm'
                  : answered
                    ? 'bg-navy text-white'
                    : 'border border-graylight/35 text-graydark/60 hover:border-navy/45'
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <button type="button" onClick={onFinish} className="btn-navy mt-4 w-full py-2.5 text-sm">ส่งคำตอบ</button>
    </aside>
  );
}

function QuizRunner({ quiz, showAnswers, onRestart, onShuffleAgain, onCompleted }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [finished, setFinished] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const question = quiz[current];
  const answer = answers[question.id];
  const answeredCount = Object.keys(answers).length;
  const score = quiz.reduce((total, item) => total + (answers[item.id] === item.answerIndex ? 1 : 0), 0);
  const progress = Math.round((answeredCount / quiz.length) * 100);
  const subject = subjects.find((item) => item.id === question.subjectId);
  const style = subjectStyles[question.subjectId];
  const SubjectIcon = style.icon;

  function selectAnswer(choiceIndex) {
    if (showAnswers && answer !== undefined) return;
    setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: choiceIndex }));
  }

  async function finish() {
    const unanswered = quiz.length - answeredCount;
    if (unanswered && !(await confirmIncompleteAnswers(unanswered, 'ส่งคำตอบ'))) return;
    if (onCompleted) {
      void onCompleted({ quiz, answers });
    }
    setFinished(true);
  }

  if (finished) {
    return (
      <FinishedResult
        quiz={quiz}
        answers={answers}
        elapsedSeconds={Math.round((Date.now() - startedAt) / 1000)}
        onBack={onRestart}
        onShuffleAgain={onShuffleAgain}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <header className="overflow-hidden rounded-2xl border border-graylight/25 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="กลับไปตั้งค่า Quiz" onClick={onRestart} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-graylight/35 text-graydark/60 transition hover:bg-slate-50"><ArrowLeft size={17} /></button>
            <div className="min-w-0"><p className="text-[11px] font-bold text-accent-cyan">RANDOM QUIZ</p><p className="truncate text-sm font-black text-navy">ข้อที่ {current + 1} / {quiz.length}</p></div>
          </div>
          <div className="flex items-center gap-2"><span className="hidden rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-graydark/60 sm:inline">ตอบแล้ว {answeredCount}/{quiz.length}</span><button type="button" onClick={finish} className="btn-navy px-3 py-2 text-xs sm:px-4 sm:text-sm">ส่งคำตอบ</button></div>
        </div>
        <div className="h-1 bg-graylight/20"><div className="h-full bg-accent-cyan transition-all" style={{ width: `${progress}%` }} /></div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="hidden lg:block"><Navigator quiz={quiz} current={current} answers={answers} onSelect={setCurrent} onFinish={finish} /></div>
        <main className="min-w-0">
          <section className="rounded-3xl border border-graylight/25 bg-white p-5 shadow-sm sm:p-7 no-copy" {...noCopyHandlers}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold ${style.chip}`}><SubjectIcon size={15} />{subject?.name}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${difficultyClass(question.difficulty)}`}>{difficultyLabel(question.difficulty)}</span>
            </div>
            <div className="mt-6 flex items-start justify-between gap-3">
              <h1 className="text-lg font-black leading-8 text-navy sm:text-xl">{question.question}</h1>
              <button type="button" aria-label={flagged[question.id] ? 'ยกเลิกทำเครื่องหมาย' : 'ทำเครื่องหมายไว้'} onClick={() => setFlagged((currentFlags) => ({ ...currentFlags, [question.id]: !currentFlags[question.id] }))} className={`shrink-0 rounded-xl border p-2 transition ${flagged[question.id] ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-graylight/35 text-graydark/45 hover:border-amber-300'}`}><Flag size={17} fill={flagged[question.id] ? 'currentColor' : 'none'} /></button>
            </div>
            <div className="mt-6 space-y-3">
              {question.choices.map((choice, index) => {
                const selected = answer === index;
                const showCorrect = showAnswers && answer !== undefined && index === question.answerIndex;
                const showWrong = showAnswers && selected && index !== question.answerIndex;
                return (
                  <button key={choice} type="button" disabled={showAnswers && answer !== undefined} onClick={() => selectAnswer(index)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition disabled:cursor-default ${showCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : showWrong ? 'border-red-300 bg-red-50 text-red-700' : selected ? 'border-navy bg-navy text-white' : 'border-graylight/35 bg-white text-graydark hover:border-navy/45 hover:bg-slate-50'}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black ${selected && !showCorrect && !showWrong ? 'bg-white/15' : 'bg-slate-100 text-navy'}`}>{CHOICE_LABELS[index]}</span>
                    <span>{choice}</span>
                  </button>
                );
              })}
            </div>
            {showAnswers && answer !== undefined && <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4"><div className="flex gap-2"><Lightbulb size={18} className="mt-0.5 shrink-0 text-accent-cyan" /><div><p className="text-sm font-black text-navy">เฉลยและแนวคิด</p><p className="mt-1 text-sm leading-6 text-graydark/70">{question.explanation}</p></div></div></div>}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button type="button" disabled={current === 0} onClick={() => setCurrent((item) => Math.max(0, item - 1))} className="inline-flex items-center gap-1 rounded-xl border border-graylight/35 px-3 py-2.5 text-sm font-bold text-graydark/65 disabled:opacity-35"><ChevronLeft size={17} /> ก่อนหน้า</button>
              {current === quiz.length - 1 ? <button type="button" onClick={finish} className="btn-navy inline-flex items-center gap-1">ดูผลคะแนน <CheckCircle2 size={16} /></button> : <button type="button" onClick={() => setCurrent((item) => Math.min(quiz.length - 1, item + 1))} className="btn-navy inline-flex items-center gap-1">ข้อต่อไป <ChevronRight size={16} /></button>}
            </div>
          </section>
          <div className="mt-4 lg:hidden"><Navigator quiz={quiz} current={current} answers={answers} onSelect={setCurrent} onFinish={finish} /></div>
        </main>
      </div>
    </div>
  );
}

function FinishedResult({ quiz, answers, elapsedSeconds, onBack, onShuffleAgain }) {
  const score = quiz.reduce((total, item) => total + (answers[item.id] === item.answerIndex ? 1 : 0), 0);
  const subjectId = quiz[0]?.subjectId || null;
  const subjectName = subjects.find((item) => item.id === subjectId)?.name || null;
  const history = useAttemptHistory({ bank: 'random', subjectId });

  const items = quiz.map((item) => {
    const topicName = item.topicId ? allTopics.find((topic) => topic.id === item.topicId)?.name : null;
    return {
      id: item.id,
      question: item.question,
      choices: item.choices,
      answerIndex: item.answerIndex,
      selectedIndex: answers[item.id],
      explanation: item.explanation,
      categoryId: item.topicId || subjectId,
      categoryName: topicName || subjectName,
    };
  });

  return (
    <ExamResultSummary
      title="Random Quiz"
      subtitle={subjectName}
      score={score}
      total={quiz.length}
      elapsedSeconds={elapsedSeconds}
      standardSeconds={null}
      items={items}
      history={history}
      onBack={onBack}
      backLabel="กลับไปตั้งค่า Quiz"
      onRetryNew={onShuffleAgain}
      newLabel="สุ่มข้อสอบใหม่"
      practiceHrefForCategory={(categoryId) => (subjectId ? `/exam/${subjectId}?topic=${categoryId}` : null)}
    />
  );
}

export default function RandomQuizPage() {
  const [subjectId, setSubjectId] = useState('english');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [count, setCount] = useState(FREE_RANDOM_QUIZ_LIMIT);
  const [showAnswers, setShowAnswers] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [databaseQuestions, setDatabaseQuestions] = useState(null);
  const { data: catalog } = useExamCatalog('practice');
  const { loading: membershipLoading, membership } = useMembershipStatus();
  const isUnlimited = !membershipLoading && Boolean(membership?.permissions?.randomQuiz);
  const availableTopics = useMemo(() => {
    const databaseTopics = (catalog?.topics || [])
      .filter((topic) => topic.subject_id === subjectId)
      .map((topic) => ({
        id: topic.legacy_id || topic.id,
        name: topic.name,
        available: true,
        groupId: topic.group_id || '',
      }));
    return databaseTopics.length ? databaseTopics : topicsBySubject(subjectId);
  }, [catalog, subjectId]);
  const topicGroups = useMemo(
    () => (catalog?.topicGroups || []).filter((group) => group.subject_id === subjectId),
    [catalog, subjectId],
  );

  useEffect(() => {
    let active = true;
    async function loadQuestions() {
      try {
        const params = new URLSearchParams({ subject: subjectId, mode: 'random' });
        if (selectedTopics.length) params.set('topics', selectedTopics.join(','));
        const response = await fetch(`/api/practice-questions?${params.toString()}`, { cache: 'no-store' });
        const result = await response.json();
        if (active) setDatabaseQuestions(response.ok && result.questions?.length ? result.questions : null);
      } catch {
        if (active) setDatabaseQuestions(null);
      }
    }
    loadQuestions();
    return () => { active = false; };
  }, [subjectId, selectedTopics]);

  const availableQuestions = useMemo(() => {
    const source = databaseQuestions || questions;
    return source.filter((item) => (
      item.subjectId === subjectId
      && (selectedTopics.length === 0 || selectedTopics.includes(item.topicId))
    ));
  }, [databaseQuestions, subjectId, selectedTopics]);
  const availableCount = availableQuestions.length;

  useEffect(() => {
    if (!isUnlimited) {
      if (count !== FREE_RANDOM_QUIZ_LIMIT) setCount(FREE_RANDOM_QUIZ_LIMIT);
      return;
    }
    if (count === FREE_RANDOM_QUIZ_LIMIT) setCount(QUESTION_OPTIONS[0]);
  }, [isUnlimited, count]);

  useEffect(() => {
    if (!isUnlimited) return;
    if (availableCount >= count) return;
    const nextCount = [...QUESTION_OPTIONS].reverse().find((value) => value <= availableCount);
    if (nextCount) setCount(nextCount);
  }, [isUnlimited, availableCount, count]);

  function selectSubject(nextSubjectId) {
    setSubjectId(nextSubjectId);
    setSelectedTopics([]);
    setSelectedGroupId('');
  }

  function start() {
    if (availableCount < count) return;
    setQuiz(shuffle(availableQuestions).slice(0, count));
  }

  async function saveRandomAttempt({ quiz: completedQuiz, answers: completedAnswers }) {
    const subject = subjects.find((item) => item.id === subjectId);
    try {
      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank: 'random',
          subjectId,
          title: `Random Quiz · ${subject?.name || subjectId}`,
          questionIds: completedQuiz.map((question) => question.id),
          answers: completedAnswers,
          elapsedSeconds: 0,
        }),
      });
    } catch {
      // The quiz remains usable when the result cannot be saved.
    }
  }

  if (quiz) {
    return (
      <QuizRunner
        quiz={quiz}
        showAnswers={showAnswers}
        onRestart={() => setQuiz(null)}
        onShuffleAgain={start}
        onCompleted={databaseQuestions ? saveRandomAttempt : undefined}
      />
    );
  }

  return <Setup subjectId={subjectId} selectedTopics={selectedTopics} setSelectedTopics={setSelectedTopics} count={count} setCount={setCount} showAnswers={showAnswers} setShowAnswers={setShowAnswers} availableCount={availableCount} availableTopics={availableTopics} topicGroups={topicGroups} selectedGroupId={selectedGroupId} setSelectedGroupId={setSelectedGroupId} onSelectSubject={selectSubject} onStart={start} isUnlimited={isUnlimited} />;
}
