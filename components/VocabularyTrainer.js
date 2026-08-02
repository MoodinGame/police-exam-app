'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Layers3,
  RotateCcw,
  Search,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Target,
  Scale,
  FileText,
  Cpu,
  Calculator,
  BookText,
  Globe,
} from 'lucide-react';
import { OXFORD_3000_TARGET, OXFORD_CEFR_LEVELS, vocabularyCards as fallbackVocabularyCards, vocabularyDecks as fallbackVocabularyDecks, vocabularyByDeck } from '@/lib/vocabulary';
import { getVocabularyProgress, getVocabularyStats, saveVocabularyProgress } from '@/lib/vocabularyProgress';

function DeckIcon({ deck, size = 18 }) {
  const icons = {
    book: BookOpenCheck,
    shield: ShieldCheck,
    scale: Scale,
    file: FileText,
    cpu: Cpu,
    calculator: Calculator,
    thai: BookText,
    english: Globe,
  };
  const Icon = icons[deck.icon] || BookOpenCheck;
  return <Icon size={size} />;
}

function seededOrder(items, seed) {
  const hash = (value) => [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
  return [...items].sort((a, b) => hash(`${a.id}-${seed}`) - hash(`${b.id}-${seed}`));
}

function progressForCard(progress, cardId) {
  return progress.cards?.[cardId]?.status || null;
}

function deckColors(deck) {
  const tones = {
    navy: { selected: 'bg-navy text-white border-navy', surface: 'border-navy/25 bg-navy/5', icon: 'bg-navy/10 text-navy', bar: 'bg-navy' },
    emerald: { selected: 'bg-emerald-600 text-white border-emerald-600', surface: 'border-emerald-200 bg-emerald-50/65', icon: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
    sky: { selected: 'bg-sky-600 text-white border-sky-600', surface: 'border-sky-200 bg-sky-50/65', icon: 'bg-sky-100 text-sky-700', bar: 'bg-sky-500' },
    teal: { selected: 'bg-teal-600 text-white border-teal-600', surface: 'border-teal-200 bg-teal-50/65', icon: 'bg-teal-100 text-teal-700', bar: 'bg-teal-500' },
    rose: { selected: 'bg-rose-600 text-white border-rose-600', surface: 'border-rose-200 bg-rose-50/65', icon: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' },
    purple: { selected: 'bg-purple-600 text-white border-purple-600', surface: 'border-purple-200 bg-purple-50/65', icon: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
    violet: { selected: 'bg-violet-600 text-white border-violet-600', surface: 'border-violet-200 bg-violet-50/65', icon: 'bg-violet-100 text-violet-700', bar: 'bg-violet-500' },
    cyan: { selected: 'bg-navy text-white border-navy', surface: 'border-cyan-200 bg-cyan-50/65', icon: 'bg-cyan-100 text-cyan-700', bar: 'bg-accent-cyan' },
  };
  return tones[deck.tone] || tones.cyan;
}

function MemoryProgress({ stats }) {
  const percentage = Math.max(0, Math.min(stats.percentage, 100));

  return (
    <section className="app-card p-5">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Target size={17} className="text-accent-cyan" /><h2 className="font-bold text-navy">ความคืบหน้า</h2></div><Link href="/profile#stats-overview" className="text-xs font-semibold text-accent-cyan hover:underline">ดูทั้งหมด</Link></div>
      <div className="mt-5 flex items-center gap-4">
        <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#00b4d8 ${percentage}%, #e8edf3 ${percentage}% 100%)` }}>
          <div className="grid h-[74px] w-[74px] place-items-center rounded-full bg-white text-center"><p className="text-2xl font-black leading-none text-navy">{percentage}%</p><p className="mt-1 text-[9px] text-graydark/45">จำได้แล้ว</p></div>
        </div>
        <div className="min-w-0 flex-1 space-y-2.5 text-xs"><p className="flex items-center justify-between gap-2 text-graydark/65"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />จำได้แล้ว</span><b className="text-navy">{stats.mastered} คำ</b></p><p className="flex items-center justify-between gap-2 text-graydark/65"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />ต้องทบทวน</span><b className="text-navy">{stats.reviewing} คำ</b></p><p className="flex items-center justify-between gap-2 text-graydark/65"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-graylight/60" />ยังไม่ได้ฝึก</span><b className="text-navy">{Math.max(0, stats.total - stats.reviewed)} คำ</b></p></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-graylight/20 pt-4"><div><p className="text-[11px] text-graydark/45">เรียนไปแล้ว</p><p className="mt-1 text-lg font-black text-navy">{stats.reviewed} <span className="text-xs font-medium text-graydark/45">คำ</span></p></div><div className="border-l border-graylight/20 pl-3"><p className="text-[11px] text-graydark/45">เป้าหมายวันนี้</p><p className="mt-1 text-lg font-black text-navy">10 <span className="text-xs font-medium text-graydark/45">คำ</span></p></div></div>
    </section>
  );
}

function DeckShelf({ decks, totalCards, deckStats, activeDeckId, onSelect }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-bold text-navy">แฟลชการ์ดแนะนำสำหรับคุณ</h2><p className="mt-0.5 text-xs text-graydark/45">เลือกทบทวนได้ครบทุกวิชา แล้วค่อยต่อด้วยศัพท์ Oxford และศัพท์ตำรวจ</p></div><span className="text-xs font-semibold text-graydark/45">{totalCards} ใบ</span></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {decks.map((deck) => {
          const summary = deckStats[deck.id] || { total: 0, mastered: 0 };
          const colors = deckColors(deck);
          const selected = deck.id === activeDeckId;
          const percent = summary.total ? Math.round((summary.mastered / summary.total) * 100) : 0;
          return (
            <button key={deck.id} type="button" onClick={() => onSelect(deck.id)} className={`overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5 hover:shadow-md ${selected ? colors.surface : 'border-graylight/25 bg-white hover:border-accent-cyan/40'}`}>
              <div className={`flex items-center justify-between gap-3 px-4 py-3 ${selected ? colors.selected : 'bg-slate-50 text-navy'}`}><span className="flex items-center gap-2 text-sm font-bold"><DeckIcon deck={deck} size={17} />{deck.shortTitle}</span><span className="text-xs font-semibold opacity-85">{summary.total} คำ</span></div>
              <div className="p-4"><p className="min-h-10 text-xs leading-5 text-graydark/60">{deck.description}</p><div className="mt-3 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-graylight/20"><div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${percent}%` }} /></div><span className="text-[11px] font-semibold text-graydark/55">{percent}%</span></div><span className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-navy shadow-sm">{selected ? 'กำลังเรียน' : 'เลือกชุดนี้'}</span></div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function isOxfordDeck(deck) {
  return deck?.id === 'oxford-3000' || deck?.kind === 'english';
}

function OxfordLevelPicker({ cards, progress, selectedLevel, onSelect }) {
  const levels = [
    { id: 'all', label: 'ทุกระดับ', description: 'ผสม A1–B2', color: 'navy' },
    ...OXFORD_CEFR_LEVELS,
  ].map((level) => {
    const levelCards = level.id === 'all' ? cards : cards.filter((card) => card.level === level.id);
    const known = levelCards.filter((card) => progressForCard(progress, card.id) === 'known').length;
    return { ...level, total: levelCards.length, known };
  });
  const importedCount = cards.length;
  const importedPercent = Math.min(100, Math.round((importedCount / OXFORD_3000_TARGET) * 100));

  return (
    <section className="overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-violet-50 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="flex items-center gap-2"><BookOpenCheck size={18} className="text-accent-cyan" /><h2 className="font-bold text-navy">Oxford 3000 · เลือกระดับที่ต้องการฝึก</h2></div><p className="mt-1 text-xs leading-5 text-graydark/55">เลือก A1, A2, B1 หรือ B2 เพื่อเรียนตามระดับของตนเอง</p></div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-navy shadow-sm">นำเข้าแล้ว {importedCount.toLocaleString()} / {OXFORD_3000_TARGET.toLocaleString()} คำ</span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${importedPercent}%` }} /></div>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        {levels.map((level) => {
          const selected = selectedLevel === level.id;
          const percent = level.total ? Math.round((level.known / level.total) * 100) : 0;
          return <button key={level.id} type="button" onClick={() => onSelect(level.id)} className={`rounded-xl border p-3 text-left transition ${selected ? 'border-navy bg-navy text-white shadow-md' : 'border-white bg-white/90 text-navy hover:border-accent-cyan hover:shadow-sm'}`}><div className="flex items-start justify-between gap-2"><span className="font-bold">{level.label}</span><span className={`text-xs font-bold ${selected ? 'text-cyan-200' : 'text-accent-cyan'}`}>{level.total}</span></div><p className={`mt-1 min-h-8 text-[11px] leading-4 ${selected ? 'text-white/70' : 'text-graydark/50'}`}>{level.description}</p><p className={`mt-2 text-[11px] font-semibold ${selected ? 'text-white' : 'text-graydark/60'}`}>จำแล้ว {level.known}/{level.total} · {percent}%</p></button>;
        })}
      </div>
    </section>
  );
}

export default function VocabularyTrainer({ view = 'cards' }) {
  const [activeDeckId, setActiveDeckId] = useState('oxford-3000');
  const [library, setLibrary] = useState(() => ({ decks: fallbackVocabularyDecks, cards: fallbackVocabularyCards }));
  const [progress, setProgress] = useState({ cards: {} });
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [round, setRound] = useState(1);
  const [selectedWordId, setSelectedWordId] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [gameFeedback, setGameFeedback] = useState('');

  useEffect(() => setProgress(getVocabularyProgress()), []);

  useEffect(() => {
    let ignore = false;
    fetch('/api/vocabulary', { cache: 'no-store' })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (ignore || !result?.decks?.length || !result?.cards?.length) return;
        setLibrary({ decks: result.decks, cards: result.cards });
      })
      // The static starter library remains available if a student is offline
      // or Supabase has not yet been configured.
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  const vocabularyDecks = library.decks;
  const vocabularyCards = library.cards;

  useEffect(() => {
    if (vocabularyDecks.length && !vocabularyDecks.some((deck) => deck.id === activeDeckId)) {
      setActiveDeckId(vocabularyDecks[0].id);
    }
  }, [activeDeckId, vocabularyDecks]);

  const activeDeck = vocabularyDecks.find((deck) => deck.id === activeDeckId) || vocabularyDecks[0];
  const deckCards = useMemo(() => vocabularyByDeck(activeDeckId, vocabularyCards), [activeDeckId, vocabularyCards]);
  const isOxford = isOxfordDeck(activeDeck);
  const levelCards = useMemo(() => {
    if (!isOxford || levelFilter === 'all') return deckCards;
    return deckCards.filter((card) => card.level === levelFilter);
  }, [deckCards, isOxford, levelFilter]);
  const displayedCards = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return levelCards.filter((card) => {
      const status = progressForCard(progress, card.id);
      const matchesFilter = filter === 'all' || status === filter;
      const matchesSearch = !needle || [card.word, card.thaiReading, card.translation, card.meaning, card.partOfSpeech].filter(Boolean).some((value) => value.toLowerCase().includes(needle));
      return matchesFilter && matchesSearch;
    });
  }, [filter, levelCards, progress, query]);
  const card = displayedCards[index] || displayedCards[0];
  const stats = getVocabularyStats(vocabularyCards, progress);
  const deckStats = stats.byDeck[activeDeckId] || { total: deckCards.length, mastered: 0, reviewing: 0, reviewed: 0 };
  const matchingCards = useMemo(() => seededOrder(levelCards, `${activeDeckId}-${levelFilter}-${round}`).slice(0, 4), [activeDeckId, levelCards, levelFilter, round]);
  const translationOrder = useMemo(() => seededOrder(matchingCards, `translations-${round}`), [matchingCards, round]);
  const activeColors = deckColors(activeDeck);
  const filteredPercent = displayedCards.length ? Math.round(((index + 1) / displayedCards.length) * 100) : 0;
  const isMatching = view === 'matching';

  useEffect(() => { setIndex(0); setFlipped(false); }, [activeDeckId, filter, levelFilter, query]);
  useEffect(() => { setSelectedWordId(null); setMatchedIds([]); setGameFeedback(''); }, [activeDeckId, round]);

  function selectDeck(deckId) {
    setActiveDeckId(deckId);
    setQuery('');
    setFilter('all');
    setLevelFilter('all');
  }

  function moveCard(delta) {
    if (!displayedCards.length) return;
    setIndex((current) => (current + delta + displayedCards.length) % displayedCards.length);
    setFlipped(false);
  }

  function shuffleCard() {
    if (!displayedCards.length) return;
    const next = seededOrder(displayedCards, `${Date.now()}`).findIndex((item) => item.id !== card?.id);
    setIndex(next >= 0 ? next : 0);
    setFlipped(false);
  }

  function updateCardStatus(cardId, status) {
    const next = { ...progress, cards: { ...(progress.cards || {}), [cardId]: { status, reviewedAt: new Date().toISOString() } } };
    setProgress(next);
    saveVocabularyProgress(next);
    setFlipped(false);
    if (displayedCards.length > 1) setIndex((current) => (current + 1) % displayedCards.length);
  }

  function chooseWord(cardId) {
    if (matchedIds.includes(cardId)) return;
    setSelectedWordId(cardId);
    setGameFeedback('เลือกคำแปลที่ตรงกัน');
  }

  function chooseTranslation(cardId) {
    if (matchedIds.includes(cardId)) return;
    if (!selectedWordId) return setGameFeedback('เลือกคำศัพท์ด้านซ้ายก่อน');
    if (selectedWordId === cardId) {
      setMatchedIds((current) => [...current, cardId]);
      setGameFeedback('ถูกต้อง! จับคู่สำเร็จ');
    } else {
      setGameFeedback('ยังไม่ตรง ลองเลือกใหม่อีกครั้ง');
    }
    setSelectedWordId(null);
  }

  const filters = [
    { id: 'all', label: 'ทั้งหมด', count: levelCards.length },
    { id: 'review', label: 'ต้องทบทวน', count: levelCards.filter((item) => progressForCard(progress, item.id) === 'review').length },
    { id: 'known', label: 'จำได้แล้ว', count: levelCards.filter((item) => progressForCard(progress, item.id) === 'known').length },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="app-section-heading text-2xl font-bold text-navy">{isMatching ? 'เกมจับคู่คำศัพท์' : 'แฟลชการ์ด'}</h1><p className="mt-1 text-sm text-graydark/55">{isMatching ? 'จับคู่คำศัพท์กับคำแปล เพื่อทบทวนให้แม่นยำขึ้น' : 'เรียนรู้คำศัพท์ จดจำความหมาย และเลือกทบทวนตามชุดที่ต้องการ'}</p></div>
        <Link href={isMatching ? '/vocab' : '/matching-game'} className={`${isMatching ? 'btn-navy' : 'btn-primary'} gap-2 self-start sm:self-auto`}><Gamepad2 size={16} />{isMatching ? 'ไปทบทวนแฟลชการ์ด' : 'เล่นเกมจับคู่'}</Link>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-6">
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {vocabularyDecks.map((deck) => { const colors = deckColors(deck); const selected = deck.id === activeDeckId; return <button key={deck.id} type="button" onClick={() => selectDeck(deck.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${selected ? colors.selected : 'border-graylight/30 bg-white text-graydark/65 hover:border-accent-cyan/50 hover:text-navy'}`}><DeckIcon deck={deck} size={16} />{deck.shortTitle}</button>; })}
            </div>
            {isOxford && <OxfordLevelPicker cards={deckCards} progress={progress} selectedLevel={levelFilter} onSelect={setLevelFilter} />}
            {!isMatching && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === item.id ? 'border-navy bg-navy text-white' : 'border-graylight/30 bg-white text-graydark/60 hover:border-accent-cyan/50'}`}>{item.label} <span className="opacity-70">{item.count}</span></button>)}</div><label className="relative block w-full sm:w-56"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graydark/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาคำศัพท์" className="w-full rounded-xl border border-graylight/30 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/10" /></label></div>}
          </section>

          {!isMatching ? (
            <>
              {card ? <section className="app-card overflow-hidden p-0">
                <div className="border-b border-graylight/20 px-5 py-4 sm:px-6"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${activeColors.icon}`}><DeckIcon deck={activeDeck} size={14} />กำลังเรียน</span><p className="truncate text-sm font-semibold text-navy">{activeDeck.title}</p></div><span className="shrink-0 text-xs font-bold text-navy">{index + 1} / {displayedCards.length}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-graylight/20"><div className={`h-full rounded-full transition-all ${activeColors.bar}`} style={{ width: `${filteredPercent}%` }} /></div></div>
                <div className="relative bg-slate-50/65 px-5 py-6 sm:px-10 sm:py-8"><button type="button" onClick={() => moveCard(-1)} aria-label="คำก่อนหน้า" className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-graylight/30 bg-white p-2 text-graydark/45 shadow-sm transition hover:border-accent-cyan hover:text-navy sm:left-5"><ChevronLeft size={18} /></button><button type="button" onClick={() => moveCard(1)} aria-label="คำถัดไป" className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-graylight/30 bg-white p-2 text-graydark/45 shadow-sm transition hover:border-accent-cyan hover:text-navy sm:right-5"><ChevronRight size={18} /></button><button type="button" onClick={() => setFlipped((value) => !value)} className={`relative mx-auto flex min-h-[235px] w-full max-w-4xl overflow-hidden rounded-2xl border p-7 text-center transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[260px] ${flipped ? 'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50' : 'border-graylight/20 bg-white'}`}><span className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-2xl ${flipped ? 'bg-violet-200/80' : 'bg-cyan-100/80'}`} /><span className="relative flex w-full flex-col items-center justify-center"><span className={`mb-5 rounded-full px-3 py-1 text-xs font-bold ${flipped ? 'bg-violet-100 text-violet-700' : 'bg-cyan-50 text-cyan-700'}`}>{flipped ? 'ด้านหลัง · ความหมาย' : 'ด้านหน้า · คำศัพท์'}</span>{flipped ? <><strong className="text-3xl font-black text-navy sm:text-4xl">{card.translation}</strong><span className="mt-3 text-sm font-semibold text-violet-700">{card.partOfSpeech} · {card.phonetic}</span><span className="mt-5 max-w-xl text-sm leading-6 text-graydark/70">{card.meaning}</span><span className="mt-3 max-w-xl border-l-2 border-violet-200 pl-3 text-left text-xs italic leading-5 text-graydark/55">“{card.example}”</span></> : <><strong className="text-4xl font-black tracking-tight text-navy sm:text-5xl">{card.word}</strong>{card.thaiReading && <span className="mt-3 rounded-full bg-accent-gold/15 px-3 py-1 text-sm font-bold text-[#9b7428]">คำอ่านไทย: {card.thaiReading}</span>}<span className="mt-3 text-base font-medium text-accent-cyan">{card.phonetic}</span><span className="mt-1 text-sm text-graydark/50">{card.partOfSpeech}</span></>}<span className="mt-6 text-xs text-graydark/40">คลิกที่การ์ดเพื่อ{flipped ? 'กลับไปดูคำศัพท์' : 'ดูคำตอบ'}</span></span></button></div>
                <div className="grid gap-3 border-t border-graylight/20 p-4 sm:grid-cols-2 sm:p-5"><button type="button" onClick={() => updateCardStatus(card.id, 'review')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"><RotateCcw size={16} />ยังจำไม่ได้</button><button type="button" onClick={() => updateCardStatus(card.id, 'known')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"><CheckCircle2 size={16} />จำได้แล้ว</button></div>
                <div className="flex items-center justify-between border-t border-graylight/15 px-5 py-3 text-xs sm:px-6"><button type="button" onClick={shuffleCard} className="inline-flex items-center gap-1.5 font-semibold text-graydark/55 hover:text-navy"><Shuffle size={14} />สุ่มคำใหม่</button><span className="text-graydark/40">คลิกที่การ์ดเพื่อพลิกคำตอบ</span></div>
              </section> : <section className="app-card px-6 py-16 text-center"><Search className="mx-auto text-graydark/30" size={28} /><p className="mt-3 font-semibold text-navy">ไม่พบคำศัพท์ที่ค้นหา</p><button type="button" onClick={() => { setQuery(''); setFilter('all'); }} className="mt-3 text-sm font-semibold text-accent-cyan hover:underline">ล้างตัวกรอง</button></section>}
              <DeckShelf decks={vocabularyDecks} totalCards={vocabularyCards.length} deckStats={stats.byDeck} activeDeckId={activeDeckId} onSelect={selectDeck} />
            </>
          ) : (
            <section className="app-card overflow-hidden p-0"><div className="flex flex-col gap-3 border-b border-graylight/20 bg-gradient-to-r from-violet-50 via-white to-indigo-50 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6"><div><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white shadow-[0_8px_18px_rgba(124,58,237,0.22)]"><Gamepad2 size={18} /></span><div><h2 className="font-bold text-navy">รอบจับคู่ของคุณ</h2><p className="mt-0.5 text-xs text-graydark/55">1. เลือกคำศัพท์ &nbsp; 2. เลือกคำแปลที่ตรงกัน</p></div></div></div><button type="button" onClick={() => setRound((value) => value + 1)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3.5 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-400 hover:bg-violet-50"><Shuffle size={15} />เปลี่ยนชุดคำ</button></div><div className="px-5 py-6 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-3"><p className={`rounded-full px-3 py-1 text-xs font-semibold ${matchedIds.length === matchingCards.length ? 'bg-emerald-100 text-emerald-700' : gameFeedback.includes('ไม่') ? 'bg-rose-100 text-rose-600' : 'bg-violet-50 text-violet-700'}`}>{matchedIds.length === matchingCards.length ? 'จับคู่ครบแล้ว เก่งมาก!' : gameFeedback || `จับคู่ให้ครบ ${matchingCards.length} คำ`}</p><span className="text-xs font-bold text-graydark/45">สำเร็จ {matchedIds.length}/{matchingCards.length}</span></div>{matchingCards.length ? <div className="mx-auto mt-5 grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-6"><div className="space-y-3">{matchingCards.map((item) => { const matched = matchedIds.includes(item.id); const selected = selectedWordId === item.id; return <button key={item.id} type="button" disabled={matched} onClick={() => chooseWord(item.id)} className={`flex min-h-[64px] w-full items-center justify-between rounded-xl border px-4 text-left transition ${matched ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : selected ? 'border-violet-400 bg-violet-50 text-violet-800 ring-2 ring-violet-100' : 'border-graylight/30 bg-white text-navy hover:border-violet-300 hover:bg-violet-50/40'}`}><span><span className="block font-bold">{item.word}</span><span className="mt-1 block text-xs opacity-60">{item.partOfSpeech}</span></span>{matched ? <CheckCircle2 size={19} /> : <span className="h-5 w-5 rounded-full border-2 border-current/20" />}</button>; })}</div><div className="space-y-3">{translationOrder.map((item) => { const matched = matchedIds.includes(item.id); return <button key={item.id} type="button" disabled={matched} onClick={() => chooseTranslation(item.id)} className={`flex min-h-[64px] w-full items-center justify-between rounded-xl border px-4 text-left transition ${matched ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-graylight/30 bg-slate-50 text-graydark hover:border-violet-300 hover:bg-violet-50/40'}`}><span className="font-semibold">{item.translation}</span>{matched ? <CheckCircle2 size={19} /> : <span className="text-xs font-semibold text-graydark/35">เลือก</span>}</button>; })}</div></div> : <div className="py-10 text-center text-sm text-graydark/55">ชุดคำนี้ยังไม่มีข้อมูลสำหรับเล่นเกม</div>}{matchingCards.length > 0 && matchedIds.length === matchingCards.length && <div className="mt-6 text-center"><button type="button" onClick={() => setRound((value) => value + 1)} className="btn-primary gap-2">เล่นชุดถัดไป <ArrowRight size={16} /></button></div>}</div></section>
          )}
        </main>

        <aside className="space-y-5">
          <MemoryProgress stats={stats} />
          <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5"><div className="flex items-center gap-2 text-violet-700"><Sparkles size={17} /><h2 className="font-bold">{isMatching ? 'ทบทวนด้วยแฟลชการ์ด' : 'Daily Challenge'}</h2></div><p className="mt-2 text-sm leading-6 text-graydark/65">{isMatching ? <>ดูคำศัพท์และความหมายของชุด <span className="font-semibold text-navy">{activeDeck.shortTitle}</span> ก่อน แล้วค่อยกลับมาลองจับคู่ใหม่</> : <>จับคู่คำศัพท์ 4 คำจากชุด <span className="font-semibold text-navy">{activeDeck.shortTitle}</span> ให้ครบ เพื่อทบทวนอย่างรวดเร็ว</>}</p>{!isMatching && <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white p-2"><p className="font-black text-navy">4</p><p className="mt-0.5 text-[10px] text-graydark/45">คำ</p></div><div className="rounded-xl bg-white p-2"><p className="font-black text-navy">3</p><p className="mt-0.5 text-[10px] text-graydark/45">นาที</p></div><div className="rounded-xl bg-white p-2"><p className="font-black text-navy">1</p><p className="mt-0.5 text-[10px] text-graydark/45">รอบ</p></div></div>}<Link href={isMatching ? '/vocab' : '/matching-game'} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">{isMatching ? 'เปิดแฟลชการ์ด' : 'เริ่มเกมวันนี้'} <ArrowRight size={15} /></Link></section>
          <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5"><div className="flex items-center gap-2 text-amber-700"><Sparkles size={17} /><h2 className="font-bold">เคล็ดลับจำศัพท์</h2></div><p className="mt-2 text-sm leading-6 text-graydark/65">พูดคำศัพท์ออกเสียง แล้วแต่งประโยคสั้น ๆ ของตัวเอง จะช่วยให้จำความหมายได้นานขึ้น</p><Link href="/profile#stats-overview" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:underline">ดูสถิติของฉัน <ArrowRight size={14} /></Link></section>
        </aside>
      </div>
    </div>
  );
}
