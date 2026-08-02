const VOCABULARY_PROGRESS_KEY = 'polready-vocabulary-progress-v1';

function emptyProgress() {
  return { cards: {} };
}

export function getVocabularyProgress() {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const value = JSON.parse(window.localStorage.getItem(VOCABULARY_PROGRESS_KEY) || 'null');
    if (value && typeof value === 'object' && value.cards && typeof value.cards === 'object') return value;
  } catch {
    // A malformed local value should not prevent the vocabulary trainer from opening.
  }
  return emptyProgress();
}

export function saveVocabularyProgress(progress) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VOCABULARY_PROGRESS_KEY, JSON.stringify(progress));
}

export function getVocabularyStats(cards, progress = emptyProgress()) {
  const statusById = progress.cards || {};
  const mastered = cards.filter((card) => statusById[card.id]?.status === 'known').length;
  const reviewing = cards.filter((card) => statusById[card.id]?.status === 'review').length;
  const reviewed = mastered + reviewing;
  const byDeck = cards.reduce((result, card) => {
    const entry = result[card.deckId] || { total: 0, mastered: 0, reviewing: 0, reviewed: 0 };
    entry.total += 1;
    if (statusById[card.id]?.status === 'known') entry.mastered += 1;
    if (statusById[card.id]?.status === 'review') entry.reviewing += 1;
    entry.reviewed = entry.mastered + entry.reviewing;
    result[card.deckId] = entry;
    return result;
  }, {});

  return {
    total: cards.length,
    mastered,
    reviewing,
    reviewed,
    percentage: cards.length ? Math.round((mastered / cards.length) * 100) : 0,
    byDeck,
  };
}
