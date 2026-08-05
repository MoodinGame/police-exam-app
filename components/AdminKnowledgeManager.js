'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  FilePlus2,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';

const EMPTY_ARTICLE = {
  id: '',
  subjectId: '',
  topicId: '',
  title: '',
  summary: '',
  body: '',
  keyPoints: '',
  pitfalls: '',
  examGuide: '',
  isPublished: false,
  sortOrder: 0,
};

const fieldClass = 'mt-1.5 field';

function normalizeArticle(article) {
  return {
    id: article.id,
    subjectId: article.subject_id || '',
    topicId: article.topic_id || '',
    title: article.title || '',
    summary: article.summary || '',
    body: article.body || '',
    keyPoints: Array.isArray(article.key_points) ? article.key_points.join('\n') : '',
    pitfalls: article.pitfalls || '',
    examGuide: article.exam_guide || '',
    isPublished: Boolean(article.is_published),
    sortOrder: article.sort_order || 0,
  };
}

function Message({ tone = 'error', children, onClose }) {
  const styles = tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : 'border-rose-200 bg-rose-50 text-rose-800';
  return <div className={`mb-5 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${styles}`}><span>{children}</span>{onClose && <button type="button" className="shrink-0 text-xs font-bold underline" onClick={onClose}>ปิด</button>}</div>;
}

