'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BarChart3, Crown, Settings, Sparkles, Trophy, UserRound } from 'lucide-react';
import { useMembershipStatus } from '@/lib/useMembershipStatus';
import { useSubjects } from '@/lib/subjectCatalog';

const RADAR_CENTER = 130;
const RADAR_RADIUS = 82;
const RADAR_LABELS = {
  it: 'คอมพิวเตอร์',
  correspondence: 'งานสารบรรณ',
  'police-correspondence': 'สารบรรณตำรวจ',
  law: 'กฎหมาย',
  aptitude: 'คณิตศาสตร์',
  thai: 'ภาษาไทย',
  english: 'ภาษาอังกฤษ',
  social: 'สังคม',
};

// จำนวนแกนขึ้นกับจำนวนวิชาในฐานข้อมูล จึงต้องรับ count เข้ามา ไม่ผูกกับรายการ hardcode
function polarPoint(index, radius, count) {
  const angle = (-90 + index * (360 / count)) * (Math.PI / 180);
  return {
    x: RADAR_CENTER + Math.cos(angle) * radius,
    y: RADAR_CENTER + Math.sin(angle) * radius,
    cos: Math.cos(angle),
  };
}

function polygonPoints(radius, count) {
  return Array.from({ length: count }, (_, index) => {
    const point = polarPoint(index, radius, count);
    return `${point.x},${point.y}`;
  }).join(' ');
}

function SubjectRadarChart({ subjectAccuracy, subjects }) {
  const count = subjects.length;
  const values = subjects.map((subject) => {
    const value = subjectAccuracy?.[subject.id]?.pct;
    return typeof value === 'number' ? value : 0;
  });
  const valuePoints = values.map((value, index) => {
    const point = polarPoint(index, (value / 100) * RADAR_RADIUS, count);
    return `${point.x},${point.y}`;
  }).join(' ');
  const hasData = values.some((value) => value > 0);

  if (count === 0) return null;

  return (
    <div className="profile-radar-card w-full rounded-2xl border border-slate-200/90 bg-white/95 p-4 text-graydark shadow-[0_14px_30px_rgba(15,35,64,0.12)] backdrop-blur-sm sm:p-5 lg:ml-auto lg:w-[24rem]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div><p className="text-sm font-semibold text-navy">ความแม่นยำรายวิชา</p><p className="text-[11px] text-graydark/45">อิงจากข้อที่ทำจริง</p></div>
        <span className="rounded-full bg-accent-cyan/10 px-2.5 py-1 text-[11px] font-semibold text-accent-cyan">{hasData ? 'อัปเดตแล้ว' : 'เริ่มฝึกเพื่อดูผล'}</span>
      </div>
      <svg viewBox="0 0 260 260" className="mx-auto block w-full max-w-[18rem]" role="img" aria-label={`กราฟเรดาร์แสดงความแม่นยำทั้ง ${count} วิชา`}>
        <title>ความแม่นยำรายวิชา</title>
        {[20, 40, 60, 80, 100].map((value) => (
          <polygon key={value} points={polygonPoints((value / 100) * RADAR_RADIUS, count)} fill="none" stroke="#dbe3ef" strokeWidth="1" />
        ))}
        {subjects.map((subject, index) => {
          const point = polarPoint(index, RADAR_RADIUS, count);
          const label = polarPoint(index, RADAR_RADIUS + 26, count);
          const anchor = Math.abs(label.cos) < 0.25 ? 'middle' : label.cos > 0 ? 'start' : 'end';
          return <g key={subject.id}>
            <line x1={RADAR_CENTER} y1={RADAR_CENTER} x2={point.x} y2={point.y} stroke="#dbe3ef" strokeWidth="1" />
            {/* ชื่อย่อจากหลังบ้านมาก่อน ค่อยถอยไปใช้ป้ายสั้นที่เขียนไว้ให้พออ่านในกราฟ */}
            <text x={label.x} y={label.y + 3} textAnchor={anchor} className="fill-[#43516b] text-[9px] font-medium">{subject.shortName || RADAR_LABELS[subject.id] || subject.name}</text>
          </g>;
        })}
        {[20, 40, 60, 80, 100].map((value) => <text key={value} x={RADAR_CENTER + 4} y={RADAR_CENTER - (value / 100) * RADAR_RADIUS + 4} className="fill-[#9aa7bd] text-[8px]">{value}</text>)}
        <polygon className="profile-radar-shape" points={valuePoints} fill="rgba(79,134,247,0.18)" stroke="#00b4d8" strokeWidth="2.5" strokeLinejoin="round" />
        {values.map((value, index) => {
          const point = polarPoint(index, (value / 100) * RADAR_RADIUS, count);
          return <g key={subjects[index].id}>
            <circle className="profile-radar-dot" cx={point.x} cy={point.y} r="4" fill="white" stroke="#00b4d8" strokeWidth="2.5" />
            {value > 0 && <text x={point.x} y={point.y - 8} textAnchor="middle" className="fill-[#006b82] text-[8px] font-semibold">{value}%</text>}
          </g>;
        })}
      </svg>
    </div>
  );
}

