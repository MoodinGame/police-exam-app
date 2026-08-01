-- Align existing databases with the Free / Mock / VIP display.
-- Existing annual-2569 memberships are intentionally left unchanged; the app
-- treats them as legacy VIP memberships so no current customer loses access.

alter table public.memberships
  alter column plan_id set default 'vip-1y',
  alter column plan_name set default 'VIP 1 ปี',
  alter column amount set default 690;

alter table public.payment_slips
  alter column plan_id set default 'vip-1y',
  alter column plan_name set default 'VIP 1 ปี',
  alter column amount set default 690;
