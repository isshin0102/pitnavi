-- ============================================================
-- Migration 002 (修正版): 予約ステータス拡張
-- Step by step で実行してください
-- ============================================================

-- Step 1: ステータスCHECK制約を削除して再作成
-- (制約名がわからない場合のため、テーブル全体の制約を確認)
DO $$
BEGIN
  -- 既存のstatus CHECK制約を削除（名前が自動生成の場合も対応）
  EXECUTE (
    SELECT 'ALTER TABLE public.reservations DROP CONSTRAINT ' || conname
    FROM pg_constraint
    WHERE conrelid = 'public.reservations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No status constraint found or already dropped';
END $$;

-- 新しいステータスCHECK制約を追加
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN (
    'pending', 'confirmed', 'visited', 'quoted',
    'contracted', 'completed', 'cancelled'
  ));

-- Step 2: 新カラムを追加
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS quoted_price integer;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS work_memo text;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS quoted_at timestamptz;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS contracted_at timestamptz;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS visited_at timestamptz;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Step 3: RLSポリシー更新
DROP POLICY IF EXISTS "reservations_update_shop" ON public.reservations;
CREATE POLICY "reservations_update_shop" ON public.reservations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "reservations_update_customer" ON public.reservations;
CREATE POLICY "reservations_update_customer" ON public.reservations
  FOR UPDATE USING (auth.uid() = customer_id);

-- Step 4: ステータスログテーブル
CREATE TABLE IF NOT EXISTS public.reservation_status_logs (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references public.reservations(id) on delete cascade,
  old_status      text,
  new_status      text not null,
  changed_by      uuid references auth.users(id),
  note            text,
  created_at      timestamptz not null default now()
);

ALTER TABLE public.reservation_status_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "status_logs_select" ON public.reservation_status_logs;
CREATE POLICY "status_logs_select" ON public.reservation_status_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id
        AND (r.customer_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = r.shop_id AND s.owner_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "status_logs_insert" ON public.reservation_status_logs;
CREATE POLICY "status_logs_insert" ON public.reservation_status_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservations r
      JOIN public.shops s ON s.id = r.shop_id
      WHERE r.id = reservation_id AND (s.owner_id = auth.uid() OR r.customer_id = auth.uid())
    )
  );

-- 確認
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reservations' AND table_schema = 'public'
ORDER BY ordinal_position;
