'use client';

import { useMemo } from 'react';
import { useExamCatalog } from '@/lib/useExamCatalog';

/**
 * รายชื่อวิชาที่แสดงบนหน้าผู้เรียน — ยึด "ฐานข้อมูล" เป็นความจริงเพียงแหล่งเดียว
 *
 * ห้าม fallback ไป lib/subjects.js ที่ hardcode ไว้ตั้งแต่ยังไม่มีหลังบ้าน เพราะจะทำให้
 * ชื่อ/คำอธิบายที่แอดมินแก้ไม่มีผล และวิชาที่ถูกลบไปแล้วยังโผล่เป็นการ์ดผี
 * ถ้าแอดมินยังไม่ได้กรอกคำอธิบาย ให้เป็นค่าว่างไปตามจริง จะได้รู้ว่าต้องไปเติมที่หลังบ้าน
 *
 * @param {Array|null|undefined} catalogSubjects แถวจาก /api/exam-catalog
 * @returns {Array<{id:string,name:string,description:string,shortName:string}>}
 */
export function resolveSubjects(catalogSubjects) {
  if (!Array.isArray(catalogSubjects) || catalogSubjects.length === 0) return [];

  return catalogSubjects.map((row) => ({
    id: row.id,
    name: row.name || row.id,
    description: row.description || '',
    shortName: row.short_name || row.name || row.id,
  }));
}

/**
 * แปลงแถวหัวข้อจาก /api/exam-catalog ให้อยู่ในรูปที่ UI ใช้
 * id ใช้ legacy_id ก่อนเพราะสถิติ/ประวัติเก่าอ้างด้วยค่านั้น แต่เก็บ rowId (uuid) ไว้ค้นด้วย
 */
function resolveTopics(catalogTopics) {
  if (!Array.isArray(catalogTopics)) return [];
  return catalogTopics.map((row) => ({
    id: row.legacy_id || row.id,
    rowId: row.id,
    subjectId: row.subject_id,
    name: row.name,
    description: row.description || '',
  }));
}

/**
 * ฮุคกลางของ catalog — คืนทั้งวิชาและหัวข้อจากฐานข้อมูลด้วยการเรียก API ครั้งเดียว
 * ใช้ตัวนี้เมื่อหน้าต้องการทั้งสองอย่าง จะได้ไม่ยิง /api/exam-catalog ซ้ำสองรอบ
 */
export function useCatalog() {
  const { data, loading } = useExamCatalog('practice');
  const subjects = useMemo(() => resolveSubjects(data?.subjects), [data]);
  const topics = useMemo(() => resolveTopics(data?.topics), [data]);
  // ระหว่างโหลดจะได้อาร์เรย์ว่าง หน้าที่เรียกต้องเผื่อกรณีหาไม่เจอเสมอ
  const findSubject = useMemo(
    () => (id) => subjects.find((item) => item.id === id) || null,
    [subjects],
  );
  // รับได้ทั้ง legacy_id และ uuid เพราะข้อมูลเก่ากับใหม่อ้างคนละแบบ
  const findTopic = useMemo(
    () => (key) => (key ? topics.find((item) => item.id === key || item.rowId === key) || null : null),
    [topics],
  );
  return { subjects, topics, loading, findSubject, findTopic };
}

/**
 * ฮุคสำหรับหน้าที่ต้องการแค่ "รายชื่อวิชาตามฐานข้อมูล" โดยไม่ต้องยุ่งกับ catalog ทั้งก้อน
 * @returns {{subjects: Array, loading: boolean, findSubject: (id: string) => object|null}}
 */
export function useSubjects() {
  const { subjects, loading, findSubject } = useCatalog();
  return { subjects, loading, findSubject };
}
