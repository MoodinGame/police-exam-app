'use client';

import { useEffect, useState } from 'react';

export function useExamCatalog(bank = 'practice', subjectId = null) {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ bank });
    if (subjectId) params.set('subject', subjectId);

    fetch(`/api/exam-catalog?${params.toString()}`, { cache: 'no-store' })
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (!active) return;
        setState({ loading: false, data: response.ok ? result : null, error: response.ok ? null : result.error || 'ไม่สามารถโหลดคลังข้อสอบได้' });
      })
      .catch(() => {
        if (active) setState({ loading: false, data: null, error: 'ไม่สามารถโหลดคลังข้อสอบได้' });
      });

    return () => { active = false; };
  }, [bank, subjectId]);

  return state;
}
