import { NextResponse } from 'next/server';
import { canUseArea, getUserAccess } from '@/lib/serverAccess';
import { apiErrorResponse, requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function isMissingTable(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

function isMissingColumn(error) {
  return error?.code === '42703' || error?.code === 'PGRST204';
}

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function mapStudyQuestion(question) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const answer = choices.find((choice) => choice?.id === question.correct_choice)?.text || '';

  return {
    id: question.id,
    question: question.stem,
    answer,
    explanation: question.explanation || '',
    difficulty: question.difficulty || 'medium',
  };
}

async function getCatalog(supabase) {
  const [subjectsResult, topicsResult, articlesResult, questionsResult] = await Promise.all([
    supabase
      .from('content_subjects')
      .select('id, name, short_name, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('content_topics')
      .select('id, legacy_id, subject_id, name, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('knowledge_articles')
      .select('id, subject_id, topic_id, title, summary, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false }),
    supabase
      .from('question_bank_questions')
      .select('subject_id, topic_id')
      .eq('bank', 'practice')
      .eq('is_active', true)
      .limit(10000),
  ]);

  const catalogError = subjectsResult.error || topicsResult.error || questionsResult.error;
  if (catalogError) throw catalogError;

  // The knowledge article migration is optional. The learning catalog must still
  // work when only the exercise-bank migrations have been applied.
  if (articlesResult.error && !isMissingTable(articlesResult.error)) throw articlesResult.error;

  const topicQuestionCounts = {};
  const subjectQuestionCounts = {};
  for (const question of questionsResult.data || []) {
    if (question.topic_id) topicQuestionCounts[question.topic_id] = (topicQuestionCounts[question.topic_id] || 0) + 1;
    if (question.subject_id) subjectQuestionCounts[question.subject_id] = (subjectQuestionCounts[question.subject_id] || 0) + 1;
  }

  return {
    subjects: subjectsResult.data || [],
    topics: topicsResult.data || [],
    articles: articlesResult.error ? [] : articlesResult.data || [],
    topicQuestionCounts,
    subjectQuestionCounts,
    source: 'database',
  };
}

async function getTopicArticle(supabase, topicId) {
  let result = await supabase
    .from('knowledge_articles')
    .select('id, title, summary, body, key_points, techniques, formula_cards, pitfalls, exam_guide, updated_at')
    .eq('topic_id', topicId)
    .eq('is_published', true)
    .maybeSingle();

  // Deploying the UI before the new migration should not hide existing lessons.
  if (isMissingColumn(result.error)) {
    result = await supabase
      .from('knowledge_articles')
      .select('id, title, summary, body, key_points, pitfalls, exam_guide, updated_at')
      .eq('topic_id', topicId)
      .eq('is_published', true)
      .maybeSingle();
    if (result.data) result.data = { ...result.data, techniques: [], formula_cards: [] };
  }
  return result;
}

async function getTopicStudyData(supabase, topicId) {
  const user = await requireCurrentUser();
  const access = await getUserAccess(supabase, user.id);
  if (!canUseArea(access, 'knowledge')) {
    throw requestError('คลังความรู้สำหรับสมาชิก กรุณาเปิดสิทธิ์แพ็กเกจเพื่ออ่านบทเรียนจากคลังข้อสอบ', 403);
  }

  const topicResult = await supabase
    .from('content_topics')
    .select('id, subject_id, name, description')
    .eq('id', topicId)
    .eq('is_active', true)
    .maybeSingle();
  if (topicResult.error) throw topicResult.error;
  if (!topicResult.data) throw requestError('ไม่พบหัวข้อที่เลือก', 404);

  const [articleResult, questionsResult] = await Promise.all([
    getTopicArticle(supabase, topicId),
    supabase
      .from('question_bank_questions')
      .select('id, stem, choices, correct_choice, explanation, difficulty')
      .eq('topic_id', topicId)
      .eq('bank', 'practice')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(3),
  ]);

  if (questionsResult.error) throw questionsResult.error;
  if (articleResult.error && !isMissingTable(articleResult.error)) throw articleResult.error;

  return {
    topic: topicResult.data,
    article: articleResult.error ? null : articleResult.data,
    questions: (questionsResult.data || []).map(mapStudyQuestion),
    source: 'database',
  };
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    const topicId = new URL(request.url).searchParams.get('topic')?.trim();

    if (topicId) return NextResponse.json(await getTopicStudyData(supabase, topicId));
    return NextResponse.json(await getCatalog(supabase));
  } catch (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({
        subjects: [],
        topics: [],
        articles: [],
        topicQuestionCounts: {},
        subjectQuestionCounts: {},
        source: 'unavailable',
      });
    }
    return apiErrorResponse(error);
  }
}
