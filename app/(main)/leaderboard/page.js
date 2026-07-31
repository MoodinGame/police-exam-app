'use client';

import { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { leaderboardOverall, leaderboardWeekly, currentUserId, withRank } from '@/lib/leaderboard';

const TABS = [
  { id: 'overall', label: 'อันดับรวม', data: leaderboardOverall },
  { id: 'weekly', label: 'สัปดาห์นี้', data: leaderboardWeekly },
];

const MEDAL_STYLES = {
  1: 'bg-yellow-100 text-yellow-700',
  2: 'bg-gray-200 text-gray-600',
  3: 'bg-orange-100 text-orange-600',
};

export default function LeaderboardPage() {
  const [tabId, setTabId] = useState('overall');
  const active = TABS.find((t) => t.id === tabId);
  const ranked = useMemo(() => withRank(active.data), [active]);
  const me = ranked.find((r) => r.userId === currentUserId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy mb-1">อันดับ</h1>
      <p className="text-graydark/60 mb-8">เทียบคะแนนกับผู้เตรียมสอบคนอื่น</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex gap-2 mb-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTabId(t.id)}
                className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                  tabId === t.id
                    ? 'bg-navy text-white border-navy'
                    : 'border-graylight/30 text-graydark hover:border-accent-cyan/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="border border-graylight/30 rounded-2xl overflow-hidden">
            <ul className="divide-y divide-graylight/15">
              {ranked.map((r) => {
                const isMe = r.userId === currentUserId;
                return (
                  <li
                    key={r.userId}
                    className={`flex items-center gap-4 px-5 py-3.5 ${isMe ? 'bg-accent-cyan/5' : ''}`}
                  >
                    <span
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${
                        MEDAL_STYLES[r.rank] || 'bg-navy/5 text-graydark/60'
                      }`}
                    >
                      {r.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-accent-cyan' : 'text-graydark'}`}>
                        {r.name}
                      </p>
                      <p className="text-xs text-graydark/40">ทำข้อสอบแล้ว {r.attempts} ครั้ง</p>
                    </div>
                    <span className="text-lg font-bold text-navy shrink-0">{r.score}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="border border-graylight/30 rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-2 mb-4 text-navy">
            <Trophy size={18} className="text-accent-cyan" />
            <p className="text-sm text-graydark/60">อันดับของคุณ ({active.label})</p>
          </div>
          {me ? (
            <>
              <p className="text-4xl font-bold text-navy mb-1">#{me.rank}</p>
              <p className="text-sm text-graydark/60">
                คะแนนรวม {me.score} · ทำข้อสอบแล้ว {me.attempts} ครั้ง
              </p>
            </>
          ) : (
            <p className="text-sm text-graydark/40">ยังไม่มีข้อมูลของคุณในช่วงนี้</p>
          )}
        </div>
      </div>
    </div>
  );
}
