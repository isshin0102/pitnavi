-- ============================================================
-- Migration 002: Booking Status Workflow
-- 予約→来店→見積→成約の業務フローに対応
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. ステータスのCHECK制約を更新
--    旧: pending, confirmed, completed, cancelled
--    新: pending, confirmed, visited, quoted, contracted, completed, cancelled
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN (
    'pending',      -- 予約リクエスト中
    'confirmed',    -- 予約確定・来店待ち
    'visited',      -- 来店済み・見積中
    'quoted',       -- 見積提示済み
    'contracted',   -- 成約・作業確定
    'completed',    -- 作業完了
    'cancelled'     -- キャンセル
  ));

-- 2. 見積・作業関連カラムを追加
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS quoted_price     integer,          -- 見積金額（円）
  ADD COLUMN IF NOT EXISTS work_memo        text,             -- 追加の作業メモ（店側記入）
  ADD COLUMN IF NOT EXISTS quoted_at        timestamptz,      -- 見積提示日時
  ADD COLUMN IF NOT EXISTS contracted_at    timestamptz,      -- 成約日時
  ADD COLUMN IF NOT EXISTS completed_at     timestamptz,      -- 作業完了日時
  ADD COLUMN IF NOT EXISTS visited_at       timestamptz,      -- 来店日時
  ADD COLUMN IF NOT EXISTS confirmed_at     timestamptz;      -- 予約確定日時

-- 3. RLSポリシーの更新（店側がステータス更新できるように）
--    既存ポリシーを再作成
DROP POLICY IF EXISTS "reservations_update_shop" ON public.reservations;
CREATE POLICY "reservations_update_shop" ON public.reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE id = shop_id AND owner_id = auth.uid()
    )
  );

-- 顧客がキャンセルできるポリシーを追加
DROP POLICY IF EXISTS "reservations_update_customer" ON public.reservations;
CREATE POLICY "reservations_update_customer" ON public.reservations
  FOR UPDATE USING (auth.uid() = customer_id);

-- 4. ステータス変更履歴テーブル（監査用）
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

-- 店側と顧客の両方がログを閲覧可能
DROP POLICY IF EXISTS "status_logs_select" ON public.reservation_status_logs;
CREATE POLICY "status_logs_select" ON public.reservation_status_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id
        AND (
          r.customer_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = r.shop_id AND s.owner_id = auth.uid())
        )
    )
  );

-- 店側がログを挿入可能
DROP POLICY IF EXISTS "status_logs_insert" ON public.reservation_status_logs;
CREATE POLICY "status_logs_insert" ON public.reservation_status_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservations r
      JOIN public.shops s ON s.id = r.shop_id
      WHERE r.id = reservation_id AND s.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id AND r.customer_id = auth.uid()
    )
  );

-- 完了確認
SELECT 'Migration 002 completed successfully' AS result;
