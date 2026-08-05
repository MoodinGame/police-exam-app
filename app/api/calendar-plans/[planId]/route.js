import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function DELETE(_request, { params }) {
  try {
    const { planId } = await params;
    const user = await requireCurrentUser();
    const supabase = getSupabaseAdmin();
    const { error, count } = await supabase
      .from('calendar_plans')
      .delete({ count: 'exact' })
      .eq('id', planId)
      .eq('user_id', user.id);
    if (error) throw error;
    if (!count) return NextResponse.json({ error: 'ไม่พบแผนการเรียน' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error?.code === '42P01') return NextResponse.json({ error: 'ยังไม่ได้ตั้งค่าฐานข้อมูลปฏิทิน' }, { status: 503 });
    const status = error?.status || 500;
    return NextResponse.json({ error: status === 500 ? 'ไม่สามารถลบแผนการเรียนได้' : error.message }, { status });
  }
}
