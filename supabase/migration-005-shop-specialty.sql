-- ============================================================
-- Migration 005: shops テーブルに specialty カラム追加
-- DAY8: 出店機能（ショップ管理＆プラットフォーム化）
-- ============================================================

-- 1. specialty カラムを追加（得意ジャンル配列）
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS specialty text[] DEFAULT '{}';

-- 2. GRANT（Supabase 5月30日以降の仕様対応）
GRANT ALL ON TABLE public.shops TO anon;
GRANT ALL ON TABLE public.shops TO authenticated;

-- 3. RLS ポリシー確認・追加
-- 一般ユーザーは公開店舗を閲覧可能
DROP POLICY IF EXISTS "shops_select_public" ON public.shops;
CREATE POLICY "shops_select_public" ON public.shops
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- オーナーは自分の店舗を全操作可能
DROP POLICY IF EXISTS "shops_owner_all" ON public.shops;
CREATE POLICY "shops_owner_all" ON public.shops
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 4. 確認クエリ
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'shops' AND column_name = 'specialty';
