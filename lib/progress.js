// เก็บความก้าวหน้าไว้ใน localStorage ของเบราว์เซอร์เท่านั้น (ยังไม่มีบัญชีผู้ใช้/ฐานข้อมูลจริง)
// ข้อมูลนี้จึงผูกกับเครื่อง/เบราว์เซอร์นี้เท่านั้น ไม่ sync ข้ามอุปกรณ์

const STORAGE_KEY = 'policeExam:topicProgress';

function readStore() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage ไม่พร้อมใช้งาน (เช่น private mode) — ข้ามไปเงียบๆ
  }
}

export function recordTopicAttempt({ topicId, subjectId, score, total }) {
  if (!topicId) return;
  const store = readStore();
  store[topicId] = { subjectId, score, total, attemptedAt: new Date().toISOString() };
  writeStore(store);
}

export function getTopicProgress(topicId) {
  return readStore()[topicId] || null;
}

export function getSubjectProgress(subjectId, subjectTopics) {
  const store = readStore();
  const attempted = subjectTopics.filter((t) => store[t.id]);
  const totalScore = attempted.reduce((acc, t) => acc + store[t.id].score, 0);
  const totalAnswered = attempted.reduce((acc, t) => acc + store[t.id].total, 0);
  return {
    attemptedCount: attempted.length,
    totalTopics: subjectTopics.length,
    progressPct: subjectTopics.length
      ? Math.round((attempted.length / subjectTopics.length) * 100)
      : 0,
    accuracyPct: totalAnswered ? Math.round((totalScore / totalAnswered) * 100) : null,
  };
}
