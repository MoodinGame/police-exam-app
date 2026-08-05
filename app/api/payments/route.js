import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { apiErrorResponse, requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getMembershipPlan } from '@/lib/serverAccess';
import { sendPendingPaymentNotification } from '@/lib/lineAdminNotifications';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const allowedFiles = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validPaidAt(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).valueOf());
}

function cleanFileName(name) {
  return String(name || 'slip').replace(/[^\w.\-() ]/g, '_').slice(0, 180) || 'slip';
}

export async function POST(request) {
  let storagePath;
  let supabase;

  try {
    const user = await requireCurrentUser();
    supabase = getSupabaseAdmin();
    const formData = await request.formData();
    const payerName = String(formData.get('payerName') || '').trim();
    const paidAt = String(formData.get('paidAt') || '');
    const file = formData.get('slip');
    const plan = await getMembershipPlan(supabase, String(formData.get('planId') || ''));

    if (!plan?.isActive || !plan.paymentEnabled || plan.grantType !== 'membership' || plan.price <= 0) throw requestError('แพ็กเกจที่เลือกยังไม่พร้อมชำระเงิน');
    if (payerName.length < 2 || payerName.length > 120) throw requestError('กรุณากรอกชื่อผู้โอน 2–120 ตัวอักษร');
    if (!validPaidAt(paidAt)) throw requestError('กรุณาระบุวันที่โอนให้ถูกต้อง');
    if (!file || typeof file.arrayBuffer !== 'function') throw requestError('กรุณาแนบรูปสลิป');
    if (!allowedFiles[file.type]) throw requestError('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP');
    if (!file.size || file.size > MAX_FILE_SIZE) throw requestError('ไฟล์สลิปต้องมีขนาดไม่เกิน 2 MB');

    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('plan_id, status, expires_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (membership?.status === 'pending') throw requestError('มีสลิปที่รอตรวจสอบอยู่แล้ว', 409);
    if (membership?.status === 'active' && (!membership.expires_at || new Date(membership.expires_at) > new Date())) {
      throw requestError('สิทธิ์สมาชิกของคุณยังใช้งานอยู่', 409);
    }

    storagePath = `${user.id}/${randomUUID()}.${allowedFiles[file.type]}`;
    const { error: uploadError } = await supabase.storage
      .from('payment-slips')
      .upload(storagePath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: slip, error: insertError } = await supabase
      .from('payment_slips')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name,
        amount: plan.price,
        payer_name: payerName,
        paid_at: paidAt,
        storage_path: storagePath,
        original_filename: cleanFileName(file.name),
        mime_type: file.type,
        size_bytes: file.size,
      })
      .select('id, status, created_at')
      .single();

    if (insertError) {
      await supabase.storage.from('payment-slips').remove([storagePath]);
      storagePath = null;
      if (insertError.code === '23505') throw requestError('มีสลิปที่รอตรวจสอบอยู่แล้ว', 409);
      throw insertError;
    }

    // A failed LINE delivery must never block the customer's payment submission.
    try {
      await sendPendingPaymentNotification({
        planName: plan.name,
        amount: plan.price,
        createdAt: slip.created_at,
      });
    } catch (notificationError) {
      console.error('[payments] Unable to notify LINE administrators', notificationError);
    }

    return NextResponse.json({ slip }, { status: 201 });
  } catch (error) {
    if (storagePath && supabase) await supabase.storage.from('payment-slips').remove([storagePath]);
    return apiErrorResponse(error);
  }
}
