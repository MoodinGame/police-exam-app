// หมายเหตุ: รายการหัวข้อย่อยนี้ครอบคลุมขอบเขตเนื้อหาที่ควรออกสอบในแต่ละวิชา
// หัวข้อที่ยังไม่มีคำถามในคลังข้อสอบ (lib/questions.js) จะถูกทำเครื่องหมายว่า "เร็วๆ นี้" โดยอัตโนมัติ

import { questions } from './questions';

const topicDefs = [
  // เทคโนโลยีสารสนเทศ (คอมพิวเตอร์)
  { id: 'it-memory', subjectId: 'it', name: 'หน่วยความจำและฮาร์ดแวร์', description: 'RAM, ROM, หน่วยเก็บข้อมูล และอุปกรณ์ฮาร์ดแวร์พื้นฐาน' },
  { id: 'it-network', subjectId: 'it', name: 'เครือข่ายและอินเทอร์เน็ต', description: 'โปรโตคอล, HTTP/HTTPS และการเชื่อมต่อเครือข่าย' },
  { id: 'it-office', subjectId: 'it', name: 'โปรแกรมสำนักงาน', description: 'Microsoft Office และไฟล์เอกสารประเภทต่างๆ' },
  { id: 'it-cyber', subjectId: 'it', name: 'ภัยคุกคามทางไซเบอร์', description: 'การรักษาความปลอดภัยข้อมูลเบื้องต้น' },
  { id: 'it-os', subjectId: 'it', name: 'ระบบปฏิบัติการ', description: 'หลักการทำงานของระบบปฏิบัติการคอมพิวเตอร์' },

  // งานสารบรรณ
  { id: 'corr-types', subjectId: 'correspondence', name: 'ประเภทของหนังสือราชการ', description: 'หนังสือภายนอก ภายใน ประทับตรา และประเภทอื่นๆ' },
  { id: 'corr-archive', subjectId: 'correspondence', name: 'การเก็บรักษาและทำลายหนังสือ', description: 'ขั้นตอนสุดท้ายของงานสารบรรณ' },
  { id: 'corr-draft', subjectId: 'correspondence', name: 'การร่างและเสนอหนังสือ', description: 'หลักการเขียนและเสนอหนังสือราชการ' },
  { id: 'corr-regulation', subjectId: 'correspondence', name: 'ระเบียบสำนักนายกฯ ว่าด้วยงานสารบรรณ', description: 'สาระสำคัญของระเบียบงานสารบรรณ พ.ศ. 2526' },

  // กฎหมายที่ประชาชนควรรู้
  { id: 'law-civil', subjectId: 'law', name: 'กฎหมายแพ่งเบื้องต้น', description: 'นิติภาวะ นิติกรรม และหลักกฎหมายแพ่งพื้นฐาน' },
  { id: 'law-criminal', subjectId: 'law', name: 'กฎหมายอาญาเบื้องต้น', description: 'องค์ประกอบความผิดและโทษทางอาญา' },
  { id: 'law-rights', subjectId: 'law', name: 'สิทธิผู้ต้องหาและกระบวนการยุติธรรม', description: 'สิทธิขั้นพื้นฐานในการถูกจับกุมและสอบสวน' },
  { id: 'law-constitution', subjectId: 'law', name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย', description: 'โครงสร้างและหลักการสำคัญของรัฐธรรมนูญ' },
  { id: 'law-police-act', subjectId: 'law', name: 'พ.ร.บ.ตำรวจแห่งชาติ', description: 'กฎหมายที่เกี่ยวข้องกับโครงสร้างสำนักงานตำรวจแห่งชาติ' },

  // ความสามารถทั่วไป (คณิตศาสตร์)
  { id: 'apt-ratio', subjectId: 'aptitude', name: 'อัตราส่วนและสัดส่วน', description: 'การเปรียบเทียบและคำนวณอัตราส่วน' },
  { id: 'apt-percent', subjectId: 'aptitude', name: 'ร้อยละ', description: 'โจทย์ร้อยละ กำไร ขาดทุน' },
  { id: 'apt-series', subjectId: 'aptitude', name: 'อนุกรมตัวเลข', description: 'การหาความสัมพันธ์และพจน์ถัดไปของอนุกรม' },
  { id: 'apt-set', subjectId: 'aptitude', name: 'เซตและตรรกศาสตร์', description: 'แผนภาพเวนน์-ออยเลอร์ และการให้เหตุผลเชิงตรรกะ' },
  { id: 'apt-prob', subjectId: 'aptitude', name: 'การนับและความน่าจะเป็น', description: 'หลักการนับและความน่าจะเป็นเบื้องต้น' },

  // ภาษาไทย
  { id: 'thai-royal', subjectId: 'thai', name: 'ราชาศัพท์', description: 'คำราชาศัพท์ที่ใช้กับบุคคลระดับต่างๆ' },
  { id: 'thai-rhetoric', subjectId: 'thai', name: 'โวหารและสำนวน', description: 'อุปมาอุปไมยและโวหารภาพพจน์' },
  { id: 'thai-spelling', subjectId: 'thai', name: 'หลักการเขียนสะกดคำ', description: 'คำที่มักเขียนผิดและหลักการสะกดที่ถูกต้อง' },
  { id: 'thai-reading', subjectId: 'thai', name: 'การอ่านจับใจความ', description: 'การอ่านจับใจความสำคัญของบทความ' },
  { id: 'thai-compound', subjectId: 'thai', name: 'คำสมาสและคำสนธิ', description: 'หลักการสร้างคำสมาสและคำสนธิ' },

  // ภาษาต่างประเทศ (ภาษาอังกฤษ)
  { id: 'eng-grammar', subjectId: 'english', name: 'Grammar & Structure', description: 'Tenses และโครงสร้างประโยคพื้นฐาน' },
  { id: 'eng-vocab', subjectId: 'english', name: 'Vocabulary', description: 'คำศัพท์ที่ใช้บ่อยในข้อสอบ' },
  { id: 'eng-police', subjectId: 'english', name: 'คำศัพท์เฉพาะทางตำรวจ', description: 'คำศัพท์ภาษาอังกฤษที่เกี่ยวข้องกับงานตำรวจ' },
  { id: 'eng-reading', subjectId: 'english', name: 'Reading Comprehension', description: 'การอ่านจับใจความภาษาอังกฤษ' },
  { id: 'eng-dialogue', subjectId: 'english', name: 'Situational Dialogues', description: 'บทสนทนาตามสถานการณ์ต่างๆ' },
];

export const topics = topicDefs.map((t) => {
  const questionCount = questions.filter((q) => q.topicId === t.id).length;
  return { ...t, questionCount, available: questionCount > 0 };
});

export function topicsBySubject(subjectId) {
  return topics.filter((t) => t.subjectId === subjectId);
}
