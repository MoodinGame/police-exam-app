-- LINE recipients are registered only through a signature-verified webhook.
-- No browser role can read this table; the server service key is the only writer.
create table if not exists public.line_notification_subscribers (
  line_user_id text primary key,
  subscribed_at timestamptz not null default now(),
  last_notified_at timestamptz
);

alter table public.line_notification_subscribers enable row level security;

revoke all on table public.line_notification_subscribers from anon, authenticated;
