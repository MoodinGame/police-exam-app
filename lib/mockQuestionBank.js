// Mock Exam uses a dedicated bank; never reuse lib/questions.js here.
// Every question belongs to one mock set:
// { id, mockSetId, subjectId, question, choices, answerIndex, explanation, difficulty }
// This stays empty until the DB/admin workflow is ready.
export const mockQuestionBank = [];
