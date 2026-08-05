export const MOCK_EXAM_TRACKS = Object.freeze([
  {
    id: 'general-affairs',
    name: 'สายอำนวยการ',
    shortName: 'อำนวยการ',
    totalQuestions: 150,
    durationMinutes: 180,
    passScore: 135,
    description: 'ข้อสอบเสมือนจริงสายอำนวยการ ตามสัดส่วนข้อสอบ 150 ข้อ',
    blueprint: [
      { subjectId: 'aptitude', subjectName: 'คณิตศาสตร์', questionCount: 20 },
      { subjectId: 'thai', subjectName: 'ภาษาไทย', questionCount: 20 },
      { subjectId: 'it', subjectName: 'คอมพิวเตอร์', questionCount: 40 },
      { subjectId: 'correspondence', subjectName: 'สารบรรณ', questionCount: 30 },
      { subjectId: 'law', subjectName: 'กฎหมาย', questionCount: 25 },
      { subjectId: 'english', subjectName: 'ภาษาอังกฤษ', questionCount: 15 },
    ],
  },
  {
    id: 'patrol',
    name: 'สายปราบปราม',
    shortName: 'ปราบปราม',
    totalQuestions: 150,
    durationMinutes: 180,
    passScore: 110,
    description: 'ข้อสอบเสมือนจริงสายปราบปราม ตามสัดส่วนข้อสอบ 150 ข้อ',
    blueprint: [
      { subjectId: 'aptitude', subjectName: 'คณิตศาสตร์', questionCount: 30 },
      { subjectId: 'thai', subjectName: 'ภาษาไทย', questionCount: 25 },
      { subjectId: 'it', subjectName: 'คอมพิวเตอร์', questionCount: 25 },
      { subjectId: 'english', subjectName: 'ภาษาอังกฤษ', questionCount: 30 },
      { subjectId: 'law', subjectName: 'กฎหมาย', questionCount: 20 },
      { subjectId: 'social', subjectName: 'สังคม', questionCount: 20 },
    ],
  },
]);

export function getMockExamTrack(trackId) {
  return MOCK_EXAM_TRACKS.find((track) => track.id === trackId) || null;
}

export function isMockExamTrack(trackId) {
  return Boolean(getMockExamTrack(trackId));
}
