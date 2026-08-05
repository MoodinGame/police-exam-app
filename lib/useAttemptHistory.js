'use client';

import { useEffect, useState } from 'react';

// Builds the "พัฒนาการของคุณ" sparkline from the caller's own attempt history.
// setId narrows to one exam set (Mock Exam); subjectId/topicId narrow to a
// practice scope instead, since Random Quiz and Practice attempts share a set.
export function useAttemptHistory({ bank, setId = null, subjectId = null, topicId = null, limit = 20, maxPoints = 6 }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!bank) {
      setHistory(null);
      return undefined;
    }
    let active = true;

    async function load() {
      try {
        const params = new URLSearchParams({ bank, limit: String(limit) });
        const response = await fetch(`/api/attempts?${params.toString()}`, { cache: 'no-store' });
        const result = await response.json();
        if (!active) return;
        if (!response.ok) {
          setHistory(null);
          return;
        }
        const matched = (result.attempts || []).filter((attempt) => {
          if (setId) return attempt.set_id === setId;
          if (subjectId && attempt.subject_id !== subjectId) return false;
          if (topicId && attempt.topic_id !== topicId) return false;
          return true;
        });
        const recent = matched.slice(0, maxPoints).reverse();
        if (recent.length < 2) {
          setHistory([]);
          return;
        }
        setHistory(recent.map((attempt, index) => ({
          label: index === recent.length - 1 ? 'ล่าสุด' : `ครั้งที่ ${index + 1}`,
          pct: attempt.total_questions ? Math.round((attempt.correct_answers / attempt.total_questions) * 100) : 0,
        })));
      } catch {
        if (active) setHistory(null);
      }
    }

    load();
    return () => { active = false; };
  }, [bank, setId, subjectId, topicId, limit, maxPoints]);

  return history;
}
