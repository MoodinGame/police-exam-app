// Public trial: one practice set per subject. Keep this list intentional so a
// future question-bank update does not accidentally unlock every new topic.
export const FREE_PRACTICE_TOPIC_IDS = [
  'it-memory',
  'corr-types',
  'law-civil',
  'apt-ratio',
  'thai-royal',
  'eng-grammar',
];

export function isFreePracticeTopic(topicId) {
  return FREE_PRACTICE_TOPIC_IDS.includes(topicId);
}

export function hasActiveMembership(membership) {
  if (membership?.status !== 'active') return false;
  if (!membership.expires_at) return false;
  // annual-2569 is retained for people who purchased before VIP 1 ปี was
  // introduced. Both plans intentionally receive the full-access entitlement.
  if (!['vip-1y', 'annual-2569'].includes(membership.plan_id)) return false;
  return new Date(membership.expires_at) > new Date();
}
