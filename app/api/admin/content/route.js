import { NextResponse } from 'next/server';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getMockExamTrack } from '@/lib/mockExamTracks';
import { topics as legacyTopics } from '@/lib/topics';

export const runtime = 'nodejs';

const BANKS = new Set(['practice', 'mock']);
const QUESTION_BANKS = new Set(['practice']);
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

function isOptionalHierarchySchemaError(error) {
  return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error?.code);
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

async function validateTrack(supabase, trackId) {
  if (!trackId) return null;
  const { data, error } = await supabase.from('exam_tracks').select('id, is_active').eq('id', trackId).maybeSingle();
  if (error) throw error;
  if (!data) throw requestError('ไม่พบสายงานที่เลือก');
  if (!data.is_active) throw requestError('สายงานนี้ยังไม่เปิดให้สร้าง Mock Exam');
  return data;
}

async function applyMockExamScope(supabase, values) {
  if (values.bank !== 'mock') return values;
  const track = getMockExamTrack(values.track_id);
  if (!track) throw requestError('Mock Exam ต้องเลือกสายอำนวยการหรือสายปราบปราม');
  await validateTrack(supabase, track.id);
  return {
    ...values,
    subject_id: null,
    topic_id: null,
    duration_minutes: track.durationMinutes,
  };
}

