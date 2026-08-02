'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, BookOpenCheck, ClipboardList, CreditCard, Database, KeyRound, Library, ShieldCheck, Sparkles } from 'lucide-react';
import LoginUpdateNotice from '@/components/LoginUpdateNotice';
import Sidebar from '@/components/Sidebar';

function AdminShell({ children, pathname }) {
  const contentActive = pathname === '/admin' || pathname.startsWith('/admin/content');
  const mockExamActive = pathname.startsWith('/admin/mock-exam');
  const knowledgeActive = pathname.startsWith('/admin/knowledge');
  const paymentsActive = pathname.startsWith('/admin/payments');
  const accessActive = pathname.startsWith('/admin/access');
  const vocabularyActive = pathname.startsWith('/admin/vocabulary');

  const contentLinks = [
    { href: '/admin', label: 'แบบฝึกหัดรายวิชา', icon: Database, active: contentActive },
    { href: '/admin/mock-exam', label: 'Mock Exam', icon: ClipboardList, active: mockExamActive },
    { href: '/admin/knowledge', label: 'คลังความรู้', icon: Library, active: knowledgeActive },
    { href: '/admin/vocabulary', label: 'คลังคำศัพท์', icon: BookOpenCheck, active: vocabularyActive },
  ];
  const commerceLinks = [
    { href: '/admin/payments', label: 'ตรวจสอบการชำระเงิน', icon: CreditCard, active: paymentsActive },
    { href: '/admin/access', label: 'แพ็กเกจและสิทธิ์', icon: KeyRound, active: accessActive },
  ];
  const renderNavLink = ({ href, label, icon: Icon, active }) => (
    <Link key={href} href={href} className={`group inline-flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${active ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-[#08213a] shadow-lg shadow-cyan-950/20' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${active ? 'bg-white/35' : 'bg-white/5 text-cyan-200 group-hover:bg-white/10'}`}><Icon size={16} /></span>
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dff7ff_0,_#f8fbff_36%,_#f3f6fb_100%)]">
      <header className="sticky top-0 z-30 border-b border-cyan-300/20 bg-gradient-to-r from-[#101d3d] via-[#152b55] to-[#087b9d] shadow-lg shadow-slate-900/15">
        <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 text-[#09213a] shadow-lg shadow-cyan-950/25"><ShieldCheck size={21} /></span>
            <span><span className="block text-base font-bold tracking-wide">POLREADY</span><span className="block text-[10px] font-semibold tracking-[0.2em] text-cyan-100/70">ADMIN COMMAND</span></span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-cyan-50 md:inline-flex"><Sparkles size={13} /> ศูนย์จัดการเนื้อหา</span>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"><ArrowLeft size={16} /><span className="hidden sm:inline">กลับหน้าผู้ใช้</span></Link>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:gap-7 lg:py-8">
        <aside className="shrink-0 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:w-64">
          <nav className="flex gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-gradient-to-b from-[#12234a] via-[#182c51] to-[#101c38] p-2 shadow-xl shadow-slate-900/15 lg:h-full lg:flex-col lg:overflow-y-auto lg:p-3" aria-label="เมนูผู้ดูแลระบบ">
            <div className="hidden px-3 pb-2 pt-1 lg:block"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200/60">เนื้อหาและการสอบ</p></div>
            {contentLinks.map(renderNavLink)}
            <div className="mx-2 hidden border-t border-white/10 py-2 lg:block"><p className="px-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200/60">สมาชิกและรายได้</p></div>
            {commerceLinks.map(renderNavLink)}
            <div className="hidden rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3 lg:block"><p className="text-xs font-bold text-cyan-100">เคล็ดลับ</p><p className="mt-1 text-xs leading-5 text-slate-300">เพิ่มข้อสอบที่ “แบบฝึกหัดรายวิชา” แล้ว Mock Exam จะตรวจความพร้อมและสุ่มจากคลังเดียวกัน</p></div>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 pb-8"><div className="animate-enter">{children}</div></main>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) {
    return <><LoginUpdateNotice /><AdminShell pathname={pathname}>{children}</AdminShell></>;
  }

  return (
    <>
      <LoginUpdateNotice />
      <div className="flex min-h-screen bg-[#f7f9fc]">
        <Sidebar />
        <main className="app-main min-w-0 flex-1 p-4 pb-28 pt-[6.5rem] sm:p-6 sm:pb-28 sm:pt-[6.5rem] lg:p-8">
          <div className="relative z-10 animate-enter">{children}</div>
        </main>
      </div>
    </>
  );
}
