'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileImage,
  LoaderCircle,
  Layers,
  LogIn,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import { vipMembershipPlan, formatCurrency, formatDate } from '@/lib/membership';
import ProfileEditor from '@/components/ProfileEditor';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function AccountPage() {
  const [membership, setMembership] = useState(null);
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
      setMembership(result.membership);
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

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitted(false);
    if (!payerName.trim()) return setError('กรุณากรอกชื่อผู้โอน');
    if (!file) return setError('กรุณาแนบรูปสลิปโอนเงิน');

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('planId', vipMembershipPlan.id);
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

  const accountReady = Boolean(paymentAccount?.bankName && paymentAccount?.accountName && paymentAccount?.accountNumber);
  const canSubmit = !loading && !isLoggedOut && accountReady && !['pending', 'active'].includes(membership?.status);

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <p className="text-sm text-accent-cyan font-medium mb-1">ACCOUNT & MEMBERSHIP</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-navy">สมาชิกและแพ็กเกจ</h1>
        <p className="text-graydark/60 mt-1">เริ่มทดลองใช้แบบฟรีก่อน แล้วเลือกแพ็กเกจที่เหมาะกับการเตรียมสอบของคุณ</p>
      </header>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {isLoggedOut ? <LoginRequired /> : <MembershipStatus membership={membership} />}

      {!isLoggedOut && <ProfileEditor />}
      {!isLoggedOut && <MembershipPlans membership={membership} />}

      <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5 mt-6">
        <article className="rounded-2xl bg-navy text-white p-6 sm:p-7">
          <p className="text-accent-cyan text-xs font-medium tracking-wider">VIP UPGRADE</p>
          <h2 className="text-xl font-semibold mt-2">อัปเกรดเพียง 3 ขั้นตอน</h2>
          <p className="text-white/65 text-sm mt-2">โอนเงิน อัปโหลดสลิป แล้วรอผู้ดูแลตรวจสอบเพื่อเปิดสิทธิ์ VIP</p>
          <div className="mt-6 pt-5 border-t border-white/15 space-y-2 text-sm text-white/75">
            <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-accent-green" /> ใช้งานได้ {vipMembershipPlan.durationDays} วันหลังอนุมัติ</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-accent-green" /> สลิปถูกเก็บแบบ private และตรวจสอบโดยผู้ดูแล</p>
          </div>
        </article>

        <article className="border border-graylight/25 rounded-2xl p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 text-accent-cyan flex items-center justify-center"><ShieldCheck size={21} /></div>
            <div><h2 className="font-semibold text-navy">โอนเงินสำหรับ VIP 1 ปี</h2><p className="text-xs text-graydark/50">คำขอจะรอตรวจสอบก่อนเปิดสิทธิ์</p></div>
          </div>
          {accountReady ? (
            <dl className="rounded-xl bg-graylight/10 p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-graydark/55">ธนาคาร</dt><dd className="font-medium text-navy text-right">{paymentAccount.bankName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-graydark/55">ชื่อบัญชี</dt><dd className="font-medium text-navy text-right">{paymentAccount.accountName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-graydark/55">เลขบัญชี</dt><dd className="font-medium text-navy text-right">{paymentAccount.accountNumber}</dd></div>
            </dl>
          ) : (
            <p className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">ผู้ดูแลยังไม่ได้ตั้งค่าบัญชีรับโอน จึงยังส่งสลิปไม่ได้</p>
          )}
        </article>
      </section>

      {submitted && <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={18} /> ส่งสลิปเรียบร้อยแล้ว ทีมงานจะตรวจสอบให้เร็วที่สุด</div>}

      {canSubmit && (
        <form id="vip-payment" onSubmit={onSubmit} className="mt-6 border border-graylight/25 rounded-2xl p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div><h2 className="font-semibold text-navy text-lg">อัปโหลดสลิปโอนเงิน</h2><p className="text-sm text-graydark/55 mt-1">รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 2 MB</p></div>
            <span className="text-sm font-semibold text-navy">ยอดโอน {formatCurrency(vipMembershipPlan.amount)}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-graydark">ชื่อผู้โอน<input value={payerName} onChange={(event) => setPayerName(event.target.value)} placeholder="ชื่อ-นามสกุลผู้โอน" className="mt-2 w-full rounded-xl border border-graylight/35 px-3.5 py-3 outline-none focus:border-accent-cyan" /></label>
            <label className="text-sm font-medium text-graydark">วันที่โอน<input type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} className="mt-2 w-full rounded-xl border border-graylight/35 px-3.5 py-3 outline-none focus:border-accent-cyan" /></label>
          </div>
          <div className="mt-5">
            {preview ? (
              <div className="relative border border-graylight/25 rounded-xl p-3 flex items-center gap-4">
                <img src={preview} alt="ตัวอย่างสลิป" className="w-20 h-20 rounded-lg object-cover" />
                <div className="min-w-0"><p className="font-medium text-navy truncate">{file?.name}</p><p className="text-xs text-graydark/55 mt-1">{Math.ceil((file?.size || 0) / 1024)} KB</p></div>
                <button type="button" onClick={() => setFile(null)} className="absolute top-2 right-2 rounded-full p-1.5 text-graydark/55 hover:bg-graylight/20" aria-label="ลบไฟล์"><X size={16} /></button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-graylight/40 rounded-xl min-h-36 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent-cyan/60 hover:bg-accent-cyan/[0.02]">
                <UploadCloud size={25} className="text-accent-cyan" /><span className="font-medium text-navy text-sm mt-2">เลือกรูปสลิป</span><span className="text-xs text-graydark/50 mt-1">JPG, PNG หรือ WEBP</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFileChange} />
              </label>
            )}
          </div>
          <button type="submit" disabled={submitting} className="mt-6 inline-flex items-center justify-center gap-2 bg-accent-cyan text-white rounded-xl px-5 py-3 text-sm font-medium hover:opacity-90 disabled:opacity-60">{submitting ? <><LoaderCircle size={17} className="animate-spin" /> กำลังส่งสลิป</> : <><FileImage size={17} /> ส่งสลิปให้ตรวจสอบ</>}</button>
        </form>
      )}
    </div>
  );
}

