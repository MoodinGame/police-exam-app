'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, LoaderCircle, MessageSquareText, ShieldCheck } from 'lucide-react';

const phoneIsValid = (value) => /^(0\d{9}|66\d{9})$/.test(String(value || '').replace(/\D/g, ''));
const usernameIsValid = (value) => /^[A-Za-z0-9]{4,15}$/.test(value) && /[A-Za-z]/.test(value);
const emailIsValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function AuthCard({ mode }) {
  const router = useRouter();
  const isRegister = mode === 'register';
  const [step, setStep] = useState('form');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [devCode, setDevCode] = useState('');

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = window.setInterval(() => setResendIn((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const validateForm = () => {
    if (isRegister && !usernameIsValid(username)) return 'ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษหรือตัวเลข 4–15 ตัว และมีตัวอักษรอย่างน้อย 1 ตัว';
    if (isRegister && !emailIsValid(email)) return 'กรุณากรอกอีเมลให้ถูกต้อง';
    if (!phoneIsValid(phone)) return 'กรุณากรอกเบอร์มือถือไทย 10 หลัก';
    if (isRegister && !acceptedTerms) return 'กรุณายอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว';
    return null;
  };

  const requestOtp = async (event) => {
    event?.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          phone,
          ...(isRegister ? { username, email, acceptedTerms } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ส่งรหัส OTP ไม่สำเร็จ');
      setStep('otp');
      setOtp('');
      setResendIn(result.resendAfter || 60);
      setDevCode(result.devMode ? result.devCode || '' : '');
    } catch (requestError) {
      setError(requestError.message || 'ส่งรหัส OTP ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('กรุณากรอกรหัส OTP 6 หลัก');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ยืนยันรหัส OTP ไม่สำเร็จ');
      router.push('/dashboard');
    } catch (verifyError) {
      setError(verifyError.message || 'ยืนยันรหัส OTP ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const resetToForm = () => {
    setStep('form');
    setOtp('');
    setError('');
    setDevCode('');
    setResendIn(0);
  };

  const phoneAction = (event) => {
    event.preventDefault();
    requestOtp();
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <header className="border-b-[3px] border-[#d3a950] bg-[#1c2b5a] text-white shadow-sm">
        <div className="mx-auto flex h-[80px] max-w-7xl items-center justify-between px-5 sm:h-[96px] sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="POLREADY หน้าแรก">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d3a950]/70 bg-white/5 text-[#e3bd69]"><ShieldCheck size={22} /></span>
            <span className="border-l border-white/15 pl-3"><span className="block text-lg font-semibold tracking-[0.08em]">POLREADY</span><span className="block text-[10px] tracking-[0.14em] text-white/55">เตรียมสอบตำรวจ</span></span>
          </Link>
          <Link href={isRegister ? '/login' : '/register'} className="rounded-xl bg-[#d3a950] px-4 py-2.5 text-sm font-semibold text-[#172856] transition hover:bg-[#e3bd69]">{isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</Link>
        </div>
      </header>
      <main className="px-5 py-12 sm:flex sm:min-h-[calc(100vh-96px)] sm:items-center sm:justify-center sm:py-16">
      <section className="mx-auto w-full max-w-[560px] rounded-2xl border-t-[3px] border-[#d3a950] bg-white px-7 py-10 shadow-[0_18px_36px_rgba(20,35,76,0.16)] sm:px-12 sm:py-11">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-[2.1rem]">{step === 'otp' ? 'ยืนยันเบอร์มือถือ' : isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</h1>
          <p className="mt-1.5 text-sm text-graydark/60">{step === 'otp' ? 'กรอกรหัสที่ส่งไปยังหมายเลขของคุณ' : isRegister ? 'เริ่มต้นเตรียมสอบกับ POLREADY' : 'POLREADY'}</p>
        </div>

        {step === 'form' ? (
          <form className="space-y-4" onSubmit={requestOtp}>
            {isRegister && <>
              <label className="block text-sm font-semibold text-graydark">ชื่อผู้ใช้ (Username)
                <input value={username} onChange={(event) => setUsername(event.target.value.replace(/[^A-Za-z0-9]/g, ''))} autoComplete="username" maxLength={15} placeholder="ตั้งชื่อผู้ใช้ของคุณ" className="mt-2 w-full rounded-xl border border-graylight/50 px-4 py-3 text-[15px] font-normal outline-none transition focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/10" />
              </label>
              <p className="-mt-2 text-xs leading-5 text-graydark/60">4–15 ตัว · ภาษาอังกฤษ (A-Z, a-z) และตัวเลข (0-9) · ต้องมีตัวอักษรอย่างน้อย 1 ตัว</p>

              <label className="block text-sm font-semibold text-graydark">อีเมล
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="your@email.com" className="mt-2 w-full rounded-xl border border-graylight/50 px-4 py-3 text-[15px] font-normal outline-none transition focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/10" />
              </label>
              <p className="-mt-2 text-xs leading-5 text-graydark/60">ใช้สำหรับติดต่อและกู้คืนบัญชี</p>
            </>}

            <label className="block text-sm font-semibold text-graydark">เบอร์โทรศัพท์มือถือ
              <div className="mt-2 flex gap-2">
                <input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="0812345678" className="min-w-0 flex-1 rounded-xl border border-graylight/50 px-4 py-3 text-[15px] font-normal outline-none transition focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/10" />
                <button type="button" onClick={phoneAction} disabled={loading} className="shrink-0 rounded-xl border border-graylight/50 bg-white px-3.5 text-sm font-medium text-navy transition hover:border-navy disabled:opacity-60">ขอรหัส OTP</button>
              </div>
            </label>
            <p className="-mt-2 text-xs leading-5 text-graydark/60">1 เบอร์ = 1 บัญชี · ใช้เบอร์นี้เข้าสู่ระบบทุกครั้ง</p>

            {isRegister && <label className="flex cursor-pointer items-start gap-3 pt-1 text-sm leading-5 text-graydark">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-graylight accent-navy" />
              <span>ฉันได้อ่านและยอมรับ <a href="#terms" className="font-semibold text-navy underline underline-offset-2">ข้อกำหนดการใช้งาน</a> และ <a href="#privacy" className="font-semibold text-navy underline underline-offset-2">นโยบายความเป็นส่วนตัว</a></span>
            </label>}

            {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading || (isRegister && !acceptedTerms)} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isRegister ? 'bg-[#d8b06b] text-navy hover:bg-[#c99f58]' : 'bg-navy text-white hover:bg-navy/90'}`}>
              {loading ? <><LoaderCircle size={17} className="animate-spin" /> กำลังส่งรหัส</> : <>{isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'} <MessageSquareText size={16} /></>}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={verifyOtp}>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-graydark/65">ส่งรหัสไปที่ <span className="font-semibold text-navy">{phone}</span> แล้ว รหัสมีอายุ 10 นาที</div>
            {devCode && <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3"><p className="text-xs font-medium text-amber-800">โหมดพัฒนา — ยังไม่ได้ส่ง SMS จริง</p><div className="mt-2 flex items-center justify-between gap-3"><span className="text-xl font-bold tracking-[0.25em] text-amber-900">{devCode}</span><button type="button" onClick={() => setOtp(devCode)} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white">กรอกรหัสให้เลย</button></div></div>}
            <label className="sr-only" htmlFor="otp">รหัส OTP 6 หลัก</label>
            <input id="otp" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="กรอกรหัส OTP 6 หลัก" className="w-full rounded-xl border border-graylight/50 px-4 py-3.5 text-center text-xl tracking-[0.35em] outline-none transition focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/10" />
            {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3.5 text-sm font-semibold text-white transition hover:bg-navy/90 disabled:opacity-60">{loading ? <><LoaderCircle size={17} className="animate-spin" /> กำลังยืนยัน</> : <><Check size={17} /> ยืนยันและ{isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</>}</button>
            <button type="button" disabled={resendIn > 0 || loading} onClick={requestOtp} className="w-full text-sm font-medium text-navy disabled:text-graydark/40">{resendIn > 0 ? `ขอรหัสใหม่ได้ใน ${resendIn} วินาที` : 'ส่งรหัสใหม่'}</button>
            <button type="button" onClick={resetToForm} className="inline-flex w-full items-center justify-center gap-1 text-sm text-graydark/60 hover:text-navy"><ArrowLeft size={15} /> เปลี่ยนเบอร์มือถือ</button>
          </form>
        )}

        {step === 'form' && <p className="mt-7 text-center text-sm text-graydark/65">{isRegister ? <>มีบัญชีอยู่แล้ว? <Link href="/login" className="font-semibold text-navy hover:underline">เข้าสู่ระบบ</Link></> : <>ยังไม่มีบัญชี? <Link href="/register" className="font-semibold text-navy hover:underline">สมัครสมาชิก</Link></>}</p>}
      </section>
      </main>
    </div>
  );
}
