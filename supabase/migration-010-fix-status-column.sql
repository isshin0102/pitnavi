-- ============================================================
-- Migration 010: status カラムを enum → text に変更
-- 問題: 元のスキーマで reservation_status enum は4値のみ
--   (pending, confirmed, completed, cancelled)
-- 新ステータス (visited, quoted, contracted) が保存できない
-- ============================================================

-- Step 1: 既存の CHECK 制約を削除（あれば）
DO $$
BEGIN
  EXECUTE (
    SELECT 'ALTER TABLE public.reservations DROP CONSTRAINT ' || conname
    FROM pg_constraint
    WHERE conrelid = 'public.reservations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No status CHECK constraint found';
END $$;

-- Step 2: status カラムを text 型に変更（enum → text）
ALTER TABLE public.reservations
  ALTER COLUMN status TYPE text USING status::text;

-- Step 3: 新しい CHECK 制約を追加（7ステータス対応）
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN (
    'pending', 'confirmed', 'visited', 'quoted',
    'contracted', 'completed', 'cancelled'
  ));

-- Step 4: デフォルト値を再設定
ALTER TABLE public.reservations
  ALTER COLUMN status SET DEFAULT 'pending';

-- Step 5: 必要なカラムがすべて存在することを確認
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS visited_at timestamptz;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS quoted_at timestamptz;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS contracted_at timestamptz;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS quoted_price integer;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS work_memo text;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS estimate_payment_intent_id text;

-- Step 6: RLS ポリシーの確認・修正
-- 店舗オーナーが予約を SELECT できるポリシー
DROP POLICY IF EXISTS "reservations_select_shop" ON public.reservations;
CREATE POLICY "reservations_select_shop" ON public.reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
  );

-- 顧客が自分の予約を SELECT できるポリシー
DROP POLICY IF EXISTS "reservations_select_customer" ON public.reservations;
CREATE POLICY "reservations_select_customer" ON public.reservations
  FOR SELECT USING (auth.uid() = customer_id);

-- 顧客が予約を INSERT できるポリシー
DROP POLICY IF EXISTS "reservations_insert" ON public.reservations;
CREATE POLICY "reservations_insert" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- 店舗オーナーが予約を UPDATE できるポリシー
DROP POLICY IF EXISTS "reservations_update_shop" ON public.reservations;
CREATE POLICY "reservations_update_shop" ON public.reservations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
  );

-- 顧客が自分の予約を UPDATE できるポリシー（キャンセル用）
DROP POLICY IF EXISTS "reservations_update_customer" ON public.reservations;
CREATE POLICY "reservations_update_customer" ON public.reservations
  FOR UPDATE USING (auth.uid() = customer_id);

-- Step 7: GRANT
GRANT ALL ON TABLE public.reservations TO authenticated;

-- Step 8: reservation_status_logs テーブル（なければ作成）
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
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "status_logs_insert" ON public.reservation_status_logs;
CREATE POLICY "status_logs_insert" ON public.reservation_status_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

GRANT ALL ON TABLE public.reservation_status_logs TO authenticated;

-- Step 9: インデックス
CREATE INDEX IF NOT EXISTS idx_reservations_payment
  ON public.reservations(payment_status);

-- Step 10: 確認
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations' AND table_schema = 'public'
ORDER BY ordinal_position;
