import { subjects } from './subjects';
import { mockQuestionBank } from './mockQuestionBank';

// The Mock Exam bank remains separate from practice questions. When the
// database is connected, the admin service can provide the same fields.
const mockExamTemplates = Array.from({ length: 6 }, (_, index) => {
  const setNumber = index + 1;

  return {
    id: `admin-2569-${String(setNumber).padStart(2, '0')}`,
    setNumber,
    title: `ข้อสอบเสมือนจริง ชุดที่ ${setNumber}`,
    durationMinutes: 180,
    totalQuestions: 150,
    passScore: 135,
  };
});

function questionsForSet(setId) {
  return mockQuestionBank.filter((question) => question.mockSetId === setId);
}

function createExamSet(template) {
  const questions = questionsForSet(template.id);
  const availableBySubject = questions.reduce((counts, question) => {
    counts[question.subjectId] = (counts[question.subjectId] || 0) + 1;
    return counts;
  }, {});
  const sections = subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    required: subject.count,
    available: availableBySubject[subject.id] || 0,
  }));
  const available = questions.length;
  const ready = available >= template.totalQuestions
    && sections.every((section) => section.available >= section.required);

  return {
    ...template,
    available,
    missing: Math.max(0, template.totalQuestions - available),
    sections,
    ready,
    status: ready ? 'ready' : 'building',
  };
}

export const mockExamSets = mockExamTemplates.map(createExamSet);

// Compatibility aliases while the prototype moves from one set to multiple sets.
export const mockExamBlueprint = mockExamSets[0];
export const mockExamSections = mockExamBlueprint.sections;
export const mockExamAvailableCount = mockExamBlueprint.available;
export const mockExamMissingCount = mockExamBlueprint.missing;
export const mockExamReady = mockExamBlueprint.ready;

export function getMockExamSet(setId) {
  return mockExamSets.find((exam) => exam.id === setId) || null;
}

export function getMockQuestionsForSet(setId) {
  return questionsForSet(setId);
}

export function getMockExamReadiness(setId = mockExamBlueprint.id) {
  const exam = getMockExamSet(setId);
  if (!exam) return null;

  return {
    ready: exam.ready,
    available: exam.available,
    missing: exam.missing,
    sections: exam.sections,
  };
}
