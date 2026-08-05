import { inflateRawSync } from 'zlib';

// อ่านไฟล์ตารางแบบไม่พึ่ง dependency ภายนอก
//   - CSV/TSV: แยกเองรองรับเครื่องหมายคำพูดและบรรทัดใหม่ในเซลล์
//   - XLSX: แกะ ZIP + inflate ด้วย zlib ของ Node แล้วอ่าน XML ของชีทแรก
// เหตุผลที่ไม่ใช้ไลบรารี xlsx บน npm: เวอร์ชันล่าสุดบน npm ค้างอยู่ที่ 0.18.5 ซึ่งมีช่องโหว่ที่ยังไม่ถูกแก้

export function parseDelimited(text, delimiter = ',') {
  const clean = text.replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];

    if (quoted) {
      if (char === '"') {
        if (clean[index + 1] === '"') { field += '"'; index += 1; }
        else quoted = false;
      } else field += char;
      continue;
    }

    if (char === '"') { quoted = true; continue; }
    if (char === delimiter) { row.push(field); field = ''; continue; }
    if (char === '\r') continue;
    if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += char;
  }

  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((item) => item.some((cell) => String(cell).trim() !== ''));
}

// ---- XLSX ----------------------------------------------------------------

function readZipEntries(buffer) {
  // มองหา End of Central Directory จากท้ายไฟล์ (คอมเมนต์ท้ายไฟล์ยาวได้ไม่เกิน 65535 ไบต์)
  let eocd = -1;
  const from = Math.max(0, buffer.length - 65557);
  for (let index = buffer.length - 22; index >= from; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) { eocd = index; break; }
  }
  if (eocd < 0) throw new Error('ไฟล์ Excel ไม่ถูกต้อง (ไม่พบโครงสร้าง ZIP)');

  const entryCount = buffer.readUInt16LE(eocd + 10);
  let pointer = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(pointer) !== 0x02014b50) break;
    const nameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 30);
    const commentLength = buffer.readUInt16LE(pointer + 32);
    const localOffset = buffer.readUInt32LE(pointer + 42);
    const name = buffer.toString('utf8', pointer + 46, pointer + 46 + nameLength);
    entries.set(name, localOffset);
    pointer += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function readZipFile(buffer, entries, name) {
  const offset = entries.get(name);
  if (offset === undefined) return null;
  if (buffer.readUInt32LE(offset) !== 0x04034b50) return null;

  const method = buffer.readUInt16LE(offset + 8);
  let compressedSize = buffer.readUInt32LE(offset + 18);
  const nameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const start = offset + 30 + nameLength + extraLength;

  // ถ้าเขียนแบบ streaming ขนาดจะอยู่ใน data descriptor ท้ายข้อมูลแทน — เดาจากจุดเริ่มของ entry ถัดไป
  if (compressedSize === 0) {
    const next = [...entries.values()].filter((value) => value > offset).sort((a, b) => a - b)[0];
    compressedSize = (next ?? buffer.length) - start;
  }

  const raw = buffer.subarray(start, start + compressedSize);
  if (method === 0) return raw;
  if (method === 8) return inflateRawSync(raw);
  throw new Error('ไฟล์ Excel ใช้การบีบอัดที่ระบบยังไม่รองรับ');
}

function decodeXmlText(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&');
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  const items = [];
  // แต่ละ <si> อาจถูกแบ่งเป็นหลาย <t> เมื่อมีการจัดรูปแบบต่างกันในเซลล์เดียว จึงต้องต่อกลับ
  for (const match of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const parts = [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => part[1]);
    items.push(decodeXmlText(parts.join('')));
  }
  return items;
}

function columnToIndex(ref) {
  const letters = (ref.match(/^[A-Z]+/) || [''])[0];
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}

function parseSheet(xml, sharedStrings) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const ref = (attributes.match(/r="([A-Z]+\d+)"/) || [])[1];
      const type = (attributes.match(/t="([^"]+)"/) || [])[1];
      const position = ref ? columnToIndex(ref) : cells.length;

      let value = '';
      if (type === 'inlineStr') {
        const parts = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => part[1]);
        value = decodeXmlText(parts.join(''));
      } else {
        const rawValue = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        if (rawValue !== undefined) {
          value = type === 's' ? (sharedStrings[Number(rawValue)] ?? '') : decodeXmlText(rawValue);
        }
      }

      while (cells.length < position) cells.push('');
      cells[position] = value;
    }
    rows.push(cells);
  }
  return rows.filter((row) => row.some((cell) => String(cell).trim() !== ''));
}

export function parseXlsx(buffer) {
  const entries = readZipEntries(buffer);
  const sheetName = [...entries.keys()]
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort()[0];
  if (!sheetName) throw new Error('ไม่พบชีทข้อมูลในไฟล์ Excel');

  const sharedBuffer = readZipFile(buffer, entries, 'xl/sharedStrings.xml');
  const sharedStrings = parseSharedStrings(sharedBuffer ? sharedBuffer.toString('utf8') : '');
  const sheetBuffer = readZipFile(buffer, entries, sheetName);
  if (!sheetBuffer) throw new Error('อ่านชีทข้อมูลในไฟล์ Excel ไม่สำเร็จ');
  return parseSheet(sheetBuffer.toString('utf8'), sharedStrings);
}

export function parseSpreadsheet(fileName, buffer) {
  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.xlsx')) return parseXlsx(buffer);
  if (lower.endsWith('.xls')) {
    throw new Error('ไฟล์ .xls รุ่นเก่ายังไม่รองรับ กรุณาบันทึกใหม่เป็น .xlsx หรือ .csv');
  }
  const text = buffer.toString('utf8');
  return parseDelimited(text, lower.endsWith('.tsv') ? '\t' : ',');
}
