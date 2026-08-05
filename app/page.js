import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileQuestion,
  Languages,
  Layers3,
  Library,
  LockKeyhole,
  Medal,
  Puzzle,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/membership';
import { getPublicPlans } from '@/lib/serverAccess';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import Reveal from '@/components/Reveal';
import OnlineStatusBadge from '@/components/OnlineStatusBadge';
import { BrandLogo, BrandMark } from '@/components/BrandLogo';
import StudyIntelligencePreview from '@/components/landing/StudyIntelligencePreview';

const trustPoints = [
  { icon: Target, title: 'เห็นจุดที่ควรฝึก', text: 'ดูความแม่นยำแยกตามวิชา' },
  { icon: FileQuestion, title: 'ฝึกเป็นหัวข้อ', text: 'เริ่มทีละเรื่องอย่างเป็นระบบ' },
  { icon: TrendingUp, title: 'ติดตามพัฒนาการ', text: 'เห็นความก้าวหน้าของตัวเอง' },
  { icon: LockKeyhole, title: 'ข้อมูลเป็นส่วนตัว', text: 'บัญชีผูกด้วย OTP ของคุณ' },
];

const problems = [
  { icon: BookOpenCheck, title: 'อ่านหนังสือแต่ไม่รู้ว่าอ่อนเรื่องไหน', text: 'แยกแบบฝึกเป็นวิชาและหัวข้อ เพื่อให้เริ่มได้ตรงจุด' },
  { icon: ClipboardCheck, title: 'ทำข้อสอบแล้วไม่รู้ว่าพลาดตรงไหน', text: 'เก็บผลการฝึกไว้ให้กลับมาทบทวนได้ง่าย' },
  { icon: Clock3, title: 'ไม่มีแผนและจัดเวลาอ่านไม่ลงตัว', text: 'ใช้ปฏิทินและ streak ช่วยรักษาวินัยในการฝึก' },
  { icon: BrainCircuit, title: 'ไม่มั่นใจก่อนเข้าห้องสอบจริง', text: 'ฝึก Mock Exam และดูผลลัพธ์ในมุมเดียวกับการสอบ' },
];

const steps = [
  { number: '01', title: 'เข้าสู่ระบบ', text: 'ยืนยันตัวตนด้วยเบอร์มือถือและ OTP', icon: ShieldCheck },
  { number: '02', title: 'เลือกวิชาที่ต้องการฝึก', text: 'เลือกหัวข้อย่อยหรือชุดแบบฝึกที่เหมาะกับคุณ', icon: Layers3 },
  { number: '03', title: 'ฝึกและเห็นผลทันที', text: 'ใช้สถิติเพื่อเลือกสิ่งที่ควรทบทวนต่อ', icon: BarChart3 },
];

const tools = [
  { icon: Shuffle, title: 'สุ่มข้อสอบ (Random Quiz)', text: 'เลือกจำนวนข้อที่ต้องการ สุ่มโจทย์จากทุกวิชา ฝึกไวได้ทุกช่วงเวลาว่าง' },
  { icon: Languages, title: 'คลังคำศัพท์ (Flashcard)', text: 'ทบทวนคำศัพท์เฉพาะทางตำรวจและภาษาอังกฤษแบบพลิกการ์ด จำง่าย ทบทวนซ้ำได้ไว' },
  { icon: Puzzle, title: 'เกมจับคู่คำศัพท์', text: 'ฝึกจำผ่านเกมจับคู่ สนุกกว่าอ่านเฉยๆ และช่วยให้จำได้แม่นขึ้น' },
  { icon: Library, title: 'คลังความรู้', text: 'อ่านสรุปเจาะลึกแต่ละหัวข้อ พร้อมจุดที่ออกสอบบ่อย ก่อนลงมือทำโจทย์จริง' },
];

