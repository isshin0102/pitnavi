-- ============================================================
-- Migration 012: 写真表示不具合の完全修正
-- 原因: work-photos バケットが private のまま → public URL が 400/403
--       RLS / Storage ポリシーが未適用の可能性
-- ============================================================

-- ============================================================
-- 1. work-photos バケットを public に強制更新
--    （ON CONFLICT DO NOTHING で public=false のまま残っていた場合の修正）
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('work-photos', 'work-photos', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================================
-- 2. Storage ポリシーの再作成（冪等: 既存を削除して再作成）
-- ============================================================
DROP POLICY IF EXISTS "work_photos_select" ON storage.objects;
CREATE POLICY "work_photos_select" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'work-photos');

DROP POLICY IF EXISTS "work_photos_insert" ON storage.objects;
CREATE POLICY "work_photos_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'work-photos'
    AND auth.role() = 'authenticated'
  );

-- DELETE ポリシーも追加（写真の差し替え用）
DROP POLICY IF EXISTS "work_photos_delete" ON storage.objects;
CREATE POLICY "work_photos_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'work-photos');

-- ============================================================
-- 3. work_record_photos テーブルの RLS ポリシー再作成
-- ============================================================
ALTER TABLE public.work_record_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "photos_select" ON public.work_record_photos;
CREATE POLICY "photos_select" ON public.work_record_photos
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "photos_insert" ON public.work_record_photos;
CREATE POLICY "photos_insert" ON public.work_record_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.work_records wr
    JOIN public.shops s ON s.id = wr.shop_id
    WHERE wr.id = work_record_id AND s.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "photos_delete" ON public.work_record_photos;
CREATE POLICY "photos_delete" ON public.work_record_photos
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.work_records wr
    JOIN public.shops s ON s.id = wr.shop_id
    WHERE wr.id = work_record_id AND s.owner_id = auth.uid()
  ));

-- ============================================================
-- 4. GRANT (Supabase 最新仕様: anon/authenticated に明示的権限)
-- ============================================================
GRANT SELECT ON TABLE public.work_record_photos TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.work_record_photos TO authenticated;

GRANT SELECT ON TABLE public.work_records TO anon;
GRANT SELECT, INSERT ON TABLE public.work_records TO authenticated;

-- ============================================================
-- 5. 確認クエリ: バケット状態 & データ件数
-- ============================================================
SELECT id, name, public FROM storage.buckets WHERE id = 'work-photos';

SELECT
  (SELECT count(*) FROM public.work_records) AS work_records_count,
  (SELECT count(*) FROM public.work_record_photos) AS photos_count,
  (SELECT count(*) FROM storage.objects WHERE bucket_id = 'work-photos') AS storage_objects_count;
