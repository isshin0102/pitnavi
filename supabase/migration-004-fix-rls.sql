-- ============================================================
-- Migration 004 FIX: works テーブルと Storage のRLS修正
-- anon ロールを明示的に許可
-- ============================================================

-- 1. works テーブルの SELECT ポリシーを修正（anon + authenticated 明示）
DROP POLICY IF EXISTS "works_select" ON public.works;
CREATE POLICY "works_select" ON public.works
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- 2. 店舗オーナーは自分の非公開分も見える（管理用）
DROP POLICY IF EXISTS "works_select_owner" ON public.works;
CREATE POLICY "works_select_owner" ON public.works
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
  );

-- 3. Storage の SELECT ポリシーも anon 明示
DROP POLICY IF EXISTS "pitnavi_images_select" ON storage.objects;
CREATE POLICY "pitnavi_images_select" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'pitnavi-images');

-- 4. 確認: works テーブルのデータ件数
SELECT count(*) AS works_count,
       count(*) FILTER (WHERE is_published = true) AS published_count
FROM public.works;
