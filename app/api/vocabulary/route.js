import { NextResponse } from 'next/server';
import { getFallbackVocabularyLibrary } from '@/lib/vocabulary';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function databaseDeck(deck) {
  return {
    id: deck.id,
    subjectId: deck.subject_id || null,
    title: deck.title,
    shortTitle: deck.short_title,
    description: deck.description || '',
    note: deck.note || '',
    icon: deck.icon || 'book',
    tone: deck.tone || 'cyan',
    kind: deck.kind || 'subject',
    sortOrder: deck.sort_order || 0,
    isActive: deck.is_active !== false,
  };
}

function databaseCard(card) {
  return {
    id: card.id,
    deckId: card.deck_id,
    subjectId: card.subject_id || null,
    word: card.word,
    phonetic: card.phonetic || '',
    thaiReading: card.thai_reading || '',
    partOfSpeech: card.part_of_speech || '',
    level: card.level || '',
    translation: card.translation || '',
    meaning: card.meaning || '',
    example: card.example || '',
    kind: card.kind || 'vocabulary',
    sortOrder: card.sort_order || 0,
    isActive: card.is_active !== false,
  };
}

function fallbackResponse(extra = {}) {
  const library = getFallbackVocabularyLibrary();
  return NextResponse.json({
    decks: library.decks,
    cards: library.cards,
    source: 'fallback',
    ...extra,
  });
}

// Vocabulary is public learning content.  Admin writes go through
// /api/admin/vocabulary, while this endpoint guarantees that students and
// administrators see the exact same active cards.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [decksResult, cardsResult] = await Promise.all([
      supabase
        .from('vocabulary_decks')
        .select('id, subject_id, title, short_title, description, note, icon, tone, kind, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order')
        .order('title'),
      supabase
        .from('vocabulary_cards')
        .select('id, deck_id, subject_id, word, phonetic, thai_reading, part_of_speech, level, translation, meaning, example, kind, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order')
        .order('word'),
    ]);

    if (decksResult.error || cardsResult.error) {
      const error = decksResult.error || cardsResult.error;
      if (error?.code === '42P01') return fallbackResponse({ migrationRequired: true });
      throw error;
    }

    const decks = (decksResult.data || []).map(databaseDeck);
    const cards = (cardsResult.data || []).map(databaseCard);
    // Keep the existing learner experience working until the administrator
    // imports the starter deck or adds the first real card.
    if (!decks.length || !cards.length) return fallbackResponse({ needsInitialImport: true });

    return NextResponse.json({ decks, cards, source: 'database' });
  } catch {
    // Never let a temporary content-service failure blank a student's study
    // screen. The static starter library is a read-only safety net.
    return fallbackResponse({ unavailable: true });
  }
}
