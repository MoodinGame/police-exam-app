'use client';

import { useEffect, useMemo, useState } from 'react';
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

function PodiumCard({ entry, currentUserId }) {
  const isMe = entry.userId === currentUserId;
  const isWinner = entry.rank === 1;

  return (
    <article className={`relative flex min-w-0 flex-col items-center rounded-2xl border px-3 pb-4 pt-6 text-center shadow-sm transition ${isWinner ? 'z-10 -mt-3 border-amber-300 bg-gradient-to-b from-amber-50 to-white shadow-lg shadow-amber-500/10 sm:-mt-6' : 'border-graylight/25 bg-white hover:-translate-y-0.5'} ${isMe ? 'ring-2 ring-accent-cyan/25' : ''}`}>
      <span className="absolute -top-4"><RankMark rank={entry.rank} /></span>
      <Avatar name={entry.name} isMe={isMe} />
      <p className="mt-2 w-full truncate text-sm font-black text-navy">{entry.name}</p>
      <div className="mt-2 max-w-full"><BadgePill badgeId={entry.badge} compact /></div>
      <div className="mt-3 border-t border-navy/5 pt-3"><p className="text-2xl font-black text-navy">{entry.score}</p><p className="mt-0.5 text-[11px] text-graydark/45">คะแนนสะสม</p></div>
    </article>
  );
}

