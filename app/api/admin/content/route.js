import { NextResponse } from 'next/server';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { topics as legacyTopics } from '@/lib/topics';

export const runtime = 'nodejs';

const BANKS = new Set(['practice', 'mock']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const SET_STATUSES = new Set(['draft', 'published', 'archived']);
const ANNOUNCEMENT_TONES = new Set(['info', 'success', 'warning', 'important']);
const ANNOUNCEMENT_AUDIENCES = new Set(['all', 'free', 'member']);

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeText(value, maxLength = 5000) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeOptionalId(value) {
  const id = normalizeText(value, 80);
  return id || null;
}

function normalizeDateTime(value, fieldName) {
  const raw = normalizeText(value, 80);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.valueOf())) throw requestError(`${fieldName} ไม่ถูกต้อง`);
  return date.toISOString();
}

function normaliseChoices(value) {
  if (!Array.isArray(value)) throw requestError('กรุณาระบุตัวเลือกคำตอบ');
  const choices = value
    .map((item) => normalizeText(item, 800))
    .filter(Boolean)
    .map((text, index) => ({ id: String.fromCharCode(65 + index), text }));

  if (choices.length < 2 || choices.length > 6) {
    throw requestError('ข้อสอบต้องมีตัวเลือกตั้งแต่ 2 ถึง 6 ข้อ');
  }
  return choices;
}

function throwSchemaHint(error) {
  if (error?.code === '42P01') {
    throw requestError('ยังไม่ได้ติดตั้งฐานข้อมูลคลังข้อสอบ กรุณารันไฟล์ migration สำหรับหลังบ้านใน Supabase ก่อน', 503);
  }
  throw error;
}

async function getSetForQuestion(supabase, setId, bank, subjectId) {
  if (!setId) return null;
  const { data, error } = await supabase
    .from('exam_sets')
    .select('id, bank, subject_id')
    .eq('id', setId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw requestError('ไม่พบชุดข้อสอบที่เลือก');
  if (data.bank !== bank) throw requestError('ไม่สามารถนำข้อสอบต่างคลังไปใส่ในชุดนี้ได้');
  if (data.subject_id && data.subject_id !== subjectId) throw requestError('วิชาของข้อสอบไม่ตรงกับชุดข้อสอบที่เลือก');
  return data;
}

async function validateTopicSubject(supabase, topicId, subjectId) {
  if (!topicId) return null;
  if (!subjectId) throw requestError('กรุณาเลือกวิชาก่อนเลือกหมวดย่อย');

  const { data, error } = await supabase
    .from('content_topics')
    .select('id, subject_id, is_active')
    .eq('id', topicId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.is_active) throw requestError('ไม่พบหมวดย่อยที่เลือก หรือหมวดนี้ถูกปิดใช้งานแล้ว');
  if (data.subject_id !== subjectId) throw requestError('หมวดย่อยที่เลือกไม่อยู่ในวิชานี้');
  return data;
}

async function ensureQuestionMatchesAssignedSets(supabase, questionId, bank, subjectId) {
  const { data, error } = await supabase
    .from('exam_set_questions')
    .select('exam_sets(bank, subject_id)')
    .eq('question_id', questionId);
  if (error) throw error;

  const incompatibleSet = (data || []).find(({ exam_sets: examSet }) => (
    examSet && (examSet.bank !== bank || (examSet.subject_id && examSet.subject_id !== subjectId))
  ));
  if (incompatibleSet) {
    throw requestError('ข้อสอบนี้อยู่ในชุดข้อสอบแล้ว จึงเปลี่ยนคลังหรือวิชาให้ไม่ตรงกับชุดเดิมไม่ได้');
  }
}

async function appendQuestionToSet(supabase, setId, questionId) {
  if (!setId) return;
  const { data: latest, error: latestError } = await supabase
    .from('exam_set_questions')
    .select('position')
    .eq('set_id', setId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;

  const { error } = await supabase
    .from('exam_set_questions')
    .insert({ set_id: setId, question_id: questionId, position: (latest?.position || 0) + 1 });
  if (error) throw error;
}

async function writeAudit(supabase, adminId, action, entityType, entityId, detail = {}) {
  // Audit failures must not undo a successful content save. They can be reviewed
  // separately, while the primary record remains available to the administrator.
  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: String(entityId || ''),
    detail,
  });
}

