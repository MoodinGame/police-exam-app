'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * ดึงสถิติการทำข้อสอบจากฐานข้อมูล (exam_attempts) เป็นแหล่งข้อมูลจริงแหล่งเดียว
 *
 * เดิมหน้าแบบฝึกหัดอ่านความก้าวหน้าจาก localStorage ซึ่งผูกกับเครื่อง ไม่ sync ข้ามอุปกรณ์
 * และล้างจากฝั่งแอดมินไม่ได้ จึงย้ายมาอ่านจาก /api/stats แทน
 */
export function useProgressStats() {
  const [state, setState] = useState({ loading: true, stats: null });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch('/api/stats', { cache: 'no-store' });
        if (!response.ok) throw new Error('stats unavailable');
        const stats = await response.json();
        if (active) setState({ loading: false, stats });
      } catch {
        // ยังไม่ได้ล็อกอินหรือโหลดไม่สำเร็จ — ถือว่ายังไม่มีสถิติ ดีกว่าย้อนไปอ่านค่าเก่าในเครื่อง
        if (active) setState({ loading: false, stats: null });
      }
    })();
    return () => { active = false; };
  }, []);

  // แปลงเป็น map ให้การ์ดหัวข้อ lookup ได้ตรง ๆ โดยคีย์ด้วย legacyId ซึ่งตรงกับ topic.id ที่หน้าบ้านใช้
  const topicProgress = useMemo(() => {
    const map = {};
    for (const topic of state.stats?.topicStats || []) {
      const key = topic.legacyId || topic.id;
      if (!key || !topic.lastTotal) continue;
      map[key] = { score: topic.lastScore, total: topic.lastTotal, pct: topic.pct, sessions: topic.sessions, completedAt: topic.lastAt };
    }
    return map;
  }, [state.stats]);

  return { loading: state.loading, stats: state.stats, topicProgress };
}
