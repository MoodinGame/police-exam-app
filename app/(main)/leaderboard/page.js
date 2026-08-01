'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Crown,
  LayoutGrid,
  Medal,
  Minus,
  Sparkles,
  Table2,
  Trophy,
  UsersRound,
} from 'lucide-react';
import {
  currentUserId,
  leaderboardBadges,
  leaderboardMonthly,
  leaderboardOverall,
  leaderboardWeekly,
  withRank,
} from '@/lib/leaderboard';

const PERIODS = [
  { id: 'overall', label: 'ตลอดกาล', helper: 'คะแนนสะสมทั้งหมด', data: leaderboardOverall },
  { id: 'monthly', label: 'เดือนนี้', helper: 'สิงหาคม 2569', data: leaderboardMonthly },
  { id: 'weekly', label: 'สัปดาห์นี้', helper: '1–7 สิงหาคม 2569', data: leaderboardWeekly },
];

const MEDAL_STYLES = {
  1: 'bg-amber-300 text-amber-950 ring-amber-100',
  2: 'bg-slate-300 text-slate-700 ring-slate-100',
  3: 'bg-orange-300 text-orange-950 ring-orange-100',
};

const BADGE_STYLES = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
};

function BadgePill({ badgeId, compact = false }) {
  const badge = leaderboardBadges[badgeId] || leaderboardBadges.challenger;

  return (
    <span
      title={badge.description}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${BADGE_STYLES[badge.tone]}`}
    >
      <BadgeCheck size={compact ? 13 : 14} />
      {badge.label}
    </span>
  );
}

function RankMark({ rank }) {
  if (rank <= 3) {
    return (
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ring-4 ${MEDAL_STYLES[rank]}`}>
        {rank === 1 ? <Crown size={18} fill="currentColor" /> : rank}
      </span>
    );
  }

  return <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy/5 text-sm font-bold text-navy/60">{rank}</span>;
}

function Movement({ value }) {
  if (value > 0) {
    return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600"><ArrowUp size={13} />{value}</span>;
  }

  if (value < 0) {
    return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-500"><ArrowDown size={13} />{Math.abs(value)}</span>;
  }

  return <span className="inline-flex items-center text-xs text-graydark/35"><Minus size={13} /></span>;
}