async function createTopic(supabase, adminId, body) {
  const subjectId = normalizeText(body.subjectId, 80);
  const name = normalizeText(body.name, 160);
  const description = normalizeText(body.description, 800) || null;
  if (!subjectId || !name) throw requestError('กรุณาเลือกวิชาและระบุชื่อหมวดย่อย');

  const { data, error } = await supabase
    .from('content_topics')
    .insert({ subject_id: subjectId, name, description, created_at: new Date().toISOString() })
    .select('id, subject_id, name, description, sort_order, is_active')
    .single();
  if (error) throw error;
  await writeAudit(supabase, adminId, 'create', 'topic', data.id, { subjectId, name });
  return NextResponse.json({ topic: data }, { status: 201 });
}

async function importLegacyTopics(supabase, adminId) {
  const sortOrders = new Map();
  const rows = legacyTopics.map((topic) => {
    const nextSortOrder = (sortOrders.get(topic.subjectId) || 0) + 1;
    sortOrders.set(topic.subjectId, nextSortOrder);
    return {
      legacy_id: topic.id,
      subject_id: topic.subjectId,
      name: topic.name,
      description: topic.description || null,
      sort_order: nextSortOrder,
      is_active: true,
    };
  });

  const { data, error } = await supabase
    .from('content_topics')
    .upsert(rows, { onConflict: 'legacy_id' })
    .select('id');
  if (error) throw error;

  await writeAudit(supabase, adminId, 'import', 'topic', 'legacy-taxonomy', { imported: data?.length || 0 });
  return NextResponse.json({ imported: data?.length || 0 });
}

async function createSet(supabase, adminId, body) {
  const bank = normalizeText(body.bank, 20);
  const title = normalizeText(body.title, 180);
  const rawSlug = normalizeText(body.slug, 90).toLowerCase();
  const slug = rawSlug || `set-${Date.now().toString(36)}`;
  const status = normalizeText(body.status, 20) || 'draft';
  const difficulty = normalizeOptionalId(body.difficulty);
  const duration = Number(body.durationMinutes || 0);
  const subjectId = normalizeOptionalId(body.subjectId);
  const topicId = normalizeOptionalId(body.topicId);

  if (!BANKS.has(bank)) throw requestError('ประเภทคลังข้อสอบไม่ถูกต้อง');
  if (!title) throw requestError('กรุณาระบุชื่อชุดข้อสอบ');
  if (!/^[a-z0-9][a-z0-9-]{1,90}$/.test(slug)) throw requestError('รหัสลิงก์ใช้ตัวอักษรอังกฤษ ตัวเลข และขีดกลางเท่านั้น');
  if (!SET_STATUSES.has(status)) throw requestError('สถานะชุดข้อสอบไม่ถูกต้อง');
  if (difficulty && !DIFFICULTIES.has(difficulty)) throw requestError('ระดับความยากไม่ถูกต้อง');
  if (duration && (!Number.isInteger(duration) || duration < 1 || duration > 600)) throw requestError('ระยะเวลาต้องอยู่ระหว่าง 1 ถึง 600 นาที');
  await validateTopicSubject(supabase, topicId, subjectId);

  const { data, error } = await supabase
    .from('exam_sets')
    .insert({
      slug,
      bank,
      title,
      description: normalizeText(body.description, 2000) || null,
      subject_id: subjectId,
      topic_id: topicId,
      duration_minutes: duration || null,
      difficulty,
      is_free: Boolean(body.isFree),
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      created_by: adminId,
      updated_by: adminId,
    })
    .select('id, slug, bank, title, subject_id, topic_id, duration_minutes, difficulty, is_free, status')
    .single();
  if (error) throw error;
  await writeAudit(supabase, adminId, 'create', 'exam_set', data.id, { bank, title, status });
  return NextResponse.json({ set: data }, { status: 201 });
}

