-- POLREADY: editable packages and administrator-managed access.
-- Run this after schema.sql and the content-admin migration.
-- The application uses the server-side Supabase key; browser clients have no
-- direct policy for these tables.

create table if not exists public.membership_plans (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text not null default '',
  price integer not null default 0 check (price >= 0 and price <= 1000000),
  duration_days integer check (duration_days is null or duration_days between 1 and 3650),
  billing_type text not null default 'one_time' check (billing_type in ('free', 'one_time', 'subscription')),
  grant_type text not null default 'membership' check (grant_type in ('membership', 'exam_set', 'manual')),
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  permissions jsonb not null default '{}'::jsonb check (jsonb_typeof(permissions) = 'object'),
  payment_enabled boolean not null default false,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.memberships add column if not exists admin_note text;

create table if not exists public.user_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  resource_type text not null check (resource_type in ('exam_set', 'feature')),
  resource_id uuid,
  feature_key text,
  status text not null default 'active' check (status in ('active', 'revoked')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  note text not null default '',
  granted_by uuid references public.app_users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (resource_type = 'exam_set' and resource_id is not null and feature_key is null)
    or (resource_type = 'feature' and feature_key is not null and resource_id is null)
  ),
  check (expires_at is null or expires_at > starts_at)
);

create index if not exists membership_plans_public_order_idx
  on public.membership_plans(is_active, sort_order, created_at);
create index if not exists user_access_grants_user_status_idx
  on public.user_access_grants(user_id, status, expires_at);
create unique index if not exists user_access_grants_one_active_exam_set
  on public.user_access_grants(user_id, resource_type, resource_id)
  where status = 'active' and resource_type = 'exam_set';

drop trigger if exists membership_plans_touch_updated_at on public.membership_plans;
create trigger membership_plans_touch_updated_at before update on public.membership_plans
for each row execute function public.touch_updated_at();

drop trigger if exists user_access_grants_touch_updated_at on public.user_access_grants;
create trigger user_access_grants_touch_updated_at before update on public.user_access_grants
for each row execute function public.touch_updated_at();

insert into public.membership_plans (
  id, name, description, price, duration_days, billing_type, grant_type,
  features, permissions, payment_enabled, is_featured, is_active, sort_order
) values
  (
    'free', 'ฟรี', 'ทดลองใช้งานก่อนตัดสินใจสมัครสมาชิก', 0, null, 'free', 'manual',
    '["แบบฝึกหัดฟรี 1 หัวข้อในทุกวิชา","Mock Exam ชุดทดลองเมื่อเปิดใช้งาน","Random Quiz จำกัดตามนโยบาย","ดูแดชบอร์ดและปฏิทินได้"]'::jsonb,
    '{"practice":"trial","mock":"trial","randomQuiz":true,"flashcards":false,"knowledge":false,"stats":true,"calendar":true}'::jsonb,
    false, false, true, 10
  ),
  (
    'mock-single', 'Mock รายชุด', 'เปิดสิทธิ์เฉพาะชุด Mock ที่ผู้ดูแลกำหนดให้', 59, null, 'one_time', 'exam_set',
    '["ปลดล็อกเฉพาะชุด Mock ที่เลือก","ใช้งาน Flashcards และฝึกภาษาอังกฤษ","ดูแดชบอร์ดและปฏิทินอ่านหนังสือ"]'::jsonb,
    '{"practice":"trial","mock":"selected","randomQuiz":true,"flashcards":true,"knowledge":true,"stats":true,"calendar":true}'::jsonb,
    false, false, true, 20
  ),
  (
    'vip-1y', 'VIP 1 ปี', 'เปิดทุกคลังข้อสอบและสิทธิ์สมาชิกเป็นเวลา 1 ปี', 690, 365, 'subscription', 'membership',
    '["คลังข้อสอบครบทุกวิชา","เฉลยละเอียด วิเคราะห์จุดอ่อน และ AI","สิทธิ์ Mock Exam ทุกชุดที่เปิดใช้งาน"]'::jsonb,
    '{"practice":"all","mock":"all","randomQuiz":true,"flashcards":true,"knowledge":true,"stats":true,"calendar":true,"aiTutor":true}'::jsonb,
    true, true, true, 30
  ),
  (
    'annual-2569', 'สมาชิกรายปี (เดิม)', 'สำหรับรักษาสิทธิ์สมาชิกเดิมในระบบ', 690, 365, 'subscription', 'membership',
    '["สิทธิ์สมาชิกเดิม"]'::jsonb,
    '{"practice":"all","mock":"all","randomQuiz":true,"flashcards":true,"knowledge":true,"stats":true,"calendar":true,"aiTutor":true}'::jsonb,
    false, false, false, 999
  )
on conflict (id) do nothing;

-- A membership created from an approved payment reads the duration from the
-- package record, rather than fixing every plan to one year.
create or replace function public.sync_membership_from_reviewed_payment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  plan_duration integer;
  base_time timestamptz;
  next_expiry timestamptz;
begin
  if old.status = 'pending' and new.status = 'approved' then
    select duration_days into plan_duration
    from public.membership_plans
    where id = new.plan_id;

    select case when expires_at > now() then expires_at else now() end
      into base_time
    from public.memberships
    where user_id = new.user_id;

    base_time := coalesce(base_time, now());
    next_expiry := case
      when plan_duration is null then null
      else base_time + make_interval(days => plan_duration)
    end;

    insert into public.memberships (
      user_id, plan_id, plan_name, amount, status, submitted_at, activated_at,
      expires_at, last_payment_slip_id, rejection_reason, admin_note
    ) values (
      new.user_id, new.plan_id, new.plan_name, new.amount, 'active', new.created_at,
      now(), next_expiry, new.id, null, null
    )
    on conflict (user_id) do update set
      plan_id = excluded.plan_id,
      plan_name = excluded.plan_name,
      amount = excluded.amount,
      status = 'active',
      submitted_at = excluded.submitted_at,
      activated_at = excluded.activated_at,
      expires_at = excluded.expires_at,
      last_payment_slip_id = excluded.last_payment_slip_id,
      rejection_reason = null,
      admin_note = null;
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

alter table public.membership_plans enable row level security;
alter table public.user_access_grants enable row level security;
