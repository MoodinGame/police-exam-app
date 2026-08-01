// เก็บความก้าวหน้าไว้ใน localStorage ของเบราว์เซอร์เท่านั้น (ยังไม่มีบัญชีผู้ใช้/ฐานข้อมูลจริง)
// ข้อมูลนี้จึงผูกกับเครื่อง/เบราว์เซอร์นี้เท่านั้น ไม่ sync ข้ามอุปกรณ์

const STORAGE_KEY = 'policeExam:topicProgress';
const ATTEMPTS_KEY = 'policeExam:attempts';

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage ไม่พร้อมใช้งาน (เช่น private mode) — ข้ามไปเงียบๆ
  }
}

/** วันที่แบบ YYYY-MM-DD ตามเวลาไทย เพื่อให้ heatmap/streak ตรงกับวันจริงของผู้ใช้ */
export function localDateKey(date = new Date()) {
  const bkk = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const y = bkk.getFullYear();
  const m = String(bkk.getMonth() + 1).padStart(2, '0');
  const d = String(bkk.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateKey, delta) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    dt.getUTCDate()
  ).padStart(2, '0')}`;
}

// ---------- บันทึกผล ----------

export function recordTopicAttempt({ topicId, subjectId, score, total }) {
  if (!topicId) return;
  const now = new Date();

  // 1) ผลล่าสุดต่อหัวข้อ — ใช้แสดง ✓ และ % ในหน้าแบบฝึกหัด
  const store = read(STORAGE_KEY, {});
  store[topicId] = { subjectId, score, total, attemptedAt: now.toISOString() };
  write(STORAGE_KEY, store);

  // 2) ประวัติทุกครั้งที่ทำ — ใช้คำนวณ heatmap, streak และความแม่นยำสะสม
  const attempts = read(ATTEMPTS_KEY, []);
  attempts.push({
    topicId,
    subjectId,
    score,
    total,
    at: now.toISOString(),
    date: localDateKey(now),
  });
  write(ATTEMPTS_KEY, attempts);
}

// ---------- อ่านผล (ของเดิม — หน้าแบบฝึกหัดใช้อยู่) ----------

export function getTopicProgress(topicId) {
  return read(STORAGE_KEY, {})[topicId] || null;
}

export function getSubjectProgress(subjectId, subjectTopics) {
  const store = read(STORAGE_KEY, {});
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

// ---------- สถิติสำหรับหน้าโปรไฟล์ ----------

export function getAttempts() {
  return read(ATTEMPTS_KEY, []);
}

export function getOverview() {
  const attempts = getAttempts();
  const answered = attempts.reduce((a, x) => a + x.total, 0);
  const correct = attempts.reduce((a, x) => a + x.score, 0);
  return {
    sessions: attempts.length,
    answered,
    correct,
    accuracyPct: answered ? Math.round((correct / answered) * 100) : null,
  };
}

/** map: 'YYYY-MM-DD' -> { questions, sessions } */
export function getDailyActivity() {
  const map = {};
  for (const a of getAttempts()) {
    const key = a.date || localDateKey(new Date(a.at));
    if (!map[key]) map[key] = { questions: 0, sessions: 0 };
    map[key].questions += a.total;
    map[key].sessions += 1;
  }
  return map;
}

export function getStreaks() {
  const days = Object.keys(getDailyActivity()).sort();
  if (days.length === 0) return { current: 0, longest: 0, lastActive: null, activeDays: 0 };

  // streak ที่ยาวที่สุดตลอดมา
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === addDays(days[i - 1], 1)) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // streak ปัจจุบัน — ต้องต่อเนื่องถึงวันนี้หรือเมื่อวาน จึงจะยังนับว่าไม่ขาด
  const today = localDateKey();
  const last = days[days.length - 1];
  let current = 0;
  if (last === today || last === addDays(today, -1)) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (days[i - 1] === addDays(days[i], -1)) current += 1;
      else break;
    }
  }

  return { current, longest, lastActive: last, activeDays: days.length };
}

/** ความแม่นยำรายวิชา จากประวัติทั้งหมด */
export function getSubjectAccuracy() {
  const acc = {};
  for (const a of getAttempts()) {
    if (!acc[a.subjectId]) acc[a.subjectId] = { answered: 0, correct: 0, sessions: 0 };
    acc[a.subjectId].answered += a.total;
    acc[a.subjectId].correct += a.score;
    acc[a.subjectId].sessions += 1;
  }
  for (const k of Object.keys(acc)) {
    acc[k].pct = acc[k].answered ? Math.round((acc[k].correct / acc[k].answered) * 100) : null;
  }
  return acc;
}

/** จำนวนข้อที่ตอบผิดแยกตามวิชา เรียงจากผิดมากไปน้อย */
export function getWrongBySubject() {
  const acc = getSubjectAccuracy();
  return Object.entries(acc)
    .map(([subjectId, v]) => ({
      subjectId,
      wrong: v.answered - v.correct,
      answered: v.answered,
      wrongPct: v.answered ? Math.round(((v.answered - v.correct) / v.answered) * 100) : 0,
    }))
    .filter((x) => x.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong);
}

/** ความแม่นยำรายหัวข้อย่อย — ใช้หา "จุดที่ควรพัฒนา" */
export function getTopicAccuracy() {
  const acc = {};
  for (const a of getAttempts()) {
    if (!acc[a.topicId]) acc[a.topicId] = { subjectId: a.subjectId, answered: 0, correct: 0 };
    acc[a.topicId].answered += a.total;
    acc[a.topicId].correct += a.score;
  }
  for (const k of Object.keys(acc)) {
    acc[k].pct = acc[k].answered ? Math.round((acc[k].correct / acc[k].answered) * 100) : null;
  }
  return acc;
}

export function resetProgress() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(ATTEMPTS_KEY);
  } catch {
    // ไม่ต้องทำอะไร
  }
}
