import { NextResponse } from 'next/server';
import { canAccessExamSet, getUserAccess } from '@/lib/serverAccess';
import { apiErrorResponse, requireCurrentUser } from '@/lib/serverUser';
import { getMockExamTrack } from '@/lib/mockExamTracks';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const supabase = getSupabaseAdmin();
    const [access, setsResult, poolResult] = await Promise.all([
      getUserAccess(supabase, user.id),
      supabase
        .from('exam_sets')
        .select('id, slug, title, description, track_id, duration_minutes, difficulty, is_free, published_at')
        .eq('bank', 'mock')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      // Mock Exam สุ่มจากคลัง "แบบฝึกหัดรายวิชา" เท่านั้น เพื่อให้มีแหล่งข้อสอบเดียว
      // และไม่ต้องดูแลคำถาม Mock แยกอีกต่อไป
      supabase.from('question_bank_questions').select('subject_id').eq('bank', 'practice').eq('is_active', true).limit(5000),
    ]);
    if (setsResult.error) throw setsResult.error;
    if (poolResult.error) throw poolResult.error;

    const poolCounts = new Map();
    for (const row of poolResult.data || []) {
      poolCounts.set(row.subject_id, (poolCounts.get(row.subject_id) || 0) + 1);
    }
    const isTrackPoolReady = (track) => track.blueprint.every((entry) => (poolCounts.get(entry.subjectId) || 0) >= entry.questionCount);

    const exams = (setsResult.data || [])
      .map((row) => {
        const track = getMockExamTrack(row.track_id);
        return {
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description || '',
          trackId: track?.id || row.track_id || null,
          trackName: track?.name || null,
          trackShortName: track?.shortName || null,
          blueprint: track?.blueprint || [],
          durationMinutes: track?.durationMinutes || row.duration_minutes || 180,
          difficulty: row.difficulty || null,
          isFree: Boolean(row.is_free),
          canAccess: canAccessExamSet(access, { ...row, bank: 'mock' }),
          totalQuestions: track?.totalQuestions || 0,
          passScore: track?.passScore || 0,
          isCompleteMock: Boolean(track && isTrackPoolReady(track)),
        };
      })
      .filter((exam) => exam.isCompleteMock);
    return NextResponse.json({ exams, isMember: access.isMember });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
