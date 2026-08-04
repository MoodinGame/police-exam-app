'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Cpu,
  FileText,
  Languages,
  Lightbulb,
  ListChecks,
  Scale,
  SearchCheck,
  Sparkles,
} from 'lucide-react';
import { knowledgeArticles } from '@/lib/knowledge';
import { knowledgeSubjectScopes } from '@/lib/knowledgeSyllabus';
import { noCopyHandlers } from '@/lib/copyProtection';

const subjectMeta = {
  english: { label: 'ภาษาอังกฤษ', icon: Languages, tone: 'text-violet-600', active: 'border-violet-500 text-violet-700', panel: 'border-violet-200 bg-violet-50/60', dot: 'bg-violet-500' },
  thai: { label: 'ภาษาไทย', icon: BookOpen, tone: 'text-blue-600', active: 'border-blue-500 text-blue-700', panel: 'border-amber-200 bg-amber-50/70', dot: 'bg-blue-500' },
  aptitude: { label: 'คณิตศาสตร์', icon: Calculator, tone: 'text-cyan-600', active: 'border-cyan-500 text-cyan-700', panel: 'border-cyan-200 bg-cyan-50/60', dot: 'bg-cyan-500' },
  it: { label: 'คอมพิวเตอร์ / IT', icon: Cpu, tone: 'text-sky-600', active: 'border-sky-500 text-sky-700', panel: 'border-sky-200 bg-sky-50/60', dot: 'bg-sky-500' },
  social: { label: 'สังคม / อาเซียน', icon: Sparkles, tone: 'text-teal-600', active: 'border-teal-500 text-teal-700', panel: 'border-teal-200 bg-teal-50/60', dot: 'bg-teal-500' },
  correspondence: { label: 'งานสารบรรณ', icon: FileText, tone: 'text-emerald-600', active: 'border-emerald-500 text-emerald-700', panel: 'border-emerald-200 bg-emerald-50/60', dot: 'bg-emerald-500' },
  'police-correspondence': { label: 'สารบรรณตำรวจ', icon: FileText, tone: 'text-indigo-600', active: 'border-indigo-500 text-indigo-700', panel: 'border-indigo-200 bg-indigo-50/60', dot: 'bg-indigo-500' },
  law: { label: 'กฎหมาย', icon: Scale, tone: 'text-orange-600', active: 'border-orange-500 text-orange-700', panel: 'border-orange-200 bg-orange-50/60', dot: 'bg-orange-500' },
};

const subjectOrder = ['english', 'thai', 'aptitude', 'it', 'correspondence', 'police-correspondence', 'social', 'law'];

