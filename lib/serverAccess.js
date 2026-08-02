import {
  DEFAULT_PLAN_PERMISSIONS,
  getFallbackMembershipPlan,
  isMembershipActive,
  normalizeMembershipPlan,
} from '@/lib/membership';

function missingTable(error) {
  return error?.code === '42P01';
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
    if (missingTable(error)) return getFallbackMembershipPlan(planId);
    throw error;
  }
  return data ? normalizeMembershipPlan(data) : getFallbackMembershipPlan(planId);
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
  const isActive = isMembershipActive(visibleMembership);
  const effectivePlan = plan || getFallbackMembershipPlan(visibleMembership?.plan_id) || getFallbackMembershipPlan('free');
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
