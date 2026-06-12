-- migration-011: shops テーブルに古物商許可番号カラムを追加
-- 既存レコードには NULL を許可（後から入力を求める運用）

-- 1. license_number カラムを追加
ALTER TABLE shops ADD COLUMN IF NOT EXISTS license_number text;

-- 2. 既存データの確認用コメント
-- ※新規登録時はフロントエンド・バックエンドで必須バリデーションを実施
-- ※既存店舗は profile ページで後から入力可能

-- 確認クエリ
SELECT id, name, license_number, is_active FROM shops ORDER BY created_at DESC;
