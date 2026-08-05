const STORAGE_KEY = 'polready-calendar-plans-v1';

export function getCalendarPlans() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && item.id && item.title && item.date);
  } catch {
    return [];
  }
}

export function saveCalendarPlans(plans) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function createCalendarPlan({ title, date, type, subjectId, duration, time }) {
  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim(),
    date,
    type,
    subjectId: subjectId || '',
    duration: Number(duration) || 0,
    time: time || '',
    isPersonal: true,
  };
}
