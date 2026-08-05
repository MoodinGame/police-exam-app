import { NextResponse } from 'next/server';
import { canAccessExamSet, getUserAccess } from '@/lib/serverAccess';
import { apiErrorResponse, requireCurrentUser } from '@/lib/serverUser';
import { getMockExamTrack } from '@/lib/mockExamTracks';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { shuffle } from '@/lib/shuffle';

export const runtime = 'nodejs';

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function mapQuestion(question) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  return {
    id: question.id,
    subjectId: question.subject_id,
    question: question.stem,
    choices: choices.map((choice) => choice.text),
    answerIndex: choices.findIndex((choice) => choice.id === question.correct_choice),
    explanation: question.explanation || '',
    difficulty: question.difficulty || 'medium',
  };
}

const QUESTION_COLUMNS = 'id, subject_id, stem, choices, correct_choice, explanation, difficulty, is_active';

// ทำต่อจากที่พักไว้ — ดึงเฉพาะข้อที่สุ่มไว้ตอนเริ่มสอบครั้งแรก (เก็บรายชื่อไว้ใน session
// ฝั่ง client) เพื่อให้คำตอบที่ทำค้างไว้ยังตรงกับข้อเดิมทุกข้อ ไม่ใช่สุ่มชุดใหม่ทุกครั้งที่โหลดหน้า
async function loadResumeQuestions(supabase, ids) {
  const { data, error } = await supabase
    .from('question_bank_questions')
    .select(QUESTION_COLUMNS)
    .eq('bank', 'practice')
    .in('id', ids);
  if (error) throw error;
  const byId = new Map((data || []).map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id)).filter((row) => row && row.is_active);
}

// เริ่มสอบใหม่ — สุ่มข้อสอบตามสัดส่วนของแต่ละวิชาในสายงานนี้ จากคลังแบบฝึกหัดรายวิชา
// จึงไม่ต้องสร้างหรือดูแลคลังคำถาม Mock Exam แยกต่างหาก
async function drawRandomQuestions(supabase, track) {
  const subjectResults = await Promise.all(track.blueprint.map((entry) => supabase
    .from('question_bank_questions')
    .select(QUESTION_COLUMNS)
    .eq('bank', 'practice')
    .eq('subject_id', entry.subjectId)
    .eq('is_active', true)));
  const failedResult = subjectResults.find((result) => result.error);
  if (failedResult) throw failedResult.error;

  const shortfall = track.blueprint.find((entry, index) => (subjectResults[index].data || []).length < entry.questionCount);
  if (shortfall) {
    const available = subjectResults[track.blueprint.indexOf(shortfall)].data?.length || 0;
    throw requestError(`คลังข้อสอบวิชา${shortfall.subjectName}ยังไม่พอสำหรับสุ่มเข้า Mock Exam (ต้องการ ${shortfall.questionCount} ข้อ ขณะนี้มี ${available} ข้อ)`, 409);
  }

  return track.blueprint.flatMap((entry, index) => shuffle(subjectResults[index].data || []).slice(0, entry.questionCount));
}

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const user = await requireCurrentUser();
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const resumeIds = [...new Set((searchParams.get('resume') || '').split(',').map((id) => id.trim()).filter(Boolean))].slice(0, 300);

    const { data: examSet, error: setError } = await supabase
      .from('exam_sets')
      .select('id, slug, title, description, track_id, duration_minutes, difficulty, is_free, status, subject_id')
      .eq('slug', slug)
      .eq('bank', 'mock')
      .maybeSingle();
    if (setError) throw setError;
    if (!examSet || examSet.status !== 'published') throw requestError('ไม่พบชุดข้อสอบนี้ หรือยังไม่เปิดให้สอบ', 404);

    const access = await getUserAccess(supabase, user.id);
    if (!canAccessExamSet(access, { ...examSet, bank: 'mock' })) {
      throw requestError('ชุดข้อสอบนี้ยังไม่ได้เปิดสิทธิ์ให้บัญชีของคุณ', 403);
    }

    const track = getMockExamTrack(examSet.track_id);
    if (!track) throw requestError('ชุด Mock Exam นี้ยังไม่ได้กำหนดสายงานที่เปิดให้สอบ', 409);

    const rows = resumeIds.length > 0
      ? await loadResumeQuestions(supabase, resumeIds)
      : await drawRandomQuestions(supabase, track);
    const questions = rows.map(mapQuestion).filter((question) => question.choices.length >= 2 && question.answerIndex >= 0);
    if (questions.length === 0) throw requestError('ชุดข้อสอบนี้ยังไม่มีคำถามพร้อมให้สอบ', 404);
    if (questions.length !== track.totalQuestions) {
      throw requestError(`${track.name} ต้องมีข้อสอบครบ ${track.totalQuestions} ข้อก่อนเปิดให้สอบ (ขณะนี้ ${questions.length} ข้อ)`, 409);
    }

    const exam = {
      id: examSet.id,
      slug: examSet.slug,
      subjectId: examSet.subject_id || null,
      trackId: track?.id || examSet.track_id || null,
      trackName: track?.name || null,
      blueprint: track?.blueprint || [],
      title: examSet.title,
      description: examSet.description || '',
      durationMinutes: track?.durationMinutes || examSet.duration_minutes || 180,
      difficulty: examSet.difficulty || null,
      isFree: Boolean(examSet.is_free),
      totalQuestions: questions.length,
      passScore: track.passScore,
    };
    return NextResponse.json({ exam, questions });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
