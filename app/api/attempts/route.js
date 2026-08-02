import { NextResponse } from 'next/server';
import { isFreePracticeTopic } from '@/lib/entitlements';
import { canAccessExamSet, canUseArea, getUserAccess } from '@/lib/serverAccess';
import { requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function toAnswerIndex(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 5 ? parsed : -1;
}

function mapResult(question, answerIndex) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const correctIndex = choices.findIndex((choice) => choice.id === question.correct_choice);
  return {
    id: question.id,
    answerIndex: correctIndex,
    selectedIndex: answerIndex,
    correct: answerIndex === correctIndex,
    explanation: question.explanation || '',
  };
}

export async function GET(request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const bank = searchParams.get('bank');
    const requestedLimit = Number(searchParams.get('limit') || 100);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 100;
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('exam_attempts')
      .select('id, set_id, bank, subject_id, topic_id, title, status, answers, total_questions, correct_answers, elapsed_seconds, started_at, completed_at, content_subjects(name), content_topics(name, legacy_id), exam_sets(slug, title)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);
    if (['practice', 'mock', 'random'].includes(bank)) query = query.eq('bank', bank);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ attempts: data || [] });
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json({ error: status === 500 ? 'ไม่สามารถโหลดประวัติการสอบได้' : error.message }, { status });
  }
}

export async function POST(request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const bank = ['practice', 'mock', 'random'].includes(body.bank) ? body.bank : null;
    const questionIds = Array.isArray(body.questionIds) ? [...new Set(body.questionIds.filter((id) => typeof id === 'string'))].slice(0, 300) : [];
    const rawAnswers = body.answers && typeof body.answers === 'object' ? body.answers : {};
    if (!bank || questionIds.length === 0) throw requestError('ข้อมูลการส่งข้อสอบไม่ครบถ้วน');

    const supabase = getSupabaseAdmin();
    const access = await getUserAccess(supabase, user.id);
    let set = null;
    if (body.setId) {
      const { data, error } = await supabase
        .from('exam_sets')
        .select('id, title, bank, subject_id, topic_id, is_free, status')
        .eq('id', body.setId)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.bank !== bank) throw requestError('ไม่พบชุดข้อสอบที่เลือก', 404);
      set = data;
      if (set.status !== 'published') throw requestError('This exam set is not available', 404);
      if (!canAccessExamSet(access, set)) throw requestError('This exam set is not available for this account', 403);
      if (bank !== 'mock') {
        // Mock Exam สุ่มข้อสอบจากทั้งคลังตอนเริ่มสอบ จึงไม่ผูกกับ exam_set_questions แล้ว
        // ส่วนแบบฝึกหัดที่อ้างอิงชุดที่แอดมินคัดไว้ ยังต้องตรวจว่าข้อที่ส่งมาอยู่ในชุดจริง
        const { data: assignments, error: assignmentError } = await supabase
          .from('exam_set_questions')
          .select('question_id')
          .eq('set_id', set.id)
          .in('question_id', questionIds);
        if (assignmentError) throw assignmentError;
        if ((assignments || []).length !== questionIds.length) throw requestError('พบข้อสอบที่ไม่อยู่ในชุดที่เลือก', 400);
      }
    }

    // ไม่กรองตาม bank แล้ว — ข้อสอบใช้ร่วมกันได้ทั้งแบบฝึกหัด, Random Quiz และ Mock Exam
    const { data: questions, error: questionError } = await supabase
      .from('question_bank_questions')
      .select('id, subject_id, topic_id, stem, choices, correct_choice, explanation, content_topics(legacy_id)')
      .eq('is_active', true)
      .in('id', questionIds);
    if (questionError) throw questionError;
    if ((questions || []).length !== questionIds.length) throw requestError('ข้อสอบบางข้อไม่พร้อมใช้งานแล้ว', 409);
    if (!set && !canUseArea(access, 'practice')) {
      const onlyFreePracticeQuestions = bank !== 'mock' && (questions || []).every(
        (question) => isFreePracticeTopic(question.content_topics?.legacy_id),
      );
      if (!onlyFreePracticeQuestions) throw requestError('ชุดข้อสอบนี้สำหรับสมาชิก', 403);
    }

    const byId = new Map((questions || []).map((item) => [item.id, item]));
    const ordered = questionIds.map((id) => byId.get(id));
    const normalizedAnswers = {};
    const results = ordered.map((question) => {
      const answerIndex = toAnswerIndex(rawAnswers[question.id]);
      normalizedAnswers[question.id] = answerIndex >= 0 ? answerIndex : null;
      return mapResult(question, answerIndex);
    });
    const correctAnswers = results.filter((item) => item.correct).length;
    const elapsedSeconds = Math.min(Math.max(Number(body.elapsedSeconds) || 0, 0), 24 * 60 * 60);
    const subjectId = set?.subject_id || body.subjectId || ordered[0]?.subject_id || null;
    const topicId = set?.topic_id || body.topicId || ordered[0]?.topic_id || null;
    const title = String(set?.title || body.title || 'แบบฝึกหัด').trim().slice(0, 180) || 'แบบฝึกหัด';

    const { data: attempt, error: attemptError } = await supabase
      .from('exam_attempts')
      .insert({
        user_id: user.id,
        set_id: set?.id || null,
        bank,
        subject_id: subjectId,
        topic_id: topicId,
        title,
        status: 'completed',
        answers: normalizedAnswers,
        total_questions: ordered.length,
        correct_answers: correctAnswers,
        elapsed_seconds: elapsedSeconds,
        completed_at: new Date().toISOString(),
      })
      .select('id, bank, title, total_questions, correct_answers, elapsed_seconds, completed_at')
      .single();
    if (attemptError) throw attemptError;
    return NextResponse.json({ attempt, results });
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json({ error: status === 500 ? 'ไม่สามารถบันทึกผลการสอบได้' : error.message }, { status });
  }
}
