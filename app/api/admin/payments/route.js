import { NextResponse } from 'next/server';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const [slipsResult, accountResult] = await Promise.all([
      supabase
        .from('payment_slips')
        .select('id, payer_name, paid_at, plan_name, amount, original_filename, status, reviewer_note, reviewed_at, created_at, storage_path, app_users!payment_slips_user_id_fkey(phone)')
        .order('created_at', { ascending: false }),
      supabase.from('app_settings').select('value').eq('key', 'payment_account').maybeSingle(),
    ]);
    if (slipsResult.error) throw slipsResult.error;
    if (accountResult.error) throw accountResult.error;

    const slips = await Promise.all((slipsResult.data || []).map(async (slip) => {
      const { data: signedFile } = await supabase.storage
        .from('payment-slips')
        .createSignedUrl(slip.storage_path, 60 * 10);
      return {
        ...slip,
        userPhone: slip.app_users?.phone || '',
        imageUrl: signedFile?.signedUrl || '',
        app_users: undefined,
      };
    }));

    return NextResponse.json({
      slips,
      paymentAccount: accountResult.data?.value || { bankName: '', accountName: '', accountNumber: '' },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
