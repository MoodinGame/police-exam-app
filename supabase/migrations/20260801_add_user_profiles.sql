-- Run this migration in Supabase SQL Editor for an existing POLREADY database.
alter table public.app_users add column if not exists username text;
alter table public.app_users add column if not exists email text;
alter table public.app_users add column if not exists terms_accepted_at timestamptz;

create unique index if not exists app_users_username_unique_idx
  on public.app_users (lower(username)) where username is not null;
create unique index if not exists app_users_email_unique_idx
  on public.app_users (lower(email)) where email is not null;
