import { NextResponse } from 'next/server';
import { apiErrorResponse, requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const defaultPaymentAccount = {
  bankName: '',
  accountName: '',
  accountNumber: '',
};

function normalizeAccount(value) {
  if (!value || typeof value !== 'object') return defaultPaymentAccount;
  return {
    bankName: String(value.bankName || '').slice(0, 120),
    accountName: String(value.accountName || '').slice(0, 120),
    accountNumber: String(value.accountNumber || '').slice(0, 80),
  };
}

function membershipForResponse(membership) {
  if (!membership) return { status: 'inactive' };
  if (membership.status === 'active' && membership.expires_at && new Date(membership.expires_at) <= new Date()) {
    return { ...membership, status: 'expired' };
  }
  return membership;
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const supabase = getSupabaseAdmin();
    const [membershipResult, accountResult] = await Promise.all([
      supabase
        .from('memberships')
        .select('id, plan_id, plan_name, amount, status, submitted_at, activated_at, expires_at, last_payment_slip_id, rejection_reason')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('app_settings').select('value').eq('key', 'payment_account').maybeSingle(),
    ]);

    if (membershipResult.error) throw membershipResult.error;
    if (accountResult.error) throw accountResult.error;

    return NextResponse.json({
      membership: membershipForResponse(membershipResult.data),
      paymentAccount: normalizeAccount(accountResult.data?.value),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
