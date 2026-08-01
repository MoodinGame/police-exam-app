// Roles describe who can administer the product (student/admin).  Plans describe
// what a student can access.  Keeping them separate prevents a paid plan from
// ever becoming an admin permission.
export const membershipPlans = {
  free: {
    id: 'free',
    name: 'ฟรี',
    amount: 0,
  },
  mockSingle: {
    id: 'mock-single',
    name: 'Mock รายชุด',
    amount: 59,
  },
  mockFive: {
    id: 'mock-five',
    name: 'Mock 5 ชุด',
    amount: 129,
  },
  vipAnnual: {
    id: 'vip-1y',
    name: 'VIP 1 ปี',
    amount: 690,
    durationDays: 365,
  },
};

// Only plans that grant full membership may be submitted through the current
// bank-slip workflow. Mock Exam purchases need their own question-bank and
// purchase records first, so they are deliberately not accepted here yet.
export const vipMembershipPlan = membershipPlans.vipAnnual;
export const annualMembershipPlan = vipMembershipPlan;

export function getPaidMembershipPlan(planId) {
  return planId === vipMembershipPlan.id ? vipMembershipPlan : null;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleString('th-TH', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' });
}
