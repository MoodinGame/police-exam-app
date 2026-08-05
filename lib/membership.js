// Roles describe who can administer the product (student/admin). Plans describe
// what a student can access. They intentionally remain independent.

export const DEFAULT_PLAN_PERMISSIONS = {
  practice: 'trial',
  mock: 'trial',
  randomQuiz: false,
  flashcards: false,
  knowledge: false,
  stats: true,
  calendar: true,
  aiTutor: false,
};

export const DEFAULT_MEMBERSHIP_PLANS = [
  {
    id: 'free',
    name: 'ฟรี',
    description: 'ทดลองใช้งานก่อนตัดสินใจสมัครสมาชิก',
    price: 0,
    durationDays: null,
    billingType: 'free',
    grantType: 'manual',
    paymentEnabled: false,
    isFeatured: false,
    isActive: true,
    sortOrder: 10,
    features: ['แบบฝึกหัดฟรี 1 หัวข้อในทุกวิชา', 'Mock Exam ชุดทดลองเมื่อเปิดใช้งาน', 'Random Quiz ทดลองฟรี 3 ข้อต่อวิชา ก่อนตัดสินใจสมัครสมาชิก', 'ดูแดชบอร์ดและปฏิทินได้'],
    permissions: DEFAULT_PLAN_PERMISSIONS,
  },
  {
    id: 'mock-single',
    name: 'Mock รายชุด',
    description: 'เปิดสิทธิ์เฉพาะชุด Mock ที่ผู้ดูแลกำหนดให้',
    price: 59,
    durationDays: null,
    billingType: 'one_time',
    grantType: 'exam_set',
    paymentEnabled: false,
    isFeatured: false,
    isActive: true,
    sortOrder: 20,
    features: ['ปลดล็อกเฉพาะชุด Mock ที่เลือก', 'ใช้งาน Flashcards และฝึกภาษาอังกฤษ', 'ดูแดชบอร์ดและปฏิทินอ่านหนังสือ'],
    permissions: { ...DEFAULT_PLAN_PERMISSIONS, mock: 'selected', flashcards: true, knowledge: true },
  },
  {
    id: 'vip-1y',
    name: 'VIP 1 ปี',
    description: 'เปิดทุกคลังข้อสอบและสิทธิ์สมาชิกเป็นเวลา 1 ปี',
    price: 690,
    durationDays: 365,
    billingType: 'subscription',
    grantType: 'membership',
    paymentEnabled: true,
    isFeatured: true,
    isActive: true,
    sortOrder: 30,
    features: ['คลังข้อสอบครบทุกวิชา', 'เฉลยละเอียด วิเคราะห์จุดอ่อน และ AI', 'สิทธิ์ Mock Exam ทุกชุดที่เปิดใช้งาน'],
    permissions: { ...DEFAULT_PLAN_PERMISSIONS, practice: 'all', mock: 'all', flashcards: true, knowledge: true, aiTutor: true },
  },
  {
    id: 'annual-2569',
    name: 'สมาชิกรายปี (เดิม)',
    description: 'สำหรับรักษาสิทธิ์สมาชิกเดิมในระบบ',
    price: 690,
    durationDays: 365,
    billingType: 'subscription',
    grantType: 'membership',
    paymentEnabled: false,
    isFeatured: false,
    isActive: false,
    sortOrder: 999,
    features: ['สิทธิ์สมาชิกเดิม'],
    permissions: { ...DEFAULT_PLAN_PERMISSIONS, practice: 'all', mock: 'all', flashcards: true, knowledge: true, aiTutor: true },
  },
];

export const membershipPlans = {
  free: DEFAULT_MEMBERSHIP_PLANS[0],
  mockSingle: DEFAULT_MEMBERSHIP_PLANS[1],
  vipAnnual: DEFAULT_MEMBERSHIP_PLANS[2],
};

export const vipMembershipPlan = membershipPlans.vipAnnual;
export const annualMembershipPlan = vipMembershipPlan;

