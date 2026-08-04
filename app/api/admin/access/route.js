import { NextResponse } from 'next/server';
import { getMembershipPlan, getPublicPlans } from '@/lib/serverAccess';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function optionalExpiry(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T23:59:59.999Z`);
  if (Number.isNaN(date.valueOf()) || date <= new Date()) throw requestError('วันหมดอายุต้องเป็นวันที่ในอนาคต');
  return date.toISOString();
}

function automaticExpiry(plan) {
  if (!plan?.durationDays) return null;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + plan.durationDays);
  return date.toISOString();
}

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const [usersResult, membershipsResult, grantsResult, setsResult, plans] = await Promise.all([
      supabase.from('app_users').select('id, phone, username, email, role, status, suspended_reason, created_at').order('created_at', { ascending: false }).limit(500),
      supabase.from('memberships').select('user_id, plan_id, plan_name, amount, status, activated_at, expires_at, rejection_reason, admin_note, updated_at'),
      supabase.from('user_access_grants').select('id, user_id, resource_type, resource_id, feature_key, status, starts_at, expires_at, note, created_at').order('created_at', { ascending: false }).limit(1000),
      supabase.from('exam_sets').select('id, slug, title, bank, is_free, status').eq('bank', 'mock').eq('status', 'published').order('published_at', { ascending: false }).limit(300),
      getPublicPlans(supabase, { includeInactive: true }),
    ]);
    for (const result of [usersResult, membershipsResult, grantsResult, setsResult]) if (result.error) throw result.error;
    const membershipByUser = new Map((membershipsResult.data || []).map((item) => [item.user_id, item]));
    const grantsByUser = (grantsResult.data || []).reduce((map, grant) => {
      const existing = map.get(grant.user_id) || [];
      existing.push(grant);
      map.set(grant.user_id, existing);
      return map;
    }, new Map());
    return NextResponse.json({
      users: (usersResult.data || []).map((user) => ({
        ...user,
        membership: membershipByUser.get(user.id) || null,
        grants: grantsByUser.get(user.id) || [],
      })),
      plans: plans || [],
      mockSets: setsResult.data || [],
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const action = body?.action;
    const userId = String(body?.userId || '');
    if (!userId) throw requestError('ไม่พบผู้ใช้ที่ต้องการจัดการ');
    const supabase = getSupabaseAdmin();

    // ระงับ / คืนสิทธิ์การใช้งานบัญชี — มีผลทันทีทุก API และล็อกอินใหม่ไม่ได้ด้วย
    if (action === 'accountStatus') {
      const suspend = body?.suspend === true;
      // กันแอดมินระงับบัญชีตัวเอง แล้วล็อกตัวเองออกจากระบบจนแก้อะไรไม่ได้
      if (suspend && userId === admin.id) throw requestError('ระงับบัญชีผู้ดูแลที่กำลังใช้งานอยู่ไม่ได้');

      const { data: target, error: targetError } = await supabase
        .from('app_users')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();
      if (targetError) throw targetError;
      if (!target) throw requestError('ไม่พบบัญชีผู้ใช้', 404);
      if (suspend && target.role === 'admin') throw requestError('ระงับบัญชีผู้ดูแลระบบไม่ได้');

      const reason = String(body?.reason || '').trim().slice(0, 300);
      const { error } = await supabase
        .from('app_users')
        .update(suspend
          ? { status: 'suspended', suspended_reason: reason || 'ผู้ดูแลระงับการใช้งาน', session_id: null }
          : { status: 'active', suspended_reason: null })
        .eq('id', userId);
      if (error) throw error;
      return NextResponse.json({ ok: true, message: suspend ? 'ระงับบัญชีแล้ว' : 'คืนสิทธิ์การใช้งานแล้ว' });
    }

    if (action === 'membership') {
      const planId = String(body?.planId || 'free');
      if (planId === 'free') {
        const { error } = await supabase
          .from('memberships')
          .update({ status: 'inactive', expires_at: new Date().toISOString(), admin_note: String(body?.note || '').trim().slice(0, 500) || 'ผู้ดูแลยกเลิกสิทธิ์แบบชำระเงิน' })
          .eq('user_id', userId);
        if (error) throw error;
        return NextResponse.json({ ok: true, message: 'เปลี่ยนผู้ใช้เป็นสิทธิ์ฟรีแล้ว' });
      }
      const plan = await getMembershipPlan(supabase, planId);
      if (!plan?.isActive) throw requestError('ไม่พบหรือปิดใช้งานแพ็กเกจนี้', 404);
      if (plan.grantType !== 'membership') throw requestError('แพ็กเกจนี้ต้องเปิดสิทธิ์เป็นรายชุด Mock ในส่วนสิทธิ์เฉพาะชุด');
      if (plan.price <= 0) throw requestError('แพ็กเกจสมาชิกแบบชำระเงินต้องมีราคามากกว่า 0 บาท');
      const expiresAt = optionalExpiry(body?.expiresAt) || automaticExpiry(plan);
      const { error } = await supabase.from('memberships').upsert({
        user_id: userId,
        plan_id: plan.id,
        plan_name: plan.name,
        amount: plan.price,
        status: 'active',
        activated_at: new Date().toISOString(),
        expires_at: expiresAt,
        rejection_reason: null,
        admin_note: String(body?.note || '').trim().slice(0, 500) || 'กำหนดสิทธิ์โดยผู้ดูแล',
      }, { onConflict: 'user_id' });
      if (error) throw error;
      return NextResponse.json({ ok: true, message: `เปิดสิทธิ์ ${plan.name} เรียบร้อยแล้ว` });
    }

    if (action === 'grantExamSet') {
      const setId = String(body?.setId || '');
      if (!setId) throw requestError('กรุณาเลือกชุด Mock ที่ต้องการเปิดสิทธิ์');
      const { data: set, error: setError } = await supabase
        .from('exam_sets')
        .select('id, title, bank, status')
        .eq('id', setId)
        .maybeSingle();
      if (setError) throw setError;
      if (!set || set.bank !== 'mock' || set.status !== 'published') throw requestError('ไม่พบชุด Mock ที่พร้อมเปิดสิทธิ์', 404);
      const payload = {
        status: 'active',
        starts_at: new Date().toISOString(),
        expires_at: optionalExpiry(body?.expiresAt),
        note: String(body?.note || '').trim().slice(0, 500),
        granted_by: admin.id,
        revoked_at: null,
        revoked_by: null,
      };
      const { data: existing, error: existingError } = await supabase
        .from('user_access_grants')
        .select('id')
        .eq('user_id', userId)
        .eq('resource_type', 'exam_set')
        .eq('resource_id', setId)
        .eq('status', 'active')
        .maybeSingle();
      if (existingError) throw existingError;
      const result = existing
        ? await supabase.from('user_access_grants').update(payload).eq('id', existing.id)
        : await supabase.from('user_access_grants').insert({ ...payload, user_id: userId, resource_type: 'exam_set', resource_id: setId });
      if (result.error) throw result.error;
      return NextResponse.json({ ok: true, message: `เปิดสิทธิ์ ${set.title} เรียบร้อยแล้ว` });
    }

    if (action === 'revokeGrant') {
      const grantId = String(body?.grantId || '');
      if (!grantId) throw requestError('ไม่พบสิทธิ์ที่ต้องการยกเลิก');
      const { error } = await supabase
        .from('user_access_grants')
        .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: admin.id })
        .eq('id', grantId)
        .eq('user_id', userId);
      if (error) throw error;
      return NextResponse.json({ ok: true, message: 'ยกเลิกสิทธิ์เฉพาะชุดแล้ว' });
    }

    throw requestError('คำสั่งจัดการสิทธิ์ไม่ถูกต้อง');
  } catch (error) {
    return apiErrorResponse(error);
  }
}
