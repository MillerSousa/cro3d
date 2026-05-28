-- ============================================================
-- 003: printers, filament_brands, filaments
-- Execute no Supabase SQL Editor
-- ============================================================

-- ── 1. IMPRESSORAS (por usuário) ─────────────────────────────
CREATE TABLE IF NOT EXISTS printers (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    REFERENCES auth.users NOT NULL,
  name       text    NOT NULL,
  wattage    numeric NOT NULL DEFAULT 200,
  created_at timestamp DEFAULT now()
);

ALTER TABLE printers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own printers"
  ON printers FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 2. MARCAS DE FILAMENTO ───────────────────────────────────
CREATE TABLE IF NOT EXISTS filament_brands (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  website_url text NOT NULL,
  logo_url    text,
  created_at  timestamp DEFAULT now()
);

ALTER TABLE filament_brands ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler
CREATE POLICY "Authenticated read brands"
  ON filament_brands FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas admin (allowed_users.role = 'admin') pode escrever
CREATE POLICY "Admin manage brands"
  ON filament_brands FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM allowed_users
      WHERE email = auth.email() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_users
      WHERE email = auth.email() AND role = 'admin'
    )
  );

-- Marcas pré-cadastradas
INSERT INTO filament_brands (name, website_url, logo_url) VALUES
  ('3D Fila',  'https://3dfila.com.br',
   'https://3dfila.com.br/wp-content/uploads/2025/05/cropped-icone-logo-270x270.webp'),
  ('3D Lab',   'https://3dlab.com.br',
   'https://www.google.com/s2/favicons?domain=3dlab.com.br&sz=128'),
  ('F3D',      'https://www.filamentos3dbrasil.com.br',
   'https://acdn-us.mitiendanube.com/stores/033/056/themes/common/logo-1981042973-1767633408-4efaf7c238293ae13dccd95815d905bf1767633408.png?0'),
  ('Voolt3D',  'https://voolt3d.com.br',
   'https://acdn-us.mitiendanube.com/stores/005/959/122/themes/common/ogimage-1749243594-1751541039-7a3d9b9d4db70508b41942cfdf3023201751541039.png?0');

-- ── 3. FILAMENTOS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS filaments (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id     uuid    REFERENCES filament_brands(id) ON DELETE SET NULL,
  name         text    NOT NULL,
  price_per_kg numeric NOT NULL,
  created_at   timestamp DEFAULT now()
);

ALTER TABLE filaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read filaments"
  ON filaments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage filaments"
  ON filaments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM allowed_users
      WHERE email = auth.email() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_users
      WHERE email = auth.email() AND role = 'admin'
    )
  );

-- Filamentos pré-cadastrados (sem marca)
INSERT INTO filaments (brand_id, name, price_per_kg) VALUES
  (null, 'ABS',  69.40),
  (null, 'PETG', 89.90),
  (null, 'PLA',  85.40),
  (null, 'TPU',  129.90);
