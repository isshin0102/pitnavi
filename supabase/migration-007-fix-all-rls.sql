-- ============================================================
-- Migration 007: shops テーブルの RLS を完全修正
-- 全ポリシーを一旦削除して再作成する
-- ============================================================

-- 1. RLS が有効であることを確認
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- 2. 既存ポリシーを全削除（名前が違う可能性があるため全部）
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'shops' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.shops', pol.policyname);
  END LOOP;
END $$;

-- 3. SELECT ポリシー: 全ユーザー（anon + authenticated）が is_active=true の店舗を閲覧可能
CREATE POLICY "shops_public_read" ON public.shops
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 4. オーナーは自分の店舗を全操作可能（非公開でも閲覧・編集OK）
CREATE POLICY "shops_owner_manage" ON public.shops
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 5. INSERT: ログインユーザーは新規店舗を作成可能
CREATE POLICY "shops_insert" ON public.shops
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- 6. GRANT（Supabase 最新仕様対応）
GRANT ALL ON TABLE public.shops TO anon;
GRANT ALL ON TABLE public.shops TO authenticated;

-- 7. is_active のデフォルト確認・修正
ALTER TABLE public.shops ALTER COLUMN is_active SET DEFAULT true;

-- 8. specialty カラムがなければ追加
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS specialty text[] DEFAULT '{}';

-- 9. 既存データの修正
UPDATE public.shops SET is_active = true WHERE is_active IS NULL OR is_active = false;

-- 10. 確認
SELECT id, name, is_active, owner_id FROM public.shops;
