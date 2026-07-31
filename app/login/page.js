'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEMO_OTP = '123456';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const sendOtp = (e) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('กรุณากรอกเบอร์มือถือ 10 หลัก');
      return;
    }
    setError('');
    setStep('otp');
  };

  const verifyOtp = (e) => {
    e.preventDefault();
    if (otp !== DEMO_OTP) {
      setError('รหัส OTP ไม่ถูกต้อง (demo ใช้ 123456)');
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-navy mb-1">เข้าสู่ระบบ</h1>
        <p className="text-graydark/50 text-sm mb-6">
          {step === 'phone'
            ? 'กรอกเบอร์มือถือเพื่อรับรหัส OTP'
            : `ระบบส่งรหัสไปที่ ${phone} (demo: ${DEMO_OTP})`}
        </p>

        {step === 'phone' ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <input
              type="tel"
              placeholder="0812345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-graylight/40 rounded-xl px-4 py-3 outline-none focus:border-accent-cyan"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              className="w-full bg-accent-cyan text-white rounded-xl py-3 font-medium hover:opacity-90"
            >
              ส่งรหัส OTP
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              placeholder="กรอกรหัส 6 หลัก"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border border-graylight/40 rounded-xl px-4 py-3 outline-none focus:border-accent-cyan tracking-widest text-center text-lg"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              className="w-full bg-accent-cyan text-white rounded-xl py-3 font-medium hover:opacity-90"
            >
              ยืนยัน
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-graydark/50 text-sm"
            >
              เปลี่ยนเบอร์
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
