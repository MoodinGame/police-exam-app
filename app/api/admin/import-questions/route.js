import { NextResponse } from 'next/server';
import { apiErrorResponse, requireAdmin } from '@/lib/serverUser';
import { parseSpreadsheet } from '@/lib/spreadsheet';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 300;
const CHOICE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const THAI_CHOICE_LETTERS = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ'];

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// เทียบชื่อคอลัมน์แบบไม่สนตัวพิมพ์ ช่องว่าง หรือเครื่องหมายวรรคตอน เพื่อให้แอดมินตั้งหัวตารางได้อิสระ
function normalizeHeader(value) {
  return String(value || '').toLowerCase().replace(/[\s._\-()]/g, '');
}

const HEADER_ALIASES = {
  stem: ['โจทย์', 'คำถาม', 'ข้อสอบ', 'question', 'stem'],
  explanation: ['คำอธิบาย', 'อธิบาย', 'เฉลยละเอียด', 'explanation'],
  correct: ['เฉลย', 'คำตอบ', 'คำตอบที่ถูก', 'answer', 'correct', 'correctchoice', 'key'],
  difficulty: ['ระดับ', 'ความยาก', 'ระดับความยาก', 'difficulty', 'level'],
  source: ['ที่มา', 'อ้างอิง', 'หมายเหตุ', 'source', 'reference'],
};

function detectColumns(headerRow) {
  const map = { choices: [] };
  headerRow.forEach((raw, index) => {
    const key = normalizeHeader(raw);
    if (!key) return;

    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (map[field] === undefined && aliases.some((alias) => key === normalizeHeader(alias))) {
        map[field] = index;
        return;
      }
    }

    // ตัวเลือกคำตอบ: รองรับทั้ง "ตัวเลือก A", "choice1", "ก", "A"
    const choiceMatch = key.match(/^(?:ตัวเลือก|choice|option|ข้อ)?\s*([a-f]|[1-6]|[ก-ฉ])$/);
    if (choiceMatch) {
      const token = choiceMatch[1];
      let position = CHOICE_LETTERS.indexOf(token.toUpperCase());
      if (position < 0) position = THAI_CHOICE_LETTERS.indexOf(token);
      if (position < 0 && /^[1-6]$/.test(token)) position = Number(token) - 1;
      if (position >= 0) map.choices[position] = index;
    }
  });
  return map;
}

function cell(row, index) {
  if (index === undefined || index < 0) return '';
  return String(row[index] ?? '').trim();
}

function resolveCorrectChoice(rawValue, choices) {
  const value = String(rawValue || '').trim();
  if (!value) return null;

  // "ข้อ ก" / "ตัวเลือก B" -> เอาเฉพาะตัวระบุ
  const token = value.replace(/^(?:ข้อ|ตัวเลือก|choice|option)\s*/i, '').trim();

  const upper = token.toUpperCase();
  if (CHOICE_LETTERS.includes(upper) && upper.charCodeAt(0) - 65 < choices.length) return upper;

  const thaiIndex = THAI_CHOICE_LETTERS.indexOf(token);
  if (thaiIndex >= 0 && thaiIndex < choices.length) return CHOICE_LETTERS[thaiIndex];

  if (/^[1-6]$/.test(token) && Number(token) <= choices.length) return CHOICE_LETTERS[Number(token) - 1];

  // เขียนข้อความคำตอบมาเต็ม ๆ ก็จับคู่ให้
  const matched = choices.findIndex((choice) => choice.toLowerCase() === value.toLowerCase());
  if (matched >= 0) return CHOICE_LETTERS[matched];

  return null;
}

function normalizeDifficulty(value) {
  const key = String(value || '').trim().toLowerCase();
  if (['ง่าย', 'easy', 'low'].includes(key)) return 'easy';
  if (['ยาก', 'hard', 'high'].includes(key)) return 'hard';
  return 'medium';
}

export async function POST(request) {
  try {
    await requireAdmin();

    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') throw requestError('กรุณาแนบไฟล์ข้อสอบ');
    if (file.size > MAX_FILE_BYTES) throw requestError('ไฟล์ใหญ่เกิน 5 MB กรุณาแบ่งไฟล์ก่อนนำเข้า');

    const buffer = Buffer.from(await file.arrayBuffer());
    let table;
    try {
      table = parseSpreadsheet(file.name, buffer);
    } catch (parseFailure) {
      throw requestError(parseFailure.message || 'อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบรูปแบบไฟล์');
    }
    if (table.length < 2) throw requestError('ไฟล์ต้องมีบรรทัดหัวตาราง และข้อสอบอย่างน้อย 1 ข้อ');

    const columns = detectColumns(table[0]);
    if (columns.stem === undefined) {
      throw requestError('ไม่พบคอลัมน์โจทย์ กรุณาตั้งชื่อหัวตารางว่า "โจทย์" หรือ "question"');
    }
    const choiceColumns = columns.choices.filter((value) => value !== undefined);
    if (choiceColumns.length < 2) {
      throw requestError('ต้องมีคอลัมน์ตัวเลือกอย่างน้อย 2 ช่อง เช่น "ตัวเลือก A" และ "ตัวเลือก B"');
    }
    if (columns.correct === undefined) {
      throw requestError('ไม่พบคอลัมน์เฉลย กรุณาตั้งชื่อหัวตารางว่า "เฉลย" หรือ "answer"');
    }

    const dataRows = table.slice(1, MAX_ROWS + 1);
    const rows = dataRows.map((row, index) => {
      const errors = [];
      const stem = cell(row, columns.stem);
      const choices = columns.choices.map((columnIndex) => cell(row, columnIndex)).filter((value) => value !== '');
      const rawCorrect = cell(row, columns.correct);
      const correctChoice = resolveCorrectChoice(rawCorrect, choices);

      if (!stem) errors.push('ไม่มีโจทย์');
      if (choices.length < 2) errors.push('ต้องมีตัวเลือกอย่างน้อย 2 ข้อ');
      if (!rawCorrect) errors.push('ไม่ได้ระบุเฉลย');
      else if (!correctChoice) errors.push(`เฉลย "${rawCorrect}" ไม่ตรงกับตัวเลือกใด`);

      return {
        rowNumber: index + 2, // +2 เพราะข้ามหัวตารางและนับจาก 1 ให้ตรงกับเลขบรรทัดใน Excel
        stem,
        choices,
        correctChoice,
        explanation: cell(row, columns.explanation) || null,
        sourceReference: cell(row, columns.source) || null,
        difficulty: normalizeDifficulty(cell(row, columns.difficulty)),
        errors,
      };
    });

    const validCount = rows.filter((row) => row.errors.length === 0).length;
    return NextResponse.json({
      rows,
      summary: {
        totalRows: rows.length,
        validCount,
        invalidCount: rows.length - validCount,
        skippedRows: Math.max(0, dataRows.length - rows.length),
        truncated: table.length - 1 > MAX_ROWS,
        detectedChoiceColumns: choiceColumns.length,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
