'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileImage,
  Layers,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/membership';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

// เปิดให้ต่ออายุล่วงหน้าเมื่อเหลือไม่เกินกี่วัน
const RENEW_WINDOW_DAYS = 30;

function hasActiveMembership(membership) {
  if (membership?.status !== 'active') return false;
  return !membership.expires_at || new Date(membership.expires_at) > new Date();
}

function daysUntil(value) {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

// ลำดับชั้นของแพ็กเกจใช้ราคาเป็นตัวตัดสิน (ฟรี = 0 = ต่ำสุด) ถ้าราคาเท่ากันค่อยดู sort_order
function planRank(plan) {
  return (Number(plan?.price) || 0) * 1000 + (Number(plan?.sortOrder) || 0);
}

/**
 * ตัดสินสถานะปุ่มของการ์ดแพ็กเกจแต่ละใบ
 * แยกออกมาเป็นฟังก์ชันบริสุทธิ์เพื่อให้ตรรกะสถานะทั้งหมดอยู่ที่เดียว ตรวจสอบและแก้ไขได้ง่าย
 */
function planCardState(membership, plan, allPlans = []) {
  const paid = plan.paymentEnabled && plan.grantType === 'membership';

  // ชุดข้อสอบเฉพาะกิจไม่ได้อยู่ในลำดับชั้นสมาชิก แอดมินเป็นคนเปิดสิทธิ์ให้เอง
  if (plan.grantType === 'exam_set') return { kind: 'exam_set', label: 'ผู้ดูแลจะเปิดสิทธิ์เฉพาะชุดให้', disabled: true };

  const isActive = hasActiveMembership(membership);
  const currentPlan = isActive ? allPlans.find((item) => item.id === membership.plan_id) : null;

  if (isActive && membership.plan_id === plan.id) {
    const daysLeft = daysUntil(membership.expires_at);
    // ใกล้หมดอายุต้องกดต่ออายุได้ ไม่ใช่ปิดปุ่มทิ้งไว้จนสมาชิกจ่ายเงินต่อไม่ได้
    if (paid && daysLeft !== null && daysLeft <= RENEW_WINDOW_DAYS) {
      return { kind: 'renew', label: daysLeft > 0 ? `ต่ออายุ (เหลือ ${daysLeft} วัน)` : 'ต่ออายุตอนนี้', disabled: false, highlight: true };
    }
    return { kind: 'current', label: 'แพ็กเกจปัจจุบัน', disabled: true };
  }

  if (!isActive) {
    // ยังไม่มีสมาชิก = อยู่บนแพ็กเกจฟรีจริง ๆ จึงต้องขึ้น "แพ็กเกจปัจจุบัน" ที่การ์ดฟรี
    if (plan.billingType === 'free') return { kind: 'current', label: 'แพ็กเกจปัจจุบัน', disabled: true };
    if (paid) return { kind: 'buy', label: `เลือก ${plan.name}`, disabled: false };
    return { kind: 'unavailable', label: 'ยังไม่เปิดให้สมัคร', disabled: true };
  }

  if (!paid) return { kind: 'unavailable', label: 'ไม่สามารถเปลี่ยนไปแพ็กเกจนี้', disabled: true };

  const diff = planRank(plan) - planRank(currentPlan || {});
  if (diff > 0) return { kind: 'upgrade', label: `อัปเกรดเป็น ${plan.name}`, disabled: false, highlight: true };
  // กันซื้อแพ็กเกจที่ให้สิทธิ์ต่ำกว่าของที่ใช้อยู่ เพราะจ่ายแล้วได้สิทธิ์ลดลง
  if (diff < 0) return { kind: 'downgrade_blocked', label: 'สิทธิ์ต่ำกว่าแพ็กเกจปัจจุบัน', disabled: true };
  return { kind: 'buy', label: `เปลี่ยนเป็น ${plan.name}`, disabled: false };
}

export default function AccountPage() {
  const [membership, setMembership] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentAccount, setPaymentAccount] = useState(null);
  const [payerName, setPayerName] = useState('');
  const [paidAt, setPaidAt] = useState(todayValue);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadMembership = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/membership', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) {
        setIsLoggedOut(response.status === 401);
        throw new Error(result.error || 'ไม่สามารถโหลดข้อมูลสมาชิกได้');
      }
      const availablePlans = result.plans || [];
      setMembership(result.membership);
      setPlans(availablePlans);
      setSelectedPlanId((current) => current && availablePlans.some((plan) => plan.id === current)
        ? current
        : availablePlans.find((plan) => plan.paymentEnabled && plan.grantType === 'membership')?.id || '');
      setPaymentAccount(result.paymentAccount);
      setIsLoggedOut(false);
    } catch (loadError) {
      setError(loadError.message || 'ไม่สามารถโหลดข้อมูลสมาชิกได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMembership(); }, []);
  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    setError('');
    if (!nextFile) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)) {
      setError('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG หรือ WEBP');
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError('ไฟล์สลิปต้องมีขนาดไม่เกิน 2 MB');
      return;
    }
    setFile(nextFile);
  };

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
  const accountReady = Boolean(paymentAccount?.bankName && paymentAccount?.accountName && paymentAccount?.accountNumber);
  const canSubmit = !loading && !isLoggedOut && accountReady && Boolean(selectedPlan?.paymentEnabled) && selectedPlan?.grantType === 'membership' && !['pending', 'active'].includes(membership?.status);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitted(false);
    if (!selectedPlan) return setError('กรุณาเลือกแพ็กเกจที่ต้องการชำระเงิน');
    if (!payerName.trim()) return setError('กรุณากรอกชื่อผู้โอน');
    if (!file) return setError('กรุณาแนบรูปสลิปโอนเงิน');
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('planId', selectedPlan.id);
      data.append('payerName', payerName.trim());
      data.append('paidAt', paidAt);
      data.append('slip', file);
      const response = await fetch('/api/payments', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถส่งสลิปได้');
      setPayerName('');
      setPaidAt(todayValue());
      setFile(null);
      setSubmitted(true);
      await loadMembership();
    } catch (submitError) {
      setError(submitError.message || 'ไม่สามารถส่งสลิปได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <p className="mb-1 text-sm font-medium text-accent-cyan">ACCOUNT & MEMBERSHIP</p>
        <h1 className="text-2xl font-semibold text-navy sm:text-3xl">สมาชิกและแพ็กเกจ</h1>
        <p className="mt-1 text-graydark/60">เริ่มทดลองใช้แบบฟรีก่อน แล้วเลือกสิทธิ์ที่เหมาะกับการเตรียมสอบของคุณ</p>
        <Link href="/settings" className="mt-4 inline-flex items-center gap-2 btn-outline">แก้ไขโปรไฟล์ <span aria-hidden="true">→</span></Link>
      </header>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {isLoggedOut ? <LoginRequired /> : <MembershipStatus membership={membership} />}
      {!isLoggedOut && <MembershipPlans membership={membership} plans={plans} selectedPlanId={selectedPlanId} onSelectPlan={setSelectedPlanId} />}

      {!isLoggedOut && <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-2xl bg-navy p-6 text-white sm:p-7">
          <p className="text-xs font-medium tracking-wider text-accent-cyan">PACKAGE PAYMENT</p>
          <h2 className="mt-2 text-xl font-semibold">{selectedPlan ? `สมัคร ${selectedPlan.name} เพียง 3 ขั้นตอน` : 'เลือกแพ็กเกจที่พร้อมชำระเงิน'}</h2>
          <p className="mt-2 text-sm text-white/65">โอนเงิน อัปโหลดสลิป แล้วรอผู้ดูแลตรวจสอบเพื่อเปิดสิทธิ์ตามแพ็กเกจที่เลือก</p>
          <div className="mt-6 space-y-2 border-t border-white/15 pt-5 text-sm text-white/75">
            <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-accent-green" />{selectedPlan?.durationDays ? `ใช้งานได้ ${selectedPlan.durationDays} วันหลังอนุมัติ` : 'ระยะเวลาสิทธิ์กำหนดโดยผู้ดูแล'}</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-accent-green" />สลิปถูกเก็บแบบ private และตรวจสอบโดยผู้ดูแล</p>
          </div>
        </article>
        <article className="rounded-2xl border border-graylight/25 p-6 sm:p-7">
          <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan"><ShieldCheck size={21} /></div><div><h2 className="font-semibold text-navy">{selectedPlan ? `โอนเงินสำหรับ ${selectedPlan.name}` : 'เลือกแพ็กเกจก่อนชำระเงิน'}</h2><p className="text-xs text-graydark/50">คำขอจะรอตรวจสอบก่อนเปิดสิทธิ์</p></div></div>
          {accountReady ? <div className="flex flex-col gap-4 sm:flex-row">{paymentAccount.qrCodeUrl && <img src={paymentAccount.qrCodeUrl} alt="QR code รับโอน" className="h-36 w-36 shrink-0 self-center rounded-xl border border-graylight/25 bg-white object-contain sm:self-start" />}<dl className="flex-1 space-y-2 rounded-xl bg-graylight/10 p-4 text-sm"><TransferLine label="ธนาคาร" value={paymentAccount.bankName} /><TransferLine label="ชื่อบัญชี" value={paymentAccount.accountName} /><TransferLine label="เลขบัญชี" value={paymentAccount.accountNumber} /></dl></div> : <p className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">ผู้ดูแลยังไม่ได้ตั้งค่าบัญชีรับโอน จึงยังส่งสลิปไม่ได้</p>}
        </article>
      </section>}

      {submitted && <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={18} />ส่งสลิปเรียบร้อยแล้ว ทีมงานจะตรวจสอบให้เร็วที่สุด</div>}
      {canSubmit && <PaymentForm payerName={payerName} paidAt={paidAt} file={file} preview={preview} plan={selectedPlan} submitting={submitting} onPayerName={setPayerName} onPaidAt={setPaidAt} onFileChange={onFileChange} onRemoveFile={() => setFile(null)} onSubmit={onSubmit} />}
    </div>
  );
}

function MembershipPlans({ membership, plans, selectedPlanId, onSelectPlan }) {
  const scrollToPayment = (plan) => {
    if (plan.paymentEnabled && plan.grantType === 'membership') {
      onSelectPlan(plan.id);
      window.setTimeout(() => document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
  };
  return <section className="mt-6" aria-labelledby="membership-plans-title"><div className="mb-5"><p className="text-sm font-medium text-accent-cyan">CHOOSE YOUR ACCESS</p><h2 id="membership-plans-title" className="mt-1 text-xl font-semibold text-navy sm:text-2xl">เริ่มฟรี แล้วค่อยเลือกสิทธิ์ที่ใช่</h2><p className="mt-1 text-sm text-graydark/60">แพ็กเกจและขอบเขตสิทธิ์จัดการโดยผู้ดูแลจากหลังบ้าน จึงอัปเดตราคาและสิทธิประโยชน์ได้โดยไม่ต้องแก้หน้าเว็บ</p></div>
    {plans.length === 0 ? <div className="h-72 skeleton" /> : <div className="grid gap-5 lg:grid-cols-3">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} state={planCardState(membership, plan, plans)} isSelected={selectedPlanId === plan.id} onChoose={() => scrollToPayment(plan)} />)}</div>}
  </section>;
}

