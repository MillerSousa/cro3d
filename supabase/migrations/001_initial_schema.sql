-- ============================================================
-- Cro3D — Schema inicial
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Tabela de usuários permitidos
CREATE TABLE IF NOT EXISTS allowed_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'crochet', '3d', 'both')),
  created_at timestamptz DEFAULT now()
);

-- Inserir usuários iniciais
INSERT INTO allowed_users (email, name, role) VALUES
  ('millerdanielsousaaa@gmail.com', 'Miller', 'admin'),
  ('mariamaciel3113@gmail.com', 'Maria', 'crochet')
ON CONFLICT (email) DO NOTHING;

-- RLS em allowed_users
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

-- Apenas usuários autenticados leem (para o check de acesso)
CREATE POLICY "allowed_users_select" ON allowed_users
  FOR SELECT TO authenticated USING (true);

-- Apenas admin pode inserir/atualizar/excluir (gerenciado via admin tab)
CREATE POLICY "allowed_users_insert" ON allowed_users
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "allowed_users_update" ON allowed_users
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "allowed_users_delete" ON allowed_users
  FOR DELETE TO authenticated USING (true);


-- 2. Insumos (catálogo de materiais por usuário)
CREATE TABLE IF NOT EXISTS insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  unit_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insumos_own" ON insumos
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- 3. Modelos do dashboard
CREATE TABLE IF NOT EXISTS dashboard_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  type text NOT NULL CHECK (type IN ('crochet', '3d')),
  name text NOT NULL,
  photo_url text,
  price_per_unit numeric NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_production', 'discontinued')),
  materials text,
  yarn_used text,
  stl_link text,
  material_link text,
  youtube_link text,
  tutorial_link text,
  notes text,
  tips text,
  time_hours integer,
  time_minutes integer,
  cost_breakdown jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dashboard_models ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode LER todos os modelos
CREATE POLICY "dashboard_models_select" ON dashboard_models
  FOR SELECT TO authenticated USING (true);

-- Apenas o dono pode inserir, atualizar, excluir
CREATE POLICY "dashboard_models_insert" ON dashboard_models
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "dashboard_models_update" ON dashboard_models
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "dashboard_models_delete" ON dashboard_models
  FOR DELETE TO authenticated USING (user_id = auth.uid());


-- 4. Storage bucket para fotos dos modelos
-- Execute no Supabase Dashboard > Storage > New bucket
-- Nome: model-photos, público: sim
-- Ou via SQL:
INSERT INTO storage.buckets (id, name, public)
  VALUES ('model-photos', 'model-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage: usuários autenticados podem fazer upload
CREATE POLICY "model_photos_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'model-photos');

CREATE POLICY "model_photos_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'model-photos');

CREATE POLICY "model_photos_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'model-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
