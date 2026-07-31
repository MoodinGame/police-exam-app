'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Trophy,
  Target,
  Flame,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { subjects, totalQuestions } from '@/lib/subjects';
import { getDailyQuestions, todayIsoDate } from '@/lib/dailyChallenge';

const EXAM_DATE = new Date('2026-11-29T00:00:00+07:00');

function useCountdown(target) {
  // เริ่มที่ null เสมอเพื่อให้ markup ตอน SSR กับตอน hydrate ตรงกัน
  // (Date.now() บนเซิร์ฟเวอร์กับตอน hydrate ไม่มีทางเท่ากันเป๊ะ) แล้วค่อยคำนวณจริงหลัง mount
  const [left, setLeft] = useState(null);

  useEffect(() => {
    function tick() {
      setLeft(target.getTime() - Date.now());
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);

  if (left === null) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, reached: false, loading: true };
  }

  const clamped = Math.max(left, 0);
  return {
    days: Math.floor(clamped / 86400000),
    hours: Math.floor((clamped / 3600000) % 24),
    minutes: Math.floor((clamped / 60000) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
    reached: left <= 0,
    loading: false,
  };
}

const STAT_CARDS = [
  { icon: ClipboardList, label: 'ครั้งที่ทำข้อสอบ', value: '0', sub: 'ยังไม่มีประวัติการทำข้อสอบ' },
  { icon: Trophy, label: 'ผ่านเกณฑ์', value: '0', sub: 'อัตราผ่าน —' },
  { icon: Target, label: 'คะแนนสูงสุด', value: '—', sub: 'เริ่มทำข้อสอบเพื่อบันทึกคะแนน' },
  { icon: Flame, label: 'วันติดต่อกัน', value: '0 วัน', sub: 'ฝึกวันนี้เพื่อเริ่มสถิติ streak' },
];

function CountdownBox({ days, hours, minutes, seconds, reached, loading }) {
  const units = [
    { v: days, l: 'วัน' },
    { v: hours, l: 'ชม.' },
    { v: minutes, l: 'นาที' },
    { v: seconds, l: 'วิ' },
  ];
  return (
    <div className="text-right">
      <p className="text-xs text-graydark/50">สอบข้อเขียน 29 พ.ย. 2569</p>
      {reached ? (
        <p className="text-2xl font-bold text-accent-cyan">ถึงวันสอบแล้ว</p>
      ) : (
        <div className="flex items-end gap-2 justify-end mt-1">
          {units.map((u) => (
            <div key={u.l} className="text-center">
              <p className="text-2xl font-bold text-accent-cyan leading-none tabular-nums">
                {loading ? '--' : String(u.v).padStart(2, '0')}
              </p>
              <p className="text-[10px] text-graydark/40 mt-0.5">{u.l}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyChallenge() {
  const [shuffleKey, setShuffleKey] = useState(0);
  const dailyQuestions = useMemo(
    () => getDailyQuestions(shuffleKey === 0 ? todayIsoDate() : `${todayIsoDate()}-${shuffleKey}`, 5),
    [shuffleKey]
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const question = dailyQuestions[index];
  const done = index >= dailyQuestions.length;
  const score = dailyQuestions.reduce(
    (acc, q) => acc + (answers[q.id] === q.answerIndex ? 1 : 0),
    0
  );
  const answered = question ? answers[question.id] !== undefined : false;
  const subjectName = question ? subjects.find((s) => s.id === question.subjectId)?.name : '';

  function selectAnswer(choiceIndex) {
    if (answered) return;
    setAnswers((prev) => ({ ...prev, [question.id]: choiceIndex }));
  }

  function restart() {
    setIndex(0);
    setAnswers({});
    setShuffleKey((k) => k + 1);
  }

  return (
    <div className="border border-graylight/30 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-accent-cyan" />
        <p className="text-sm font-medium text-navy">โจทย์ประจำวัน</p>
      </div>
      <p className="text-xs text-graydark/40 mb-5">
        สุ่ม 5 ข้อจากทุกวิชาให้ทำทุกวัน ฝึกสม่ำเสมอเพื่อสร้างนิสัย
      </p>

      {!done ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-navy/5 text-navy">
              {subjectName}
            </span>
            <span className="text-xs text-graydark/40">
              ข้อ {index + 1} / {dailyQuestions.length}
            </span>
          </div>
          <p className="text-sm font-medium text-graydark mb-4 leading-relaxed">{question.question}</p>

          <div className="space-y-2">
            {question.choices.map((choice, i) => {
              const isUser = answers[question.id] === i;
              const isAns = question.answerIndex === i;
              let style = 'border-graylight/40 text-graydark hover:border-navy/40';
              if (answered && isAns) style = 'border-accent-green bg-accent-green/10 text-graydark font-medium';
              else if (answered && isUser && !isAns) style = 'border-red-300 bg-red-50 text-red-600';

              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-colors flex items-center justify-between gap-2 ${style}`}
                >
                  <span>{choice}</span>
                  {answered && isAns && <CheckCircle2 size={16} className="text-accent-green shrink-0" />}
                  {answered && isUser && !isAns && <XCircle size={16} className="text-red-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="mt-4">
              <p className="text-xs text-graydark/60 leading-relaxed mb-4">
                <span className="font-medium text-navy">คำอธิบาย: </span>
                {question.explanation}
              </p>
              <button
                onClick={() => setIndex((i) => i + 1)}
                className="w-full text-sm bg-navy text-white rounded-xl py-2.5 font-medium hover:opacity-90"
              >
                {index < dailyQuestions.length - 1 ? 'ข้อถัดไป' : 'ดูสรุปผล'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-graydark/60 mb-1">วันนี้คุณทำได้</p>
          <p className="text-4xl font-bold text-navy mb-4">
            {score}
            <span className="text-lg text-graydark/40">/{dailyQuestions.length}</span>
          </p>
          <button
            onClick={restart}
            className="text-sm border border-graylight/30 text-graydark rounded-xl px-5 py-2.5 hover:border-accent-cyan/50"
          >
            ทำใหม่ (สุ่มชุดใหม่)
          </button>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const countdown = useCountdown(EXAM_DATE);
  const [setsTab, setSetsTab] = useState('subjects');

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">แดชบอร์ด</h1>
          <p className="text-graydark/60 text-sm">สายอำนวยการ 2569</p>
        </div>
        <CountdownBox {...countdown} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {STAT_CARDS.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="border border-graylight/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-graydark/60">
              <Icon size={16} className="text-accent-cyan" />
              <p className="text-xs">{label}</p>
            </div>
            <p className="text-2xl font-bold text-navy mb-1">{value}</p>
            <p className="text-[11px] text-graydark/40">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-graylight/30 rounded-2xl p-6">
            <p className="text-sm text-graydark/60 mb-4">จุดอ่อนที่ควรโฟกัส</p>
            <p className="text-graydark/40 text-sm mb-4">
              ทำแบบฝึกหัดอย่างน้อย 1 วิชาเพื่อเริ่มวิเคราะห์จุดอ่อน — ระบบจะแนะนำวิชาที่ควรอ่านเพิ่ม
              โดยให้น้ำหนักตามสัดส่วนข้อสอบจริงของแต่ละวิชา
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {subjects.map((s) => (
                <span
                  key={s.id}
                  className="text-xs px-3 py-1.5 rounded-full bg-navy/5 text-graydark/50"
                >
                  {s.name} · ยังไม่มีข้อมูล
                </span>
              ))}
            </div>
            <Link
              href="/practice"
              className="inline-block text-sm text-white bg-accent-cyan rounded-xl px-5 py-2.5 font-medium hover:opacity-90"
            >
              เริ่มทำแบบฝึกหัด
            </Link>
          </div>

          <div className="border border-graylight/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <p className="text-sm font-medium text-navy">ชุดข้อสอบ</p>
                <p className="text-xs text-graydark/40">สายอำนวยการ 2569 · รวม {totalQuestions} ข้อ</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSetsTab('full')}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors ${
                    setsTab === 'full'
                      ? 'bg-navy text-white border-navy'
                      : 'border-graylight/30 text-graydark hover:border-accent-cyan/50'
                  }`}
                >
                  ชุดเต็ม
                </button>
                <button
                  onClick={() => setSetsTab('subjects')}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors ${
                    setsTab === 'subjects'
                      ? 'bg-navy text-white border-navy'
                      : 'border-graylight/30 text-graydark hover:border-accent-cyan/50'
                  }`}
                >
                  รายวิชา
                </button>
              </div>
            </div>

            {setsTab === 'full' ? (
              <Link
                href="/mock-exam"
                className="block border border-graylight/30 rounded-2xl p-5 hover:shadow-md hover:border-accent-cyan/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-navy/5 text-navy">
                    {totalQuestions} ข้อ · 180 นาที
                  </span>
                  <span className="text-xs text-graydark/40">เร็วๆ นี้</span>
                </div>
                <h3 className="font-medium text-graydark mb-1">ข้อสอบเสมือนจริงเต็มชุด</h3>
                <p className="text-xs text-graydark/40">
                  จำลองสอบเต็มรูปแบบตามสัดส่วนข้อสอบจริง เกณฑ์ผ่าน 135 คะแนน
                </p>
              </Link>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {subjects.map((s) => {
                  const pct = Math.round((s.count / totalQuestions) * 100);
                  return (
                    <Link
                      key={s.id}
                      href={`/exam/${s.id}`}
                      className="block border border-graylight/30 rounded-2xl p-5 hover:shadow-md hover:border-accent-cyan/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-navy/5 text-navy">
                          {s.count} ข้อ
                        </span>
                        <span className="text-xs text-graydark/40">{pct}% ของข้อสอบ</span>
                      </div>
                      <h3 className="font-medium text-graydark">{s.name}</h3>
                      <div className="h-1.5 bg-graylight/20 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-accent-cyan" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DailyChallenge />
      </div>
    </div>
  );
}
