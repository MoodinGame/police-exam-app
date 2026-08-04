'use client';

import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, UploadCloud, X } from 'lucide-react';

const TEMPLATE_HEADERS = ['โจทย์', 'ตัวเลือก A', 'ตัวเลือก B', 'ตัวเลือก C', 'ตัวเลือก D', 'เฉลย', 'คำอธิบาย', 'ระดับความยาก'];
const TEMPLATE_SAMPLE = [
  'ผู้ใดขับรถโดยประมาทเป็นเหตุให้ผู้อื่นถึงแก่ความตาย มีความผิดตามข้อใด',
  'จำคุกไม่เกิน 10 ปี และปรับไม่เกิน 200,000 บาท',
  'ปรับอย่างเดียวไม่เกิน 50,000 บาท',
  'ตักเตือนและพักใช้ใบอนุญาต',
  'ไม่มีความผิดหากไม่มีเจตนา',
  'A',
  'เป็นความผิดฐานกระทำโดยประมาทเป็นเหตุให้ผู้อื่นถึงแก่ความตาย',
  'ปานกลาง',
];

// สร้างไฟล์ตัวอย่างฝั่ง client (BOM หน้าไฟล์เพื่อให้ Excel เปิดภาษาไทยได้ถูกต้อง)
function downloadTemplate() {
  const escapeCell = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [TEMPLATE_HEADERS, TEMPLATE_SAMPLE].map((row) => row.map(escapeCell).join(',')).join('\r\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template-import-questions.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function buildTopicOptions(topics, subjectId) {
  const scoped = topics.filter((item) => item.subject_id === subjectId && item.is_active !== false);
  const byParent = new Map();
  for (const item of scoped) {
    const key = item.parent_id || '__root__';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(item);
  }
  const sortNodes = (list) => [...list].sort((a, b) => (
    (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'th')
  ));
  const options = [];
  const walk = (key, depth) => {
    for (const item of sortNodes(byParent.get(key) || [])) {
      options.push({ id: item.id, label: `${'— '.repeat(depth)}${item.name}` });
      walk(item.id, depth + 1);
    }
  };
  walk('__root__', 0);
  return options;
}

export default function QuestionFileImport({ bank, subjects, topics, trackId, saving, onCommit }) {
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [fileName, setFileName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const topicOptions = useMemo(() => (subjectId ? buildTopicOptions(topics, subjectId) : []), [topics, subjectId]);
  const validRows = preview?.rows.filter((row) => row.errors.length === 0) || [];

  const reset = () => {
    setPreview(null);
    setFileName('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const analyze = async (file) => {
    if (!file) return;
    setError('');
    setPreview(null);
    setFileName(file.name);
    setAnalyzing(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/admin/import-questions', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'อ่านไฟล์ไม่สำเร็จ');
      setPreview(result);
    } catch (analyzeError) {
      setError(analyzeError.message || 'อ่านไฟล์ไม่สำเร็จ');
      setFileName('');
    } finally {
      setAnalyzing(false);
    }
  };

  const commit = async () => {
    if (!subjectId || validRows.length === 0) return;
    const items = validRows.map((row) => ({
      bank,
      subjectId,
      topicId: topicId || null,
      trackId: trackId || undefined,
      stem: row.stem,
      choices: row.choices,
      correctChoice: row.correctChoice,
      explanation: row.explanation,
      sourceReference: row.sourceReference,
      difficulty: row.difficulty,
    }));
    const succeeded = await onCommit(items);
    if (succeeded) reset();
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy"><FileSpreadsheet size={19} className="text-cyan-600" /> นำเข้าข้อสอบจากไฟล์</h2>
          <p className="mt-1 text-sm text-graydark/55">อัปโหลด Excel (.xlsx) หรือ CSV ทีเดียวได้หลายข้อ ระบบจะอ่านโจทย์ ตัวเลือก และเฉลยให้อัตโนมัติ</p>
        </div>
        <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2.5 text-sm font-semibold text-cyan-800 hover:bg-cyan-100">
          <Download size={16} /> ดาวน์โหลดไฟล์ตัวอย่าง
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-graydark">วิชาหลัก <span className="text-red-500">*</span>
          <select required value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicId(''); }} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10">
            <option value="">เลือกวิชา</option>
            {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-graydark">หมวด / หัวข้อย่อย
          <select value={topicId} disabled={!subjectId} onChange={(event) => setTopicId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:bg-slate-100">
            <option value="">ไม่ระบุหัวข้อ (เก็บไว้ในวิชา)</option>
            {topicOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); analyze(event.dataTransfer.files?.[0]); }}
        className={`rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${dragging ? 'border-cyan-400 bg-cyan-50' : 'border-slate-300 bg-slate-50/60'}`}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.csv,.tsv,.xls" onChange={(event) => analyze(event.target.files?.[0])} className="hidden" id="question-import-file" />
        {analyzing ? (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700"><LoaderCircle size={17} className="animate-spin" /> กำลังตรวจสอบไฟล์...</p>
        ) : (
          <>
            <UploadCloud size={30} className="mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-semibold text-navy">{fileName || 'ลากไฟล์มาวางที่นี่'}</p>
            <p className="mt-1 text-xs text-graydark/50">รองรับ .xlsx และ .csv · สูงสุด 300 ข้อต่อไฟล์</p>
            <label htmlFor="question-import-file" className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#152856]">เลือกไฟล์</label>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{error}</span>
          <button type="button" onClick={() => setError('')} className="font-bold opacity-70 hover:opacity-100" aria-label="ปิด"><X size={15} /></button>
        </div>
      )}

      {preview && (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700"><CheckCircle2 size={15} /> พร้อมนำเข้า {preview.summary.validCount} ข้อ</span>
            {preview.summary.invalidCount > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700"><AlertTriangle size={15} /> มีปัญหา {preview.summary.invalidCount} ข้อ</span>}
            {preview.summary.truncated && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">ไฟล์เกิน 300 ข้อ ระบบอ่านเฉพาะ 300 ข้อแรก</span>}
            <button type="button" onClick={reset} className="ml-auto text-xs font-semibold text-graydark/55 hover:text-navy">ล้างไฟล์</button>
          </div>

          <div className="max-h-96 overflow-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-slate-100 text-xs font-bold text-graydark/70">
                <tr>
                  <th className="px-3 py-2">แถว</th>
                  <th className="px-3 py-2">โจทย์</th>
                  <th className="px-3 py-2">ตัวเลือก</th>
                  <th className="px-3 py-2">เฉลย</th>
                  <th className="px-3 py-2">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => {
                  const ok = row.errors.length === 0;
                  return (
                    <tr key={row.rowNumber} className={`border-t border-slate-100 ${ok ? '' : 'bg-red-50/60'}`}>
                      <td className="px-3 py-2 align-top text-xs font-semibold text-graydark/50">{row.rowNumber}</td>
                      <td className="max-w-md px-3 py-2 align-top"><span className="line-clamp-2 text-sm text-navy">{row.stem || <em className="text-red-600">ว่าง</em>}</span></td>
                      <td className="px-3 py-2 align-top text-xs text-graydark/60">{row.choices.length} ตัวเลือก</td>
                      <td className="px-3 py-2 align-top text-xs font-bold text-navy">{row.correctChoice || '—'}</td>
                      <td className="px-3 py-2 align-top text-xs">
                        {ok ? <span className="font-semibold text-emerald-700">พร้อม</span> : <span className="text-red-700">{row.errors.join(' · ')}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!subjectId && <p className="text-xs font-semibold text-amber-700">กรุณาเลือกวิชาหลักก่อนกดนำเข้า</p>}
          <button
            type="button"
            onClick={commit}
            disabled={saving || !subjectId || validRows.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-navy/15 transition hover:-translate-y-0.5 hover:bg-[#152856] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <UploadCloud size={17} />{saving ? 'กำลังนำเข้า...' : `นำเข้า ${validRows.length} ข้อเข้าคลัง`}
          </button>
        </div>
      )}
    </section>
  );
}
