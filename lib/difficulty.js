// ระดับความยากเป็นการประเมินจากผู้ออกข้อสอบตามเนื้อหาของแต่ละข้อ
// ไม่ได้มาจากสถิติการตอบของผู้ใช้จริง — ถ้าต่อฐานข้อมูลแล้วควรคำนวณจากอัตราการตอบถูกจริงแทน

export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

export const difficultyStyles = {
  easy: { label: 'ง่าย', chip: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  medium: { label: 'ปานกลาง', chip: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  hard: { label: 'ยาก', chip: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

export function getDifficulty(level) {
  return difficultyStyles[level] ?? null;
}

/** นับจำนวนข้อแต่ละระดับ แล้วสรุปเป็นระดับรวมของชุด (ใช้ระดับที่มีข้อมากที่สุด) */
export function summarizeDifficulty(questionList) {
  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const q of questionList) {
    if (counts[q.difficulty] !== undefined) counts[q.difficulty] += 1;
  }
  const total = counts.easy + counts.medium + counts.hard;
  if (total === 0) return { counts, total: 0, overall: null };

  // เลือกระดับที่มีจำนวนข้อมากที่สุด ถ้าเท่ากันให้ยึดระดับที่ยากกว่า
  let overall = 'easy';
  let best = -1;
  for (const level of DIFFICULTY_ORDER) {
    if (counts[level] >= best) {
      best = counts[level];
      overall = level;
    }
  }
  return { counts, total, overall };
}
