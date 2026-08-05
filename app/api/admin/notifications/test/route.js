import { NextResponse } from 'next/server';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { sendPendingPaymentNotification } from '@/lib/lineAdminNotifications';

export const runtime = 'nodejs';

export async function POST() {
  try {
    await requireAdmin();
    const result = await sendPendingPaymentNotification({
      planName: 'ทดสอบการแจ้งเตือน',
      amount: 0,
      createdAt: new Date().toISOString(),
      test: true,
    });
    if (!result.configured) {
      return NextResponse.json({
        error: 'ยังไม่ได้เชื่อม LINE หรือยังไม่มีแอดมินสมัครรับการแจ้งเตือน',
        reason: result.reason,
      }, { status: 409 });
    }
    if (!result.delivered) {
      return NextResponse.json({ error: 'LINE ไม่สามารถส่งการแจ้งเตือนได้ กรุณาตรวจสอบการตั้งค่า' }, { status: 502 });
    }
    return NextResponse.json({ ok: true, delivered: result.delivered });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
