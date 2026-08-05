import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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

async function currentAccount(supabase) {
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'payment_account').maybeSingle();
  if (error) throw error;
  return data?.value && typeof data.value === 'object' ? data.value : {};
}

async function saveAccount(supabase, adminId, value) {
  const { error } = await supabase.from('app_settings').upsert({ key: 'payment_account', value, updated_by: adminId }, { onConflict: 'key' });
  if (error) throw error;
}

export async function POST(request) {
  let storagePath;
  let supabase;

  try {
    const admin = await requireAdmin();
    supabase = getSupabaseAdmin();
    const formData = await request.formData();
    const file = formData.get('qr');
    if (!file || typeof file.arrayBuffer !== 'function') throw requestError('กรุณาแนบรูป QR code');
    if (!allowedFiles[file.type]) throw requestError('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP');
    if (!file.size || file.size > MAX_FILE_SIZE) throw requestError('ไฟล์ QR code ต้องมีขนาดไม่เกิน 2 MB');

    const account = await currentAccount(supabase);
    storagePath = `qr/${randomUUID()}.${allowedFiles[file.type]}`;
    const { error: uploadError } = await supabase.storage
      .from('payment-assets')
      .upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('payment-assets').getPublicUrl(storagePath);
    const previousPath = account.qrCodePath;
    const nextAccount = { ...account, qrCodeUrl: publicUrlData.publicUrl, qrCodePath: storagePath };
    await saveAccount(supabase, admin.id, nextAccount);

    if (previousPath) await supabase.storage.from('payment-assets').remove([previousPath]);

    return NextResponse.json({ paymentAccount: nextAccount });
  } catch (error) {
    if (storagePath && supabase) await supabase.storage.from('payment-assets').remove([storagePath]);
    return apiErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const admin = await requireAdmin();
    const supabase = getSupabaseAdmin();
    const account = await currentAccount(supabase);
    if (!account.qrCodePath) throw requestError('ยังไม่มี QR code ให้ลบ');

    const { qrCodeUrl, qrCodePath, ...rest } = account;
    await saveAccount(supabase, admin.id, rest);
    await supabase.storage.from('payment-assets').remove([qrCodePath]);

    return NextResponse.json({ paymentAccount: rest });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
