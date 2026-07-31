// หมายเหตุ: กำหนดการชุดนี้เป็น "ตัวอย่าง" สำหรับสาธิตการทำงานของระบบเท่านั้น
// ควรแทนที่ด้วยกำหนดการจริงเมื่อประกาศทางการออกมา

export const calendarEvents = [
  {
    id: 'exam-day',
    date: '2026-11-29',
    title: 'วันสอบข้อเขียน สายอำนวยการ',
    type: 'exam',
    description: 'สอบข้อเขียนจริง ตรวจสอบสถานที่สอบและเลขที่นั่งสอบล่วงหน้า',
  },
  {
    id: 'mock-1',
    date: '2026-08-15',
    title: 'ข้อสอบเสมือนจริง ครั้งที่ 1',
    type: 'mock',
    description: 'จำลองสอบเต็มรูปแบบ 150 ข้อ 3 ชั่วโมง ตามสัดส่วนข้อสอบจริง',
  },
  {
    id: 'mock-2',
    date: '2026-09-19',
    title: 'ข้อสอบเสมือนจริง ครั้งที่ 2',
    type: 'mock',
    description: 'จำลองสอบเต็มรูปแบบ ครั้งที่ 2 ก่อนช่วงโค้งสุดท้าย',
  },
  {
    id: 'mock-3',
    date: '2026-10-24',
    title: 'ข้อสอบเสมือนจริง ครั้งที่ 3 (โค้งสุดท้าย)',
    type: 'mock',
    description: 'จำลองสอบเต็มรูปแบบ ครั้งสุดท้ายก่อนสอบจริง',
  },
  {
    id: 'live-1',
    date: '2026-08-02',
    title: 'ติวสด: กฎหมายที่ประชาชนควรรู้',
    type: 'live',
    description: 'ติวสดผ่านระบบออนไลน์ พร้อมถาม-ตอบ',
  },
  {
    id: 'live-2',
    date: '2026-09-06',
    title: 'ติวสด: งานสารบรรณ',
    type: 'live',
    description: 'ติวสดผ่านระบบออนไลน์ พร้อมถาม-ตอบ',
  },
  {
    id: 'deadline-1',
    date: '2026-08-31',
    title: 'ปิดรับสมัครสอบ (คาดการณ์)',
    type: 'deadline',
    description: 'ตรวจสอบประกาศรับสมัครอย่างเป็นทางการจากหน่วยงานที่เกี่ยวข้อง',
  },
];

export const eventTypeStyles = {
  exam: { label: 'วันสอบจริง', dot: 'bg-accent-cyan', badge: 'bg-accent-cyan/10 text-accent-cyan' },
  mock: { label: 'ข้อสอบเสมือนจริง', dot: 'bg-navy', badge: 'bg-navy/10 text-navy' },
  live: { label: 'ติวสด', dot: 'bg-accent-green', badge: 'bg-accent-green/10 text-green-700' },
  deadline: { label: 'กำหนดการสำคัญ', dot: 'bg-orange-400', badge: 'bg-orange-100 text-orange-600' },
};

export function eventsByMonth(year, month) {
  return calendarEvents.filter((e) => {
    const d = new Date(e.date + 'T00:00:00+07:00');
    return d.getFullYear() === year && d.getMonth() === month;
  });
}
