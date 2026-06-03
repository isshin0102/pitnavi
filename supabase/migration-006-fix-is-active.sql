-- ============================================================
-- Migration 006: 既存ショップの is_active を true に修正
-- 新規登録時に is_active が設定されていなかった問題の修正
-- ============================================================

-- 1. is_active のデフォルトを true に変更
ALTER TABLE public.shops
  ALTER COLUMN is_active SET DEFAULT true;

-- 2. 既存の NULL や false のレコードを true に更新
UPDATE public.shops
SET is_active = true
WHERE is_active IS NULL OR is_active = false;

-- 3. GRANT（Supabase 最新仕様対応）
GRANT ALL ON TABLE public.shops TO anon;
GRANT ALL ON TABLE public.shops TO authenticated;

-- 4. 確認
SELECT id, name, is_active FROM public.shops;
