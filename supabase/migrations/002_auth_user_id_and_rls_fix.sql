-- ============================================================
-- Cro3D — Migração 002
-- 1. Adiciona auth_user_id em allowed_users (necessário para stats)
-- 2. Corrige políticas RLS: só admin pode escrever em allowed_users
-- ============================================================

-- 1. Coluna que vincula o registro ao UID real do Supabase Auth
ALTER TABLE allowed_users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

CREATE INDEX IF NOT EXISTS allowed_users_auth_user_id_idx
  ON allowed_users (auth_user_id);


-- 2. Função auxiliar que verifica se o usuário autenticado é admin
--    SECURITY DEFINER para bypassar RLS e evitar recursão infinita
CREATE OR REPLACE FUNCTION is_cro3d_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_users
    WHERE email = auth.email()
    AND role = 'admin'
  )
$$;


-- 3. Substituir políticas de escrita permissivas por políticas admin-only

DROP POLICY IF EXISTS "allowed_users_insert" ON allowed_users;
DROP POLICY IF EXISTS "allowed_users_update" ON allowed_users;
DROP POLICY IF EXISTS "allowed_users_delete" ON allowed_users;

CREATE POLICY "allowed_users_insert_admin" ON allowed_users
  FOR INSERT TO authenticated
  WITH CHECK (is_cro3d_admin());

CREATE POLICY "allowed_users_update_admin" ON allowed_users
  FOR UPDATE TO authenticated
  USING (is_cro3d_admin());

CREATE POLICY "allowed_users_delete_admin" ON allowed_users
  FOR DELETE TO authenticated
  USING (is_cro3d_admin());
