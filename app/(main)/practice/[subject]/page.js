'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock3, ListChecks, Search, Check, Lock, Sparkles, X } from 'lucide-react';
import { resolveSubjects } from '@/lib/subjectCatalog';
import { getSubjectStyle, subjectStyles } from '@/lib/subjectStyles';
import { useProgressStats } from '@/lib/useProgressStats';
import { useMembershipStatus } from '@/lib/useMembershipStatus';
import { useExamCatalog } from '@/lib/useExamCatalog';
import PracticeFilter, { EMPTY_FILTER } from '@/components/PracticeFilter';

const PASS_PCT = 60; // เกณฑ์ผ่านของแบบฝึกหัดรายชุด
// ต้องเป็น reference คงที่ — ถ้าใช้ `{}` ตรง ๆ ตรง fallback จะได้ object ใหม่ทุก render
// ทำให้ subjectTopics (useMemo ด้านล่าง) คำนวณใหม่ทุกครั้ง จนเข้าลูป render ไม่รู้จบ
const EMPTY_TOPIC_COUNTS = {};

function SetCard({ topic, attempt, isMember, isLoggedIn, accessLoading, databaseQuestionCount }) {
  const style = getSubjectStyle(topic.subjectId);
  const pct = attempt ? Math.round((attempt.score / attempt.total) * 100) : null;
  const passed = pct !== null && pct >= PASS_PCT;
  // API ส่งสถานะทดลองใช้ฟรีตามกติกาสิทธิ์เดียวกับฝั่งเซิร์ฟเวอร์
  // จึงครอบคลุมทั้ง flag ในฐานข้อมูลและหัวข้อทดลองใช้เดิม
  const isFreeTrial = Boolean(topic.isFreePractice);
  const hasDatabaseQuestions = Number.isFinite(databaseQuestionCount) && databaseQuestionCount > 0;
  const questionCount = hasDatabaseQuestions ? databaseQuestionCount : topic.questionCount;
  const isAvailable = topic.available || hasDatabaseQuestions;
  const canStart = isAvailable && !accessLoading && (isMember || (isFreeTrial && isLoggedIn));
  const lockedForMember = isAvailable && !accessLoading && !canStart;

  const SubjectIcon = style.icon;

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_6px_22px_rgba(30,64,100,0.08)] transition duration-300 ${
      isAvailable
        ? 'border-graylight/25 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_16px_34px_rgba(30,64,100,0.16)]'
        : 'border-graylight/20 opacity-75'
    }`}>
      {/* แถบสีประจำวิชาด้านบน ทำให้กวาดตาแยกวิชาได้เร็วขึ้นเวลาการ์ดเยอะ ๆ */}
      <span className={`h-1.5 w-full shrink-0 ${isAvailable ? style.color : 'bg-graylight/30'}`} />

      {attempt ? (
        <div className={`flex items-center justify-between gap-2 px-4 py-2 text-xs font-semibold text-white ${passed ? 'bg-emerald-600' : 'bg-orange-500'}`}>
          <span className="flex items-center gap-1.5"><Check size={13} /> เคยทำแล้ว</span>
          <span>{attempt.score}/{attempt.total} · {passed ? 'ผ่าน' : 'ไม่ผ่าน'}</span>
        </div>
      ) : (
        <div className={`h-1 w-full ${isAvailable ? 'bg-gradient-to-r from-transparent via-slate-100 to-transparent' : ''}`} />
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 ${isAvailable ? `${style.color} group-hover:scale-105` : 'bg-graylight/40'}`}>
            <SubjectIcon size={20} />
          </span>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.chip}`}>{style.short}</span>
            {!isAvailable && (
              <span className="flex items-center gap-1 rounded-full bg-graylight/20 px-2 py-0.5 text-[10px] font-semibold text-graydark/50"><Lock size={9} /> เร็วๆ นี้</span>
            )}
            {isAvailable && isFreeTrial && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><Sparkles size={9} /> ทดลองฟรี</span>
            )}
            {lockedForMember && !isFreeTrial && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700"><Lock size={9} /> สมาชิก</span>
            )}
          </div>
        </div>

        <h3 className="mb-1 font-bold leading-snug text-navy">{topic.name}</h3>
        <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-graydark/50">{topic.description}</p>

        {isAvailable && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-graydark/70">
              <ListChecks size={12} /> {questionCount} ข้อ
            </span>
            {hasDatabaseQuestions && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">
                <Clock3 size={12} /> ไม่จับเวลา
              </span>
            )}
          </div>
        )}

        <div className="mt-auto">
          {canStart ? (
            <Link
              href={`/exam/${topic.subjectId}?topic=${topic.id}`}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white shadow-sm transition ${style.color} hover:opacity-90 hover:shadow-md`}
            >
              {attempt ? 'ทำอีกครั้ง' : 'ทำข้อสอบ'}
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          ) : isAvailable && accessLoading ? (
            <span className="block rounded-xl bg-graylight/15 py-2.5 text-center text-sm font-medium text-graydark/40">กำลังตรวจสอบสิทธิ์</span>
          ) : isAvailable ? (
            <Link
              href={isLoggedIn ? '/account' : '/login'}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/60 py-2.5 text-center text-sm font-bold text-amber-700 transition hover:bg-amber-100"
            >
              <Lock size={14} />
              {isLoggedIn ? 'ปลดล็อกสมาชิก' : isFreeTrial ? 'เข้าสู่ระบบเพื่อทดลอง' : 'เข้าสู่ระบบ'}
            </Link>
          ) : (
            <span className="block cursor-not-allowed rounded-xl bg-graylight/20 py-2.5 text-center text-sm font-medium text-graydark/40">ยังไม่เปิดให้ทำ</span>
          )}
        </div>
      </div>
    </div>
  );
}

