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
    const updates = {
      bankName: clean(body?.bankName, 120),
      accountName: clean(body?.accountName, 120),
      accountNumber: clean(body?.accountNumber, 80),
    };
    if (!updates.bankName || !updates.accountName || !updates.accountNumber) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลบัญชีรับโอนให้ครบ' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'payment_account')
      .maybeSingle();
    if (currentError) throw currentError;

    const value = { ...(current?.value && typeof current.value === 'object' ? current.value : {}), ...updates };
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'payment_account', value, updated_by: admin.id }, { onConflict: 'key' });
    if (error) throw error;
    return NextResponse.json({ paymentAccount: value });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
