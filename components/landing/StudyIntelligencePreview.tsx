'use client';

import { BarChart3, BookOpen, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';

const subjectRows = [
  { label: 'ภาษาไทย', value: '82%', color: '#3264f5', width: '82%' },
  { label: 'กฎหมาย', value: '76%', color: '#36b98c', width: '76%' },
  { label: 'คอมพิวเตอร์', value: '91%', color: '#d7a73f', width: '91%' },
];

export default function StudyIntelligencePreview() {
  return (
    <div className="relative mx-auto w-full max-w-md sm:max-w-xl md:max-w-none" aria-label="ตัวอย่างคลังความรู้และความก้าวหน้าในการอ่าน">
      <div className="absolute inset-x-[8%] top-[13%] h-2/3 rounded-full bg-[radial-gradient(circle,rgba(50,100,245,0.15),rgba(211,169,80,0.08)_42%,transparent_70%)] blur-3xl" />
      <section className="dashboard-levitate relative overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white/95 p-3 shadow-[0_26px_70px_rgba(23,52,91,0.16)] backdrop-blur sm:p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef3ff] text-[#3264f5]"><BookOpen size={18} /></span>
            <div>
              <p className="text-sm font-semibold text-[#172856]">คลังความรู้</p>
              <p className="text-[11px] text-slate-400">Study workspace</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dashboard-status" />กำลังอัปเดต</span>
        </div>

        <div className="mt-3 grid min-h-[20rem] grid-cols-1 gap-3 sm:min-h-[25rem] sm:grid-cols-[0.29fr_0.71fr] sm:gap-4">
          <aside className="hidden rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:block">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Library</p>
            <div className="mt-3 space-y-1">
              <NavItem icon={FileText} label="บทสรุป" />
              <NavItem icon={BookOpen} label="ภาษาไทย" active />
              <NavItem icon={BarChart3} label="สถิติของฉัน" />
            </div>
            <p className="mt-5 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">ในบทเรียน</p>
            <div className="mt-2 space-y-2 px-1 text-[11px] leading-4 text-slate-500">
              <p className="font-medium text-[#274e9f]">การอ่านจับใจความ</p>
              <p>เทคนิคจับคำสำคัญ</p>
              <p>ตัวอย่างข้อสอบ</p>
            </div>
          </aside>

          <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#3264f5]"><Sparkles size={12} />ภาษาไทย · เทคนิคทำข้อสอบ</div>
                <h2 className="mt-1.5 text-base font-semibold tracking-tight text-[#172856] sm:text-lg">การอ่านจับใจความ</h2>
              </div>
              <span className="hidden rounded-lg bg-[#fef8ea] px-2 py-1 text-[10px] font-semibold text-[#8f631f] sm:block">อ่านแล้ว 68%</span>
            </div>

            <div className="mt-3 space-y-1.5">
              <span className="block h-2 w-full rounded-full bg-slate-100" />
              <span className="block h-2 w-[92%] rounded-full bg-slate-100" />
              <span className="block h-2 w-[67%] rounded-full bg-slate-100" />
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-[#f5f8ff] p-3">
              <p className="text-[10px] font-semibold text-[#3264f5]">TECHNIQUE 01</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#172856]">อ่านคำถามก่อน แล้วหา “คำสำคัญ” ในบทความ</p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700"><CheckCircle2 size={12} />ลดเวลาวิเคราะห์โจทย์</div>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 border-t border-slate-100 pt-3">
              <div>
                <div className="flex items-center justify-between"><p className="text-[11px] font-semibold text-[#172856]">ความแม่นยำรายวิชา</p><span className="text-[10px] text-slate-400">7 วันล่าสุด</span></div>
                <div className="mt-2 space-y-2.5">
                  {subjectRows.map((subject, index) => (
                    <div key={subject.label}>
                      <div className="mb-1 flex justify-between text-[10px] font-medium text-slate-500"><span>{subject.label}</span><span>{subject.value}</span></div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="dashboard-bar h-full rounded-full" style={{ '--bar-width': subject.width, '--bar-color': subject.color, animationDelay: `${index * 140}ms` } as CSSProperties} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex w-[5.8rem] flex-col items-center justify-end border-l border-slate-100 pl-3 sm:w-24">
                <svg viewBox="0 0 110 72" className="w-full overflow-visible" aria-hidden="true">
                  <defs><linearGradient id="studyChart" x1="0" x2="1"><stop stopColor="#3264f5" /><stop offset="1" stopColor="#36b98c" /></linearGradient></defs>
                  <path d="M2 60 L22 46 L39 51 L57 30 L76 38 L105 9" fill="none" stroke="url(#studyChart)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" className="dashboard-chart-line" />
                  <circle cx="105" cy="9" r="4" fill="#36b98c" className="dashboard-chart-dot" />
                </svg>
                <p className="mt-1 text-center text-[10px] font-semibold text-[#172856]">+12% <span className="font-normal text-slate-400">สัปดาห์นี้</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <style jsx>{`
        .dashboard-levitate { animation: dashboard-levitate 5.5s ease-in-out infinite; }
        .dashboard-status { animation: dashboard-status 2.2s ease-in-out infinite; }
        .dashboard-bar { width: var(--bar-width); background: var(--bar-color); transform-origin: left; animation: dashboard-bar 900ms cubic-bezier(.22,1,.36,1) both; }
        .dashboard-chart-line { stroke-dasharray: 180; stroke-dashoffset: 180; animation: dashboard-chart 3.8s ease-in-out infinite alternate; }
        .dashboard-chart-dot { animation: dashboard-dot 1.9s ease-in-out infinite; }
        @keyframes dashboard-levitate { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes dashboard-status { 0%,100% { opacity: .45; transform: scale(.88); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes dashboard-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes dashboard-chart { 0%,20% { stroke-dashoffset: 180; } 65%,100% { stroke-dashoffset: 0; } }
        @keyframes dashboard-dot { 0%,100% { opacity: .55; r: 3.5; } 50% { opacity: 1; r: 5.5; } }
        @media (prefers-reduced-motion: reduce) { .dashboard-levitate, .dashboard-status, .dashboard-bar, .dashboard-chart-line, .dashboard-chart-dot { animation: none; } .dashboard-chart-line { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: typeof BookOpen; label: string; active?: boolean }) {
  return <div className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium ${active ? 'bg-white text-[#3264f5] shadow-sm' : 'text-slate-500'}`}><Icon size={13} />{label}</div>;
}
