import { NextResponse } from 'next/server';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
  try {
    const { id: paymentSlipId } = await params;
    const admin = await requireAdmin();
    const body = await request.json();
    const action = body?.action;
    const note = String(body?.note || '').trim().slice(0, 500);
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'คำสั่งตรวจสลิปไม่ถูกต้อง' }, { status: 400 });
    }
    if (action === 'reject' && !note) {
      return NextResponse.json({ error: 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('payment_slips')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewer_note: action === 'reject' ? note : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
      })
      .eq('id', paymentSlipId)
      .eq('status', 'pending')
      .select('id, status')
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'รายการนี้ถูกตรวจสอบไปแล้วหรือไม่พบข้อมูล' }, { status: 409 });
    return NextResponse.json({ slip: data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