async function createQuestion(supabase, adminId, body) {
  const bank = normalizeText(body.bank, 20);
  const subjectId = normalizeText(body.subjectId, 80);
  const stem = normalizeText(body.stem, 8000);
  const difficulty = normalizeText(body.difficulty, 20) || 'medium';
  const choices = normaliseChoices(body.choices);
  const correctChoice = normalizeText(body.correctChoice, 4).toUpperCase();
  const setId = normalizeOptionalId(body.setId);

  if (!BANKS.has(bank)) throw requestError('ประเภทคลังข้อสอบไม่ถูกต้อง');
  if (!subjectId || !stem) throw requestError('กรุณาเลือกวิชาและระบุโจทย์ข้อสอบ');
  if (!DIFFICULTIES.has(difficulty)) throw requestError('ระดับความยากไม่ถูกต้อง');
  if (!choices.some((choice) => choice.id === correctChoice)) throw requestError('กรุณาเลือกคำตอบที่ถูกต้อง');
  const topicId = normalizeOptionalId(body.topicId);
  await validateTopicSubject(supabase, topicId, subjectId);
  await getSetForQuestion(supabase, setId, bank, subjectId);

  const { data, error } = await supabase
    .from('question_bank_questions')
    .insert({
      bank,
      subject_id: subjectId,
      topic_id: topicId,
      stem,
      choices,
      correct_choice: correctChoice,
      explanation: normalizeText(body.explanation, 6000) || null,
      difficulty,
      source_reference: normalizeText(body.sourceReference, 800) || null,
      is_active: body.isActive !== false,
      created_by: adminId,
      updated_by: adminId,
    })
    .select('id, bank, subject_id, topic_id, stem, choices, correct_choice, explanation, difficulty, is_active, created_at')
    .single();
  if (error) throw error;

  await appendQuestionToSet(supabase, setId, data.id);
  await writeAudit(supabase, adminId, 'create', 'question', data.id, { bank, subjectId, setId });
  return NextResponse.json({ question: data }, { status: 201 });
}

function announcementValues(body) {
  const title = normalizeText(body.title, 160);
  const summary = normalizeText(body.summary, 360);
  const tone = normalizeText(body.tone, 20) || 'info';
  const audience = normalizeText(body.audience, 20) || 'all';
  const startsAt = normalizeDateTime(body.startsAt, 'วันเริ่มแสดง');
  const endsAt = normalizeDateTime(body.endsAt, 'วันสิ้นสุดการแสดง');

  if (!title || !summary) throw requestError('กรุณาระบุหัวข้อและข้อความสรุปประกาศ');
  if (!ANNOUNCEMENT_TONES.has(tone)) throw requestError('รูปแบบประกาศไม่ถูกต้อง');
  if (!ANNOUNCEMENT_AUDIENCES.has(audience)) throw requestError('กลุ่มผู้รับประกาศไม่ถูกต้อง');
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) throw requestError('วันสิ้นสุดต้องอยู่หลังวันเริ่มแสดง');

  return {
    title,
    summary,
    body: normalizeText(body.body, 4000) || null,
    tone,
    audience,
    show_on_login: Boolean(body.showOnLogin),
    is_published: Boolean(body.isPublished),
    starts_at: startsAt,
    ends_at: endsAt,
  };
}

async function createAnnouncement(supabase, adminId, body) {
  const values = announcementValues(body);
  const { data, error } = await supabase
    .from('announcements')
    .insert({ ...values, created_by: adminId, updated_by: adminId })
    .select('id, title, summary, tone, audience, show_on_login, is_published, starts_at, ends_at, created_at')
    .single();
  if (error) throw error;
  await writeAudit(supabase, adminId, 'create', 'announcement', data.id, { title: data.title, published: data.is_published });
  return NextResponse.json({ announcement: data }, { status: 201 });
}

