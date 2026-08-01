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
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/practice', label: 'แบบฝึกหัดรายวิชา', icon: BookOpen },
  { href: '/profile', label: 'สถิติของฉัน', icon: BarChart3 },
  { href: '/mock-exam', label: 'ข้อสอบเสมือนจริง', icon: ClipboardList },
  { href: '/flashcards', label: 'แฟลชการ์ด', icon: Layers },
  { href: '/calendar', label: 'ปฏิทิน', icon: Calendar },
  { href: '/leaderboard', label: 'อันดับ', icon: Trophy },
  { href: '/announcements', label: 'ประกาศ', icon: Megaphone },
  { href: '/account', label: 'บัญชีและสมาชิก', icon: User },
];

function Logo() {
  return (
    <span className="text-lg font-semibold tracking-wide">
      POL<span className="text-accent-cyan">READY</span>
    </span>
  );
}

function NavLinks({ pathname, onNavigate }) {
  return (
    <nav className="flex-1 py-4 overflow-y-auto">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
              active
                ? 'bg-gradient-to-r from-white/15 to-accent-cyan/10 text-white border-r-2 border-accent-cyan shadow-[inset_0_0_24px_rgba(0,180,216,0.07)]'
                : 'text-graylight hover:bg-white/5 hover:text-white hover:translate-x-0.5'
            }`}
          >
            <Icon size={18} className="shrink-0" />
            {label}
          </Link>
        );
      })}
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
    <div className="border-t border-white/10 p-4">
      {error && <p role="alert" className="mb-2 px-2 text-xs text-red-300">{error}</p>}
      <button type="button" onClick={signOut} disabled={loggingOut} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-graylight transition hover:bg-white/5 hover:text-white disabled:opacity-60">
        <LogOut size={18} className="shrink-0" />
        {loggingOut ? 'กำลังออกจากระบบ…' : 'ออกจากระบบ'}
      </button>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // เปลี่ยนหน้าแล้วปิดเมนูเอง ไม่งั้นเมนูจะค้างทับเนื้อหาที่เพิ่งเปิด
  useEffect(() => {
    setOpen(false);
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
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* แถบบนสำหรับจอเล็ก/แท็บเล็ต */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-gradient-to-r from-navy to-[#363954] text-white flex items-center justify-between px-4 shadow-lg shadow-navy/20">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="เปิดเมนู"
          aria-expanded={open}
          className="p-2 -mr-2 rounded-lg hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* ฉากหลังทึบตอนเมนูเปิด */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* เมนูแบบสไลด์ (จอเล็ก) */}
      <aside
        // ใช้ inline transform แทนคลาส translate-x ของ Tailwind
        // เพราะคลาสพวกนั้นทำงานผ่าน CSS variable แล้วชนกับ transition จนค่าไม่อัปเดต
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[radial-gradient(circle_at_100%_0%,rgba(0,180,216,0.18),transparent_30%),linear-gradient(160deg,#2B2D42,#202238)] text-white flex flex-col transition-transform duration-200 shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="ปิดเมนู"
            className="p-2 -mr-2 rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
        <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        <SidebarFooter onNavigate={() => setOpen(false)} />
      </aside>

      {/* เมนูถาวร (จอใหญ่) */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[radial-gradient(circle_at_100%_0%,rgba(0,180,216,0.18),transparent_30%),radial-gradient(circle_at_0%_100%,rgba(216,176,107,0.1),transparent_26%),linear-gradient(160deg,#2B2D42,#202238)] text-white min-h-screen flex-col shadow-[8px_0_28px_rgba(43,45,66,0.08)]">
        <div className="px-6 py-6 border-b border-white/10">
          <Logo />
        </div>
        <NavLinks pathname={pathname} />
        <SidebarFooter />
      </aside>
    </>
  );
}
