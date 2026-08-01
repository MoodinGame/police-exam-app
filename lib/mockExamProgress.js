const KEY = 'policeExam:mockAttempts';

function readAttempts() {
  if (typeof window === 'undefined') return [];

  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function saveMockAttempt(attempt) {
  if (typeof window === 'undefined') return;

  try {
    const nextAttempt = { ...attempt, completedAt: new Date().toISOString() };
    const previousAttempts = readAttempts().filter((item) => item.examId !== attempt.examId);
    window.localStorage.setItem(KEY, JSON.stringify([nextAttempt, ...previousAttempts].slice(0, 30)));
  } catch {
    // Progress is an enhancement. The submitted result still remains usable.
  }
}

export function getLatestMockAttempts() {
  return readAttempts().reduce((latest, attempt) => {
    if (!latest[attempt.examId]) latest[attempt.examId] = attempt;
    return latest;
  }, {});
}
