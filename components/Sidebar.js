'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  { href: '/account', label: 'บัญชี', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-navy text-white min-h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-white/10">
        <span className="text-lg font-semibold tracking-wide">
          POL<span className="text-accent-cyan">READY</span>
        </span>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                active
                  ? 'bg-white/10 text-accent-cyan border-r-2 border-accent-cyan'
                  : 'text-graylight hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