// หัวข้อที่มีหัวข้อย่อยข้างในจะกลายเป็น "หัวเรื่องกลุ่ม" ส่วนหัวข้อปลายทางจะเป็นการ์ด
// เรียงตามลำดับที่แอดมินกำหนดไว้ในหลังบ้าน และซ้อนได้หลายชั้น
function TopicTreeSection({ nodes, depth = 0, progress, isMember, isLoggedIn, accessLoading, topicQuestionCounts }) {
  const cards = nodes.filter((node) => node.children.length === 0);
  const branches = nodes.filter((node) => node.children.length > 0);

  return (
    <div className={depth === 0 ? 'space-y-7' : 'space-y-5'}>
      {cards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((node) => (
            <SetCard
              key={node.id}
              topic={node}
              attempt={progress?.[node.id] ?? null}
              isMember={isMember}
              isLoggedIn={isLoggedIn}
              accessLoading={accessLoading}
              databaseQuestionCount={topicQuestionCounts[node.id]}
            />
          ))}
        </div>
      )}

      {branches.map((node, index) => (
        <details key={node.id} open={depth > 0 || index === 0} className={depth === 0 ? 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5' : 'rounded-xl border border-slate-100 bg-slate-50/50 p-3'}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className={`h-5 w-1 shrink-0 rounded-full ${depth === 0 ? 'bg-accent-cyan' : 'bg-accent-gold'}`} />
              <span className={`truncate ${depth === 0 ? 'font-bold text-navy' : 'text-sm font-semibold text-graydark'}`}>{node.name}</span>
            </span>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-graydark/60">{node.children.length} หัวข้อ</span>
          </summary>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <TopicTreeSection
              nodes={node.children}
              depth={depth + 1}
              progress={progress}
              isMember={isMember}
              isLoggedIn={isLoggedIn}
              accessLoading={accessLoading}
              topicQuestionCounts={topicQuestionCounts}
            />
          </div>
        </details>
      ))}
    </div>
  );
}

