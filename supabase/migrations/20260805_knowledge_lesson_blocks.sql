-- Structured lesson blocks for the learner-facing Knowledge Library.
-- They make an article teach a repeatable technique before the learner opens
-- real practice questions and their explanations.

alter table public.knowledge_articles
  add column if not exists techniques jsonb not null default '[]'::jsonb
    check (jsonb_typeof(techniques) = 'array'),
  add column if not exists formula_cards jsonb not null default '[]'::jsonb
    check (jsonb_typeof(formula_cards) = 'array');

comment on column public.knowledge_articles.techniques is
  'Array of {title, detail}; repeatable methods for solving questions in this topic.';

comment on column public.knowledge_articles.formula_cards is
  'Array of {label, formula, note}; formulas, rules, or structures a learner should remember.';
