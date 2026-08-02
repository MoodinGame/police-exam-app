import { NextResponse } from 'next/server';
import { canAccessExamSet, getUserAccess } from '@/lib/serverAccess';
import { findUserByPhone, getSessionPhone } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function isOptionalHierarchySchemaError(error) {
  return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error?.code);
}

function mapSet(item, access) {
  const questionCount = item.exam_set_questions?.[0]?.count || 0;
  return {
    id: item.id,
    slug: item.slug,
    bank: item.bank,
    title: item.title,
    description: item.description || '',
    subjectId: item.subject_id,
    subjectName: item.content_subjects?.name || item.subject_id,
    topicId: item.topic_id,
    topicName: item.content_topics?.name || '',
    legacyTopicId: item.content_topics?.legacy_id || null,
    durationMinutes: item.duration_minutes,
    difficulty: item.difficulty || 'medium',
    isFree: Boolean(item.is_free),
    questionCount,
    canAccess: canAccessExamSet(access, item),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedBank = searchParams.get('bank');
    const bank = requestedBank === 'mock' ? 'mock' : 'practice';
    const subjectId = searchParams.get('subject')?.trim() || null;
    const supabase = getSupabaseAdmin();

    let user = null;
    let access = null;
    const phone = getSessionPhone();
    if (phone) {
      user = await findUserByPhone(phone);
      if (user) access = await getUserAccess(supabase, user.id);
    }

    let setQuery = supabase
      .from('exam_sets')
      .select('id, slug, bank, title, description, subject_id, topic_id, duration_minutes, difficulty, is_free, content_subjects(name), content_topics(name, legacy_id), exam_set_questions(count)')
      .eq('bank', bank)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);
    if (subjectId) setQuery = setQuery.eq('subject_id', subjectId);

    let questionCountQuery = supabase
      .from('question_bank_questions')
      .select('topic_id, content_topics(legacy_id)')
      .eq('bank', bank)
      .eq('is_active', true)
      .limit(5000);
    if (subjectId) questionCountQuery = questionCountQuery.eq('subject_id', subjectId);

    const [
      { data: sets, error: setsError },
      { data: subjects, error: subjectsError },
      { data: topics, error: topicsError },
      { data: questionTopics, error: questionTopicsError },
    ] = await Promise.all([
      setQuery,
      supabase.from('content_subjects').select('id, name, short_name, description, accent, sort_order').eq('is_active', true).order('sort_order'),
      supabase.from('content_topics').select('id, legacy_id, subject_id, name, description, sort_order').eq('is_active', true).order('sort_order'),
      questionCountQuery,
    ]);
    if (setsError) throw setsError;
    if (subjectsError) throw subjectsError;
    if (topicsError) throw topicsError;
    if (questionTopicsError) throw questionTopicsError;

    let topicGroups = [];
    let groupedTopics = (topics || []).map((item) => ({ ...item, group_id: null }));
    const [topicGroupsResult, groupedTopicsResult] = await Promise.all([
      supabase.from('content_topic_groups').select('id, subject_id, name, description, sort_order').eq('is_active', true).order('sort_order').order('name'),
      supabase.from('content_topics').select('id, legacy_id, subject_id, group_id, name, description, sort_order').eq('is_active', true).order('sort_order').order('name'),
    ]);
    if (topicGroupsResult.error && !isOptionalHierarchySchemaError(topicGroupsResult.error)) throw topicGroupsResult.error;
    if (groupedTopicsResult.error && !isOptionalHierarchySchemaError(groupedTopicsResult.error)) throw groupedTopicsResult.error;
    if (!topicGroupsResult.error) topicGroups = topicGroupsResult.data || [];
    if (!groupedTopicsResult.error) groupedTopics = groupedTopicsResult.data || [];

    const topicQuestionCounts = (questionTopics || []).reduce((counts, question) => {
      const key = question.content_topics?.legacy_id || question.topic_id;
      if (key) counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    return NextResponse.json({
      isLoggedIn: Boolean(user),
      isMember: Boolean(access?.isMember),
      subjects: subjects || [],
      topics: groupedTopics,
      topicGroups,
      topicQuestionCounts,
      sets: (sets || []).map((item) => mapSet(item, access)).filter((item) => item.questionCount > 0),
    });
  } catch (error) {
    if (error?.code === '42P01') {
      return NextResponse.json({ isLoggedIn: false, isMember: false, subjects: [], topics: [], topicGroups: [], sets: [], source: 'unavailable' });
    }
    return NextResponse.json({ error: 'ไม่สามารถโหลดรายการข้อสอบได้' }, { status: 500 });
  }
}
