'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  ChevronDown,
  CheckCircle2,
  Clock3,
  ListChecks,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Trophy,
  XCircle,
} from 'lucide-react';
import { noCopyHandlers } from '@/lib/copyProtection';

const REVIEW_FILTERS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'incorrect', label: 'ตอบผิด' },
  { id: 'unanswered', label: 'ยังไม่ตอบ' },
  { id: 'correct', label: 'ตอบถูก' },
];

function formatDuration(seconds) {
  const safe = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function statusOf(item) {
  if (item.selectedIndex === undefined || item.selectedIndex === null) return 'unanswered';
  return item.selectedIndex === item.answerIndex ? 'correct' : 'incorrect';
}

function buildCategories(items) {
  const order = [];
  const map = new Map();
  items.forEach((item) => {
    const id = item.categoryId || 'all';
    const name = item.categoryName || 'ทั้งหมด';
    if (!map.has(id)) {
      map.set(id, { id, name, total: 0, correct: 0 });
      order.push(id);
    }
    const entry = map.get(id);
    entry.total += 1;
    if (statusOf(item) === 'correct') entry.correct += 1;
  });
  return order.map((id) => {
    const entry = map.get(id);
    return { ...entry, pct: entry.total ? Math.round((entry.correct / entry.total) * 100) : 0 };
  });
}

export default function ExamResultSummary({
  title,
  subtitle,
  score,
  total,
  elapsedSeconds = 0,
  standardSeconds = null,
  passThreshold = 0.6,
  items,
  history = null,
  backHref,
  onBack,
  backLabel = 'กลับ',
  onRetrySame,
  retrySameHref,
  onRetryNew,
  newHref,
  newLabel = 'ทำชุดใหม่',
  practiceHrefForCategory,
}) {
  const [reviewFilter, setReviewFilter] = useState('all');
  const [jumpedId, setJumpedId] = useState(null);
  const [expandedReviewIds, setExpandedReviewIds] = useState(() => new Set());

  const accuracyPct = total ? Math.round((score / total) * 100) : 0;
  const hasPassThreshold = Number.isFinite(passThreshold) && passThreshold > 0;
  const passed = hasPassThreshold && total > 0 && score / total >= passThreshold;
  const unansweredCount = items.filter((item) => statusOf(item) === 'unanswered').length;
  const incorrectCount = items.filter((item) => statusOf(item) === 'incorrect').length;
  const categories = buildCategories(items);
  const weakCategories = categories.filter((category) => category.pct < 70).sort((a, b) => a.pct - b.pct);

  const wrongItems = items.filter((item) => statusOf(item) === 'incorrect');
  const filteredItems = items.filter((item) => {
    const status = statusOf(item);
    if (reviewFilter === 'all') return true;
    return status === reviewFilter;
  });

  const jumpTo = (id, filter) => {
    setReviewFilter(filter);
    setJumpedId(id);
    if (id) setExpandedReviewIds((current) => new Set([...current, id]));
    window.setTimeout(() => {
      document.getElementById(`result-question-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const setReviewExpanded = (id, expanded) => {
    setExpandedReviewIds((current) => {
      const next = new Set(current);
      if (expanded) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="mx-auto w-full max-w-app pb-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-navy sm:text-2xl">ผลการทำข้อสอบ</h1>
          {(title || subtitle) && <p className="mt-1 text-sm text-graydark/55">{title}{title && subtitle ? ' · ' : ''}{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => jumpTo(items[0]?.id, 'all')} className="btn-outline"><BookOpenCheck size={15} />เฉลยข้อสอบ</button>
          {weakCategories.length > 0 && (
            <a href="#result-weakness" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-accent-gold px-3.5 py-2.5 text-sm font-bold text-navy shadow-sm hover:brightness-105"><Sparkles size={15} />วิเคราะห์จุดอ่อน</a>
          )}
        </div>
      </header>

      <section className="mt-5 grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5">
          <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full" style={{ background: `conic-gradient(${hasPassThreshold ? (passed ? '#4ADE80' : '#f87171') : '#70cfed'} ${accuracyPct}%, #eef1f6 0)` }}>
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner">
              <p className="text-3xl font-black text-navy">{accuracyPct}%</p>
              <p className="text-[11px] text-graydark/50">{score}/{total} ข้อ</p>
            </div>
          </div>
          {hasPassThreshold ? (
            <>
              <span className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {passed ? <Trophy size={14} /> : <AlertTriangle size={14} />}
                {passed ? 'ผ่านเกณฑ์' : 'ไม่ผ่าน'}
              </span>
              <div className={`mt-4 rounded-xl px-4 py-3 text-xs leading-5 ${passed ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                <p className="font-bold">{passed ? 'ทำได้ดีมาก!' : 'ต้องพัฒนาต่อ!'}</p>
                <p className="mt-0.5">{passed ? 'รักษาความต่อเนื่องและฝึกซ้อมต่อไป' : 'อย่าท้อ! ทบทวนและฝึกเพิ่มเติมในหัวข้อที่ยังอ่อน'}</p>
              </div>
            </>
          ) : (
            <>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700"><ListChecks size={14} />สรุปผลการฝึก</span>
              <div className="mt-4 rounded-xl bg-cyan-50 px-4 py-3 text-xs leading-5 text-cyan-900"><p className="font-bold">บันทึกผลไว้แล้ว</p><p className="mt-0.5">ใช้ผลลัพธ์นี้เพื่อทบทวนข้อที่ยังไม่แม่น</p></div>
            </>
          )}
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-navy">สรุปผลการทำข้อสอบ</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <SummaryStat label="จำนวนข้อ" value={total} />
            <SummaryStat label="ตอบถูก" value={score} tone="text-emerald-600" />
            <SummaryStat label="ตอบผิด" value={incorrectCount} tone="text-red-500" />
            <SummaryStat label="ไม่ตอบ" value={unansweredCount} tone="text-graydark/50" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
            <div><p className="text-[11px] text-graydark/45">เวลาในการทำ</p><p className="mt-1 text-sm font-bold text-navy">{formatDuration(elapsedSeconds)}</p></div>
            <div><p className="text-[11px] text-graydark/45">เวลามาตรฐาน</p><p className="mt-1 text-sm font-bold text-navy">{standardSeconds ? formatDuration(standardSeconds) : '—'}</p></div>
            <div><p className="text-[11px] text-graydark/45">คะแนน</p><p className={`mt-1 text-sm font-bold ${hasPassThreshold ? (passed ? 'text-emerald-600' : 'text-red-500') : 'text-accent-cyan'}`}>{accuracyPct}%</p></div>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-navy">คะแนนแยกตามหมวดหมู่</h2>
          <div className="mt-4 space-y-3">
            {categories.map((category) => (
              <div key={category.id}>
                <div className="flex items-center justify-between text-xs"><span className="font-semibold text-graydark">{category.name}</span><span className="font-bold text-navy">{category.pct}%</span></div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${category.pct >= 70 ? 'bg-emerald-400' : category.pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${category.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <details className="group min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 outline-none [&::-webkit-details-marker]:hidden sm:p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-accent-cyan"><ListChecks size={18} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-navy">รายละเอียดการทำข้อสอบ</span><span className="mt-0.5 block text-xs text-graydark/50">ตอบถูก {score} · ตอบผิด {incorrectCount} · ไม่ตอบ {unansweredCount}</span></span>
            <ChevronDown size={18} className="shrink-0 text-graydark/50 transition duration-200 group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-100 p-4 sm:p-5">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-graydark/55">
              <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" />ตอบถูก</span>
              <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-red-400" />ตอบผิด</span>
              <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-slate-300" />ไม่ตอบ</span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5 min-[380px]:grid-cols-6 sm:grid-cols-8 lg:grid-cols-6">
              {items.map((item, index) => {
                const status = statusOf(item);
                const tone = status === 'correct' ? 'bg-emerald-400 text-white' : status === 'incorrect' ? 'bg-red-400 text-white' : 'border border-slate-200 text-graydark/50';
                return <button key={item.id} type="button" onClick={() => jumpTo(item.id, 'all')} className={`flex aspect-square min-h-[2.25rem] items-center justify-center rounded-lg text-xs font-bold transition ${tone}`}>{index + 1}</button>;
              })}
            </div>
            {wrongItems.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-red-600">ข้อที่คุณตอบผิด ({wrongItems.length} ข้อ)</p>
                <div className="mt-2 space-y-1.5">
                  {wrongItems.slice(0, 6).map((item) => {
                    const index = items.findIndex((questionItem) => questionItem.id === item.id);
                    return (
                      <div key={item.id} className="flex items-start justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                        <span className="min-w-0 flex-1 line-clamp-2 [overflow-wrap:anywhere]"><span className="font-bold">{index + 1}.</span> {item.question}</span>
                        <button type="button" onClick={() => jumpTo(item.id, 'incorrect')} className="shrink-0 py-1 font-bold text-red-600 hover:underline">ดูเฉลย</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </details>

        <article id="result-weakness" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-navy">วิเคราะห์จุดอ่อนของคุณ</h2>
          {weakCategories.length === 0 ? (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800"><span className="font-bold">ยอดเยี่ยม!</span> ไม่มีหมวดหมู่ที่คะแนนต่ำกว่าเกณฑ์ในรอบนี้</div>
          ) : (
            <>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-800">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                คุณยังอ่อนใน {weakCategories.length} หมวดหมู่หลัก
              </div>
              <div className="mt-3 space-y-2.5">
                {weakCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-navy">{category.name}</p><p className="text-xs text-graydark/50">{category.pct}%</p></div>
                    {practiceHrefForCategory && practiceHrefForCategory(category.id) ? (
                      <Link href={practiceHrefForCategory(category.id)} className="shrink-0 rounded-lg bg-navy px-3 py-2 text-xs font-bold text-white hover:bg-navy/90">ฝึกเพิ่ม</Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-navy">พัฒนาการของคุณ</h2>
          {history && history.length >= 2 ? <ProgressSparkline history={history} /> : <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-graydark/50">ทำข้อสอบชุดนี้อีกสักครั้ง เพื่อดูพัฒนาการของคุณ</p>}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-graydark/60">ต้องการพัฒนาต่อ?</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-graydark/60">
              <li className="flex gap-1.5"><TrendingUp size={13} className="mt-0.5 shrink-0 text-accent-cyan" />ฝึกข้อสอบเพิ่มในหมวดที่ยังอ่อน</li>
              <li className="flex gap-1.5"><TrendingUp size={13} className="mt-0.5 shrink-0 text-accent-cyan" />ดูเฉลยและอธิบายละเอียด</li>
              <li className="flex gap-1.5"><TrendingUp size={13} className="mt-0.5 shrink-0 text-accent-cyan" />ทำชุดเดิมซ้ำเพื่อวัดความก้าวหน้า</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="flex items-center gap-2 text-sm font-bold text-navy"><ListChecks size={18} className="text-accent-cyan" />เฉลยและคำอธิบาย</h2><p className="mt-1 text-xs text-graydark/50">แตะข้อที่ต้องการเพื่อเปิดดูคำตอบและคำอธิบาย</p></div>
          <div className="flex w-full flex-wrap gap-2" role="tablist" aria-label="ตัวกรองเฉลย">
            {REVIEW_FILTERS.map((filter) => (
              <button key={filter.id} type="button" role="tab" aria-selected={reviewFilter === filter.id} onClick={() => setReviewFilter(filter.id)} className={`min-h-[44px] shrink-0 rounded-xl border px-3.5 py-2 text-sm font-bold transition ${reviewFilter === filter.id ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-graydark/65 hover:border-cyan-300 hover:text-cyan-700'}`}>{filter.label}</button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3 no-copy" {...noCopyHandlers}>
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-graydark/55">ไม่มีข้อสอบในตัวกรองนี้</div>
          ) : filteredItems.map((item) => {
            const index = items.findIndex((questionItem) => questionItem.id === item.id);
            const status = statusOf(item);
            const tone = status === 'correct' ? 'border-emerald-100 bg-emerald-50/45' : status === 'unanswered' ? 'border-slate-200 bg-slate-50' : 'border-red-100 bg-red-50/45';
            const highlight = jumpedId === item.id ? 'ring-2 ring-accent-cyan' : '';
            const statusLabel = status === 'correct' ? 'ตอบถูก' : status === 'unanswered' ? 'ยังไม่ตอบ' : 'ตอบผิด';
            const statusBadge = status === 'correct' ? 'bg-emerald-100 text-emerald-700' : status === 'unanswered' ? 'bg-slate-200 text-slate-600' : 'bg-red-100 text-red-600';
            const ownAnswer = status === 'unanswered' ? 'ไม่ได้เลือกคำตอบ' : item.choices[item.selectedIndex];
            const correctAnswer = item.choices[item.answerIndex];
            return (
              <details key={item.id} id={`result-question-${item.id}`} open={expandedReviewIds.has(item.id)} onToggle={(event) => setReviewExpanded(item.id, event.currentTarget.open)} className={`group min-w-0 break-words rounded-2xl border transition [overflow-wrap:anywhere] ${tone} ${highlight}`}>
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4 outline-none [&::-webkit-details-marker]:hidden sm:p-5">
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${status === 'correct' ? 'bg-emerald-500 text-white' : status === 'unanswered' ? 'bg-slate-200 text-slate-600' : 'bg-red-500 text-white'}`}>
                    {status === 'correct' ? <CheckCircle2 size={16} /> : status === 'unanswered' ? <Clock3 size={15} /> : <XCircle size={16} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-graydark/45">ข้อ {index + 1}</span>{item.categoryName && <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-graydark/60">{item.categoryName}</span>}<span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusBadge}`}>{statusLabel}</span></span>
                    <span className="mt-1.5 block text-[15px] font-bold leading-6 text-navy line-clamp-2 sm:text-base">{item.question}</span>
                  </span>
                  <ChevronDown size={18} className="mt-1 shrink-0 text-graydark/50 transition duration-200 group-open:rotate-180" />
                </summary>
                <div className="border-t border-white/80 bg-white/45 p-4 sm:p-5">
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200/80 bg-white/85 px-3.5 py-3"><p className="text-[11px] font-bold text-graydark/50">คำตอบของคุณ</p><p className="mt-1 font-semibold leading-6 text-navy">{ownAnswer}</p></div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/85 px-3.5 py-3"><p className="text-[11px] font-bold text-emerald-700/70">คำตอบที่ถูก</p><p className="mt-1 font-semibold leading-6 text-emerald-900">{correctAnswer}</p></div>
                  </div>
                  {item.explanation && <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/85 px-3.5 py-3 text-sm leading-6 text-graydark/75"><p className="text-[11px] font-bold text-navy">คำอธิบาย</p><p className="mt-1.5">{item.explanation}</p></div>}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <div className="mt-5 flex flex-col gap-2.5 pb-[env(safe-area-inset-bottom)] sm:flex-row sm:justify-between">
        {backHref
          ? <Link href={backHref} className="btn-outline w-full sm:w-auto"><ArrowLeft size={16} />{backLabel}</Link>
          : onBack
            ? <button type="button" onClick={onBack} className="btn-outline w-full sm:w-auto"><ArrowLeft size={16} />{backLabel}</button>
            : <span />}
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
          {(onRetrySame || retrySameHref) && (
            retrySameHref
              ? <Link href={retrySameHref} className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-navy/20 px-5 py-3 text-sm font-bold text-navy hover:bg-navy/5 sm:w-auto"><RotateCcw size={16} />ทำชุดเดิม</Link>
              : <button type="button" onClick={onRetrySame} className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-navy/20 px-5 py-3 text-sm font-bold text-navy hover:bg-navy/5 sm:w-auto"><RotateCcw size={16} />ทำชุดเดิม</button>
          )}
          {(onRetryNew || newHref) && (
            newHref
              ? <Link href={newHref} className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-accent-gold px-5 py-3 text-sm font-bold text-navy shadow-lg shadow-accent-gold/20 hover:brightness-105 sm:w-auto">{newLabel}</Link>
              : <button type="button" onClick={onRetryNew} className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-accent-gold px-5 py-3 text-sm font-bold text-navy shadow-lg shadow-accent-gold/20 hover:brightness-105 sm:w-auto">{newLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone = 'text-navy' }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-[11px] text-graydark/50">{label}</p><p className={`mt-0.5 text-xl font-black ${tone}`}>{value}</p></div>;
}

function ProgressSparkline({ history }) {
  const width = 220;
  const height = 70;
  const padding = 8;
  const points = history.map((entry, index) => {
    const x = padding + (index / (history.length - 1)) * (width - padding * 2);
    const y = height - padding - (entry.pct / 100) * (height - padding * 2);
    return { x, y, pct: entry.pct, label: entry.label };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');

  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => <circle key={point.x} cx={point.x} cy={point.y} r="3" fill="#4ADE80" />)}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-graydark/45">
        {points.map((point) => <span key={point.x}>{point.label}</span>)}
      </div>
    </div>
  );
}