function LoginRequired() {
  return <section className="border border-blue-100 bg-blue-50 rounded-2xl p-5 sm:p-6 flex items-start gap-4"><LogIn size={24} className="text-blue-700 shrink-0 mt-0.5" /><div><p className="font-semibold text-blue-900">เข้าสู่ระบบก่อนสมัครสมาชิก</p><p className="text-sm text-blue-800/80 mt-1">ใช้ OTP เพื่อเชื่อมคำขอและสลิปกับบัญชีของคุณ</p><Link href="/login" className="inline-flex mt-3 rounded-lg bg-blue-700 text-white px-3.5 py-2 text-sm font-medium">เข้าสู่ระบบ</Link></div></section>;
}

function MembershipPlans({ membership }) {
  const isVip = membership?.status === 'active' && ['vip-1y', 'annual-2569'].includes(membership.plan_id);
  const scrollToPayment = () => document.getElementById('vip-payment')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section className="mt-6" aria-labelledby="membership-plans-title">
      <div className="mb-5">
        <p className="text-sm font-medium text-accent-cyan">CHOOSE YOUR ACCESS</p>
        <h2 id="membership-plans-title" className="mt-1 text-xl sm:text-2xl font-semibold text-navy">เริ่มฟรี แล้วค่อยเลือกสิทธิ์ที่ใช่</h2>
        <p className="mt-1 text-sm text-graydark/60">บัญชีที่ยืนยัน OTP แล้วเป็นสมาชิกฟรีทันที โดย role ผู้ใช้และผู้ดูแลยังแยกจากสิทธิ์แพ็กเกจ</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <article className="app-card app-card-hover p-6 flex flex-col">
          <div className="w-11 h-11 rounded-xl bg-graylight/15 text-graydark/70 grid place-items-center"><Layers size={21} /></div>
          <h3 className="mt-5 text-xl font-semibold text-navy">ฟรี</h3>
          <p className="mt-1 text-3xl font-bold text-graydark/65">0 ฿</p>
          <p className="mt-1 text-sm text-graydark/55">ทดลองใช้ เริ่มต้นได้ทันที</p>
          <ul className="mt-6 space-y-3 text-sm text-graydark/70 flex-1">
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-green" />แบบฝึกหัดฟรี 1 หัวข้อในทุกวิชา</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-green" />Mock Exam ชุดทดลองเมื่อคลังข้อสอบพร้อม</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-green" />Random Quiz 1 ครั้งต่อวัน</li>
          </ul>
          <button type="button" disabled className="mt-7 w-full rounded-xl bg-graylight/15 px-4 py-3 text-sm font-semibold text-graydark/45">แพ็กเกจปัจจุบัน</button>
        </article>

        <article className="app-card app-card-hover p-6 flex flex-col">
          <div className="w-11 h-11 rounded-xl bg-accent-cyan/10 text-accent-cyan grid place-items-center"><FileImage size={21} /></div>
          <h3 className="mt-5 text-xl font-semibold text-navy">Mock</h3>
          <p className="mt-1 text-3xl font-bold text-navy">59 ฿<span className="text-sm font-medium text-graydark/55">/ชุด</span></p>
          <p className="mt-1 text-sm text-amber-700">หรือ 5 ชุด 129 ฿</p>
          <ul className="mt-6 space-y-3 text-sm text-graydark/70 flex-1">
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-green" />ปลดล็อกเฉพาะชุด Mock ที่ซื้อ</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-green" />ใช้งาน Flashcards และฝึกภาษาอังกฤษ</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-green" />ดูแดชบอร์ดและปฏิทินอ่านหนังสือ</li>
          </ul>
          <button type="button" disabled className="mt-7 w-full rounded-xl border border-graylight/35 px-4 py-3 text-sm font-semibold text-graydark/45" title="รอคลัง Mock Exam สำหรับจำหน่าย">รอเปิดคลัง Mock Exam</button>
        </article>

        <article className="relative rounded-2xl border-2 border-accent-cyan bg-[radial-gradient(circle_at_100%_0%,rgba(0,180,216,0.28),transparent_42%),linear-gradient(145deg,#2B2D42,#1f2239)] p-6 flex flex-col shadow-[0_18px_42px_rgba(43,45,66,0.24)] transition hover:-translate-y-1">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-cyan px-3 py-1 text-xs font-semibold text-white">แนะนำ</span>
          <div className="w-11 h-11 rounded-xl bg-white/10 text-accent-cyan grid place-items-center"><ShieldCheck size={21} /></div>
          <h3 className="mt-5 text-xl font-semibold text-white">VIP 1 ปี</h3>
          <p className="mt-1 text-3xl font-bold text-white">690 ฿<span className="text-sm font-medium text-white/60"> / ปี</span></p>
          <p className="mt-1 text-sm text-white/65">ครบทุกฟีเจอร์นาน 1 ปีเต็ม</p>
          <ul className="mt-6 space-y-3 text-sm text-white/80 flex-1">
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-green" />คลังข้อสอบครบทุกวิชา</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-green" />เฉลยละเอียด วิเคราะห์จุดอ่อน และ AI</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-green" />สิทธิ์ Mock Exam ทุกชุดที่เปิดใช้งาน</li>
          </ul>
          <button type="button" onClick={scrollToPayment} disabled={isVip} className="mt-7 w-full rounded-xl bg-accent-gold px-4 py-3 text-sm font-semibold text-navy hover:brightness-105 disabled:cursor-default disabled:opacity-60">{isVip ? 'กำลังใช้งาน VIP' : 'สมัคร VIP 1 ปี'}</button>
        </article>
      </div>
    </section>
  );
}

