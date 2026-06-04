-- ============================================================
-- Migration 008: 決済ステータス管理の追加
-- ============================================================

-- 1. payment_status カラムを追加
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

-- 2. confirmed_at カラムを追加（なければ）
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- 3. visited_at, quoted_at, contracted_at, completed_at を追加（なければ）
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS visited_at timestamptz;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS quoted_at timestamptz;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS contracted_at timestamptz;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- 4. quoted_price, work_memo を追加（なければ）
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS quoted_price integer;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS work_memo text;

-- 5. インデックス
CREATE INDEX IF NOT EXISTS idx_reservations_payment
  ON public.reservations(payment_status);

-- 6. 確認
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'reservations'
ORDER BY ordinal_position;
