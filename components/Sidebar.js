'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Layers,
  Calendar,
  Trophy,
  Megaphone,
  User,
  BarChart3,
  Menu,
  LogOut,
  X,
  Zap,
  ChevronDown,
  Crown,
  Sparkles,
  LibraryBig,
  Shuffle,
  Gamepad2,
  ShieldCheck,
} from 'lucide-react';

const baseNavSections = [
  {
    label: 'ภาพรวม',
    items: [
      { href: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
      { href: '/profile', label: 'สถิติของฉัน', icon: BarChart3 },
    ],
  },
  {
    label: 'ฝึกทำข้อสอบ',
    items: [
      { href: '/practice', label: 'แบบฝึกหัดรายวิชา', icon: BookOpen },
      { href: '/random-quiz', label: 'Random Quiz', icon: Shuffle },
      { href: '/mock-exam', label: 'ข้อสอบเสมือนจริง', icon: ClipboardList },
      { href: '/vocab', label: 'คำศัพท์และแฟลชการ์ด', icon: Layers },
      { href: '/matching-game', label: 'เกมจับคู่คำศัพท์', icon: Gamepad2 },
      { href: '/knowledge', label: 'คลังความรู้', icon: LibraryBig },
    ],
  },
  {
    label: 'ติดตามผล',
    items: [
      { href: '/calendar', label: 'ปฏิทิน', icon: Calendar },
      { href: '/leaderboard', label: 'อันดับ', icon: Trophy },
      { href: '/announcements', label: 'ประกาศ', icon: Megaphone },
    ],
  },
  {
    label: 'บัญชี',
    items: [
      { href: '/account', label: 'สมาชิกและแพ็กเกจ', icon: Crown },
      { href: '/settings', label: 'แก้ไขโปรไฟล์', icon: User },
    ],
  },
];

function Logo() {
  return (
    <span className="text-lg font-semibold tracking-wide">
      POL<span className="text-accent-cyan">READY</span>
    </span>
  );
}

function SidebarBrand({ showQuickStart = false }) {
  return (
    <div className="relative overflow-hidden border-b border-white/10 px-5 py-5">
      <div className="pointer-events-none absolute -right-8 -top-9 h-24 w-24 rounded-full border border-accent-cyan/20" />
      <div className="relative flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-accent-cyan to-[#167da5] text-base font-black text-navy shadow-[0_8px_16px_rgba(0,180,216,0.18)]">P</span>
        <div className="min-w-0"><Logo /><p className="mt-0.5 text-[9px] font-semibold tracking-[0.19em] text-white/45">EXAM PREPARATION</p></div>
      </div>
      {showQuickStart && <Link href="/practice" className="relative mt-5 flex items-center justify-between rounded-2xl border border-accent-gold/25 bg-gradient-to-r from-accent-gold/20 to-white/5 px-3.5 py-3 text-sm font-semibold text-white transition hover:border-accent-gold/45 hover:bg-accent-gold/25"><span className="flex items-center gap-2"><Sparkles size={16} className="text-accent-gold" />เริ่มฝึกวันนี้</span><Zap size={17} className="text-accent-gold" /></Link>}
    </div>
  );
}

function NavLinks({ pathname, onNavigate, isAdmin }) {
  const sections = isAdmin
    ? [
        ...baseNavSections,
        {
          label: 'ผู้ดูแลระบบ',
          items: [{ href: '/admin', label: 'จัดการระบบ (Admin)', icon: ShieldCheck }],
        },
      ]
    : baseNavSections;

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
      {sections.map((section, sectionIndex) => (
        <div key={section.label} className={sectionIndex ? 'mt-5' : ''}>
          <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.16em] text-white/35">{section.label}</p>
          <div className="space-y-1">
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-white/16 via-white/10 to-accent-cyan/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_8px_18px_rgba(8,16,48,0.15)]'
                      : 'text-graylight/85 hover:bg-white/7 hover:text-white'
                  }`}
                >
                  {active && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-accent-cyan shadow-[0_0_14px_rgba(0,180,216,0.8)]" />}
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${active ? 'bg-accent-cyan text-navy shadow-[0_5px_12px_rgba(0,180,216,0.24)]' : 'bg-white/6 text-white/65 group-hover:bg-white/12 group-hover:text-accent-cyan'}`}><Icon size={16} strokeWidth={active ? 2.5 : 2} /></span>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ onNavigate }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  const signOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      onNavigate?.();
      router.replace('/login');
      router.refresh();
    } catch {
      setError('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่');
      setLoggingOut(false);
    }
  };

  return (
    <div className="border-t border-white/10 p-3">
      <Link href="/account" onClick={onNavigate} className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5 transition hover:border-accent-gold/30 hover:bg-white/8"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-gold/15 text-accent-gold"><Crown size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-white">บัญชีและสมาชิก</span><span className="block truncate text-[10px] text-white/45">ดูสิทธิ์และแพ็กเกจของคุณ</span></span><ChevronDown size={15} className="shrink-0 -rotate-90 text-white/35 transition group-hover:text-accent-gold" /></Link>
      {error && <p role="alert" className="mt-2 px-2 text-xs text-red-300">{error}</p>}
      <button type="button" onClick={signOut} disabled={loggingOut} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-graylight/75 transition hover:bg-white/5 hover:text-white disabled:opacity-60">
        <LogOut size={17} className="shrink-0" />
        {loggingOut ? 'กำลังออกจากระบบ…' : 'ออกจากระบบ'}
      </button>
    </div>
  );
}

