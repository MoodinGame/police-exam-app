import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';

export const OTP_CHALLENGE_COOKIE = 'polready_otp_challenge';
export const AUTH_SESSION_COOKIE = 'polready_session';
export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_RESEND_SECONDS = 60;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;

const hmacSecret = () => process.env.OTP_HMAC_SECRET || '';

function sign(value) {
  return createHmac('sha256', hmacSecret()).update(value).digest('base64url');
}

function sameValue(left, right) {
  const a = Buffer.from(left || '');
  const b = Buffer.from(right || '');
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * โหมดพัฒนา: ข้ามการส่ง SMS จริง แล้วพิมพ์รหัสลง console ของ server แทน
 * ใช้ระหว่างรอผู้ให้บริการอนุมัติชื่อผู้ส่ง
 *
 * ปิดตายเมื่อ NODE_ENV === 'production' เสมอ แม้จะตั้ง OTP_DEV_MODE=true ก็ตาม
 * เพราะถ้าเปิดบน production จะกลายเป็นช่องให้ใครก็ได้ล็อกอินเป็นเบอร์ใครก็ได้
 */
export function isDevOtpMode() {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.OTP_DEV_MODE === 'true';
}

export function getThsmsConfig() {
  const token = process.env.THSMS_API_TOKEN?.trim();
  const sender = process.env.THSMS_SENDER?.trim();
  const secret = hmacSecret();

  // โหมดพัฒนาไม่ต้องใช้ token/sender ของผู้ให้บริการ แต่ยังต้องมี secret สำหรับเซ็นคุกกี้
  if (isDevOtpMode()) return secret ? { token: null, sender: null, devMode: true } : null;

  if (!token || !sender || !secret) return null;
  return { token, sender, devMode: false };
}

export function normalizeThaiPhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) return digits;
  if (/^66\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  return null;
}

export function createOtpChallenge(phone, registration = null) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const nonce = randomBytes(16).toString('base64url');
  const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;

  return {
    code,
    value: {
      phone,
      nonce,
      codeHash: sign(`${phone}:${code}:${nonce}`),
      expiresAt,
      attempts: 0,
      ...(registration ? { registration } : {}),
    },
  };
}

export function serializeChallenge(challenge) {
  const payload = Buffer.from(JSON.stringify(challenge)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function parseChallenge(value) {
  if (!value || !hmacSecret()) return null;
  const [payload, signature, ...rest] = value.split('.');
  if (!payload || !signature || rest.length || !sameValue(sign(payload), signature)) return null;

  try {
    const challenge = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!challenge.phone || !challenge.nonce || !challenge.codeHash || !challenge.expiresAt) return null;
    if (challenge.registration && (
      typeof challenge.registration.username !== 'string' ||
      typeof challenge.registration.email !== 'string'
    )) return null;
    return challenge;
  } catch {
    return null;
  }
}

export function isChallengeExpired(challenge) {
  return !challenge || Number(challenge.expiresAt) <= Date.now();
}

export function isOtpCorrect(challenge, code) {
  if (!/^\d{6}$/.test(String(code || ''))) return false;
  return sameValue(challenge.codeHash, sign(`${challenge.phone}:${code}:${challenge.nonce}`));
}

// sessionId ผูกกับ app_users.session_id ฝั่งเซิร์ฟเวอร์ — ล็อกอินใหม่จากเครื่องไหนจะสร้าง
// sessionId ใหม่ทับของเดิม เครื่องเก่าที่ยังถือ sessionId เดิมอยู่จะถูกปฏิเสธในครั้งถัดไป
// ที่เรียก API ที่ต้องล็อกอิน (ดู requireCurrentUser ใน lib/serverUser.js)
export function createSession(phone, sessionId) {
  const payload = Buffer.from(JSON.stringify({ phone, sessionId, issuedAt: Date.now(), expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function parseSession(value) {
  if (!value || !hmacSecret()) return null;
  const [payload, signature, ...rest] = value.split('.');
  if (!payload || !signature || rest.length || !sameValue(sign(payload), signature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!normalizeThaiPhone(session.phone) || Number(session.expiresAt) <= Date.now()) return null;
    // sessionId ไม่มีในคุกกี้เก่าก่อนอัปเดตฟีเจอร์นี้ — เป็น undefined ได้ตามปกติ
    return { phone: session.phone, sessionId: session.sessionId || null };
  } catch {
    return null;
  }
}

export const secureCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};