function Avatar({ name, isMe = false }) {
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${isMe ? 'bg-accent-cyan text-white shadow-lg shadow-cyan-500/25' : 'bg-navy/8 text-navy'}`}>
      {name.charAt(0)}
    </span>
  );
}

function PodiumCard({ entry }) {
  const isMe = entry.userId === currentUserId;
  const rankSize = entry.rank === 1 ? 'md:-mt-5' : '';

  return (
    <div className={`relative flex min-w-[170px] flex-1 flex-col items-center rounded-2xl border p-4 text-center shadow-sm ${rankSize} ${isMe ? 'border-accent-cyan/40 bg-cyan-50/70' : 'border-white/20 bg-white/10'}`}>
      <span className="absolute -top-4"><RankMark rank={entry.rank} /></span>
      <div className="mt-5"><Avatar name={entry.name} isMe={isMe} /></div>
      <p className="mt-2 max-w-full truncate text-sm font-bold text-white">{entry.name}</p>
      <div className="mt-2"><BadgePill badgeId={entry.badge} compact /></div>
      <p className="mt-3 text-2xl font-black text-accent-gold">{entry.score}<span className="ml-1 text-xs font-medium text-white/65">คะแนน</span></p>
    </div>
  );
}

export default function LeaderboardPage() {
  const [periodId, setPeriodId] = useState('overall');
  const [view, setView] = useState('table');
  const activePeriod = PERIODS.find((period) => period.id === periodId) || PERIODS[0];
  const ranked = useMemo(() => withRank(activePeriod.data), [activePeriod]);
  const me = ranked.find((entry) => entry.userId === currentUserId);
  const podium = ranked.slice(0, 3).sort((a, b) => (a.rank === 1 ? 0 : b.rank === 1 ? 1 : a.rank - b.rank));

  return (
    <div className="space-y-6 pb-4">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#183560] to-[#1f6b83] px-5 py-7 text-white shadow-xl shadow-navy/15 sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-accent-cyan/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-accent-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
              <Trophy size={14} className="text-accent-gold" />
              ตารางคะแนนผู้ฝึกสอบ
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">อันดับของผู้เตรียมสอบ</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">เปรียบเทียบผลการฝึกของคุณกับผู้ใช้อื่น และสะสมเหรียญจากการฝึกอย่างต่อเนื่อง</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-white/60">ผู้ร่วมจัดอันดับ</p>
              <p className="mt-1 flex items-center gap-2 text-xl font-black"><UsersRound size={18} className="text-accent-cyan" />{ranked.length} คน</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-white/60">อันดับของคุณ</p>
              <p className="mt-1 text-xl font-black text-accent-gold">{me ? `#${me.rank}` : '—'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="app-section-heading">จัดอันดับตามช่วงเวลา</h2>
          <p className="mt-1 text-sm text-graydark/55">คะแนนสูงกว่าอยู่ในอันดับที่ดีกว่า หากคะแนนเท่ากัน ผู้ที่ใช้จำนวนครั้งฝึกน้อยกว่าจะอยู่ก่อน</p>
        </div>
        <div className="flex w-full rounded-2xl border border-graylight/30 bg-white p-1.5 shadow-sm lg:w-auto">
          <button
            onClick={() => setView('table')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition sm:flex-none ${view === 'table' ? 'bg-navy text-white shadow-sm' : 'text-graydark/55 hover:bg-navy/5'}`}
            aria-pressed={view === 'table'}
          >
            <Table2 size={16} /> ตาราง
          </button>
          <button
            onClick={() => setView('cards')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition sm:flex-none ${view === 'cards' ? 'bg-navy text-white shadow-sm' : 'text-graydark/55 hover:bg-navy/5'}`}
            aria-pressed={view === 'cards'}
          >
            <LayoutGrid size={16} /> การ์ด
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((period) => (
          <button
            key={period.id}
            onClick={() => setPeriodId(period.id)}
            className={`rounded-2xl border px-4 py-2.5 text-left transition ${periodId === period.id ? 'border-accent-cyan bg-cyan-50 text-navy shadow-sm' : 'border-graylight/30 bg-white text-graydark/60 hover:border-accent-cyan/45'}`}
          >
            <span className="block text-sm font-bold">{period.label}</span>
            <span className="block text-xs opacity-65">{period.helper}</span>
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#11284b] to-[#1d4f6a] p-5 shadow-xl shadow-navy/10 sm:p-7">
        <div className="mb-8 flex items-center gap-2 text-white">
          <Crown size={19} className="text-accent-gold" fill="currentColor" />
          <h2 className="font-bold">ผู้นำคะแนน {activePeriod.label}</h2>
        </div>
        <div className="flex flex-col gap-5 md:flex-row md:items-end">
          {podium.map((entry) => <PodiumCard key={entry.userId} entry={entry} />)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="app-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-graylight/20 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold text-navy">ตารางจัดอันดับ</h2>
              <p className="mt-0.5 text-xs text-graydark/45">{activePeriod.helper}</p>
            </div>
            <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy/60">{ranked.length} คน</span>
          </div>

          {view === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-[650px] w-full text-left">
                <thead className="bg-slate-50/80 text-xs font-semibold text-graydark/50">
                  <tr>
                    <th className="px-5 py-3 sm:px-6">อันดับ</th>
                    <th className="px-3 py-3">ผู้ใช้งาน</th>
                    <th className="px-3 py-3">เหรียญ</th>
                    <th className="px-3 py-3 text-center">เปลี่ยนแปลง</th>
                    <th className="px-5 py-3 text-right sm:px-6">คะแนน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graylight/15">
                  {ranked.map((entry) => {
                    const isMe = entry.userId === currentUserId;
                    return (
                      <tr key={entry.userId} className={`transition hover:bg-slate-50/80 ${isMe ? 'bg-cyan-50/75' : ''}`}>
                        <td className="px-5 py-3.5 sm:px-6"><RankMark rank={entry.rank} /></td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={entry.name} isMe={isMe} />
                            <div>
                              <p className={`text-sm font-bold ${isMe ? 'text-accent-cyan' : 'text-navy'}`}>{entry.name}{isMe && <span className="ml-2 text-xs font-medium text-accent-cyan">คุณ</span>}</p>
                              <p className="mt-0.5 text-xs text-graydark/45">ฝึกแล้ว {entry.attempts} ครั้ง</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5"><BadgePill badgeId={entry.badge} /></td>
                        <td className="px-3 py-3.5 text-center"><Movement value={entry.movement} /></td>
                        <td className="px-5 py-3.5 text-right sm:px-6"><p className="text-lg font-black text-navy">{entry.score}</p><p className="text-xs text-graydark/45">คะแนน</p></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              {ranked.map((entry) => {
                const isMe = entry.userId === currentUserId;
                return (
                  <article key={entry.userId} className={`relative overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${isMe ? 'border-accent-cyan/45 bg-cyan-50/70' : 'border-graylight/25 bg-white'}`}>
                    <div className="absolute right-4 top-4"><RankMark rank={entry.rank} /></div>
                    <div className="flex items-center gap-3 pr-12"><Avatar name={entry.name} isMe={isMe} /><div className="min-w-0"><p className={`truncate text-sm font-bold ${isMe ? 'text-accent-cyan' : 'text-navy'}`}>{entry.name}</p><p className="mt-0.5 text-xs text-graydark/45">ฝึกแล้ว {entry.attempts} ครั้ง</p></div></div>
                    <div className="mt-4 flex items-end justify-between gap-3"><BadgePill badgeId={entry.badge} /><div className="text-right"><p className="text-xl font-black text-navy">{entry.score}</p><Movement value={entry.movement} /></div></div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="app-card border-accent-cyan/20 bg-gradient-to-br from-cyan-50 to-white">
            <div className="flex items-center gap-2 text-navy"><Trophy size={19} className="text-accent-gold" /><h2 className="font-bold">อันดับของคุณ</h2></div>
            {me ? (
              <>
                <div className="mt-5 flex items-end justify-between"><p className="text-5xl font-black text-navy">#{me.rank}</p><Movement value={me.movement} /></div>
                <p className="mt-2 text-sm text-graydark/55">{me.score} คะแนน จากการฝึก {me.attempts} ครั้ง</p>
                <div className="mt-4"><BadgePill badgeId={me.badge} /></div>
              </>
            ) : <p className="mt-4 text-sm text-graydark/55">ยังไม่มีผลการฝึกในช่วงเวลานี้</p>}
          </section>

          <section className="app-card">
            <div className="flex items-center gap-2 text-navy"><Medal size={19} className="text-violet-500" /><h2 className="font-bold">สะสมเหรียญ</h2></div>
            <p className="mt-2 text-sm leading-6 text-graydark/55">เหรียญจะสะท้อนพฤติกรรมการฝึก เช่น ความแม่นยำ ความสม่ำเสมอ และการทำครบทุกวิชา</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-violet-50 p-3 text-xs text-violet-700"><Sparkles size={15} /> ดูรายละเอียดเหรียญทั้งหมดได้ในหน้าโปรไฟล์</div>
          </section>

          <p className="px-2 text-xs leading-5 text-graydark/40">ข้อมูลอันดับในหน้านี้เป็นข้อมูลตัวอย่างสำหรับทดสอบหน้าจอ จะแสดงคะแนนจริงเมื่อเชื่อมระบบบันทึกผลกับฐานข้อมูลแล้ว</p>
        </aside>
      </div>
    </div>
  );
}
