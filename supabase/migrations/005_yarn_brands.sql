-- ============================================================
-- 005: marcas de fio (yarn_brands)
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS yarn_brands (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  website_url text NOT NULL DEFAULT '',
  logo_url    text,
  created_at  timestamp DEFAULT now()
);

ALTER TABLE yarn_brands ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler
CREATE POLICY "Authenticated read yarn brands"
  ON yarn_brands FOR SELECT
  USING (auth.role() = 'authenticated');

-- Crochê, ambos e admin podem escrever
CREATE POLICY "Crochet manage yarn brands"
  ON yarn_brands FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM allowed_users
      WHERE email = auth.email() AND role IN ('admin', 'crochet', 'both')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_users
      WHERE email = auth.email() AND role IN ('admin', 'crochet', 'both')
    )
  );
