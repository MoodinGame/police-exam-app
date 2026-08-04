import { cookies } from 'next/headers';
import { AUTH_SESSION_COOKIE, parseSession } from '@/lib/otpServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function accessError(status, message, code = null) {
  const error = new Error(message);
  error.status = status;
  // code ให้หน้าบ้านแยกออกว่าเป็นการถูกเตะออกจากอุปกรณ์อื่น ไม่ใช่แค่ยังไม่ล็อกอิน
  if (code) error.details = { code };
  return error;
}

function registrationError(message) {
  return accessError(409, message);
}

export function getSessionPhone() {
  const session = parseSession(cookies().get(AUTH_SESSION_COOKIE)?.value);
  return session?.phone || null;
}

export async function findUserByPhone(phone) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('app_users')
    .select('id, phone, role, status, suspended_reason')
    .eq('phone', phone)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function ensureRegistrationSchema() {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('app_users')
    .select('username, email, terms_accepted_at')
    .limit(1);

  if (error) throw error;
}

export async function ensureUserForPhone(phone) {
  const data = await findUserByPhone(phone);
  if (!data) throw accessError(404, 'ยังไม่มีบัญชีสำหรับเบอร์นี้ กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ');
  // ต้องกันตั้งแต่ตอนล็อกอิน ไม่งั้นบัญชีที่ถูกระงับขอ OTP ใหม่แล้วกลับเข้ามาได้เรื่อย ๆ
  if (data.status && data.status !== 'active') {
    const reason = String(data.suspended_reason || '').trim();
    throw accessError(403, reason
      ? `บัญชีนี้ถูกระงับการใช้งาน (${reason})`
      : 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
  }
  return data;
}

export async function registerUserForPhone(phone, registration) {
  const supabase = getSupabaseAdmin();
  const { username, email } = registration;

  const { data: existing, error: existingError } = await supabase
    .from('app_users')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    throw registrationError('เบอร์มือถือนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบด้วย OTP');
  }

  const { data, error } = await supabase
    .from('app_users')
    .upsert({
      phone,
      username,
      email,
      terms_accepted_at: new Date().toISOString(),
    }, { onConflict: 'phone' })
    .select('id, phone, username, email, role')
    .single();

  if (error?.code === '23505') {
    if (/username/i.test(error.message || '')) throw registrationError('ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาเลือกชื่อใหม่');
    if (/email/i.test(error.message || '')) throw registrationError('อีเมลนี้ถูกใช้แล้ว กรุณาใช้อีเมลอื่น');
    throw registrationError('ข้อมูลนี้ถูกใช้งานแล้ว กรุณาตรวจสอบอีกครั้ง');
  }
  if (error) throw error;
  return data;
}

export async function requireCurrentUser() {
  const session = parseSession(cookies().get(AUTH_SESSION_COOKIE)?.value);
  if (!session) throw accessError(401, 'กรุณาเข้าสู่ระบบก่อนใช้งาน');

  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from('app_users')
    .select('id, phone, role, session_id, status, suspended_reason')
    .eq('phone', session.phone)
    .maybeSingle();

  // ยังไม่ได้รัน migration เพิ่มคอลัมน์ session_id บน Supabase — ทำงานต่อได้โดยข้ามการบังคับ
  // ใช้งานทีละเครื่องไปก่อน (ดู supabase/migrations/20260803_single_device_session.sql)
  // PGRST204 = PostgREST หา column ไม่เจอใน schema cache, 42703 = Postgres undefined_column
  if (error?.code === 'PGRST204' || error?.code === '42703') {
    ({ data, error } = await supabase.from('app_users').select('id, phone, role').eq('phone', session.phone).maybeSingle());
  }

  if (error) throw error;
  if (!data) throw accessError(401, 'ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
  // บัญชีที่ผู้ดูแลระงับไว้ต้องใช้งานไม่ได้ทุก API ไม่ใช่แค่ซ่อนปุ่มในหน้าจอ
  if (data.status && data.status !== 'active') {
    const reason = String(data.suspended_reason || '').trim();
    throw accessError(
      403,
      reason ? `บัญชีนี้ถูกระงับการใช้งาน (${reason})` : 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
      'ACCOUNT_SUSPENDED',
    );
  }
  // เข้าสู่ระบบได้ทีละเครื่อง — ถ้า sessionId ไม่ตรงกับที่บันทึกล่าสุด แปลว่ามีการล็อกอินจากที่อื่นแล้ว
  if (data.session_id && data.session_id !== session.sessionId) {
    throw accessError(401, 'บัญชีนี้ถูกใช้เข้าสู่ระบบจากอุปกรณ์อื่น กรุณาเข้าสู่ระบบใหม่อีกครั้ง', 'SESSION_TAKEN_OVER');
  }
  return data;
}

export async function requireAdmin() {
  const user = await requireCurrentUser();
  if (user.role !== 'admin') throw accessError(403, 'หน้านี้สำหรับผู้ดูแลระบบเท่านั้น');
  return user;
}

export function apiErrorResponse(error) {
  const status = error?.status || 500;
  const message = status === 500 ? 'ไม่สามารถดำเนินการได้ในขณะนี้ กรุณาลองใหม่' : error.message;
  // 500 คือข้อผิดพลาดที่ไม่ได้ตั้งใจ ต้องเห็นใน log เสมอเพื่อไล่ปัญหาได้
  // ยกเว้น DYNAMIC_SERVER_USAGE ที่ Next โยนเป็นกลไกปกติตอน build ไม่ใช่ความผิดพลาด
  if (status === 500 && error?.digest !== 'DYNAMIC_SERVER_USAGE') console.error('[apiErrorResponse]', error);
  // details ของ error ที่ตั้งใจโยน (เช่น 409 พร้อมจำนวนหัวข้อ) ต้องถึงหน้าบ้าน
  return Response.json({ error: message, ...(error?.details ? { details: error.details } : {}) }, { status });
}
