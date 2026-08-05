'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, BarChart3, ChevronRight, FileText, LayoutDashboard, Library, Sparkles } from 'lucide-react';

const routeMeta = [
  { match: '/knowledge', label: 'คลังความรู้', icon: Library },
  { match: '/practice', label: 'แบบฝึกหัด', icon: FileText },
  { match: '/random-quiz', label: 'Random Quiz', icon: Sparkles },
  { match: '/mock-exam', label: 'ข้อสอบเสมือนจริง', icon: FileText },
  { match: '/vocab', label: 'คำศัพท์และแฟลชการ์ด', icon: Library },
  { match: '/profile', label: 'สถิติของฉัน', icon: BarChart3 },
  { match: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
];

function getRouteMeta(pathname) {
  return routeMeta.find(({ match }) => pathname === match || pathname.startsWith(`${match}/`)) || routeMeta[6];
}

export default function WorkspaceBar() {
  const pathname = usePathname();
  const { label, icon: Icon } = getRouteMeta(pathname);

  return (
    <div className="workspace-bar mb-5 hidden items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2.5 shadow-[0_1px_2px_rgba(15,35,64,0.03)] backdrop-blur-sm lg:flex">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf3ff] text-[#245cff]"><Icon size={16} /></span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400">POLREADY WORKSPACE</p>
          <p className="flex items-center gap-1.5 truncate text-xs font-medium text-slate-500"><span>เอกสารและการฝึก</span><ChevronRight size={13} /><span className="truncate font-semibold text-[#172856]">{label}</span></p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link href="/knowledge" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#172856]">
          <Library size={15} /> คลังความรู้
        </Link>
        <Link href="/practice" className="inline-flex items-center gap-1.5 rounded-xl bg-[#172856] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-[#22396f]">
          เริ่มฝึก <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  );
}
