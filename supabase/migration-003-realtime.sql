-- ============================================
-- Migration 003: Enable Supabase Realtime on reservations
-- ============================================

-- Realtime の行フィルタ（filter）を使うには REPLICA IDENTITY FULL が必要
ALTER TABLE reservations REPLICA IDENTITY FULL;

-- supabase_realtime publication に reservations テーブルを追加
-- （既に追加済みの場合はエラーになるので DO ブロックで安全に実行）
DO $$
BEGIN
  -- publication が存在しない場合は作成
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE reservations;
  ELSE
    -- 既存 publication にテーブルを追加（重複は無視）
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- 既に追加済み
    END;
  END IF;
END $$;
