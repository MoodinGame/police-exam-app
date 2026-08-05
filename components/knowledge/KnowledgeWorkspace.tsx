'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronRight,
  FileText,
  Hash,
  LibraryBig,
  ListFilter,
  LoaderCircle,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  Target,
  Table2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  articleMap,
  difficultyLabel,
  firstLearningSubject,
  formatCount,
  learningSubjects,
  learningTopics,
  topicSearch,
} from '@/components/knowledge/knowledge-utils';
import type { KnowledgeArticle, KnowledgeCatalog, KnowledgeSubject, KnowledgeTopic, StudyQuestion, TopicStudyResponse } from '@/components/knowledge/types';

type Theme = 'light' | 'dark';
type ViewMode = 'library' | 'compare';

const emptyCatalog: KnowledgeCatalog = {
  subjects: [],
  topics: [],
  articles: [],
  topicQuestionCounts: {},
  subjectQuestionCounts: {},
};

const subjectIcons: Record<string, typeof BookOpen> = {
  thai: BookOpen,
  english: BookOpen,
  aptitude: Target,
  it: Hash,
  correspondence: FileText,
  'police-correspondence': FileText,
  social: Sparkles,
  law: LibraryBig,
};

function SubjectIcon({ subjectId, className }: { subjectId: string; className?: string }) {
  const Icon = subjectIcons[subjectId] || BookOpen;
  return <Icon className={className} size={17} aria-hidden="true" />;
}

function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof BookOpen }) {
  return <Card className="border-line/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/85"><CardContent className="flex items-start gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300"><Icon size={19} /></span><div><p className="text-xs font-medium text-graydark dark:text-slate-400">{label}</p><p className="mt-0.5 text-xl font-black tracking-tight text-navy dark:text-slate-100">{value}</p><p className="text-xs text-graydark/70 dark:text-slate-400">{detail}</p></div></CardContent></Card>;
}

function TopicItem({
  topic,
  article,
  count,
  active,
  saved,
  onSelect,
}: {
  topic: KnowledgeTopic;
  article?: KnowledgeArticle;
  count: number;
  active: boolean;
  saved: boolean;
  onSelect: () => void;
}) {
  return <button type="button" onClick={onSelect} className={cn('group flex w-full items-center gap-3 rounded-xl p-3 text-left transition', active ? 'bg-cyan-50 text-navy ring-1 ring-cyan-200 dark:bg-cyan-500/10 dark:text-white dark:ring-cyan-500/30' : 'text-graydark hover:bg-slate-50 hover:text-navy dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white')}><span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', active ? 'bg-white text-cyan-700 shadow-sm dark:bg-slate-900 dark:text-cyan-300' : 'bg-slate-100 text-graydark/65 dark:bg-slate-800 dark:text-slate-400')}><BookOpen size={16} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-sm font-semibold">{topic.name}</span>{saved && <BookmarkCheck size={13} className="shrink-0 text-cyan-600 dark:text-cyan-300" />}</span><span className="mt-0.5 flex items-center gap-1.5 text-xs text-graydark/60 dark:text-slate-400"><span>{formatCount(count)} ข้อ</span>{article && <><span>·</span><span>มีบทเรียน</span></>}</span></span><ChevronRight size={16} className={cn('shrink-0 transition group-hover:translate-x-0.5', active ? 'text-cyan-700 dark:text-cyan-300' : 'text-graydark/40 dark:text-slate-500')} /></button>;
}

