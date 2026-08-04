import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function localDateKey(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(value, days) {
  const date = new Date(`${value}T00:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculateStreak(dateKeys) {
  const uniqueDates = [...new Set(dateKeys)].sort();
  const dateSet = new Set(uniqueDates);
  const today = localDateKey(new Date());
  let current = 0;
  let cursor = today;
  while (dateSet.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let running = 0;
  let previous = null;
  uniqueDates.forEach((date) => {
    running = previous && date === addDays(previous, 1) ? running + 1 : 1;
    longest = Math.max(longest, running);
    previous = date;
  });
  return { current, longest, activeDays: uniqueDates.length, lastActive: uniqueDates.at(-1) || null };
}

function calculateGroups(rows, field, labelField) {
  const groups = new Map();
  rows.forEach((attempt) => {
    const id = attempt[field];
    if (!id) return;
    const relation = field === 'subject_id' ? attempt.content_subjects : attempt.content_topics;
    const current = groups.get(id) || {
      id,
      name: relation?.name || id,
      legacyId: relation?.legacy_id || null,
      subjectId: attempt.subject_id || null,
      answered: 0,
      correct: 0,
      sessions: 0,
    };
    current.answered += attempt.total_questions || 0;
    current.correct += attempt.correct_answers || 0;
    current.sessions += 1;
    // rows เรียงจากใหม่ไปเก่า ครั้งแรกที่เจอหัวข้อนี้จึงเป็นผลล่าสุด — การ์ดแบบฝึกหัดใช้ตัวนี้แสดง "เคยทำแล้ว"
    if (current.lastTotal === undefined) {
      current.lastScore = attempt.correct_answers || 0;
      current.lastTotal = attempt.total_questions || 0;
      current.lastAt = attempt.completed_at || null;
    }
    groups.set(id, current);
  });
  return [...groups.values()].map((item) => ({
    ...item,
    pct: item.answered ? Math.round((item.correct / item.answered) * 100) : null,
    [labelField]: item.name,
  }));
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const supabase = getSupabaseAdmin();
    const { data: attempts, error } = await supabase
      .from('exam_attempts')
      .select('id, bank, subject_id, topic_id, title, total_questions, correct_answers, elapsed_seconds, completed_at, content_subjects(name), content_topics(name, legacy_id)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(500);
    if (error) throw error;

    const rows = attempts || [];
    const answered = rows.reduce((sum, attempt) => sum + (attempt.total_questions || 0), 0);
    const correct = rows.reduce((sum, attempt) => sum + (attempt.correct_answers || 0), 0);
    const activity = {};
    rows.forEach((attempt) => {
      if (!attempt.completed_at) return;
      const key = localDateKey(attempt.completed_at);
      const current = activity[key] || { questions: 0, sessions: 0 };
      current.questions += attempt.total_questions || 0;
      current.sessions += 1;
      activity[key] = current;
    });

    const subjectStats = calculateGroups(rows, 'subject_id', 'subjectName');
    const topicStats = calculateGroups(rows, 'topic_id', 'topicName');
    const recentAttempts = rows.slice(0, 10).map((attempt) => ({
      id: attempt.id,
      bank: attempt.bank,
      title: attempt.title,
      subjectName: attempt.content_subjects?.name || 'แบบฝึกหัด',
      score: attempt.correct_answers || 0,
      total: attempt.total_questions || 0,
      percent: attempt.total_questions ? Math.round(((attempt.correct_answers || 0) / attempt.total_questions) * 100) : 0,
      completedAt: attempt.completed_at,
    }));

    return NextResponse.json({
      overview: {
        sessions: rows.length,
        answered,
        correct,
        accuracyPct: answered ? Math.round((correct / answered) * 100) : null,
      },
      streaks: calculateStreak(Object.keys(activity)),
      activity,
      subjectStats,
      topicStats,
      weakSubjects: subjectStats.filter((item) => item.pct !== null).sort((a, b) => a.pct - b.pct).slice(0, 3),
      weakTopics: topicStats.filter((item) => item.pct !== null).sort((a, b) => a.pct - b.pct).slice(0, 6),
      recentAttempts,
      completed: rows.filter((attempt) => attempt.total_questions && ((attempt.correct_answers || 0) / attempt.total_questions) >= 0.6).length,
      highest: rows.length ? Math.max(...rows.map((attempt) => attempt.total_questions ? Math.round(((attempt.correct_answers || 0) / attempt.total_questions) * 100) : 0)) : null,
    });
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json(
      { error: status === 500 ? 'ไม่สามารถโหลดสถิติได้' : error.message },
      { status },
    );
  }
}