function MobileAccountMenu({ username, open, onToggle, onClose, isAdmin }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  const signOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      onClose();
      router.replace('/login');
      router.refresh();
    } catch {
      setError('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่');
      setLoggingOut(false);
    }
  };

  return (
    <div className="relative">
      <button type="button" onClick={onToggle} aria-label="เปิดเมนูบัญชี" aria-expanded={open} aria-controls="mobile-account-menu" className="inline-flex max-w-[12.5rem] items-center gap-2 rounded-2xl border border-white/15 bg-[#0d1734]/75 px-2.5 py-2 text-sm font-semibold text-accent-gold shadow-inner shadow-black/10 outline-none transition hover:border-white/25 hover:bg-[#101d40] focus-visible:ring-2 focus-visible:ring-accent-cyan/70">
        <span className="rounded-lg bg-accent-cyan px-1.5 py-0.5 text-[10px] font-bold text-navy">บัญชี</span>
        <span className="truncate">{username}</span>
        <ChevronDown size={17} className={`shrink-0 text-white/70 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div id="mobile-account-menu" className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-64 overflow-hidden rounded-2xl border border-graylight/20 bg-white text-graydark shadow-[0_18px_42px_rgba(18,31,62,0.24)]">
        <div className="border-b border-graylight/20 bg-slate-50 px-4 py-3"><p className="truncate text-sm font-bold text-navy">{username}</p><p className="mt-0.5 text-[11px] text-graydark/50">จัดการบัญชีของคุณ</p></div>
        <Link href="/settings" onClick={onClose} className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-graydark transition hover:bg-slate-50 hover:text-navy"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-graydark/70"><User size={17} /></span>แก้ไขโปรไฟล์</Link>
        <Link href="/account" onClick={onClose} className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-[#b68b36] transition hover:bg-amber-50"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-accent-gold"><Crown size={17} /></span>สมาชิก / อัปเกรด</Link>
        {isAdmin && <Link href="/admin" onClick={onClose} className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-navy transition hover:bg-slate-50"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy/10 text-navy"><ShieldCheck size={17} /></span>จัดการระบบ (Admin)</Link>}
        <div className="border-t border-graylight/20 p-2">
          {error && <p role="alert" className="px-2 pb-2 text-xs text-red-600">{error}</p>}
          <button type="button" onClick={signOut} disabled={loggingOut} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-60"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50"><LogOut size={17} /></span>{loggingOut ? 'กำลังออกจากระบบ…' : 'ออกจากระบบ'}</button>
        </div>
      </div>}
    </div>
  );
}

function MobileBottomNav({ pathname, onMenuOpen }) {
  const practiceActive = pathname === '/practice' || pathname.startsWith('/practice/');

  return (
    <nav aria-label="เมนูหลักบนมือถือ" className="lg:hidden fixed inset-x-0 bottom-0 z-40 grid min-h-[4.9rem] grid-cols-5 border-t border-graylight/25 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-8px_24px_rgba(18,31,62,0.08)] backdrop-blur-xl">
      <Link href="/practice" className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-semibold transition ${practiceActive ? 'text-accent-cyan' : 'text-graydark/48'}`}>
        <BookOpen size={25} strokeWidth={practiceActive ? 2.5 : 2} />
        <span className="text-center leading-3">แบบฝึกหัด</span>
      </Link>
      <Link href="/vocab" className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-semibold transition ${pathname === '/vocab' ? 'text-accent-cyan' : 'text-graydark/48'}`}>
        <Layers size={25} strokeWidth={pathname === '/vocab' ? 2.5 : 2} />
        <span className="text-center leading-3">การ์ด</span>
      </Link>
      <Link href="/practice?start=1" aria-label="เริ่มทำแบบฝึกหัด" className="group flex min-w-0 flex-col items-center justify-end pb-1 text-[10px] font-bold text-navy">
        <span className="-mt-7 flex h-[4.55rem] w-[4.55rem] items-center justify-center rounded-full border-[5px] border-white bg-gradient-to-br from-accent-gold to-[#be9138] text-navy shadow-[0_10px_22px_rgba(190,145,56,0.34)] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_24px_rgba(190,145,56,0.42)]"><Zap size={31} strokeWidth={2.5} /></span>
        <span className="mt-1 text-center leading-3">เริ่มเลย</span>
      </Link>
      <Link href="/dashboard" className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-semibold transition ${pathname === '/dashboard' ? 'text-accent-gold' : 'text-graydark/48'}`}>
        <LayoutDashboard size={25} strokeWidth={pathname === '/dashboard' ? 2.5 : 2} />
        <span className="text-center leading-3">Dashboard</span>
      </Link>
      <button type="button" onClick={onMenuOpen} aria-label="เปิดเมนู" className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-semibold text-graydark/48 transition hover:bg-slate-50 hover:text-navy">
        <Menu size={27} />
        <span className="text-center leading-3">เมนู</span>
      </button>
    </nav>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState('บัญชีของฉัน');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const response = await fetch('/api/account', { cache: 'no-store' });
        const result = await response.json();
        if (response.ok && active) {
          setUsername(result?.profile?.username || 'บัญชีของฉัน');
          setIsAdmin(result?.profile?.role === 'admin');
        }
      } catch {
        if (active) setUsername('บัญชีของฉัน');
      }
    }
    loadProfile();
    return () => { active = false; };
  }, []);

  // เปลี่ยนหน้าแล้วปิดเมนูเอง ไม่งั้นเมนูจะค้างทับเนื้อหาที่เพิ่งเปิด
  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // ล็อกการเลื่อนพื้นหลังตอนเมนูเปิด
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // กด Esc เพื่อปิด
  useEffect(() => {
    if (!open && !profileOpen) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      setProfileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, profileOpen]);

  return (
    <>
      {/* แถบบนสำหรับจอเล็ก/แท็บเล็ต */}
      <header className="lg:hidden fixed inset-x-0 top-0 z-40 flex h-20 items-center justify-between border-b-[3px] border-accent-gold bg-[radial-gradient(circle_at_85%_0%,rgba(0,180,216,0.18),transparent_33%),linear-gradient(120deg,#202b52,#121b3b)] px-5 text-white shadow-[0_8px_20px_rgba(18,31,62,0.2)] sm:px-6">
        <Logo />
        <MobileAccountMenu username={username} open={profileOpen} onToggle={() => { setOpen(false); setProfileOpen((current) => !current); }} onClose={() => setProfileOpen(false)} isAdmin={isAdmin} />
      </header>

      {profileOpen && <button type="button" aria-label="ปิดเมนูบัญชี" onClick={() => setProfileOpen(false)} className="lg:hidden fixed inset-0 z-30 cursor-default" />}

      {/* ฉากหลังทึบตอนเมนูเปิด */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* เมนูแบบสไลด์ (จอเล็ก) */}
      <aside
        // ใช้ inline transform แทนคลาส translate-x ของ Tailwind
        // เพราะคลาสพวกนั้นทำงานผ่าน CSS variable แล้วชนกับ transition จนค่าไม่อัปเดต
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
        className="lg:hidden fixed inset-y-0 left-0 z-[60] w-72 max-w-[85vw] bg-[radial-gradient(circle_at_100%_0%,rgba(0,180,216,0.18),transparent_30%),linear-gradient(160deg,#2B2D42,#202238)] text-white flex flex-col transition-transform duration-200 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-cyan text-sm font-black text-navy">P</span><div><Logo /><p className="mt-0.5 text-[9px] font-semibold tracking-[0.16em] text-white/45">MAIN MENU</p></div></div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="ปิดเมนู"
            className="p-2 -mr-2 rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
        <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} isAdmin={isAdmin} />
        <SidebarFooter onNavigate={() => setOpen(false)} />
      </aside>

      {/* เมนูถาวร (จอใหญ่) */}
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-[radial-gradient(circle_at_100%_0%,rgba(0,180,216,0.18),transparent_30%),radial-gradient(circle_at_0%_100%,rgba(216,176,107,0.1),transparent_26%),linear-gradient(160deg,#2B2D42,#202238)] text-white shadow-[8px_0_28px_rgba(43,45,66,0.08)] lg:flex">
        <SidebarBrand showQuickStart />
        <NavLinks pathname={pathname} isAdmin={isAdmin} />
        <SidebarFooter />
      </aside>
      <MobileBottomNav pathname={pathname} onMenuOpen={() => { setProfileOpen(false); setOpen(true); }} />
    </>
  );
}
