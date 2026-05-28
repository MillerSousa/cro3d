-- ============================================================
-- 004: adiciona campo crochet_recipe em dashboard_models
-- Execute no Supabase SQL Editor
-- ============================================================

ALTER TABLE dashboard_models
  ADD COLUMN IF NOT EXISTS crochet_recipe text;
