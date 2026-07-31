'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarEvents, eventsByMonth, eventTypeStyles } from '@/lib/calendarEvents';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function toBuddhistYear(y) {
  return y + 543;
}

function isoDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const monthEvents = useMemo(() => eventsByMonth(year, month), [year, month]);
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of monthEvents) {
      map[e.date] = map[e.date] ? [...map[e.date], e] : [e];
    }
    return map;
  }, [monthEvents]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const upcoming = useMemo(() => {
    return calendarEvents
      .filter((e) => e.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [todayIso]);

  function changeMonth(delta) {
    setCursor(new Date(year, month + delta, 1));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy mb-1">ปฏิทิน</h1>
      <p className="text-graydark/60 mb-8">วันสอบ, ข้อสอบเสมือนจริง, ติวสด และกำหนดการสำคัญ</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 border border-graylight/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-lg hover:bg-navy/5 text-graydark/60"
              aria-label="เดือนก่อนหน้า"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="font-medium text-navy">
              {THAI_MONTHS[month]} {toBuddhistYear(year)}
            </p>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-lg hover:bg-navy/5 text-graydark/60"
              aria-label="เดือนถัดไป"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-xs text-graydark/40 py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e-${i}`} />;
              const iso = isoDate(year, month, d);
              const dayEvents = eventsByDate[iso] || [];
              const isToday = iso === todayIso;
              return (
                <div
                  key={iso}
                  className={`aspect-square rounded-xl border p-1.5 flex flex-col ${
                    isToday ? 'border-accent-cyan bg-accent-cyan/5' : 'border-graylight/20'
                  }`}
                >
                  <span className={`text-xs ${isToday ? 'text-accent-cyan font-semibold' : 'text-graydark/70'}`}>
                    {d}
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-auto">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        title={e.title}
                        className={`w-1.5 h-1.5 rounded-full ${eventTypeStyles[e.type].dot}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-graylight/20">
            {Object.entries(eventTypeStyles).map(([key, s]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-graydark/60">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <div className="border border-graylight/30 rounded-2xl p-6">
          <p className="text-sm text-graydark/60 mb-4">กำหนดการที่ใกล้ถึง</p>
          {upcoming.length === 0 ? (
            <p className="text-sm text-graydark/40">ไม่มีกำหนดการที่ใกล้ถึง</p>
          ) : (
            <ul className="space-y-4">
              {upcoming.map((e) => {
                const d = new Date(e.date + 'T00:00:00+07:00');
                const style = eventTypeStyles[e.type];
                return (
                  <li key={e.id} className="flex gap-3">
                    <div className="w-12 shrink-0 text-center">
                      <p className="text-lg font-bold text-navy leading-none">{d.getDate()}</p>
                      <p className="text-[10px] text-graydark/40 mt-1">{THAI_MONTHS[d.getMonth()].slice(0, 3)}</p>
                    </div>
                    <div>
                      <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-1 ${style.badge}`}>
                        {style.label}
                      </span>
                      <p className="text-sm text-graydark font-medium leading-snug">{e.title}</p>
                      <p className="text-xs text-graydark/40 mt-0.5">{e.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