function asStringArray(value, maxItems = 12, maxLength = 180) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function asPermissions(value, fallback = DEFAULT_PLAN_PERMISSIONS) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const level = (key) => ['trial', 'selected', 'all'].includes(source[key]) ? source[key] : fallback[key];
  return {
    practice: level('practice'),
    mock: level('mock'),
    randomQuiz: typeof source.randomQuiz === 'boolean' ? source.randomQuiz : Boolean(fallback.randomQuiz),
    flashcards: typeof source.flashcards === 'boolean' ? source.flashcards : Boolean(fallback.flashcards),
    knowledge: typeof source.knowledge === 'boolean' ? source.knowledge : Boolean(fallback.knowledge),
    stats: typeof source.stats === 'boolean' ? source.stats : Boolean(fallback.stats),
    calendar: typeof source.calendar === 'boolean' ? source.calendar : Boolean(fallback.calendar),
    aiTutor: typeof source.aiTutor === 'boolean' ? source.aiTutor : Boolean(fallback.aiTutor),
  };
}

export function normalizeMembershipPlan(raw, fallback = null) {
  const seed = fallback || DEFAULT_MEMBERSHIP_PLANS.find((item) => item.id === raw?.id) || DEFAULT_MEMBERSHIP_PLANS[0];
  const price = Number(raw?.price ?? raw?.amount ?? seed.price);
  const duration = raw?.durationDays ?? raw?.duration_days ?? seed.durationDays;
  const sort = Number(raw?.sortOrder ?? raw?.sort_order ?? seed.sortOrder);
  const billingType = ['free', 'one_time', 'subscription'].includes(raw?.billingType ?? raw?.billing_type)
    ? raw.billingType ?? raw.billing_type
    : seed.billingType;
  const grantType = ['membership', 'exam_set', 'manual'].includes(raw?.grantType ?? raw?.grant_type)
    ? raw.grantType ?? raw.grant_type
    : seed.grantType;

  return {
    id: String(raw?.id || seed.id),
    name: String(raw?.name || seed.name).trim().slice(0, 120) || seed.name,
    description: String(raw?.description ?? seed.description).trim().slice(0, 500),
    price: Number.isFinite(price) && price >= 0 ? Math.round(price) : seed.price,
    durationDays: Number.isInteger(Number(duration)) && Number(duration) > 0 ? Number(duration) : null,
    billingType,
    grantType,
    paymentEnabled: Boolean(raw?.paymentEnabled ?? raw?.payment_enabled ?? seed.paymentEnabled),
    isFeatured: Boolean(raw?.isFeatured ?? raw?.is_featured ?? seed.isFeatured),
    isActive: raw?.isActive ?? raw?.is_active ?? seed.isActive,
    sortOrder: Number.isFinite(sort) ? sort : seed.sortOrder,
    features: asStringArray(raw?.features, 12).length ? asStringArray(raw?.features, 12) : seed.features,
    permissions: asPermissions(raw?.permissions, seed.permissions),
  };
}

export function getFallbackMembershipPlan(planId) {
  const match = DEFAULT_MEMBERSHIP_PLANS.find((item) => item.id === planId);
  return match ? normalizeMembershipPlan(match) : null;
}

export function getPublicFallbackPlans() {
  return DEFAULT_MEMBERSHIP_PLANS
    .filter((plan) => plan.isActive)
    .map((plan) => normalizeMembershipPlan(plan))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPaidMembershipPlan(planId) {
  const plan = getFallbackMembershipPlan(planId);
  return plan?.paymentEnabled && plan.grantType === 'membership' ? plan : null;
}

export function isMembershipActive(membership) {
  if (membership?.status !== 'active') return false;
  if (!membership.expires_at) return true;
  const expiry = new Date(membership.expires_at);
  return !Number.isNaN(expiry.valueOf()) && expiry > new Date();
}

export function hasPlanPermission(access, key, accepted = true) {
  if (!access?.isActive) return false;
  const value = access.permissions?.[key];
  if (Array.isArray(accepted)) return accepted.includes(value);
  return accepted === true ? value === true : value === accepted;
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