function PracticeQuestion({ item, number, open, onToggle }) {
  return <div className="overflow-hidden rounded-xl border border-graylight/25 bg-white">
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-navy transition hover:bg-slate-50">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-accent-cyan/10 text-xs font-black text-accent-cyan">{number}</span>
      <span className="min-w-0 flex-1">{item.question}</span>
      <ChevronDown size={17} className={`shrink-0 text-graydark/45 transition ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="border-t border-graylight/20 bg-cyan-50/45 px-4 py-3 pl-[3.6rem] text-sm leading-6"><p className="font-bold text-emerald-700">เฉลย: {item.answer}</p><p className="mt-1 text-graydark/70">{item.explanation}</p></div>}
  </div>;
}

function TopicScope({ topic, meta, article }) {
  const keyPoints = Array.isArray(article?.key_points) && article.key_points.length ? article.key_points : topic.mustKnow;
  const focus = article?.summary || topic.focus;
  const pitfalls = article?.pitfalls || topic.traps;
  const examGuide = article?.exam_guide || topic.examStyle;

  return <section className="grid gap-4 p-4 sm:grid-cols-[1.25fr_0.75fr] sm:p-6">
    <div>
      <div className="flex items-center gap-2"><Lightbulb size={18} className="text-accent-gold" /><h3 className="font-black text-navy">สิ่งที่ต้องรู้ในหัวข้อนี้</h3></div>
      <p className="mt-2 text-sm leading-6 text-graydark/65">{focus}</p>
      <ul className="mt-4 space-y-2.5">{keyPoints.map((item) => <li key={item} className="flex gap-2.5 text-sm leading-6 text-graydark/75"><CheckCircle2 size={17} className={`mt-0.5 shrink-0 ${meta.tone}`} />{item}</li>)}</ul>
    </div>
    <aside className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
      <p className="text-xs font-black text-amber-700">จุดที่มักพลาด</p><p className="mt-2 text-sm leading-6 text-amber-900/75">{pitfalls}</p>
      <div className="mt-4 border-t border-amber-200/70 pt-3"><p className="text-xs font-black text-amber-700">แนวข้อสอบ</p><p className="mt-1 text-sm font-semibold leading-6 text-navy">{examGuide}</p></div>
    </aside>
  </section>;
}

const subjectDeepStudy = {
  english: [
    ['1. หาแกนประโยค', 'ขีดเส้นใต้ประธานและกริยาหลักก่อนเสมอ แล้วจึงดูส่วนขยายหรืออนุประโยคที่ตามมา'],
    ['2. หาเบาะแสของเวลา/ความหมาย', 'มองคำบอกเวลา คำเชื่อม และความสัมพันธ์ของผู้กระทำกับการกระทำก่อนเลือก tense หรือรูปกริยา'],
    ['3. ตัดตัวลวงตามกฎ', 'ตัดตัวเลือกที่ผิดกฎไวยากรณ์ชัดเจนก่อน แล้วค่อยเทียบความหมายของตัวเลือกที่เหลือ'],
  ],
  thai: [
    ['1. อ่านบริบททั้งประโยค', 'ภาษาไทยวัดความหมายและความเหมาะสม จึงไม่ควรตัดสินจากคำคำเดียวโดยไม่ดูผู้พูด ผู้รับ และสถานการณ์'],
    ['2. แยกหน้าที่ของคำ', 'พิจารณาว่าคำนั้นทำหน้าที่ใดในประโยค และมีความหมายตรงหรือความหมายโดยนัย'],
    ['3. ตรวจความชัดเจน', 'คำตอบที่ดีต้องถูกต้องตามหลักภาษา สื่อความตรง และเหมาะกับระดับภาษาของโจทย์'],
  ],
  aptitude: [
    ['1. แปลงโจทย์เป็นข้อมูล', 'เขียนสิ่งที่โจทย์ให้มาเป็นตัวเลข ตัวแปร หรือแผนภาพก่อนเริ่มคำนวณ'],
    ['2. ทำหน่วยและฐานให้ตรงกัน', 'ตรวจหน่วย เวลา ร้อยละ และปริมาณตั้งต้น เพราะความผิดพลาดส่วนใหญ่มาจากการเทียบฐานคนละชุด'],
    ['3. ตรวจคำตอบย้อนกลับ', 'แทนค่าหรือประเมินขนาดคำตอบอีกครั้ง เพื่อคัดคำตอบที่เกินจริงหรือผิดหน่วย'],
  ],
  it: [
    ['1. จำจากหน้าที่ ไม่ใช่ชื่อ', 'เริ่มจากถามว่าอุปกรณ์ โปรแกรม หรือบริการนั้นทำหน้าที่อะไร แล้วจึงจับคู่กับคำศัพท์'],
    ['2. แยกชั้นของระบบ', 'แยกฮาร์ดแวร์ ซอฟต์แวร์ เครือข่าย และข้อมูลออกจากกันก่อน เพื่อไม่ให้คำตอบข้ามระดับ'],
    ['3. ยึดหลักความปลอดภัย', 'เมื่อเป็นโจทย์สถานการณ์ ให้เลือกแนวทางที่ป้องกันความเสี่ยง ลดการเปิดเผยข้อมูล และตรวจสอบได้'],
  ],
  correspondence: [
    ['1. ดูคู่สื่อสารและวัตถุประสงค์', 'ให้ระบุว่าใครส่งถึงใคร และต้องการสื่อสารเพื่ออะไร ก่อนเลือกประเภทหนังสือหรือขั้นตอนงาน'],
    ['2. ไล่ตามวงจรเอกสาร', 'คิดเป็นลำดับ รับ → ลงทะเบียน → เสนอ → สั่งการ → ส่ง → เก็บรักษา เพื่อไม่ข้ามขั้นตอน'],
    ['3. ยึดความชัดเจนและตรวจสอบได้', 'ภาษาราชการที่ดีต้องสุภาพ กระชับ มีข้อเท็จจริง และติดตามที่มา/ผู้รับผิดชอบได้'],
  ],
  'police-correspondence': [
    ['1. ระบุชนิดงานเอกสารก่อน', 'แยกให้ออกว่าโจทย์ถามเรื่องการรับ–ส่ง การคัดสำเนา การลงทะเบียน หนังสือราชการ หรือข้อมูลเฉพาะของตำรวจ เพราะแต่ละงานใช้ขั้นตอนและถ้อยคำต่างกัน'],
    ['2. เรียงลำดับการปฏิบัติงาน', 'อ่านผู้ส่ง ผู้รับ วัตถุประสงค์ และสถานะของหนังสือ แล้วเทียบกับลำดับรับ → ลงทะเบียน → เสนอ → สั่งการ → ส่ง → เก็บรักษา โดยไม่ข้ามขั้นตอนสำคัญ'],
    ['3. ตรวจอำนาจและความถูกต้อง', 'ก่อนตอบให้ตรวจผู้มีอำนาจลงนาม ระดับความเร็วหรือชั้นความลับ และข้อมูลอ้างอิงที่ต้องปรากฏในเอกสารเสมอ'],
  ],
  law: [
    ['1. แยกข้อเท็จจริงจากข้อกฎหมาย', 'จับว่าใครทำอะไร เมื่อใด ต่อใคร แล้วจึงหาองค์ประกอบหรือหลักกฎหมายที่เกี่ยวข้อง'],
    ['2. ตรวจองค์ประกอบทีละชั้น', 'พิจารณาการกระทำ เจตนา/หน้าที่ ผลที่เกิด และเหตุยกเว้นตามลำดับ ไม่ข้ามไปสรุปผลทันที'],
    ['3. ตอบตามข้อเท็จจริงในโจทย์', 'อย่าเติมเหตุการณ์เอง และระวังตัวเลือกที่ใช้คำคล้ายหลักกฎหมายแต่ขาดเงื่อนไขสำคัญ'],
  ],
};

function DeepLesson({ topic, subjectId, meta, article }) {
  const steps = subjectDeepStudy[subjectId];

  return <section className="p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><SearchCheck size={18} className={meta.tone} /><h3 className="font-black text-navy">บทเรียนเชิงลึก: {topic.label}</h3></div><p className="mt-2 max-w-3xl text-sm leading-6 text-graydark/65">{topic.focus} ให้มองหัวข้อนี้เป็น “หลักคิด” ก่อนจำรายละเอียด เพราะข้อสอบมักเปลี่ยนรูปแบบโจทย์ แต่ยังใช้แกนความรู้เดิม</p></div><span className={`rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black ${meta.tone}`}>อ่านอย่างเป็นระบบ</span></div>

    <div className="mt-5 grid gap-3 md:grid-cols-3">{steps.map(([title, description], index) => <div key={title} className="rounded-2xl border border-graylight/25 bg-slate-50/70 p-4"><span className={`grid h-7 w-7 place-items-center rounded-lg bg-white text-xs font-black shadow-sm ${meta.tone}`}>{index + 1}</span><h4 className="mt-3 text-sm font-black text-navy">{title}</h4><p className="mt-1.5 text-sm leading-6 text-graydark/65">{description}</p></div>)}</div>

    <div className="mt-5 rounded-2xl border border-graylight/25 bg-white"><div className="border-b border-graylight/20 px-4 py-3"><p className="text-sm font-black text-navy">เชื่อมความรู้ให้ตอบโจทย์ได้</p><p className="mt-0.5 text-xs text-graydark/55">อย่าจำเป็นรายการแยก ให้เชื่อมแต่ละประเด็นเข้าหากัน</p></div><div className="divide-y divide-graylight/20">{topic.mustKnow.map((item, index) => <div key={item} className="flex gap-3 px-4 py-3"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black ${meta.tone} bg-slate-100`}>{index + 1}</span><p className="text-sm leading-6 text-graydark/75">{item}</p></div>)}</div></div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-rose-100 bg-rose-50/55 p-4"><p className="text-xs font-black text-rose-600">ตัวลวงที่ต้องระวัง</p><p className="mt-2 text-sm leading-6 text-rose-900/75">{topic.traps}</p></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50/55 p-4"><p className="text-xs font-black text-emerald-700">ใช้กับข้อสอบอย่างไร</p><p className="mt-2 text-sm leading-6 text-emerald-900/75">เมื่อเจอโจทย์ ให้เรียกใช้หัวข้อนี้เพื่อ {topic.examStyle}</p></div></div>

    {article && <div className="mt-5 border-t border-graylight/20 pt-5"><p className={`text-xs font-black ${meta.tone}`}>สรุปเฉพาะหัวข้อเพิ่มเติม</p><p className="mt-1 text-sm leading-6 text-graydark/65">หัวข้อนี้มีเนื้อหาขยายพร้อมตัวอย่างและคำถามทบทวนด้านล่างแล้ว สามารถอ่านต่อเพื่อฝึกวิธีคิดกับโจทย์จริงได้</p></div>}
  </section>;
}