// ราคาและสิทธิ์แพ็กเกจต้องมาจากฐานข้อมูลเท่านั้น เพื่อไม่ให้แสดงข้อมูลที่ล้าสมัย
// หรือเปิดรับชำระเงินจากแผนที่ผู้ดูแลปิดไปแล้ว
async function getMembershipPlans() {
  try {
    const supabase = getSupabaseAdmin();
    const plans = await getPublicPlans(supabase);
    return plans || [];
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';

function planPriceSuffix(plan) {
  if (!plan.price) return '';
  if (plan.billingType === 'subscription' && plan.durationDays) {
    return plan.durationDays >= 360 ? '/ ปี' : `/ ${plan.durationDays} วัน`;
  }
  if (plan.billingType === 'one_time') return '/ ครั้ง';
  return '';
}

export default async function HomePage() {
  const plans = await getMembershipPlans();

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfcff] text-graydark">
      <Header />

      <section className="relative border-b border-slate-100 bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_at_80%_20%,rgba(42,91,255,0.10),transparent_32%),radial-gradient(ellipse_at_20%_15%,rgba(211,169,80,0.10),transparent_25%)]" />
        <div className="relative mx-auto grid max-w-app gap-10 px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:gap-12">
          <div className="max-w-xl">
            <Reveal className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#2457d6]"><Sparkles size={14} /> สำหรับผู้สมัครสอบตำรวจ</span>
              <OnlineStatusBadge />
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 text-[2.55rem] font-semibold leading-[1.2] tracking-tight text-[#172856] sm:text-5xl lg:text-[3.5rem]">ฝึกให้ตรงจุด<br /><span className="text-[#245cff]">เพิ่มความมั่นใจ</span><br />ก่อนวันสอบจริง</h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 max-w-lg text-base leading-8 text-slate-500 sm:text-lg">POLREADY ช่วยจัดการการฝึกสอบของคุณให้เป็นระบบ ทั้งแบบฝึกตามวิชา, Mock Exam, แฟลชการ์ด และสถิติส่วนตัวในที่เดียว</p>
            </Reveal>
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {trustPoints.map(({ icon: Icon, title, text }, index) => (
                <Reveal key={title} delay={220 + index * 80} as="article" className="rounded-2xl border border-slate-100 bg-[#fbfcff] p-3.5 shadow-sm">
                  <Icon size={19} className="text-[#245cff]" /><h2 className="mt-3 text-xs font-semibold leading-5 text-[#172856]">{title}</h2><p className="mt-1 text-[11px] leading-4 text-slate-400">{text}</p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={520} className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d3a950] px-5 py-3.5 text-sm font-semibold text-[#172856] shadow-lg shadow-[#d3a950]/20 transition hover:-translate-y-0.5 hover:bg-[#e0bb6d]">สมัครใช้งานและทดลองทำข้อสอบ <ArrowRight size={17} /></Link>
              <a href="#membership" className="inline-flex items-center justify-center rounded-xl border border-[#172856] px-5 py-3.5 text-sm font-semibold text-[#172856] transition hover:bg-[#172856] hover:text-white">ดูรายละเอียดสมาชิก</a>
            </Reveal>
            <p className="mt-4 text-xs text-slate-400">ไม่ต้องสมัครผ่าน Google · ใช้เบอร์โทรศัพท์ของคุณเพื่อเข้าสู่ระบบ</p>
          </div>
          <Reveal delay={200}>
            <StudyIntelligencePreview />
          </Reveal>
        </div>
      </section>

      <section className="bg-[#1c2b5a] text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-white/15 px-5 sm:grid-cols-4 sm:px-8">
          <Reveal delay={0}><Metric value="8" label="รายวิชาหลัก" /></Reveal>
          <Reveal delay={80}><Metric value="270+" label="หัวข้อย่อย" /></Reveal>
          <Reveal delay={160}><Metric value="150" label="ข้อ / Mock Exam" /></Reveal>
          <Reveal delay={240}><Metric value="365" label="วันสมาชิก" /></Reveal>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl bg-[#1c2b5a] px-5 py-4 text-white shadow-lg shadow-[#1c2b5a]/10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#d3a950]"><CalendarDays size={19} /></span><p className="text-sm font-medium leading-6">เตรียมตัวล่วงหน้าอย่างมีระบบ<br /><span className="text-xs font-normal text-white/60">สร้างเป้าหมายรายสัปดาห์ แล้วเริ่มฝึกได้ทันที</span></p></div>
          <Link href="/register" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#e3bd69] hover:text-white">เริ่มวางแผน <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="bg-[#f7f9fc] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-app">
          <Reveal><SectionHeading eyebrow="START WITH THE PROBLEM" title="เจอปัญหาเหล่านี้อยู่ไหม?" text="การเตรียมสอบที่ดีไม่ใช่แค่อ่านให้มากขึ้น แต่ต้องรู้ว่าจะฝึกอะไรต่อ" /></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{problems.map(({ icon: Icon, title, text }, index) => <Reveal key={title} delay={index * 90} as="article" className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf0ff] text-[#245cff]"><Icon size={25} /></span><h3 className="mt-5 text-sm font-semibold leading-6 text-[#172856]">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{text}</p></Reveal>)}</div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-app gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal><p className="text-sm font-medium text-[#245cff]">HOW POLREADY HELPS</p><h2 className="mt-2 text-3xl font-semibold leading-tight text-[#172856] sm:text-4xl">เปลี่ยนการอ่านแบบเดิม<br />ให้เป็นการฝึกที่วัดผลได้</h2><p className="mt-5 max-w-md leading-7 text-slate-500">เห็นภาพรวมของตัวเอง แล้วค่อยเลือกแบบฝึกที่เหมาะสม ไม่จำเป็นต้องเดาทิศทางการอ่านเพียงลำพัง</p><div className="mt-7 space-y-4">{['เลือกวิชาและหัวข้อย่อยได้ตามลำดับที่ต้องการ', 'เก็บผลการฝึกและกลับมาทบทวนได้ทุกเมื่อ', 'ใช้ได้ทั้งมือถือ แท็บเล็ต และคอมพิวเตอร์'].map((item) => <p key={item} className="flex items-start gap-2.5 text-sm text-[#172856]"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" /> {item}</p>)}</div></Reveal>
          <Reveal delay={150}><LearningFlow /></Reveal>
        </div>
      </section>

      <section className="bg-[#f7f9fc] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-app">
          <Reveal><SectionHeading eyebrow="MORE WAYS TO PRACTICE" title="เครื่องมือฝึกครบชุด ไม่ใช่แค่ทำโจทย์" text="เสริมการจำและความเข้าใจด้วยเครื่องมือที่หลากหลาย เลือกฝึกได้ตามสไตล์ที่ถนัด" /></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{tools.map(({ icon: Icon, title, text }, index) => <Reveal key={title} delay={index * 90} as="article" className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf0ff] text-[#245cff]"><Icon size={25} /></span><h3 className="mt-5 text-sm font-semibold leading-6 text-[#172856]">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{text}</p></Reveal>)}</div>
        </div>
      </section>

      <section id="membership" className="bg-[#f7f9fc] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-app">
          <Reveal><SectionHeading eyebrow="MEMBERSHIP" title="เลือกแพ็กเกจที่ใช่สำหรับคุณ" text="สมัครเพื่อปลดล็อกพื้นที่ฝึกและติดตามความก้าวหน้าของคุณ" /></Reveal>
          {plans.length > 0 ? (
            <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan, index) => <Reveal key={plan.id} delay={index * 100}><PlanCard plan={plan} /></Reveal>)}
            </div>
          ) : (
            <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center shadow-sm"><p className="font-semibold text-[#172856]">กำลังอัปเดตรายละเอียดแพ็กเกจ</p><p className="mt-2 text-sm leading-6 text-slate-500">ยังไม่สามารถแสดงราคาได้ในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง</p></div>
          )}
        </div>
      </section>

      <section className="bg-[#1c2b5a] px-5 py-20 text-center text-white sm:px-8 sm:py-24"><Reveal><p className="text-sm font-medium text-[#e3bd69]">START TODAY</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">เริ่มต้นฝึกอย่างมีเป้าหมาย</h2><p className="mx-auto mt-4 max-w-lg leading-7 text-white/65">เก็บทุกครั้งที่ฝึกให้กลายเป็นความมั่นใจก่อนวันสอบ</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d3a950] px-5 py-3.5 text-sm font-semibold text-[#172856] transition hover:bg-[#e3bd69]">สมัครใช้งานด้วย OTP <ArrowRight size={17} /></Link><a href="#membership" className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">ดูแพ็กเกจสมาชิก</a></div><p className="mt-5 text-xs text-white/40">การใช้งานถือว่ายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</p></Reveal></section>

      <Footer />
    </main>
  );
}

function Header() {
  return <header className="sticky top-0 z-40 border-b-[3px] border-[#d3a950] bg-[#1c2b5a]/95 text-white shadow-[0_4px_18px_rgba(18,35,75,0.08)] backdrop-blur-xl"><div className="mx-auto flex h-[76px] max-w-app items-center justify-between gap-5 px-5 sm:px-8"><Link href="/" aria-label="POLREADY หน้าแรก" className="shrink-0"><BrandLogo tone="dark" /></Link><nav aria-label="เมนูหน้าแรก" className="hidden items-center gap-1 lg:flex"><a href="#how-it-works" className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white">วิธีใช้งาน</a><a href="#membership" className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white">แพ็กเกจสมาชิก</a><Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white">เข้าสู่ระบบ</Link></nav><Link href="/register" className="shrink-0 rounded-xl bg-[#d3a950] px-4 py-2.5 text-sm font-semibold text-[#172856] shadow-lg shadow-black/10 transition hover:-translate-y-px hover:bg-[#e3bd69]">ทดลองใช้ทำข้อสอบ</Link></div></header>;
}

function HeroPanel() {
  const subjects = [
    { name: 'กฎหมาย', value: 82, color: 'bg-[#2764ff]' },
    { name: 'ภาษาอังกฤษ', value: 76, color: 'bg-emerald-500' },
    { name: 'ภาษาไทย', value: 70, color: 'bg-amber-400' },
    { name: 'คอมพิวเตอร์', value: 88, color: 'bg-violet-500' },
  ];
  return <div className="relative mx-auto w-full max-w-xl"><div className="absolute -right-10 top-4 h-44 w-44 rounded-full bg-[#d3a950]/15 blur-3xl" /><div className="relative rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-[0_24px_60px_rgba(30,64,100,0.16)] sm:p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-[#172856]">ภาพรวมการฝึกของคุณ</p><p className="mt-1 text-xs text-slate-400">ตัวอย่างหน้า Dashboard</p></div><span className="text-xs font-medium text-[#245cff]">ดูรายละเอียด →</span></div><div className="mt-4 grid grid-cols-3 gap-2.5"><OverviewCard label="คะแนนรวม" value="82%" note="เพิ่มขึ้นจากสัปดาห์ก่อน" color="text-emerald-500" /><OverviewCard label="อันดับของคุณ" value="—" note="เริ่มฝึกเพื่อดูอันดับ" color="text-[#245cff]" /><OverviewCard label="ทำข้อสอบแล้ว" value="0" note="เริ่มต้นได้ทันที" color="text-[#172856]" /></div><div className="mt-4 grid gap-4 rounded-2xl bg-[#fbfcff] p-4 sm:grid-cols-[1fr_0.78fr]"><div><p className="text-xs font-medium text-slate-400">ความแม่นยำรายวิชา</p><div className="mt-3 space-y-2.5">{subjects.map((subject) => <div key={subject.name}><div className="mb-1 flex justify-between text-xs font-medium text-[#172856]"><span>{subject.name}</span><span>{subject.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${subject.color}`} style={{ width: `${subject.value}%` }} /></div></div>)}</div></div><div className="flex flex-col items-center justify-center border-t border-slate-200 pt-4 sm:border-l sm:border-t-0 sm:pt-0"><div className="flex h-28 w-28 items-center justify-center rounded-full bg-[conic-gradient(#ffbf18_0_42%,#ff705b_42%_72%,#e6eaf2_72%_100%)] p-3"><div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white"><span className="text-[11px] text-slate-400">หัวข้อที่ควร</span><span className="text-xl font-semibold text-[#172856]">ฝึกต่อ</span></div></div><p className="mt-3 text-xs text-slate-500">เลือกหัวข้อเพื่อเริ่มทบทวน</p></div></div></div></div>;
}

function OverviewCard({ label, value, note, color }) {
  return <div className="rounded-xl border border-slate-100 bg-[#fbfcff] p-3"><p className="text-[10px] text-slate-400">{label}</p><p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p><p className="mt-1 text-[9px] leading-3 text-slate-400">{note}</p></div>;
}

function PlanCard({ plan }) {
  const price = plan.price ? formatCurrency(plan.price) : 'ฟรี';
  const suffix = planPriceSuffix(plan);

  if (plan.isFeatured) {
    return (
      <article className="relative overflow-hidden rounded-3xl border border-[#d3a950] bg-[#1c2b5a] p-7 text-white shadow-xl shadow-[#1c2b5a]/20">
        <span className="absolute right-6 top-0 rounded-b-xl bg-[#d3a950] px-3 py-1.5 text-xs font-semibold text-[#172856]">แพ็กเกจแนะนำ</span>
        <p className="text-sm font-semibold text-[#e3bd69]">{plan.name}</p>
        <p className="mt-3 text-4xl font-semibold">{price}{suffix && <span className="ml-1 text-base font-normal text-white/55">{suffix}</span>}</p>
        <p className="mt-2 text-sm leading-6 text-white/65">{plan.description}</p>
        <div className="mt-6 grid gap-2 text-sm text-white/80">
          {plan.features.map((item) => <p key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className="shrink-0 text-[#e3bd69]" /> {item}</p>)}
        </div>
        <Link href="/register" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d3a950] py-3 text-sm font-semibold text-[#172856] transition hover:bg-[#e3bd69]">เริ่มสมัครสมาชิก <ArrowRight size={17} /></Link>
      </article>
    );
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-sm font-semibold text-[#172856]">{plan.name}</p>
      <p className="mt-3 text-3xl font-semibold text-[#172856]">{price}{suffix && <span className="ml-1 text-base font-normal text-slate-400">{suffix}</span>}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{plan.description}</p>
      {plan.features?.length > 0 && (
        <div className="mt-6 grid gap-2 text-sm text-[#172856]">
          {plan.features.map((item) => <p key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className="shrink-0 text-emerald-500" /> {item}</p>)}
        </div>
      )}
      <Link href="/register" className="mt-7 inline-flex w-full items-center justify-center rounded-xl border border-[#172856] py-3 text-sm font-semibold text-[#172856] transition hover:bg-[#172856] hover:text-white">{plan.price ? 'เริ่มสมัครสมาชิก' : 'สมัครและทดลองทำข้อสอบ'}</Link>
    </article>
  );
}

function Metric({ value, label }) {
  return <div className="px-4 py-7 text-center sm:py-8"><p className="text-3xl font-semibold text-[#d3a950] sm:text-4xl">{value}</p><p className="mt-1 text-xs font-medium text-white/85 sm:text-sm">{label}</p></div>;
}

function SectionHeading({ eyebrow, title, text }) {
  return <div className="text-center"><p className="text-xs font-semibold tracking-[0.14em] text-[#245cff]">{eyebrow}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#172856] sm:text-4xl">{title}</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">{text}</p></div>;
}

function LearningFlow() {
  return <div className="rounded-3xl border border-slate-100 bg-[#fbfcff] p-5 shadow-sm sm:p-7"><div className="rounded-2xl bg-[#1c2b5a] p-5 text-white"><div className="flex items-center justify-between"><div><p className="text-xs text-white/55">เริ่มจากหัวข้อที่ต้องการ</p><p className="mt-1 text-lg font-semibold">แบบฝึกหัดรายวิชา</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#e3bd69]"><BookOpenCheck size={20} /></span></div><div className="mt-5 grid grid-cols-3 gap-2"><MiniTopic title="กฎหมาย" progress="8 ชุด" /><MiniTopic title="ภาษาไทย" progress="5 ชุด" /><MiniTopic title="คอมพิวเตอร์" progress="6 ชุด" /></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-100 bg-white p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#245cff]"><Timer size={18} /></span><p className="mt-3 text-sm font-semibold text-[#172856]">Mock Exam</p><p className="mt-1 text-xs leading-5 text-slate-400">ฝึกจับเวลาในรูปแบบข้อสอบเสมือนจริง</p></div><div className="rounded-2xl border border-slate-100 bg-white p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500"><Medal size={18} /></span><p className="mt-3 text-sm font-semibold text-[#172856]">สถิติและ Badge</p><p className="mt-1 text-xs leading-5 text-slate-400">เห็นผลลัพธ์และรักษาแรงจูงใจทุกวัน</p></div></div></div>;
}

function MiniTopic({ title, progress }) {
  return <div className="rounded-xl bg-white/10 p-2.5"><p className="truncate text-[11px] font-medium">{title}</p><p className="mt-1 text-[10px] text-[#e3bd69]">{progress}</p></div>;
}

function Footer() {
  return <footer className="bg-[#111d43] px-5 py-12 text-white sm:px-8"><div className="mx-auto grid max-w-app gap-8 sm:grid-cols-[1.3fr_0.7fr_0.7fr]"><div><div className="flex items-center gap-2"><ShieldCheck size={20} className="text-[#e3bd69]" /><span className="font-semibold tracking-[0.08em]">POLREADY</span></div><p className="mt-4 max-w-xs text-sm leading-6 text-white/55">พื้นที่ฝึกทำข้อสอบและติดตามความก้าวหน้า สำหรับผู้ที่กำลังเตรียมสอบตำรวจ</p></div><div><p className="text-sm font-semibold text-white">เมนู</p><div className="mt-3 space-y-2 text-sm text-white/55"><a href="#membership" className="block hover:text-white">สมาชิก</a><Link href="/login" className="block hover:text-white">เข้าสู่ระบบ</Link><Link href="/register" className="block hover:text-white">สมัครและเริ่มฝึก</Link></div></div><div><p className="text-sm font-semibold text-white">ช่วยเหลือ</p><div className="mt-3 space-y-2 text-sm text-white/55"><span className="block">คำถามที่พบบ่อย</span><span className="block">เงื่อนไขการใช้งาน</span><span className="block">นโยบายความเป็นส่วนตัว</span></div></div></div><div className="mx-auto mt-10 flex max-w-app flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 POLREADY. All rights reserved.</p><p>เข้าสู่ระบบด้วย OTP ผ่านเบอร์โทรศัพท์</p></div></footer>;
}
