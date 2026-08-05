import { NextResponse } from 'next/server';
import { normalizeMembershipPlan } from '@/lib/membership';
import { getPublicPlans } from '@/lib/serverAccess';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function planPayload(body, existing = null, isCreate = false) {
  const requestedId = String(body?.id || '').trim().toLowerCase();
  if (isCreate && !/^[a-z0-9][a-z0-9-]{1,59}$/.test(requestedId)) {
    throw requestError('รหัสแพ็กเกจต้องเป็นตัวพิมพ์เล็ก ตัวเลข หรือเครื่องหมาย - ความยาว 2–60 ตัว');
  }
  const normalized = normalizeMembershipPlan({
    ...existing,
    ...body,
    id: isCreate ? requestedId : existing?.id,
  }, existing || null);
  if (!normalized.name) throw requestError('กรุณาระบุชื่อแพ็กเกจ');
  if (normalized.billingType === 'free' && normalized.price !== 0) throw requestError('แพ็กเกจฟรีต้องมีราคา 0 บาท');
  if (normalized.paymentEnabled && (normalized.grantType !== 'membership' || normalized.price <= 0)) {
    throw requestError('การชำระเงินด้วยสลิปใช้ได้กับแพ็กเกจสมาชิกที่มีราคามากกว่า 0 บาทเท่านั้น');
  }

  return {
    id: normalized.id,
    name: normalized.name,
    description: normalized.description,
    price: normalized.price,
    duration_days: normalized.durationDays,
    billing_type: normalized.billingType,
    grant_type: normalized.grantType,
    features: normalized.features,
    permissions: normalized.permissions,
    payment_enabled: normalized.paymentEnabled,
    is_featured: normalized.isFeatured,
    is_active: Boolean(normalized.isActive),
    sort_order: normalized.sortOrder,
  };
}

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const [plans, membershipsResult] = await Promise.all([
      getPublicPlans(supabase, { includeInactive: true }),
      supabase.from('memberships').select('plan_id, status, expires_at'),
    ]);
    if (membershipsResult.error) throw membershipsResult.error;
    const now = new Date();
    const usage = (membershipsResult.data || []).reduce((result, membership) => {
      if (membership.status === 'active' && (!membership.expires_at || new Date(membership.expires_at) > now)) {
        result[membership.plan_id] = (result[membership.plan_id] || 0) + 1;
      }
      return result;
    }, {});
    return NextResponse.json({
      plans: (plans || []).map((plan) => ({ ...plan, activeMembers: usage[plan.id] || 0 })),
      source: plans ? 'database' : 'fallback',
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const payload = planPayload(await request.json(), null, true);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('membership_plans')
      .insert(payload)
      .select('id, name, description, price, duration_days, billing_type, grant_type, features, permissions, payment_enabled, is_featured, is_active, sort_order')
      .single();
    if (error?.code === '23505') throw requestError('รหัสแพ็กเกจนี้ถูกใช้งานแล้ว', 409);
    if (error) throw error;
    return NextResponse.json({ plan: normalizeMembershipPlan(data) }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const id = String(body?.id || '').trim();
    if (!id) throw requestError('ไม่พบแพ็กเกจที่ต้องการลบ');
    if (id === 'free') throw requestError('ไม่สามารถลบแพ็กเกจฟรีได้ เนื่องจากระบบใช้เป็นค่าเริ่มต้น');
    const supabase = getSupabaseAdmin();

    const { count, error: countError } = await supabase
      .from('memberships')
      .select('user_id', { count: 'exact', head: true })
      .eq('plan_id', id)
      .eq('status', 'active');
    if (countError) throw countError;
    if (count > 0) throw requestError(`ลบไม่ได้ เนื่องจากมีสมาชิกใช้งานแพ็กเกจนี้อยู่ ${count} คน กรุณาย้ายสมาชิกไปแพ็กเกจอื่นก่อน`, 409);

    const { data, error } = await supabase
      .from('membership_plans')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw requestError('ไม่พบแพ็กเกจนี้', 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const id = String(body?.id || '').trim();
    if (!id) throw requestError('ไม่พบแพ็กเกจที่ต้องการแก้ไข');
    const supabase = getSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from('membership_plans')
      .select('id, name, description, price, duration_days, billing_type, grant_type, features, permissions, payment_enabled, is_featured, is_active, sort_order')
      .eq('id', id)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw requestError('ไม่พบแพ็กเกจนี้', 404);
    const payload = planPayload(body, normalizeMembershipPlan(current));
    const { data, error } = await supabase
      .from('membership_plans')
      .update(payload)
      .eq('id', id)
      .select('id, name, description, price, duration_days, billing_type, grant_type, features, permissions, payment_enabled, is_featured, is_active, sort_order')
      .single();
    if (error) throw error;
    return NextResponse.json({ plan: normalizeMembershipPlan(data) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
