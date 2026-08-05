// ข้อมูลชุดนี้ใช้สาธิตหน้าจออันดับระหว่างรอเชื่อมข้อมูลคะแนนจริงจากฐานข้อมูล

export const currentUserId = 'u-me';

export const leaderboardBadges = {
  sharpshooter: {
    label: 'แม่นยำสูง',
    description: 'คะแนนเฉลี่ย 85% ขึ้นไป',
    tone: 'emerald',
  },
  persistent: {
    label: 'นักสู้',
    description: 'ฝึกต่อเนื่องสม่ำเสมอ',
    tone: 'amber',
  },
  strategist: {
    label: 'นักวางแผน',
    description: 'ทำครบทุกวิชา',
    tone: 'violet',
  },
  fastLearner: {
    label: 'พัฒนาไว',
    description: 'คะแนนดีขึ้นต่อเนื่อง',
    tone: 'cyan',
  },
  challenger: {
    label: 'ผู้ท้าชิง',
    description: 'เริ่มต้นทำข้อสอบแล้ว',
    tone: 'slate',
  },
};

const members = {
  'u-1': { name: 'ณัฐวุฒิ ส.', badge: 'sharpshooter', movement: 2 },
  'u-2': { name: 'ปิยะดา ก.', badge: 'persistent', movement: -1 },
  'u-3': { name: 'ธีรภัทร ว.', badge: 'strategist', movement: 4 },
  'u-4': { name: 'สุชาดา พ.', badge: 'fastLearner', movement: 1 },
  'u-5': { name: 'กิตติศักดิ์ ม.', badge: 'persistent', movement: 0 },
  'u-6': { name: 'วรรณิศา จ.', badge: 'sharpshooter', movement: 3 },
  'u-7': { name: 'อนุชา บ.', badge: 'challenger', movement: -2 },
  'u-8': { name: 'พรทิพย์ ล.', badge: 'fastLearner', movement: 0 },
  'u-9': { name: 'ชัยวัฒน์ ร.', badge: 'challenger', movement: 1 },
  'u-me': { name: 'คุณ', badge: 'persistent', movement: 5 },
};

function entry(userId, score, attempts) {
  return { userId, score, attempts, ...members[userId] };
}

export const leaderboardOverall = [
  entry('u-1', 142, 12),
  entry('u-2', 138, 15),
  entry('u-3', 135, 10),
  entry('u-4', 129, 9),
  entry('u-me', 121, 8),
  entry('u-5', 118, 11),
  entry('u-6', 112, 7),
  entry('u-7', 105, 6),
  entry('u-8', 98, 8),
  entry('u-9', 90, 5),
];

export const leaderboardMonthly = [
  entry('u-3', 86, 6),
  entry('u-1', 82, 6),
  entry('u-me', 76, 5),
  entry('u-6', 71, 5),
  entry('u-4', 69, 4),
  entry('u-2', 65, 5),
  entry('u-5', 58, 4),
  entry('u-8', 54, 4),
  entry('u-7', 48, 3),
  entry('u-9', 41, 3),
];

export const leaderboardWeekly = [
  entry('u-3', 45, 3),
  entry('u-me', 41, 3),
  entry('u-1', 38, 2),
  entry('u-4', 33, 2),
  entry('u-2', 30, 2),
  entry('u-6', 27, 2),
  entry('u-5', 22, 1),
];

export function withRank(list) {
  const sorted = [...list].sort((a, b) => b.score - a.score || a.attempts - b.attempts);

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index > 0 && entry.score === sorted[index - 1].score ? sorted[index - 1].rank : index + 1,
  }));
}
