-- ============================================================
-- Migration 013: スケジュール管理 + LINE連携
-- ============================================================

-- ============================================================
-- 1. shop_regular_holidays (定休日)
-- ============================================================
create table if not exists public.shop_regular_holidays (
  id           uuid primary key default uuid_generate_v4(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  day_of_week  integer not null check (day_of_week between 0 and 6),
  created_at   timestamptz not null default now(),
  unique(shop_id, day_of_week)
);

create index idx_regular_holidays_shop on public.shop_regular_holidays(shop_id);

alter table public.shop_regular_holidays enable row level security;

create policy "regular_holidays_select" on public.shop_regular_holidays
  for select using (true);

create policy "regular_holidays_insert" on public.shop_regular_holidays
  for insert with check (
    exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())
  );

create policy "regular_holidays_delete" on public.shop_regular_holidays
  for delete using (
    exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())
  );

-- ============================================================
-- 2. shop_blocked_slots (特定日時ブロック)
-- ============================================================
create table if not exists public.shop_blocked_slots (
  id            uuid primary key default uuid_generate_v4(),
  shop_id       uuid not null references public.shops(id) on delete cascade,
  blocked_date  date not null,
  start_time    time,
  end_time      time,
  reason        text,
  created_at    timestamptz not null default now()
);

create index idx_blocked_slots_shop on public.shop_blocked_slots(shop_id);
create index idx_blocked_slots_date on public.shop_blocked_slots(blocked_date);

alter table public.shop_blocked_slots enable row level security;

create policy "blocked_slots_select" on public.shop_blocked_slots
  for select using (true);

create policy "blocked_slots_insert" on public.shop_blocked_slots
  for insert with check (
    exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())
  );

create policy "blocked_slots_delete" on public.shop_blocked_slots
  for delete using (
    exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())
  );

-- ============================================================
-- 3. shops テーブルに LINE カラム追加
-- ============================================================
alter table public.shops
  add column if not exists line_channel_access_token text,
  add column if not exists line_channel_secret text;

-- ============================================================
-- 4. line_followers (LINE友だち管理)
-- ============================================================
create table if not exists public.line_followers (
  id              uuid primary key default uuid_generate_v4(),
  shop_id         uuid not null references public.shops(id) on delete cascade,
  line_user_id    text not null,
  pitnavi_user_id uuid references auth.users(id) on delete set null,
  display_name    text,
  followed_at     timestamptz not null default now(),
  unique(shop_id, line_user_id)
);

create index idx_line_followers_shop on public.line_followers(shop_id);
create index idx_line_followers_user on public.line_followers(pitnavi_user_id);

alter table public.line_followers enable row level security;

create policy "line_followers_select_owner" on public.line_followers
  for select using (
    exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())
    or auth.uid() = pitnavi_user_id
  );

create policy "line_followers_update_self" on public.line_followers
  for update using (auth.uid() = pitnavi_user_id);
