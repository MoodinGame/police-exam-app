import { createClient } from '@supabase/supabase-js';

let supabaseAdmin;

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    throw new Error('ยังไม่ได้ตั้งค่า Supabase สำหรับฝั่งเซิร์ฟเวอร์');
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return supabaseAdmin;
}
