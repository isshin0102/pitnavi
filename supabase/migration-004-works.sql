-- ============================================================
-- Migration 004: DAY4 - 実績投稿（ビフォーアフター）機能
-- ============================================================

-- ============================================================
-- 1. Supabase Storage: pitnavi-images バケット作成
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('pitnavi-images', 'pitnavi-images', true)
  ON CONFLICT (id) DO NOTHING;

-- 閲覧: 誰でもOK（Anonユーザー含む）
DROP POLICY IF EXISTS "pitnavi_images_select" ON storage.objects;
CREATE POLICY "pitnavi_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'pitnavi-images');

-- アップロード: 認証済みユーザーのみ
DROP POLICY IF EXISTS "pitnavi_images_insert" ON storage.objects;
CREATE POLICY "pitnavi_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pitnavi-images'
    AND auth.role() = 'authenticated'
  );

-- 削除: 認証済みユーザーのみ（自分がアップロードしたファイル）
DROP POLICY IF EXISTS "pitnavi_images_delete" ON storage.objects;
CREATE POLICY "pitnavi_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pitnavi-images'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- 2. works テーブル（ビフォーアフター実績）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.works (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  car_name        text,              -- 車名・型式（例: N-BOX JF3）
  work_date       date,              -- 作業日
  before_image_url text,             -- 作業前の写真URL
  after_image_url  text,             -- 作業後の写真URL
  extra_image_url  text,             -- 追加写真URL（任意）
  category        text DEFAULT 'other', -- カテゴリ
  is_published    boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_works_shop ON public.works(shop_id);
CREATE INDEX IF NOT EXISTS idx_works_created ON public.works(created_at DESC);

-- RLS
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

-- 閲覧: 誰でもOK（公開済みのもの）
DROP POLICY IF EXISTS "works_select" ON public.works;
CREATE POLICY "works_select" ON public.works
  FOR SELECT USING (is_published = true);

-- 投稿: 店舗オーナーのみ
DROP POLICY IF EXISTS "works_insert" ON public.works;
CREATE POLICY "works_insert" ON public.works
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
  );

-- 更新: 店舗オーナーのみ
DROP POLICY IF EXISTS "works_update" ON public.works;
CREATE POLICY "works_update" ON public.works
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
  );

-- 削除: 店舗オーナーのみ
DROP POLICY IF EXISTS "works_delete" ON public.works;
CREATE POLICY "works_delete" ON public.works
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
  );

-- updated_at トリガー
CREATE TRIGGER set_works_updated_at
  BEFORE UPDATE ON public.works
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
