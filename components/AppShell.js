'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

function AdminShell({ children, pathname }) {
  const paymentsActive = pathname === '/admin' || pathname.startsWith('/admin/payments');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin/payments" className="flex items-center gap-2.5 text-navy">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-accent-cyan"><ShieldCheck size={19} /></span>
            <span><span className="block text-sm font-semibold">POLREADY</span><span className="block text-[10px] font-medium tracking-[0.18em] text-graydark/55">ADMIN PANEL</span></span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-graylight/35 px-3 py-2 text-sm font-medium text-graydark hover:border-navy hover:text-navy"><ArrowLeft size={16} /> กลับหน้าผู้ใช้</Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:py-8">
        <nav className="flex shrink-0 gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 lg:w-56 lg:flex-col lg:self-start">
          <Link href="/admin/payments" className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium ${paymentsActive ? 'bg-navy text-white' : 'text-graydark hover:bg-slate-50 hover:text-navy'}`}><CreditCard size={17} /> จัดการสลิป</Link>
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return <AdminShell pathname={pathname}>{children}</AdminShell>;

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">
      <Sidebar />
      <main className="app-main flex-1 min-w-0 p-4 pt-[4.5rem] sm:p-6 sm:pt-[4.5rem] lg:p-8">
        <div className="relative z-10 animate-enter">{children}</div>
      </main>
    </div>
  );
}
