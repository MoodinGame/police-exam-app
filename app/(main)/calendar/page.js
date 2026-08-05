'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  ListChecks,
  MapPin,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { calendarEvents, eventTypeStyles } from '@/lib/calendarEvents';
import { createCalendarPlan, getCalendarPlans, saveCalendarPlans } from '@/lib/calendarPlans';

const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const SUBJECTS = [
  { id: '', label: 'ไม่ระบุวิชา' },
  { id: 'law', label: 'กฎหมาย' },
  { id: 'correspondence', label: 'งานสารบรรณ' },
  { id: 'police-correspondence', label: 'สารบรรณตำรวจ' },
  { id: 'it', label: 'คอมพิวเตอร์' },
  { id: 'social', label: 'สังคม' },
  { id: 'aptitude', label: 'คณิตศาสตร์' },
  { id: 'thai', label: 'ภาษาไทย' },
  { id: 'english', label: 'ภาษาอังกฤษ' },
];

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dateFromIso(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function dateLabel(iso, includeYear = false) {
  const date = dateFromIso(iso);
  return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]}${includeYear ? ` ${date.getFullYear() + 543}` : ''}`;
}

function subjectLabel(subjectId) {
  return SUBJECTS.find((subject) => subject.id === subjectId)?.label || 'แผนส่วนตัว';
}

function eventDescription(event) {
  if (!event.isPersonal) return event.description;
  const details = [event.subjectId ? subjectLabel(event.subjectId) : 'แผนส่วนตัว', event.duration ? `${event.duration} นาที` : '', event.time || ''].filter(Boolean);
  return details.join(' · ');
}

function daysUntil(fromIso, toIso) {
  const ms = dateFromIso(toIso).getTime() - dateFromIso(fromIso).getTime();
  return Math.ceil(ms / 86400000);
}

function EventDot({ event }) {
  const style = eventTypeStyles[event.type] || eventTypeStyles.study;
  return <span title={event.title} className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />;
}

function PlanModal({ initialDate, initialKind, onClose, onSave }) {
  const [form, setForm] = useState({
    title: initialKind === 'practice' ? 'ทำแบบฝึกหัด' : 'ทบทวนเนื้อหา',
    date: initialDate,
    type: initialKind || 'study',
    subjectId: '',
    duration: '30',
    time: '',
  });
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('กรุณาระบุชื่อแผน');
      return;
    }
    if (!form.date) {
      setError('กรุณาเลือกวันที่');
      return;
    }
    onSave(form);
  }

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-navy/45 p-4" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title"><button type="button" aria-label="ปิดหน้าต่างเพิ่มแผน" onClick={onClose} className="absolute inset-0 cursor-default" /><form onSubmit={submit} className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_24px_64px_rgba(30,64,100,0.32)]"><div className="flex items-start justify-between gap-4 border-b border-graylight/20 px-5 py-5 sm:px-6"><div><p className="text-xs font-bold text-accent-cyan">แผนของฉัน</p><h2 id="plan-modal-title" className="mt-1 text-xl font-black text-navy">เพิ่มแผนอ่านหนังสือ</h2></div><button type="button" onClick={onClose} aria-label="ปิด" className="rounded-xl p-2 text-graydark/45 transition hover:bg-slate-100 hover:text-navy"><X size={19} /></button></div><div className="space-y-4 px-5 py-5 sm:px-6"><label className="block"><span className="text-sm font-semibold text-navy">ชื่อแผน</span><input autoFocus value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="เช่น ทบทวนกฎหมายอาญา" className="mt-1.5 w-full rounded-xl border border-graylight/30 px-3 py-2.5 text-sm outline-none transition focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/10" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="text-sm font-semibold text-navy">วันที่</span><input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-graylight/30 px-3 py-2.5 text-sm outline-none transition focus:border-accent-cyan" /></label><label className="block"><span className="text-sm font-semibold text-navy">เวลา <em className="font-normal not-italic text-graydark/45">(ถ้ามี)</em></span><input type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-graylight/30 px-3 py-2.5 text-sm outline-none transition focus:border-accent-cyan" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="text-sm font-semibold text-navy">ประเภท</span><select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-graylight/30 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-accent-cyan"><option value="study">ทบทวนเนื้อหา</option><option value="practice">ทำแบบฝึกหัด</option></select></label><label className="block"><span className="text-sm font-semibold text-navy">วิชา</span><select value={form.subjectId} onChange={(event) => setForm((current) => ({ ...current, subjectId: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-graylight/30 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-accent-cyan">{SUBJECTS.map((subject) => <option key={subject.id || 'general'} value={subject.id}>{subject.label}</option>)}</select></label></div><label className="block"><span className="text-sm font-semibold text-navy">ระยะเวลาโดยประมาณ</span><select value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-graylight/30 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-accent-cyan"><option value="15">15 นาที</option><option value="30">30 นาที</option><option value="45">45 นาที</option><option value="60">1 ชั่วโมง</option><option value="90">1 ชั่วโมง 30 นาที</option></select></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}</div><div className="flex flex-col-reverse gap-2 border-t border-graylight/20 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-graydark/60 hover:bg-white">ยกเลิก</button><button type="submit" className="btn-navy inline-flex items-center justify-center gap-2"><Plus size={16} />บันทึกแผน</button></div></form></div>;
}

export default function CalendarPage() {
  const now = new Date();
  const todayIso = isoDate(now.getFullYear(), now.getMonth(), now.getDate());
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [plans, setPlans] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadPlans() {
      try {
        const response = await fetch('/api/calendar-plans', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load calendar plans');
        if (active) setPlans(payload.plans || []);
      } catch {
        if (active) setPlans(getCalendarPlans());
      } finally {
        if (active) setLoaded(true);
      }
    }
    loadPlans();
    return () => {
      active = false;
    };
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const allEvents = useMemo(() => [...calendarEvents, ...plans], [plans]);
  const visibleEvents = useMemo(() => allEvents.filter((event) => filter === 'all' || (filter === 'personal' ? event.isPersonal : !event.isPersonal)), [allEvents, filter]);
  const eventsByDate = useMemo(() => visibleEvents.reduce((map, event) => ({ ...map, [event.date]: [...(map[event.date] || []), event] }), {}), [visibleEvents]);
  const selectedEvents = (eventsByDate[selectedDate] || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, index) => {
    const dayOffset = index - firstWeekday + 1;
    const date = new Date(year, month, dayOffset);
    return { date, iso: isoDate(date.getFullYear(), date.getMonth(), date.getDate()), inMonth: date.getMonth() === month };
  });
  const upcoming = useMemo(() => allEvents.filter((event) => event.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')).slice(0, 5), [allEvents, todayIso]);
  const nextExam = useMemo(() => calendarEvents.filter((event) => event.type === 'exam' && event.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date))[0], [todayIso]);
  const plansThisMonth = plans.filter((event) => { const date = dateFromIso(event.date); return date.getFullYear() === year && date.getMonth() === month; });

  function goToToday() {
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(todayIso);
  }

  function chooseDate(iso) {
    setSelectedDate(iso);
    const date = dateFromIso(iso);
    if (date.getFullYear() !== year || date.getMonth() !== month) setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  async function addPlan(form) {
    let plan;
    try {
      const response = await fetch('/api/calendar-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to save calendar plan');
      plan = payload.plan;
    } catch {
      plan = createCalendarPlan(form);
    }
    setPlans((current) => {
      const next = [...current, plan];
      if (plan.id.startsWith('plan-')) saveCalendarPlans(next);
      return next;
    });
    const date = dateFromIso(plan.date);
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDate(plan.date);
    setModal(null);
  }

  async function deletePlan(id) {
    if (id.startsWith('plan-')) {
      setPlans((current) => {
        const next = current.filter((event) => event.id !== id);
        saveCalendarPlans(next);
        return next;
      });
      return;
    }
    try {
      const response = await fetch(`/api/calendar-plans/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to delete calendar plan');
      setPlans((current) => current.filter((event) => event.id !== id));
    } catch {
      // Keep the plan visible when deletion cannot be confirmed by the server.
    }
  }

  return <div className="pb-5">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-cyan"><CalendarClock size={14} />วางแผนให้สม่ำเสมอ</span><h1 className="mt-1 text-2xl font-black tracking-tight text-navy sm:text-3xl">ปฏิทินการเรียน</h1><p className="mt-1 text-sm text-graydark/60">รวมกำหนดการสำคัญและแผนอ่านหนังสือของคุณไว้ในที่เดียว</p></div><button type="button" onClick={() => setModal({ date: selectedDate, kind: 'study' })} className="btn-navy inline-flex items-center gap-2"><Plus size={17} />เพิ่มแผน</button></div>

    <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><div className="rounded-2xl bg-[linear-gradient(130deg,#202b52,#263763)] p-4 text-white shadow-[0_12px_26px_rgba(30,64,100,0.16)]"><p className="text-xs font-semibold text-white/60">กำหนดสอบจริง</p><p className="mt-1 text-lg font-black text-accent-gold">{nextExam ? `${daysUntil(todayIso, nextExam.date)} วัน` : 'รอติดตาม'}</p><p className="mt-1 truncate text-xs text-white/70">{nextExam ? nextExam.title : 'ยังไม่มีกำหนดการ'}</p></div><div className="rounded-2xl border border-violet-100 bg-violet-50/65 p-4"><p className="text-xs font-semibold text-violet-700">แผนของฉันเดือนนี้</p><p className="mt-1 text-lg font-black text-navy">{loaded ? `${plansThisMonth.length} แผน` : '—'}</p><p className="mt-1 text-xs text-graydark/55">เพิ่มช่วงทบทวนล่วงหน้าเพื่อทำตามเป้าหมาย</p></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50/65 p-4 sm:col-span-2 xl:col-span-1"><p className="text-xs font-semibold text-emerald-700">วันนี้</p><p className="mt-1 text-lg font-black text-navy">{selectedDate === todayIso ? 'เลือกวันปัจจุบัน' : dateLabel(todayIso)}</p><button type="button" onClick={goToToday} className="mt-1 text-xs font-bold text-emerald-700 hover:underline">กลับไปวันนี้ →</button></div></section>

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="app-card overflow-hidden p-0"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-graylight/20 px-4 py-4 sm:px-6"><div className="flex items-center gap-1"><button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="เดือนก่อนหน้า" className="rounded-xl p-2 text-graydark/60 transition hover:bg-slate-100 hover:text-navy"><ChevronLeft size={19} /></button><h2 className="min-w-[9.5rem] text-center text-base font-black text-navy sm:text-lg">{THAI_MONTHS[month]} {year + 543}</h2><button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="เดือนถัดไป" className="rounded-xl p-2 text-graydark/60 transition hover:bg-slate-100 hover:text-navy"><ChevronRight size={19} /></button></div><button type="button" onClick={goToToday} className="rounded-xl border border-graylight/30 bg-white px-3 py-2 text-xs font-bold text-navy transition hover:border-accent-cyan hover:text-accent-cyan">วันนี้</button></div><div className="flex flex-wrap gap-2 border-b border-graylight/20 px-4 py-3 sm:px-6"><button type="button" onClick={() => setFilter('all')} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === 'all' ? 'bg-navy text-white' : 'bg-slate-100 text-graydark/55 hover:text-navy'}`}>ทั้งหมด</button><button type="button" onClick={() => setFilter('personal')} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === 'personal' ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>แผนของฉัน</button><button type="button" onClick={() => setFilter('system')} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === 'system' ? 'bg-accent-cyan text-navy' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'}`}>กำหนดการระบบ</button></div><div className="p-3 sm:p-5"><div className="grid grid-cols-7 border-b border-graylight/20 pb-2">{WEEKDAYS.map((day) => <div key={day} className="text-center text-[11px] font-bold text-graydark/45 sm:text-xs">{day}</div>)}</div><div className="grid grid-cols-7">{cells.map((cell) => { const events = eventsByDate[cell.iso] || []; const selected = cell.iso === selectedDate; const isToday = cell.iso === todayIso; return <button key={cell.iso} type="button" onClick={() => chooseDate(cell.iso)} className={`group relative min-h-[4.2rem] border-b border-r border-graylight/15 p-1 text-left transition sm:min-h-[6.2rem] sm:p-1.5 ${cell.inMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/65 text-graydark/35'} ${selected ? 'z-10 bg-cyan-50/70 ring-2 ring-inset ring-accent-cyan/70' : ''}`}><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${isToday ? 'bg-accent-cyan text-navy' : cell.inMonth ? 'text-graydark/70' : 'text-graydark/30'}`}>{cell.date.getDate()}</span><div className="mt-1 flex flex-wrap gap-1">{events.slice(0, 3).map((event) => <EventDot key={event.id} event={event} />)}</div><div className="mt-1 hidden space-y-1 sm:block">{events.slice(0, 2).map((event) => <span key={event.id} className={`block truncate rounded px-1 py-0.5 text-[9px] font-medium ${event.isPersonal ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-graydark/60'}`}>{event.title}</span>)}</div>{events.length > 2 && <span className="hidden text-[9px] font-semibold text-graydark/45 sm:block">+{events.length - 2}</span>}</button>; })}</div></div><div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-graylight/20 px-4 py-3 text-xs text-graydark/60 sm:px-6">{Object.entries(eventTypeStyles).map(([type, style]) => <span key={type} className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${style.dot}`} />{style.label}</span>)}</div></section>

      <aside className="space-y-5"><section className="app-card p-0"><div className="flex items-center justify-between border-b border-graylight/20 px-5 py-4"><div><p className="text-xs font-semibold text-graydark/45">กำหนดการของวัน</p><h2 className="mt-0.5 font-black text-navy">{dateLabel(selectedDate, true)}</h2></div><button type="button" onClick={() => setModal({ date: selectedDate, kind: 'study' })} aria-label="เพิ่มแผนในวันที่เลือก" className="rounded-xl bg-accent-cyan/10 p-2 text-accent-cyan transition hover:bg-accent-cyan/20"><Plus size={17} /></button></div><div className="p-3">{selectedEvents.length ? <div className="space-y-2">{selectedEvents.map((event) => { const style = eventTypeStyles[event.type] || eventTypeStyles.study; return <div key={event.id} className="rounded-xl border border-graylight/20 bg-white p-3"><div className="flex items-start gap-2"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${style.dot}`} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>{style.label}</span>{event.time && <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-graydark/45"><Clock3 size={11} />{event.time}</span>}</div><p className="mt-2 text-sm font-bold leading-snug text-navy">{event.title}</p><p className="mt-1 text-xs leading-5 text-graydark/55">{eventDescription(event)}</p></div>{event.isPersonal && <button type="button" onClick={() => deletePlan(event.id)} aria-label={`ลบ ${event.title}`} className="rounded-lg p-1.5 text-graydark/35 transition hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>}</div></div>; })}</div> : <div className="px-2 py-8 text-center"><CalendarClock className="mx-auto text-graydark/25" size={28} /><p className="mt-2 text-sm font-semibold text-graydark/55">ยังไม่มีรายการในวันนี้</p><button type="button" onClick={() => setModal({ date: selectedDate, kind: 'study' })} className="mt-3 text-sm font-bold text-accent-cyan hover:underline">เพิ่มแผนแรกของวัน</button></div>}</div></section>

        <section className="app-card p-4"><div className="flex items-center gap-2"><Target size={17} className="text-accent-gold" /><h2 className="font-black text-navy">วางแผนเร็ว</h2></div><p className="mt-1 text-xs leading-5 text-graydark/55">เพิ่มแผนลงวันที่ที่เลือกโดยไม่ต้องกรอกรายละเอียดทุกครั้ง</p><div className="mt-3 grid gap-2"><button type="button" onClick={() => setModal({ date: selectedDate, kind: 'study' })} className="flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2.5 text-left text-sm font-semibold text-violet-700 transition hover:bg-violet-100"><span className="inline-flex items-center gap-2"><BookOpen size={16} />ทบทวน 30 นาที</span><Plus size={15} /></button><button type="button" onClick={() => setModal({ date: selectedDate, kind: 'practice' })} className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 transition hover:bg-blue-100"><span className="inline-flex items-center gap-2"><ListChecks size={16} />ทำแบบฝึกหัด</span><Plus size={15} /></button><Link href="/mock-exam" className="flex items-center justify-between rounded-xl border border-graylight/25 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-navy transition hover:border-accent-gold/60"><span className="inline-flex items-center gap-2"><FileText size={16} />เลือก Mock Exam</span><ChevronRight size={15} /></Link></div></section>

        <section className="app-card p-0"><div className="flex items-center justify-between border-b border-graylight/20 px-5 py-4"><div><p className="text-xs font-semibold text-graydark/45">ถัดไป</p><h2 className="mt-0.5 font-black text-navy">กำหนดการใกล้ถึง</h2></div><Sparkles size={17} className="text-accent-gold" /></div><div className="p-3">{upcoming.length ? <div className="space-y-1">{upcoming.map((event) => { const style = eventTypeStyles[event.type] || eventTypeStyles.study; return <button type="button" key={event.id} onClick={() => chooseDate(event.date)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-slate-50"><div className="w-9 shrink-0 text-center"><p className="text-lg font-black leading-none text-navy">{dateFromIso(event.date).getDate()}</p><p className="mt-1 text-[9px] font-semibold text-graydark/45">{THAI_MONTHS[dateFromIso(event.date).getMonth()].slice(0, 3)}</p></div><span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy">{event.title}</span><span className="block truncate text-[11px] text-graydark/45">{eventDescription(event)}</span></span></button>; })}</div> : <p className="px-2 py-6 text-center text-sm text-graydark/45">ยังไม่มีกำหนดการที่กำลังจะมาถึง</p>}</div></section>
      </aside>
    </div>

    {modal && <PlanModal initialDate={modal.date} initialKind={modal.kind} onClose={() => setModal(null)} onSave={addPlan} />}
  </div>;
}
