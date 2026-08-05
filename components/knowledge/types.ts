export type SubjectId = string;

export interface KnowledgeSubject {
  id: SubjectId;
  name: string;
  short_name?: string | null;
  description?: string | null;
  sort_order?: number;
}

export interface KnowledgeTopic {
  id: string;
  legacy_id?: string | null;
  subject_id: SubjectId;
  name: string;
  description?: string | null;
  sort_order?: number;
}

export interface KnowledgeArticleSummary {
  id: string;
  subject_id: SubjectId;
  topic_id?: string | null;
  title: string;
  summary?: string | null;
  updated_at?: string | null;
}

export interface TechniqueBlock {
  title: string;
  detail: string;
}

export interface FormulaCard {
  label: string;
  formula: string;
  note?: string;
}

export interface KnowledgeArticle extends KnowledgeArticleSummary {
  body?: string;
  key_points?: string[];
  techniques?: TechniqueBlock[];
  formula_cards?: FormulaCard[];
  pitfalls?: string;
  exam_guide?: string;
}

export interface StudyQuestion {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
}

export interface KnowledgeCatalog {
  subjects: KnowledgeSubject[];
  topics: KnowledgeTopic[];
  articles: KnowledgeArticleSummary[];
  topicQuestionCounts: Record<string, number>;
  subjectQuestionCounts: Record<string, number>;
  source?: 'database' | 'unavailable' | string;
}

export interface TopicStudyResponse {
  topic: KnowledgeTopic;
  article: KnowledgeArticle | null;
  questions: StudyQuestion[];
  source?: string;
}
