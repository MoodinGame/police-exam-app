'use client';

import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Megaphone } from 'lucide-react';
import { announcements as fallbackAnnouncements } from '@/lib/announcements';

const TONE_STYLES = {
  info: 'bg-cyan-50 text-cyan-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  important: 'bg-violet-50 text-violet-700',
};

function formatThaiDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return date.toLocaleDateString('th-TH', { dateStyle: 'medium' });
}

function fallbackItems() {
  return fallbackAnnouncements.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.body,
    body: '',
    tone: 'info',
    created_at: item.date,
  }));
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState(fallbackItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch('/api/announcements', { cache: 'no-store' });
        const result = await response.json();
        if (active && response.ok) setItems(result.announcements || []);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const sorted = useMemo(() => [...items].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))), [items]);

  return <div className="max-w-3xl">
    <h1 className="mb-1 text-2xl font-semibold text-navy">ประกาศ</h1>
    <p className="mb-8 text-graydark/60">ข่าวสารและอัปเดตจากทีมงาน</p>

    {loading && <div className="mb-4 inline-flex items-center gap-2 text-sm text-graydark/45"><LoaderCircle size={16} className="animate-spin" />กำลังตรวจสอบประกาศล่าสุด</div>}
    {sorted.length === 0 ? <div className="rounded-2xl border border-dashed border-graylight/40 p-12 text-center text-graydark/40">ยังไม่มีประกาศ</div> : <ul className="space-y-4">{sorted.map((item) => <li key={item.id} className="rounded-2xl border border-graylight/30 bg-white p-5 sm:p-6"><div className="flex items-start gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/5"><Megaphone size={16} className="text-navy" /></div><div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TONE_STYLES[item.tone] || TONE_STYLES.info}`}>{item.tone === 'warning' ? 'แจ้งเตือน' : item.tone === 'important' ? 'สำคัญ' : item.tone === 'success' ? 'อัปเดต' : 'ข่าวสาร'}</span><span className="text-xs text-graydark/40">{formatThaiDate(item.created_at)}</span></div><h2 className="mb-1.5 font-semibold text-graydark">{item.title}</h2><p className="text-sm leading-relaxed text-graydark/65">{item.summary}</p>{item.body && <p className="mt-3 whitespace-pre-line border-t border-graylight/20 pt-3 text-sm leading-relaxed text-graydark/60">{item.body}</p>}</div></div></li>)}</ul>}
  </div>;
}
