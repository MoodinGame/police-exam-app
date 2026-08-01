-- POLREADY: schema for membership, payment slips, and admin review.
-- Run this file once in Supabase Dashboard > SQL Editor > New query.
-- All application access is through server API routes using SUPABASE_SECRET_KEY.

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique check (phone ~ '^0[0-9]{9}$'),
  username text,
  email text,
  terms_accepted_at timestamptz,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_users add column if not exists username text;
alter table public.app_users add column if not exists email text;
alter table public.app_users add column if not exists terms_accepted_at timestamptz;

create unique index if not exists app_users_username_unique_idx
  on public.app_users (lower(username)) where username is not null;
create unique index if not exists app_users_email_unique_idx
  on public.app_users (lower(email)) where email is not null;

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.app_users(id) on delete cascade,
  plan_id text not null default 'vip-1y',
  plan_name text not null default 'VIP 1 ปี',
  amount integer not null default 690 check (amount > 0),
  status text not null default 'inactive' check (status in ('inactive', 'pending', 'active', 'rejected')),
  submitted_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz,
  last_payment_slip_id uuid,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_slips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  plan_id text not null default 'vip-1y',
  plan_name text not null default 'VIP 1 ปี',
  amount integer not null default 690 check (amount > 0),
  payer_name text not null check (char_length(trim(payer_name)) between 2 and 120),
  paid_at date not null,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 2097152),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payment_slips_one_pending_per_user
  on public.payment_slips(user_id) where status = 'pending';
create index if not exists payment_slips_status_created_at_idx
  on public.payment_slips(status, created_at desc);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.app_users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('payment_account', '{"bankName":"","accountName":"","accountNumber":""}'::jsonb)
on conflict (key) do nothing;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_users_touch_updated_at on public.app_users;
create trigger app_users_touch_updated_at before update on public.app_users
for each row execute function public.touch_updated_at();

drop trigger if exists memberships_touch_updated_at on public.memberships;
create trigger memberships_touch_updated_at before update on public.memberships
for each row execute function public.touch_updated_at();

drop trigger if exists payment_slips_touch_updated_at on public.payment_slips;
create trigger payment_slips_touch_updated_at before update on public.payment_slips
for each row execute function public.touch_updated_at();

create or replace function public.sync_membership_from_new_payment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.memberships (
    user_id, plan_id, plan_name, amount, status, submitted_at, last_payment_slip_id, rejection_reason
  ) values (
    new.user_id, new.plan_id, new.plan_name, new.amount, 'pending', new.created_at, new.id, null
  )
  on conflict (user_id) do update set
    plan_id = excluded.plan_id,
    plan_name = excluded.plan_name,
    amount = excluded.amount,
    status = 'pending',
    submitted_at = excluded.submitted_at,
    last_payment_slip_id = excluded.last_payment_slip_id,
    rejection_reason = null;
  return new;
end;
$$;

drop trigger if exists payment_slips_create_membership on public.payment_slips;
create trigger payment_slips_create_membership after insert on public.payment_slips
for each row execute function public.sync_membership_from_new_payment();

create or replace function public.sync_membership_from_reviewed_payment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'pending' and new.status = 'approved' then
    insert into public.memberships (
      user_id, plan_id, plan_name, amount, status, submitted_at, activated_at, expires_at, last_payment_slip_id, rejection_reason
    ) values (
      new.user_id, new.plan_id, new.plan_name, new.amount, 'active', new.created_at, now(), now() + interval '365 days', new.id, null
    )
    on conflict (user_id) do update set
      plan_id = excluded.plan_id,
      plan_name = excluded.plan_name,
      amount = excluded.amount,
      status = 'active',
      activated_at = excluded.activated_at,
      expires_at = excluded.expires_at,
      last_payment_slip_id = excluded.last_payment_slip_id,
      rejection_reason = null;
  elsif old.status = 'pending' and new.status = 'rejected' then
    update public.memberships set
      status = 'rejected',
      last_payment_slip_id = new.id,
      rejection_reason = coalesce(new.reviewer_note, '')
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists payment_slips_review_membership on public.payment_slips;
create trigger payment_slips_review_membership after update of status on public.payment_slips
for each row execute function public.sync_membership_from_reviewed_payment();

-- Slips are private. The service key on the server bypasses RLS; browsers have no direct policy.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-slips', 'payment-slips', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

alter table public.app_users enable row level security;
alter table public.memberships enable row level security;
alter table public.payment_slips enable row level security;
alter table public.app_settings enable row level security;



update public.app_users
set role = 'admin'
where phone = '0804259422';

-- After logging in once with the intended administrator phone, run this once:
-- update public.app_users set role = 'admin' where phone = '0812345678';
