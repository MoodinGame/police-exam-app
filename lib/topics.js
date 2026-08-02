// หมายเหตุ: รายการหัวข้อย่อยนี้ครอบคลุมขอบเขตเนื้อหาที่ควรออกสอบในแต่ละวิชา
// หัวข้อที่ยังไม่มีคำถามในคลังข้อสอบ (lib/questions.js) จะถูกทำเครื่องหมายว่า "เร็วๆ นี้" โดยอัตโนมัติ

import { questions } from './questions';
import { correspondenceTopics } from './correspondenceTopics';
import { lawTopics } from './lawTopics';
import { policeCorrespondenceTopics } from './policeCorrespondenceTopics';
import { thaiTopics } from './thaiTopics';

const topicDefs = [
  // เทคโนโลยีสารสนเทศ (คอมพิวเตอร์)
  { id: 'it-cyber', subjectId: 'it', name: 'ความปลอดภัยทางไซเบอร์', description: 'การป้องกันข้อมูล บัญชีผู้ใช้ และภัยคุกคามดิจิทัล' },
  { id: 'it-general', subjectId: 'it', name: 'ความรู้ทั่วไปเกี่ยวกับคอมพิวเตอร์', description: 'พื้นฐานคอมพิวเตอร์และองค์ประกอบของระบบสารสนเทศ' },
  { id: 'it-government-law', subjectId: 'it', name: 'คอมพิวเตอร์ในงานราชการและกฎหมายไอที', description: 'การใช้เทคโนโลยีในภาครัฐและข้อกฎหมายดิจิทัลเบื้องต้น' },
  { id: 'it-shortcuts', subjectId: 'it', name: 'คำสั่งลัดและการใช้งานคีย์บอร์ด', description: 'ปุ่มลัดและวิธีใช้งานแป้นพิมพ์ที่พบบ่อย' },
  { id: 'it-software', subjectId: 'it', name: 'ซอฟต์แวร์และโปรแกรมประยุกต์', description: 'ประเภทซอฟต์แวร์และการเลือกใช้โปรแกรมให้เหมาะกับงาน' },
  { id: 'it-database-ai', subjectId: 'it', name: 'ฐานข้อมูลและปัญญาประดิษฐ์', description: 'ข้อมูล ฐานข้อมูล และแนวคิดปัญญาประดิษฐ์เบื้องต้น' },
  { id: 'it-office', subjectId: 'it', name: 'ทักษะโปรแกรมสำนักงาน (Word & Excel)', description: 'Microsoft Word, Excel และไฟล์เอกสารสำนักงาน' },
  { id: 'it-os', subjectId: 'it', name: 'ระบบปฏิบัติการและการจัดการไฟล์', description: 'หน้าที่ระบบปฏิบัติการ ไฟล์ โฟลเดอร์ และนามสกุลไฟล์' },
  { id: 'it-business-information', subjectId: 'it', name: 'ระบบสารสนเทศทางธุรกิจ', description: 'บทบาทของระบบสารสนเทศต่อการดำเนินงานทางธุรกิจ' },
  { id: 'it-management-information', subjectId: 'it', name: 'ระบบสารสนเทศเพื่อการจัดการ', description: 'การใช้สารสนเทศสนับสนุนการวางแผนและตัดสินใจ' },
  { id: 'it-memory', subjectId: 'it', name: 'หน่วยข้อมูลและการจัดเก็บข้อมูล', description: 'RAM, ROM หน่วยข้อมูล และสื่อจัดเก็บข้อมูล' },
  { id: 'it-network', subjectId: 'it', name: 'อินเทอร์เน็ตและเครือข่ายคอมพิวเตอร์', description: 'โปรโตคอล HTTP/HTTPS และการเชื่อมต่ออินเทอร์เน็ต' },
  { id: 'it-hardware-peripheral', subjectId: 'it', name: 'ฮาร์ดแวร์และอุปกรณ์ต่อพ่วง', description: 'อุปกรณ์รับเข้า ประมวลผล แสดงผล และอุปกรณ์ต่อพ่วง' },
  { id: 'it-data-communication', subjectId: 'it', name: 'เครือข่ายและการสื่อสารข้อมูล', description: 'หลักการสื่อสารข้อมูล อุปกรณ์เครือข่าย และรูปแบบการเชื่อมต่อ' },
  { id: 'it-modern-technology', subjectId: 'it', name: 'เทคโนโลยีสารสนเทศสมัยใหม่', description: 'Cloud, IoT และแนวโน้มเทคโนโลยีดิจิทัล' },

  // สารบรรณ: ใช้หมวดทั่วไปเดิมที่เชื่อมกับคลังความรู้
  ...correspondenceTopics.map(({ id, name, description }) => ({ id, subjectId: 'correspondence', name, description })),

  // สารบรรณตำรวจ: หมวดสำหรับแบบฝึกหัดและตัวกรอง แยกจากคลังความรู้
  ...policeCorrespondenceTopics.map(({ id, name, description }) => ({ id, subjectId: 'police-correspondence', name, description })),

  // กฎหมาย: ใช้รายการกลางเดียวกับตัวกรองและคลังความรู้
  ...lawTopics.map(({ id, name, description }) => ({ id, subjectId: 'law', name, description })),

  // สังคม: หมวดแบบฝึกหัดสำหรับแอดมินเพิ่มข้อสอบในภายหลัง
  { id: 'social-culture', subjectId: 'social', name: 'สังคมและวัฒนธรรม', description: 'สังคม วัฒนธรรม ประเพณี และเศรษฐกิจพอเพียง' },
  { id: 'social-religion', subjectId: 'social', name: 'ศาสนาและจริยธรรม', description: 'หลักธรรม จริยธรรม และวันสำคัญทางศาสนา' },
  { id: 'social-governance', subjectId: 'social', name: 'หลักธรรมาภิบาล', description: 'หลักการบริหารจัดการที่ดีในการปฏิบัติงานภาครัฐ' },
  { id: 'social-asean', subjectId: 'social', name: 'อาเซียน', description: 'ความรู้ทั่วไปเกี่ยวกับประชาคมอาเซียน เศรษฐกิจ สังคม และวัฒนธรรม' },

  // ความสามารถทั่วไป (คณิตศาสตร์)
  { id: 'apt-counting-methods', subjectId: 'aptitude', name: 'การนับจำนวนวิธี', description: 'วิธีนับจำนวนกรณีและการจัดเรียงเบื้องต้น' },
  { id: 'apt-logical-reasoning', subjectId: 'aptitude', name: 'การให้เหตุผลเชิงตรรกะ', description: 'วิเคราะห์เงื่อนไขและสรุปผลอย่างมีเหตุผล' },
  { id: 'apt-mathematics', subjectId: 'aptitude', name: 'คณิตศาสตร์', description: 'แนวคิดและทักษะคณิตศาสตร์พื้นฐานสำหรับทำข้อสอบ' },
  { id: 'apt-prob', subjectId: 'aptitude', name: 'ความน่าจะเป็น', description: 'โอกาสเกิดเหตุการณ์และการคำนวณความน่าจะเป็น' },
  { id: 'apt-work-time', subjectId: 'aptitude', name: 'งานและเวลา', description: 'โจทย์งาน อัตราการทำงาน และเวลา' },
  { id: 'apt-logic', subjectId: 'aptitude', name: 'ตรรกศาสตร์', description: 'ประพจน์ เงื่อนไข และการให้เหตุผลเชิงตรรกะ' },
  { id: 'apt-logic-problems', subjectId: 'aptitude', name: 'ตรรกะ', description: 'โจทย์ตรรกะและการวิเคราะห์เงื่อนไข' },
  { id: 'apt-data-tables', subjectId: 'aptitude', name: 'ตารางข้อมูล', description: 'การอ่าน วิเคราะห์ และคำนวณจากตารางข้อมูล' },
  { id: 'apt-spatial', subjectId: 'aptitude', name: 'มิติสัมพันธ์', description: 'ความสัมพันธ์ของรูปทรง ตำแหน่ง และมิติ' },
  { id: 'apt-percent', subjectId: 'aptitude', name: 'ร้อยละ', description: 'โจทย์ร้อยละ กำไร ขาดทุน' },
  { id: 'apt-percent-ratio', subjectId: 'aptitude', name: 'ร้อยละและอัตราส่วน', description: 'การเปรียบเทียบและคำนวณร้อยละร่วมกับอัตราส่วน' },
  { id: 'apt-statistics', subjectId: 'aptitude', name: 'สถิติ', description: 'การแจกแจงข้อมูล ค่ากลาง และการอ่านกราฟ' },
  { id: 'apt-data-analysis', subjectId: 'aptitude', name: 'สถิติและการวิเคราะห์ข้อมูล', description: 'วิเคราะห์ตาราง กราฟ และข้อมูลเชิงสถิติ' },
  { id: 'apt-equations', subjectId: 'aptitude', name: 'สมการ', description: 'การแก้สมการและการประยุกต์ใช้สมการ' },
  { id: 'apt-counting-principles', subjectId: 'aptitude', name: 'หลักการนับ', description: 'หลักบวก หลักคูณ และการนับแบบเป็นระบบ' },
  { id: 'apt-series-general', subjectId: 'aptitude', name: 'อนุกรม', description: 'การวิเคราะห์รูปแบบและความสัมพันธ์ของอนุกรม' },
  { id: 'apt-series', subjectId: 'aptitude', name: 'อนุกรมตัวเลข', description: 'การหาความสัมพันธ์และพจน์ถัดไปของอนุกรม' },
  { id: 'apt-series-spatial', subjectId: 'aptitude', name: 'อนุกรมภาพและมิติสัมพันธ์', description: 'รูปแบบภาพ การหมุน และความสัมพันธ์เชิงมิติ' },
  { id: 'apt-inequalities', subjectId: 'aptitude', name: 'อสมการ', description: 'การแก้อสมการและการเปรียบเทียบค่า' },
  { id: 'apt-ratio', subjectId: 'aptitude', name: 'อัตราส่วน', description: 'การเปรียบเทียบและคำนวณอัตราส่วน' },
  { id: 'apt-speed', subjectId: 'aptitude', name: 'อัตราเร็ว', description: 'โจทย์ระยะทาง เวลา และความเร็ว' },
  { id: 'apt-analogy', subjectId: 'aptitude', name: 'อุปมาอุปไมย', description: 'วิเคราะห์ความสัมพันธ์ของคำ ตัวเลข หรือสัญลักษณ์' },
  { id: 'apt-set', subjectId: 'aptitude', name: 'เซต', description: 'แผนภาพเวนน์-ออยเลอร์และการคำนวณจำนวนสมาชิก' },
  { id: 'apt-geometry', subjectId: 'aptitude', name: 'เรขาคณิต', description: 'รูปเรขาคณิต พื้นที่ ปริมาตร และความสัมพันธ์ของรูปทรง' },
  { id: 'apt-logical-inference', subjectId: 'aptitude', name: 'เหตุผลเชิงตรรกะ', description: 'สรุปผลจากเงื่อนไขและตรวจสอบความสมเหตุสมผล' },
  { id: 'apt-pie-chart', subjectId: 'aptitude', name: 'แผนภูมิวงกลม', description: 'การอ่านและคำนวณข้อมูลจากแผนภูมิวงกลม' },
  { id: 'apt-word-problems', subjectId: 'aptitude', name: 'โจทย์ปัญหา', description: 'แปลงข้อความเป็นวิธีคิดหรือสมการเพื่อหาคำตอบ' },
  { id: 'apt-calculation-problems', subjectId: 'aptitude', name: 'โจทย์ปัญหาการคำนวณ', description: 'โจทย์คำนวณประยุกต์และการตรวจคำตอบ' },
  { id: 'apt-age-problems', subjectId: 'aptitude', name: 'โจทย์อายุ', description: 'ความสัมพันธ์ของอายุในอดีต ปัจจุบัน และอนาคต' },

  // ภาษาไทย: ใช้รายการกลางเดียวกับตัวกรองและคลังความรู้
  ...thaiTopics.map(({ id, name, description }) => ({ id, subjectId: 'thai', name, description })),

  // ภาษาต่างประเทศ (ภาษาอังกฤษ)
  { id: 'eng-complete-conversation', subjectId: 'english', name: 'Complete the Conversation', description: 'เติมบทสนทนาให้สมบูรณ์จากสถานการณ์และเจตนาของผู้พูด' },
  { id: 'eng-dialogue', subjectId: 'english', name: 'Conversation', description: 'เลือกคำตอบหรือประโยคสนทนาที่เหมาะกับสถานการณ์' },
  { id: 'eng-error-identification', subjectId: 'english', name: 'Error Identification', description: 'ระบุจุดผิดด้านไวยากรณ์หรือการใช้คำในประโยค' },
  { id: 'eng-grammar', subjectId: 'english', name: 'Grammar', description: 'Tenses และโครงสร้างประโยคพื้นฐาน' },
  { id: 'eng-idioms-phrasal-verbs', subjectId: 'english', name: 'Idioms & Phrasal Verbs', description: 'สำนวนภาษาอังกฤษและกริยาวลีที่ใช้บ่อย' },
  { id: 'eng-reading', subjectId: 'english', name: 'Reading Comprehension', description: 'การอ่านจับใจความภาษาอังกฤษ' },
  { id: 'eng-sentence-completion', subjectId: 'english', name: 'Sentence Completion', description: 'เลือกคำหรือโครงสร้างที่ทำให้ประโยคสมบูรณ์' },
  { id: 'eng-signs-notices', subjectId: 'english', name: 'Signs & Notices', description: 'ตีความป้าย ประกาศ และข้อความสั้นภาษาอังกฤษ' },
  { id: 'eng-vocab', subjectId: 'english', name: 'Vocabulary', description: 'คำศัพท์ทั่วไปและคำศัพท์ที่เกี่ยวข้องกับงานตำรวจ' },
];

export const topics = topicDefs.map((t) => {
  const questionCount = questions.filter((q) => q.topicId === t.id).length;
  return { ...t, questionCount, available: questionCount > 0 };
});

export function topicsBySubject(subjectId) {
  return topics.filter((t) => t.subjectId === subjectId);
}
