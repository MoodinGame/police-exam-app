// เก็บข้อสอบที่ทำค้างไว้ใน localStorage เพื่อให้กลับมาทำต่อได้
// เก็บได้ครั้งละ 1 ชุด — เริ่มชุดใหม่จะทับของเดิม (เตือนผู้ใช้ก่อนที่หน้าเลือกชุด)

const KEY = 'policeExam:activeSession';

function read() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * id ของชุดที่กำลังทำ ใช้เทียบว่าที่ค้างไว้เป็นชุดเดียวกับที่เพิ่งเปิดหรือเปล่า
 * practice: practice:<subjectId>:<topicId|all>
 * mock:     mock:<setId>
 */
export function practiceSessionId(subjectId, topicId) {
  return `practice:${subjectId}:${topicId || 'all'}`;
}

export function mockSessionId(setId) {
  return `mock:${setId}`;
}

export function saveSession(session) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...session, savedAt: new Date().toISOString() }));
  } catch {
    // localStorage ไม่พร้อมใช้งาน — ข้ามไปเงียบๆ
  }
}

export function getSession() {
  return read();
}

/** คืนค่าเฉพาะเมื่อที่ค้างไว้เป็นชุดเดียวกับที่ระบุ */
export function getSessionFor(sessionId) {
  const s = read();
  return s && s.sessionId === sessionId ? s : null;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ไม่ต้องทำอะไร
  }
}

export function clearSessionIf(sessionId) {
  const s = read();
  if (s && s.sessionId === sessionId) clearSession();
}