export default function AdminKnowledgeManager() {
  const [catalog, setCatalog] = useState({ subjects: [], topics: [], articles: [] });
  const [form, setForm] = useState(EMPTY_ARTICLE);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const formTopics = useMemo(
    () => catalog.topics.filter((topic) => topic.subject_id === form.subjectId),
    [catalog.topics, form.subjectId],
  );
  const filteredArticles = useMemo(
    () => subjectFilter ? catalog.articles.filter((article) => article.subject_id === subjectFilter) : catalog.articles,
    [catalog.articles, subjectFilter],
  );
  const names = useMemo(() => ({
    subjects: new Map(catalog.subjects.map((subject) => [subject.id, subject.short_name || subject.name])),
    topics: new Map(catalog.topics.map((topic) => [topic.id, topic.name])),
  }), [catalog]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/knowledge', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถโหลดคลังความรู้ได้');
      setCatalog(result);
    } catch (loadError) {
      setError(loadError.message || 'ไม่สามารถโหลดคลังความรู้ได้');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function updateForm(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'subjectId') next.topicId = '';
      return next;
    });
  }

  async function saveArticle(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const method = form.id ? 'PATCH' : 'POST';
      const response = await fetch('/api/admin/knowledge', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถบันทึกบทเรียนได้');
      setCatalog(result);
      setForm(EMPTY_ARTICLE);
      setNotice(method === 'POST' ? 'สร้างบทเรียนแล้ว เลือก “เผยแพร่” เมื่อต้องการให้ผู้เรียนเห็น' : 'บันทึกบทเรียนแล้ว');
    } catch (saveError) {
      setError(saveError.message || 'ไม่สามารถบันทึกบทเรียนได้');
    } finally {
      setSaving(false);
    }
  }

  function editArticle(article) {
    setForm(normalizeArticle(article));
    setSubjectFilter(article.subject_id || '');
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function removeArticle(article) {
    if (!window.confirm(`ลบบทเรียน “${article.title}” ใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้`)) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/knowledge?id=${encodeURIComponent(article.id)}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถลบบทเรียนได้');
      setCatalog(result);
      if (form.id === article.id) setForm(EMPTY_ARTICLE);
      setNotice('ลบบทเรียนแล้ว');
    } catch (deleteError) {
      setError(deleteError.message || 'ไม่สามารถลบบทเรียนได้');
    } finally {
      setSaving(false);
    }
  }

  return <div>
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-1 text-sm font-bold text-cyan-600">ADMIN · KNOWLEDGE LIBRARY</p>
        <h1 className="text-2xl font-black tracking-tight text-navy sm:text-3xl">จัดการคลังความรู้</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-graydark/60">เขียนบทเรียนให้ตรงวิชาและหมวดย่อย แล้วเผยแพร่เพื่อให้ผู้เรียนเห็นในหน้าคลังความรู้ทันที</p>
      </div>
      <a href="/knowledge" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800 transition hover:bg-cyan-100"><Eye size={17} /> ดูหน้าผู้เรียน</a>
    </header>

    {error && <Message onClose={() => setError('')}>{error}</Message>}
    {notice && <Message tone="success" onClose={() => setNotice('')}>{notice}</Message>}

    <section className="mb-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={saveArticle} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-lg font-black text-navy">{form.id ? 'แก้ไขบทเรียน' : 'สร้างบทเรียนใหม่'}</h2><p className="mt-1 text-sm text-graydark/55">บทความ 1 เรื่องผูกกับหมวดย่อยได้ 1 หมวด เพื่อให้ผู้เรียนหาเนื้อหาได้ง่าย</p></div>
          {form.id && <button type="button" onClick={() => setForm(EMPTY_ARTICLE)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-graydark hover:bg-slate-50">ยกเลิกการแก้ไข</button>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-navy">วิชา<select required value={form.subjectId} onChange={(event) => updateForm('subjectId', event.target.value)} className={fieldClass}><option value="">เลือกวิชา</option>{catalog.subjects.filter((subject) => subject.is_active).map((subject) => <option key={subject.id} value={subject.id}>{subject.short_name || subject.name}</option>)}</select></label>
          <label className="text-sm font-bold text-navy">หมวดย่อย <span className="font-normal text-graydark/45">(ไม่บังคับ)</span><select value={form.topicId} disabled={!form.subjectId} onChange={(event) => updateForm('topicId', event.target.value)} className={fieldClass}><option value="">บทเรียนภาพรวมรายวิชา</option>{formTopics.filter((topic) => topic.is_active).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
        </div>
        <label className="mt-4 block text-sm font-bold text-navy">ชื่อบทเรียน<input required maxLength={180} value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="เช่น หลักการจัดทำหนังสือราชการ" className={fieldClass} /></label>
        <label className="mt-4 block text-sm font-bold text-navy">คำเกริ่นสรุป <span className="font-normal text-graydark/45">(แสดงใต้ชื่อบทเรียน)</span><textarea rows={2} maxLength={700} value={form.summary} onChange={(event) => updateForm('summary', event.target.value)} placeholder="สรุปว่าอ่านบทเรียนนี้แล้วผู้เรียนจะเข้าใจอะไร" className={fieldClass} /></label>
        <label className="mt-4 block text-sm font-bold text-navy">เนื้อหาบทเรียน<textarea required rows={12} maxLength={30000} value={form.body} onChange={(event) => updateForm('body', event.target.value)} placeholder={'เขียนเนื้อหาละเอียดได้เต็มที่\n\nเว้นบรรทัดเพื่อแยกย่อหน้า'} className={fieldClass} /></label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-navy">ประเด็นสำคัญ <span className="font-normal text-graydark/45">(1 บรรทัดต่อ 1 ข้อ)</span><textarea rows={5} value={form.keyPoints} onChange={(event) => updateForm('keyPoints', event.target.value)} placeholder={'นิยามที่ต้องจำ\nองค์ประกอบสำคัญ\nคำที่มักออกสอบ'} className={fieldClass} /></label>
          <div className="space-y-4"><label className="block text-sm font-bold text-navy">จุดที่มักพลาด<textarea rows={2} maxLength={2000} value={form.pitfalls} onChange={(event) => updateForm('pitfalls', event.target.value)} placeholder="อธิบายข้อควรระวัง" className={fieldClass} /></label><label className="block text-sm font-bold text-navy">แนวข้อสอบ<textarea rows={2} maxLength={2000} value={form.examGuide} onChange={(event) => updateForm('examGuide', event.target.value)} placeholder="ลักษณะโจทย์หรือวิธีอ่านโจทย์" className={fieldClass} /></label></div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center gap-4"><label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-navy"><input type="checkbox" checked={form.isPublished} onChange={(event) => updateForm('isPublished', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" /> เผยแพร่ให้ผู้เรียนเห็น</label><label className="inline-flex items-center gap-2 text-sm font-bold text-navy">ลำดับ<input type="number" value={form.sortOrder} onChange={(event) => updateForm('sortOrder', event.target.value)} className="w-20 rounded-xl border border-slate-200 px-2 py-2 text-sm outline-none focus:border-cyan-500" /></label></div>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-navy/90 disabled:cursor-wait disabled:opacity-60">{saving ? <LoaderCircle size={17} className="animate-spin" /> : form.id ? <Save size={17} /> : <FilePlus2 size={17} />}{saving ? 'กำลังบันทึก...' : form.id ? 'บันทึกการแก้ไข' : 'สร้างบทเรียน'}</button>
        </div>
      </form>

      <aside className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm"><div className="flex items-center gap-2 text-cyan-800"><BookOpenCheck size={20} /><h2 className="font-black">ลำดับการใช้งาน</h2></div><ol className="mt-4 space-y-4 text-sm leading-6 text-graydark/70"><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan-600 text-xs font-black text-white">1</span><span>สร้างหรือเลือก <strong className="text-navy">หมวดย่อย</strong> ในหน้า “หมวดวิชา” ก่อน หากยังไม่มีหัวข้อที่ต้องการ</span></li><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan-600 text-xs font-black text-white">2</span><span>เขียนบทเรียนและเลือกหมวดย่อยให้ตรงกับเนื้อหา</span></li><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan-600 text-xs font-black text-white">3</span><span>ติ๊ก <strong className="text-navy">เผยแพร่</strong> เพื่อให้แสดงในหน้าคลังความรู้ของผู้เรียน</span></li></ol><a href="/admin" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-cyan-700 hover:text-cyan-900">ไปจัดการหมวดวิชา <ChevronRight size={16} /></a></aside>
    </section>

    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-black text-navy">บทเรียนทั้งหมด</h2><p className="mt-1 text-sm text-graydark/55">ร่างยังไม่แสดงให้ผู้เรียนเห็น ส่วนบทความที่เผยแพร่จะซิงก์กับหน้าคลังความรู้</p></div><label className="text-sm font-bold text-navy">กรองตามวิชา<select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-graydark outline-none focus:border-cyan-500"><option value="">ทุกวิชา</option>{catalog.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.short_name || subject.name}</option>)}</select></label></div>
      {loading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-44 skeleton" />)}</div> : filteredArticles.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center"><Plus className="mx-auto text-slate-300" size={28} /><p className="mt-3 font-bold text-navy">ยังไม่มีบทเรียนในรายการนี้</p><p className="mt-1 text-sm text-graydark/55">เริ่มสร้างบทเรียนแรกจากแบบฟอร์มด้านบน</p></div> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredArticles.map((article) => <article key={article.id} className="flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-2"><div className="flex min-w-0 flex-wrap gap-1.5"><span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{names.subjects.get(article.subject_id) || article.subject_id}</span>{article.topic_id && <span className="max-w-full truncate rounded-lg bg-cyan-50 px-2 py-1 text-[11px] font-bold text-cyan-700">{names.topics.get(article.topic_id) || 'หมวดย่อย'}</span>}</div><span className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${article.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{article.is_published ? <Eye size={13} /> : <EyeOff size={13} />}{article.is_published ? 'เผยแพร่' : 'ร่าง'}</span></div><h3 className="mt-3 line-clamp-2 font-black leading-6 text-navy">{article.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-5 text-graydark/60">{article.summary || article.body}</p><div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3"><span className="text-xs text-graydark/45">ลำดับ {article.sort_order || 0}</span><div className="flex gap-2"><button type="button" onClick={() => editArticle(article)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-navy hover:border-cyan-300 hover:text-cyan-700"><Pencil size={14} /> แก้ไข</button><button type="button" disabled={saving} onClick={() => removeArticle(article)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60"><Trash2 size={14} /> ลบ</button></div></div></article>)}</div>}
    </section>
  </div>;
}
