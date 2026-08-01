'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LoaderCircle, MessageSquareText, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  // โหมดพัฒนาเท่านั้น: server ส่งรหัสกลับมาให้เพราะยังไม่ได้ส่ง SMS จริง
  const [devCode, setDevCode] = useState('');

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = window.setInterval(() => setResendIn((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const requestOtp = async (event) => {
    event?.preventDefault();
    if (phone.replace(/\D/g, '').length < 9) {
      setError('กรุณากรอกเบอร์มือถือไทยให้ถูกต้อง');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
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

  return (
    <main className="min-h-screen bg-navy flex items-center justify-center px-5 py-8">
      <section className="bg-white rounded-2xl p-7 sm:p-8 w-full max-w-sm shadow-2xl">
        <div className="w-11 h-11 rounded-xl bg-accent-cyan/10 text-accent-cyan flex items-center justify-center mb-5"><ShieldCheck size={23} /></div>
        <h1 className="text-xl font-semibold text-navy">เข้าสู่ระบบ</h1>
        <p className="text-graydark/55 text-sm mt-1.5 mb-6">ยืนยันเบอร์มือถือด้วยรหัส OTP ผ่าน SMS</p>

        {step === 'phone' ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <label className="text-sm font-medium text-graydark">เบอร์มือถือ<input type="tel" inputMode="numeric" autoComplete="tel" placeholder="0812345678" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full border border-graylight/40 rounded-xl px-4 py-3 outline-none focus:border-accent-cyan" /></label>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-accent-cyan text-white rounded-xl py-3 font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2">{loading ? <><LoaderCircle size={17} className="animate-spin" /> กำลังส่งรหัส</> : <><MessageSquareText size={17} /> ส่งรหัส OTP</>}</button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-sm text-graydark/60 leading-relaxed">
              {devCode ? <>โหมดพัฒนา — <span className="font-medium text-navy">ยังไม่ได้ส่ง SMS จริง</span> รหัสมีอายุ 10 นาที</> : <>ส่งรหัสไปที่ <span className="font-medium text-navy">{phone}</span> แล้ว รหัสมีอายุ 10 นาที</>}
            </p>

            {devCode && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                <p className="text-[11px] font-medium text-amber-800 mb-1">รหัสสำหรับทดสอบ (ไม่แสดงบน production)</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl font-bold tracking-[0.3em] text-amber-900">{devCode}</span>
                  <button type="button" onClick={() => setOtp(devCode)} className="shrink-0 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg px-3 py-1.5">
                    กรอกให้เลย
                  </button>
                </div>
              </div>
            )}
            <label className="sr-only" htmlFor="otp">รหัส OTP 6 หลัก</label><input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="กรอกรหัส 6 หลัก" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} className="w-full border border-graylight/40 rounded-xl px-4 py-3 outline-none focus:border-accent-cyan tracking-[0.45em] text-center text-xl" />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-accent-cyan text-white rounded-xl py-3 font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2">{loading ? <><LoaderCircle size={17} className="animate-spin" /> กำลังยืนยัน</> : 'ยืนยันและเข้าสู่ระบบ'}</button>
            <button type="button" disabled={resendIn > 0 || loading} onClick={requestOtp} className="w-full text-sm text-navy disabled:text-graydark/40">{resendIn > 0 ? `ขอรหัสใหม่ได้ใน ${resendIn} วินาที` : 'ส่งรหัสใหม่'}</button>
            <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="w-full text-graydark/55 text-sm inline-flex items-center justify-center gap-1"><ArrowLeft size={14} /> เปลี่ยนเบอร์มือถือ</button>
          </form>
        )}
      </section>
    </main>
  );
}
