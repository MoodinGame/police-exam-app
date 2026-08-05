import Link from 'next/link';
import { ArrowLeft, ShieldCheck, UserRound } from 'lucide-react';
import ProfileEditor from '@/components/ProfileEditor';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl pb-6">
      <header className="rounded-3xl border border-navy/10 bg-[radial-gradient(circle_at_92%_0%,rgba(79,134,247,0.18),transparent_32%),linear-gradient(135deg,#20395e,#18254a)] px-5 py-6 text-white shadow-[0_16px_34px_rgba(30,64,100,0.16)] sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/12 text-accent-cyan ring-1 ring-white/15"><UserRound size={22} /></span><div><p className="text-xs font-semibold tracking-[0.16em] text-white/55">PERSONAL SETTINGS</p><h1 className="mt-1 text-2xl font-semibold">แก้ไขโปรไฟล์</h1><p className="mt-1 text-sm text-white/65">จัดการชื่อผู้ใช้และอีเมลสำหรับบัญชีของคุณ</p></div></div>
          <Link href="/account" className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"><ArrowLeft size={16} />สมาชิกและแพ็กเกจ</Link>
        </div>
      </header>

      <ProfileEditor />

      <section className="mt-5 flex items-start gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm text-graydark/75">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-accent-cyan shadow-sm"><ShieldCheck size={18} /></span>
        <p className="leading-6"><span className="font-semibold text-navy">เบอร์โทรศัพท์ OTP ถูกล็อกเพื่อความปลอดภัย</span><br />หากต้องการเปลี่ยนเบอร์ ให้ติดต่อผู้ดูแลเพื่อยืนยันตัวตนก่อน</p>
      </section>
    </div>
  );
}
