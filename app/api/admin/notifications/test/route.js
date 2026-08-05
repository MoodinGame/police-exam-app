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
      const connectionErrors = {
        missing_access_token: 'ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN ใน Production ของ Vercel',
        no_subscribers: 'LINE OA เชื่อมกับเว็บแล้ว แต่ยังไม่มีบัญชี LINE ของแอดมินที่สมัครรับแจ้งเตือน',
      };
      return NextResponse.json({
        error: connectionErrors[result.reason] || 'ยังตั้งค่าการแจ้งเตือน LINE ไม่สมบูรณ์',
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
