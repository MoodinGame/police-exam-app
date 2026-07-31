'use client';

import { useMemo, useState } from 'react';
import { RotateCw, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { subjects } from '@/lib/subjects';
import { flashcards } from '@/lib/flashcards';

export default function FlashcardsPage() {
  const [subjectId, setSubjectId] = useState(subjects[0].id);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cards = useMemo(() => flashcards.filter((f) => f.subjectId === subjectId), [subjectId]);
  const card = cards[index];

  function selectSubject(id) {
    setSubjectId(id);
    setIndex(0);
    setFlipped(false);
  }

  function go(delta) {
    if (cards.length === 0) return;
    setIndex((i) => (i + delta + cards.length) % cards.length);
    setFlipped(false);
  }

  function shuffle() {
    if (cards.length === 0) return;
    setIndex(Math.floor(Math.random() * cards.length));
    setFlipped(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy mb-1">แฟลชการ์ด</h1>
      <p className="text-graydark/60 mb-8">ทบทวนคำศัพท์และประเด็นสำคัญเป็นรายวิชา</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => selectSubject(s.id)}
            className={`text-sm px-4 py-2 rounded-full border transition-colors ${
              subjectId === s.id
                ? 'bg-navy text-white border-navy'
                : 'border-graylight/30 text-graydark hover:border-accent-cyan/50'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {cards.length === 0 ? (
        <div className="border border-dashed border-graylight/40 rounded-2xl p-12 text-center text-graydark/40">
          ยังไม่มีแฟลชการ์ดสำหรับวิชานี้
        </div>
      ) : (
        <div className="max-w-xl mx-auto">
          <p className="text-center text-sm text-graydark/40 mb-4">
            การ์ดที่ {index + 1} / {cards.length}
          </p>

          <button
            onClick={() => setFlipped((f) => !f)}
            className="w-full h-64 rounded-2xl border border-graylight/30 flex items-center justify-center p-8 text-center hover:shadow-md hover:border-accent-cyan/50 transition-all"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-accent-cyan mb-4">
                {flipped ? 'คำตอบ' : 'คำถาม'}
              </p>
              <p className="text-lg font-medium text-navy leading-relaxed">
                {flipped ? card.back : card.front}
              </p>
            </div>
          </button>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => go(-1)}
              className="flex items-center gap-1 text-sm text-graydark/60 hover:text-navy px-3 py-2"
            >
              <ChevronLeft size={18} />
              ก่อนหน้า
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setFlipped((f) => !f)}
                className="flex items-center gap-2 text-sm bg-accent-cyan text-white rounded-xl px-5 py-2.5 font-medium hover:opacity-90"
              >
                <RotateCw size={16} />
                พลิกการ์ด
              </button>
              <button
                onClick={shuffle}
                className="flex items-center gap-2 text-sm border border-graylight/30 text-graydark rounded-xl px-4 py-2.5 hover:border-accent-cyan/50"
              >
                <Shuffle size={16} />
                สุ่ม
              </button>
            </div>

            <button
              onClick={() => go(1)}
              className="flex items-center gap-1 text-sm text-graydark/60 hover:text-navy px-3 py-2"
            >
              ถัดไป
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
