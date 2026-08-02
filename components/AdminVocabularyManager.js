'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  FilePlus2,
  Layers3,
  LoaderCircle,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { OXFORD_3000_TARGET, OXFORD_CEFR_LEVELS } from '@/lib/vocabulary';

const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition placeholder:text-slate-400 focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/10';

function emptyDeck() {
  return { id: '', subjectId: '', title: '', shortTitle: '', description: '', note: '', icon: 'book', tone: 'cyan', kind: 'subject', sortOrder: 50, isActive: true, _new: true };
}

function emptyCard(deckId = '', level = '') {
  return { id: '', deckId, subjectId: '', word: '', phonetic: '', thaiReading: '', partOfSpeech: '', level, translation: '', meaning: '', example: '', kind: 'vocabulary', sortOrder: 50, isActive: true, _new: true };
}

function isOxfordDeck(deck) {
  return deck?.id === 'oxford-3000' || deck?.kind === 'english';
}

function toDraft(item) {
  return { ...item, subjectId: item.subjectId || '', _new: false };
}

function Field({ label, children, className = '' }) {
  return <label className={`block text-sm font-medium text-graydark ${className}`}>{label}{children}</label>;
}

function StatusMessage({ tone, children, onClose }) {
  const styles = tone === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return <div className={`mb-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}><span className="inline-flex items-center gap-2">{tone === 'error' ? <X size={17} /> : <CheckCircle2 size={17} />}{children}</span>{onClose && <button type="button" onClick={onClose} aria-label="ปิดข้อความ"><X size={16} /></button>}</div>;
}

export default function AdminVocabularyManager() {
  const [decks, setDecks] = useState([]);
  const [cards, setCards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [deckDraft, setDeckDraft] = useState(null);
  const [cardDraft, setCardDraft] = useState(null);
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [bulkText, setBulkText] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/admin/vocabulary', { cache: 'no-store', signal: controller.signal });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถโหลดคลังคำศัพท์ได้');
      setDecks(result.decks || []);
      setCards(result.cards || []);
      setSubjects(result.subjects || []);
      setMigrationRequired(Boolean(result.migrationRequired));
      setSelectedDeckId((current) => current && result.decks?.some((deck) => deck.id === current) ? current : (result.decks?.[0]?.id || ''));
    } catch (loadError) {
      if (loadError?.name === 'AbortError') {
        setError('เชื่อมต่อคลังคำศัพท์ไม่สำเร็จภายใน 15 วินาที กรุณาตรวจสอบ Supabase และลองรีเฟรชอีกครั้ง');
        return;
      }
      setError(loadError.message || 'ไม่สามารถโหลดคลังคำศัพท์ได้');
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) || null;
  const selectedDeckIsOxford = isOxfordDeck(selectedDeck);
  const totalCardsForDeck = useMemo(() => cards.filter((card) => card.deckId === selectedDeckId), [cards, selectedDeckId]);
  const cardsForDeck = useMemo(() => {
    const term = query.trim().toLowerCase();
    return totalCardsForDeck
      .filter((card) => !selectedDeckIsOxford || levelFilter === 'all' || card.level === levelFilter)
      .filter((card) => !term || [card.word, card.translation, card.thaiReading, card.partOfSpeech, card.level].filter(Boolean).some((value) => value.toLowerCase().includes(term)));
  }, [levelFilter, query, selectedDeckIsOxford, totalCardsForDeck]);

  useEffect(() => { setLevelFilter('all'); setQuery(''); }, [selectedDeckId]);

  const setDeck = (key, value) => setDeckDraft((draft) => ({ ...draft, [key]: value }));
  const setCard = (key, value) => setCardDraft((draft) => ({ ...draft, [key]: value }));

  const save = async (event, type, draft) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/vocabulary', {
        method: draft._new ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, type }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถบันทึกข้อมูลได้');
      setNotice(draft._new ? 'เพิ่มข้อมูลเรียบร้อยแล้ว และจะแสดงที่หน้าแฟลชการ์ดทันที' : 'บันทึกการแก้ไขแล้ว หน้าแฟลชการ์ดจะใช้ข้อมูลใหม่นี้ทันที');
      if (type === 'deck') setDeckDraft(null);
      if (type === 'card') setCardDraft(null);
      await refresh();
    } catch (saveError) {
      setError(saveError.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  const seedStarterLibrary = async () => {
    setSeeding(true);
    setError('');
    try {
      const response = await fetch('/api/admin/vocabulary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'seed-default' }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถนำเข้าชุดเริ่มต้นได้');
      setNotice(result.message || 'นำเข้าชุดคำศัพท์เริ่มต้นเรียบร้อย');
      await refresh();
    } catch (seedError) {
      setError(seedError.message || 'ไม่สามารถนำเข้าชุดเริ่มต้นได้');
    } finally {
      setSeeding(false);
    }
  };

  const importVocabularyCards = async () => {
    if (!selectedDeck) return;
    setBulkImporting(true);
    setError('');
    try {
      const parsed = JSON.parse(bulkText);
      const items = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(items) || items.length === 0) throw new Error('วาง JSON รายการคำศัพท์อย่างน้อย 1 คำ');
      const response = await fetch('/api/admin/vocabulary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'import-cards', deckId: selectedDeck.id, items }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'นำเข้าคำศัพท์ไม่สำเร็จ');
      setNotice(result.message || `นำเข้าคำศัพท์ ${items.length} คำเรียบร้อย`);
      setBulkText('');
      await refresh();
    } catch (importError) {
      setError(importError.message || 'นำเข้าคำศัพท์ไม่สำเร็จ');
    } finally {
      setBulkImporting(false);
    }
  };

  return (
    <div className="max-w-7xl">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-accent-cyan">ADMIN · VOCABULARY LIBRARY</p>
          <h1 className="text-2xl font-semibold text-navy sm:text-3xl">คลังคำศัพท์และแฟลชการ์ด</h1>
          <p className="mt-1 max-w-3xl text-sm text-graydark/60">แก้ไขชุดคำศัพท์และบัตรคำที่หน้าแฟลชการ์ดใช้จริง ทุกการบันทึกจะส่งผลต่อผู้เรียนทันที</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/vocab" target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm hover:border-accent-cyan"><ExternalLink size={16} />ดูหน้าผู้เรียน</Link>
          <button type="button" onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />รีเฟรช</button>
        </div>
      </header>

      {error && <StatusMessage tone="error" onClose={() => setError('')}>{error}</StatusMessage>}
      {notice && <StatusMessage tone="success" onClose={() => setNotice('')}>{notice}</StatusMessage>}

      {migrationRequired && <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 shrink-0 text-amber-600" size={20} /><div><h2 className="font-semibold text-amber-950">ยังไม่ได้สร้างตารางคลังคำศัพท์</h2><p className="mt-1 text-sm text-amber-900/75">รันไฟล์ migration <code className="rounded bg-white/75 px-1.5 py-0.5 text-xs">20260802_vocabulary_library.sql</code> ใน Supabase SQL Editor ก่อน แล้วกดรีเฟรชหน้านี้</p></div></div></section>}

      {!migrationRequired && <>
        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4"><Layers3 size={19} className="text-cyan-700" /><p className="mt-3 text-2xl font-bold text-navy">{decks.length}</p><p className="mt-1 text-sm text-cyan-900/70">ชุดแฟลชการ์ด</p></article>
          <article className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><BookOpenCheck size={19} className="text-violet-700" /><p className="mt-3 text-2xl font-bold text-navy">{cards.length}</p><p className="mt-1 text-sm text-violet-900/70">บัตรคำทั้งหมด</p></article>
          <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><CheckCircle2 size={19} className="text-emerald-700" /><p className="mt-3 text-2xl font-bold text-navy">{cards.filter((card) => card.isActive).length}</p><p className="mt-1 text-sm text-emerald-900/70">ใบที่เผยแพร่แล้ว</p></article>
        </section>

        {loading ? <div className="h-80 animate-pulse rounded-2xl bg-slate-100" /> : decks.length === 0 ? <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><BookOpenCheck size={30} className="mx-auto text-accent-cyan" /><h2 className="mt-3 font-semibold text-navy">เริ่มต้นคลังคำศัพท์</h2><p className="mx-auto mt-1 max-w-xl text-sm text-graydark/60">นำเข้าบัตรคำตัวอย่างชุดเดิมเพื่อให้หน้าผู้เรียนและหลังบ้านเริ่มจากข้อมูลชุดเดียวกัน จากนั้นค่อยแก้ไขหรือเพิ่มเนื้อหาจริงได้ตามต้องการ</p><button type="button" disabled={seeding} onClick={seedStarterLibrary} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{seeding ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}นำเข้าชุดเริ่มต้น</button></section> : <>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-navy">ชุดแฟลชการ์ด</h2><p className="mt-1 text-xs text-graydark/55">เลือกชุดเพื่อดูและจัดการบัตรคำ</p></div><button type="button" onClick={() => { setDeckDraft(emptyDeck()); setCardDraft(null); }} className="inline-flex items-center gap-2 rounded-xl border border-navy bg-white px-3.5 py-2.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white"><Plus size={16} />เพิ่มชุด</button></div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{decks.map((deck) => { const count = cards.filter((card) => card.deckId === deck.id).length; const selected = deck.id === selectedDeckId; return <button key={deck.id} type="button" onClick={() => { setSelectedDeckId(deck.id); setDeckDraft(null); setCardDraft(null); }} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${selected ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-navy hover:border-accent-cyan'}`}><div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${selected ? 'bg-white/15 text-accent-cyan' : 'bg-cyan-50 text-accent-cyan'}`}><BookOpenCheck size={19} /></span><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${selected ? 'bg-white/15 text-white' : deck.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{deck.isActive ? 'เผยแพร่' : 'ซ่อน'}</span></div><p className="mt-4 font-semibold">{deck.title}</p><p className={`mt-1 line-clamp-2 text-xs ${selected ? 'text-white/70' : 'text-graydark/55'}`}>{deck.description || 'ยังไม่มีคำอธิบาย'}</p><p className={`mt-4 text-xs font-semibold ${selected ? 'text-accent-cyan' : 'text-graydark/55'}`}>{count} บัตรคำ · {deck.id}</p></button>; })}</div>
          </section>

          {deckDraft && <DeckEditor draft={deckDraft} subjects={subjects} saving={saving} onChange={setDeck} onCancel={() => setDeckDraft(null)} onSubmit={(event) => save(event, 'deck', deckDraft)} />}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-navy">{selectedDeck?.title || 'บัตรคำ'}</h2><p className="mt-1 text-xs text-graydark/55">ข้อมูลด้านล่างคือข้อมูลเดียวกับที่ผู้เรียนเห็นในหน้าแฟลชการ์ด</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={!selectedDeck} onClick={() => { setDeckDraft(toDraft(selectedDeck)); setCardDraft(null); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-navy hover:border-accent-cyan disabled:opacity-50"><PencilLine size={16} />แก้ไขชุด</button><button type="button" disabled={!selectedDeck} onClick={() => { setCardDraft(emptyCard(selectedDeckId, selectedDeckIsOxford ? 'A1' : '')); setDeckDraft(null); }} className="inline-flex items-center gap-2 rounded-xl bg-navy px-3.5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><FilePlus2 size={16} />เพิ่มบัตรคำ</button></div></div>
            {selectedDeckIsOxford && <OxfordAdminTools cards={totalCardsForDeck} levelFilter={levelFilter} onLevelChange={setLevelFilter} bulkText={bulkText} onBulkTextChange={setBulkText} importing={bulkImporting} onImport={importVocabularyCards} />}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="relative block w-full sm:w-80"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาคำศัพท์ คำแปล หรือคำอ่านไทย" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent-cyan" /></label><span className="text-xs text-graydark/55">แสดง {cardsForDeck.length} จาก {totalCardsForDeck.length} ใบ</span></div>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">{cardsForDeck.length === 0 ? <div className="px-5 py-12 text-center text-sm text-graydark/55">ยังไม่มีบัตรคำในชุดนี้</div> : <div className="divide-y divide-slate-100">{cardsForDeck.map((card) => <article key={card.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-navy">{card.word}</h3>{card.partOfSpeech && <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{card.partOfSpeech}</span>}{!card.isActive && <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">ซ่อน</span>}</div><p className="mt-1 truncate text-sm text-graydark/65">{card.translation || 'ยังไม่มีคำแปล'}{card.thaiReading ? ` · อ่านว่า ${card.thaiReading}` : ''}</p><p className="mt-1 text-[11px] text-graydark/45">{card.id}{card.level ? ` · ${card.level}` : ''}</p></div><button type="button" onClick={() => { setCardDraft(toDraft(card)); setDeckDraft(null); }} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-navy hover:border-accent-cyan hover:text-accent-cyan"><PencilLine size={14} />แก้ไข</button></article>)}</div>}</div>
          </section>

          {cardDraft && <CardEditor draft={cardDraft} decks={decks} subjects={subjects} isOxfordDeck={isOxfordDeck(decks.find((deck) => deck.id === cardDraft.deckId))} saving={saving} onChange={setCard} onCancel={() => setCardDraft(null)} onSubmit={(event) => save(event, 'card', cardDraft)} />}
        </>}
      </>}
    </div>
  );
}

function DeckEditor({ draft, subjects, saving, onChange, onCancel, onSubmit }) {
  return <section className="mt-6 rounded-2xl border-2 border-cyan-200 bg-cyan-50/35 p-4 shadow-sm sm:p-6"><form onSubmit={onSubmit}><EditorHeading title={draft._new ? 'เพิ่มชุดแฟลชการ์ด' : `แก้ไขชุด: ${draft.title}`} onCancel={onCancel} /><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="รหัสชุด (แก้ไม่ได้หลังสร้าง)"><input required disabled={!draft._new} value={draft.id} onChange={(event) => onChange('id', event.target.value)} placeholder="เช่น law-basics" className={`${inputClass} disabled:bg-slate-100`} /></Field><Field label="ชื่อชุด"><input required value={draft.title} onChange={(event) => onChange('title', event.target.value)} className={inputClass} /></Field><Field label="ชื่อย่อ"><input value={draft.shortTitle} onChange={(event) => onChange('shortTitle', event.target.value)} placeholder="ใช้บนปุ่ม" className={inputClass} /></Field><Field label="วิชา"><SubjectSelect subjects={subjects} value={draft.subjectId} onChange={(value) => onChange('subjectId', value)} /></Field><Field label="ไอคอน"><select value={draft.icon} onChange={(event) => onChange('icon', event.target.value)} className={inputClass}>{['book', 'shield', 'scale', 'file', 'cpu', 'calculator', 'thai', 'english'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="โทนสี"><select value={draft.tone} onChange={(event) => onChange('tone', event.target.value)} className={inputClass}>{['cyan', 'navy', 'emerald', 'sky', 'teal', 'rose', 'purple', 'violet'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="ชนิดชุด"><select value={draft.kind} onChange={(event) => onChange('kind', event.target.value)} className={inputClass}>{[['subject', 'รายวิชา'], ['english', 'Oxford/ภาษาอังกฤษ'], ['police', 'ศัพท์ตำรวจ'], ['custom', 'กำหนดเอง']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="ลำดับ"><input type="number" value={draft.sortOrder} onChange={(event) => onChange('sortOrder', event.target.value)} className={inputClass} /></Field></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><Field label="คำอธิบาย"><textarea rows={3} value={draft.description} onChange={(event) => onChange('description', event.target.value)} className={inputClass} /></Field><Field label="โน้ตสำหรับผู้เรียน"><textarea rows={3} value={draft.note} onChange={(event) => onChange('note', event.target.value)} className={inputClass} /></Field></div><label className="mt-4 inline-flex items-center gap-2 text-sm text-graydark"><input type="checkbox" checked={draft.isActive} onChange={(event) => onChange('isActive', event.target.checked)} />เผยแพร่ชุดนี้ที่หน้าผู้เรียน</label><SaveButton saving={saving} label="บันทึกชุดแฟลชการ์ด" /></form></section>;
}

function OxfordAdminTools({ cards, levelFilter, onLevelChange, bulkText, onBulkTextChange, importing, onImport }) {
  const total = cards.length;
  return <div className="mt-5 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-semibold text-navy">Oxford 3000 · จัดการตามระดับ CEFR</p><p className="mt-1 text-xs text-graydark/55">มีแล้ว {total.toLocaleString()} / {OXFORD_3000_TARGET.toLocaleString()} คำ · เลือกระดับเพื่อค้นหาและแก้ไขได้เร็วขึ้น</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onLevelChange('all')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${levelFilter === 'all' ? 'bg-navy text-white' : 'bg-white text-graydark ring-1 ring-slate-200'}`}>ทุกระดับ ({total})</button>{OXFORD_CEFR_LEVELS.map((level) => { const count = cards.filter((card) => card.level === level.id).length; return <button key={level.id} type="button" onClick={() => onLevelChange(level.id)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${levelFilter === level.id ? 'bg-navy text-white' : 'bg-white text-graydark ring-1 ring-slate-200'}`}>{level.id} ({count})</button>; })}</div></div><details className="mt-4 rounded-xl border border-cyan-100 bg-white p-3"><summary className="cursor-pointer text-sm font-semibold text-cyan-800">นำเข้าคำศัพท์ Oxford/CEFR จาก JSON (สูงสุด 500 คำต่อครั้ง)</summary><p className="mt-2 text-xs leading-5 text-graydark/60">ใช้สำหรับรายการคำศัพท์ที่มีสิทธิ์นำมาใช้ โดยแต่ละรายการต้องมี <code>word</code>, <code>translation</code> และ <code>level</code> (A1, A2, B1 หรือ B2) ส่วนคำอ่านไทย, IPA, ชนิดคำ และตัวอย่างเป็นข้อมูลเสริม</p><textarea value={bulkText} onChange={(event) => onBulkTextChange(event.target.value)} rows={8} placeholder={'[\n  {"word":"example","translation":"ตัวอย่าง","thaiReading":"เอ็กแซมเพิล","level":"A1","partOfSpeech":"noun"}\n]'} className="mt-3 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs text-navy outline-none focus:border-accent-cyan" /><div className="mt-3 flex justify-end"><button type="button" disabled={importing || !bulkText.trim()} onClick={onImport} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{importing ? <LoaderCircle size={16} className="animate-spin" /> : <FilePlus2 size={16} />}นำเข้าคำศัพท์</button></div></details></div>;
}

function CardEditor({ draft, decks, subjects, isOxfordDeck: cardIsOxfordDeck, saving, onChange, onCancel, onSubmit }) {
  return <section className="mt-6 rounded-2xl border-2 border-violet-200 bg-violet-50/35 p-4 shadow-sm sm:p-6"><form onSubmit={onSubmit}><EditorHeading title={draft._new ? 'เพิ่มบัตรคำ' : `แก้ไขบัตรคำ: ${draft.word}`} onCancel={onCancel} /><p className="mt-1 text-xs text-graydark/55">คำแปลและคำอ่านไทยจะแสดงใต้คำศัพท์ในหน้าผู้เรียนโดยตรง</p><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="รหัสบัตรคำ (แก้ไม่ได้หลังสร้าง)"><input required disabled={!draft._new} value={draft.id} onChange={(event) => onChange('id', event.target.value)} placeholder="เช่น ox-ability" className={`${inputClass} disabled:bg-slate-100`} /></Field><Field label="ชุดคำศัพท์"><select required value={draft.deckId} onChange={(event) => onChange('deckId', event.target.value)} className={inputClass}>{decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.title}</option>)}</select></Field><Field label="วิชา"><SubjectSelect subjects={subjects} value={draft.subjectId} onChange={(value) => onChange('subjectId', value)} /></Field><Field label="ชนิดบัตร"><select value={draft.kind} onChange={(event) => onChange('kind', event.target.value)} className={inputClass}>{[['vocabulary', 'คำศัพท์'], ['subject', 'เนื้อหารายวิชา'], ['custom', 'กำหนดเอง']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="คำศัพท์ / ด้านหน้า"><input required value={draft.word} onChange={(event) => onChange('word', event.target.value)} className={inputClass} /></Field><Field label="คำแปล / คำตอบ"><input value={draft.translation} onChange={(event) => onChange('translation', event.target.value)} placeholder="เช่น ความสามารถ" className={inputClass} /></Field><Field label="คำอ่านไทย"><input value={draft.thaiReading} onChange={(event) => onChange('thaiReading', event.target.value)} placeholder="เช่น อะบิลิตี้" className={inputClass} /></Field><Field label="IPA / คำอ่านสากล"><input value={draft.phonetic} onChange={(event) => onChange('phonetic', event.target.value)} placeholder="เช่น /əˈbɪləti/" className={inputClass} /></Field><Field label="ชนิดคำ"><input value={draft.partOfSpeech} onChange={(event) => onChange('partOfSpeech', event.target.value)} placeholder="noun, verb" className={inputClass} /></Field>{cardIsOxfordDeck ? <Field label="ระดับ CEFR"><select value={draft.level} onChange={(event) => onChange('level', event.target.value)} className={inputClass}><option value="">เลือกระดับ</option>{OXFORD_CEFR_LEVELS.map((level) => <option key={level.id} value={level.id}>{level.label}</option>)}</select></Field> : <Field label="ระดับ / หมวด"><input value={draft.level} onChange={(event) => onChange('level', event.target.value)} placeholder="เช่น ศัพท์ตำรวจ" className={inputClass} /></Field>}<Field label="ลำดับ"><input type="number" value={draft.sortOrder} onChange={(event) => onChange('sortOrder', event.target.value)} className={inputClass} /></Field></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><Field label="ความหมายภาษาอังกฤษ / คำอธิบาย"><textarea rows={3} value={draft.meaning} onChange={(event) => onChange('meaning', event.target.value)} className={inputClass} /></Field><Field label="ประโยคตัวอย่าง"><textarea rows={3} value={draft.example} onChange={(event) => onChange('example', event.target.value)} className={inputClass} /></Field></div><label className="mt-4 inline-flex items-center gap-2 text-sm text-graydark"><input type="checkbox" checked={draft.isActive} onChange={(event) => onChange('isActive', event.target.checked)} />เผยแพร่บัตรคำนี้ที่หน้าผู้เรียน</label><SaveButton saving={saving} label="บันทึกบัตรคำ" /></form></section>;
}

function SubjectSelect({ subjects, value, onChange }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}><option value="">ไม่ผูกกับวิชา</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.short_name || subject.name}</option>)}</select>;
}

function EditorHeading({ title, onCancel }) {
  return <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-navy">{title}</h2><button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-graydark/60 hover:bg-white">ยกเลิก</button></div>;
}

function SaveButton({ saving, label }) {
  return <div className="mt-5 flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{label}</button></div>;
}
