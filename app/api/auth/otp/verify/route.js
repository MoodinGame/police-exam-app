import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  AUTH_SESSION_COOKIE,
  createSession,
  isChallengeExpired,
  isOtpCorrect,
  OTP_CHALLENGE_COOKIE,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_TTL_SECONDS,
  parseChallenge,
  secureCookieOptions,
  serializeChallenge,
} from '@/lib/otpServer';
import { ensureUserForPhone, registerUserForPhone } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
  }

  const store = cookies();
  const challenge = parseChallenge(store.get(OTP_CHALLENGE_COOKIE)?.value);
  if (!challenge || isChallengeExpired(challenge)) {
    store.delete(OTP_CHALLENGE_COOKIE);
    return NextResponse.json({ error: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่' }, { status: 400 });
  }

  if (challenge.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
    store.delete(OTP_CHALLENGE_COOKIE);
    return NextResponse.json({ error: 'กรอกรหัสไม่ถูกต้องเกินกำหนด กรุณาขอรหัสใหม่' }, { status: 429 });
  }

  if (!isOtpCorrect(challenge, String(body?.otp || ''))) {
    const nextChallenge = { ...challenge, attempts: challenge.attempts + 1 };
    store.set(OTP_CHALLENGE_COOKIE, serializeChallenge(nextChallenge), {
      ...secureCookieOptions,
      maxAge: OTP_TTL_SECONDS,
    });
    const remaining = OTP_MAX_VERIFY_ATTEMPTS - nextChallenge.attempts;
    return NextResponse.json({ error: `รหัส OTP ไม่ถูกต้อง (เหลือ ${remaining} ครั้ง)` }, { status: 400 });
  }

  try {
    if (challenge.registration) await registerUserForPhone(challenge.phone, challenge.registration);
    else await ensureUserForPhone(challenge.phone);
  } catch (error) {
    const status = error?.status || 503;
    const message = status === 503
      ? 'ระบบสมาชิกยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง'
      : error.message;
    return NextResponse.json({ error: message }, { status });
  }

  // สร้าง sessionId ใหม่ทุกครั้งที่ล็อกอินสำเร็จ แล้วบันทึกทับของเดิมใน DB
  // เพื่อบังคับใช้งานได้ทีละเครื่อง — เครื่องเก่าที่ถือ sessionId เดิมจะถูกปฏิเสธในครั้งถัดไป
  const sessionId = randomBytes(18).toString('base64url');
  const supabase = getSupabaseAdmin();
  const { error: sessionError } = await supabase
    .from('app_users')
    .update({ session_id: sessionId })
    .eq('phone', challenge.phone);
  // ยังไม่ได้รัน migration เพิ่มคอลัมน์ session_id — ปล่อยให้ล็อกอินผ่านต่อไปได้โดยยังไม่บังคับทีละเครื่อง
  // PGRST204 = PostgREST หา column ไม่เจอใน schema cache (กรณีปกติก่อนรัน migration)
  // 42703 = Postgres undefined_column (เผื่อ error หลุดมาจากชั้น DB ตรง ๆ)
  if (sessionError && sessionError.code !== 'PGRST204' && sessionError.code !== '42703') {
    return NextResponse.json({ error: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }, { status: 503 });
  }

  store.delete(OTP_CHALLENGE_COOKIE);
  store.set(AUTH_SESSION_COOKIE, createSession(challenge.phone, sessionId), {
    ...secureCookieOptions,
    maxAge: 365 * 24 * 60 * 60,
  });

  return NextResponse.json({ success: true, phone: challenge.phone });
}