function MembershipStatus({ membership }) {
  if (!membership) return <div className="h-28 rounded-2xl bg-graylight/10 animate-pulse" />;
  const states = {
    inactive: { title: 'สมาชิกฟรี', text: 'คุณเริ่มทดลองใช้แบบฝึกหัดฟรีได้แล้ว และสามารถอัปเกรดเป็น VIP ได้ทุกเมื่อ', icon: CheckCircle2, color: 'text-graydark/60', surface: 'bg-graylight/10 border-graylight/25' },
    pending: { title: 'กำลังตรวจสอบสลิป', text: `ส่งคำขอเมื่อ ${formatDate(membership.submitted_at, true)} ทีมงานจะแจ้งผลหลังตรวจสอบ`, icon: Clock3, color: 'text-amber-700', surface: 'bg-amber-50 border-amber-200' },
    active: { title: 'สมาชิกใช้งานอยู่', text: `สิทธิ์สมาชิกหมดอายุ ${formatDate(membership.expires_at)}`, icon: CheckCircle2, color: 'text-emerald-700', surface: 'bg-emerald-50 border-emerald-200' },
    expired: { title: 'สิทธิ์สมาชิกหมดอายุแล้ว', text: 'สามารถต่ออายุได้โดยโอนเงินและส่งสลิปใหม่', icon: CircleAlert, color: 'text-red-700', surface: 'bg-red-50 border-red-200' },
    rejected: { title: 'กรุณาส่งสลิปใหม่', text: membership.rejection_reason || 'สลิปไม่ผ่านการตรวจสอบ โปรดตรวจข้อมูลการโอนแล้วส่งใหม่', icon: CircleAlert, color: 'text-red-700', surface: 'bg-red-50 border-red-200' },
  };
  const state = states[membership.status] || states.inactive;
  const Icon = state.icon;
  return <section className={`border rounded-2xl p-5 sm:p-6 flex items-start gap-4 ${state.surface}`}><Icon size={25} className={`${state.color} shrink-0 mt-0.5`} /><div><p className={`font-semibold ${state.color}`}>{state.title}</p><p className="text-sm text-graydark/65 mt-1 leading-relaxed">{state.text}</p>{membership.status === 'active' && <p className="text-xs text-graydark/50 mt-2 inline-flex items-center gap-1"><CalendarDays size={13} /> เริ่มใช้งาน {formatDate(membership.activated_at)}</p>}</div></section>;
}
