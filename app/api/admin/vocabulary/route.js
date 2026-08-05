import { NextResponse } from 'next/server';
import { getFallbackVocabularyLibrary } from '@/lib/vocabulary';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const DECK_ICONS = new Set(['book', 'shield', 'scale', 'file', 'cpu', 'calculator', 'thai', 'english']);
const DECK_TONES = new Set(['navy', 'emerald', 'sky', 'teal', 'rose', 'purple', 'violet', 'cyan']);
const DECK_KINDS = new Set(['subject', 'english', 'police', 'custom']);
const CARD_KINDS = new Set(['vocabulary', 'subject', 'custom']);
const CEFR_LEVELS = new Set(['A1', 'A2', 'B1', 'B2']);
const MAX_BULK_CARDS = 500;

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function compactText(value, maximum = 5000) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function optionalText(value, maximum) {
  return compactText(value, maximum) || null;
}

function slug(value) {
  return compactText(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function validId(value, label) {
  if (!/^[a-z0-9][a-z0-9-]{1,120}$/.test(value)) throw requestError(`${label}ต้องเป็นตัวอักษรอังกฤษพิมพ์เล็ก ตัวเลข หรือ -`);
  return value;
}

function deckValues(body, { includeId = false } = {}) {
  const title = compactText(body.title, 120);
  const shortTitle = compactText(body.shortTitle, 60) || title;
  const icon = compactText(body.icon, 30) || 'book';
  const tone = compactText(body.tone, 30) || 'cyan';
  const kind = compactText(body.kind, 30) || 'subject';
  if (!title) throw requestError('กรุณาระบุชื่อชุดแฟลชการ์ด');
  if (!DECK_ICONS.has(icon) || !DECK_TONES.has(tone) || !DECK_KINDS.has(kind)) throw requestError('รูปแบบชุดแฟลชการ์ดไม่ถูกต้อง');
  const values = {
    subject_id: optionalText(body.subjectId, 80),
    title,
    short_title: shortTitle,
    description: optionalText(body.description, 1000),
    note: optionalText(body.note, 1000),
    icon,
    tone,
    kind,
    sort_order: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    is_active: body.isActive !== false,
  };
  if (includeId) values.id = validId(slug(body.id || title), 'รหัสชุด');
  return values;
}

function cardValues(body, { includeId = false } = {}) {
  const word = compactText(body.word, 240);
  const deckId = compactText(body.deckId, 100);
  const kind = compactText(body.kind, 30) || 'vocabulary';
  if (!word || !deckId) throw requestError('กรุณาเลือกชุดและระบุคำศัพท์/คำถามด้านหน้า');
  if (!CARD_KINDS.has(kind)) throw requestError('ชนิดของบัตรคำไม่ถูกต้อง');
  const requestedLevel = optionalText(body.level, 80);
  const level = requestedLevel && CEFR_LEVELS.has(requestedLevel.toUpperCase()) ? requestedLevel.toUpperCase() : requestedLevel;
  const values = {
    deck_id: deckId,
    subject_id: optionalText(body.subjectId, 80),
    word,
    phonetic: optionalText(body.phonetic, 300),
    thai_reading: optionalText(body.thaiReading, 300),
    part_of_speech: optionalText(body.partOfSpeech, 100),
    level,
    translation: compactText(body.translation, 1500),
    meaning: optionalText(body.meaning, 2000),
    example: optionalText(body.example, 2000),
    kind,
    sort_order: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    is_active: body.isActive !== false,
  };
  if (includeId) values.id = validId(slug(body.id || `${deckId}-${word}`), 'รหัสบัตรคำ');
  return values;
}

function isOxfordDeck(deck) {
  return deck?.id === 'oxford-3000' || deck?.kind === 'english';
}

function validateOxfordLevel(deck, level) {
  if (isOxfordDeck(deck) && !CEFR_LEVELS.has(level || '')) {
    throw requestError('Oxford vocabulary cards require an A1, A2, B1, or B2 level.');
  }
}

async function validateCardDeckAndLevel(supabase, deckId, level) {
  const { data: deck, error } = await supabase
    .from('vocabulary_decks')
    .select('id, kind')
    .eq('id', deckId)
    .maybeSingle();
  if (error) throw error;
  if (!deck) throw requestError('Vocabulary deck not found.', 404);
  validateOxfordLevel(deck, level);
}

async function importCards(supabase, adminId, body) {
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const defaultDeckId = compactText(body.deckId, 100);
  if (!rawItems.length) throw requestError('กรุณาระบุรายการคำศัพท์อย่างน้อย 1 คำ');
  if (rawItems.length > MAX_BULK_CARDS) throw requestError(`นำเข้าได้ไม่เกิน ${MAX_BULK_CARDS} คำต่อครั้ง`);

  const values = rawItems.map((item, index) => {
    const deckId = compactText(item?.deckId, 100) || defaultDeckId;
    const word = compactText(item?.word, 240);
    const id = compactText(item?.id, 120) || `${deckId}-${word}-${index + 1}`;
    return cardValues({ ...item, deckId, word, id }, { includeId: true });
  });
  const deckIds = [...new Set(values.map((item) => item.deck_id))];
  const { data: decks, error: decksError } = await supabase.from('vocabulary_decks').select('id, kind').in('id', deckIds);
  if (decksError) throw decksError;
  const deckById = new Map((decks || []).map((deck) => [deck.id, deck]));
  values.forEach((item) => validateOxfordLevel(deckById.get(item.deck_id), item.level));
  if ((decks || []).length !== deckIds.length) throw requestError('ไม่พบชุดคำศัพท์ที่เลือกสำหรับนำเข้า');

  const rows = values.map((item) => ({ ...item, created_by: adminId, updated_by: adminId }));
  const { error } = await supabase.from('vocabulary_cards').insert(rows);
  if (error) throw error;
  await writeAudit(supabase, adminId, 'bulk-import-cards', 'vocabulary-import', { inserted: rows.length, deckIds });
  return NextResponse.json({ inserted: rows.length, message: `นำเข้าคำศัพท์ ${rows.length} คำเรียบร้อย` }, { status: 201 });
}

function mapDeck(row) {
  return { id: row.id, subjectId: row.subject_id || null, title: row.title, shortTitle: row.short_title, description: row.description || '', note: row.note || '', icon: row.icon, tone: row.tone, kind: row.kind, sortOrder: row.sort_order, isActive: row.is_active !== false };
}

function mapCard(row) {
  return { id: row.id, deckId: row.deck_id, subjectId: row.subject_id || null, word: row.word, phonetic: row.phonetic || '', thaiReading: row.thai_reading || '', partOfSpeech: row.part_of_speech || '', level: row.level || '', translation: row.translation || '', meaning: row.meaning || '', example: row.example || '', kind: row.kind, sortOrder: row.sort_order, isActive: row.is_active !== false };
}

async function writeAudit(supabase, adminId, action, entityId, detail = {}) {
  // Older installations may not have the audit table yet; vocabulary itself
  // must remain usable in that case.
  await supabase.from('admin_audit_logs').insert({ admin_id: adminId, action, entity_type: 'vocabulary', entity_id: entityId, detail });
}

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const [decksResult, cardsResult, subjectsResult] = await Promise.all([
      supabase.from('vocabulary_decks').select('id, subject_id, title, short_title, description, note, icon, tone, kind, sort_order, is_active').order('sort_order').order('title'),
      supabase.from('vocabulary_cards').select('id, deck_id, subject_id, word, phonetic, thai_reading, part_of_speech, level, translation, meaning, example, kind, sort_order, is_active').order('deck_id').order('sort_order').order('word'),
      supabase.from('content_subjects').select('id, name, short_name').eq('is_active', true).order('sort_order'),
    ]);
    if (decksResult.error || cardsResult.error || subjectsResult.error) {
      const error = decksResult.error || cardsResult.error || subjectsResult.error;
      if (error?.code === '42P01') return NextResponse.json({ migrationRequired: true, decks: [], cards: [], subjects: [] });
      throw error;
    }
    return NextResponse.json({ decks: (decksResult.data || []).map(mapDeck), cards: (cardsResult.data || []).map(mapCard), subjects: subjectsResult.data || [], migrationRequired: false });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    if (body?.action === 'seed-default') {
      const { count, error: countError } = await supabase.from('vocabulary_cards').select('*', { count: 'exact', head: true });
      if (countError) throw countError;
      if (count) throw requestError('มีคำศัพท์ในคลังแล้ว จึงไม่สามารถนำเข้าชุดเริ่มต้นทับได้');
      const library = getFallbackVocabularyLibrary();
      const deckRows = library.decks.map((deck) => ({ id: deck.id, subject_id: deck.subjectId || null, title: deck.title, short_title: deck.shortTitle, description: deck.description || null, note: deck.note || null, icon: deck.icon || 'book', tone: deck.tone || 'cyan', kind: deck.kind || 'subject', sort_order: deck.sortOrder || 0, is_active: true, created_by: admin.id, updated_by: admin.id }));
      const cardRows = library.cards.map((card) => ({ id: card.id, deck_id: card.deckId, subject_id: card.subjectId || null, word: card.word, phonetic: card.phonetic || null, thai_reading: card.thaiReading || null, part_of_speech: card.partOfSpeech || null, level: card.level || null, translation: card.translation || '', meaning: card.meaning || null, example: card.example || null, kind: card.kind || 'vocabulary', sort_order: card.sortOrder || 0, is_active: true, created_by: admin.id, updated_by: admin.id }));
      const { error: deckError } = await supabase.from('vocabulary_decks').insert(deckRows);
      if (deckError) throw deckError;
      const { error: cardError } = await supabase.from('vocabulary_cards').insert(cardRows);
      if (cardError) throw cardError;
      await writeAudit(supabase, admin.id, 'seed-default', 'starter-library', { decks: deckRows.length, cards: cardRows.length });
      return NextResponse.json({ message: `นำเข้าชุดเริ่มต้น ${cardRows.length} ใบเรียบร้อย` }, { status: 201 });
    }

    if (body?.action === 'import-cards') return await importCards(supabase, admin.id, body);

    if (body?.type === 'deck') {
      const values = deckValues(body, { includeId: true });
      const { data, error } = await supabase.from('vocabulary_decks').insert({ ...values, created_by: admin.id, updated_by: admin.id }).select('id, subject_id, title, short_title, description, note, icon, tone, kind, sort_order, is_active').single();
      if (error) throw error;
      await writeAudit(supabase, admin.id, 'create-deck', data.id, { title: data.title });
      return NextResponse.json({ deck: mapDeck(data) }, { status: 201 });
    }

    if (body?.type === 'card') {
      const values = cardValues(body, { includeId: true });
      await validateCardDeckAndLevel(supabase, values.deck_id, values.level);
      const { data, error } = await supabase.from('vocabulary_cards').insert({ ...values, created_by: admin.id, updated_by: admin.id }).select('id, deck_id, subject_id, word, phonetic, thai_reading, part_of_speech, level, translation, meaning, example, kind, sort_order, is_active').single();
      if (error) throw error;
      await writeAudit(supabase, admin.id, 'create-card', data.id, { word: data.word, deckId: data.deck_id });
      return NextResponse.json({ card: mapCard(data) }, { status: 201 });
    }

    throw requestError('ไม่รู้จักประเภทข้อมูลคำศัพท์');
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const id = compactText(body?.id, 120);
    if (!id) throw requestError('ไม่พบข้อมูลที่ต้องการแก้ไข');
    const supabase = getSupabaseAdmin();
    if (body?.type === 'deck') {
      const values = deckValues(body);
      const { data, error } = await supabase.from('vocabulary_decks').update({ ...values, updated_by: admin.id }).eq('id', id).select('id, subject_id, title, short_title, description, note, icon, tone, kind, sort_order, is_active').maybeSingle();
      if (error) throw error;
      if (!data) throw requestError('ไม่พบชุดแฟลชการ์ด', 404);
      await writeAudit(supabase, admin.id, 'update-deck', id, { title: data.title });
      return NextResponse.json({ deck: mapDeck(data) });
    }
    if (body?.type === 'card') {
      const values = cardValues(body);
      await validateCardDeckAndLevel(supabase, values.deck_id, values.level);
      const { data, error } = await supabase.from('vocabulary_cards').update({ ...values, updated_by: admin.id }).eq('id', id).select('id, deck_id, subject_id, word, phonetic, thai_reading, part_of_speech, level, translation, meaning, example, kind, sort_order, is_active').maybeSingle();
      if (error) throw error;
      if (!data) throw requestError('ไม่พบบัตรคำ', 404);
      await writeAudit(supabase, admin.id, 'update-card', id, { word: data.word, deckId: data.deck_id });
      return NextResponse.json({ card: mapCard(data) });
    }
    throw requestError('ไม่รู้จักประเภทข้อมูลคำศัพท์');
  } catch (error) {
    return apiErrorResponse(error);
  }
}
