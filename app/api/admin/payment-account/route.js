import { NextResponse } from 'next/server';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function clean(value, limit) {
  return String(value || '').trim().slice(0, limit);
}

export async function PUT(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const value = {
      bankName: clean(body?.bankName, 120),
      accountName: clean(body?.accountName, 120),
      accountNumber: clean(body?.accountNumber, 80),
    };
    if (!value.bankName || !value.accountName || !value.accountNumber) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลบัญชีรับโอนให้ครบ' }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from('app_settings')
      .upsert({ key: 'payment_account', value, updated_by: admin.id }, { onConflict: 'key' });
    if (error) throw error;
    return NextResponse.json({ paymentAccount: value });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
