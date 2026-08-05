import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import {
  createOtpChallenge,
  getThsmsConfig,
  isDevOtpMode,
  normalizeThaiPhone,
  OTP_CHALLENGE_COOKIE,
  OTP_RESEND_SECONDS,
  OTP_TTL_SECONDS,
  secureCookieOptions,
  serializeChallenge,
} from '@/lib/otpServer';
import { ensureRegistrationSchema, findUserByPhone } from '@/lib/serverUser';

export const runtime = 'nodejs';

const RATE_WINDOW_MS = 20 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const rateLimits = new Map();

function getRegistration(body) {
  if (body?.mode !== 'register') return null;

  const username = String(body?.username || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const hasLetter = /[A-Za-z]/.test(username);

  if (!/^[A-Za-z0-9]{4,15}$/.test(username) || !hasLetter) {
    throw new Error('ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษหรือตัวเลข 4–15 ตัว และมีตัวอักษรอย่างน้อย 1 ตัว');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('กรุณากรอกอีเมลให้ถูกต้อง');
  }
  if (body?.acceptedTerms !== true) {
    throw new Error('กรุณายอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว');
  }
  return { username, email };
}

function getSmsProviderError(response, payload) {
  const message = [payload?.message, payload?.error, payload?.errors?.message]
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  if (response?.status === 401 || response?.status === 403 || /token|authoriz|api key/.test(message)) {
    return 'การเชื่อมต่อระบบ SMS มีปัญหา กรุณาติดต่อผู้ดูแลระบบ';
  }

  if (/credit|balance|wallet|ยอดเงิน|เครดิต/.test(message)) {
    return 'เครดิต SMS ไม่เพียงพอ กรุณาเติมเครดิตแล้วลองใหม่อีกครั้ง';
  }

  if (/sender|from|ชื่อผู้ส่ง/.test(message)) {
    return 'ชื่อผู้ส่ง SMS ยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ';
  }

  return 'ส่ง SMS ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}

function canRequestOtp(key) {
  const now = Date.now();
  const recent = (rateLimits.get(key) || []).filter((time) => time > now - RATE_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimits.set(key, recent);
    return null;
  }
  rateLimits.set(key, [...recent, now]);
  return now;
}

function releaseOtpRequest(key, requestedAt) {
  const recent = (rateLimits.get(key) || []).filter((time) => time !== requestedAt);
  if (recent.length) rateLimits.set(key, recent);
  else rateLimits.delete(key);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
  }

  const phone = normalizeThaiPhone(body?.phone);
  if (!phone) return NextResponse.json({ error: 'กรุณากรอกเบอร์มือถือไทย 10 หลัก' }, { status: 400 });

  let registration;
  try {
    registration = getRegistration(body);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    if (registration) await ensureRegistrationSchema();
    const existingUser = await findUserByPhone(phone);
    if (!registration && !existingUser) {
      return NextResponse.json({ error: 'ยังไม่มีบัญชีสำหรับเบอร์นี้ กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ' }, { status: 404 });
    }
    if (registration && existingUser) {
      return NextResponse.json({ error: 'เบอร์มือถือนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบด้วย OTP' }, { status: 409 });
    }
    // ตัดตั้งแต่ก่อนส่ง SMS ไม่งั้นบัญชีที่ถูกระงับยิงขอรหัสรัวได้ ทั้งที่ยืนยันตัวตนไม่ผ่านอยู่ดี
    if (existingUser?.status && existingUser.status !== 'active') {
      const reason = String(existingUser.suspended_reason || '').trim();
      return NextResponse.json({
        error: reason
          ? `บัญชีนี้ถูกระงับการใช้งาน (${reason})`
          : 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
      }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'ระบบสมาชิกยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง' }, { status: 503 });
  }

  const config = getThsmsConfig();
  if (!config) {
    return NextResponse.json({ error: 'ระบบ SMS ยังไม่ได้ตั้งค่า โปรดเพิ่ม THSMS_API_TOKEN, THSMS_SENDER และ OTP_HMAC_SECRET บน server' }, { status: 503 });
  }

  const requestHeaders = await headers();
  const forwarded = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateKey = `${forwarded}:${phone}`;
  const requestedAt = canRequestOtp(rateKey);
  if (!requestedAt) {
    return NextResponse.json({ error: 'ขอรหัสมากเกินไป กรุณารอ 20 นาทีแล้วลองใหม่' }, { status: 429 });
  }

  const challenge = createOtpChallenge(phone, registration);

  if (isDevOtpMode()) {
    // ไม่ส่ง SMS จริง — อ่านรหัสได้จาก console ของ server ที่รัน npm run dev
    console.info(`\n[OTP DEV MODE] เบอร์ ${phone} รหัสคือ ${challenge.code}\n`);
  } else {
    let providerResponse;
    try {
      const response = await fetch('https://thsms.com/api/send-sms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: config.sender,
          msisdn: [phone],
          message: `POLREADY: รหัส OTP ของคุณคือ ${challenge.code} มีอายุ ${OTP_TTL_SECONDS / 60} นาที ห้ามเปิดเผยรหัสนี้แก่ผู้อื่น`,
        }),
        cache: 'no-store',
      });
      providerResponse = await response.json().catch(() => null);
      if (!response.ok || providerResponse?.success !== true) {
        // เก็บเหตุผลดิบไว้ใน log ฝั่ง server เท่านั้น เพื่อให้ตามหาสาเหตุได้โดยไม่เปิดเผยรายละเอียดระบบให้ผู้ใช้
        console.error('[OTP] THSMS ปฏิเสธคำขอ', {
          httpStatus: response.status,
          sender: config.sender,
          message: providerResponse?.message ?? null,
          errors: providerResponse?.errors ?? null,
        });
        releaseOtpRequest(rateKey, requestedAt);
        return NextResponse.json({ error: getSmsProviderError(response, providerResponse) }, { status: 502 });
      }
    } catch (error) {
      console.error('[OTP] ติดต่อ THSMS ไม่สำเร็จ', error);
      releaseOtpRequest(rateKey, requestedAt);
      return NextResponse.json({ error: 'ไม่สามารถเชื่อมต่อระบบ SMS ได้ กรุณาลองใหม่อีกครั้ง' }, { status: 502 });
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(OTP_CHALLENGE_COOKIE, serializeChallenge(challenge.value), {
    ...secureCookieOptions,
    maxAge: OTP_TTL_SECONDS,
  });

  return NextResponse.json({
    success: true,
    expiresIn: OTP_TTL_SECONDS,
    resendAfter: OTP_RESEND_SECONDS,
    // ส่งรหัสกลับมาเฉพาะโหมดพัฒนา เพื่อให้ทดสอบได้โดยไม่ต้องเปิด console
    // isDevOtpMode() คืนค่า false เสมอบน production จึงไม่มีทางหลุดออกไป
    ...(isDevOtpMode() ? { devMode: true, devCode: challenge.code } : {}),
  });
}
