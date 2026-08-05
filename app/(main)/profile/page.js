'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Flame, Trophy, CalendarDays, Target, ListChecks, BookA, Rocket, BookOpenCheck, Medal, Compass, LockKeyhole } from 'lucide-react';
import { useCatalog } from '@/lib/subjectCatalog';
import { getSubjectStyle } from '@/lib/subjectStyles';
import {
  getOverview,
  getStreaks,
  getDailyActivity,
  getSubjectAccuracy,
  getTopicAccuracy,
  localDateKey,
} from '@/lib/progress';
import { getAchievements } from '@/lib/achievements';
import { vocabularyCards as fallbackVocabularyCards } from '@/lib/vocabulary';
import { getVocabularyProgress, getVocabularyStats } from '@/lib/vocabularyProgress';
import ProfileHero from '@/components/ProfileHero';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

// คลาสสีต้องเขียนเป็นสตริงเต็มเพื่อให้ Tailwind สแกนเจอ (ห้ามต่อสตริงแบบ dynamic)
const HEAT_LEVELS = [
  'bg-graylight/15',
  'bg-accent-cyan/25',
  'bg-accent-cyan/45',
  'bg-accent-cyan/70',
  'bg-accent-cyan',
];

function heatLevel(questions) {
  if (!questions) return 0;
  if (questions <= 2) return 1;
  if (questions <= 5) return 2;
  if (questions <= 10) return 3;
  return 4;
}

function accuracyLabel(pct) {
  if (pct === null || pct === undefined) return { text: 'ยังไม่มีข้อมูล', cls: 'text-graydark/40' };
  if (pct >= 80) return { text: 'ดี', cls: 'text-green-700' };
  if (pct >= 60) return { text: 'พอใช้', cls: 'text-orange-600' };
  return { text: 'ควรทบทวน', cls: 'text-red-600' };
}

