-- ============================================================
-- Garage App Schema (Lite - no PostGIS dependency)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. shops
create table if not exists public.shops (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users(id) on delete cascade,
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

-- 2. service_menus
create table if not exists public.service_menus (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references public.shops(id) on delete cascade,
  category          text not null check (category in ('tire_change','oil_change','inspection','other')),
  name              text not null,
  description       text,
  price_light       integer not null,
  price_standard    integer not null,
  estimated_minutes integer,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 3. work_records
create table if not exists public.work_records (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references public.shops(id) on delete cascade,
  service_menu_id   uuid references public.service_menus(id) on delete set null,
  title             text not null,
  description       text,
  category          text not null check (category in ('tire_change','oil_change','inspection','other')),
  car_type          text not null check (car_type in ('light','standard')),
  labor_cost        integer not null,
  duration_minutes  integer not null,
  created_at        timestamptz not null default now()
);

-- 4. work_record_photos
create table if not exists public.work_record_photos (
  id              uuid primary key default gen_random_uuid(),
  work_record_id  uuid not null references public.work_records(id) on delete cascade,
  storage_path    text not null,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now()
);

-- 5. reservations
create table if not exists public.reservations (
  id                      uuid primary key default gen_random_uuid(),
  customer_id             uuid references auth.users(id) on delete cascade,
  shop_id                 uuid not null references public.shops(id) on delete cascade,
  service_menu_id         uuid not null references public.service_menus(id) on delete restrict,
  car_type                text not null check (car_type in ('light','standard')),
  preferred_date          date not null,
  preferred_time          time not null,
  status                  text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  customer_name           text not null,
  customer_phone          text not null,
  customer_note           text,
  total_price             integer not null,
  platform_fee            integer not null,
  shop_payout             integer not null,
  stripe_payment_intent_id text,
  stripe_transfer_id       text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- 6. platform_fee_rules
create table if not exists public.platform_fee_rules (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in ('tire_change','oil_change','inspection','other')),
  car_type    text check (car_type in ('light','standard')),
  fee_amount  integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(category, car_type)
);

-- Insert fee rules
insert into public.platform_fee_rules (category, car_type, fee_amount) values
  ('tire_change', 'light',    800),
  ('tire_change', 'standard', 1500),
  ('oil_change',  'light',    550),
  ('oil_change',  'standard', 650),
  ('inspection',  null,       4500)
on conflict (category, car_type) do nothing;

-- 7. RLS
alter table public.shops              enable row level security;
alter table public.service_menus      enable row level security;
alter table public.work_records       enable row level security;
alter table public.work_record_photos enable row level security;
alter table public.reservations       enable row level security;
alter table public.platform_fee_rules enable row level security;

-- shops: anyone can read, owner can write
drop policy if exists "shops_select" on public.shops;
create policy "shops_select" on public.shops for select using (true);
drop policy if exists "shops_insert" on public.shops;
create policy "shops_insert" on public.shops for insert with check (auth.uid() = owner_id);
drop policy if exists "shops_update" on public.shops;
create policy "shops_update" on public.shops for update using (auth.uid() = owner_id);
drop policy if exists "shops_delete" on public.shops;
create policy "shops_delete" on public.shops for delete using (auth.uid() = owner_id);

-- service_menus: anyone can read, shop owner can write
drop policy if exists "menus_select" on public.service_menus;
create policy "menus_select" on public.service_menus for select using (true);
drop policy if exists "menus_insert" on public.service_menus;
create policy "menus_insert" on public.service_menus for insert
  with check (exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid()));
drop policy if exists "menus_update" on public.service_menus;
create policy "menus_update" on public.service_menus for update
  using (exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid()));
drop policy if exists "menus_delete" on public.service_menus;
create policy "menus_delete" on public.service_menus for delete
  using (exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid()));

-- work_records: anyone can read, shop owner can write
drop policy if exists "records_select" on public.work_records;
create policy "records_select" on public.work_records for select using (true);
drop policy if exists "records_insert" on public.work_records;
create policy "records_insert" on public.work_records for insert
  with check (exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid()));

-- work_record_photos: anyone can read, record owner can write
drop policy if exists "photos_select" on public.work_record_photos;
create policy "photos_select" on public.work_record_photos for select using (true);
drop policy if exists "photos_insert" on public.work_record_photos;
create policy "photos_insert" on public.work_record_photos for insert
  with check (exists (
    select 1 from public.work_records wr
    join public.shops s on s.id = wr.shop_id
    where wr.id = work_record_id and s.owner_id = auth.uid()
  ));

-- reservations: customer can read own, shop owner can read/update
drop policy if exists "reservations_select_customer" on public.reservations;
create policy "reservations_select_customer" on public.reservations
  for select using (auth.uid() = customer_id);
drop policy if exists "reservations_select_shop" on public.reservations;
create policy "reservations_select_shop" on public.reservations
  for select using (exists (
    select 1 from public.shops where id = shop_id and owner_id = auth.uid()
  ));
drop policy if exists "reservations_insert" on public.reservations;
create policy "reservations_insert" on public.reservations
  for insert with check (auth.uid() = customer_id);
drop policy if exists "reservations_update_shop" on public.reservations;
create policy "reservations_update_shop" on public.reservations
  for update using (exists (
    select 1 from public.shops where id = shop_id and owner_id = auth.uid()
  ));

-- platform_fee_rules: anyone can read
drop policy if exists "fees_select" on public.platform_fee_rules;
create policy "fees_select" on public.platform_fee_rules for select using (true);

-- 8. updated_at triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_shops_updated_at on public.shops;
create trigger set_shops_updated_at
  before update on public.shops for each row execute function public.handle_updated_at();

drop trigger if exists set_service_menus_updated_at on public.service_menus;
create trigger set_service_menus_updated_at
  before update on public.service_menus for each row execute function public.handle_updated_at();

drop trigger if exists set_reservations_updated_at on public.reservations;
create trigger set_reservations_updated_at
  before update on public.reservations for each row execute function public.handle_updated_at();

drop trigger if exists set_fee_rules_updated_at on public.platform_fee_rules;
create trigger set_fee_rules_updated_at
  before update on public.platform_fee_rules for each row execute function public.handle_updated_at();

-- 9. Storage bucket
insert into storage.buckets (id, name, public)
  values ('work-photos', 'work-photos', true)
  on conflict (id) do nothing;

drop policy if exists "work_photos_select" on storage.objects;
create policy "work_photos_select" on storage.objects
  for select using (bucket_id = 'work-photos');

drop policy if exists "work_photos_insert" on storage.objects;
create policy "work_photos_insert" on storage.objects
  for insert with check (
    bucket_id = 'work-photos'
    and auth.role() = 'authenticated'
  );
