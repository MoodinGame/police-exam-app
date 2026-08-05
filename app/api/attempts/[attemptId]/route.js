import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function mapQuestion(question) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  return {
    id: question.id,
    subjectId: question.subject_id,
    topicId: question.topic_id,
    question: question.stem,
    choices: choices.map((choice) => choice.text),
    answerIndex: choices.findIndex((choice) => choice.id === question.correct_choice),
    explanation: question.explanation || '',
    difficulty: question.difficulty || 'medium',
  };
}

export async function GET(_request, { params }) {
  try {
    const user = await requireCurrentUser();
    const { attemptId } = await params;
    if (!attemptId) return NextResponse.json({ error: 'ไม่พบรายการผลสอบ' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: attempt, error: attemptError } = await supabase
      .from('exam_attempts')
      .select('id, set_id, bank, subject_id, topic_id, title, status, answers, total_questions, correct_answers, elapsed_seconds, started_at, completed_at, content_subjects(name), content_topics(name, legacy_id), exam_sets(slug, title)')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .maybeSingle();
    if (attemptError) throw attemptError;
    if (!attempt) return NextResponse.json({ error: 'ไม่พบรายการผลสอบ' }, { status: 404 });

    const questionIds = Object.keys(attempt.answers || {});
    if (!questionIds.length) return NextResponse.json({ attempt, questions: [] });

    const { data: questions, error: questionError } = await supabase
      .from('question_bank_questions')
      .select('id, subject_id, topic_id, stem, choices, correct_choice, explanation, difficulty')
      .in('id', questionIds);
    if (questionError) throw questionError;

    const byId = new Map((questions || []).map((question) => [question.id, question]));
    return NextResponse.json({
      attempt,
      questions: questionIds.map((id) => byId.get(id)).filter(Boolean).map(mapQuestion),
    });
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json(
      { error: status === 500 ? 'ไม่สามารถโหลดเฉลยย้อนหลังได้' : error.message },
      { status },
    );
  }
}