function MonthHeatmap({ year, month, activity, todayKey }) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <p className="text-xs font-medium text-graydark/70 mb-2">
        {THAI_MONTHS[month]} {year + 543}
      </p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[9px] text-graydark/30">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const info = activity[key];
          const lvl = heatLevel(info?.questions);
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              style={{ '--profile-heat-delay': `${Math.min(i, 24) * 18}ms` }}
              title={
                info
                  ? `${d} ${THAI_MONTHS[month]} — ฝึก ${info.questions} ข้อ (${info.sessions} ครั้ง)`
                  : `${d} ${THAI_MONTHS[month]} — ไม่ได้ฝึก`
              }
              className={`profile-heat-cell aspect-square rounded ${HEAT_LEVELS[lvl]} ${
                isToday ? 'ring-1 ring-navy' : ''
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function buildProfileDataFromStats(stats, vocabularyCards = fallbackVocabularyCards) {
  const subjectAcc = Object.fromEntries((stats.subjectStats || []).map((item) => [item.id, {
    answered: item.answered,
    correct: item.correct,
    pct: item.pct,
    sessions: item.sessions,
  }]));
  const topicAcc = Object.fromEntries((stats.topicStats || [])
    .map((item) => [item.legacyId || item.id, {
      answered: item.answered,
      correct: item.correct,
      pct: item.pct,
      sessions: item.sessions,
      subjectId: item.subjectId,
      name: item.name,
    }]));

  return {
    overview: stats.overview,
    streaks: stats.streaks,
    activity: stats.activity || {},
    subjectAcc,
    topicAcc,
    achievements: getAchievements(),
    vocabulary: getVocabularyStats(vocabularyCards, getVocabularyProgress()),
    todayKey: localDateKey(),
  };
}

export default function ProfilePage() {
  const [data, setData] = useState(null);
  // ต้องเรียกก่อน early return ด้านล่าง ไม่งั้นผิดกฎลำดับ hook
  const { subjects, findTopic } = useCatalog();

  // อ่าน localStorage หลัง mount เท่านั้น เพื่อไม่ให้ markup ตอน SSR กับตอน hydrate ต่างกัน
  useEffect(() => {
    let active = true;
    async function loadProfile() {
      let vocabularyCards = fallbackVocabularyCards;
      try {
        const [response, vocabularyResponse] = await Promise.all([
          fetch('/api/stats', { cache: 'no-store' }),
          fetch('/api/vocabulary', { cache: 'no-store' }),
        ]);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load stats');
        if (vocabularyResponse.ok) {
          const vocabularyPayload = await vocabularyResponse.json();
          if (vocabularyPayload.cards?.length) vocabularyCards = vocabularyPayload.cards;
        }
        if (active) setData(buildProfileDataFromStats(payload, vocabularyCards));
      } catch {
        if (active) {
          setData({
            overview: getOverview(),
            streaks: getStreaks(),
            activity: getDailyActivity(),
            subjectAcc: getSubjectAccuracy(),
            topicAcc: getTopicAccuracy(),
            achievements: getAchievements(),
            vocabulary: getVocabularyStats(vocabularyCards, getVocabularyProgress()),
            todayKey: localDateKey(),
          });
        }
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  if (!data) {
    return (
      <div className="space-y-5">
        <section className="app-card overflow-hidden p-0"><div className="h-32 animate-pulse bg-[linear-gradient(110deg,#172856,#294b79)]" /><div className="space-y-3 p-6"><div className="skeleton h-5 w-36" /><div className="skeleton h-3 w-64" /></div></section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="app-card p-5"><div className="skeleton h-3 w-20" /><div className="skeleton mt-3 h-7 w-14" /></div>)}</div>
      </div>
    );
  }

  const { overview, streaks, activity, subjectAcc, topicAcc, todayKey, achievements, vocabulary } = data;
  const hasData = overview.sessions > 0;

  // 3 เดือนหลังสุด (รวมเดือนปัจจุบัน)
  const now = new Date();
  const months = [2, 1, 0].map((back) => {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const weakTopics = Object.entries(topicAcc)
    .map(([id, v]) => ({
      ...v,
      id,
      topic: findTopic(id) || {
        id,
        name: v.name || 'หัวข้อที่ยังไม่ระบุชื่อ',
        subjectId: v.subjectId,
      },
    }))
    .filter((t) => t.topic && t.pct !== null)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 6);

  return (
    <div className="profile-workspace space-y-6 pb-4 sm:pb-6">
      <ProfileHero subjectAccuracy={subjectAcc} />

      {!hasData && (
        <div className="profile-motion-card app-card border-dashed p-8 text-center">
          <p className="profile-eyebrow">START YOUR RECORD</p>
          <p className="mt-2 font-semibold text-navy">ยังไม่มีข้อมูลสถิติ</p>
          <p className="mt-1 text-sm text-graydark/50 mb-5">
            เริ่มทำแบบฝึกหัดสักหัวข้อ แล้วสถิติทั้งหมดในหน้านี้จะเริ่มบันทึกให้อัตโนมัติ
          </p>
          <Link
            href="/practice"
            className="inline-block text-sm text-white bg-accent-cyan rounded-xl px-5 py-2.5 font-medium hover:opacity-90"
          >
            เริ่มทำแบบฝึกหัด
          </Link>
        </div>
      )}

      {/* ภาพรวม */}
      <section id="stats-overview" className="profile-motion-card scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,35,64,0.03)]">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><p className="profile-eyebrow">LEARNING SUMMARY</p><p className="mt-1 text-sm font-semibold text-navy">ภาพรวมการฝึกของคุณ</p></div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 lg:grid-cols-4 lg:divide-y-0">
        {[
          { icon: ListChecks, label: 'ข้อที่ฝึกทั้งหมด', value: overview.answered, sub: `${overview.sessions} ครั้ง` },
          {
            icon: Target,
            label: 'ความแม่นยำรวม',
            value: overview.accuracyPct !== null ? `${overview.accuracyPct}%` : '—',
            sub: hasData ? `ตอบถูก ${overview.correct}/${overview.answered} ข้อ` : 'ยังไม่มีข้อมูล',
          },
          { icon: Flame, label: 'streak ปัจจุบัน', value: `${streaks.current} วัน`, sub: 'ฝึกต่อเนื่อง' },
          { icon: Trophy, label: 'streak สูงสุด', value: `${streaks.longest} วัน`, sub: `ฝึกไปแล้ว ${streaks.activeDays} วัน` },
        ].map(({ icon: Icon, label, value, sub }, index) => (
          <div key={label} style={{ '--profile-metric-delay': `${80 + index * 70}ms` }} className="profile-motion-metric bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 text-graydark/60">
              <Icon size={16} className="text-accent-cyan" />
              <p className="text-xs font-semibold">{label}</p>
            </div>
            <p className="text-2xl font-black text-navy mb-1">{value}</p>
            <p className="text-[11px] text-graydark/40">{sub}</p>
          </div>
        ))}
        </div>
      </section>

      <div id="achievements" className="scroll-mt-6"><AchievementPanel achievements={achievements} /></div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Heatmap */}
          <div className="profile-motion-card profile-motion-delay-2 app-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-accent-cyan" />
                <div><p className="profile-eyebrow">LEARNING ACTIVITY</p><p className="mt-1 text-sm font-semibold text-navy">ความเข้มข้นการฝึกซ้อม</p></div>
              </div>
              <p className="text-xs text-graydark/40">3 เดือนหลังสุด</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {months.map((m) => (
                <MonthHeatmap
                  key={`${m.year}-${m.month}`}
                  year={m.year}
                  month={m.month}
                  activity={activity}
                  todayKey={todayKey}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-graylight/20">
              <span className="text-xs text-graydark/40">น้อย</span>
              {HEAT_LEVELS.map((c) => (
                <span key={c} className={`w-3 h-3 rounded ${c}`} />
              ))}
              <span className="text-xs text-graydark/40">มาก</span>
              {streaks.lastActive && (
                <span className="text-xs text-graydark/40 ml-auto">
                  ฝึกล่าสุด {streaks.lastActive}
                </span>
              )}
            </div>
          </div>

          {/* ความแม่นยำรายวิชา */}
          <div className="profile-motion-card profile-motion-delay-3 app-card p-5 sm:p-6">
            <p className="profile-eyebrow">SUBJECT PROGRESS</p>
            <p className="mt-1 text-sm font-semibold text-navy mb-1">ความก้าวหน้ารายวิชา</p>
            <p className="text-xs text-graydark/40 mb-5">จำนวนข้อและความแม่นยำแยกตามวิชา</p>

            <ul className="space-y-4">
              {subjects.map((s, index) => {
                const a = subjectAcc[s.id];
                const pct = a?.pct ?? null;
                const label = accuracyLabel(pct);
                const style = getSubjectStyle(s.id, s.shortName);
                return (
                  <li key={s.id} className="profile-subject-row">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <p className="text-sm text-graydark truncate">{s.name}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {a && (
                          <span className="text-xs text-graydark/40">
                            {a.correct}/{a.answered}
                          </span>
                        )}
                        <span className={`text-xs font-medium ${label.cls}`}>
                          {pct !== null ? `${pct}%` : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-graylight/20 rounded-full overflow-hidden">
                      <div
                        className={`profile-progress-fill h-full ${style.color}`}
                        style={{ '--profile-progress-width': `${pct ?? 0}%`, '--profile-progress-delay': `${180 + index * 65}ms` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="space-y-5">
          {/* จุดที่ควรพัฒนา */}
          <div className="profile-motion-card profile-motion-delay-3 app-card p-5 sm:p-6">
            <p className="profile-eyebrow">FOCUS NEXT</p>
            <p className="mt-1 text-sm font-semibold text-navy mb-1">จุดที่ควรพัฒนา</p>
            <p className="text-xs text-graydark/40 mb-4">หัวข้อย่อยที่ความแม่นยำต่ำสุด</p>

            {weakTopics.length === 0 ? (
              <p className="text-sm text-graydark/40">
                ยังไม่มีข้อมูล — ทำแบบฝึกหัดเพื่อให้ระบบวิเคราะห์จุดอ่อนรายหัวข้อ
              </p>
            ) : (
              <ul className="space-y-3">
                {weakTopics.map((t) => {
                  const label = accuracyLabel(t.pct);
                  return (
                    <li key={t.id} className="rounded-xl border border-transparent px-2 py-2 transition hover:border-rose-100 hover:bg-rose-50/40">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm text-graydark truncate">{t.topic.name}</p>
                        <span className={`text-xs font-medium shrink-0 ${label.cls}`}>{t.pct}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-graydark/40">
                          {t.correct}/{t.answered} ข้อ
                        </span>
                        <Link
                          href={`/exam/${t.subjectId}?topic=${t.id}`}
                          className="text-[11px] text-accent-cyan font-medium shrink-0"
                        >
                          ฝึกเรื่องนี้ →
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="profile-motion-card profile-motion-delay-4 app-card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <BookA size={16} className="text-accent-cyan" />
              <div><p className="profile-eyebrow">VOCABULARY</p><p className="mt-1 text-sm font-semibold text-navy">ความก้าวหน้าคำศัพท์</p></div>
            </div>
            <p className="text-xs text-graydark/40 mb-4">Oxford 3000 ชุดเริ่มต้นและศัพท์เฉพาะตำรวจ</p>
            <div className="rounded-xl border border-cyan-100 bg-cyan-50/55 p-4">
              <div className="flex items-end justify-between gap-3"><div><p className="text-2xl font-black text-navy">{vocabulary.mastered}<span className="ml-1 text-sm font-semibold text-graydark/45">/ {vocabulary.total} คำ</span></p><p className="mt-1 text-xs text-graydark/55">จำได้แล้ว · ทบทวน {vocabulary.reviewing} คำ</p></div><span className="text-lg font-black text-accent-cyan">{vocabulary.percentage}%</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="profile-progress-fill h-full rounded-full bg-accent-cyan" style={{ '--profile-progress-width': `${vocabulary.percentage}%`, '--profile-progress-delay': '340ms' }} /></div>
            </div>
            <Link href="/vocab" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-cyan hover:underline">ไปฝึกคำศัพท์ →</Link>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .profile-eyebrow {
          color: #6b7d97;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .13em;
          line-height: 1.2;
        }

        @keyframes profile-card-enter {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes profile-metric-enter {
          from { opacity: 0; transform: translateY(8px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes profile-heat-enter {
          from { opacity: 0; transform: scale(.7); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes profile-progress-grow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .profile-motion-card {
          animation: profile-card-enter 560ms cubic-bezier(.22, 1, .36, 1) both;
          will-change: opacity, transform;
        }

        .profile-motion-delay-2 { animation-delay: 130ms; }
        .profile-motion-delay-3 { animation-delay: 200ms; }
        .profile-motion-delay-4 { animation-delay: 270ms; }

        .profile-motion-metric {
          animation: profile-metric-enter 440ms cubic-bezier(.22, 1, .36, 1) both;
          animation-delay: var(--profile-metric-delay, 0ms);
          will-change: opacity, transform;
        }

        .profile-heat-cell {
          animation: profile-heat-enter 340ms cubic-bezier(.22, 1, .36, 1) both;
          animation-delay: var(--profile-heat-delay, 0ms);
        }

        .profile-progress-fill {
          width: var(--profile-progress-width);
          transform-origin: left center;
          animation: profile-progress-grow 760ms cubic-bezier(.22, 1, .36, 1) both;
          animation-delay: var(--profile-progress-delay, 0ms);
        }

        .profile-subject-row { transition: transform 180ms ease, background 180ms ease; }
        .profile-subject-row:hover { transform: translateX(2px); }

        @media (prefers-reduced-motion: reduce) {
          .profile-motion-card,
          .profile-motion-metric,
          .profile-heat-cell,
          .profile-progress-fill {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function AchievementPanel({ achievements }) {
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;
  const icons = {
    rocket: Rocket,
    flame: Flame,
    target: Target,
    book: BookOpenCheck,
    medal: Medal,
    trophy: Trophy,
    compass: Compass,
  };

  return (
    <section className="profile-motion-card profile-motion-delay-2 app-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <p className="profile-eyebrow">MILESTONES</p>
          <div className="mt-1 flex items-center gap-2"><Trophy size={18} className="text-amber-500" /><h2 className="font-semibold text-navy">Achievement ของฉัน</h2></div>
          <p className="text-sm text-graydark/55 mt-1">ปลดล็อกเหรียญจากพฤติกรรมการฝึกจริงของคุณ</p>
        </div>
        <span className="rounded-full bg-amber-50 text-amber-700 px-3 py-1.5 text-xs font-medium">ปลดล็อก {unlockedCount}/{achievements.length} เหรียญ</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement, index) => {
          const Icon = icons[achievement.icon] || Trophy;
          return (
            <article key={achievement.id} style={{ '--profile-metric-delay': `${190 + index * 55}ms` }} className={`profile-motion-metric rounded-xl border p-4 ${achievement.unlocked ? 'border-amber-200 bg-amber-50/60' : 'border-graylight/25 bg-graylight/5'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${achievement.unlocked ? 'bg-amber-200 text-amber-700' : 'bg-graylight/15 text-graydark/35'}`}>
                  {achievement.unlocked ? <Icon size={20} /> : <LockKeyhole size={18} />}
                </div>
                <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className={`text-sm font-semibold ${achievement.unlocked ? 'text-navy' : 'text-graydark/65'}`}>{achievement.name}</h3>{achievement.unlocked && <span className="text-[10px] font-medium text-amber-700">ปลดล็อกแล้ว</span>}</div><p className="text-xs text-graydark/50 mt-1 leading-relaxed">{achievement.description}</p></div>
              </div>
              {!achievement.unlocked && <div className="mt-3"><div className="flex justify-between text-[11px] text-graydark/45 mb-1"><span>ความคืบหน้า</span><span>{Math.min(achievement.current, achievement.target)}/{achievement.target} {achievement.unit}</span></div><div className="h-1.5 rounded-full bg-graylight/15 overflow-hidden"><div className="profile-progress-fill h-full rounded-full bg-accent-cyan" style={{ '--profile-progress-width': `${achievement.progress}%`, '--profile-progress-delay': `${240 + index * 55}ms` }} /></div></div>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