function LessonDocument({ article }: { article: KnowledgeArticle | null }) {
  if (!article) return <Card className="border-dashed bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/70"><CardContent className="p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-slate-800"><FileText size={18} /></span><div><h3 className="font-bold text-navy dark:text-white">กำลังรวบรวมบทเรียนสำหรับหัวข้อนี้</h3><p className="mt-1 text-sm leading-6 text-graydark dark:text-slate-400">คุณสามารถเริ่มจากตัวอย่างข้อสอบจริงด้านล่างได้ทันที เมื่อผู้ดูแลเพิ่มเทคนิคและสูตรของหัวข้อนี้ เนื้อหาจะแสดงในส่วนนี้โดยอัตโนมัติ</p></div></div></CardContent></Card>;

  const paragraphs = String(article.body || '').split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const techniques = (article.techniques || []).filter((item) => item.title && item.detail);
  const formulas = (article.formula_cards || []).filter((item) => item.label && item.formula);
  const points = (article.key_points || []).filter(Boolean);

  return <Card className="overflow-hidden border-line/80 bg-white dark:border-slate-800 dark:bg-slate-900"><CardHeader className="border-b border-line/70 dark:border-slate-800"><div className="flex items-center gap-2"><Badge variant="primary">LESSON NOTE</Badge><span className="text-xs font-medium text-graydark/65 dark:text-slate-400">บทเรียนจากผู้ดูแล</span></div><h2 className="pt-2 text-xl font-black tracking-tight text-navy dark:text-white sm:text-2xl">{article.title}</h2>{article.summary && <p className="max-w-3xl text-sm leading-6 text-graydark dark:text-slate-400">{article.summary}</p>}</CardHeader><CardContent className="space-y-7 p-5 sm:p-6">{paragraphs.length > 0 && <div className="space-y-4 text-sm leading-7 text-graydark dark:text-slate-300">{paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</div>}{techniques.length > 0 && <section><div className="flex items-center gap-2"><Target size={17} className="text-cyan-700 dark:text-cyan-300" /><h3 className="font-bold text-navy dark:text-white">เทคนิคทำข้อสอบ</h3></div><div className="mt-3 grid gap-3 md:grid-cols-2">{techniques.map((item, index) => <div key={`${item.title}-${index}`} className="rounded-xl border border-line bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"><div className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cyan-100 text-xs font-black text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200">{index + 1}</span><div><h4 className="text-sm font-bold text-navy dark:text-slate-100">{item.title}</h4><p className="mt-1 text-sm leading-6 text-graydark dark:text-slate-400">{item.detail}</p></div></div></div>)}</div></section>}{formulas.length > 0 && <section><div className="flex items-center gap-2"><Hash size={17} className="text-cyan-700 dark:text-cyan-300" /><h3 className="font-bold text-navy dark:text-white">สูตรและกฎที่ต้องจำ</h3></div><div className="mt-3 grid gap-3 lg:grid-cols-2">{formulas.map((item, index) => <div key={`${item.label}-${index}`} className="rounded-xl border border-line bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"><p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">{item.label}</p><code className="mt-2 block overflow-x-auto rounded-lg bg-navy px-3 py-2.5 text-sm font-semibold text-white dark:bg-slate-800">{item.formula}</code>{item.note && <p className="mt-2 text-sm leading-6 text-graydark dark:text-slate-400">{item.note}</p>}</div>)}</div></section>}{points.length > 0 && <section className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70"><h3 className="font-bold text-navy dark:text-white">ประเด็นที่ควรจำ</h3><ul className="mt-3 grid gap-2 md:grid-cols-2">{points.map((point) => <li key={point} className="flex gap-2 text-sm leading-6 text-graydark dark:text-slate-300"><CheckCircle2 size={16} className="mt-1 shrink-0 text-cyan-700 dark:text-cyan-300" />{point}</li>)}</ul></section>}{(article.pitfalls || article.exam_guide) && <div className="grid gap-3 md:grid-cols-2">{article.pitfalls && <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/10"><p className="text-xs font-bold text-amber-800 dark:text-amber-200">จุดที่มักพลาด</p><p className="mt-1 text-sm leading-6 text-amber-950/75 dark:text-amber-100/75">{article.pitfalls}</p></div>}{article.exam_guide && <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/10"><p className="text-xs font-bold text-cyan-800 dark:text-cyan-200">วิธีอ่านโจทย์</p><p className="mt-1 text-sm leading-6 text-cyan-950/75 dark:text-cyan-100/75">{article.exam_guide}</p></div>}</div>}</CardContent></Card>;
}

function QuestionExamples({ questions, subjectId }: { questions: StudyQuestion[]; subjectId: string }) {
  return <section className="mt-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><Badge variant="success">PRACTICE FROM DATABASE</Badge><h2 className="mt-2 text-xl font-black text-navy dark:text-white">ลองทำจากโจทย์จริง</h2><p className="mt-1 text-sm text-graydark dark:text-slate-400">คิดคำตอบก่อน แล้วค่อยเปิดดูเฉลยและคำอธิบาย</p></div><Link href={`/practice/${subjectId}`}><Button variant="outline" className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">ฝึกทั้งวิชา <ArrowRight size={15} /></Button></Link></div>{questions.length > 0 ? <div className="mt-4 space-y-3">{questions.map((question, index) => <details key={question.id} className="group rounded-2xl border border-line bg-white open:border-cyan-200 open:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:open:border-cyan-500/35"><summary className="flex cursor-pointer list-none items-start gap-3 p-4 sm:p-5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-navy dark:bg-slate-800 dark:text-slate-200">{index + 1}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium text-graydark/60 dark:text-slate-400">ข้อสอบในคลัง</span><Badge variant="default">{difficultyLabel(question.difficulty)}</Badge></span><span className="mt-2 block text-sm font-semibold leading-7 text-navy dark:text-slate-100">{question.question}</span></span><ChevronRight size={18} className="mt-1 shrink-0 text-graydark/55 transition group-open:rotate-90 dark:text-slate-400" /></summary><div className="border-t border-line bg-slate-50/70 p-4 pl-[4.25rem] text-sm leading-7 dark:border-slate-800 dark:bg-slate-950/50 sm:p-5 sm:pl-[4.5rem]"><p className="font-bold text-emerald-700 dark:text-emerald-300">เฉลย: {question.answer || 'ยังไม่มีคำตอบที่พร้อมแสดง'}</p><p className="mt-2 text-graydark dark:text-slate-300">{question.explanation || 'ข้อนี้ยังไม่มีคำอธิบายเพิ่มเติมในคลังข้อสอบ'}</p></div></details>)}</div> : <Card className="mt-4 border-dashed bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/70"><CardContent className="p-5 text-sm leading-6 text-graydark dark:text-slate-400">หัวข้อนี้ยังไม่มีโจทย์ที่พร้อมเรียน เมื่อเพิ่มข้อสอบแบบฝึกหัดและเปิดใช้งานแล้ว ตัวอย่างจะปรากฏที่นี่โดยอัตโนมัติ</CardContent></Card>}</section>;
}

function ComparisonTable({ topics, catalog, articles }: { topics: KnowledgeTopic[]; catalog: KnowledgeCatalog; articles: Map<string, KnowledgeArticle> }) {
  return <Card className="overflow-hidden border-line/80 bg-white dark:border-slate-800 dark:bg-slate-900"><CardHeader><div className="flex items-center gap-2"><Table2 size={18} className="text-cyan-700 dark:text-cyan-300" /><div><h2 className="font-bold text-navy dark:text-white">ตารางเปรียบเทียบหัวข้อ</h2><p className="mt-1 text-sm text-graydark dark:text-slate-400">ดูความพร้อมของบทเรียนและคลังโจทย์ในวิชาที่เลือก</p></div></div></CardHeader><div className="overflow-x-auto"><table className="w-full min-w-[620px] border-t border-line text-left text-sm dark:border-slate-800"><thead className="bg-slate-50 text-xs text-graydark dark:bg-slate-950/60 dark:text-slate-400"><tr><th scope="col" className="px-5 py-3 font-semibold">หัวข้อ</th><th scope="col" className="px-5 py-3 font-semibold">โจทย์พร้อมเรียน</th><th scope="col" className="px-5 py-3 font-semibold">บทเรียนเทคนิค</th><th scope="col" className="px-5 py-3 font-semibold">สถานะ</th></tr></thead><tbody className="divide-y divide-line dark:divide-slate-800">{topics.map((topic) => { const article = articles.get(topic.id); const count = Number(catalog.topicQuestionCounts[topic.id] || 0); return <tr key={topic.id} className="text-graydark dark:text-slate-300"><td className="px-5 py-3.5 font-semibold text-navy dark:text-slate-100">{topic.name}</td><td className="px-5 py-3.5">{formatCount(count)} ข้อ</td><td className="px-5 py-3.5">{article ? article.title : 'ยังไม่มี'}</td><td className="px-5 py-3.5"><Badge variant={article && count > 0 ? 'success' : count > 0 ? 'warning' : 'default'}>{article && count > 0 ? 'พร้อมเรียน' : count > 0 ? 'มีโจทย์แล้ว' : 'รอเนื้อหา'}</Badge></td></tr>; })}</tbody></table></div></Card>;
}

export default function KnowledgeWorkspace() {
  const [catalog, setCatalog] = useState<KnowledgeCatalog>(emptyCatalog);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkBusy, setBookmarkBusy] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [topicMenuOpen, setTopicMenuOpen] = useState(false);
  const [study, setStudy] = useState<{ loading: boolean; error: string; article: KnowledgeArticle | null; questions: StudyQuestion[] }>({ loading: false, error: '', article: null, questions: [] });
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('polready-knowledge-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') setTheme(storedTheme);

    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('polready-knowledge-theme', theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    fetch('/api/knowledge', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json() as KnowledgeCatalog & { error?: string };
        if (!response.ok) throw new Error(data.error || 'ไม่สามารถโหลดคลังความรู้ได้');
        return data;
      })
      .then((data) => {
        if (!active) return;
        setCatalog(data);
        setSubjectId((current) => current || firstLearningSubject(data.subjects, data));
      })
      .catch((error: Error) => {
        if (active) setCatalogError(error.message || 'ไม่สามารถโหลดคลังความรู้ได้');
      })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    fetch('/api/knowledge/bookmarks', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ topicIds?: string[] }> : null)
      .then((data) => { if (data?.topicIds) setBookmarks(data.topicIds); })
      .catch(() => {});
  }, []);

  const subjects = useMemo(() => learningSubjects(catalog), [catalog]);
  const selectedSubject = useMemo(() => catalog.subjects.find((subject) => subject.id === subjectId) || null, [catalog.subjects, subjectId]);
  const articleByTopic = useMemo(() => articleMap(catalog.articles) as Map<string, KnowledgeArticle>, [catalog.articles]);
  const selectedSubjectTopics = useMemo(() => learningTopics(catalog, subjectId), [catalog, subjectId]);
  const allTopics = useMemo(() => catalog.topics.filter((topic) => articleByTopic.has(topic.id) || Number(catalog.topicQuestionCounts[topic.id] || 0) > 0), [articleByTopic, catalog.topicQuestionCounts, catalog.topics]);
  const searchedTopics = useMemo(() => topicSearch(query.trim() ? allTopics : selectedSubjectTopics, articleByTopic, query), [allTopics, articleByTopic, query, selectedSubjectTopics]);
  const visibleTopics = useMemo(() => bookmarkedOnly ? searchedTopics.filter((topic) => bookmarks.includes(topic.id)) : searchedTopics, [bookmarkedOnly, bookmarks, searchedTopics]);
  const selectedTopic = useMemo(() => catalog.topics.find((topic) => topic.id === topicId) || null, [catalog.topics, topicId]);
  const totalQuestions = useMemo(() => Object.values(catalog.subjectQuestionCounts).reduce((total, count) => total + Number(count || 0), 0), [catalog.subjectQuestionCounts]);
  const topicCount = useMemo(() => allTopics.length, [allTopics]);

  useEffect(() => {
    if (selectedSubjectTopics.length === 0) {
      setTopicId('');
      return;
    }
    setTopicId((current) => selectedSubjectTopics.some((topic) => topic.id === current) ? current : selectedSubjectTopics[0].id);
  }, [selectedSubjectTopics]);

  useEffect(() => {
    if (!topicId) {
      setStudy({ loading: false, error: '', article: null, questions: [] });
      return undefined;
    }
    let active = true;
    setStudy({ loading: true, error: '', article: null, questions: [] });
    fetch(`/api/knowledge?topic=${encodeURIComponent(topicId)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json() as TopicStudyResponse & { error?: string };
        if (!response.ok) throw new Error(data.error || 'ไม่สามารถโหลดบทเรียนได้');
        return data;
      })
      .then((data) => {
        if (active) setStudy({ loading: false, error: '', article: data.article, questions: data.questions || [] });
      })
      .catch((error: Error) => {
        if (active) setStudy({ loading: false, error: error.message || 'ไม่สามารถโหลดบทเรียนได้', article: null, questions: [] });
      });
    return () => { active = false; };
  }, [topicId]);

  function selectSubject(nextSubjectId: string) {
    setSubjectId(nextSubjectId);
    setQuery('');
    setBookmarkedOnly(false);
    setViewMode('library');
    setTopicMenuOpen(false);
  }

  function selectTopic(nextTopic: KnowledgeTopic) {
    setSubjectId(nextTopic.subject_id);
    setTopicId(nextTopic.id);
    setTopicMenuOpen(false);
    setViewMode('library');
  }

  async function toggleBookmark(nextTopicId: string) {
    const isSaved = bookmarks.includes(nextTopicId);
    setBookmarkBusy(nextTopicId);
    try {
      const response = await fetch(isSaved ? `/api/knowledge/bookmarks?topic=${encodeURIComponent(nextTopicId)}` : '/api/knowledge/bookmarks', {
        method: isSaved ? 'DELETE' : 'POST',
        ...(isSaved ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topicId: nextTopicId }) }),
      });
      const data = await response.json() as { topicIds?: string[] };
      if (response.ok && data.topicIds) setBookmarks(data.topicIds);
    } finally {
      setBookmarkBusy(null);
    }
  }

  if (catalogLoading) return <div className="grid gap-4"><div className="h-32 animate-pulse rounded-3xl bg-slate-200/60" /><div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />)}</div></div>;
  if (catalogError) return <Card className="grid min-h-72 place-items-center border-dashed bg-white p-8 text-center"><div><LibraryBig className="mx-auto text-slate-300" size={30} /><h1 className="mt-4 text-xl font-black text-navy">ยังเปิดคลังความรู้ไม่ได้</h1><p className="mt-2 max-w-md text-sm leading-6 text-graydark">{catalogError}</p></div></Card>;

  const isBookmarked = selectedTopic ? bookmarks.includes(selectedTopic.id) : false;

  return <div className={cn('min-h-full pb-10', theme === 'dark' && 'dark')}>
    <div className="rounded-3xl bg-[#fbfdff] p-1 dark:bg-slate-950">
      <div className="relative overflow-hidden rounded-[1.35rem] border border-line bg-white/90 p-5 shadow-[0_16px_45px_rgba(30,64,100,0.07)] dark:border-slate-800 dark:bg-slate-900 sm:p-7"><div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-100/55 blur-3xl dark:bg-cyan-500/10" /><div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2"><Badge variant="primary">KNOWLEDGE BASE</Badge><span className="hidden text-xs font-medium text-graydark/60 sm:inline dark:text-slate-400">ค้นหาเร็วด้วย Ctrl / ⌘ K</span></div><h1 className="mt-3 text-3xl font-black tracking-tight text-navy dark:text-white sm:text-4xl">คลังความรู้</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-graydark dark:text-slate-400">บทเรียนแบบมีโครงสร้างสำหรับคิดเป็น เห็นหลัก และฝึกต่อจากข้อสอบจริงในระบบ</p></div><div className="flex flex-wrap gap-2"><Button variant={viewMode === 'library' ? 'default' : 'outline'} onClick={() => setViewMode('library')} className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><LibraryBig size={16} /> อ่านบทเรียน</Button><Button variant={viewMode === 'compare' ? 'default' : 'outline'} onClick={() => setViewMode('compare')} className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><Table2 size={16} /> เปรียบเทียบหัวข้อ</Button><Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'} title={theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'} className="dark:text-slate-300 dark:hover:bg-slate-800">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</Button></div></div></div>

      <section className="mt-5 grid gap-3 md:grid-cols-3"><StatCard label="ข้อสอบในคลัง" value={`${formatCount(totalQuestions)} ข้อ`} detail="เชื่อมจากฐานข้อมูลแบบฝึกหัด" icon={LibraryBig} /><StatCard label="หัวข้อที่พร้อมเรียน" value={`${formatCount(topicCount)} หัวข้อ`} detail="มีโจทย์หรือบทเรียนที่เปิดใช้งาน" icon={BookOpen} /><StatCard label="รายการที่บันทึก" value={`${formatCount(bookmarks.length)} หัวข้อ`} detail="เก็บไว้ทบทวนในบัญชีของคุณ" icon={Bookmark} /></section>

      <section className="mt-5 rounded-2xl border border-line bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-graydark/50 dark:text-slate-500" size={18} /><Input ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value); setBookmarkedOnly(false); }} placeholder="ค้นหาหัวข้อ บทเรียน หรือเทคนิคที่ต้องการ…" className="pl-10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />{query && <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-graydark/55 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="ล้างคำค้นหา"><X size={15} /></button>}</div><div className="flex gap-2"><Button variant={bookmarkedOnly ? 'secondary' : 'outline'} onClick={() => setBookmarkedOnly((current) => !current)} className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><Bookmark size={16} /> บันทึกไว้</Button><Button variant="outline" className="xl:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" onClick={() => setTopicMenuOpen((current) => !current)}><Menu size={16} /> หัวข้อ</Button></div></div><div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]" role="tablist" aria-label="เลือกวิชา">{subjects.map((subject) => { const active = subject.id === subjectId; return <button key={subject.id} type="button" role="tab" aria-selected={active} onClick={() => selectSubject(subject.id)} className={cn('inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition', active ? 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200' : 'border-line bg-white text-graydark hover:border-cyan-200 hover:text-navy dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white')}><SubjectIcon subjectId={subject.id} /><span>{subject.short_name || subject.name}</span><span className="text-xs opacity-65">{formatCount(catalog.subjectQuestionCounts[subject.id])}</span></button>; })}</div></section>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[19.5rem_minmax(0,1fr)]"><aside className={cn('overflow-hidden rounded-2xl border border-line bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900', topicMenuOpen ? 'block' : 'hidden xl:block')}><div className="border-b border-line p-4 dark:border-slate-800"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-graydark dark:text-slate-400">{query ? 'ผลลัพธ์การค้นหา' : 'สารบัญวิชา'}</p><h2 className="mt-1 font-bold text-navy dark:text-white">{query ? `${formatCount(visibleTopics.length)} หัวข้อ` : selectedSubject?.name || 'เลือกวิชา'}</h2></div><ListFilter size={18} className="text-cyan-700 dark:text-cyan-300" /></div></div><nav className="max-h-[30rem] overflow-y-auto p-2" aria-label="รายการหัวข้อความรู้">{visibleTopics.length > 0 ? visibleTopics.map((topic) => <TopicItem key={topic.id} topic={topic} article={articleByTopic.get(topic.id)} count={Number(catalog.topicQuestionCounts[topic.id] || 0)} active={topic.id === topicId} saved={bookmarks.includes(topic.id)} onSelect={() => selectTopic(topic)} />) : <div className="p-5 text-center text-sm leading-6 text-graydark dark:text-slate-400">ไม่พบหัวข้อที่ตรงกับตัวกรองนี้</div>}</nav></aside>

        <main className="min-w-0">{viewMode === 'compare' ? <ComparisonTable topics={selectedSubjectTopics} catalog={catalog} articles={articleByTopic} /> : selectedTopic ? <><section className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-white p-5 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:via-slate-900 dark:to-slate-900 sm:p-7"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="primary">{selectedSubject?.short_name || selectedSubject?.name || 'หัวข้อ'}</Badge>{articleByTopic.has(selectedTopic.id) ? <Badge variant="success">มีบทเรียนเทคนิค</Badge> : <Badge variant="warning">เรียนจากโจทย์จริง</Badge>}</div><h2 className="mt-3 text-2xl font-black tracking-tight text-navy dark:text-white sm:text-3xl">{selectedTopic.name}</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-graydark dark:text-slate-400">{selectedTopic.description || 'ทบทวนหลักคิด สำรวจเทคนิค และฝึกต่อจากคลังข้อสอบของหัวข้อนี้'}</p></div><Button variant={isBookmarked ? 'secondary' : 'outline'} onClick={() => toggleBookmark(selectedTopic.id)} disabled={bookmarkBusy === selectedTopic.id} className="shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">{bookmarkBusy === selectedTopic.id ? <LoaderCircle size={16} className="animate-spin" /> : isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}{isBookmarked ? 'บันทึกแล้ว' : 'บันทึกหัวข้อ'}</Button></div><div className="mt-5 flex flex-wrap gap-3 border-t border-cyan-100 pt-4 text-sm dark:border-cyan-500/15"><span className="inline-flex items-center gap-1.5 text-graydark dark:text-slate-300"><BookOpen size={15} className="text-cyan-700 dark:text-cyan-300" /> โจทย์พร้อมเรียน {formatCount(catalog.topicQuestionCounts[selectedTopic.id])} ข้อ</span><span className="inline-flex items-center gap-1.5 text-graydark dark:text-slate-300"><Target size={15} className="text-cyan-700 dark:text-cyan-300" /> อ่าน → คิด → ฝึก</span></div></section>{study.loading ? <div className="mt-5 space-y-4"><div className="h-60 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800" /><div className="h-40 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800" /></div> : study.error ? <Card className="mt-5 border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"><CardContent className="p-6"><h2 className="font-bold text-navy dark:text-white">ยังไม่สามารถเปิดเนื้อหาการเรียนได้</h2><p className="mt-1 text-sm leading-6 text-amber-950/75 dark:text-amber-100/75">{study.error}</p><Link href="/account" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-navy dark:text-white">ดูสถานะสมาชิก <ArrowRight size={15} /></Link></CardContent></Card> : <><div className="mt-5"><LessonDocument article={study.article} /></div><QuestionExamples questions={study.questions} subjectId={selectedTopic.subject_id} /></>}</> : <Card className="grid min-h-[28rem] place-items-center border-dashed bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900"><div><BookOpen className="mx-auto text-slate-300 dark:text-slate-600" size={32} /><h2 className="mt-4 text-xl font-black text-navy dark:text-white">เลือกหัวข้อเพื่อเริ่มอ่าน</h2><p className="mt-2 max-w-md text-sm leading-6 text-graydark dark:text-slate-400">ค้นหาหรือเลือกหัวข้อจากสารบัญ ระบบจะแสดงบทเรียน เทคนิค และโจทย์ที่เชื่อมจากฐานข้อมูล</p></div></Card>}</main></div>
    </div>
  </div>;
}
