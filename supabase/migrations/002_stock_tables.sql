-- ============================================================
-- Cro3D — Módulo de Estoque
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- Adiciona crochet_recipe ao dashboard_models (caso não exista)
ALTER TABLE dashboard_models ADD COLUMN IF NOT EXISTS crochet_recipe text;

-- 1. Estoque de fios (crochê)
CREATE TABLE IF NOT EXISTS yarn_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  brand text,
  name text NOT NULL,
  color text NOT NULL,
  color_hex text,
  weight_grams text,
  quantity_grams numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE yarn_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yarn_stock_own" ON yarn_stock
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Estoque de filamentos (3D)
CREATE TABLE IF NOT EXISTS filament_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  filament_id uuid REFERENCES filaments(id),
  brand_id uuid REFERENCES filament_brands(id),
  color text NOT NULL,
  color_hex text,
  quantity_grams numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE filament_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "filament_stock_own" ON filament_stock
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Lista de compras
CREATE TABLE IF NOT EXISTS shopping_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  type text NOT NULL CHECK (type IN ('crochet', '3d')),
  name text NOT NULL,
  brand text,
  color text,
  color_hex text,
  quantity_grams numeric,
  reason text,
  priority text DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'low')),
  purchase_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'purchased')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopping_list_own" ON shopping_list
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Histórico de produção
CREATE TABLE IF NOT EXISTS production_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  model_id uuid REFERENCES dashboard_models(id),
  model_name text NOT NULL,
  produced_at timestamptz DEFAULT now(),
  materials_used jsonb
);

ALTER TABLE production_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production_history_own" ON production_history
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
