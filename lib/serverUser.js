import { cookies } from 'next/headers';
import { AUTH_SESSION_COOKIE, parseSession } from '@/lib/otpServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function accessError(status, message) {
  const error = new Error(message);
  error.status = status;
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
    .select('id, phone, role')
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
  const phone = getSessionPhone();
  if (!phone) throw accessError(401, 'กรุณาเข้าสู่ระบบก่อนใช้งาน');

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('app_users')
    .select('id, phone, role')
    .eq('phone', phone)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw accessError(401, 'ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
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
  return Response.json({ error: message }, { status });
}
