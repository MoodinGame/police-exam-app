import { NextResponse } from 'next/server';
import { apiErrorResponse, requireCurrentUser } from '@/lib/serverUser';
import { getPublicFallbackPlans } from '@/lib/membership';
import { getPublicPlans, getUserAccess, membershipForResponse } from '@/lib/serverAccess';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const defaultPaymentAccount = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  qrCodeUrl: '',
};

function normalizeAccount(value) {
  if (!value || typeof value !== 'object') return defaultPaymentAccount;
  return {
    bankName: String(value.bankName || '').slice(0, 120),
    accountName: String(value.accountName || '').slice(0, 120),
    accountNumber: String(value.accountNumber || '').slice(0, 80),
    qrCodeUrl: String(value.qrCodeUrl || '').slice(0, 500),
  };
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const supabase = getSupabaseAdmin();
    const [access, plans, accountResult, resetResult] = await Promise.all([
      getUserAccess(supabase, user.id),
      getPublicPlans(supabase),
      supabase.from('app_settings').select('value').eq('key', 'payment_account').maybeSingle(),
      supabase.from('app_settings').select('value').eq('key', 'progress_reset_at').maybeSingle(),
    ]);

    if (accountResult.error) throw accountResult.error;
    if (resetResult.error) throw resetResult.error;

    return NextResponse.json({
      membership: membershipForResponse(access),
      isMember: access.isMember,
      // เวลาที่แอดมินสั่งล้างสถิติล่าสุด — ฝั่ง client ใช้เทียบเพื่อล้าง localStorage ของตัวเอง
      progressResetAt: resetResult.data?.value?.resetAt || null,
      plans: plans || getPublicFallbackPlans(),
      paymentAccount: normalizeAccount(accountResult.data?.value),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