export default function LeaderboardPage() {
  const [periodId, setPeriodId] = useState('overall');
  const [view, setView] = useState('table');
  const [entries, setEntries] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const activePeriod = PERIODS.find((period) => period.id === periodId) || PERIODS[0];
  const sourceEntries = loaded ? entries : activePeriod.data;
  const ranked = useMemo(() => withRank(sourceEntries), [sourceEntries]);
  const me = ranked.find((entry) => entry.userId === currentUserId);
  const podium = [
    ranked.find((entry) => entry.rank === 2),
    ranked.find((entry) => entry.rank === 1),
    ranked.find((entry) => entry.rank === 3),
  ].filter(Boolean);

  useEffect(() => {
    let active = true;
    async function loadLeaderboard() {
      setLoaded(false);
      try {
        const response = await fetch(`/api/leaderboard?period=${periodId}`, { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load leaderboard');
        if (!active) return;
        setEntries(payload.entries || []);
        setCurrentUserId(payload.currentUserId || null);
        setLoaded(true);
      } catch {
        if (active) {
          setEntries([]);
          setCurrentUserId(null);
          setLoaded(false);
        }
      }
    }
    loadLeaderboard();
    return () => {
      active = false;
    };
  }, [periodId]);

  return (
    <div className="space-y-6 pb-4">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#183560] to-[#20566e] px-5 py-6 text-white shadow-xl shadow-navy/15 sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-accent-cyan/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-accent-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
              <Trophy size={14} className="text-accent-gold" />
              ตารางคะแนนผู้ฝึกสอบ
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">อันดับของผู้เตรียมสอบ</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">เปรียบเทียบผลการฝึกของคุณกับผู้ใช้อื่น และสะสมเหรียญจากการฝึกอย่างต่อเนื่อง</p>
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm">
            <div className="border-r border-white/10 px-4 py-3.5">
              <p className="text-xs text-white/60">ผู้ร่วมจัดอันดับ</p>
              <p className="mt-1 flex items-center gap-2 text-xl font-black"><UsersRound size={18} className="text-accent-cyan" />{ranked.length} คน</p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-xs text-white/60">อันดับของคุณ</p>
              <p className="mt-1 text-xl font-black text-accent-gold">{me ? `#${me.rank}` : '—'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="app-card flex flex-col gap-4 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 gap-1 overflow-x-auto rounded-xl bg-slate-50 p-1" role="tablist" aria-label="ช่วงเวลาของอันดับ">
          {PERIODS.map((period) => (
            <button
              key={period.id}
              onClick={() => setPeriodId(period.id)}
              className={`min-w-[116px] flex-1 rounded-lg px-3 py-2 text-left transition ${periodId === period.id ? 'bg-white text-navy shadow-sm ring-1 ring-navy/5' : 'text-graydark/55 hover:bg-white/70'}`}
              role="tab"
              aria-selected={periodId === period.id}
            >
              <span className="block text-sm font-bold">{period.label}</span>
              <span className="mt-0.5 block text-[11px] opacity-65">{period.helper}</span>
            </button>
          ))}
        </div>
        <div className="flex shrink-0 rounded-xl bg-slate-50 p-1">
          <button
            onClick={() => setView('table')}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${view === 'table' ? 'bg-navy text-white shadow-sm' : 'text-graydark/55 hover:bg-white'}`}
            aria-pressed={view === 'table'}
          >
            <Table2 size={16} /> ตาราง
          </button>
          <button
            onClick={() => setView('cards')}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${view === 'cards' ? 'bg-navy text-white shadow-sm' : 'text-graydark/55 hover:bg-white'}`}
            aria-pressed={view === 'cards'}
          >
            <LayoutGrid size={16} /> การ์ด
          </button>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-amber-100 bg-[radial-gradient(circle_at_50%_0%,rgba(216,176,107,0.2),transparent_33%),linear-gradient(180deg,#fffdf8_0%,#f8fbfd_100%)] p-5 shadow-[0_14px_30px_rgba(43,45,66,0.06)] sm:p-7">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-navy">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Crown size={19} fill="currentColor" /></span>
            <div><h2 className="font-bold">ผู้นำคะแนน {activePeriod.label}</h2><p className="mt-0.5 text-xs text-graydark/45">3 อันดับแรกของช่วงเวลานี้</p></div>
          </div>
          <span className="hidden rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 sm:inline-flex">อัปเดตตามผลการฝึก</span>
        </div>
        <div className="grid grid-cols-3 items-end gap-2 pt-2 sm:gap-5">
          {podium.map((entry) => <PodiumCard key={entry.userId} entry={entry} currentUserId={currentUserId} />)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="app-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-graylight/20 bg-slate-50/70 px-5 py-4 sm:px-6">
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
                        <td className="px-5 py-4 sm:px-6"><RankMark rank={entry.rank} /></td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={entry.name} isMe={isMe} />
                            <div>
                              <p className={`text-sm font-bold ${isMe ? 'text-accent-cyan' : 'text-navy'}`}>{entry.name}{isMe && <span className="ml-2 text-xs font-medium text-accent-cyan">คุณ</span>}</p>
                              <p className="mt-0.5 text-xs text-graydark/45">ฝึกแล้ว {entry.attempts} ครั้ง</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4"><BadgePill badgeId={entry.badge} /></td>
                        <td className="px-3 py-4 text-center"><Movement value={entry.movement} /></td>
                        <td className="px-5 py-4 text-right sm:px-6"><p className="text-lg font-black text-navy">{entry.score}</p><p className="text-xs text-graydark/45">คะแนน</p></td>
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
          <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-[#24556d] p-6 text-white shadow-lg shadow-navy/10">
            <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-accent-gold"><Trophy size={19} /></span><div><p className="text-xs text-white/60">อันดับของคุณ</p><h2 className="font-bold">ผลการฝึก {activePeriod.label}</h2></div></div>
            {me ? (
              <>
                <div className="mt-6 flex items-end justify-between"><p className="text-5xl font-black text-accent-gold">#{me.rank}</p><span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200"><Movement value={me.movement} /></span></div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-accent-gold" style={{ width: `${Math.min(100, Math.round((me.score / (ranked[0]?.score || 1)) * 100))}%` }} /></div>
                <p className="mt-3 text-sm text-white/70">{me.score} คะแนน จากการฝึก {me.attempts} ครั้ง</p>
                <div className="mt-4"><BadgePill badgeId={me.badge} /></div>
              </>
            ) : <p className="mt-4 text-sm text-white/65">ยังไม่มีผลการฝึกในช่วงเวลานี้</p>}
          </section>

          <section className="app-card">
            <div className="flex items-center gap-2 text-navy"><Medal size={19} className="text-violet-500" /><h2 className="font-bold">สะสมเหรียญ</h2></div>
            <p className="mt-2 text-sm leading-6 text-graydark/55">เหรียญจะสะท้อนพฤติกรรมการฝึก เช่น ความแม่นยำ ความสม่ำเสมอ และการทำครบทุกวิชา</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-violet-50 p-3 text-xs text-violet-700"><Sparkles size={15} /> ดูรายละเอียดเหรียญทั้งหมดได้ในหน้าโปรไฟล์</div>
          </section>

          <p className="px-2 text-xs leading-5 text-graydark/40">อันดับคำนวณจากผลข้อสอบที่บันทึกในบัญชีผู้ใช้ และจะอัปเดตหลังส่งคำตอบของแต่ละชุด</p>
        </aside>
      </div>
    </div>
  );
}
