import { NextResponse } from 'next/server';
import { isFreePracticeTopic } from '@/lib/entitlements';
import { canAccessExamSet, canUseArea, getUserAccess } from '@/lib/serverAccess';
import { requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { shuffle } from '@/lib/shuffle';

export const runtime = 'nodejs';

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

const RANDOM_QUIZ_FREE_LIMIT = 3;

function parseTopicIds(value) {
  return [...new Set(String(value || '').split(',').map((item) => item.trim()).filter(Boolean))].slice(0, 50);
}

function mapQuestion(question) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  return {
    id: question.id,
    subjectId: question.subject_id,
    topicId: question.content_topics?.legacy_id || question.content_topics?.id || null,
    question: question.stem,
    choices: choices.map((choice) => choice.text),
    answerIndex: choices.findIndex((choice) => choice.id === question.correct_choice),
    explanation: question.explanation || '',
    difficulty: question.difficulty || 'medium',
  };
}

export async function GET(request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subject')?.trim();
    const requestedTopics = parseTopicIds(searchParams.get('topics') || searchParams.get('topic'));
    const setSlug = searchParams.get('set')?.trim();
    const isRandomQuiz = searchParams.get('mode') === 'random';
    if (!subjectId) throw requestError('กรุณาระบุวิชา');

    const supabase = getSupabaseAdmin();
    const access = await getUserAccess(supabase, user.id);
    if (setSlug) {
      const { data: set, error: setError } = await supabase
        .from('exam_sets')
        .select('id, slug, title, subject_id, topic_id, duration_minutes, difficulty, is_free, bank')
        .eq('slug', setSlug)
        .eq('bank', 'practice')
        .eq('status', 'published')
        .maybeSingle();
      if (setError) throw setError;
      if (!set) throw requestError('ไม่พบชุดข้อสอบนี้', 404);
      if (set.subject_id !== subjectId) throw requestError('ชุดข้อสอบไม่ตรงกับวิชาที่เลือก');
      if (!canAccessExamSet(access, set)) throw requestError('ชุดข้อสอบนี้ยังไม่ได้เปิดสิทธิ์ให้บัญชีของคุณ', 403);

      const { data: rows, error: questionError } = await supabase
        .from('exam_set_questions')
        .select('position, question_bank_questions(id, subject_id, stem, choices, correct_choice, explanation, difficulty, content_topics(id, legacy_id))')
        .eq('set_id', set.id)
        .order('position');
      if (questionError) throw questionError;
      const questions = (rows || [])
        .map((row) => row.question_bank_questions)
        .filter(Boolean)
        .map(mapQuestion)
        .filter((question) => question.choices.length >= 2 && question.answerIndex >= 0);
      return NextResponse.json({
        questions,
        source: 'database',
        set: { id: set.id, slug: set.slug, title: set.title, durationMinutes: set.duration_minutes, difficulty: set.difficulty, topicId: set.topic_id },
      });
    }

    const canUseFreeTopics = requestedTopics.length > 0 && requestedTopics.every(isFreePracticeTopic);
    const hasFullAccess = canUseArea(access, 'practice');
    if (!hasFullAccess && !canUseFreeTopics && !isRandomQuiz) {
      throw requestError('คลังข้อสอบนี้สำหรับสมาชิก กรุณาเลือกชุดทดลองฟรีหรือสมัครสมาชิก', 403);
    }
    // Random Quiz has its own lighter policy: free accounts still get a taste of
    // every subject, just capped, instead of being blocked outright like Practice.
    const hasUnlimitedRandomQuiz = hasFullAccess || Boolean(access.permissions?.randomQuiz);
    const randomQuizCapped = isRandomQuiz && !hasUnlimitedRandomQuiz;

    let topicIds = null;
    if (requestedTopics.length > 0) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const directIds = requestedTopics.filter((item) => uuidPattern.test(item));
      const legacyIds = requestedTopics.filter((item) => !uuidPattern.test(item));
      const requests = [];
      if (legacyIds.length) requests.push(supabase.from('content_topics').select('id').eq('subject_id', subjectId).in('legacy_id', legacyIds));
      if (directIds.length) requests.push(supabase.from('content_topics').select('id').eq('subject_id', subjectId).in('id', directIds));
      const topicResults = await Promise.all(requests);
      const topicError = topicResults.find((result) => result.error)?.error;
      if (topicError) throw topicError;
      topicIds = [...new Set(topicResults.flatMap((result) => (result.data || []).map((topic) => topic.id)))];
      if (topicIds.length === 0) return NextResponse.json({ questions: [], source: 'database' });
    }

    // เปิดกว้างทั้งคลัง ไม่กรองตาม bank — ข้อสอบที่แอดมินพิมพ์ไว้ครั้งเดียวจึงใช้ได้
    // ทั้งแบบฝึกหัดรายวิชาและสุ่มเข้า Mock Exam โดยไม่ต้องพิมพ์ซ้ำ
    let query = supabase
      .from('question_bank_questions')
      .select('id, subject_id, stem, choices, correct_choice, explanation, difficulty, content_topics(id, legacy_id)')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(300);
    if (topicIds) query = query.in('topic_id', topicIds);
    const { data, error } = await query;
    if (error) throw error;
    let questions = (data || []).map(mapQuestion).filter((question) => question.choices.length >= 2 && question.answerIndex >= 0);
    if (randomQuizCapped) questions = shuffle(questions).slice(0, RANDOM_QUIZ_FREE_LIMIT);
    return NextResponse.json({ questions, source: 'database', freeLimit: randomQuizCapped ? RANDOM_QUIZ_FREE_LIMIT : null });
  } catch (error) {
    if (error?.code === '42P01') return NextResponse.json({ questions: [], source: 'unavailable' });
    const status = error?.status || 500;
    return NextResponse.json({ error: status === 500 ? 'ไม่สามารถโหลดคลังข้อสอบได้' : error.message }, { status });
  }
}
