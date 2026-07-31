// หมายเหตุ: อันดับชุดนี้เป็น "ตัวอย่าง" สำหรับสาธิตการทำงานของระบบเท่านั้น
// ยังไม่เชื่อมกับข้อมูลผู้ใช้จริง/ฐานข้อมูล

export const currentUserId = 'u-me';

export const leaderboardOverall = [
  { userId: 'u-1', name: 'ณัฐวุฒิ ส.', score: 142, attempts: 12 },
  { userId: 'u-2', name: 'ปิยะดา ก.', score: 138, attempts: 15 },
  { userId: 'u-3', name: 'ธีรภัทร์ ว.', score: 135, attempts: 10 },
  { userId: 'u-4', name: 'สุชาดา พ.', score: 129, attempts: 9 },
  { userId: 'u-me', name: 'คุณ', score: 121, attempts: 8 },
  { userId: 'u-5', name: 'กิตติศักดิ์ ม.', score: 118, attempts: 11 },
  { userId: 'u-6', name: 'วรรณิษา จ.', score: 112, attempts: 7 },
  { userId: 'u-7', name: 'อนุชา บ.', score: 105, attempts: 6 },
  { userId: 'u-8', name: 'พรทิพย์ ล.', score: 98, attempts: 8 },
  { userId: 'u-9', name: 'ชัยวัฒน์ ร.', score: 90, attempts: 5 },
];

export const leaderboardWeekly = [
  { userId: 'u-3', name: 'ธีรภัทร์ ว.', score: 45, attempts: 3 },
  { userId: 'u-me', name: 'คุณ', score: 41, attempts: 3 },
  { userId: 'u-1', name: 'ณัฐวุฒิ ส.', score: 38, attempts: 2 },
  { userId: 'u-4', name: 'สุชาดา พ.', score: 33, attempts: 2 },
  { userId: 'u-2', name: 'ปิยะดา ก.', score: 30, attempts: 2 },
  { userId: 'u-6', name: 'วรรณิษา จ.', score: 27, attempts: 2 },
  { userId: 'u-5', name: 'กิตติศักดิ์ ม.', score: 22, attempts: 1 },
];

export function withRank(list) {
  return [...list]
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}
