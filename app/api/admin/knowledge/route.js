import { NextResponse } from 'next/server';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function migrationError(error) {
  if (error?.code !== '42P01' && error?.code !== 'PGRST205') return error;
  const friendly = new Error('ยังไม่ได้ติดตั้งตารางคลังความรู้ กรุณารันไฟล์ supabase/migrations/20260803_knowledge_articles.sql ใน Supabase SQL Editor ก่อน');
  friendly.status = 503;
  return friendly;
}

function cleanText(value, maxLength = 20000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanKeyPoints(value) {
  const source = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\r?\n/) : [];
  return source
    .map((item) => cleanText(String(item), 360))
    .filter(Boolean)
    .slice(0, 20);
}

function cleanTechniqueRows(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      title: cleanText(item?.title, 160),
      detail: cleanText(item?.detail, 1200),
    }))
    .filter((item) => item.title && item.detail)
    .slice(0, 12);
}

function cleanFormulaCards(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      label: cleanText(item?.label, 120),
      formula: cleanText(item?.formula, 400),
      note: cleanText(item?.note, 800),
    }))
    .filter((item) => item.label && item.formula)
    .slice(0, 12);
}

function integer(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function readArticles(supabase) {
  let result = await supabase
    .from('knowledge_articles')
    .select('id, subject_id, topic_id, title, summary, body, key_points, techniques, formula_cards, pitfalls, exam_guide, is_published, sort_order, created_at, updated_at')
    .order('is_published', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });

  // Keep the CMS usable while the additive lesson-block migration is waiting
  // to be applied in Supabase.
  if (result.error?.code === 'PGRST204' || result.error?.code === '42703') {
    result = await supabase
      .from('knowledge_articles')
      .select('id, subject_id, topic_id, title, summary, body, key_points, pitfalls, exam_guide, is_published, sort_order, created_at, updated_at')
      .order('is_published', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false });
    if (!result.error) result.data = (result.data || []).map((article) => ({ ...article, techniques: [], formula_cards: [] }));
  }
  return result;
}

async function readCatalog(supabase) {
  const [subjectsResult, topicsResult, articlesResult] = await Promise.all([
    supabase
      .from('content_subjects')
      .select('id, name, short_name, description, sort_order, is_active')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('content_topics')
      .select('id, legacy_id, subject_id, name, description, sort_order, is_active')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    readArticles(supabase),
  ]);

  const firstError = subjectsResult.error || topicsResult.error || articlesResult.error;
  if (firstError) throw firstError;
  return {
    subjects: subjectsResult.data || [],
    topics: topicsResult.data || [],
    articles: articlesResult.data || [],
  };
}

async function articlePayload(payload, supabase) {
  const subjectId = cleanText(payload?.subjectId, 80);
  const topicId = cleanText(payload?.topicId, 80) || null;
  const title = cleanText(payload?.title, 180);
  const summary = cleanText(payload?.summary, 700);
  const body = cleanText(payload?.body, 30000);

  if (!subjectId) {
    const error = new Error('กรุณาเลือกวิชา');
    error.status = 400;
    throw error;
  }
  if (!title) {
    const error = new Error('กรุณาระบุชื่อบทเรียน');
    error.status = 400;
    throw error;
  }
  if (!body) {
    const error = new Error('กรุณาใส่เนื้อหาบทเรียน');
    error.status = 400;
    throw error;
  }

  const { data: subject, error: subjectError } = await supabase
    .from('content_subjects')
    .select('id')
    .eq('id', subjectId)
    .maybeSingle();
  if (subjectError) throw subjectError;
  if (!subject) {
    const error = new Error('ไม่พบวิชาที่เลือก');
    error.status = 400;
    throw error;
  }

  if (topicId) {
    const { data: topic, error: topicError } = await supabase
      .from('content_topics')
      .select('id')
      .eq('id', topicId)
      .eq('subject_id', subjectId)
      .maybeSingle();
    if (topicError) throw topicError;
    if (!topic) {
      const error = new Error('หมวดย่อยที่เลือกไม่อยู่ในวิชานี้');
      error.status = 400;
      throw error;
    }
  }

  return {
    subject_id: subjectId,
    topic_id: topicId,
    title,
    summary,
    body,
    key_points: cleanKeyPoints(payload?.keyPoints),
    techniques: cleanTechniqueRows(payload?.techniques),
    formula_cards: cleanFormulaCards(payload?.formulaCards),
    pitfalls: cleanText(payload?.pitfalls, 2000),
    exam_guide: cleanText(payload?.examGuide, 2000),
    is_published: Boolean(payload?.isPublished),
    sort_order: integer(payload?.sortOrder),
  };
}

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await readCatalog(getSupabaseAdmin()));
  } catch (error) {
    return apiErrorResponse(migrationError(error));
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const supabase = getSupabaseAdmin();
    const payload = await articlePayload(await request.json(), supabase);
    const { error } = await supabase.from('knowledge_articles').insert({
      ...payload,
      created_by: admin.id,
      updated_by: admin.id,
    });
    if (error) throw error;
    return NextResponse.json(await readCatalog(supabase), { status: 201 });
  } catch (error) {
    return apiErrorResponse(migrationError(error));
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireAdmin();
    const supabase = getSupabaseAdmin();
    const requestBody = await request.json();
    const id = cleanText(requestBody?.id, 80);
    if (!id) {
      const error = new Error('ไม่พบบทเรียนที่ต้องการแก้ไข');
      error.status = 400;
      throw error;
    }
    const payload = await articlePayload(requestBody, supabase);
    const { error } = await supabase
      .from('knowledge_articles')
      .update({ ...payload, updated_by: admin.id, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json(await readCatalog(supabase));
  } catch (error) {
    return apiErrorResponse(migrationError(error));
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const id = cleanText(new URL(request.url).searchParams.get('id'), 80);
    if (!id) {
      const error = new Error('ไม่พบบทเรียนที่ต้องการลบ');
      error.status = 400;
      throw error;
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('knowledge_articles').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json(await readCatalog(supabase));
  } catch (error) {
    return apiErrorResponse(migrationError(error));
  }
}