function maskPhone(phone) {
  if (!phone || phone.length !== 10) return 'กำลังโหลดข้อมูลบัญชี';
  return `${phone.slice(0, 3)}-xxx-${phone.slice(-4)}`;
}

function membershipSummary(membership, isMember, loading, isLoggedIn) {
  if (loading) return { label: 'กำลังตรวจสอบสิทธิ์', className: 'bg-graylight/15 text-graydark/60' };
  if (!isLoggedIn) return { label: 'ยังไม่ได้เข้าสู่ระบบ', className: 'bg-graylight/15 text-graydark/60' };
  if (isMember) return { label: membership?.plan_name || 'VIP 1 ปี', className: 'bg-amber-100 text-amber-800' };
  if (membership?.status === 'pending') return { label: 'รอตรวจสอบ VIP', className: 'bg-amber-50 text-amber-700' };
  return { label: 'สมาชิกฟรี', className: 'bg-accent-cyan/10 text-accent-cyan' };
}

export default function ProfileHero({ subjectAccuracy }) {
  const [profile, setProfile] = useState(null);
  const { membership, isMember, isLoggedIn, loading: membershipLoading } = useMembershipStatus();
  const membershipState = membershipSummary(membership, isMember, membershipLoading, isLoggedIn);
  const { subjects } = useSubjects();

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const response = await fetch('/api/account', { cache: 'no-store' });
        const result = await response.json();
        if (response.ok && active) setProfile(result.profile);
      } catch {
        // The rest of the profile page remains useful even if account data is unavailable.
      }
    }
    loadProfile();
    return () => { active = false; };
  }, []);

  const username = profile?.username || 'สมาชิก POLREADY';
  const initial = profile?.username?.trim().charAt(0).toUpperCase() || 'P';

  return (
    <section className="profile-hero-shell mb-0 overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-[0_14px_32px_rgba(15,35,64,0.10)]" aria-labelledby="profile-title">
      <div
        className="relative overflow-hidden bg-[#18284f] p-5 sm:p-7"
        style={{ backgroundImage: 'radial-gradient(circle at 92% 10%, rgba(79, 134, 247, 0.22), transparent 26%), radial-gradient(circle at 10% 100%, rgba(216, 176, 107, 0.12), transparent 30%)' }}
      >
        <div className="pointer-events-none absolute -left-10 top-5 h-28 w-28 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-4 left-1/2 h-40 w-40 rounded-full bg-accent-cyan/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6 lg:gap-10">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="profile-hero-avatar grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl font-bold text-white ring-1 ring-white/25 shadow-[0_10px_22px_rgba(30,64,100,0.25)]">{initial}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.14em] text-white/55">MY PROFILE</p>
              <h1 id="profile-title" className="mt-1 truncate text-2xl font-semibold text-white sm:text-3xl">{username}</h1>
              <p className="mt-1 text-sm text-white/65">เบอร์ยืนยัน OTP: {maskPhone(profile?.phone)}</p>
            </div>
          </div>
          <span className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ${membershipState.className}`}>
            <Crown size={15} /> {membershipState.label}
          </span>
          <SubjectRadarChart subjectAccuracy={subjectAccuracy} subjects={subjects} />
        </div>
      </div>
      <div className="bg-white p-4 sm:px-7 sm:py-5">
        <div className="grid gap-2 sm:grid-cols-4">
          <a href="#stats-overview" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-navy transition hover:-translate-y-px hover:border-accent-cyan hover:bg-cyan-50/40"><BarChart3 size={16} />สถิติ</a>
          <a href="#achievements" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-navy transition hover:-translate-y-px hover:border-amber-400 hover:bg-amber-50"><Trophy size={16} />ความสำเร็จ</a>
          <Link href="/account" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-navy transition hover:-translate-y-px hover:border-accent-cyan hover:bg-cyan-50/40"><Sparkles size={16} />แพ็กเกจสมาชิก</Link>
          <Link href="/settings" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-navy transition hover:-translate-y-px hover:border-accent-cyan hover:bg-cyan-50/40"><Settings size={16} />แก้ไขโปรไฟล์</Link>
        </div>
      </div>
      <style jsx global>{`
        @keyframes profile-hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes profile-radar-reveal {
          from { opacity: 0; transform: scale(.72); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes profile-radar-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .68; }
        }

        .profile-hero-avatar { animation: profile-hero-float 4.6s ease-in-out infinite; }
        .profile-radar-shape { transform-box: fill-box; transform-origin: center; animation: profile-radar-reveal 820ms cubic-bezier(.22, 1, .36, 1) both; }
        .profile-radar-dot { animation: profile-radar-pulse 2.5s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .profile-hero-avatar,
          .profile-radar-shape,
          .profile-radar-dot { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
