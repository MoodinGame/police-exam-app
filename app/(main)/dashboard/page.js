'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Trophy,
  Target,
  Flame,
  CheckCircle2,
  XCircle,
  Sparkles,
  History,
  ListChecks,
  PlayCircle,
  TrendingUp,
} from 'lucide-react';
import { subjects, totalQuestions } from '@/lib/subjects';
import { getDailyQuestions, todayIsoDate } from '@/lib/dailyChallenge';
import { getAttempts, getOverview, getStreaks, getSubjectAccuracy } from '@/lib/progress';
import { getMockAttempts } from '@/lib/mockExamProgress';
import { getMockExamSet } from '@/lib/mockExamCatalog';
import { getSession } from '@/lib/examSession';
import { topics } from '@/lib/topics';
import ResumeBanner from '@/components/ResumeBanner';

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

function CountdownBox({ days, hours, minutes, seconds, reached, loading }) {
  const units = [
    { v: days, l: 'วัน' },
    { v: hours, l: 'ชม.' },
    { v: minutes, l: 'นาที' },
    { v: seconds, l: 'วิ' },
  ];
  return (
    <div className="app-card px-4 py-3 text-right shadow-[0_12px_26px_rgba(43,45,66,0.08)]">
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
    <div className="app-card p-6">
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

function formatAttemptDate(value) {
  if (!value) return 'ไม่ทราบวันทำ';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ไม่ทราบวันทำ';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function resultStyle(percent) {
  if (percent >= 80) return 'bg-emerald-50 text-emerald-700';
  if (percent >= 60) return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-600';
}

function getDashboardData() {
  const practice = getAttempts().map((attempt, index) => {
    const topic = topics.find((item) => item.id === attempt.topicId);
    const subject = subjects.find((item) => item.id === attempt.subjectId);
    const percent = attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0;
    return {
      id: `practice-${attempt.at || index}`,
      kind: 'practice',
      title: topic?.name || 'แบบฝึกหัดรายวิชา',
      subject: subject?.name || 'แบบฝึกหัด',
      score: attempt.score,
      total: attempt.total,
      percent,
      at: attempt.at,
    };
  });

  const mock = getMockAttempts().map((attempt, index) => {
    const exam = getMockExamSet(attempt.examId);
    const percent = attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0;
    return {
      id: `mock-${attempt.examId}-${attempt.completedAt || index}`,
      kind: 'mock',
      title: exam?.title || 'ข้อสอบเสมือนจริง',
      subject: 'Mock Exam',
      score: attempt.score,
      total: attempt.total,
      percent,
      at: attempt.completedAt,
      passed: attempt.passed,
    };
  });

  const results = [...practice, ...mock].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  const subjectAccuracy = getSubjectAccuracy();
  const weakSubjects = Object.entries(subjectAccuracy)
    .map(([subjectId, value]) => ({ subject: subjects.find((item) => item.id === subjectId), ...value }))
    .filter((item) => item.subject && item.pct !== null)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);
  const overview = getOverview();
  const session = getSession();
  const completed = results.filter((result) => result.percent >= 60).length;

  return {
    results,
    overview,
    session,
    streaks: getStreaks(),
    weakSubjects,
    completed,
    highest: results.length ? Math.max(...results.map((result) => result.percent)) : null,
  };
}

function ContinueTasks({ data }) {
  const tasks = [];
  if (data.session) {
    const href = data.session.kind === 'mock'
      ? `/mock-exam/${data.session.examId || data.session.setId}`
      : `/exam/${data.session.subjectId}${data.session.topicId ? `?topic=${data.session.topicId}` : ''}`;
    const answered = Object.keys(data.session.answers || {}).length;
    tasks.push({
      id: 'resume',
      title: `ทำต่อ: ${data.session.label || 'ข้อสอบที่พักไว้'}`,
      detail: `ทำแล้ว ${answered}/${data.session.total || 0} ข้อ`,
      href,
      tone: 'amber',
      action: 'ทำต่อ',
    });
  }

  data.weakSubjects.slice(0, data.session ? 2 : 3).forEach((item) => {
    tasks.push({
      id: `review-${item.subject.id}`,
      title: `ทบทวน ${item.subject.name}`,
      detail: `ความแม่นยำล่าสุด ${item.pct}% · ฝึกแล้ว ${item.sessions} ครั้ง`,
      href: `/practice/${item.subject.id}`,
      tone: 'rose',
      action: 'เริ่มฝึก',
    });
  });

  if (!tasks.length) {
    tasks.push(
      { id: 'start-practice', title: 'เริ่มแบบฝึกหัดรายวิชา', detail: 'เลือกวิชาที่อยากเริ่มฝึกได้ทันที', href: '/practice', tone: 'cyan', action: 'เลือกวิชา' },
      { id: 'daily', title: 'ทำโจทย์ประจำวัน', detail: 'เริ่มจาก 5 ข้อสั้น ๆ เพื่อสร้างความสม่ำเสมอ', href: '#daily-challenge', tone: 'violet', action: 'เริ่มทำ' },
    );
  }

  const color = {
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-500',
    cyan: 'bg-cyan-50 text-accent-cyan',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <section className="app-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4"><div><div className="flex items-center gap-2"><CalendarClock size={18} className="text-accent-cyan" /><h2 className="font-bold text-navy">สิ่งที่ต้องทำต่อ</h2></div><p className="mt-1 text-xs text-graydark/45">เลือกทำทีละเรื่อง เพื่อค่อย ๆ เพิ่มคะแนนของคุณ</p></div><Link href="/practice" className="text-xs font-semibold text-accent-cyan hover:underline">ดูแบบฝึกหัดทั้งหมด</Link></div>
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <Link key={task.id} href={task.href} className="group flex items-center gap-3 rounded-2xl border border-graylight/20 bg-slate-50/70 px-3 py-3 transition hover:border-accent-cyan/35 hover:bg-white hover:shadow-sm">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color[task.tone]}`}><PlayCircle size={18} /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-navy">{task.title}</span><span className="mt-0.5 block truncate text-xs text-graydark/48">{task.detail}</span></span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-navy px-2.5 py-1.5 text-xs font-semibold text-white group-hover:bg-accent-cyan">{task.action}<ArrowRight size={13} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentHistory({ results }) {
  return (
    <section className="app-card overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-graylight/20 px-5 py-4 sm:px-6"><div className="flex items-center gap-2"><History size={18} className="text-violet-600" /><div><h2 className="font-bold text-navy">ประวัติการสอบล่าสุด</h2><p className="mt-0.5 text-xs text-graydark/45">ผลการทำข้อสอบและแบบฝึกหัดล่าสุด</p></div></div><Link href="/history" className="inline-flex items-center gap-1 text-xs font-semibold text-accent-cyan hover:underline">ดูทั้งหมด <ArrowRight size={13} /></Link></div>
      {results.length ? (
        <div className="divide-y divide-graylight/15">
          {results.slice(0, 6).map((result) => (
            <Link key={result.id} href="/history" className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 sm:px-6">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${result.kind === 'mock' ? 'bg-violet-50 text-violet-600' : 'bg-cyan-50 text-accent-cyan'}`}>{result.kind === 'mock' ? <ClipboardList size={17} /> : <ListChecks size={17} />}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy">{result.title}</span><span className="mt-0.5 block text-xs text-graydark/45">{formatAttemptDate(result.at)} · {result.subject}</span></span>
              <span className="text-right"><span className="block text-sm font-black text-navy">{result.score}/{result.total}</span><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${resultStyle(result.percent)}`}>{result.percent}%</span></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-6 py-10 text-center"><History className="mx-auto text-graydark/25" size={25} /><p className="mt-3 text-sm text-graydark/55">ยังไม่มีประวัติการสอบ</p><Link href="/practice" className="mt-3 inline-flex text-xs font-semibold text-accent-cyan hover:underline">เริ่มทำแบบฝึกหัด →</Link></div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const countdown = useCountdown(EXAM_DATE);
  const [setsTab, setSetsTab] = useState('subjects');
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(getDashboardData());
  }, []);

  const dashboard = data || {
    results: [],
    overview: { answered: 0 },
    completed: 0,
    highest: null,
    streaks: { current: 0 },
    weakSubjects: [],
    session: null,
  };
  const statCards = [
    { icon: ClipboardList, label: 'ครั้งที่ทำข้อสอบ', value: String(dashboard.results.length), sub: dashboard.results.length ? `ทำไปแล้ว ${dashboard.overview.answered} ข้อ` : 'ยังไม่มีประวัติการทำข้อสอบ' },
    { icon: Trophy, label: 'ผ่านเกณฑ์', value: String(dashboard.completed), sub: dashboard.results.length ? `จากทั้งหมด ${dashboard.results.length} ครั้ง` : 'เริ่มทำข้อสอบเพื่อบันทึกผล' },
    { icon: Target, label: 'คะแนนสูงสุด', value: dashboard.highest === null ? '—' : `${dashboard.highest}%`, sub: dashboard.highest === null ? 'เริ่มทำข้อสอบเพื่อบันทึกคะแนน' : 'จากผลการทำที่บันทึกไว้' },
    { icon: Flame, label: 'วันติดต่อกัน', value: `${dashboard.streaks.current} วัน`, sub: dashboard.streaks.current ? 'รักษาจังหวะการฝึกไว้' : 'ฝึกวันนี้เพื่อเริ่ม streak' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="app-section-heading text-2xl font-semibold text-navy">แดชบอร์ด</h1>
          <p className="text-graydark/60 text-sm">สายอำนวยการ 2569</p>
        </div>
        <CountdownBox {...countdown} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCards.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="app-card app-card-hover p-5">
            <div className="flex items-center gap-2 mb-3 text-graydark/60">
              <Icon size={16} className="text-accent-cyan" />
              <p className="text-xs">{label}</p>
            </div>
            <p className="text-2xl font-bold text-navy mb-1">{value}</p>
            <p className="text-[11px] text-graydark/40">{sub}</p>
          </div>
        ))}
      </div>

      <ResumeBanner />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ContinueTasks data={dashboard} />

          <RecentHistory results={dashboard.results} />

          <div className="app-card p-6">
            <div className="flex items-start justify-between gap-3 mb-4"><div><div className="flex items-center gap-2"><TrendingUp size={18} className="text-rose-500" /><h2 className="font-bold text-navy">จุดที่ควรโฟกัส</h2></div><p className="mt-1 text-xs text-graydark/45">เรียงจากวิชาที่ความแม่นยำยังต่ำ เพื่อช่วยวางแผนทบทวน</p></div><Link href="/profile#stats-overview" className="text-xs font-semibold text-accent-cyan hover:underline">ดูสถิติทั้งหมด</Link></div>
            {dashboard.weakSubjects.length ? (
              <div className="grid gap-3 sm:grid-cols-3">{dashboard.weakSubjects.map((item) => <Link key={item.subject.id} href={`/practice/${item.subject.id}`} className="rounded-2xl border border-rose-100 bg-rose-50/55 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"><p className="truncate text-sm font-bold text-navy">{item.subject.name}</p><p className="mt-2 text-2xl font-black text-rose-500">{item.pct}%</p><p className="mt-1 text-xs text-graydark/50">ฝึกแล้ว {item.sessions} ครั้ง · เริ่มทบทวน →</p></Link>)}</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-graylight/35 px-5 py-7 text-center"><p className="text-sm text-graydark/55">เริ่มทำแบบฝึกหัดสักหัวข้อ แล้วระบบจะแนะนำจุดที่ควรทบทวนให้</p><Link href="/practice" className="mt-4 inline-flex text-sm font-semibold text-accent-cyan hover:underline">เลือกแบบฝึกหัด →</Link></div>
            )}
          </div>

          <div className="app-card p-6">
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
                className="app-card app-card-hover block p-5"
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
                      className="app-card app-card-hover block p-5"
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

        <div id="daily-challenge" className="scroll-mt-6"><DailyChallenge /></div>
      </div>
    </div>
  );
}