// Mock Exam สุ่มข้อสอบจากคลังแบบฝึกหัดรายวิชาตอนนักเรียนเริ่มสอบแต่ละครั้ง (ไม่ผูกกับ
// exam_set_questions ของชุดนี้แล้ว) การเผยแพร่จึงแค่ต้องเช็คว่าคลังแบบฝึกหัดมีข้อสอบพอ
// ตามสัดส่วนของสายงาน ไม่ใช่เช็คชุดนี้โดยตรง
async function validatePublishedMockExam(supabase, setId, track) {
  const results = await Promise.all(track.blueprint.map((entry) => supabase
    .from('question_bank_questions')
    .select('id', { count: 'exact', head: true })
    .eq('bank', 'practice')
    .eq('subject_id', entry.subjectId)
    .eq('is_active', true)));
  const failedResult = results.find((result) => result.error);
  if (failedResult) throw failedResult.error;

  const shortfall = track.blueprint.find((entry, index) => (results[index].count || 0) < entry.questionCount);
  if (shortfall) {
    const available = results[track.blueprint.indexOf(shortfall)].count || 0;
    throw requestError(`${track.name} ต้องมีข้อสอบวิชา${shortfall.subjectName}ในคลังอย่างน้อย ${shortfall.questionCount} ข้อก่อนเผยแพร่ (ขณะนี้มี ${available} ข้อ)`);
  }
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

function parseTopicInput(body) {
  const subjectId = normalizeText(body.subjectId, 80);
  const name = normalizeText(body.name, 160);
  const description = normalizeText(body.description, 800) || null;
  const groupId = normalizeOptionalId(body.groupId);
  if (!subjectId || !name) throw requestError('กรุณาเลือกวิชาและระบุชื่อหมวดย่อย');
  return { subject_id: subjectId, name, description, group_id: groupId };
}

async function validateTopicGroup(supabase, groupId, subjectId) {
  if (!groupId) return null;
  const { data, error } = await supabase
    .from('content_topic_groups')
    .select('id, subject_id, is_active')
    .eq('id', groupId)
    .maybeSingle();
  if (error) {
    if (isOptionalHierarchySchemaError(error)) {
      throw requestError('ยังไม่ได้ติดตั้งโครงสร้างหมวดหลัก กรุณารัน migration 20260803_topic_groups.sql ใน Supabase ก่อน', 503);
    }
    throw error;
  }
  if (!data || !data.is_active) throw requestError('ไม่พบหมวดหลักที่เลือก หรือหมวดหลักนี้ถูกปิดใช้งานแล้ว');
  if (data.subject_id !== subjectId) throw requestError('หมวดหลักที่เลือกไม่ได้อยู่ในวิชานี้');
  return data;
}

async function createTopic(supabase, adminId, body) {
  const values = parseTopicInput(body);
  await validateTopicGroup(supabase, values.group_id, values.subject_id);

  const { data, error } = await supabase
    .from('content_topics')
    .insert({ ...values, created_at: new Date().toISOString() })
    .select('id, subject_id, group_id, name, description, sort_order, is_active')
    .single();
  if (error) throw error;
  await writeAudit(supabase, adminId, 'create', 'topic', data.id, { subjectId: values.subject_id, name: values.name });
  return NextResponse.json({ topic: data }, { status: 201 });
}

async function updateTopic(supabase, adminId, body) {
  const values = parseTopicInput(body);
  const isActive = body.isActive !== false;
  await validateTopicGroup(supabase, values.group_id, values.subject_id);

  const { data, error } = await supabase
    .from('content_topics')
    .update({ ...values, is_active: isActive })
    .eq('id', body.id)
    .select('id, subject_id, group_id, name, description, sort_order, is_active')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw requestError('ไม่พบหมวดย่อยที่ต้องการแก้ไข', 404);
  await writeAudit(supabase, adminId, 'update', 'topic', data.id, { name: data.name, isActive });
  return NextResponse.json({ topic: data });
}

async function archiveTopic(supabase, adminId, id) {
  const { data, error } = await supabase
    .from('content_topics')
    .update({ is_active: false })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw requestError('ไม่พบหมวดย่อยที่ต้องการปิดใช้งาน', 404);
  await writeAudit(supabase, adminId, 'archive', 'topic', data.id);
  return NextResponse.json({ success: true });
}

function parseTopicGroupInput(body) {
  const subjectId = normalizeText(body.subjectId, 80);
  const name = normalizeText(body.name, 120);
  const description = normalizeText(body.description, 800) || null;
  if (!subjectId || !name) throw requestError('กรุณาเลือกวิชาและระบุชื่อหมวดหลัก');
  return { subject_id: subjectId, name, description };
}

async function createTopicGroup(supabase, adminId, body) {
  const values = parseTopicGroupInput(body);
  const { data, error } = await supabase
    .from('content_topic_groups')
    .insert({ ...values, created_at: new Date().toISOString() })
    .select('id, subject_id, name, description, sort_order, is_active')
    .single();
  if (error) throw error;
  await writeAudit(supabase, adminId, 'create', 'topic_group', data.id, { subjectId: values.subject_id, name: values.name });
  return NextResponse.json({ topicGroup: data }, { status: 201 });
}

async function updateTopicGroup(supabase, adminId, body) {
  const values = parseTopicGroupInput(body);
  const isActive = body.isActive !== false;
  const { data, error } = await supabase
    .from('content_topic_groups')
    .update({ ...values, is_active: isActive })
    .eq('id', body.id)
    .select('id, subject_id, name, description, sort_order, is_active')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw requestError('ไม่พบหมวดหลักที่ต้องการแก้ไข', 404);
  await writeAudit(supabase, adminId, 'update', 'topic_group', data.id, { name: data.name, isActive });
  return NextResponse.json({ topicGroup: data });
}

async function archiveTopicGroup(supabase, adminId, id) {
  const { data, error } = await supabase
    .from('content_topic_groups')
    .update({ is_active: false })
    .eq('id', id)
    .select('id, name')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw requestError('ไม่พบหมวดหลักที่ต้องการปิดใช้งาน', 404);
  await writeAudit(supabase, adminId, 'archive', 'topic_group', data.id, { name: data.name });
  return NextResponse.json({ success: true });
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

function parseSetInput(body) {
  const bank = normalizeText(body.bank, 20);
  const title = normalizeText(body.title, 180);
  const rawSlug = normalizeText(body.slug, 90).toLowerCase();
  const slug = rawSlug || `set-${Date.now().toString(36)}`;
  const status = normalizeText(body.status, 20) || 'draft';
  const difficulty = normalizeOptionalId(body.difficulty);
  const duration = Number(body.durationMinutes || 0);
  const subjectId = normalizeOptionalId(body.subjectId);
  const topicId = normalizeOptionalId(body.topicId);
  const trackId = normalizeOptionalId(body.trackId);

  if (!BANKS.has(bank)) throw requestError('ประเภทคลังข้อสอบไม่ถูกต้อง');
  if (!title) throw requestError('กรุณาระบุชื่อชุดข้อสอบ');
  if (!/^[a-z0-9][a-z0-9-]{1,90}$/.test(slug)) throw requestError('รหัสลิงก์ใช้ตัวอักษรอังกฤษ ตัวเลข และขีดกลางเท่านั้น');
  if (!SET_STATUSES.has(status)) throw requestError('สถานะชุดข้อสอบไม่ถูกต้อง');
  if (difficulty && !DIFFICULTIES.has(difficulty)) throw requestError('ระดับความยากไม่ถูกต้อง');
  if (duration && (!Number.isInteger(duration) || duration < 1 || duration > 600)) throw requestError('ระยะเวลาต้องอยู่ระหว่าง 1 ถึง 600 นาที');

  return {
    slug,
    bank,
    title,
    description: normalizeText(body.description, 2000) || null,
    subject_id: subjectId,
    topic_id: topicId,
    track_id: trackId,
    duration_minutes: duration || null,
    difficulty,
    is_free: Boolean(body.isFree),
    status,
  };
}

function wrapSetError(error) {
  if (error?.code === '23505') return requestError('รหัสลิงก์นี้ถูกใช้แล้ว กรุณาตั้งรหัสลิงก์ใหม่');
  return error;
}

async function createSet(supabase, adminId, body) {
  let values = parseSetInput(body);
  values = await applyMockExamScope(supabase, values);
  await validateTopicSubject(supabase, values.topic_id, values.subject_id);
  await validateTrack(supabase, values.track_id);
  if (values.bank === 'mock' && values.status === 'published') {
    throw requestError('สร้าง Mock Exam เป็นฉบับร่างก่อน แล้วตรวจสอบว่าคลังข้อสอบพร้อมตามสัดส่วนสายงานจึงค่อยเผยแพร่');
  }

  const { data, error } = await supabase
    .from('exam_sets')
    .insert({
      ...values,
      published_at: values.status === 'published' ? new Date().toISOString() : null,
      created_by: adminId,
      updated_by: adminId,
    })
    .select('id, slug, bank, title, subject_id, topic_id, track_id, duration_minutes, difficulty, is_free, status')
    .single();
  if (error) throw wrapSetError(error);
  await writeAudit(supabase, adminId, 'create', 'exam_set', data.id, { bank: values.bank, title: values.title, status: values.status });
  return NextResponse.json({ set: data }, { status: 201 });
}

async function updateSet(supabase, adminId, body) {
  let values = parseSetInput(body);
  values = await applyMockExamScope(supabase, values);
  await validateTopicSubject(supabase, values.topic_id, values.subject_id);
  await validateTrack(supabase, values.track_id);

  const { data: existing, error: existingError } = await supabase
    .from('exam_sets')
    .select('id, status')
    .eq('id', body.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) throw requestError('ไม่พบชุดข้อสอบที่ต้องการแก้ไข', 404);

  if (values.bank === 'mock' && values.status === 'published') {
    await validatePublishedMockExam(supabase, body.id, getMockExamTrack(values.track_id));
  }

  const publishedAtChange = values.status === 'published'
    ? (existing.status === 'published' ? {} : { published_at: new Date().toISOString() })
    : { published_at: null };

  const { data, error } = await supabase
    .from('exam_sets')
    .update({ ...values, ...publishedAtChange, updated_by: adminId })
    .eq('id', body.id)
    .select('id, slug, bank, title, description, subject_id, topic_id, track_id, duration_minutes, difficulty, is_free, status')
    .maybeSingle();
  if (error) throw wrapSetError(error);
  if (!data) throw requestError('ไม่พบชุดข้อสอบที่ต้องการแก้ไข', 404);

  await writeAudit(supabase, adminId, 'update', 'exam_set', data.id, { bank: data.bank, title: data.title, status: data.status });
  return NextResponse.json({ set: data });
}

async function deleteSet(supabase, adminId, id) {
  const { data, error } = await supabase
    .from('exam_sets')
    .delete()
    .eq('id', id)
    .select('id, title')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw requestError('ไม่พบชุดข้อสอบที่ต้องการลบ', 404);
  await writeAudit(supabase, adminId, 'delete', 'exam_set', data.id, { title: data.title });
  return NextResponse.json({ success: true });
}

async function createQuestion(supabase, adminId, body) {
  const bank = normalizeText(body.bank, 20);
  const subjectId = normalizeText(body.subjectId, 80);
  const stem = normalizeText(body.stem, 8000);
  const difficulty = normalizeText(body.difficulty, 20) || 'medium';
  const choices = normaliseChoices(body.choices);
  const correctChoice = normalizeText(body.correctChoice, 4).toUpperCase();
  const setId = normalizeOptionalId(body.setId);
  const trackId = normalizeOptionalId(body.trackId);

  if (!QUESTION_BANKS.has(bank)) throw requestError('คำถามใหม่ต้องอยู่ในคลังแบบฝึกหัดรายวิชาเท่านั้น เพราะ Mock Exam จะสุ่มข้อสอบจากคลังนี้อัตโนมัติ');
  if (!subjectId || !stem) throw requestError('กรุณาเลือกวิชาและระบุโจทย์ข้อสอบ');
  if (!DIFFICULTIES.has(difficulty)) throw requestError('ระดับความยากไม่ถูกต้อง');
  if (!choices.some((choice) => choice.id === correctChoice)) throw requestError('กรุณาเลือกคำตอบที่ถูกต้อง');
  const topicId = normalizeOptionalId(body.topicId);
  await validateTopicSubject(supabase, topicId, subjectId);
  await validateTrack(supabase, trackId);
  await getSetForQuestion(supabase, setId, bank, subjectId);

  const { data, error } = await supabase
    .from('question_bank_questions')
    .insert({
      bank,
      subject_id: subjectId,
      topic_id: topicId,
      track_id: trackId,
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
    .select('id, bank, subject_id, topic_id, track_id, stem, choices, correct_choice, explanation, difficulty, is_active, created_at')
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

async function deleteAnnouncement(supabase, adminId, id) {
  const { data, error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)
    .select('id, title')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw requestError('ไม่พบประกาศที่ต้องการลบ', 404);
  await writeAudit(supabase, adminId, 'delete', 'announcement', data.id, { title: data.title });
  return NextResponse.json({ success: true });
}

async function importBulkQuestions(supabase, adminId, body) {
  const defaultBank = normalizeText(body.bank, 20);
  const rawItems = Array.isArray(body.items) ? body.items : null;
  if (!rawItems || rawItems.length === 0) throw requestError('กรุณาแนบรายการข้อสอบอย่างน้อย 1 ข้อ');
  if (rawItems.length > 300) throw requestError('นำเข้าได้ไม่เกิน 300 ข้อต่อครั้ง');

  // ทำความสะอาดข้อมูลเบื้องต้นก่อน — ไม่พึ่งฐานข้อมูล เพื่อคัดข้อที่ผิดรูปแบบออกให้เร็วที่สุด
  const defaultTrackId = normalizeOptionalId(body.trackId);
  const drafts = rawItems.map((raw, index) => {
    const bank = normalizeText(raw?.bank, 20) || defaultBank;
    const subjectId = normalizeText(raw?.subjectId, 80);
    const topicId = normalizeOptionalId(raw?.topicId);
    const topicLegacyId = normalizeText(raw?.topicLegacyId, 160) || null;
    const setId = normalizeOptionalId(raw?.setId);
    const trackId = normalizeOptionalId(raw?.trackId) || defaultTrackId;
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

    return { index, bank, subjectId, topicId, topicLegacyId, setId, trackId, stem, difficulty, explanation, sourceReference, isActive, choices, correctChoice };
  });

  const errors = [];
  const stemPreview = (stem) => (stem ? stem.slice(0, 60) : '(ไม่มีโจทย์)');

  for (const draft of drafts) {
    if (!QUESTION_BANKS.has(draft.bank)) errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ให้ระบุ bank เป็น practice เท่านั้น — Mock Exam จะสุ่มจากคลังแบบฝึกหัดรายวิชาอัตโนมัติ' });
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
  const topicLegacyIds = [...new Set(drafts.map((item) => item.topicLegacyId).filter(Boolean))];
  const setIds = [...new Set(drafts.map((item) => item.setId).filter(Boolean))];
  const trackIds = [...new Set(drafts.map((item) => item.trackId).filter(Boolean))];

  const [subjectsRes, topicsRes, legacyTopicsRes, setsRes, tracksRes] = await Promise.all([
    subjectIds.length ? supabase.from('content_subjects').select('id').in('id', subjectIds) : Promise.resolve({ data: [] }),
    topicIds.length ? supabase.from('content_topics').select('id, legacy_id, subject_id, is_active').in('id', topicIds) : Promise.resolve({ data: [] }),
    topicLegacyIds.length ? supabase.from('content_topics').select('id, legacy_id, subject_id, is_active').in('legacy_id', topicLegacyIds) : Promise.resolve({ data: [] }),
    setIds.length ? supabase.from('exam_sets').select('id, bank, subject_id').in('id', setIds) : Promise.resolve({ data: [] }),
    trackIds.length ? supabase.from('exam_tracks').select('id').in('id', trackIds) : Promise.resolve({ data: [] }),
  ]);
  if (subjectsRes.error) throw subjectsRes.error;
  if (topicsRes.error) throw topicsRes.error;
  if (legacyTopicsRes.error) throw legacyTopicsRes.error;
  if (setsRes.error) throw setsRes.error;
  if (tracksRes.error) throw tracksRes.error;

  const validSubjectIds = new Set((subjectsRes.data || []).map((item) => item.id));
  const topicMap = new Map((topicsRes.data || []).map((item) => [item.id, item]));
  const topicLegacyMap = new Map((legacyTopicsRes.data || []).map((item) => [item.legacy_id, item]));
  const setMap = new Map((setsRes.data || []).map((item) => [item.id, item]));
  const validTrackIds = new Set((tracksRes.data || []).map((item) => item.id));

  const insertRows = [];
  const rowMeta = [];

  for (const draft of drafts) {
    if (failedIndexes.has(draft.index)) continue;

    if (!validSubjectIds.has(draft.subjectId)) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ไม่พบวิชานี้ในระบบ' }); continue; }
    const topic = draft.topicId ? topicMap.get(draft.topicId) : topicLegacyMap.get(draft.topicLegacyId);
    if (draft.topicId || draft.topicLegacyId) {
      if (!topic || !topic.is_active) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ไม่พบหมวดย่อยนี้ หรือถูกปิดใช้งาน' }); continue; }
      if (topic.subject_id !== draft.subjectId) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'หมวดย่อยไม่ตรงกับวิชาที่ระบุ' }); continue; }
    }
    if (draft.setId) {
      const set = setMap.get(draft.setId);
      if (!set) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ไม่พบชุดข้อสอบนี้' }); continue; }
      if (set.bank !== draft.bank) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'คลังข้อสอบของชุดไม่ตรงกับข้อนี้' }); continue; }
      if (set.subject_id && set.subject_id !== draft.subjectId) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'วิชาของชุดไม่ตรงกับข้อนี้' }); continue; }
    }
    if (draft.trackId && !validTrackIds.has(draft.trackId)) { errors.push({ index: draft.index, stem: stemPreview(draft.stem), message: 'ไม่พบสายงานนี้' }); continue; }

    insertRows.push({
      bank: draft.bank,
      subject_id: draft.subjectId,
      topic_id: topic?.id || null,
      track_id: draft.trackId || null,
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

export async function GET(request) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const questionTopicId = normalizeOptionalId(searchParams.get('topicId'));
    const questionSubjectId = normalizeOptionalId(searchParams.get('subjectId'));

    // การกรองตามหมวดย่อย/วิชาใช้เพื่อค้นหาและจัดการข้อสอบเก่าที่อาจหลุดจากหน้าต่าง
    // 80 ข้อล่าสุด — จึงดึงมากกว่าปกติเฉพาะตอนกรอง แทนที่จะพึ่ง limit เดียวตลอด
    let questionsQuery = supabase
      .from('question_bank_questions')
      .select('id, bank, subject_id, topic_id, track_id, stem, choices, correct_choice, explanation, source_reference, difficulty, is_active, created_at, content_subjects(name), content_topics(name), exam_set_questions(exam_sets(id, title, slug))')
      .order('created_at', { ascending: false });
    if (questionTopicId) questionsQuery = questionsQuery.eq('topic_id', questionTopicId).limit(500);
    else if (questionSubjectId) questionsQuery = questionsQuery.eq('subject_id', questionSubjectId).limit(200);
    else questionsQuery = questionsQuery.limit(80);

    const results = await Promise.all([
      supabase.from('content_subjects').select('id, name, short_name, accent, sort_order').eq('is_active', true).order('sort_order'),
      supabase.from('content_topics').select('id, legacy_id, subject_id, name, description, sort_order, is_active').order('sort_order').order('name'),
      questionsQuery,
      supabase.from('exam_sets').select('id, slug, bank, title, description, subject_id, topic_id, track_id, duration_minutes, difficulty, is_free, status, created_at, content_subjects(name), content_topics(name), exam_set_questions(count)').order('created_at', { ascending: false }).limit(80),
      supabase.from('announcements').select('id, title, summary, body, tone, audience, show_on_login, is_published, starts_at, ends_at, created_at').order('created_at', { ascending: false }).limit(80),
      // สถิติ (จำนวนข้อสอบที่เปิดใช้ / ความพร้อมของสายงาน) ต้องนับจากทั้งหมดจริง ไม่ใช่แค่
      // หน้าต่าง 80 ข้อล่าสุดด้านบน — คอลัมน์ที่ดึงจึงเล็กมาก ทำให้ดึงแบบไม่จำกัดได้อย่างประหยัด
      supabase.from('question_bank_questions').select('id, bank, subject_id, track_id, is_active').limit(5000),
    ]);
    const [subjectsResult, topicsResult, questionsResult, setsResult, announcementsResult, questionCountsResult] = results;
    for (const result of results) if (result.error) throwSchemaHint(result.error);

    // Topic groups were introduced after the initial content migration. Keep the
    // administration page usable until the new migration is run, but enrich the
    // topic list as soon as the hierarchy is available.
    let topicGroups = [];
    let topics = (topicsResult.data || []).map((item) => ({ ...item, group_id: null }));
    const [topicGroupsResult, groupedTopicsResult] = await Promise.all([
      supabase.from('content_topic_groups').select('id, subject_id, name, description, sort_order, is_active').order('sort_order').order('name'),
      supabase.from('content_topics').select('id, legacy_id, subject_id, group_id, name, description, sort_order, is_active').order('sort_order').order('name'),
    ]);
    if (topicGroupsResult.error && !isOptionalHierarchySchemaError(topicGroupsResult.error)) throw topicGroupsResult.error;
    if (groupedTopicsResult.error && !isOptionalHierarchySchemaError(groupedTopicsResult.error)) throw groupedTopicsResult.error;
    if (!topicGroupsResult.error) topicGroups = topicGroupsResult.data || [];
    if (!groupedTopicsResult.error) topics = groupedTopicsResult.data || [];

    // สายงาน (exam_tracks) เป็นตารางที่เพิ่มเข้ามาทีหลัง — ถ้ายังไม่ได้รัน migration
    // ให้คืนค่าว่างแทนการทำให้ทั้งหน้าแอดมินใช้งานไม่ได้
    const [tracksResult, blueprintsResult] = await Promise.all([
      supabase.from('exam_tracks').select('id, name, short_name, description, total_questions, duration_minutes, sort_order, is_active').order('sort_order'),
      supabase.from('exam_track_blueprints').select('track_id, subject_id, question_count'),
    ]);
    if (tracksResult.error && tracksResult.error.code !== '42P01' && tracksResult.error.code !== 'PGRST205') throw tracksResult.error;
    if (blueprintsResult.error && blueprintsResult.error.code !== '42P01' && blueprintsResult.error.code !== 'PGRST205') throw blueprintsResult.error;

    return NextResponse.json({
      subjects: subjectsResult.data || [],
      topics,
      topicGroups,
      questions: questionsResult.data || [],
      sets: setsResult.data || [],
      announcements: announcementsResult.data || [],
      tracks: tracksResult.data || [],
      trackBlueprints: blueprintsResult.data || [],
      questionCounts: questionCountsResult.data || [],
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
    if (body?.type === 'topic-group') return await createTopicGroup(supabase, admin.id, body);
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
    const supabase = getSupabaseAdmin();

    if (body?.type === 'announcement') {
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

    if (body?.type === 'set') return await updateSet(supabase, admin.id, body);
    if (body?.type === 'topic') return await updateTopic(supabase, admin.id, body);
    if (body?.type === 'topic-group') return await updateTopicGroup(supabase, admin.id, body);

    if (body?.type !== 'question') throw requestError('ข้อมูลข้อสอบไม่ถูกต้อง');

    const bank = normalizeText(body.bank, 20);
    const subjectId = normalizeText(body.subjectId, 80);
    const stem = normalizeText(body.stem, 8000);
    const difficulty = normalizeText(body.difficulty, 20) || 'medium';
    const choices = normaliseChoices(body.choices);
    const correctChoice = normalizeText(body.correctChoice, 4).toUpperCase();
    if (!QUESTION_BANKS.has(bank) || !subjectId || !stem || !DIFFICULTIES.has(difficulty)) throw requestError('ข้อมูลข้อสอบไม่ครบหรือไม่ถูกต้อง (คำถามต้องใช้ bank: practice)');
    if (!choices.some((choice) => choice.id === correctChoice)) throw requestError('กรุณาเลือกคำตอบที่ถูกต้อง');

    const topicId = normalizeOptionalId(body.topicId);
    const trackId = normalizeOptionalId(body.trackId);
    await validateTopicSubject(supabase, topicId, subjectId);
    await validateTrack(supabase, trackId);
    await ensureQuestionMatchesAssignedSets(supabase, body.id, bank, subjectId);
    const { data, error } = await supabase
      .from('question_bank_questions')
      .update({
        bank,
        subject_id: subjectId,
        topic_id: topicId,
        track_id: trackId,
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
      .select('id, bank, subject_id, topic_id, track_id, stem, choices, correct_choice, explanation, difficulty, is_active')
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
    const id = normalizeOptionalId(body?.id);
    if (!id) throw requestError('ข้อมูลที่ต้องการลบไม่ถูกต้อง');
    const supabase = getSupabaseAdmin();

    if (body?.type === 'set') return await deleteSet(supabase, admin.id, id);
    if (body?.type === 'topic') return await archiveTopic(supabase, admin.id, id);
    if (body?.type === 'topic-group') return await archiveTopicGroup(supabase, admin.id, id);
    if (body?.type === 'announcement') return await deleteAnnouncement(supabase, admin.id, id);
    if (body?.type !== 'question') throw requestError('ข้อมูลข้อสอบไม่ถูกต้อง');

    const { data, error } = await supabase
      .from('question_bank_questions')
      .update({ is_active: false, updated_by: admin.id })
      .eq('id', id)
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