function ArticleDetail({ article, meta }) {
  return <section className="p-4 sm:p-6">
    <div className="flex items-center gap-2"><ListChecks size={18} className={meta.tone} /><h3 className="font-black text-navy">สรุปย่อและวิธีคิด</h3></div>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-graydark/65">{article.summary}</p>
    <div className="mt-5 grid gap-3">{article.formulas.map((formula) => <div key={formula.label} className="rounded-xl border border-graylight/25 bg-slate-50/70 px-4 py-3"><p className={`text-xs font-bold ${meta.tone}`}>{formula.label}</p><code className="mt-1 block break-words font-mono text-sm font-bold text-navy sm:text-base">{formula.value}</code><p className="mt-1 text-xs leading-5 text-graydark/60">{formula.note}</p></div>)}</div>
    <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4"><p className="text-xs font-bold text-accent-cyan">{article.example.title}</p><p className="mt-2 font-semibold leading-6 text-navy">{article.example.question}</p><div className="mt-3 rounded-xl bg-white px-4 py-3"><p className="text-sm font-bold text-emerald-700">คำตอบ: {article.example.answer}</p><p className="mt-1 text-sm leading-6 text-graydark/65">{article.example.explanation}</p></div></div>
  </section>;
}

function ManagedArticleDetail({ article, meta }) {
  const paragraphs = article.body.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const keyPoints = Array.isArray(article.key_points) ? article.key_points : [];

  return <section className="p-4 sm:p-6">
    <div className="flex items-center gap-2"><BookOpen size={18} className={meta.tone} /><h3 className="font-black text-navy">{article.title}</h3></div>
    {article.summary && <p className="mt-2 max-w-3xl text-sm leading-6 text-graydark/65">{article.summary}</p>}
    <div className="mt-5 space-y-4 text-sm leading-7 text-graydark/75">{paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</div>
    {(keyPoints.length > 0 || article.pitfalls || article.exam_guide) && <div className="mt-6 grid gap-3 lg:grid-cols-3">
      {keyPoints.length > 0 && <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-4 lg:col-span-1"><p className={`text-xs font-black ${meta.tone}`}>ประเด็นสำคัญ</p><ul className="mt-3 space-y-2 text-sm leading-6 text-graydark/75">{keyPoints.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 size={16} className={`mt-1 shrink-0 ${meta.tone}`} />{item}</li>)}</ul></div>}
      {article.pitfalls && <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4"><p className="text-xs font-black text-amber-700">จุดที่มักพลาด</p><p className="mt-2 text-sm leading-6 text-amber-900/75">{article.pitfalls}</p></div>}
      {article.exam_guide && <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"><p className="text-xs font-black text-indigo-700">แนวข้อสอบ</p><p className="mt-2 text-sm leading-6 text-indigo-950/75">{article.exam_guide}</p></div>}
    </div>}
  </section>;
}

function getKnowledgeScope(subjectId, catalogTopics) {
  const fallbackScope = knowledgeSubjectScopes[subjectId];
  const databaseTopics = (catalogTopics || []).filter((item) => item.subject_id === subjectId);
  if (!databaseTopics.length) return fallbackScope;

  const fallbackTopics = new Map(fallbackScope.topics.map((item) => [item.id, item]));
  const topics = databaseTopics.map((item) => {
    const fallbackTopic = fallbackTopics.get(item.legacy_id);
    if (fallbackTopic) {
      return {
        ...fallbackTopic,
        databaseTopicId: item.id,
        label: item.name || fallbackTopic.label,
        focus: item.description || fallbackTopic.focus,
      };
    }

    return {
      id: item.legacy_id || item.id,
      databaseTopicId: item.id,
      label: item.name,
      focus: item.description || 'ทบทวนคำสำคัญ หลักการ และแนวโจทย์ของหมวดนี้ตามขอบเขตข้อสอบ',
      mustKnow: ['คำจำกัดความและขอบเขตของหัวข้อ', 'หลักเกณฑ์หรือขั้นตอนที่เกี่ยวข้อง', 'คำสำคัญที่ใช้แยกตัวเลือกในข้อสอบ'],
      traps: 'อ่านคำถามให้ครบและเปรียบเทียบเงื่อนไขของแต่ละตัวเลือกกับขอบเขตหัวข้อนี้',
      examStyle: 'วิเคราะห์สถานการณ์หรือเลือกหลักการที่ถูกต้องตามหัวข้อ',
      articleId: null,
    };
  });

  return { ...fallbackScope, topics };
}

export default function KnowledgeLibrary() {
  const [subjectId, setSubjectId] = useState('thai');
  const [topicId, setTopicId] = useState('thai-figures');
  const [view, setView] = useState('overview');
  const [openPractice, setOpenPractice] = useState(null);
  const [catalogTopics, setCatalogTopics] = useState([]);
  const [catalogArticles, setCatalogArticles] = useState([]);
  const [catalogSynced, setCatalogSynced] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/knowledge')
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (!active || !Array.isArray(result?.topics)) return;
        setCatalogTopics(result.topics);
        setCatalogArticles(Array.isArray(result.articles) ? result.articles : []);
        setCatalogSynced(result.topics.length > 0);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const scope = useMemo(() => getKnowledgeScope(subjectId, catalogTopics), [subjectId, catalogTopics]);
  const topic = scope.topics.find((item) => item.id === topicId) || scope.topics[0];
  const staticArticle = useMemo(() => knowledgeArticles.find((item) => item.id === topic.articleId) || null, [topic.articleId]);
  const databaseArticle = useMemo(() => (
    catalogArticles.find((item) => item.topic_id === topic.databaseTopicId)
    || catalogArticles.find((item) => item.subject_id === subjectId && item.topic_id === null)
    || null
  ), [catalogArticles, subjectId, topic.databaseTopicId]);
  const article = databaseArticle || staticArticle;
  const meta = subjectMeta[subjectId];
  const SubjectIcon = meta.icon;

  function selectSubject(id) {
    setSubjectId(id);
    setTopicId(knowledgeSubjectScopes[id].topics[0].id);
    setView('overview');
    setOpenPractice(null);
  }

  function selectTopic(id) {
    setTopicId(id);
    setView('overview');
    setOpenPractice(null);
  }

  const views = [
    { id: 'overview', label: 'ขอบเขต', icon: ClipboardCheck },
    { id: 'detail', label: article ? 'สรุปเนื้อหา' : 'จุดที่ต้องเน้น', icon: SearchCheck },
    { id: 'practice', label: 'แนวฝึก', icon: ListChecks },
  ];

  return <div className="pb-5 no-copy" {...noCopyHandlers}>
    <header className="mb-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-cyan"><Sparkles size={14} />ขอบเขตการอ่านสำหรับนักเรียนนายสิบตำรวจ</span><h1 className="mt-1 text-2xl font-black tracking-tight text-navy sm:text-3xl">คลังความรู้</h1><p className="mt-1 max-w-2xl text-sm text-graydark/60">เลือกวิชา → เลือกหัวข้อย่อย → อ่านเฉพาะประเด็นที่ต้องใช้ทำข้อสอบ</p></div><span className="rounded-xl border border-graylight/25 bg-white px-3 py-2 text-xs font-semibold text-graydark/55">{catalogSynced ? 'ซิงก์หมวดจากคลังข้อสอบแล้ว' : 'อัปเดตตามขอบเขตสอบ'}</span></div></header>

    <section aria-label="เลือกวิชา" className="border-y border-graylight/25 bg-white"><div className="grid grid-cols-2 sm:flex sm:flex-wrap"><div className="hidden sm:block sm:flex-1" />{subjectOrder.map((id) => { const item = subjectMeta[id]; const Icon = item.icon; const active = id === subjectId; return <button key={id} type="button" onClick={() => selectSubject(id)} className={`relative flex min-w-0 items-center justify-center gap-2 border-b-2 px-2 py-3 text-xs font-bold transition sm:px-4 sm:text-sm ${active ? item.active : 'border-transparent text-graydark/55 hover:bg-slate-50 hover:text-navy'}`}><Icon size={16} className={active ? item.tone : 'text-graydark/35'} /><span className="truncate">{item.label}</span>{active && <span className={`absolute inset-x-3 -bottom-[2px] h-0.5 rounded-full ${item.dot}`} />}</button>; })}<div className="hidden sm:block sm:flex-1" /></div></section>

    <section className="mt-4 rounded-2xl bg-slate-100/90 p-2.5 sm:p-3"><div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-2"><p className="text-xs font-semibold text-graydark/50">หัวข้อในวิชา {meta.label}</p><span className={`rounded-full bg-white px-2.5 py-1 text-xs font-black ${meta.tone}`}>{scope.examWeight} ในชุดข้อสอบระบบ</span></div><div className="flex flex-wrap gap-2">{scope.topics.map((item) => { const selected = item.id === topic.id; return <button key={item.id} type="button" onClick={() => selectTopic(item.id)} className={`inline-flex max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${selected ? 'border-white bg-white text-navy shadow-sm' : 'border-transparent text-graydark/60 hover:bg-white/70 hover:text-navy'}`}><SubjectIcon size={15} className={selected ? meta.tone : 'text-graydark/35'} /><span className="truncate">{item.label}</span></button>; })}</div></section>

    <section className={`mt-5 rounded-3xl border bg-gradient-to-br p-5 sm:p-7 ${meta.panel}`}><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm"><SubjectIcon size={22} className={meta.tone} /></span><div className="min-w-0"><p className={`text-sm font-bold ${meta.tone}`}>{scope.label} · {scope.examWeight}</p><h2 className="mt-1 text-xl font-black leading-snug text-navy sm:text-2xl">{topic.label}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-graydark/70">{topic.focus}</p></div></div><p className="mt-4 border-t border-white/80 pt-3 text-xs leading-5 text-graydark/55"><strong className="text-graydark/75">ขอบเขตรายวิชา:</strong> {scope.summary}</p></section>

    <section aria-label="รูปแบบเนื้อหา" className="mt-5 flex w-fit max-w-full overflow-x-auto rounded-2xl bg-slate-100 p-1.5 [scrollbar-width:none]">{views.map((item) => { const Icon = item.icon; const active = view === item.id; return <button key={item.id} type="button" onClick={() => { setView(item.id); setOpenPractice(null); }} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${active ? 'bg-white text-navy shadow-sm' : 'text-graydark/55 hover:text-navy'}`}><Icon size={16} className={active ? meta.tone : ''} />{item.label}</button>; })}</section>

    <article className="mt-4 overflow-hidden rounded-2xl border border-graylight/30 bg-white shadow-sm">
      {view === 'overview' && <TopicScope topic={topic} meta={meta} article={databaseArticle} />}
      {view === 'detail' && (databaseArticle ? <ManagedArticleDetail article={databaseArticle} meta={meta} /> : <><DeepLesson topic={topic} subjectId={subjectId} meta={meta} article={staticArticle} />{staticArticle && <ArticleDetail article={staticArticle} meta={meta} />}</>)}
      {view === 'practice' && <section className="p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-black text-navy">แนวฝึกหัวข้อ {topic.label}</h3><p className="mt-1 text-sm text-graydark/55">{staticArticle ? 'ลองคิดก่อน แล้วกดเปิดดูเฉลย' : 'อ่านบทเรียนแล้วไปทำแบบฝึกวิชานี้ เพื่อเลือกชุดข้อสอบที่แอดมินเผยแพร่'}</p></div>{staticArticle && <span className={`rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold ${meta.tone}`}>{staticArticle.practices.length} ข้อ</span>}</div>{staticArticle ? <div className="mt-4 space-y-2.5">{staticArticle.practices.map((item, index) => <PracticeQuestion key={item.question} item={item} number={index + 1} open={openPractice === index} onToggle={() => setOpenPractice((current) => current === index ? null : index)} />)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-graylight/50 bg-slate-50/70 p-5"><p className="font-bold text-navy">พร้อมฝึกจากคลังข้อสอบรายวิชา</p><p className="mt-1 text-sm leading-6 text-graydark/60">บทเรียนนี้เชื่อมกับหมวดย่อยในคลังข้อสอบแล้ว เลือกชุดข้อสอบที่ผู้ดูแลเผยแพร่เพื่อฝึกต่อได้</p><Link href={`/practice/${subjectId}`} className="btn-navy mt-4 inline-flex items-center gap-2">ไปทำแบบฝึกวิชานี้ <ArrowRight size={16} /></Link></div>}</section>}
      <div className="flex flex-col gap-3 border-t border-graylight/20 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-xs leading-5 text-graydark/50">ประกาศรับสมัครและคุณสมบัติของหน่วยงานในรอบสอบนั้น เป็นเกณฑ์ขอบเขตที่ใช้ยืนยันสุดท้าย</p><Link href={`/practice/${subjectId}`} className="btn-navy inline-flex shrink-0 items-center justify-center gap-2">ฝึกข้อสอบวิชานี้ <ArrowRight size={16} /></Link></div>
    </article>
  </div>;
}
