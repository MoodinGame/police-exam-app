'use client';

// แคชรายการชุด Mock Exam ไว้ในหน่วยความจำฝั่ง client เพื่อให้หน้าที่ต้องการแค่
// ชื่อชุด (เช่น แดชบอร์ด, ประวัติการสอบ) เรียกดูแบบ sync ได้โดยไม่ต้อง fetch ซ้ำทุกครั้ง
// ตัวข้อสอบจริง (คำถาม+ตัวเลือก) ไม่แคช เพราะต้องเช็คสิทธิ์สมาชิกใหม่ทุกครั้งที่เข้าทำ

let cache = null;
let inflight = null;

export async function loadMockExamSets() {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = fetch('/api/mock-exam', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : { exams: [] }))
    .then((data) => {
      cache = data.exams || [];
      inflight = null;
      return cache;
    })
    .catch(() => {
      inflight = null;
      return [];
    });

  return inflight;
}

export function getCachedMockExamSet(idOrSlug) {
  if (!idOrSlug) return null;
  return (cache || []).find((exam) => exam.id === idOrSlug || exam.slug === idOrSlug) || null;
}

export function getCachedMockExamSets() {
  return cache || [];
}

// resumeIds ให้ backend ดึงข้อสอบชุดเดิมที่สุ่มไว้ตอนเริ่มสอบ (เก็บไว้ใน session ฝั่ง client)
// แทนที่จะสุ่มใหม่ทุกครั้งที่โหลดหน้า — ไม่งั้นพักสอบแล้วกลับมาทำต่อจะได้ข้อไม่ตรงกับที่ตอบไปแล้ว
export async function fetchMockExam(slug, resumeIds) {
  const query = Array.isArray(resumeIds) && resumeIds.length > 0
    ? `?resume=${resumeIds.map(encodeURIComponent).join(',')}`
    : '';
  const response = await fetch(`/api/mock-exam/${encodeURIComponent(slug)}${query}`, { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || 'โหลดชุดข้อสอบไม่สำเร็จ');
    error.status = response.status;
    throw error;
  }
  return result;
}
