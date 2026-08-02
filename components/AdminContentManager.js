'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  BookOpenCheck,
  CircleAlert,
  ClipboardList,
  Database,
  Eye,
  EyeOff,
  FileJson,
  FilePlus2,
  Layers3,
  LayoutDashboard,
  LoaderCircle,
  Megaphone,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { confirmArchiveQuestion, confirmArchiveTopic, confirmDeleteAnnouncement, confirmDeleteSet } from '@/lib/sweetAlert';
import { getMockExamTrack } from '@/lib/mockExamTracks';
import { parseQuestionsText } from '@/lib/parseQuestionText';

const EMPTY_TOPIC = { id: '', subjectId: '', groupId: '', name: '', description: '', isActive: true };
const EMPTY_TOPIC_GROUP = { id: '', subjectId: '', name: '', description: '', isActive: true };
const EMPTY_SET = {
  id: '',
  bank: 'practice',
  trackId: '',
  title: '',
  slug: '',
  description: '',
  subjectId: '',
  topicId: '',
  durationMinutes: '',
  difficulty: 'medium',
  isFree: false,
  status: 'draft',
};
const EMPTY_QUESTION = {
  id: '',
  bank: 'practice',
  trackId: '',
  subjectId: '',
  topicId: '',
  setId: '',
  stem: '',
  choices: ['', '', '', ''],
  correctChoice: 'A',
  explanation: '',
  sourceReference: '',
  difficulty: 'medium',
  isActive: true,
  assignedSets: [],
};
const EMPTY_ANNOUNCEMENT = {
  id: '',
  title: '',
  summary: '',
  body: '',
  tone: 'info',
  audience: 'all',
  showOnLogin: false,
  isPublished: false,
  startsAt: '',
  endsAt: '',
};

const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10';

