'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PauseCircle, Trash2 } from 'lucide-react';
import { getSession, clearSession } from '@/lib/examSession';
import { confirmDiscardSession } from '@/lib/sweetAlert';

function formatSavedAt(iso) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time} น.`;
  } catch {
    return '';
  }
}

export default function ResumeBanner() {
  const [session, setSession] = useState(null);

  // อ่าน localStorage หลัง mount เท่านั้น เพื่อไม่ให้ markup ตอน SSR กับตอน hydrate ต่างกัน
  useEffect(() => {
    setSession(getSession());
  }, []);

  if (!session) return null;

  const answered = Object.keys(session.answers || {}).length;
  const href =
    session.kind === 'mock'
      ? `/mock-exam/${session.examId || session.setId}`
      : `/exam/${session.subjectId}${session.topicId ? `?topic=${session.topicId}` : ''}`;

  return (
    <section className="border border-amber-200 bg-amber-50/60 rounded-2xl p-5 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <PauseCircle size={17} className="text-amber-600" />
        <h2 className="font-semibold text-navy">ข้อสอบที่ยังทำไม่เสร็จ</h2>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap bg-white border border-amber-100 rounded-xl px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-graydark truncate">{session.label}</p>
          <p className="text-xs text-graydark/50">
            ทำไปแล้ว {answered}/{session.total} ข้อ
            {session.savedAt ? ` · พักไว้เมื่อ ${formatSavedAt(session.savedAt)}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={async () => {
              if (await confirmDiscardSession()) {
                clearSession();
                setSession(null);
              }
            }}
            className="flex items-center gap-1 text-xs text-graydark/50 hover:text-red-600 px-2 py-1.5"
          >
            <Trash2 size={13} />
            ทิ้ง
          </button>
          <Link
            href={href}
            className="text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg px-4 py-2"
          >
            ทำต่อ →
          </Link>
        </div>
      </div>
    </section>
  );
}
