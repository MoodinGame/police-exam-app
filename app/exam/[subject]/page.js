import Link from 'next/link';
import { LogIn, LockKeyhole } from 'lucide-react';
import { canAccessExamSet, canUseArea, getUserAccess, isFreePracticeTopicId } from '@/lib/serverAccess';
import { requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import ExamClient from './ExamClient';

export const dynamic = 'force-dynamic';

export default async function ExamPage({ searchParams }) {
  // Next.js passes searchParams as a promise in current App Router releases.
  // Awaiting also remains safe when a plain object is supplied in development.
  const resolvedSearchParams = await searchParams;
  const topicKey = resolvedSearchParams?.topic || null;
  const setSlug = typeof resolvedSearchParams?.set === 'string' ? resolvedSearchParams.set.trim() : '';

  try {
    const user = await requireCurrentUser();
    const supabase = getSupabaseAdmin();

    // เช็คสถานะสมาชิกและ flag ชุดฟรีพร้อมกัน — flag อ่านจาก DB ที่แอดมินตั้งไว้
    // ไม่ใช่รายการที่ hardcode ไว้ ไม่งั้นหัวข้อที่แอดมินเพิ่งติ๊กว่าฟรีจะยังโดนบล็อก
    const [access, isFreeTrial, directSetResult] = await Promise.all([
      getUserAccess(supabase, user.id),
      topicKey ? isFreePracticeTopicId(supabase, topicKey) : Promise.resolve(false),
      setSlug
        ? supabase
          .from('exam_sets')
          .select('id, bank, is_free, status')
          .eq('slug', setSlug)
          .eq('bank', 'practice')
          .eq('status', 'published')
          .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (directSetResult.error) throw directSetResult.error;
    const isMember = canUseArea(access, 'practice');
    const hasDirectSetAccess = Boolean(directSetResult.data && canAccessExamSet(access, directSetResult.data));

    // เปิดทั้งวิชาโดยไม่ระบุหัวข้อ/ชุด จะเห็นข้อสอบหลายชุดพร้อมกัน จึงยังจำกัดเฉพาะสมาชิก
    if (!isMember && !isFreeTrial && !hasDirectSetAccess) return <MembershipRequired />;
    return <ExamClient />;
  } catch (error) {
    if (error?.status === 401) return <LoginRequired />;
    return <AccessUnavailable />;
  }
}

function AccessShell({ icon: Icon, title, text, children }) {
  return <main className="min-h-screen bg-graylight/10 px-4 py-10 flex items-center justify-center"><section className="max-w-lg rounded-2xl border border-graylight/25 bg-white p-7 text-center shadow-sm"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-accent-cyan"><Icon size={23} /></span><h1 className="mt-5 text-xl font-semibold text-navy">{title}</h1><p className="mt-2 text-sm leading-6 text-graydark/60">{text}</p><div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">{children}</div></section></main>;
}

function LoginRequired() {
  return <AccessShell icon={LogIn} title="เข้าสู่ระบบก่อนเริ่มทำข้อสอบ" text="ใช้ OTP เพื่อบันทึกความก้าวหน้าและเปิดชุดทดลองใช้ฟรีของคุณ"><Link href="/login" className="rounded-xl bg-navy px-5 py-3 text-sm font-medium text-white">เข้าสู่ระบบด้วย OTP</Link><Link href="/practice" className="rounded-xl border border-graylight/40 px-5 py-3 text-sm font-medium text-navy">กลับไปดูแบบฝึก</Link></AccessShell>;
}

function MembershipRequired() {
  return <AccessShell icon={LockKeyhole} title="ชุดนี้สำหรับสมาชิก" text="คุณยังทำชุดทดลองใช้ฟรีได้ 1 ชุดในแต่ละวิชา หรือสมัครสมาชิกรายปีเพื่อปลดล็อกแบบฝึกทั้งหมด"><Link href="/account" className="rounded-xl bg-navy px-5 py-3 text-sm font-medium text-white">ดูแพ็กเกจสมาชิก</Link><Link href="/practice" className="rounded-xl border border-graylight/40 px-5 py-3 text-sm font-medium text-navy">ดูชุดทดลองใช้ฟรี</Link></AccessShell>;
}

function AccessUnavailable() {
  return <AccessShell icon={LockKeyhole} title="ยังตรวจสอบสิทธิ์ไม่ได้" text="กรุณาลองเข้าสู่ระบบใหม่ หรือติดต่อผู้ดูแลหากปัญหายังเกิดขึ้น"><Link href="/login" className="rounded-xl bg-navy px-5 py-3 text-sm font-medium text-white">ไปหน้าเข้าสู่ระบบ</Link></AccessShell>;
}
