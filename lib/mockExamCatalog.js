import { subjects } from './subjects';
import { mockQuestionBank } from './mockQuestionBank';

// คลัง Mock Exam แยกจาก lib/questions.js โดยสิ้นเชิง
// จงใจไม่ปะปนกัน เพื่อป้องกันไม่ให้ผู้เรียนเจอข้อเดิมจากแบบฝึกหัดรายวิชา
export const mockExamBlueprint = {
  id: 'admin-2569-01',
  title: 'Mock Exam สายอำนวยการ ชุดที่ 1',
  durationMinutes: 180,
  passScore: 135,
  totalQuestions: 150,
  status: 'building',
};

// ตอนนี้เป็นรายการโครงสร้างเท่านั้น เมื่อมีคลังจริงให้เพิ่มจำนวน available ที่นี่
// และใส่ข้อสอบไว้ใน lib/mockQuestions.js (ต้องไม่ซ้ำกับ lib/questions.js)
const availableBySubject = mockQuestionBank.reduce((counts, question) => {
  counts[question.subjectId] = (counts[question.subjectId] || 0) + 1;
  return counts;
}, {});

export const mockExamSections = subjects.map((subject) => ({
  ...subject,
  required: subject.count,
  available: availableBySubject[subject.id] || 0,
}));

export const mockExamAvailableCount = mockExamSections.reduce((sum, section) => sum + section.available, 0);
export const mockExamMissingCount = mockExamBlueprint.totalQuestions - mockExamAvailableCount;
export const mockExamReady = mockExamSections.every((section) => section.available >= section.required);

export function getMockExamReadiness() {
  return {
    ready: mockExamReady,
    available: mockExamAvailableCount,
    missing: mockExamMissingCount,
    sections: mockExamSections,
  };
}