export default function AdminContentManager({ bank, showSharedTabs = true, mockPoolOnly = false }) {
  const [trackId, setTrackId] = useState('');
  const trackAutoSelected = useRef(false);

  const [content, setContent] = useState({ subjects: [], topics: [], topicGroups: [], questions: [], sets: [], announcements: [], tracks: [], trackBlueprints: [], questionCounts: [] });
  const selectedTrack = (content.tracks || []).find((item) => item.id === trackId) || null;

  const emptyQuestion = () => ({ ...EMPTY_QUESTION, bank, trackId: bank === 'mock' ? trackId : '' });
  const emptySet = () => ({
    ...EMPTY_SET,
    bank,
    trackId: bank === 'mock' ? trackId : '',
    durationMinutes: bank === 'mock' && selectedTrack ? String(selectedTrack.duration_minutes) : '',
  });

  const [tab, setTab] = useState(mockPoolOnly ? 'sets' : showSharedTabs ? 'overview' : 'questions');
  const [question, setQuestion] = useState(emptyQuestion);
  const [topic, setTopic] = useState(EMPTY_TOPIC);
  const [topicGroup, setTopicGroup] = useState(EMPTY_TOPIC_GROUP);
  const [examSet, setExamSet] = useState(emptySet);
  const [announcement, setAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [accessError, setAccessError] = useState('');
  const [readinessExpanded, setReadinessExpanded] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState('');
  const [questionTopicFilter, setQuestionTopicFilter] = useState('');
  const [questionStatusFilter, setQuestionStatusFilter] = useState('all');

  const [questionServerResults, setQuestionServerResults] = useState(null);
  const [questionServerLoading, setQuestionServerLoading] = useState(false);

  const changeQuestionSubjectFilter = (subjectId) => {
    setQuestionSubjectFilter(subjectId);
    setQuestionTopicFilter('');
  };

  // รายการ "ข้อสอบล่าสุด" ปกติดึงแค่ 80 ข้อ ไม่พอสำหรับค้นหาข้อสอบเก่าในหมวดย่อยที่มีมานาน
  // เมื่อกรองตามวิชา/หมวดย่อย จึงยิงคำขอแยกที่ดึงเฉพาะขอบเขตนั้นแบบไม่จำกัดที่ 80 ข้อ
  const refreshFilteredQuestions = async () => {
    if (!questionSubjectFilter && !questionTopicFilter) {
      setQuestionServerResults(null);
      return;
    }
    setQuestionServerLoading(true);
    try {
      const params = new URLSearchParams();
      if (questionSubjectFilter) params.set('subjectId', questionSubjectFilter);
      if (questionTopicFilter) params.set('topicId', questionTopicFilter);
      const response = await fetch(`/api/admin/content?${params.toString()}`, { cache: 'no-store' });
      const result = await response.json();
      if (response.ok) setQuestionServerResults(result.questions || []);
    } catch {
      // เก็บผลลัพธ์เดิมไว้ถ้าโหลดไม่สำเร็จ ดีกว่าล้างรายการที่กำลังดูอยู่
    } finally {
      setQuestionServerLoading(false);
    }
  };

  useEffect(() => { refreshFilteredQuestions(); }, [questionSubjectFilter, questionTopicFilter]);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/content', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) {
        setAccessError(result.error || 'ไม่สามารถเข้าถึงข้อมูลคลังข้อสอบได้');
        return;
      }
      setContent({
        subjects: result.subjects || [],
        topics: result.topics || [],
        topicGroups: result.topicGroups || [],
        questions: result.questions || [],
        sets: result.sets || [],
        announcements: result.announcements || [],
        tracks: result.tracks || [],
        trackBlueprints: result.trackBlueprints || [],
        questionCounts: result.questionCounts || [],
      });
      setAccessError('');
    } catch (loadError) {
      setError(loadError.message || 'โหลดข้อมูลหลังบ้านไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // เลือกสายงานแรกที่เปิดใช้งานให้อัตโนมัติครั้งเดียวตอนโหลดข้อมูลสำเร็จ ไม่เลือกซ้ำทุกครั้งที่ refresh
  useEffect(() => {
    if (bank !== 'mock' || trackAutoSelected.current || !content.tracks.length) return;
    const firstTrack = content.tracks.find((item) => item.is_active) || content.tracks[0];
    if (firstTrack) {
      setTrackId(firstTrack.id);
      trackAutoSelected.current = true;
    }
  }, [bank, content.tracks]);

  // สลับสายงานแล้วล้างฟอร์มที่กำลังกรอกไว้ เพราะเป็นคนละบริบทกันทั้งวิชาและจำนวนข้อที่ต้องออก
  useEffect(() => {
    if (bank !== 'mock') return;
    setQuestion(emptyQuestion());
    setExamSet(emptySet());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  const topicOptions = useMemo(
    () => content.topics.filter((item) => item.subject_id === question.subjectId && item.is_active),
    [content.topics, question.subjectId],
  );
  const setTopicOptions = useMemo(
    () => content.topics.filter((item) => item.subject_id === examSet.subjectId && item.is_active),
    [content.topics, examSet.subjectId],
  );
  const setsForQuestion = useMemo(
    () => content.sets.filter((item) => item.bank === bank && item.subject_id === question.subjectId && item.status !== 'archived'),
    [content.sets, bank, question.subjectId],
  );
  const bankQuestions = useMemo(
    () => content.questions.filter((item) => item.bank === bank && (bank !== 'mock' || item.track_id === (trackId || null))),
    [content.questions, bank, trackId],
  );
  // ใช้คลังฉบับเต็ม (ไม่จำกัดที่ 80 ข้อ) สำหรับตัวเลขสถิติ เพราะรายการด้านบนโหลดแค่บางส่วน
  const bankQuestionCounts = useMemo(
    () => (content.questionCounts || []).filter((item) => {
      if (mockPoolOnly) return item.bank === 'practice';
      return item.bank === bank && (bank !== 'mock' || item.track_id === (trackId || null));
    }),
    [content.questionCounts, bank, trackId, mockPoolOnly],
  );
  const activeQuestions = bankQuestionCounts.filter((item) => item.is_active).length;
  const bankSets = useMemo(
    () => content.sets.filter((item) => item.bank === bank && (bank !== 'mock' || item.track_id === (trackId || null))),
    [content.sets, bank, trackId],
  );
  const setsCount = bankSets.filter((item) => item.status !== 'archived').length;
  const trackBlueprintRows = useMemo(
    () => (content.trackBlueprints || []).filter((row) => row.track_id === trackId),
    [content.trackBlueprints, trackId],
  );
  const trackReadiness = useMemo(() => trackBlueprintRows.map((row) => {
    const subject = content.subjects.find((item) => item.id === row.subject_id);
    const actual = bankQuestionCounts.filter((item) => item.subject_id === row.subject_id && item.is_active).length;
    return { subjectId: row.subject_id, subjectName: subject?.name || row.subject_id, required: row.question_count, actual };
  }), [trackBlueprintRows, content.subjects, bankQuestionCounts]);
  const trackTotalRequired = trackBlueprintRows.reduce((sum, row) => sum + row.question_count, 0);
  const trackTotalActual = trackReadiness.reduce((sum, row) => sum + Math.min(row.actual, row.required), 0);
  const isTrackReady = trackReadiness.length > 0 && trackReadiness.every((row) => row.actual >= row.required);
  // จำกัดรายวิชาให้เลือกได้เฉพาะที่อยู่ในโครงสร้างของสายงานที่เลือก กันใส่ผิดวิชาโดยไม่ตั้งใจ
  const subjectsForBank = useMemo(() => {
    if (bank !== 'mock' || trackBlueprintRows.length === 0) return content.subjects;
    const allowed = new Set(trackBlueprintRows.map((row) => row.subject_id));
    return content.subjects.filter((item) => allowed.has(item.id));
  }, [bank, trackBlueprintRows, content.subjects]);
  const questionTopicFilterOptions = useMemo(
    () => content.topics.filter((item) => !questionSubjectFilter || item.subject_id === questionSubjectFilter),
    [content.topics, questionSubjectFilter],
  );
  // เมื่อกรองตามวิชา/หมวดย่อย ใช้ผลลัพธ์จากคำขอแยกที่ไม่ถูกจำกัดที่ 80 ข้อ แทนรายการล่าสุดปกติ
  const questionListSource = useMemo(() => {
    if (questionServerResults === null) return bankQuestions;
    return questionServerResults.filter((item) => item.bank === bank && (bank !== 'mock' || item.track_id === (trackId || null)));
  }, [questionServerResults, bankQuestions, bank, trackId]);
  const filteredQuestions = useMemo(() => {
    const term = questionSearch.trim().toLowerCase();
    return questionListSource.filter((item) => {
      if (questionSubjectFilter && item.subject_id !== questionSubjectFilter) return false;
      if (questionTopicFilter && item.topic_id !== questionTopicFilter) return false;
      if (questionStatusFilter === 'active' && !item.is_active) return false;
      if (questionStatusFilter === 'archived' && item.is_active) return false;
      if (term && !(item.stem || '').toLowerCase().includes(term)) return false;
      return true;
    });
  }, [questionListSource, questionSearch, questionSubjectFilter, questionTopicFilter, questionStatusFilter]);

  const request = async (method, body) => {
    const response = await fetch('/api/admin/content', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'บันทึกข้อมูลไม่สำเร็จ');
    return result;
  };

  const saveTopic = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isEditing = Boolean(topic.id);
      await request(isEditing ? 'PATCH' : 'POST', { type: 'topic', ...topic });
      setTopic(EMPTY_TOPIC);
      setNotice(isEditing ? 'บันทึกการแก้ไขหมวดย่อยแล้ว' : 'เพิ่มหมวดย่อยเรียบร้อยแล้ว');
      await refresh();
    } catch (saveError) {
      setError(saveError.message || (topic.id ? 'แก้ไขหมวดย่อยไม่สำเร็จ' : 'เพิ่มหมวดย่อยไม่สำเร็จ'));
    } finally {
      setSaving(false);
    }
  };

  const editTopic = (item) => {
    setTopic({ id: item.id, subjectId: item.subject_id, groupId: item.group_id || '', name: item.name || '', description: item.description || '', isActive: item.is_active });
    setTab('topics');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const archiveTopicHandler = async (item) => {
    if (!await confirmArchiveTopic()) return;
    setSaving(true);
    setError('');
    try {
      await request('DELETE', { type: 'topic', id: item.id });
      setNotice('ปิดใช้งานหมวดย่อยแล้ว');
      await refresh();
    } catch (archiveError) {
      setError(archiveError.message || 'ปิดใช้งานหมวดย่อยไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const reactivateTopic = async (item) => {
    setSaving(true);
    setError('');
    try {
      await request('PATCH', { type: 'topic', id: item.id, subjectId: item.subject_id, groupId: item.group_id || '', name: item.name, description: item.description || '', isActive: true });
      setNotice('เปิดใช้งานหมวดย่อยแล้ว');
      await refresh();
    } catch (reactivateError) {
      setError(reactivateError.message || 'เปิดใช้งานหมวดย่อยไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const saveTopicGroup = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isEditing = Boolean(topicGroup.id);
      await request(isEditing ? 'PATCH' : 'POST', { type: 'topic-group', ...topicGroup });
      setTopicGroup(EMPTY_TOPIC_GROUP);
      setNotice(isEditing ? 'บันทึกการแก้ไขหมวดหลักแล้ว' : 'เพิ่มหมวดหลักเรียบร้อยแล้ว');
      await refresh();
    } catch (saveError) {
      setError(saveError.message || 'บันทึกหมวดหลักไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const editTopicGroup = (item) => {
    setTopicGroup({ id: item.id, subjectId: item.subject_id, name: item.name || '', description: item.description || '', isActive: item.is_active });
    setTab('topics');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const archiveTopicGroup = async (item) => {
    setSaving(true);
    setError('');
    try {
      await request('DELETE', { type: 'topic-group', id: item.id });
      setNotice('ปิดใช้งานหมวดหลักแล้ว หัวข้อเดิมยังอยู่และย้ายไปหมวดอื่นได้');
      await refresh();
    } catch (archiveError) {
      setError(archiveError.message || 'ปิดใช้งานหมวดหลักไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const reactivateTopicGroup = async (item) => {
    setSaving(true);
    setError('');
    try {
      await request('PATCH', { type: 'topic-group', id: item.id, subjectId: item.subject_id, name: item.name, description: item.description || '', isActive: true });
      setNotice('เปิดใช้งานหมวดหลักแล้ว');
      await refresh();
    } catch (reactivateError) {
      setError(reactivateError.message || 'เปิดใช้งานหมวดหลักไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const importTopics = async () => {
    setImporting(true);
    setError('');
    try {
      const result = await request('POST', { type: 'import-topics' });
      setNotice(`นำเข้าหมวดย่อยเดิม ${result.imported || 0} รายการเรียบร้อยแล้ว`);
      await refresh();
    } catch (importError) {
      setError(importError.message || 'นำเข้าหมวดย่อยไม่สำเร็จ');
    } finally {
      setImporting(false);
    }
  };

  const saveSet = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isEditing = Boolean(examSet.id);
      await request(isEditing ? 'PATCH' : 'POST', { type: 'set', ...examSet });
      setExamSet(emptySet());
      setNotice(isEditing ? 'บันทึกการแก้ไขชุดข้อสอบแล้ว' : 'สร้างชุดข้อสอบแล้ว ต่อไปเพิ่มคำถามเข้าสู่ชุดนี้ได้เลย');
      await refresh();
    } catch (saveError) {
      setError(saveError.message || (examSet.id ? 'แก้ไขชุดข้อสอบไม่สำเร็จ' : 'สร้างชุดข้อสอบไม่สำเร็จ'));
    } finally {
      setSaving(false);
    }
  };

  const editSet = (item) => {
    setExamSet({
      id: item.id,
      bank: item.bank,
      trackId: item.track_id || '',
      title: item.title || '',
      slug: item.slug || '',
      description: item.description || '',
      subjectId: item.subject_id || '',
      topicId: item.topic_id || '',
      durationMinutes: item.duration_minutes || '',
      difficulty: item.difficulty || 'medium',
      isFree: item.is_free,
      status: item.status || 'draft',
    });
    setTab('sets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePublishSet = async (item) => {
    setSaving(true);
    setError('');
    try {
      await request('PATCH', {
        type: 'set',
        id: item.id,
        bank: item.bank,
        trackId: item.track_id || '',
        title: item.title,
        slug: item.slug,
        description: item.description || '',
        subjectId: item.subject_id || '',
        topicId: item.topic_id || '',
        durationMinutes: item.duration_minutes || '',
        difficulty: item.difficulty || 'medium',
        isFree: item.is_free,
        status: item.status === 'published' ? 'draft' : 'published',
      });
      setNotice(item.status === 'published' ? 'ยกเลิกการเผยแพร่ชุดข้อสอบแล้ว' : 'เผยแพร่ชุดข้อสอบแล้ว');
      await refresh();
    } catch (toggleError) {
      setError(toggleError.message || 'อัปเดตสถานะชุดข้อสอบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const deleteSetHandler = async (item) => {
    if (!await confirmDeleteSet(item.title)) return;
    setSaving(true);
    setError('');
    try {
      await request('DELETE', { type: 'set', id: item.id });
      setNotice('ลบชุดข้อสอบแล้ว');
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message || 'ลบชุดข้อสอบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const saveQuestion = async (event) => {
    event.preventDefault();
    const hasEmptyChoice = question.choices.some((choice) => !choice.trim());
    if (question.choices.length < 2 || hasEmptyChoice) {
      setError('กรุณาระบุตัวเลือกคำตอบอย่างน้อย 2 ข้อ และอย่าเว้นตัวเลือกว่าง');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const isEditing = Boolean(question.id);
      await request(isEditing ? 'PATCH' : 'POST', { type: 'question', ...question });
      // เพิ่มข้อใหม่ต่อเนื่อง: คงวิชา/หมวดย่อย/ชุด/ความยากไว้ ไม่ต้องเลือกซ้ำทุกข้อ ล้างเฉพาะเนื้อโจทย์กับตัวเลือก
      setQuestion((current) => isEditing
        ? emptyQuestion()
        : { ...emptyQuestion(), subjectId: current.subjectId, topicId: current.topicId, setId: current.setId, difficulty: current.difficulty });
      setNotice(isEditing ? 'แก้ไขข้อสอบเรียบร้อยแล้ว' : 'เพิ่มข้อสอบเข้าสู่คลังเรียบร้อยแล้ว พิมพ์ข้อถัดไปได้เลย');
      await Promise.all([refresh(), refreshFilteredQuestions()]);
    } catch (saveError) {
      setError(saveError.message || 'บันทึกข้อสอบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const submitBulkItems = async (items, { clearJson = false } = {}) => {
    setError('');
    setBulkResult(null);
    setBulkImporting(true);
    try {
      const result = await request('POST', { type: 'bulk-questions', bank, trackId: bank === 'mock' ? trackId : undefined, items });
      setBulkResult(result);
      if (result.insertedCount > 0) {
        setNotice(`นำเข้าข้อสอบสำเร็จ ${result.insertedCount} ข้อ${result.failedCount ? ` (ข้ามไป ${result.failedCount} ข้อ ดูรายละเอียดด้านล่าง)` : ''}`);
        if (clearJson) setBulkJson('');
        await Promise.all([refresh(), refreshFilteredQuestions()]);
      } else {
        setError('ไม่มีข้อสอบข้อไหนนำเข้าสำเร็จเลย ดูรายละเอียดด้านล่าง');
      }
    } catch (bulkError) {
      setError(bulkError.message || 'นำเข้าข้อสอบไม่สำเร็จ');
    } finally {
      setBulkImporting(false);
    }
  };

  const importBulkQuestions = async () => {
    setError('');
    let items;
    try {
      const parsed = JSON.parse(bulkJson);
      items = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(items) || items.length === 0) throw new Error('empty');
    } catch {
      setError('รูปแบบ JSON ไม่ถูกต้อง กรุณาวางเป็น array ของข้อสอบ เช่น [ { "subjectId": "...", "stem": "...", ... } ]');
      return;
    }
    await submitBulkItems(items, { clearJson: true });
  };

  const importTextQuestions = async (items) => {
    await submitBulkItems(items);
  };

  const saveAnnouncement = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isEditing = Boolean(announcement.id);
      await request(isEditing ? 'PATCH' : 'POST', { type: 'announcement', ...announcement });
      setAnnouncement(EMPTY_ANNOUNCEMENT);
      setNotice(isEditing ? 'บันทึกการแก้ไขประกาศแล้ว' : 'สร้างประกาศแล้ว');
      await refresh();
    } catch (saveError) {
      setError(saveError.message || 'บันทึกประกาศไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const editAnnouncement = (item) => {
    setAnnouncement({
      id: item.id,
      title: item.title || '',
      summary: item.summary || '',
      body: item.body || '',
      tone: item.tone || 'info',
      audience: item.audience || 'all',
      showOnLogin: item.show_on_login,
      isPublished: item.is_published,
      startsAt: dateTimeInputValue(item.starts_at),
      endsAt: dateTimeInputValue(item.ends_at),
    });
    setTab('announcements');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAnnouncement = async (item) => {
    setSaving(true);
    setError('');
    try {
      await request('PATCH', {
        type: 'announcement',
        id: item.id,
        title: item.title,
        summary: item.summary,
        body: item.body || '',
        tone: item.tone,
        audience: item.audience,
        showOnLogin: item.show_on_login,
        isPublished: !item.is_published,
        startsAt: dateTimeInputValue(item.starts_at),
        endsAt: dateTimeInputValue(item.ends_at),
      });
      setNotice(item.is_published ? 'หยุดเผยแพร่ประกาศแล้ว' : 'เผยแพร่ประกาศแล้ว');
      await refresh();
    } catch (toggleError) {
      setError(toggleError.message || 'อัปเดตสถานะประกาศไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const editQuestion = (item) => {
    const assignedSets = (item.exam_set_questions || []).map(({ exam_sets: examSetItem }) => examSetItem?.title).filter(Boolean);
    setQuestion({
      id: item.id,
      bank: item.bank,
      subjectId: item.subject_id,
      topicId: item.topic_id || '',
      setId: '',
      stem: item.stem || '',
      choices: (item.choices || []).map((choice) => choice.text).slice(0, 6),
      correctChoice: item.correct_choice || 'A',
      explanation: item.explanation || '',
      sourceReference: item.source_reference || '',
      difficulty: item.difficulty || 'medium',
      isActive: item.is_active,
      assignedSets,
    });
    setTab('questions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const archiveQuestion = async (id) => {
    if (!await confirmArchiveQuestion()) return;
    setSaving(true);
    setError('');
    try {
      await request('DELETE', { type: 'question', id });
      setNotice('ปิดใช้งานข้อสอบแล้ว ข้อมูลยังอยู่ในระบบและเปิดกลับได้ภายหลัง');
      await Promise.all([refresh(), refreshFilteredQuestions()]);
    } catch (archiveError) {
      setError(archiveError.message || 'ปิดใช้งานข้อสอบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const reactivateQuestion = async (item) => {
    setSaving(true);
    setError('');
    try {
      await request('PATCH', {
        type: 'question',
        id: item.id,
        bank: item.bank,
        subjectId: item.subject_id,
        topicId: item.topic_id || '',
        stem: item.stem,
        choices: (item.choices || []).map((choice) => choice.text),
        correctChoice: item.correct_choice,
        explanation: item.explanation || '',
        sourceReference: item.source_reference || '',
        difficulty: item.difficulty || 'medium',
        isActive: true,
      });
      setNotice('เปิดใช้งานข้อสอบแล้ว');
      await Promise.all([refresh(), refreshFilteredQuestions()]);
    } catch (reactivateError) {
      setError(reactivateError.message || 'เปิดใช้งานข้อสอบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnouncementHandler = async (item) => {
    if (!await confirmDeleteAnnouncement()) return;
    setSaving(true);
    setError('');
    try {
      await request('DELETE', { type: 'announcement', id: item.id });
      setNotice('ลบประกาศแล้ว');
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message || 'ลบประกาศไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (accessError) return <AccessDenied message={accessError} />;

  return (
    <div className="max-w-6xl">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-600">ADMIN · {bank === 'mock' ? 'MOCK EXAM' : 'แบบฝึกหัดรายวิชา'}</p>
          <h1 className="text-xl font-bold tracking-tight text-navy sm:text-2xl">{bank === 'mock' ? 'ตั้งค่า Mock Exam' : 'จัดการแบบฝึกหัดรายวิชา'}</h1>
          {mockPoolOnly && <p className="mt-1 text-sm text-graydark/60">Mock Exam จะสุ่มเฉพาะข้อสอบที่เปิดใช้จากคลังแบบฝึกหัดรายวิชา ตามสัดส่วนของสายงาน</p>}
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-700"><Sparkles size={14} />{mockPoolOnly ? 'ไม่ต้องเพิ่มคำถามใน Mock Exam' : 'จำนวนข้อของแต่ละชุดนับอัตโนมัติ'}</p>
      </header>

      {bank === 'mock' && (
        <div className="mb-4">
          <TrackPicker tracks={content.tracks} trackId={trackId} onSelect={setTrackId} />
        </div>
      )}

      {error && <Alert tone="error" message={error} onClose={() => setError('')} />}
      {notice && <Alert tone="success" message={notice} onClose={() => setNotice('')} />}

      <section className="mb-4 flex flex-wrap items-center gap-2">
        <StatChip icon={Database} label={mockPoolOnly ? 'ข้อสอบพร้อมสุ่มตามสัดส่วน' : 'ข้อสอบที่เปิดใช้'} value={mockPoolOnly ? trackTotalActual : activeQuestions} tone="cyan" />
        <StatChip icon={bank === 'mock' ? BookOpenCheck : ClipboardList} label="ชุดข้อสอบ" value={setsCount} tone="navy" />
        <StatChip icon={Tag} label="หมวดย่อย" value={content.topics.length} tone="amber" />
      </section>

      {bank === 'mock' && selectedTrack && (
        <TrackReadiness
          track={selectedTrack}
          rows={trackReadiness}
          totalActual={trackTotalActual}
          totalRequired={trackTotalRequired}
          isReady={isTrackReady}
          expanded={readinessExpanded}
          onToggle={() => setReadinessExpanded((current) => !current)}
        />
      )}

      {mockPoolOnly ? (
        <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700"><Database size={18} /></span><div><h2 className="font-bold text-navy">แหล่งข้อสอบของ Mock Exam</h2><p className="mt-0.5 text-sm text-graydark/65">เพิ่ม แก้ไข หรือปิดใช้ข้อสอบที่คลังแบบฝึกหัด ระบบจะอัปเดตความพร้อมของ Mock Exam ให้ทันที</p></div></div>
          <Link href="/admin" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90">ไปจัดการคลังแบบฝึกหัด</Link>
        </section>
      ) : (
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="เมนูจัดการคลังข้อสอบ">
          {showSharedTabs && <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={LayoutDashboard} label="ภาพรวม" />}
          <TabButton active={tab === 'questions'} onClick={() => setTab('questions')} icon={Database} label="คำถามในคลัง" />
          <TabButton active={tab === 'sets'} onClick={() => setTab('sets')} icon={Layers3} label="ชุดข้อสอบ" />
          {showSharedTabs && <TabButton active={tab === 'topics'} onClick={() => setTab('topics')} icon={Tag} label="หมวดวิชา" />}
          {showSharedTabs && <TabButton active={tab === 'announcements'} onClick={() => setTab('announcements')} icon={Sparkles} label="ประกาศ" />}
        </div>
      )}

      {loading ? <div className="h-96 animate-pulse rounded-3xl bg-slate-200/65" /> : null}
      {!loading && showSharedTabs && tab === 'overview' && (
        <AdminOverview
          activeQuestions={activeQuestions}
          setsCount={setsCount}
          topics={content.topics.length}
          announcements={content.announcements}
          onNavigate={setTab}
        />
      )}
      {!loading && !mockPoolOnly && tab === 'questions' && (
        <QuestionTab
          bank={bank}
          trackName={selectedTrack?.name}
          question={question}
          setQuestion={setQuestion}
          subjects={subjectsForBank}
          topics={topicOptions}
          allTopics={content.topics}
          sets={setsForQuestion}
          allSets={content.sets}
          questions={filteredQuestions}
          totalCount={questionListSource.length}
          filterLoading={questionServerLoading}
          saving={saving}
          onSubmit={saveQuestion}
          onCancel={() => setQuestion(emptyQuestion())}
          onEdit={editQuestion}
          onArchive={archiveQuestion}
          onReactivate={reactivateQuestion}
          search={questionSearch}
          onSearchChange={setQuestionSearch}
          subjectFilter={questionSubjectFilter}
          onSubjectFilterChange={changeQuestionSubjectFilter}
          topicFilter={questionTopicFilter}
          onTopicFilterChange={setQuestionTopicFilter}
          topicFilterOptions={questionTopicFilterOptions}
          statusFilter={questionStatusFilter}
          onStatusFilterChange={setQuestionStatusFilter}
          bulkJson={bulkJson}
          setBulkJson={setBulkJson}
           bulkImporting={bulkImporting}
           bulkResult={bulkResult}
           onBulkImport={importBulkQuestions}
           onTextImport={importTextQuestions}
         />
      )}
      {!loading && tab === 'sets' && (
        <SetTab
          bank={bank}
          track={selectedTrack}
          mockPoolOnly={mockPoolOnly}
          isTrackReady={isTrackReady}
          examSet={examSet}
          setExamSet={setExamSet}
          subjects={subjectsForBank}
          topics={setTopicOptions}
          sets={bankSets}
          saving={saving}
          onSubmit={saveSet}
          onCancel={() => setExamSet(emptySet())}
          onEdit={editSet}
          onTogglePublish={togglePublishSet}
          onDelete={deleteSetHandler}
        />
      )}
      {!loading && showSharedTabs && tab === 'topics' && (
        <TopicHierarchyTab
          topic={topic}
          setTopic={setTopic}
          topicGroup={topicGroup}
          setTopicGroup={setTopicGroup}
          subjects={content.subjects}
          topics={content.topics}
          topicGroups={content.topicGroups}
          saving={saving}
          importing={importing}
          onSubmit={saveTopic}
          onGroupSubmit={saveTopicGroup}
          onCancel={() => setTopic(EMPTY_TOPIC)}
          onGroupCancel={() => setTopicGroup(EMPTY_TOPIC_GROUP)}
          onImport={importTopics}
          onEdit={editTopic}
          onEditGroup={editTopicGroup}
          onArchive={archiveTopicHandler}
          onArchiveGroup={archiveTopicGroup}
          onReactivate={reactivateTopic}
          onReactivateGroup={reactivateTopicGroup}
        />
      )}
      {!loading && showSharedTabs && tab === 'announcements' && (
        <AnnouncementTab
          announcement={announcement}
          setAnnouncement={setAnnouncement}
          announcements={content.announcements}
          saving={saving}
          onSubmit={saveAnnouncement}
          onCancel={() => setAnnouncement(EMPTY_ANNOUNCEMENT)}
          onEdit={editAnnouncement}
          onToggle={toggleAnnouncement}
          onDelete={deleteAnnouncementHandler}
        />
      )}
    </div>
  );
}

function TrackPicker({ tracks, trackId, onSelect }) {
  const availableTracks = (tracks || []).filter((track) => track.is_active && getMockExamTrack(track.id));
  if (!availableTracks.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-graydark/55">
        ยังไม่พบสายงานในระบบ — รันไฟล์ migration สายงาน (exam_tracks) ใน Supabase ก่อน
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="เลือกสายงาน">
      {availableTracks.map((track) => {
        const active = trackId === track.id;
        return (
          <button
            key={track.id}
            type="button"
            onClick={() => onSelect(track.id)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${active ? 'bg-navy text-white shadow-sm' : 'border border-slate-200 bg-white text-graydark hover:border-cyan-300 hover:text-cyan-700'}`}
          >
            {track.name}
          </button>
        );
      })}
    </div>
  );
}

function TrackReadiness({ track, rows, totalActual, totalRequired, isReady, expanded, onToggle }) {
  const scope = getMockExamTrack(track.id);
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
          <span className="truncate text-sm font-semibold text-navy">ความพร้อมของ {track.name}</span>
          {rows.length > 0 && (
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${isReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {totalActual}/{totalRequired} ข้อ{isReady ? ' · พร้อม' : ''}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs font-semibold text-cyan-700">{expanded ? 'ซ่อนรายวิชา ▲' : 'ดูรายวิชา ▼'}</span>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
          <p className="mb-3 text-xs text-graydark/55">ต้องมีข้อสอบที่เปิดใช้ในคลังแบบฝึกหัดครบ {track.total_questions} ข้อตามสัดส่วนแต่ละวิชา ก่อนประกอบเป็นข้อสอบเสมือนจริงจับเวลา {track.duration_minutes} นาที{scope ? ` · เกณฑ์ผ่าน ${scope.passScore}/${scope.totalQuestions} คะแนน` : ''}</p>
          {rows.length === 0 ? (
            <p className="text-sm text-graydark/50">สายงานนี้ยังไม่ได้กำหนดโครงสร้างจำนวนข้อต่อวิชา</p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {rows.map((row) => {
                const met = row.actual >= row.required;
                return (
                  <div key={row.subjectId} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-navy">
                      <span>{row.subjectName}</span>
                      <span className={met ? 'text-emerald-600' : 'text-graydark/60'}>{row.actual}/{row.required} ข้อ</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full rounded-full ${met ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, Math.round((row.actual / row.required) * 100))}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function AdminOverview({ activeQuestions, setsCount, topics, announcements, onNavigate }) {
  const publishedAnnouncements = announcements.filter((item) => item.is_published).length;
  const steps = [
    { icon: Tag, title: '1. ตรวจสอบหัวข้อ', description: 'นำเข้าหรือเพิ่มหัวข้อย่อยให้ครบก่อนเริ่มสร้างข้อสอบ', action: 'จัดการหัวข้อ', tab: 'topics', count: `${topics} หัวข้อ` },
    { icon: Layers3, title: '2. สร้างชุดข้อสอบ', description: 'กำหนดวิชา ความยาก สถานะ และสิทธิ์ชุดฟรี', action: 'สร้างชุดข้อสอบ', tab: 'sets', count: `${setsCount} ชุด` },
    { icon: Database, title: '3. เพิ่มข้อสอบ', description: 'เพิ่มทีละข้อ หรือวางข้อความ/JSON เพื่อเพิ่มหลายข้อพร้อมกัน', action: 'ไปคลังข้อสอบ', tab: 'questions', count: `${activeQuestions} ข้อ` },
    { icon: Megaphone, title: '4. ประกาศข่าว', description: 'แจ้งผู้เรียนและเลือกแสดงป้ายตอนเข้าสู่ระบบได้', action: 'จัดการประกาศ', tab: 'announcements', count: `${publishedAnnouncements} เผยแพร่` },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-navy/10 bg-gradient-to-br from-navy via-[#283866] to-cyan-800 p-6 text-white shadow-[0_20px_45px_rgba(32,43,82,0.18)] sm:p-8">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"><Sparkles size={14} /> เริ่มต้นจัดการเนื้อหา</p>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">จัดเนื้อหาให้ผู้เรียนเห็นได้เป็นขั้นตอน</h2>
          <p className="mt-2 text-sm leading-6 text-slate-200 sm:text-base">เพิ่มหัวข้อ สร้างชุดข้อสอบ เพิ่มข้อสอบ แล้วเผยแพร่ชุดนั้น ผู้เรียนจะเห็นเฉพาะชุดที่เปิดใช้งานแล้ว</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => onNavigate('questions')} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-navy shadow-sm transition hover:-translate-y-0.5"><Plus size={17} /> เพิ่มข้อสอบใหม่</button>
          <button type="button" onClick={() => onNavigate('sets')} className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"><Layers3 size={17} /> สร้างชุดข้อสอบ</button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-navy">ทำตามลำดับนี้</h2><p className="mt-1 text-sm text-graydark/55">ลดความสับสนระหว่างหัวข้อ ชุดข้อสอบ และคลังข้อสอบ</p></div><span className="hidden rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 sm:block">Workflow สำหรับแอดมิน</span></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ icon: Icon, title, description, action, tab, count }) => <button key={tab} type="button" onClick={() => onNavigate(tab)} className="group min-h-48 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><span className="inline-flex rounded-xl bg-cyan-50 p-2.5 text-cyan-700"><Icon size={19} /></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-graydark">{count}</span></div><h3 className="mt-5 font-bold text-navy">{title}</h3><p className="mt-1 text-sm leading-5 text-graydark/60">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-700">{action} <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></span></button>)}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><CircleAlert size={19} /></span><div><h2 className="font-bold text-navy">ก่อนกดเผยแพร่</h2><p className="mt-1 text-sm leading-6 text-graydark/60">ตรวจว่าชุดข้อสอบมีข้อสอบอยู่จริง เลือกสถานะ “เผยแพร่” แล้วจึงเปิดให้ผู้เรียนใช้งาน หากต้องการให้สมาชิกฟรีทำได้ ให้ติ๊ก “ชุดฟรี” ตอนสร้างชุดข้อสอบ</p></div></div></article>
        <article className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-5"><p className="text-sm font-semibold text-cyan-800">คำแนะนำ</p><p className="mt-2 text-sm leading-6 text-cyan-900/75">นำเข้าหัวข้อเดิมเพียงครั้งเดียว จากนั้นเพิ่มข้อสอบผ่านฟอร์มหรือ JSON ได้เลย</p><button type="button" onClick={() => onNavigate('topics')} className="mt-4 text-sm font-bold text-cyan-800 hover:text-cyan-950">ไปจัดการหัวข้อ →</button></article>
      </section>
    </div>
  );
}

function QuestionTab({
  bank, trackName, question, setQuestion, subjects, topics, allTopics, sets, allSets, questions, totalCount, filterLoading, saving, onSubmit, onCancel, onEdit, onArchive, onReactivate,
  search, onSearchChange, subjectFilter, onSubjectFilterChange, topicFilter, onTopicFilterChange, topicFilterOptions, statusFilter, onStatusFilterChange,
  bulkJson, setBulkJson, bulkImporting, bulkResult, onBulkImport, onTextImport,
}) {
  const isEditing = Boolean(question.id);
  const setField = (key, value) => setQuestion((current) => ({ ...current, [key]: value }));
  const stemRef = useRef(null);
  const wasSaving = useRef(false);
  // หลังบันทึกข้อใหม่สำเร็จ (ไม่ใช่โหมดแก้ไข) ให้เคอร์เซอร์กลับไปที่ช่องโจทย์อัตโนมัติ พิมพ์ข้อถัดไปได้เลยโดยไม่ต้องใช้เมาส์
  useEffect(() => {
    if (wasSaving.current && !saving && !question.id && !question.stem) stemRef.current?.focus();
    wasSaving.current = saving;
  }, [saving, question.id, question.stem]);
  const changeSubject = (subjectId) => setQuestion((current) => ({ ...current, subjectId, topicId: '', setId: '' }));
  const updateChoice = (index, value) => setQuestion((current) => ({
    ...current,
    choices: current.choices.map((choice, choiceIndex) => choiceIndex === index ? value : choice),
  }));
  const addChoice = () => setQuestion((current) => current.choices.length >= 6 ? current : ({ ...current, choices: [...current.choices, ''] }));
  const removeChoice = (index) => setQuestion((current) => {
    if (current.choices.length <= 2) return current;
    const choices = current.choices.filter((_, choiceIndex) => choiceIndex !== index);
    const validChoiceIds = choices.map((_, choiceIndex) => String.fromCharCode(65 + choiceIndex));
    return { ...current, choices, correctChoice: validChoiceIds.includes(current.correctChoice) ? current.correctChoice : 'A' };
  });

  return <div className="space-y-7">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-bold text-navy">{isEditing ? 'แก้ไขข้อสอบ' : 'เพิ่มข้อสอบใหม่'}</h2><p className="mt-1 text-sm text-graydark/55">คำถามจะอยู่ในคลัง {bank === 'mock' ? 'Mock Exam' : 'แบบฝึกหัด'}{bank === 'mock' && trackName ? ` · ${trackName}` : ''} และเลือกเพิ่มเข้าชุดได้ทันที</p></div>
        {isEditing && <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-graydark hover:bg-slate-50">ยกเลิกการแก้ไข</button>}
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium text-graydark">วิชา
            <select required value={question.subjectId} onChange={(event) => changeSubject(event.target.value)} className={fieldClass}><option value="">เลือกวิชา</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          </label>
          <label className="text-sm font-medium text-graydark">หมวดย่อย
            <select value={question.topicId} onChange={(event) => setField('topicId', event.target.value)} className={fieldClass} disabled={!question.subjectId}><option value="">ไม่ระบุหมวดย่อย</option>{topics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          </label>
          <label className="text-sm font-medium text-graydark">ระดับความยาก
            <select value={question.difficulty} onChange={(event) => setField('difficulty', event.target.value)} className={fieldClass}><option value="easy">ง่าย</option><option value="medium">ปานกลาง</option><option value="hard">ยาก</option></select>
          </label>
        </div>

        {bank === 'mock' ? (
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 px-3 py-2.5 text-sm text-cyan-900">ระบบจะสุ่มข้อสอบวิชานี้เข้า Mock Exam ให้อัตโนมัติตามสัดส่วนของสายงาน ไม่ต้องเลือกชุดเอง — แค่ระบุวิชาและหมวดย่อยให้ครบก็พอ</div>
        ) : !isEditing ? <label className="block text-sm font-medium text-graydark">เพิ่มเข้าชุดข้อสอบ <span className="font-normal text-graydark/45">(เลือกได้)</span>
          <select value={question.setId} onChange={(event) => setField('setId', event.target.value)} className={fieldClass} disabled={!question.subjectId}><option value="">เก็บไว้ในคลังก่อน</option>{sets.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        </label> : <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">ชุดที่ใช้อยู่: {question.assignedSets.length ? question.assignedSets.join(', ') : 'ยังไม่ได้เพิ่มในชุดข้อสอบ'} <span className="text-amber-800/75">การย้ายระหว่างชุดจะเพิ่มในขั้นถัดไป เพื่อป้องกันข้อสอบหลุดจากชุดเดิม</span></div>}

        <label className="block text-sm font-medium text-graydark">โจทย์ข้อสอบ
          <textarea ref={stemRef} required value={question.stem} onChange={(event) => setField('stem', event.target.value)} rows={4} placeholder="พิมพ์โจทย์หรือสถานการณ์ของข้อสอบ" className={fieldClass} />
        </label>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-semibold text-navy">ตัวเลือกคำตอบ</h3><p className="text-xs text-graydark/55">ระบุ 2–6 ตัวเลือก และเลือกข้อที่ถูกต้อง</p></div><button type="button" onClick={addChoice} disabled={question.choices.length >= 6} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-700 disabled:opacity-40"><Plus size={15} /> เพิ่มตัวเลือก</button></div>
          <div className="grid gap-2 lg:grid-cols-2">{question.choices.map((choice, index) => {
            const id = String.fromCharCode(65 + index);
            return <div key={`${id}-${index}`} className="flex items-center gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white">{id}</span><input required value={choice} onChange={(event) => updateChoice(index, event.target.value)} placeholder={`ตัวเลือก ${id}`} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500" />{question.choices.length > 2 && <button type="button" onClick={() => removeChoice(index)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label={`ลบตัวเลือก ${id}`}>×</button>}</div>;
          })}</div>
          <label className="mt-3 block text-sm font-medium text-graydark">คำตอบที่ถูกต้อง
            <select value={question.correctChoice} onChange={(event) => setField('correctChoice', event.target.value)} className={`${fieldClass} max-w-xs`}>{question.choices.map((_, index) => { const id = String.fromCharCode(65 + index); return <option key={id} value={id}>ข้อ {id}</option>; })}</select>
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.55fr]">
          <label className="text-sm font-medium text-graydark">เฉลยและคำอธิบาย <span className="font-normal text-graydark/45">(แนะนำให้ใส่)</span>
            <textarea value={question.explanation} onChange={(event) => setField('explanation', event.target.value)} rows={3} placeholder="อธิบายเหตุผลของคำตอบ" className={fieldClass} />
          </label>
          <label className="text-sm font-medium text-graydark">ที่มา / หมายเหตุ
            <input value={question.sourceReference} onChange={(event) => setField('sourceReference', event.target.value)} placeholder="เช่น แนวข้อสอบปี ..." className={fieldClass} />
            <span className="mt-2 flex items-center gap-2 text-xs font-normal text-graydark/65"><input type="checkbox" checked={question.isActive} onChange={(event) => setField('isActive', event.target.checked)} /> เปิดให้ระบบนำไปใช้งาน</span>
          </label>
        </div>
        <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-navy/15 transition hover:-translate-y-0.5 hover:bg-[#152856] disabled:cursor-not-allowed disabled:opacity-60"><Save size={17} />{saving ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มข้อสอบเข้าคลัง'}</button>
      </form>
    </section>

    <BulkImportPanel
      bank={bank}
      subjects={subjects}
      allTopics={allTopics}
      allSets={allSets}
      bulkJson={bulkJson}
      setBulkJson={setBulkJson}
      bulkImporting={bulkImporting}
      bulkResult={bulkResult}
      onBulkImport={onBulkImport}
      onTextImport={onTextImport}
    />

    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-navy">ข้อสอบล่าสุด</h2><p className="text-sm text-graydark/55">{subjectFilter || topicFilter ? 'กำลังกรองตามวิชา/หมวดย่อย — ดึงข้อมูลครบทั้งหมวดโดยไม่จำกัดที่ 80 ข้อ' : 'แสดงสูงสุด 80 ข้อล่าสุด · เลือกวิชาหรือหมวดย่อยเพื่อดูข้อสอบเก่าที่ไม่อยู่ในรายการนี้'}</p></div><span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-graydark">{filterLoading && <LoaderCircle size={14} className="animate-spin" />}{questions.length} / {totalCount} ข้อ</span></div>
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr]">
        <label className="relative block"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="ค้นหาจากโจทย์ข้อสอบ" className={`${fieldClass} mt-0 pl-9`} /></label>
        <label className="block"><select value={subjectFilter} onChange={(event) => onSubjectFilterChange(event.target.value)} className={`${fieldClass} mt-0`}><option value="">ทุกวิชา</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block"><select value={topicFilter} onChange={(event) => onTopicFilterChange(event.target.value)} className={`${fieldClass} mt-0`}><option value="">ทุกหมวดย่อย</option>{topicFilterOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block"><select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className={`${fieldClass} mt-0`}><option value="all">ทุกสถานะ</option><option value="active">เปิดใช้งาน</option><option value="archived">ปิดใช้งาน</option></select></label>
      </div>
      {questions.length === 0 ? <EmptyState icon={FilePlus2} title={totalCount === 0 ? 'ยังไม่มีข้อสอบในคลัง' : 'ไม่พบข้อสอบที่ตรงกับตัวกรอง'} description={totalCount === 0 ? 'เริ่มจากกรอกคำถามแรก แล้วเลือกว่าจะเก็บไว้ในคลังหรือเพิ่มเข้าชุดทันที' : 'ลองเปลี่ยนคำค้นหรือเงื่อนไขตัวกรองด้านบน'} /> : <div className="grid gap-3">{questions.map((item) => <QuestionCard key={item.id} item={item} onEdit={() => onEdit(item)} onArchive={() => onArchive(item.id)} onReactivate={() => onReactivate(item)} />)}</div>}
    </section>
  </div>;
}

const TEXT_EXAMPLE = `โจทย์ข้อสอบข้อที่หนึ่งเขียนแบบนี้
ก. ตัวเลือกแรก
ข. ตัวเลือกที่สอง
ค. ตัวเลือกที่สาม
ง. ตัวเลือกที่สี่
เฉลย: ข
คำอธิบาย: อธิบายเหตุผลของคำตอบ (ไม่บังคับ)
ที่มา: แนวข้อสอบปี 2568 (ไม่บังคับ)

โจทย์ข้อที่สองเว้นบรรทัดว่างคั่นจากข้อก่อนหน้า
A. Choice one
B. Choice two
C. Choice three
Answer: A`;

const BULK_EXAMPLE = `[
  {
    "subjectId": "law",
    "topicId": "",
    "topicLegacyId": "law-criminal-definition-01",
    "setId": "",
    "stem": "โจทย์ข้อสอบ...",
    "choices": ["ตัวเลือก A", "ตัวเลือก B", "ตัวเลือก C", "ตัวเลือก D"],
    "correctChoice": "A",
    "explanation": "คำอธิบายเฉลย",
    "difficulty": "medium",
    "sourceReference": ""
  }
]`;

function BulkImportPanel({
  bank, subjects, allTopics, allSets, bulkJson, setBulkJson, bulkImporting, bulkResult, onBulkImport, onTextImport,
}) {
  const [mode, setMode] = useState('text');
  const [showExample, setShowExample] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [textSubjectId, setTextSubjectId] = useState('');
  const [textTopicId, setTextTopicId] = useState('');
  const [textSetId, setTextSetId] = useState('');
  const [textDifficulty, setTextDifficulty] = useState('medium');

  const topicsForText = useMemo(
    () => (allTopics || []).filter((item) => item.subject_id === textSubjectId && item.is_active),
    [allTopics, textSubjectId],
  );
  const setsForText = useMemo(
    () => (allSets || []).filter((item) => item.bank === bank && item.subject_id === textSubjectId && item.status !== 'archived'),
    [allSets, bank, textSubjectId],
  );
  const parsed = useMemo(() => parseQuestionsText(textValue), [textValue]);

  const submitText = () => {
    const items = parsed.questions.map((item) => ({
      subjectId: textSubjectId,
      topicId: textTopicId || '',
      setId: textSetId || '',
      stem: item.stem,
      choices: item.choices,
      correctChoice: item.correctChoice,
      explanation: item.explanation,
      sourceReference: item.sourceReference,
      difficulty: textDifficulty,
    }));
    onTextImport(items);
  };

  return (
    <section className="rounded-3xl border border-cyan-200 bg-cyan-50/40 p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy"><FileJson size={19} className="text-cyan-700" /> เพิ่มข้อสอบหลายข้อพร้อมกัน</h2>
          <p className="mt-1 text-sm text-graydark/55">เร็วกว่าเพิ่มทีละข้อมาก — วางข้อความที่พิมพ์ไว้ในไฟล์เดิมของคุณ หรือวาง JSON ถ้าเตรียมข้อมูลไว้แล้ว</p>
        </div>
        <button type="button" onClick={() => setShowExample((current) => !current)} className="shrink-0 rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-800 hover:bg-cyan-50">{showExample ? 'ซ่อนตัวอย่าง' : 'ดูตัวอย่างรูปแบบ'}</button>
      </div>

      <div className="mb-4 inline-flex rounded-xl border border-cyan-200 bg-white p-1">
        <button type="button" onClick={() => setMode('text')} className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${mode === 'text' ? 'bg-cyan-700 text-white' : 'text-graydark hover:text-cyan-700'}`}>วางข้อความ (แนะนำ)</button>
        <button type="button" onClick={() => setMode('json')} className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${mode === 'json' ? 'bg-cyan-700 text-white' : 'text-graydark hover:text-cyan-700'}`}>วาง JSON</button>
      </div>

      {showExample && (
        <pre className="mb-4 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">{mode === 'text' ? TEXT_EXAMPLE : BULK_EXAMPLE}</pre>
      )}

      {mode === 'json' && <p className="mb-3 text-xs text-graydark/50">ข้อสอบทุกข้อที่นำเข้าจะถูกบันทึกไว้ในคลัง {bank === 'mock' ? 'Mock Exam' : 'แบบฝึกหัดรายวิชา'} เว้นแต่ระบุ &quot;bank&quot; ของตัวเองใน JSON</p>}

      {mode === 'text' ? (
        <div className="space-y-3">
          <div className={`grid gap-3 sm:grid-cols-2 ${bank === 'mock' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
            <label className="text-sm font-medium text-graydark">วิชา (ใช้กับทุกข้อที่วาง)
              <select value={textSubjectId} onChange={(event) => { setTextSubjectId(event.target.value); setTextTopicId(''); setTextSetId(''); }} className={fieldClass}><option value="">เลือกวิชา</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            </label>
            <label className="text-sm font-medium text-graydark">หมวดย่อย
              <select value={textTopicId} onChange={(event) => setTextTopicId(event.target.value)} disabled={!textSubjectId} className={fieldClass}><option value="">ไม่ระบุหมวดย่อย</option>{topicsForText.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            </label>
            {bank !== 'mock' && <label className="text-sm font-medium text-graydark">เพิ่มเข้าชุดข้อสอบ <span className="font-normal text-graydark/45">(เลือกได้)</span>
              <select value={textSetId} onChange={(event) => setTextSetId(event.target.value)} disabled={!textSubjectId} className={fieldClass}><option value="">เก็บไว้ในคลังก่อน</option>{setsForText.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
            </label>}
            <label className="text-sm font-medium text-graydark">ระดับความยาก
              <select value={textDifficulty} onChange={(event) => setTextDifficulty(event.target.value)} className={fieldClass}><option value="easy">ง่าย</option><option value="medium">ปานกลาง</option><option value="hard">ยาก</option></select>
            </label>
          </div>
          {bank === 'mock' && <p className="text-xs text-graydark/50">ระบบจะสุ่มข้อสอบเข้า Mock Exam ให้อัตโนมัติตามสัดส่วนของสายงาน ไม่ต้องเลือกชุดเอง</p>}

          <textarea
            value={textValue}
            onChange={(event) => setTextValue(event.target.value)}
            rows={10}
            placeholder={'พิมพ์หรือวางข้อสอบหลายข้อ คั่นแต่ละข้อด้วยบรรทัดว่าง เช่น\n\nโจทย์ข้อสอบ...\nก. ตัวเลือกแรก\nข. ตัวเลือกที่สอง\nเฉลย: ก'}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          />

          {textValue.trim() && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {parsed.questions.length > 0 && <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-800">อ่านได้ {parsed.questions.length} ข้อ พร้อมนำเข้า</span>}
              {parsed.warnings.length > 0 && <span className="rounded-full bg-amber-100 px-3 py-1.5 font-semibold text-amber-800">ข้ามไป {parsed.warnings.length} ข้อ (ตรวจรูปแบบด้านล่าง)</span>}
            </div>
          )}
          {parsed.warnings.length > 0 && (
            <div className="max-h-48 overflow-auto rounded-xl border border-amber-200 bg-amber-50 p-3">
              <ul className="space-y-1.5 text-xs text-amber-900">
                {parsed.warnings.map((item, index) => <li key={`${item.block}-${index}`}><span className="font-semibold">ข้อความช่วงที่ {item.block}</span> — {item.message}</li>)}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={submitText}
            disabled={bulkImporting || !textSubjectId || parsed.questions.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-700/15 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloud size={17} />
            {bulkImporting ? 'กำลังนำเข้า...' : !textSubjectId ? 'เลือกวิชาก่อนนำเข้า' : `นำเข้า ${parsed.questions.length} ข้อ`}
          </button>
        </div>
      ) : (
        <>
          <textarea
            value={bulkJson}
            onChange={(event) => setBulkJson(event.target.value)}
            rows={8}
            placeholder='วาง JSON array ของข้อสอบที่นี่ เช่น [ { "subjectId": "law", "stem": "...", "choices": [...], "correctChoice": "A" } ]'
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          />
          <button
            type="button"
            onClick={onBulkImport}
            disabled={bulkImporting || !bulkJson.trim()}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-700/15 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloud size={17} />
            {bulkImporting ? 'กำลังนำเข้า...' : 'นำเข้าข้อสอบจาก JSON'}
          </button>
        </>
      )}

      {bulkResult && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-800">นำเข้าสำเร็จ {bulkResult.insertedCount} ข้อ</span>
            {bulkResult.failedCount > 0 && <span className="rounded-full bg-red-100 px-3 py-1.5 font-semibold text-red-700">ข้าม {bulkResult.failedCount} ข้อ</span>}
          </div>
          {bulkResult.errors?.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-xl border border-red-200 bg-red-50 p-3">
              <ul className="space-y-2 text-xs text-red-800">
                {bulkResult.errors.map((item) => (
                  <li key={item.index}>
                    <span className="font-semibold">ข้อที่ {item.index + 1}</span> ({item.stem}…) — {item.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SetTab({ bank, track, mockPoolOnly, isTrackReady, examSet, setExamSet, subjects, topics, sets, saving, onSubmit, onCancel, onEdit, onTogglePublish, onDelete }) {
  const isEditing = Boolean(examSet.id);
  const setField = (key, value) => setExamSet((current) => ({ ...current, [key]: value }));
  const changeSubject = (subjectId) => setExamSet((current) => ({ ...current, subjectId, topicId: '' }));
  const mockScope = bank === 'mock' ? getMockExamTrack(examSet.trackId || track?.id) : null;
  return <div className="space-y-7">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-navy">{isEditing ? 'แก้ไขชุดข้อสอบ' : 'สร้างชุดข้อสอบ'}</h2><p className="mt-1 text-sm text-graydark/55">{bank === 'mock' ? 'Mock Exam ไม่รับคำถามแยกในชุด ระบบจะสุ่มจากคลังแบบฝึกหัดรายวิชาตามสัดส่วนสายงาน' : 'ชุดแบบฝึกหัดนี้ไม่ต้องระบุจำนวนข้อ ระบบนับจากคำถามที่เพิ่มเข้าในชุดจริง'}</p></div>{isEditing && <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-graydark hover:bg-slate-50">ยกเลิกการแก้ไข</button>}</div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {bank === 'mock' ? (
            <div className="sm:col-span-2 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2.5">
              <p className="text-xs font-bold text-cyan-800">ขอบเขต Mock Exam</p>
              {mockScope ? <><p className="mt-1 text-sm font-bold text-navy">{mockScope.name} · {mockScope.totalQuestions} ข้อ · {mockScope.durationMinutes} นาที</p><p className="mt-0.5 text-xs text-cyan-950/70">เกณฑ์ผ่าน {mockScope.passScore}/{mockScope.totalQuestions} คะแนน · ระบบกำหนดสัดส่วนรายวิชาให้อัตโนมัติ</p></> : <p className="mt-1 text-sm text-amber-700">กรุณาเลือกสายงานด้านบนก่อนสร้างชุด</p>}
            </div>
          ) : <><label className="text-sm font-medium text-graydark">วิชา<select value={examSet.subjectId} onChange={(event) => changeSubject(event.target.value)} className={fieldClass}><option value="">ทุกวิชา / ยังไม่ระบุ</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm font-medium text-graydark">หมวดย่อย<select value={examSet.topicId} onChange={(event) => setField('topicId', event.target.value)} disabled={!examSet.subjectId} className={fieldClass}><option value="">ไม่ระบุหมวดย่อย</option>{topics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></>}
          <label className="text-sm font-medium text-graydark">สถานะ<select value={examSet.status} onChange={(event) => setField('status', event.target.value)} className={fieldClass}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บเข้าคลัง</option></select></label>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr_0.4fr_0.45fr]">
          <label className="text-sm font-medium text-graydark">ชื่อชุด<input required value={examSet.title} onChange={(event) => setField('title', event.target.value)} placeholder="เช่น ตะลุยโจทย์กฎหมายอาญา ชุด 1" className={fieldClass} /></label>
          <label className="text-sm font-medium text-graydark">รหัสลิงก์ <span className="font-normal text-graydark/45">(ไม่บังคับ)</span><input value={examSet.slug} onChange={(event) => setField('slug', event.target.value)} placeholder="law-criminal-01" className={fieldClass} /></label>
          <label className="text-sm font-medium text-graydark">ความยาก<select value={examSet.difficulty} onChange={(event) => setField('difficulty', event.target.value)} className={fieldClass}><option value="easy">ง่าย</option><option value="medium">ปานกลาง</option><option value="hard">ยาก</option></select></label>
          <label className="text-sm font-medium text-graydark">เวลา (นาที)<input type="number" min="1" max="600" disabled={bank === 'mock'} value={bank === 'mock' && mockScope ? String(mockScope.durationMinutes) : examSet.durationMinutes} onChange={(event) => setField('durationMinutes', event.target.value)} placeholder="ไม่กำหนด" className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-graydark/55`} /></label>
        </div>
        <label className="block text-sm font-medium text-graydark">คำอธิบาย <span className="font-normal text-graydark/45">(ไม่บังคับ)</span><textarea value={examSet.description} onChange={(event) => setField('description', event.target.value)} rows={3} placeholder="อธิบายสิ่งที่ผู้เรียนจะได้ฝึกจากชุดนี้" className={fieldClass} /></label>
        <label className="flex items-center gap-2 text-sm text-graydark"><input type="checkbox" checked={examSet.isFree} onChange={(event) => setField('isFree', event.target.checked)} /> เปิดเป็นชุดทดลองฟรีสำหรับสมาชิกที่ยังไม่ชำระเงิน</label>
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isEditing ? <Save size={17} /> : <Plus size={17} />}{saving ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการแก้ไข' : 'สร้างชุดข้อสอบ'}</button><button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-graydark hover:bg-slate-50">ล้างข้อมูล</button></div>
      </form>
    </section>
    <section><div className="mb-3"><h2 className="text-lg font-bold text-navy">ชุดข้อสอบทั้งหมด</h2><p className="text-sm text-graydark/55">{bank === 'mock' ? 'Mock Exam สุ่มข้อสอบจากคลังแบบฝึกหัดรายวิชาให้อัตโนมัติตามสัดส่วนของสายงาน' : 'จำนวนข้ออัปเดตจากคำถามที่ถูกเพิ่มไว้ในแต่ละชุด'}</p></div>{sets.length === 0 ? <EmptyState icon={Layers3} title="ยังไม่มีชุดข้อสอบ" description={mockPoolOnly ? 'สร้างชุด Mock สำหรับสายงานนี้ แล้วเผยแพร่เมื่อคลังแบบฝึกหัดมีข้อสอบครบตามสัดส่วน' : 'สร้างชุดแรก แล้วกลับไปเพิ่มคำถามและเลือกชุดนี้ได้จากแบบฟอร์มคำถาม'} /> : <div className="grid gap-3 md:grid-cols-2">{sets.map((item) => <SetCard key={item.id} item={item} isTrackReady={isTrackReady} saving={saving} onEdit={() => onEdit(item)} onTogglePublish={() => onTogglePublish(item)} onDelete={() => onDelete(item)} />)}</div>}</section>
  </div>;
}

function TopicTab({ topic, setTopic, subjects, topics, saving, importing, onSubmit, onCancel, onImport, onEdit, onArchive, onReactivate }) {
  const isEditing = Boolean(topic.id);
  const grouped = subjects.map((subject) => ({ ...subject, topics: topics.filter((item) => item.subject_id === subject.id) }));
  return <div className="space-y-7">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-navy">{isEditing ? 'แก้ไขหมวดย่อย' : 'หมวดวิชาและหมวดย่อย'}</h2><p className="mt-1 text-sm text-graydark/55">นำเข้าหมวดย่อยที่เคยใช้ในหน้าแบบฝึกหัดได้ครั้งเดียว แล้วเพิ่มรายการใหม่ตามขอบเขตข้อสอบได้ต่อ</p></div><div className="flex gap-2">{isEditing && <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-graydark hover:bg-slate-50">ยกเลิกการแก้ไข</button>}{!isEditing && <button type="button" onClick={onImport} disabled={importing} className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2.5 text-sm font-semibold text-cyan-800 hover:bg-cyan-100 disabled:opacity-60"><Database size={17} />{importing ? 'กำลังนำเข้า...' : 'นำเข้าหมวดย่อยเดิม'}</button>}</div></div>
      <form onSubmit={onSubmit} className="grid gap-3 lg:grid-cols-[0.55fr_0.9fr_1.5fr_auto] lg:items-end"><label className="text-sm font-medium text-graydark">วิชา<select required value={topic.subjectId} onChange={(event) => setTopic((current) => ({ ...current, subjectId: event.target.value }))} className={fieldClass}><option value="">เลือกวิชา</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm font-medium text-graydark">ชื่อหมวดย่อย<input required value={topic.name} onChange={(event) => setTopic((current) => ({ ...current, name: event.target.value }))} placeholder="เช่น การเรียงประโยค" className={fieldClass} /></label><label className="text-sm font-medium text-graydark">คำอธิบาย <span className="font-normal text-graydark/45">(ไม่บังคับ)</span><input value={topic.description} onChange={(event) => setTopic((current) => ({ ...current, description: event.target.value }))} placeholder="อธิบายขอบเขตของหัวข้อนี้" className={fieldClass} /></label><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isEditing ? <Save size={17} /> : <Plus size={17} />}{saving ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มหมวด'}</button></form>
    </section>
    <section className="grid gap-4 md:grid-cols-2">{grouped.map((subject) => <article key={subject.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold text-navy">{subject.name}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-graydark">{subject.topics.length} หมวด</span></div>{subject.topics.length ? <div className="space-y-2">{subject.topics.map((item) => <TopicRow key={item.id} item={item} onEdit={() => onEdit(item)} onArchive={() => onArchive(item)} onReactivate={() => onReactivate(item)} />)}</div> : <p className="text-sm text-graydark/45">ยังไม่มีหมวดย่อยในฐานข้อมูล</p>}</article>)}</section>
  </div>;
}

function TopicRow({ item, onEdit, onArchive, onReactivate }) {
  return <div className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${item.is_active ? 'border-slate-200 bg-slate-50 text-graydark' : 'border-slate-200 bg-slate-50 text-graydark/45'}`}>
    <span title={item.description || ''} className="min-w-0 truncate">{item.name}{!item.is_active && ' (ปิดใช้งาน)'}</span>
    <span className="flex shrink-0 gap-1">
      <button type="button" onClick={onEdit} aria-label={`แก้ไข ${item.name}`} className="rounded p-1 text-graydark/60 hover:bg-white hover:text-cyan-700"><Pencil size={13} /></button>
      {item.is_active
        ? <button type="button" onClick={onArchive} aria-label={`ปิดใช้งาน ${item.name}`} className="rounded p-1 text-graydark/60 hover:bg-white hover:text-red-600"><Archive size={13} /></button>
        : <button type="button" onClick={onReactivate} aria-label={`เปิดใช้งาน ${item.name}`} className="rounded p-1 text-graydark/60 hover:bg-white hover:text-emerald-700"><RotateCcw size={13} /></button>}
    </span>
  </div>;
}

function TopicHierarchyTab({
  topic, setTopic, topicGroup, setTopicGroup, subjects, topics, topicGroups, saving, importing,
  onSubmit, onGroupSubmit, onCancel, onGroupCancel, onImport, onEdit, onEditGroup,
  onArchive, onArchiveGroup, onReactivate, onReactivateGroup,
}) {
  const groupsForTopic = topic.subjectId
    ? topicGroups.filter((group) => group.subject_id === topic.subjectId && group.is_active)
    : [];
  const isEditingTopic = Boolean(topic.id);
  const isEditingGroup = Boolean(topicGroup.id);

  return (
    <div className="space-y-7">
      <section className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Topic structure</p>
            <h2 className="mt-1 text-xl font-black text-navy">จัดหัวข้อเป็นชั้น เพื่อให้หน้ามือถือไม่ยาว</h2>
            <p className="mt-1 max-w-2xl text-sm text-graydark/60">สร้าง “หมวดหลัก” ก่อน เช่น กฎหมายอาญา แล้วกำหนดหัวข้ออย่าง “การใช้กฎหมายอาญา” ไว้ภายในหมวดนั้น</p>
          </div>
          <button type="button" onClick={onImport} disabled={importing} className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-cyan-800 shadow-sm hover:bg-cyan-50 disabled:opacity-60">
            <Database size={17} />{importing ? 'กำลังนำเข้า...' : 'นำเข้าหัวข้อเดิม'}
          </button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4"><p className="text-xs font-bold text-cyan-700">ขั้นที่ 1</p><h2 className="mt-1 text-lg font-bold text-navy">{isEditingGroup ? 'แก้ไขหมวดหลัก' : 'เพิ่มหมวดหลัก'}</h2></div>
          <form onSubmit={onGroupSubmit} className="space-y-3">
            <label className="block text-sm font-medium text-graydark">วิชา
              <select required value={topicGroup.subjectId} onChange={(event) => setTopicGroup((current) => ({ ...current, subjectId: event.target.value }))} className={fieldClass}>
                <option value="">เลือกวิชา</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-graydark">ชื่อหมวดหลัก
              <input required value={topicGroup.name} onChange={(event) => setTopicGroup((current) => ({ ...current, name: event.target.value }))} placeholder="เช่น กฎหมายอาญา" className={fieldClass} />
            </label>
            <label className="block text-sm font-medium text-graydark">คำอธิบาย <span className="font-normal text-graydark/45">(ไม่บังคับ)</span>
              <input value={topicGroup.description} onChange={(event) => setTopicGroup((current) => ({ ...current, description: event.target.value }))} placeholder="ภาพรวมของเนื้อหาในหมวดนี้" className={fieldClass} />
            </label>
            <div className="flex flex-wrap gap-2"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isEditingGroup ? <Save size={17} /> : <Plus size={17} />}{isEditingGroup ? 'บันทึกหมวดหลัก' : 'เพิ่มหมวดหลัก'}</button>{isEditingGroup && <button type="button" onClick={onGroupCancel} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-graydark hover:bg-slate-50">ยกเลิก</button>}</div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4"><p className="text-xs font-bold text-violet-700">ขั้นที่ 2</p><h2 className="mt-1 text-lg font-bold text-navy">{isEditingTopic ? 'แก้ไขหมวดย่อย' : 'เพิ่มหมวดย่อย'}</h2></div>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-graydark">วิชา
                <select required value={topic.subjectId} onChange={(event) => setTopic((current) => ({ ...current, subjectId: event.target.value, groupId: '' }))} className={fieldClass}>
                  <option value="">เลือกวิชา</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-graydark">หมวดหลัก <span className="font-normal text-graydark/45">(ไม่บังคับ)</span>
                <select value={topic.groupId} disabled={!topic.subjectId} onChange={(event) => setTopic((current) => ({ ...current, groupId: event.target.value }))} className={`${fieldClass} disabled:bg-slate-100`}>
                  <option value="">ยังไม่จัดหมวดหลัก</option>{groupsForTopic.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium text-graydark">ชื่อหมวดย่อย
              <input required value={topic.name} onChange={(event) => setTopic((current) => ({ ...current, name: event.target.value }))} placeholder="เช่น การใช้กฎหมายอาญา" className={fieldClass} />
            </label>
            <label className="block text-sm font-medium text-graydark">คำอธิบาย <span className="font-normal text-graydark/45">(ไม่บังคับ)</span>
              <input value={topic.description} onChange={(event) => setTopic((current) => ({ ...current, description: event.target.value }))} placeholder="ขอบเขตย่อยที่นักเรียนจะได้ฝึก" className={fieldClass} />
            </label>
            <div className="flex flex-wrap gap-2"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isEditingTopic ? <Save size={17} /> : <Plus size={17} />}{isEditingTopic ? 'บันทึกหมวดย่อย' : 'เพิ่มหมวดย่อย'}</button>{isEditingTopic && <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-graydark hover:bg-slate-50">ยกเลิก</button>}</div>
          </form>
        </section>
      </div>

      <section className="space-y-4">
        <div><h2 className="text-lg font-bold text-navy">โครงสร้างที่เผยแพร่</h2><p className="mt-1 text-sm text-graydark/55">หมวดย่อยที่ยังไม่จัดกลุ่มจะแสดงในส่วน “หัวข้ออื่น” เพื่อให้คุณย้ายจัดระเบียบได้ภายหลัง</p></div>
        <div className="grid gap-4 xl:grid-cols-2">
          {subjects.map((subject) => {
            const subjectGroups = topicGroups.filter((group) => group.subject_id === subject.id);
            const ungrouped = topics.filter((item) => item.subject_id === subject.id && !item.group_id);
            return (
              <article key={subject.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-bold text-navy">{subject.name}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-graydark">{topics.filter((item) => item.subject_id === subject.id).length} หัวข้อ</span></div>
                <div className="space-y-3">
                  {subjectGroups.map((group) => {
                    const children = topics.filter((item) => item.group_id === group.id);
                    return <details key={group.id} className={`rounded-xl border ${group.is_active ? 'border-cyan-100 bg-cyan-50/35' : 'border-slate-200 bg-slate-50 opacity-65'}`} open>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5"><span><span className="font-semibold text-navy">{group.name}</span><span className="ml-2 text-xs text-graydark/45">{children.length} หัวข้อ</span></span><span className="flex gap-1"><button type="button" onClick={(event) => { event.preventDefault(); onEditGroup(group); }} className="rounded p-1 text-graydark/60 hover:bg-white hover:text-cyan-700" aria-label={`แก้ไข ${group.name}`}><Pencil size={13} /></button>{group.is_active ? <button type="button" onClick={(event) => { event.preventDefault(); onArchiveGroup(group); }} className="rounded p-1 text-graydark/60 hover:bg-white hover:text-red-600" aria-label={`ปิดใช้งาน ${group.name}`}><Archive size={13} /></button> : <button type="button" onClick={(event) => { event.preventDefault(); onReactivateGroup(group); }} className="rounded p-1 text-graydark/60 hover:bg-white hover:text-emerald-700" aria-label={`เปิดใช้งาน ${group.name}`}><RotateCcw size={13} /></button>}</span></summary>
                      <div className="space-y-2 border-t border-cyan-100 p-3">{children.length ? children.map((item) => <TopicRow key={item.id} item={item} onEdit={() => onEdit(item)} onArchive={() => onArchive(item)} onReactivate={() => onReactivate(item)} />) : <p className="text-xs text-graydark/45">ยังไม่มีหมวดย่อยในหมวดนี้</p>}</div>
                    </details>;
                  })}
                  {ungrouped.length > 0 && <details className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50" open><summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-amber-800">หัวข้ออื่น <span className="text-xs font-medium">({ungrouped.length})</span></summary><div className="space-y-2 border-t border-amber-100 p-3">{ungrouped.map((item) => <TopicRow key={item.id} item={item} onEdit={() => onEdit(item)} onArchive={() => onArchive(item)} onReactivate={() => onReactivate(item)} />)}</div></details>}
                  {!subjectGroups.length && !ungrouped.length && <p className="text-sm text-graydark/45">ยังไม่มีหัวข้อในฐานข้อมูล</p>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function AnnouncementTab({ announcement, setAnnouncement, announcements, saving, onSubmit, onCancel, onEdit, onToggle, onDelete }) {
  const isEditing = Boolean(announcement.id);
  const setField = (key, value) => setAnnouncement((current) => ({ ...current, [key]: value }));
  return <div className="space-y-7">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-navy">{isEditing ? 'แก้ไขประกาศ' : 'สร้างประกาศ'}</h2><p className="mt-1 text-sm text-graydark/55">เลือกให้แสดงหน้ารวมประกาศ หรือแจ้งผู้ใช้เมื่อเข้าสู่ระบบได้</p></div>{isEditing && <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-graydark hover:bg-slate-50">ยกเลิกการแก้ไข</button>}</div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_0.6fr_0.6fr]"><label className="text-sm font-medium text-graydark">หัวข้อประกาศ<input required value={announcement.title} onChange={(event) => setField('title', event.target.value)} placeholder="เช่น อัปเดตคลังข้อสอบรอบใหม่" className={fieldClass} /></label><label className="text-sm font-medium text-graydark">รูปแบบ<select value={announcement.tone} onChange={(event) => setField('tone', event.target.value)} className={fieldClass}><option value="info">ข้อมูลทั่วไป</option><option value="success">อัปเดตสำเร็จ</option><option value="warning">แจ้งเตือน</option><option value="important">สำคัญ</option></select></label><label className="text-sm font-medium text-graydark">กลุ่มผู้รับ<select value={announcement.audience} onChange={(event) => setField('audience', event.target.value)} className={fieldClass}><option value="all">ทุกคน</option><option value="free">สมาชิกฟรี</option><option value="member">สมาชิก VIP</option></select></label></div>
        <label className="block text-sm font-medium text-graydark">ข้อความสรุป<input required value={announcement.summary} onChange={(event) => setField('summary', event.target.value)} placeholder="ข้อความสั้นที่ผู้ใช้เห็นก่อน" className={fieldClass} /></label>
        <label className="block text-sm font-medium text-graydark">รายละเอียด <span className="font-normal text-graydark/45">(ไม่บังคับ)</span><textarea value={announcement.body} onChange={(event) => setField('body', event.target.value)} rows={3} placeholder="รายละเอียดเพิ่มเติมของประกาศ" className={fieldClass} /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-graydark">เริ่มแสดง <span className="font-normal text-graydark/45">(ไม่บังคับ)</span><input type="datetime-local" value={announcement.startsAt} onChange={(event) => setField('startsAt', event.target.value)} className={fieldClass} /></label><label className="text-sm font-medium text-graydark">สิ้นสุดการแสดง <span className="font-normal text-graydark/45">(ไม่บังคับ)</span><input type="datetime-local" value={announcement.endsAt} onChange={(event) => setField('endsAt', event.target.value)} className={fieldClass} /></label></div>
        <div className="flex flex-wrap gap-x-5 gap-y-3"><label className="flex items-center gap-2 text-sm text-graydark"><input type="checkbox" checked={announcement.showOnLogin} onChange={(event) => setField('showOnLogin', event.target.checked)} /> แสดงเป็นป้ายแจ้งเตือนเมื่อเข้าสู่ระบบ</label><label className="flex items-center gap-2 text-sm text-graydark"><input type="checkbox" checked={announcement.isPublished} onChange={(event) => setField('isPublished', event.target.checked)} /> เผยแพร่ทันที</label></div>
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={17} />{saving ? 'กำลังบันทึก...' : isEditing ? 'บันทึกประกาศ' : 'สร้างประกาศ'}</button><button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-graydark hover:bg-slate-50">ล้างข้อมูล</button></div>
      </form>
    </section>
    <section><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-navy">ประกาศทั้งหมด</h2><p className="text-sm text-graydark/55">ประกาศที่เผยแพร่และอยู่ในช่วงเวลาที่กำหนดเท่านั้นจะแสดงให้ผู้ใช้เห็น</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-graydark">{announcements.length} รายการ</span></div>{announcements.length === 0 ? <EmptyState icon={Sparkles} title="ยังไม่มีประกาศ" description="เพิ่มประกาศเพื่อแจ้งข่าวหรือสถานะการอัปเดตให้ผู้ใช้ทราบ" /> : <div className="grid gap-3">{announcements.map((item) => <AnnouncementCard key={item.id} item={item} saving={saving} onEdit={() => onEdit(item)} onToggle={() => onToggle(item)} onDelete={() => onDelete(item)} />)}</div>}</section>
  </div>;
}

function QuestionCard({ item, onEdit, onArchive, onReactivate }) {
  const assignedSets = (item.exam_set_questions || []).map(({ exam_sets: examSet }) => examSet?.title).filter(Boolean);
  return <article className={`rounded-2xl border bg-white p-4 sm:p-5 ${item.is_active ? 'border-slate-200' : 'border-slate-200 opacity-65'}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge tone={item.bank === 'mock' ? 'violet' : 'cyan'}>{item.bank === 'mock' ? 'Mock Exam' : 'แบบฝึกหัด'}</Badge><Badge tone={difficultyTone(item.difficulty)}>{difficultyLabel(item.difficulty)}</Badge>{!item.is_active && <Badge tone="slate">ปิดใช้งาน</Badge>}</div><h3 className="font-semibold leading-6 text-navy">{item.stem}</h3><p className="mt-2 text-sm text-graydark/55">{item.content_subjects?.name || item.subject_id}{item.content_topics?.name ? ` · ${item.content_topics.name}` : ''}</p>{assignedSets.length ? <p className="mt-1 text-xs text-cyan-700">อยู่ในชุด: {assignedSets.join(', ')}</p> : null}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-graydark hover:border-cyan-300 hover:text-cyan-700"><Pencil size={15} />แก้ไข</button>{item.is_active ? <button type="button" onClick={onArchive} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"><Archive size={15} />ปิดใช้</button> : <button type="button" onClick={onReactivate} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"><RotateCcw size={15} />เปิดใช้งาน</button>}</div></div></article>;
}

function SetCard({ item, isTrackReady, saving, onEdit, onTogglePublish, onDelete }) {
  const count = item.exam_set_questions?.[0]?.count || 0;
  const isPublished = item.status === 'published';
  const scope = item.bank === 'mock' ? getMockExamTrack(item.track_id) : null;
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="mb-2 flex flex-wrap gap-2"><Badge tone={item.bank === 'mock' ? 'violet' : 'cyan'}>{item.bank === 'mock' ? 'Mock Exam' : 'แบบฝึกหัด'}</Badge>{scope && <Badge tone="blue">{scope.name}</Badge>}<Badge tone={isPublished ? 'green' : item.status === 'archived' ? 'slate' : 'amber'}>{isPublished ? 'เผยแพร่แล้ว' : item.status === 'archived' ? 'เก็บเข้าคลัง' : 'ฉบับร่าง'}</Badge>{item.is_free && <Badge tone="blue">ชุดฟรี</Badge>}</div><h3 className="font-semibold text-navy">{item.title}</h3><p className="mt-1 text-sm text-graydark/55">{scope ? `${scope.totalQuestions} ข้อ (สุ่มจากคลัง) · ${scope.durationMinutes} นาที · เกณฑ์ผ่าน ${scope.passScore} คะแนน` : `${item.content_subjects?.name || 'ทุกวิชา'}${item.content_topics?.name ? ` · ${item.content_topics.name}` : ''}`}</p></div>{scope ? <div className={`rounded-xl px-3 py-2 text-center shrink-0 ${isTrackReady ? 'bg-emerald-50' : 'bg-amber-50'}`}><p className={`text-xs font-bold ${isTrackReady ? 'text-emerald-700' : 'text-amber-700'}`}>{isTrackReady ? 'พร้อมสุ่ม' : 'คลังไม่พอ'}</p></div> : <div className="rounded-xl bg-slate-100 px-3 py-2 text-center shrink-0"><p className="text-lg font-bold text-navy">{count}</p><p className="text-[11px] text-graydark/55">ข้อ</p></div>}</div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-graydark/55"><span>ระดับ: {difficultyLabel(item.difficulty)}</span>{scope ? <span>เวลา: {scope.durationMinutes} นาที</span> : item.duration_minutes ? <span>เวลา: {item.duration_minutes} นาที</span> : <span>ไม่กำหนดเวลา</span>}<span className="font-mono text-[10px]">/{item.slug}</span></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-graydark hover:border-cyan-300 hover:text-cyan-700"><Pencil size={15} />แก้ไข</button><button type="button" disabled={saving} onClick={onTogglePublish} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-graydark hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-50">{isPublished ? <EyeOff size={15} /> : <Eye size={15} />}{isPublished ? 'ยกเลิกเผยแพร่' : 'เผยแพร่'}</button><button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"><Trash2 size={15} />ลบ</button></div></article>;
}

function AnnouncementCard({ item, saving, onEdit, onToggle, onDelete }) {
  const tone = { info: 'border-cyan-200 bg-cyan-50', success: 'border-emerald-200 bg-emerald-50', warning: 'border-amber-200 bg-amber-50', important: 'border-violet-200 bg-violet-50' }[item.tone] || 'border-slate-200 bg-slate-50';
  return <article className={`rounded-2xl border p-4 sm:p-5 ${tone}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="mb-2 flex flex-wrap gap-2"><Badge tone={item.is_published ? 'green' : 'slate'}>{item.is_published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}</Badge><Badge tone="blue">{item.audience === 'all' ? 'ทุกคน' : item.audience === 'member' ? 'VIP' : 'สมาชิกฟรี'}</Badge>{item.show_on_login && <Badge tone="violet">แจ้งตอนล็อกอิน</Badge>}</div><h3 className="font-semibold text-navy">{item.title}</h3><p className="mt-1 text-sm text-graydark/70">{item.summary}</p>{item.starts_at || item.ends_at ? <p className="mt-2 text-xs text-graydark/55">ช่วงแสดง: {formatDateTime(item.starts_at) || 'ทันที'} – {formatDateTime(item.ends_at) || 'ไม่กำหนด'}</p> : null}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-white/80 bg-white/75 px-3 py-2 text-sm font-medium text-graydark hover:bg-white"><Pencil size={15} />แก้ไข</button><button type="button" disabled={saving} onClick={onToggle} className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{item.is_published ? 'หยุดเผยแพร่' : 'เผยแพร่'}</button><button type="button" onClick={onDelete} aria-label="ลบประกาศ" className="rounded-lg border border-white/80 bg-white/75 p-2 text-red-600 hover:bg-white"><Trash2 size={15} /></button></div></div></article>;
}

function StatChip({ icon: Icon, label, value, tone }) {
  const tones = { cyan: 'bg-cyan-50 text-cyan-700', navy: 'bg-navy text-white', violet: 'bg-violet-50 text-violet-700', amber: 'bg-amber-50 text-amber-700' };
  return (
    <div className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 ${tones[tone]}`}>
      <Icon size={16} />
      <span className="text-base font-bold leading-none">{value}</span>
      <span className="text-xs font-medium opacity-80">{label}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition ${active ? 'border-cyan-500 text-navy' : 'border-transparent text-graydark/55 hover:text-navy'}`}><Icon size={17} />{label}</button>;
}

function Badge({ children, tone }) {
  const tones = { cyan: 'bg-cyan-50 text-cyan-700', violet: 'bg-violet-50 text-violet-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', blue: 'bg-blue-50 text-blue-700', slate: 'bg-slate-100 text-slate-600', easy: 'bg-emerald-50 text-emerald-700', medium: 'bg-amber-50 text-amber-700', hard: 'bg-red-50 text-red-700' };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>{children}</span>;
}

function difficultyLabel(value) { return ({ easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' })[value] || 'ไม่ระบุ'; }
function difficultyTone(value) { return ({ easy: 'easy', medium: 'medium', hard: 'hard' })[value] || 'slate'; }
function dateTimeInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function formatDateTime(value) { return value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : ''; }

function Alert({ tone, message, onClose }) {
  const styles = tone === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return <div className={`mb-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}><span>{message}</span><button type="button" onClick={onClose} className="font-semibold opacity-70 hover:opacity-100" aria-label="ปิดข้อความ">×</button></div>;
}

function EmptyState({ icon: Icon, title, description }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><Icon size={30} className="mx-auto mb-3 text-slate-300" /><h3 className="font-semibold text-navy">{title}</h3><p className="mx-auto mt-1 max-w-md text-sm text-graydark/55">{description}</p></div>;
}

function AccessDenied({ message }) {
  return <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6"><div className="flex gap-3"><CircleAlert size={24} className="shrink-0 text-amber-700" /><div><h1 className="font-semibold text-amber-900">ยังเข้าหน้าผู้ดูแลไม่ได้</h1><p className="mt-1 text-sm leading-relaxed text-amber-800">{message} หากเพิ่งสร้างตารางคลังข้อสอบ ให้รันไฟล์ migration สำหรับหลังบ้านใน Supabase ก่อน</p></div></div></div>;
}