function PlanCard({ plan, state, isSelected, onChoose }) {
  const premium = plan.isFeatured;
  return <article className={`relative flex min-h-[25rem] flex-col rounded-2xl border p-6 transition ${premium ? 'border-2 border-accent-cyan bg-[radial-gradient(circle_at_100%_0%,rgba(79,134,247,0.28),transparent_42%),linear-gradient(145deg,#2B2D42,#1f2239)] text-white shadow-[0_18px_42px_rgba(30,64,100,0.24)]' : isSelected ? 'border-accent-cyan bg-cyan-50/30' : 'border-graylight/25 bg-white'}`}>
    {plan.isFeatured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-cyan px-3 py-1 text-xs font-semibold text-white">แนะนำ</span>}
    <div className={`grid h-11 w-11 place-items-center rounded-xl ${premium ? 'bg-white/10 text-accent-cyan' : 'bg-accent-cyan/10 text-accent-cyan'}`}>{plan.grantType === 'exam_set' ? <FileImage size={21} /> : plan.billingType === 'free' ? <Layers size={21} /> : <ShieldCheck size={21} />}</div>
    <h3 className={`mt-5 text-xl font-semibold ${premium ? 'text-white' : 'text-navy'}`}>{plan.name}</h3><p className={`mt-1 text-3xl font-bold ${premium ? 'text-white' : 'text-navy'}`}>{formatCurrency(plan.price)}{plan.durationDays && <span className={`text-sm font-medium ${premium ? 'text-white/60' : 'text-graydark/55'}`}> / {plan.durationDays} วัน</span>}</p><p className={`mt-2 min-h-10 text-sm ${premium ? 'text-white/65' : 'text-graydark/55'}`}>{plan.description || 'สิทธิ์ตามที่ผู้ดูแลกำหนด'}</p>
    <ul className={`mt-6 flex-1 space-y-3 text-sm ${premium ? 'text-white/80' : 'text-graydark/70'}`}>{(plan.features || []).map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-green" />{feature}</li>)}</ul>
    {state.kind === 'exam_set'
      ? <p className={`mt-7 rounded-xl px-4 py-3 text-center text-sm font-semibold ${premium ? 'bg-white/10 text-white/75' : 'bg-graylight/10 text-graydark/60'}`}>{state.label}</p>
      : <button
          type="button"
          disabled={state.disabled}
          onClick={state.disabled ? undefined : onChoose}
          className={`mt-7 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
            state.disabled
              ? premium ? 'cursor-not-allowed bg-white/10 text-white/60' : 'cursor-not-allowed bg-graylight/15 text-graydark/45'
              : state.highlight
                ? 'bg-accent-gold text-navy hover:brightness-105'
                : premium ? 'bg-accent-gold text-navy hover:brightness-105' : 'bg-navy text-white hover:bg-navy/90'
          }`}
        >{state.label}</button>}
    {state.kind === 'renew' && <p className={`mt-2 text-center text-xs font-medium ${premium ? 'text-white/70' : 'text-amber-700'}`}>แพ็กเกจกำลังจะหมดอายุ ต่ออายุได้เลย</p>}
    {state.kind === 'downgrade_blocked' && <p className={`mt-2 text-center text-xs ${premium ? 'text-white/60' : 'text-graydark/50'}`}>ใช้แพ็กเกจที่สูงกว่านี้อยู่แล้ว</p>}
  </article>;
}

function PaymentForm({ payerName, paidAt, file, preview, plan, submitting, onPayerName, onPaidAt, onFileChange, onRemoveFile, onSubmit }) {
  return <form id="payment-form" onSubmit={onSubmit} className="mt-6 rounded-2xl border border-graylight/25 p-6 sm:p-7"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold text-navy">อัปโหลดสลิปโอนเงิน</h2><p className="mt-1 text-sm text-graydark/55">รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 2 MB</p></div><span className="text-sm font-semibold text-navy">ยอดโอน {formatCurrency(plan.price)}</span></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-graydark">ชื่อผู้โอน<input value={payerName} onChange={(event) => onPayerName(event.target.value)} placeholder="ชื่อ-นามสกุลผู้โอน" className="mt-2 w-full rounded-xl border border-graylight/35 px-3.5 py-3 outline-none focus:border-accent-cyan" /></label><label className="text-sm font-medium text-graydark">วันที่โอน<input type="date" value={paidAt} onChange={(event) => onPaidAt(event.target.value)} className="mt-2 w-full rounded-xl border border-graylight/35 px-3.5 py-3 outline-none focus:border-accent-cyan" /></label></div><div className="mt-5">{preview ? <div className="relative flex items-center gap-4 rounded-xl border border-graylight/25 p-3"><img src={preview} alt="ตัวอย่างสลิป" className="h-20 w-20 rounded-lg object-cover" /><div className="min-w-0"><p className="truncate font-medium text-navy">{file?.name}</p><p className="mt-1 text-xs text-graydark/55">{Math.ceil((file?.size || 0) / 1024)} KB</p></div><button type="button" onClick={onRemoveFile} className="absolute right-2 top-2 rounded-full p-1.5 text-graydark/55 hover:bg-graylight/20" aria-label="ลบไฟล์"><X size={16} /></button></div> : <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-graylight/40 text-center hover:border-accent-cyan/60 hover:bg-accent-cyan/[0.02]"><UploadCloud size={25} className="text-accent-cyan" /><span className="mt-2 text-sm font-medium text-navy">เลือกรูปสลิป</span><span className="mt-1 text-xs text-graydark/50">JPG, PNG หรือ WEBP</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFileChange} /></label>}</div><button type="submit" disabled={submitting} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-accent-cyan px-5 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">{submitting ? <><LoaderCircle size={17} className="animate-spin" />กำลังส่งสลิป</> : <><FileImage size={17} />ส่งสลิปให้ตรวจสอบ</>}</button></form>;
}

function TransferLine({ label, value }) {
  return <div className="flex justify-between gap-4"><dt className="text-graydark/55">{label}</dt><dd className="text-right font-medium text-navy">{value}</dd></div>;
}

function LoginRequired() {
  return <section className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6"><LogIn size={24} className="mt-0.5 shrink-0 text-blue-700" /><div><p className="font-semibold text-blue-900">เข้าสู่ระบบก่อนสมัครสมาชิก</p><p className="mt-1 text-sm text-blue-800/80">ใช้ OTP เพื่อเชื่อมคำขอและสลิปกับบัญชีของคุณ</p><Link href="/login" className="mt-3 inline-flex rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-medium text-white">เข้าสู่ระบบ</Link></div></section>;
}

function MembershipStatus({ membership }) {
  if (!membership) return <div className="h-28 skeleton" />;
  const states = {
    inactive: { title: 'สมาชิกฟรี', text: 'คุณเริ่มทดลองใช้แบบฝึกหัดฟรีได้แล้ว และอัปเกรดสิทธิ์ได้ทุกเมื่อ', icon: CheckCircle2, color: 'text-graydark/60', surface: 'border-graylight/25 bg-graylight/10' },
    pending: { title: 'กำลังตรวจสอบสลิป', text: `ส่งคำขอเมื่อ ${formatDate(membership.submitted_at, true)} ทีมงานจะแจ้งผลหลังตรวจสอบ`, icon: Clock3, color: 'text-amber-700', surface: 'border-amber-200 bg-amber-50' },
    active: { title: membership.plan_name || 'สมาชิกกำลังใช้งาน', text: membership.expires_at ? `สิทธิ์สมาชิกหมดอายุ ${formatDate(membership.expires_at)}` : 'สิทธิ์สมาชิกกำลังใช้งานอยู่', icon: CheckCircle2, color: 'text-emerald-700', surface: 'border-emerald-200 bg-emerald-50' },
    expired: { title: 'สิทธิ์สมาชิกหมดอายุแล้ว', text: 'สามารถต่ออายุได้โดยโอนเงินและส่งสลิปใหม่', icon: CircleAlert, color: 'text-red-700', surface: 'border-red-200 bg-red-50' },
    rejected: { title: 'กรุณาส่งสลิปใหม่', text: membership.rejection_reason || 'สลิปไม่ผ่านการตรวจสอบ โปรดตรวจข้อมูลการโอนแล้วส่งใหม่', icon: CircleAlert, color: 'text-red-700', surface: 'border-red-200 bg-red-50' },
  };
  const state = states[membership.status] || states.inactive;
  const Icon = state.icon;
  return <section className={`flex items-start gap-4 rounded-2xl border p-5 sm:p-6 ${state.surface}`}><Icon size={25} className={`mt-0.5 shrink-0 ${state.color}`} /><div><p className={`font-semibold ${state.color}`}>{state.title}</p><p className="mt-1 text-sm leading-relaxed text-graydark/65">{state.text}</p>{membership.status === 'active' && <p className="mt-2 inline-flex items-center gap-1 text-xs text-graydark/50"><CalendarDays size={13} />เริ่มใช้งาน {formatDate(membership.activated_at)}</p>}</div></section>;
}
