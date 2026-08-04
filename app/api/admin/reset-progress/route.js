import { NextResponse } from 'next/server';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export const PROGRESS_RESET_KEY = 'progress_reset_at';

/**
 * ล้างสถิติการทำข้อสอบของผู้ใช้ทุกคน
 *
 * สถิติถูกเก็บไว้ 2 ที่ จึงต้องล้างทั้งคู่ถึงจะ "เหมือนไม่เคยเข้ามาทำ" จริง:
 *   1. exam_attempts ในฐานข้อมูล — ลบตรงนี้ได้เลย
 *   2. localStorage ในเครื่องผู้ใช้แต่ละคน — เซิร์ฟเวอร์เอื้อมไปลบไม่ได้
 *      จึงบันทึกเวลาที่สั่งล้างไว้แทน แล้วให้ฝั่ง client ล้างตัวเองเมื่อเห็นว่ามีคำสั่งใหม่กว่าข้อมูลในเครื่อง
 */
export async function POST() {
  try {
    const admin = await requireAdmin();
    const supabase = getSupabaseAdmin();

    const { count, error: deleteError } = await supabase
      .from('exam_attempts')
      .delete({ count: 'exact' })
      .not('id', 'is', null);
    if (deleteError) throw deleteError;

    const resetAt = new Date().toISOString();
    const { error: settingError } = await supabase
      .from('app_settings')
      .upsert({ key: PROGRESS_RESET_KEY, value: { resetAt }, updated_by: admin.id, updated_at: resetAt }, { onConflict: 'key' });
    if (settingError) throw settingError;

    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      action: 'reset',
      entity_type: 'exam_attempts',
      entity_id: '',
      detail: { deletedAttempts: count || 0, resetAt },
    });

    return NextResponse.json({ success: true, deletedAttempts: count || 0, resetAt });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