async function importBulkQuestions(supabase, adminId, body) {
  const defaultBank = normalizeText(body.bank, 20);
  const rawItems = Array.isArray(body.items) ? body.items : null;
  if (!rawItems || rawItems.length === 0) throw requestError('กรุณาแนบรายการข้อสอบอย่างน้อย 1 ข้อ');
  if (rawItems.length > 300) throw requestError('นำเข้าได้ไม่เกิน 300 ข้อต่อครั้ง');

  // ทำความสะอาดข้อมูลเบื้องต้นก่อน — ไม่พึ่งฐานข้อมูล เพื่อคัดข้อที่ผิดรูปแบบออกให้เร็วที่สุด
  const drafts = rawItems.map((raw, index) => {
    const bank = normalizeText(raw?.bank, 20) || defaultBank;
    const subjectId = normalizeText(raw?.subjectId, 80);
    const topicId = normalizeOptionalId(raw?.topicId);
    const setId = normalizeOptionalId(raw?.setId);
    const stem = normalizeText(raw?.stem || raw?.question, 8000);
    const difficulty = normalizeText(raw?.difficulty, 20) || 'medium';
    const explanation = normalizeText(raw?.explanation, 6000) || null;
    const sourceReference = normalizeText(raw?.sourceReference, 800) || null;
    const isActive = raw?.isActive !== false;

    let choices = null;
    try {
      choices = normaliseChoices(Array.isArray(raw?.choices) ? raw.choices : []);
    } catch {
      choices = null;
    }

    let correctChoice = null;
    if (typeof raw?.correctChoice === 'string' && raw.correctChoice.trim()) {
      correctChoice = raw.correctChoice.trim().toUpperCase();
    } else if (Number.isInteger(raw?.answerIndex)) {
      correctChoice = String.fromCharCode(65 + raw.answerIndex);
    } else if (Number.isInteger(raw?.correctIndex)) {
      correctChoice = String.fromCharCode(65 + raw.correctIndex);
    }

    return { index, bank, subjectId, topicId, setId, stem, difficulty, explanation, sourceReference, isActive, choices, correctChoice };
  });

  const errors = [];
  const stemPreview = (stem) => (stem ? stem.slice(0, 60) : '(ไม่มีโจทย์)');

  for (const draft of drafts) {
    if (!BANKS.has(draft.bank)) errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ไม่ระบุคลังข้อสอบ (bank) ที่ถูกต้อง — ต้องเป็น practice หรือ mock' });
    else if (!draft.subjectId) errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ไม่ระบุวิชา (subjectId)' });
    else if (!draft.stem) errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ไม่มีโจทย์ข้อสอบ (stem)' });
    else if (!draft.choices) errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ตัวเลือกคำตอบต้องมี 2-6 ข้อ และไม่ว่าง' });
    else if (!DIFFICULTIES.has(draft.difficulty)) errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ระดับความยากไม่ถูกต้อง (easy/medium/hard)' });
    else if (!draft.correctChoice || !draft.choices.some((choice) => choice.id === draft.correctChoice)) errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ระบุคำตอบที่ถูกต้องไม่ตรงกับตัวเลือก (correctChoice หรือ answerIndex)' });
  }
  const failedIndexes = new Set(errors.map((item) => item.index));

  // ตรวจวิชา หมวดย่อย และชุดข้อสอบด้วย query รวมเป็นชุดเดียว แทนการยิงทีละแถว
  const subjectIds = [...new Set(drafts.map((item) => item.subjectId).filter(Boolean))];
  const topicIds = [...new Set(drafts.map((item) => item.topicId).filter(Boolean))];
  const setIds = [...new Set(drafts.map((item) => item.setId).filter(Boolean))];

  const [subjectsRes, topicsRes, setsRes] = await Promise.all([
    subjectIds.length ? supabase.from('content_subjects').select('id').in('id', subjectIds) : Promise.resolve({ data: [] }),
    topicIds.length ? supabase.from('content_topics').select('id, subject_id, is_active').in('id', topicIds) : Promise.resolve({ data: [] }),
    setIds.length ? supabase.from('exam_sets').select('id, bank, subject_id').in('id', setIds) : Promise.resolve({ data: [] }),
  ]);
  if (subjectsRes.error) throw subjectsRes.error;
  if (topicsRes.error) throw topicsRes.error;
  if (setsRes.error) throw setsRes.error;

  const validSubjectIds = new Set((subjectsRes.data || []).map((item) => item.id));
  const topicMap = new Map((topicsRes.data || []).map((item) => [item.id, item]));
  const setMap = new Map((setsRes.data || []).map((item) => [item.id, item]));

  const insertRows = [];
  const rowMeta = [];

  for (const draft of drafts) {
    if (failedIndexes.has(draft.index)) continue;

    if (!validSubjectIds.has(draft.subjectId)) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ไม่พบวิชานี้ในระบบ' }); continue; }
    if (draft.topicId) {
      const topic = topicMap.get(draft.topicId);
      if (!topic || !topic.is_active) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ไม่พบหมวดย่อยนี้ หรือถูกปิดใช้งาน' }); continue; }
      if (topic.subject_id !== draft.subjectId) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'หมวดย่อยไม่ตรงกับวิชาที่ระบุ' }); continue; }
    }
    if (draft.setId) {
      const set = setMap.get(draft.setId);
      if (!set) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ไม่พบชุดข้อสอบนี้' }); continue; }
      if (set.bank !== draft.bank) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'คลังข้อสอบของชุดไม่ตรงกับข้อนี้' }); continue; }
      if (set.subject_id && set.subject_id !== draft.subjectId) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'วิชาของชุดไม่ตรงกับข้อนี้' }); continue; }
    }

    insertRows.push({
      bank: draft.bank,
      subject_id: draft.subjectId,
      topic_id: draft.topicId,
      stem: draft.stem,
      choices: draft.choices,
      correct_choice: draft.correctChoice,
      explanation: draft.explanation,
      difficulty: draft.difficulty,
      source_reference: draft.sourceReference,
      is_active: draft.isActive,
      created_by: adminId,
      updated_by: adminId,
    });
    rowMeta.push({ setId: draft.setId });
  }

  errors.sort((a, b) => a.index - b.index);

  if (insertRows.length === 0) {
    return NextResponse.json({ insertedCount: 0, failedCount: errors.length, errors });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('question_bank_questions')
    .insert(insertRows)
    .select('id');
  if (insertError) throw insertError;

  // เพิ่มเข้าชุดข้อสอบตามลำดับที่ insert — PostgREST คืนแถวตามลำดับเดียวกับที่ส่งเข้าไป
  for (let i = 0; i < inserted.length; i += 1) {
    const setId = rowMeta[i]?.setId;
    if (setId) await appendQuestionToSet(supabase, setId, inserted[i].id);
  }

  await writeAudit(supabase, adminId, 'bulk-import', 'question', 'bulk', {
    inserted: inserted.length,
    failed: errors.length,
    bank: defaultBank || null,
  });

  return NextResponse.json({ insertedCount: inserted.length, failedCount: errors.length, errors });
}

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const results = await Promise.all([
      supabase.from('content_subjects').select('id, name, short_name, accent, sort_order').eq('is_active', true).order('sort_order'),
      supabase.from('content_topics').select('id, legacy_id, subject_id, name, description, sort_order, is_active').order('sort_order').order('name'),
      supabase.from('question_bank_questions').select('id, bank, subject_id, topic_id, stem, choices, correct_choice, explanation, source_reference, difficulty, is_active, created_at, content_subjects(name), content_topics(name), exam_set_questions(exam_sets(id, title, slug))').order('created_at', { ascending: false }).limit(80),
      supabase.from('exam_sets').select('id, slug, bank, title, description, subject_id, topic_id, duration_minutes, difficulty, is_free, status, created_at, content_subjects(name), content_topics(name), exam_set_questions(count)').order('created_at', { ascending: false }).limit(80),
      supabase.from('announcements').select('id, title, summary, body, tone, audience, show_on_login, is_published, starts_at, ends_at, created_at').order('created_at', { ascending: false }).limit(80),
    ]);
    const [subjectsResult, topicsResult, questionsResult, setsResult, announcementsResult] = results;
    for (const result of results) if (result.error) throwSchemaHint(result.error);

    return NextResponse.json({
      subjects: subjectsResult.data || [],
      topics: topicsResult.data || [],
      questions: questionsResult.data || [],
      sets: setsResult.data || [],
      announcements: announcementsResult.data || [],
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    if (body?.type === 'topic') return await createTopic(supabase, admin.id, body);
    if (body?.type === 'import-topics') return await importLegacyTopics(supabase, admin.id);
    if (body?.type === 'set') return await createSet(supabase, admin.id, body);
    if (body?.type === 'question') return await createQuestion(supabase, admin.id, body);
    if (body?.type === 'bulk-questions') return await importBulkQuestions(supabase, admin.id, body);
    if (body?.type === 'announcement') return await createAnnouncement(supabase, admin.id, body);
    throw requestError('ไม่รู้จักประเภทข้อมูลที่ต้องการบันทึก');
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    if (!normalizeOptionalId(body?.id)) throw requestError('ข้อมูลที่ต้องการแก้ไขไม่ถูกต้อง');

    if (body?.type === 'announcement') {
      const supabase = getSupabaseAdmin();
      const values = announcementValues(body);
      const { data, error } = await supabase
        .from('announcements')
        .update({ ...values, updated_by: admin.id })
        .eq('id', body.id)
        .select('id, title, summary, tone, audience, show_on_login, is_published, starts_at, ends_at')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw requestError('ไม่พบประกาศที่ต้องการแก้ไข', 404);
      await writeAudit(supabase, admin.id, 'update', 'announcement', data.id, { published: data.is_published });
      return NextResponse.json({ announcement: data });
    }

    if (body?.type !== 'question') throw requestError('ข้อมูลข้อสอบไม่ถูกต้อง');

    const bank = normalizeText(body.bank, 20);
    const subjectId = normalizeText(body.subjectId, 80);
    const stem = normalizeText(body.stem, 8000);
    const difficulty = normalizeText(body.difficulty, 20) || 'medium';
    const choices = normaliseChoices(body.choices);
    const correctChoice = normalizeText(body.correctChoice, 4).toUpperCase();
    if (!BANKS.has(bank) || !subjectId || !stem || !DIFFICULTIES.has(difficulty)) throw requestError('ข้อมูลข้อสอบไม่ครบหรือไม่ถูกต้อง');
    if (!choices.some((choice) => choice.id === correctChoice)) throw requestError('กรุณาเลือกคำตอบที่ถูกต้อง');

    const supabase = getSupabaseAdmin();
    const topicId = normalizeOptionalId(body.topicId);
    await validateTopicSubject(supabase, topicId, subjectId);
    await ensureQuestionMatchesAssignedSets(supabase, body.id, bank, subjectId);
    const { data, error } = await supabase
      .from('question_bank_questions')
      .update({
        bank,
        subject_id: subjectId,
        topic_id: topicId,
        stem,
        choices,
        correct_choice: correctChoice,
        explanation: normalizeText(body.explanation, 6000) || null,
        difficulty,
        source_reference: normalizeText(body.sourceReference, 800) || null,
        is_active: body.isActive !== false,
        updated_by: admin.id,
      })
      .eq('id', body.id)
      .select('id, bank, subject_id, topic_id, stem, choices, correct_choice, explanation, difficulty, is_active')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw requestError('ไม่พบข้อสอบที่ต้องการแก้ไข', 404);

    await writeAudit(supabase, admin.id, 'update', 'question', data.id, { bank, subjectId });
    return NextResponse.json({ question: data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    if (body?.type !== 'question' || !normalizeOptionalId(body.id)) throw requestError('ข้อมูลข้อสอบไม่ถูกต้อง');

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('question_bank_questions')
      .update({ is_active: false, updated_by: admin.id })
      .eq('id', body.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw requestError('ไม่พบข้อสอบที่ต้องการปิดใช้งาน', 404);

    await writeAudit(supabase, admin.id, 'archive', 'question', data.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
