import type { KnowledgeArticleSummary, KnowledgeCatalog, KnowledgeSubject, KnowledgeTopic } from '@/components/knowledge/types';

export function formatCount(value: number | undefined) {
  return new Intl.NumberFormat('th-TH').format(Number(value || 0));
}

export function articleMap(articles: KnowledgeArticleSummary[]) {
  return new Map(articles.filter((article) => article.topic_id).map((article) => [article.topic_id as string, article]));
}

export function learningSubjects(catalog: KnowledgeCatalog) {
  return catalog.subjects.filter((subject) => (
    Number(catalog.subjectQuestionCounts[subject.id] || 0) > 0
    || catalog.articles.some((article) => article.subject_id === subject.id)
  ));
}

export function learningTopics(catalog: KnowledgeCatalog, subjectId: string) {
  const articles = articleMap(catalog.articles);
  return catalog.topics.filter((topic) => topic.subject_id === subjectId && (
    Number(catalog.topicQuestionCounts[topic.id] || 0) > 0 || articles.has(topic.id)
  ));
}

export function topicSearch(topics: KnowledgeTopic[], articles: Map<string, KnowledgeArticleSummary>, query: string) {
  const normalized = query.trim().toLocaleLowerCase('th-TH');
  if (!normalized) return topics;
  return topics.filter((topic) => {
    const article = articles.get(topic.id);
    return [topic.name, topic.description, article?.title, article?.summary]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('th-TH')
      .includes(normalized);
  });
}

export function firstLearningSubject(subjects: KnowledgeSubject[], catalog: KnowledgeCatalog) {
  const available = learningSubjects(catalog);
  return available[0]?.id || subjects[0]?.id || '';
}

export function difficultyLabel(value: string | undefined) {
  return ({ easy: 'พื้นฐาน', medium: 'ปานกลาง', hard: 'ท้าทาย' })[value || 'medium'] || 'ปานกลาง';
}
