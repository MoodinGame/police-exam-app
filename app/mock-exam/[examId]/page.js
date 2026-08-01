'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Flag, PauseCircle, Send, XCircle } from 'lucide-react';
import { mockExamBlueprint, mockExamReady } from '@/lib/mockExamCatalog';
import { mockQuestionBank } from '@/lib/mockQuestionBank';
import { clearSessionIf, getSessionFor, mockSessionId, saveSession } from '@/lib/examSession';

const LETTERS = ['A', 'B', 'C', 'D'];

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function MockExamTakingPage() {
  const { examId } = useParams();
  const questions = useMemo(() => mockQuestionBank.slice(0, mockExamBlueprint.totalQuestions), []);
  const sessionId = mockSessionId(examId);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(mockExamBlueprint.durationMinutes * 60);
  const [phase, setPhase] = useState('taking');
  const [restored, setRestored] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    const saved = getSessionFor(sessionId);
    if (saved?.kind === 'mock') {
      setCurrent(Math.min(saved.current || 0, Math.max(questions.length - 1, 0)));
      setAnswers(saved.answers || {});
      setFlagged(saved.flagged || {});
      setSecondsLeft(saved.secondsLeft ?? mockExamBlueprint.durationMinutes * 60);
    }
    setRestored(true);
  }, [sessionId, questions.length]);

  useEffect(() => {
    if (!restored || phase !== 'taking' || !questions.length) return;
    saveSession({ sessionId, kind: 'mock', examId, label: mockExamBlueprint.title, answers, flagged, current, secondsLeft, total: questions.length });
  }, [answers, current, examId, flagged, phase, questions.length, restored, secondsLeft, sessionId]);

  useEffect(() => {
    if (!restored || phase !== 'taking') return;
    if (secondsLeft <= 0) { setPhase('result'); return; }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, restored, secondsLeft]);

  const score = questions.reduce((sum, question) => sum + (answers[question.id] === question.answerIndex ? 1 : 0), 0);
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.keys(flagged).filter((id) => flagged[id]).length;

  useEffect(() => {
    if (phase === 'result' && !recorded.current) { recorded.current = true; clearSessionIf(sessionId); }
  }, [phase, sessionId]);

  if (!mockExamReady || questions.length !== mockExamBlueprint.totalQuestions) {
    return <main className="min-h-screen bg-graylight/10 px-4 py-10 sm:p-10 flex items-center justify-center"><div className="max-w-lg bg-white border border-graylight/30 rounded-2xl p-6 sm:p-8 text-center"><AlertCircle className="text-orange-500 mx-auto mb-4" size={34} /><h1 className="text-xl font-semibold text-navy mb-2">คลัง Mock Exam ยังไม่ครบ</h1><p className="text-sm text-graydark/60 mb-6">ระบบจะเปิดหน้านี้เมื่อมีข้อสอบใหม่ครบ 150 ข้อ และไม่ซ้ำกับแบบฝึกหัดรายวิชา</p><Link href="/mock-exam" className="inline-flex items-center gap-2 bg-navy text-white rounded-xl px-5 py-3 text-sm font-medium"><ArrowLeft size={16} /> กลับหน้า Mock Exam</Link></div></main>;
  }

  if (phase === 'result') {
    const passed = score >= mockExamBlueprint.passScore;
    return <main className="min-h-screen bg-graylight/10 px-4 py-8 sm:p-10"><div className="max-w-3xl mx-auto"><div className="bg-navy text-white rounded-2xl p-7 sm:p-9 text-center mb-6"><p className="text-white/65 text-sm mb-2">ผลคะแนน · {mockExamBlueprint.title}</p><p className="text-5xl font-bold">{score}<span className="text-2xl text-white/55">/{questions.length}</span></p><p className={`mt-2 font-medium ${passed ? 'text-accent-green' : 'text-orange-300'}`}>{passed ? 'ผ่านเกณฑ์' : 'ยังไม่ผ่านเกณฑ์'} · เกณฑ์ {mockExamBlueprint.passScore} คะแนน</p></div><div className="space-y-3">{questions.map((question, index) => { const correct = answers[question.id] === question.answerIndex; return <article key={question.id} className="bg-white border border-graylight/25 rounded-xl p-5"><div className="flex gap-3"><span className={correct ? 'text-accent-green' : 'text-red-500'}>{correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}</span><p className="font-medium text-graydark">{index + 1}. {question.question}</p></div><p className="mt-3 text-sm text-graydark/65"><span className="font-medium text-navy">เฉลย: </span>{question.choices[question.answerIndex]}</p><p className="mt-1 text-sm text-graydark/60">{question.explanation}</p></article>; })}</div><Link href="/mock-exam" className="mt-6 inline-flex items-center justify-center w-full sm:w-auto bg-navy text-white rounded-xl px-5 py-3 text-sm font-medium">กลับหน้า Mock Exam</Link></div></main>;
  }

  const question = questions[current];
  const submit = () => { const remaining = questions.length - answeredCount; if (remaining && !window.confirm(`ยังเหลือ ${remaining} ข้อที่ยังไม่ได้ตอบ ต้องการส่งข้อสอบเลยหรือไม่?`)) return; setPhase('result'); };
  const pause = () => { saveSession({ sessionId, kind: 'mock', examId, label: mockExamBlueprint.title, answers, flagged, current, secondsLeft, total: questions.length }); window.location.href = '/mock-exam'; };

  return <div className="min-h-screen bg-graylight/10"><header className="bg-navy text-white px-4 sm:px-6 py-3"><div className="max-w-7xl mx-auto flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-accent-cyan text-[11px] font-medium">MOCK EXAM</p><p className="text-sm font-medium truncate">{mockExamBlueprint.title}</p></div><div className="flex items-center gap-2 shrink-0 text-sm font-semibold tabular-nums"><Clock3 size={17} className="text-accent-cyan" /> {formatTime(secondsLeft)}</div></div></header><main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)_240px]"><aside className="hidden lg:block bg-white border border-graylight/25 rounded-2xl p-4 h-fit sticky top-5"><p className="font-semibold text-navy text-sm mb-3">รายการข้อสอบ</p><QuestionGrid questions={questions} answers={answers} flagged={flagged} current={current} onPick={setCurrent} /></aside><section className="min-w-0"><button type="button" onClick={() => setShowNavigator((value) => !value)} className="lg:hidden w-full mb-3 bg-white border border-graylight/25 rounded-xl px-4 py-3 text-sm font-medium text-navy">{showNavigator ? 'ซ่อนรายการข้อ' : 'รายการข้อ'} · ทำแล้ว {answeredCount}/{questions.length}</button>{showNavigator && <div className="lg:hidden bg-white border border-graylight/25 rounded-2xl p-4 mb-4"><QuestionGrid questions={questions} answers={answers} flagged={flagged} current={current} onPick={(index) => { setCurrent(index); setShowNavigator(false); }} /></div>}<article className="bg-white border border-graylight/25 rounded-2xl p-5 sm:p-7"><p className="text-sm text-graydark/50 mb-2">ข้อที่ {current + 1} / {questions.length}</p><h1 className="text-lg font-medium text-graydark leading-relaxed mb-6">{question.question}</h1><div className="space-y-3">{question.choices.map((choice, index) => <button key={choice} onClick={() => setAnswers((old) => ({ ...old, [question.id]: index }))} className={`w-full flex items-center gap-3 text-left p-3.5 rounded-xl border transition-colors ${answers[question.id] === index ? 'border-accent-cyan bg-accent-cyan/10 text-navy' : 'border-graylight/35 text-graydark hover:border-navy/40'}`}><span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${answers[question.id] === index ? 'bg-accent-cyan text-white' : 'bg-navy/8 text-navy'}`}>{LETTERS[index]}</span><span className="text-sm">{choice}</span></button>)}</div><label className="mt-5 flex items-center gap-2 text-sm text-graydark/65 cursor-pointer"><input type="checkbox" checked={Boolean(flagged[question.id])} onChange={(event) => setFlagged((old) => ({ ...old, [question.id]: event.target.checked }))} className="accent-orange-400 w-4 h-4" /><Flag size={15} className="text-orange-400" /> ไม่แน่ใจ ข้ามไปตอบภายหลัง</label></article><div className="flex justify-between gap-3 mt-4"><button type="button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} className="rounded-xl border border-graylight/35 px-4 py-3 text-sm disabled:opacity-40">ข้อก่อนหน้า</button>{current < questions.length - 1 ? <button type="button" onClick={() => setCurrent((value) => value + 1)} className="rounded-xl bg-navy text-white px-4 py-3 text-sm">ข้อถัดไป</button> : <button type="button" onClick={submit} className="rounded-xl bg-accent-cyan text-white px-4 py-3 text-sm">ส่งข้อสอบ</button>}</div></section><aside className="space-y-4 lg:sticky lg:top-5 h-fit"><div className="bg-white border border-graylight/25 rounded-2xl p-5 text-center"><p className="text-3xl font-bold text-navy">{Math.round((answeredCount / questions.length) * 100)}%</p><p className="text-xs text-graydark/55 mt-1">ทำแล้ว {answeredCount}/{questions.length} ข้อ</p>{flaggedCount > 0 && <p className="text-xs text-orange-600 mt-2">ไม่แน่ใจ {flaggedCount} ข้อ</p>}</div><div className="bg-white border border-graylight/25 rounded-2xl p-4"><p className="font-semibold text-navy text-sm mb-2">การจัดการข้อสอบ</p><button type="button" onClick={pause} className="w-full flex items-center justify-center gap-2 border border-navy/25 text-navy rounded-xl py-2.5 text-sm font-medium"><PauseCircle size={16} /> หยุดพักไว้ก่อน</button><button type="button" onClick={submit} className="w-full flex items-center justify-center gap-2 bg-accent-cyan text-white rounded-xl py-2.5 text-sm font-medium mt-2"><Send size={16} /> ส่งข้อสอบ</button></div></aside></main></div>;
}

function QuestionGrid({ questions, answers, flagged, current, onPick }) {
  return <div className="grid grid-cols-5 gap-2">{questions.map((question, index) => { const active = index === current; const answered = answers[question.id] !== undefined; return <button key={question.id} type="button" onClick={() => onPick(index)} className={`relative aspect-square rounded-lg text-xs font-semibold border ${active ? 'bg-orange-400 border-orange-400 text-white' : answered ? 'bg-navy border-navy text-white' : 'border-graylight/40 text-graydark hover:border-navy/50'} ${flagged[question.id] && !active ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>{index + 1}</button>; })}</div>;
}
