-- ============================================================
-- Migration 009: 見積もり承諾決済フロー対応
-- ============================================================

-- 1. 見積もり承諾時の決済IDを保存するカラム
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS estimate_payment_intent_id text;

-- 2. RLSポリシー: お客様が自分の予約ステータスを確認 & 決済後の更新ができるように
-- (既存ポリシーで customer_id = auth.uid() で SELECT できている前提)

-- 確認
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name = 'estimate_payment_intent_id';
