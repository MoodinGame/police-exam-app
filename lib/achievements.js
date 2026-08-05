import { subjects } from './subjects';
import { getAttempts, getOverview, getStreaks } from './progress';

function clamp(value, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((Math.min(value, target) / target) * 100));
}

export function getAchievements() {
  const attempts = getAttempts();
  const overview = getOverview();
  const streaks = getStreaks();
  const subjectCount = new Set(attempts.map((attempt) => attempt.subjectId)).size;
  const topicCount = new Set(attempts.map((attempt) => attempt.topicId).filter(Boolean)).size;
  const accuracy = overview.accuracyPct || 0;

  return [
    {
      id: 'first-step',
      name: 'ก้าวแรก',
      description: 'ทำแบบฝึกหัดครั้งแรก',
      icon: 'rocket',
      current: overview.sessions,
      target: 1,
      unit: 'ครั้ง',
      unlocked: overview.sessions >= 1,
    },
    {
      id: 'fighter',
      name: 'นักสู้',
      description: 'ทำแบบฝึกหัดครบ 10 ครั้ง',
      icon: 'flame',
      current: overview.sessions,
      target: 10,
      unit: 'ครั้ง',
      unlocked: overview.sessions >= 10,
    },
    {
      id: 'high-accuracy',
      name: 'แม่นยำสูง',
      description: 'ตอบถูกอย่างน้อย 80% จาก 20 ข้อขึ้นไป',
      icon: 'target',
      current: overview.answered >= 20 ? accuracy : overview.answered,
      target: overview.answered >= 20 ? 80 : 20,
      unit: overview.answered >= 20 ? '%' : 'ข้อ',
      unlocked: overview.answered >= 20 && accuracy >= 80,
    },
    {
      id: 'all-subjects',
      name: 'ครบทุกวิชา',
      description: 'ทำแบบฝึกหัดครบทั้ง 6 วิชา',
      icon: 'book',
      current: subjectCount,
      target: subjects.length,
      unit: 'วิชา',
      unlocked: subjectCount >= subjects.length,
    },
    {
      id: 'consistent',
      name: 'วินัยดี',
      description: 'รักษา streak ต่อเนื่อง 3 วัน',
      icon: 'medal',
      current: streaks.longest,
      target: 3,
      unit: 'วัน',
      unlocked: streaks.longest >= 3,
    },
    {
      id: 'marathon',
      name: 'มาราธอน',
      description: 'ฝึกตอบคำถามสะสมครบ 100 ข้อ',
      icon: 'trophy',
      current: overview.answered,
      target: 100,
      unit: 'ข้อ',
      unlocked: overview.answered >= 100,
    },
    {
      id: 'explorer',
      name: 'นักสำรวจ',
      description: 'ฝึกครบ 10 หัวข้อย่อย',
      icon: 'compass',
      current: topicCount,
      target: 10,
      unit: 'หัวข้อ',
      unlocked: topicCount >= 10,
    },
  ].map((achievement) => ({
    ...achievement,
    progress: clamp(achievement.current, achievement.target),
  }));
}
