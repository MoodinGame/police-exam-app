'use client';

import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import { subjects } from '@/lib/subjects';
import { topics } from '@/lib/topics';
import { subjectStyles } from '@/lib/subjectStyles';

export const EMPTY_FILTER = { subjects: [], topics: [], status: 'all' };

const STATUS_OPTIONS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'undone', label: 'ยังไม่ทำ' },
  { id: 'done', label: 'เคยทำแล้ว' },
];

function Checkbox({ checked, label, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-start gap-2 text-left w-full group"
    >
      <span
        className={`w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center border transition-colors ${
          checked ? 'bg-navy border-navy' : 'border-graylight/50 group-hover:border-navy/50'
        }`}
      >
        {checked && <Check size={11} className="text-white" strokeWidth={3} />}
      </span>
      <span className={`text-sm leading-snug ${checked ? 'text-navy font-medium' : 'text-graydark'}`}>
        {label}
      </span>
    </button>
  );
}

/**
 * scopeSubjectId: ถ้าส่งมา แผงจะล็อกอยู่ในวิชานั้นวิชาเดียว
 * (ซ่อนคอลัมน์ "วิชา" และแสดงหมวดย่อยของวิชานั้นทันทีโดยไม่ต้องเลือกวิชาก่อน)
 */
export default function PracticeFilter({ value, onChange, scopeSubjectId = null }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const boxRef = useRef(null);

  // เปิดแผงทีไร ให้เริ่มจากค่าที่ใช้อยู่จริงเสมอ
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  // คลิกนอกแผง = ปิดโดยไม่บันทึก
  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const activeCount =
    value.subjects.length + value.topics.length + (value.status !== 'all' ? 1 : 0);

  function toggleSubject(id) {
    setDraft((d) => {
      const has = d.subjects.includes(id);
      const nextSubjects = has ? d.subjects.filter((s) => s !== id) : [...d.subjects, id];
      // ถ้าเอาวิชาออก ต้องเอาหมวดย่อยของวิชานั้นออกด้วย ไม่งั้นจะค้างเป็นตัวกรองล่องหน
      const nextTopics = d.topics.filter((tid) => {
        const t = topics.find((x) => x.id === tid);
        return t && nextSubjects.includes(t.subjectId);
      });
      return { ...d, subjects: nextSubjects, topics: nextTopics };
    });
  }

  function toggleTopic(id) {
    setDraft((d) => ({
      ...d,
      topics: d.topics.includes(id) ? d.topics.filter((t) => t !== id) : [...d.topics, id],
    }));
  }

  // ในหน้ารายวิชา หมวดย่อยคือชุดของวิชานั้นเลย
  // ส่วนหน้ารวม หมวดย่อยจะโผล่เมื่อเลือกวิชาแล้วเท่านั้น (ไม่งั้นรายการจะยาวเกินไป)
  const subTopics = scopeSubjectId
    ? topics.filter((t) => t.subjectId === scopeSubjectId)
    : topics.filter((t) => draft.subjects.includes(t.subjectId));
  const allSubjectsChecked = draft.subjects.length === 0;

  return (
    <div className="relative shrink-0" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="ตัวกรอง"
        className={`relative flex items-center justify-center gap-2 rounded-xl px-4 sm:px-5 py-3 text-sm font-medium transition-colors ${
          open ? 'bg-navy/90 text-white' : 'bg-navy text-white hover:opacity-90'
        }`}
      >
        <SlidersHorizontal size={16} />
        {/* จอเล็กเหลือแค่ไอคอน เพื่อไม่ให้ช่องค้นหาแคบเกินไป */}
        <span className="hidden sm:inline">ตัวกรอง</span>
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-400 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-[min(92vw,640px)] bg-white border border-graylight/30 rounded-2xl shadow-xl">
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-graylight/20">
            {/* หมวดย่อย */}
            {subTopics.length > 0 && (
              <div className="p-5">
                <p className="text-xs text-graydark/50 mb-3">หมวดย่อย</p>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  <Checkbox
                    checked={draft.topics.length === 0}
                    label="ทั้งหมด"
                    onChange={() => setDraft((d) => ({ ...d, topics: [] }))}
                  />
                  {subTopics.map((t) => (
                    <Checkbox
                      key={t.id}
                      checked={draft.topics.includes(t.id)}
                      label={t.name}
                      onChange={() => toggleTopic(t.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* วิชา + สถานะ */}
            <div className={`p-5 ${subTopics.length === 0 ? 'sm:col-span-2' : ''}`}>
              {!scopeSubjectId && (
                <>
                  <p className="text-xs text-graydark/50 mb-3">วิชา</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-5">
                    <Checkbox
                      checked={allSubjectsChecked}
                      label="ทั้งหมด"
                      onChange={() => setDraft((d) => ({ ...d, subjects: [], topics: [] }))}
                    />
                    {subjects.map((s) => (
                      <Checkbox
                        key={s.id}
                        checked={draft.subjects.includes(s.id)}
                        label={subjectStyles[s.id].short}
                        onChange={() => toggleSubject(s.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              <p className="text-xs text-graydark/50 mb-2">สถานะ</p>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, status: o.id }))}
                    className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                      draft.status === o.id
                        ? 'bg-navy text-white'
                        : 'bg-graylight/15 text-graydark hover:bg-graylight/25'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-4 border-t border-graylight/20">
            <button
              type="button"
              onClick={() => {
                setDraft(EMPTY_FILTER);
                onChange(EMPTY_FILTER);
                setOpen(false);
              }}
              className="flex-1 border border-graylight/40 text-graydark rounded-xl py-2.5 text-sm font-medium hover:bg-graylight/10"
            >
              ล้าง
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(draft);
                setOpen(false);
              }}
              className="flex-1 bg-navy text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
