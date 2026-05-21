-- ============================================================
-- Garage Reservation App - Supabase Schema
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ============================================================
-- 1. shops (工場)
-- ============================================================
create table public.shops (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  description   text,
  phone         text,
  postal_code   text,
  address       text not null,
  latitude      double precision not null,
  longitude     double precision not null,
  image_url     text,
  stripe_account_id text,
  stripe_onboarded  boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_shops_owner    on public.shops(owner_id);
create index idx_shops_location on public.shops using gist (
  st_setsrid(st_makepoint(longitude, latitude), 4326)
);

-- ============================================================
-- 2. service_categories (作業カテゴリマスタ)
-- ============================================================
create type public.service_category as enum (
  'tire_change',
  'oil_change',
  'inspection',
  'other'
);

-- ============================================================
-- 3. service_menus (作業メニュー & 料金)
-- ============================================================
create type public.car_type as enum ('light', 'standard');

create table public.service_menus (
  id                uuid primary key default uuid_generate_v4(),
  shop_id           uuid not null references public.shops(id) on delete cascade,
  category          public.service_category not null,
  name              text not null,
  description       text,
  price_light       integer not null,  -- 軽自動車の料金 (円)
  price_standard    integer not null,  -- 普通車の料金 (円)
  estimated_minutes integer,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_service_menus_shop on public.service_menus(shop_id);

-- ============================================================
-- 4. work_records (作業実績)
-- ============================================================
create table public.work_records (
  id                uuid primary key default uuid_generate_v4(),
  shop_id           uuid not null references public.shops(id) on delete cascade,
  service_menu_id   uuid references public.service_menus(id) on delete set null,
  title             text not null,
  description       text,
  category          public.service_category not null,
  car_type          public.car_type not null,
  labor_cost        integer not null,     -- 実際にかかった工賃 (円)
  duration_minutes  integer not null,     -- 実際の作業時間 (分)
  created_at        timestamptz not null default now()
);

create index idx_work_records_shop on public.work_records(shop_id);

-- ============================================================
-- 5. work_record_photos (作業実績の写真)
-- ============================================================
create table public.work_record_photos (
  id              uuid primary key default uuid_generate_v4(),
  work_record_id  uuid not null references public.work_records(id) on delete cascade,
  storage_path    text not null,     -- Supabase Storage path
  display_order   integer not null default 0,
  created_at      timestamptz not null default now()
);

create index idx_photos_record on public.work_record_photos(work_record_id);

-- ============================================================
-- 6. reservations (予約)
-- ============================================================
create type public.reservation_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled'
);

create table public.reservations (
  id                      uuid primary key default uuid_generate_v4(),
  customer_id             uuid not null references auth.users(id) on delete cascade,
  shop_id                 uuid not null references public.shops(id) on delete cascade,
  service_menu_id         uuid not null references public.service_menus(id) on delete restrict,
  car_type                public.car_type not null,
  preferred_date          date not null,
  preferred_time          time not null,
  status                  public.reservation_status not null default 'pending',
  customer_name           text not null,
  customer_phone          text not null,
  customer_note           text,
  total_price             integer not null,  -- 顧客の支払い総額 (円)
  platform_fee            integer not null,  -- プラットフォーム手数料 (円)
  shop_payout             integer not null,  -- 店舗への送金額 (円)
  stripe_payment_intent_id text,
  stripe_transfer_id       text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_reservations_customer on public.reservations(customer_id);
create index idx_reservations_shop     on public.reservations(shop_id);
create index idx_reservations_status   on public.reservations(status);

-- ============================================================
-- 7. platform_fee_rules (手数料マスタ)
-- ============================================================
create table public.platform_fee_rules (
  id          uuid primary key default uuid_generate_v4(),
  category    public.service_category not null,
  car_type    public.car_type,          -- NULL = 一律 (車種問わず)
  fee_amount  integer not null,          -- 手数料額 (円)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(category, car_type)
);

-- 初期手数料データ
insert into public.platform_fee_rules (category, car_type, fee_amount) values
  ('tire_change', 'light',    800),
  ('tire_change', 'standard', 1500),
  ('oil_change',  'light',    550),
  ('oil_change',  'standard', 650),
  ('inspection',  null,       4500);

-- ============================================================
-- 8. RLS (Row Level Security)
-- ============================================================
alter table public.shops              enable row level security;
alter table public.service_menus      enable row level security;
alter table public.work_records       enable row level security;
alter table public.work_record_photos enable row level security;
alter table public.reservations       enable row level security;
alter table public.platform_fee_rules enable row level security;

-- shops: 誰でも閲覧可、オーナーのみ編集
create policy "shops_select"  on public.shops for select using (true);
create policy "shops_insert"  on public.shops for insert with check (auth.uid() = owner_id);
create policy "shops_update"  on public.shops for update using (auth.uid() = owner_id);
create policy "shops_delete"  on public.shops for delete using (auth.uid() = owner_id);

-- service_menus: 誰でも閲覧可、店舗オーナーのみ編集
create policy "menus_select" on public.service_menus for select using (true);
create policy "menus_insert" on public.service_menus for insert
  with check (exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid()));
create policy "menus_update" on public.service_menus for update
  using (exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid()));
create policy "menus_delete" on public.service_menus for delete
  using (exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid()));

-- work_records: 誰でも閲覧可、店舗オーナーのみ投稿
create policy "records_select" on public.work_records for select using (true);
create policy "records_insert" on public.work_records for insert
  with check (exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid()));

-- work_record_photos: 誰でも閲覧可、投稿は実績所有店舗のオーナー
create policy "photos_select" on public.work_record_photos for select using (true);
create policy "photos_insert" on public.work_record_photos for insert
  with check (exists (
    select 1 from public.work_records wr
    join public.shops s on s.id = wr.shop_id
    where wr.id = work_record_id and s.owner_id = auth.uid()
  ));

-- reservations: 顧客は自分の予約を閲覧、店舗オーナーは自店舗の予約を閲覧
create policy "reservations_select_customer" on public.reservations
  for select using (auth.uid() = customer_id);
create policy "reservations_select_shop" on public.reservations
  for select using (exists (
    select 1 from public.shops where id = shop_id and owner_id = auth.uid()
  ));
create policy "reservations_insert" on public.reservations
  for insert with check (auth.uid() = customer_id);
create policy "reservations_update_shop" on public.reservations
  for update using (exists (
    select 1 from public.shops where id = shop_id and owner_id = auth.uid()
  ));

-- platform_fee_rules: 誰でも閲覧可 (管理者のみ更新 = service_role)
create policy "fees_select" on public.platform_fee_rules for select using (true);

-- ============================================================
-- 9. Storage bucket for work record photos
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('work-photos', 'work-photos', true)
  on conflict (id) do nothing;

create policy "work_photos_select" on storage.objects
  for select using (bucket_id = 'work-photos');

create policy "work_photos_insert" on storage.objects
  for insert with check (
    bucket_id = 'work-photos'
    and auth.role() = 'authenticated'
  );

-- ============================================================
-- 10. updated_at trigger
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_shops_updated_at
  before update on public.shops
  for each row execute function public.handle_updated_at();

create trigger set_service_menus_updated_at
  before update on public.service_menus
  for each row execute function public.handle_updated_at();

create trigger set_reservations_updated_at
  before update on public.reservations
  for each row execute function public.handle_updated_at();

create trigger set_fee_rules_updated_at
  before update on public.platform_fee_rules
  for each row execute function public.handle_updated_at();
