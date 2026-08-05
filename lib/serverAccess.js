import { isFreePracticeTopic } from '@/lib/entitlements';
import {
  DEFAULT_PLAN_PERMISSIONS,
  getFallbackMembershipPlan,
  isMembershipActive,
  normalizeMembershipPlan,
} from '@/lib/membership';

function missingTable(error) {
  return error?.code === '42P01';
}

function missingColumn(error) {
  return ['42703', 'PGRST204', 'PGRST205'].includes(error?.code);
}

/**
 * หัวข้อไหนเปิดให้ทำฟรีบ้าง — อ่านจาก content_topics.is_free_practice ที่แอดมินติ๊กไว้ในหลังบ้าน
 *
 * ต้องใช้ตัวนี้ทุกจุดที่เช็คสิทธิ์ฝั่ง server (หน้าเข้าทำข้อสอบ, โหลดคำถาม, ส่งคำตอบ)
 * ไม่งั้นการ์ดจะบอกว่าฟรีแต่ server บล็อก ซึ่งเคยเกิดมาแล้วตอนย้ายจาก list ที่ hardcode ไว้
 *
 * @param {string[]} topicKeys legacy_id หรือ uuid ของหัวข้อ
 * @returns {Promise<Set<string>>} เฉพาะคีย์ที่เปิดให้ทำฟรี
 */
export async function getFreePracticeTopicKeys(supabase, topicKeys) {
  const keys = [...new Set((topicKeys || []).filter(Boolean).map(String))];
  if (keys.length === 0) return new Set();

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const ids = keys.filter((key) => uuidPattern.test(key));
  const legacyIds = keys.filter((key) => !uuidPattern.test(key));

  const requests = [];
  if (legacyIds.length) requests.push(supabase.from('content_topics').select('id, legacy_id').eq('is_free_practice', true).eq('is_active', true).in('legacy_id', legacyIds));
  if (ids.length) requests.push(supabase.from('content_topics').select('id, legacy_id').eq('is_free_practice', true).eq('is_active', true).in('id', ids));

  const results = await Promise.all(requests);
  const failure = results.find((result) => result.error)?.error;
  // ยังไม่ได้รัน migration ที่เพิ่มคอลัมน์ is_free_practice — ถอยไปใช้รายการเดิมชั่วคราว
  if (failure && (missingColumn(failure) || missingTable(failure))) {
    return new Set(keys.filter(isFreePracticeTopic));
  }
  if (failure) throw failure;

  const free = new Set();
  for (const result of results) {
    for (const row of result.data || []) {
      if (row.legacy_id && keys.includes(row.legacy_id)) free.add(row.legacy_id);
      if (row.id && keys.includes(row.id)) free.add(row.id);
    }
  }
  // รายการเดิมที่ hardcode ไว้ยังถือว่าฟรีต่อไป เพื่อไม่ให้ผู้ใช้เดิมเสียสิทธิ์ที่เคยมี
  for (const key of keys) if (isFreePracticeTopic(key)) free.add(key);
  return free;
}

export async function isFreePracticeTopicId(supabase, topicKey) {
  if (!topicKey) return false;
  const free = await getFreePracticeTopicKeys(supabase, [topicKey]);
  return free.has(String(topicKey));
}

function expiredMembership(membership) {
  if (!membership) return null;
  if (membership.status === 'active' && membership.expires_at && !isMembershipActive(membership)) {
    return { ...membership, status: 'expired' };
  }
  return membership;
}

function activeGrant(grant) {
  if (grant?.status !== 'active') return false;
  const now = new Date();
  if (grant.starts_at && new Date(grant.starts_at) > now) return false;
  if (grant.expires_at && new Date(grant.expires_at) <= now) return false;
  return true;
}

export async function getPublicPlans(supabase, { includeInactive = false } = {}) {
  let query = supabase
    .from('membership_plans')
    .select('id, name, description, price, duration_days, billing_type, grant_type, features, permissions, payment_enabled, is_featured, is_active, sort_order')
    .order('sort_order')
    .order('created_at');
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) {
    if (missingTable(error)) return null;
    throw error;
  }
  return (data || []).map((plan) => normalizeMembershipPlan(plan));
}

export async function getMembershipPlan(supabase, planId) {
  if (!planId) return null;
  const { data, error } = await supabase
    .from('membership_plans')
    .select('id, name, description, price, duration_days, billing_type, grant_type, features, permissions, payment_enabled, is_featured, is_active, sort_order')
    .eq('id', planId)
    .maybeSingle();
  if (error) {
    // Access and payments must fail closed. A missing migration or an erased plan
    // must never revive a legacy hard-coded paid plan.
    if (missingTable(error)) return null;
    throw error;
  }
  return data ? normalizeMembershipPlan(data) : null;
}

export async function getUserAccess(supabase, userId) {
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('id, user_id, plan_id, plan_name, amount, status, submitted_at, activated_at, expires_at, last_payment_slip_id, rejection_reason, admin_note, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (membershipError) throw membershipError;

  const visibleMembership = expiredMembership(membership);
  const [plan, grantsResult] = await Promise.all([
    getMembershipPlan(supabase, visibleMembership?.plan_id),
    supabase
      .from('user_access_grants')
      .select('id, resource_type, resource_id, feature_key, status, starts_at, expires_at, note, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ]);

  const grantError = grantsResult.error;
  if (grantError && !missingTable(grantError)) throw grantError;
  const activeGrants = grantError ? [] : (grantsResult.data || []).filter(activeGrant);
  const effectivePlan = plan || getFallbackMembershipPlan('free');
  // A membership is only active when its currently configured plan still exists.
  // This prevents a disabled/deleted plan from retaining paid entitlements.
  const isActive = isMembershipActive(visibleMembership) && Boolean(plan);
  const permissions = isActive ? effectivePlan.permissions : DEFAULT_PLAN_PERMISSIONS;
  const isFullMember = isActive && (permissions.practice === 'all' || permissions.mock === 'all');

  return {
    membership: visibleMembership,
    plan: effectivePlan,
    isActive,
    isMember: isFullMember,
    permissions,
    grants: activeGrants,
    grantedExamSetIds: activeGrants
      .filter((grant) => grant.resource_type === 'exam_set' && grant.resource_id)
      .map((grant) => grant.resource_id),
    grantedFeatureKeys: activeGrants
      .filter((grant) => grant.resource_type === 'feature' && grant.feature_key)
      .map((grant) => grant.feature_key),
  };
}

export function canUseArea(access, area) {
  if (!access?.isActive) return false;
  return access.permissions?.[area] === true || access.permissions?.[area] === 'all';
}

export function canAccessExamSet(access, examSet) {
  if (examSet?.is_free) return true;
  if (!access) return false;
  if (examSet?.id && access.grantedExamSetIds?.includes(examSet.id)) return true;
  const area = examSet?.bank === 'mock' ? 'mock' : 'practice';
  return canUseArea(access, area);
}

export function membershipForResponse(access) {
  if (!access?.membership) return { status: 'inactive', plan: getFallbackMembershipPlan('free') };
  return { ...access.membership, plan: access.plan, permissions: access.permissions, isActive: access.isActive };
}
