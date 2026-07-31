import { questions } from './questions';

function seedFromDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// mulberry32 — deterministic PRNG ให้ได้ชุดคำถามเดิมตลอดทั้งวันจาก seed เดียวกัน
function mulberry32(seed) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function todayIsoDate() {
  const now = new Date();
  const bkk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const y = bkk.getFullYear();
  const m = String(bkk.getMonth() + 1).padStart(2, '0');
  const d = String(bkk.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDailyQuestions(dateStr, count = 5) {
  const rng = mulberry32(seedFromDate(dateStr));
  const pool = [...questions];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
