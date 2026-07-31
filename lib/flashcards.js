// หมายเหตุ: แฟลชการ์ดชุดนี้เป็น "ตัวอย่าง" สำหรับสาธิตการทำงานของระบบเท่านั้น
// ยังไม่ใช่เนื้อหาจริงที่ผ่านการตรวจทาน ควรแทนที่ด้วยเนื้อหาจริงก่อนใช้งานจริง

export const flashcards = [
  // เทคโนโลยีสารสนเทศ (คอมพิวเตอร์)
  { id: 'it-f1', subjectId: 'it', front: 'RAM ย่อมาจากอะไร?', back: 'Random Access Memory — หน่วยความจำชั่วคราว ข้อมูลหายเมื่อปิดเครื่อง' },
  { id: 'it-f2', subjectId: 'it', front: 'HTTPS ต่างจาก HTTP อย่างไร?', back: 'HTTPS เข้ารหัสข้อมูลระหว่างส่งด้วย SSL/TLS ทำให้ปลอดภัยกว่า' },
  { id: 'it-f3', subjectId: 'it', front: 'URL ย่อมาจากอะไร?', back: 'Uniform Resource Locator — ที่อยู่ของทรัพยากรบนอินเทอร์เน็ต' },
  { id: 'it-f4', subjectId: 'it', front: 'ไฟล์ .docx เป็นของโปรแกรมใด?', back: 'Microsoft Word (เวอร์ชันใหม่ตั้งแต่ 2007 เป็นต้นไป)' },

  // งานสารบรรณ
  { id: 'correspondence-f1', subjectId: 'correspondence', front: 'หนังสือราชการมีกี่ชนิด?', back: '6 ชนิด ได้แก่ หนังสือภายนอก ภายใน ประทับตรา สั่งการ ประชาสัมพันธ์ และที่เจ้าหน้าที่ทำขึ้นหรือรับไว้เป็นหลักฐาน' },
  { id: 'correspondence-f2', subjectId: 'correspondence', front: 'หนังสือภายในใช้ติดต่อกันแบบใด?', back: 'ใช้ติดต่อภายในกระทรวง ทบวง กรม หรือจังหวัดเดียวกัน' },
  { id: 'correspondence-f3', subjectId: 'correspondence', front: 'หนังสือประทับตราใช้ในกรณีใด?', back: 'ใช้ติดต่อราชการที่ไม่ใช่เรื่องสำคัญ ระหว่างส่วนราชการกับส่วนราชการ หรือส่วนราชการกับบุคคลภายนอก' },

  // กฎหมายที่ประชาชนควรรู้
  { id: 'law-f1', subjectId: 'law', front: 'อายุความคดีอาญาทั่วไปเริ่มนับจากเมื่อใด?', back: 'นับแต่วันที่กระทำความผิด' },
  { id: 'law-f2', subjectId: 'law', front: 'การป้องกันโดยชอบด้วยกฎหมายคืออะไร?', back: 'การกระทำเพื่อป้องกันสิทธิของตนหรือผู้อื่นให้พ้นภยันตรายที่ใกล้จะถึง โดยไม่เกินสมควรแก่เหตุ' },
  { id: 'law-f3', subjectId: 'law', front: 'ผู้เยาว์บรรลุนิติภาวะเมื่ออายุครบเท่าใด?', back: '20 ปีบริบูรณ์ หรือเมื่อสมรสโดยชอบด้วยกฎหมาย' },

  // ความสามารถทั่วไป (คณิตศาสตร์)
  { id: 'aptitude-f1', subjectId: 'aptitude', front: 'สูตรหาพื้นที่วงกลม', back: 'π × r² (r คือรัศมี)' },
  { id: 'aptitude-f2', subjectId: 'aptitude', front: 'อัตราส่วนคืออะไร?', back: 'การเปรียบเทียบปริมาณสองปริมาณที่มีหน่วยเดียวกัน เช่น 3:4' },

  // ภาษาไทย
  { id: 'thai-f1', subjectId: 'thai', front: '"ราชาศัพท์" ของคำว่า "กิน" (สำหรับพระสงฆ์) คือ?', back: 'ฉัน' },
  { id: 'thai-f2', subjectId: 'thai', front: 'คำว่า "อิเหนา" เป็นคำประเภทใด?', back: 'คำที่มาจากภาษาต่างประเทศ (ชวา/มลายู) ใช้เป็นชื่อเฉพาะในวรรณคดี' },

  // ภาษาต่างประเทศ (ภาษาอังกฤษ)
  { id: 'english-f1', subjectId: 'english', front: 'Past tense ของ "go" คืออะไร?', back: 'went' },
  { id: 'english-f2', subjectId: 'english', front: '"Although" ใช้เชื่อมประโยคแบบใด?', back: 'แสดงความขัดแย้ง (contrast) เช่น Although it rained, we went out.' },
];

export function flashcardsBySubject(subjectId) {
  return flashcards.filter((f) => f.subjectId === subjectId);
}
