import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function startOfPeriod(period) {
  const now = new Date();
  if (period === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  if (period === 'weekly') {
    const day = now.getDay();
    const offset = day === 0 ? 6 : day - 1;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset).toISOString();
  }
  return null;
}

function getBadge(entry) {
  const accuracy = entry.total ? (entry.score / entry.total) * 100 : 0;
  if (accuracy >= 85 && entry.attempts >= 3) return 'sharpshooter';
  if (entry.attempts >= 10) return 'persistent';
  if (entry.subjects.size >= 5) return 'strategist';
  if (entry.attempts > 0) return 'challenger';
  return 'challenger';
}

export async function GET(request) {
  try {
    const currentUser = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const period = ['overall', 'monthly', 'weekly'].includes(searchParams.get('period'))
      ? searchParams.get('period')
      : 'overall';
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('exam_attempts')
      .select('user_id, subject_id, total_questions, correct_answers, completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10000);
    const from = startOfPeriod(period);
    if (from) query = query.gte('completed_at', from);
    const { data: attempts, error } = await query;
    if (error) throw error;

    const byUser = new Map();
    (attempts || []).forEach((attempt) => {
      const row = byUser.get(attempt.user_id) || {
        userId: attempt.user_id,
        score: 0,
        total: 0,
        attempts: 0,
        subjects: new Set(),
      };
      row.score += attempt.correct_answers || 0;
      row.total += attempt.total_questions || 0;
      row.attempts += 1;
      if (attempt.subject_id) row.subjects.add(attempt.subject_id);
      byUser.set(attempt.user_id, row);
    });

    const ids = [...byUser.keys()];
    const { data: users, error: userError } = ids.length
      ? await supabase.from('app_users').select('id, username').in('id', ids)
      : { data: [], error: null };
    if (userError) throw userError;
    const names = new Map((users || []).map((user) => [user.id, user.username]));
    const entries = [...byUser.values()]
      .map((entry) => ({
        userId: entry.userId,
        name: names.get(entry.userId) || 'ผู้ใช้งาน',
        score: entry.score,
        attempts: entry.attempts,
        badge: getBadge(entry),
        movement: 0,
      }))
      .sort((a, b) => b.score - a.score || a.attempts - b.attempts)
      .slice(0, 100);

    return NextResponse.json({ period, currentUserId: currentUser.id, entries });
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json(
      { error: status === 500 ? 'ไม่สามารถโหลดอันดับได้' : error.message },
      { status },
    );
  }
}