function FreePracticeCard({ topic, subject, isLoggedIn }) {
  const style = getSubjectStyle(subject.id, subject.shortName);
  const href = isLoggedIn
    ? `/exam/${topic.subjectId}?topic=${topic.id}`
    : '/login';

  return (
    <article className="max-w-md overflow-hidden rounded-3xl border border-graylight/25 bg-white shadow-[0_12px_28px_rgba(30,64,100,0.12)]">
      <div className="p-6">
        <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${style.chip}`}>
          {style.short}
        </span>
        <h2 className="mt-4 text-lg font-bold text-navy">ข้อสอบแจกฟรี {style.short}</h2>
        <p className="mt-1 text-sm text-graydark/55">วิชา: {subject.name}</p>
      </div>
      <div className="border-t border-graylight/20 bg-slate-50/50 p-4">
        <Link
          href={href}
          className="block rounded-2xl bg-navy py-3 text-center text-base font-semibold text-white transition hover:bg-navy/90"
        >
          {isLoggedIn ? 'ทำข้อสอบ' : 'เข้าสู่ระบบเพื่อทำข้อสอบ'}
        </Link>
      </div>
    </article>
  );
}

export default function SubjectTopicsPage() {
  const { subject: subjectId } = useParams();
  const style = getSubjectStyle(subjectId);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(EMPTY_FILTER);
  // ความก้าวหน้ามาจาก exam_attempts ในฐานข้อมูล ไม่ใช่ localStorage — ล้างจากหลังบ้านได้และ sync ข้ามอุปกรณ์
  const { loading: progressLoading, topicProgress } = useProgressStats();
  const progress = progressLoading ? null : topicProgress;
  const { loading: accessLoading, isLoggedIn, isMember } = useMembershipStatus();
  const { data: examCatalog } = useExamCatalog('practice', subjectId);
  const topicQuestionCounts = examCatalog?.topicQuestionCounts || EMPTY_TOPIC_COUNTS;
  // ชื่อ/คำอธิบายวิชายึดตามฐานข้อมูล เพื่อให้ตรงกับที่แอดมินตั้งไว้
  const catalogSubjects = useMemo(() => resolveSubjects(examCatalog?.subjects), [examCatalog]);
  const subject = catalogSubjects.find((item) => item.id === subjectId) || null;
  // แสดงเฉพาะหัวข้อที่แอดมินสร้างไว้จริงในฐานข้อมูล — ไม่ fallback ไปใช้รายการ hardcode เดิม
  // ไม่งั้นตอนคลังว่างจะขึ้นการ์ดหลอกที่กดทำไม่ได้เต็มหน้า
  const subjectTopics = useMemo(() => (examCatalog?.topics || [])
    .filter((topic) => topic.subject_id === subjectId)
    .map((topic) => {
      const id = topic.legacy_id || topic.id;
      return {
        id,
        rowId: topic.id,
        parentId: topic.parent_id || '',
        subjectId,
        sortOrder: topic.sort_order ?? 0,
        name: topic.name,
        description: topic.description || 'แบบฝึกหัดตามหัวข้อที่ผู้ดูแลกำหนด',
        questionCount: topicQuestionCounts[id] || 0,
        available: (topicQuestionCounts[id] || 0) > 0,
        isFreePractice: Boolean(topic.is_free_practice),
      };
    }), [examCatalog, subjectId, topicQuestionCounts]);

  // จัดหัวข้อเป็นลำดับชั้นตามที่แอดมินกำหนด: หัวข้อหลัก = หัวเรื่องของกลุ่มการ์ด, หัวข้อย่อย = การ์ด
  const topicTree = useMemo(() => {
    const byParent = new Map();
    for (const item of subjectTopics) {
      const key = item.parentId || '__root__';
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(item);
    }
    const sortNodes = (list) => [...list].sort((a, b) => (
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'th')
    ));
    const attach = (key) => sortNodes(byParent.get(key) || []).map((item) => ({
      ...item,
      children: attach(item.rowId),
    }));
    return attach('__root__');
  }, [subjectTopics]);

  // เปลี่ยนวิชา = ล้างตัวกรองเดิม ไม่งั้นจะเหลือหมวดย่อยของวิชาก่อนหน้าค้างอยู่
  useEffect(() => {
    setFilter(EMPTY_FILTER);
    setQuery('');
  }, [subjectId]);

  const matchesFilter = useCallback((t) => {
    const q = query.trim().toLowerCase();
    if (filter.topics.length > 0 && !filter.topics.includes(t.id)) return false;
    if (progress && filter.status !== 'all') {
      const done = Boolean(progress[t.id]);
      if (filter.status === 'done' && !done) return false;
      if (filter.status === 'undone' && done) return false;
    }
    if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
    return true;
  }, [query, filter, progress]);

  // ตัดกิ่งที่ไม่ตรงตัวกรองออก แต่เก็บหัวข้อแม่ไว้ถ้ายังมีลูกที่ตรงอยู่ ไม่งั้นการ์ดจะลอยไม่มีหัวเรื่อง
  const filteredTree = useMemo(() => {
    const prune = (nodes) => nodes.reduce((kept, node) => {
      const children = prune(node.children);
      if (matchesFilter(node) || children.length > 0) kept.push({ ...node, children });
      return kept;
    }, []);
    return prune(topicTree);
  }, [topicTree, matchesFilter]);

  const filteredCount = useMemo(() => {
    const count = (nodes) => nodes.reduce((total, node) => total + 1 + count(node.children), 0);
    return count(filteredTree);
  }, [filteredTree]);

  const freeTopic = useMemo(
    () => subjectTopics.find((topic) => topic.available && topic.isFreePractice) ?? null,
    [subjectTopics],
  );

  if (!subject) {
    return (
      <div>
        <p className="text-graydark mb-4">ไม่พบวิชานี้</p>
        <Link href="/practice" className="text-accent-cyan underline">
          กลับไปเลือกวิชา
        </Link>
      </div>
    );
  }

  const Icon = style.icon;
  const attemptedCount = progress ? subjectTopics.filter((t) => progress[t.id]).length : 0;
  const overallPct = subjectTopics.length
    ? Math.round((attemptedCount / subjectTopics.length) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
        <div className={`rounded-2xl p-6 text-white flex-1 min-w-[280px] shadow-[0_16px_40px_rgba(30,64,100,0.14)] ${style.color}`}>
          <Link
            href="/practice"
            className="group mb-5 inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15 transition-transform group-hover:-translate-x-0.5">
              <ArrowLeft size={15} />
            </span>
            กลับไปเลือกวิชา
          </Link>
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
            <Icon size={20} />
          </div>
          <h1 className="text-xl font-semibold mb-1">{subject.name}</h1>
          <p className="text-sm text-white/75">{subject.description}</p>
        </div>

        <div className="app-card p-5 min-w-[240px]">
          <p className="text-xs text-graydark/50 mb-2">ความก้าวหน้าวิชานี้</p>
          <div className="flex items-center gap-3 mb-3">
            <p className="text-3xl font-bold text-navy">{progress ? `${overallPct}%` : '—'}</p>
            <Link
              href="/profile"
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20"
            >
              ดูรายงานผล
            </Link>
          </div>
          <div className="h-1.5 bg-graylight/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-cyan transition-all"
              style={{ width: `${progress ? overallPct : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-graydark/40 mt-2">
            ทำแล้ว {attemptedCount} จาก {subjectTopics.length} ชุด
          </p>
        </div>
      </div>

      <div className="flex items-stretch gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-graydark/40 pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`ค้นหาชุดข้อสอบในวิชา${subject.name}...`}
            className="w-full h-full border border-graylight/30 rounded-xl pl-11 pr-10 py-3 text-sm text-graydark placeholder:text-graydark/40 focus:outline-none focus:border-accent-cyan"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="ล้างคำค้นหา"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-graydark/40 hover:text-navy"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <PracticeFilter value={filter} onChange={setFilter} scopeSubjectId={subjectId} topicItems={subjectTopics} subjectItems={catalogSubjects} />
      </div>

      {!accessLoading && !isMember && (
        <section className="mb-7">
          <div className="mb-3 flex items-center gap-2"><Sparkles size={17} className="text-accent-cyan" /><h2 className="font-semibold text-navy">เริ่มฝึกได้ฟรี</h2></div>
          {freeTopic ? (
            <FreePracticeCard topic={freeTopic} subject={subject} isLoggedIn={isLoggedIn} />
          ) : (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-graydark/65">กำลังเตรียมข้อสอบแจกฟรีสำหรับวิชานี้</div>
          )}
        </section>
      )}

      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-semibold text-navy">
          ชุดข้อสอบ{' '}
          <span className="text-sm font-normal text-graydark/40">({filteredCount} ชุด)</span>
        </h2>
        {(filter.topics.length > 0 || filter.status !== 'all' || query.trim() !== '') && (
          <button
            onClick={() => {
              setFilter(EMPTY_FILTER);
              setQuery('');
            }}
            className="flex items-center gap-1 text-xs text-graydark/50 hover:text-navy"
          >
            <X size={13} />
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {subjectTopics.length === 0 ? (
        <div className="border border-dashed border-graylight/40 rounded-2xl p-12 text-center">
          <p className="text-graydark/50 mb-1">ยังไม่มีชุดข้อสอบในวิชานี้</p>
          <p className="text-sm text-graydark/40">ผู้ดูแลระบบกำลังเตรียมเนื้อหา กลับมาดูใหม่อีกครั้งเร็ว ๆ นี้</p>
        </div>
      ) : filteredTree.length === 0 ? (
        <div className="border border-dashed border-graylight/40 rounded-2xl p-12 text-center">
          <p className="text-graydark/50 mb-1">ไม่พบชุดข้อสอบที่ตรงกับการค้นหา</p>
          <p className="text-sm text-graydark/40">ลองเปลี่ยนคำค้นหาดูอีกครั้ง</p>
        </div>
      ) : (
        <TopicTreeSection
          nodes={filteredTree}
          progress={progress}
          isMember={isMember}
          isLoggedIn={isLoggedIn}
          accessLoading={accessLoading}
          topicQuestionCounts={topicQuestionCounts}
        />
      )}
    </div>
  );
}
