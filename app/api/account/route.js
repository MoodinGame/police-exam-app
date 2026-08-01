import { NextResponse } from 'next/server';
import { apiErrorResponse, requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validateProfile(body) {
  const username = String(body?.username || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();

  if (!/^[A-Za-z0-9]{4,15}$/.test(username) || !/[A-Za-z]/.test(username)) {
    throw requestError('ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษหรือตัวเลข 4–15 ตัว และมีตัวอักษรอย่างน้อย 1 ตัว');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw requestError('กรุณากรอกอีเมลให้ถูกต้อง');
  }

  return { username, email };
}

function profileForResponse(user) {
  return {
    username: user.username || '',
    email: user.email || '',
    phone: user.phone,
    role: user.role || 'student',
  };
}

export async function GET() {
  try {
    const currentUser = await requireCurrentUser();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('app_users')
      .select('username, email, phone, role')
      .eq('id', currentUser.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ profile: profileForResponse(data) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const currentUser = await requireCurrentUser();
    const profile = validateProfile(await request.json());
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('app_users')
      .update(profile)
      .eq('id', currentUser.id)
      .select('username, email, phone, role')
      .single();

    if (error?.code === '23505') {
      if (/username/i.test(error.message || '')) throw requestError('ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาเลือกชื่อใหม่', 409);
      if (/email/i.test(error.message || '')) throw requestError('อีเมลนี้ถูกใช้แล้ว กรุณาใช้อีเมลอื่น', 409);
      throw requestError('ข้อมูลนี้ถูกใช้งานแล้ว กรุณาตรวจสอบอีกครั้ง', 409);
    }
    if (error) throw error;

    return NextResponse.json({ profile: profileForResponse(data) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
