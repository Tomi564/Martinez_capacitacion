-- =====================================================
-- 037_users_sucursal.sql
-- Sucursal fija por usuario del equipo (vendedor / gomero / mecánico)
-- Ejecutar en Supabase SQL Editor después de confirmar.
-- =====================================================

-- Catálogo fijo de sucursales (mismos strings que usa la app)
-- 'Sucursal Chile'
-- 'Sucursal Sarmiento'
-- 'Sucursal Tres Cerritos'
-- 'Sucursal Jujuy'

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS sucursal TEXT;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_sucursal_check;

ALTER TABLE users
  ADD CONSTRAINT users_sucursal_check
  CHECK (
    sucursal IS NULL
    OR sucursal IN (
      'Sucursal Chile',
      'Sucursal Sarmiento',
      'Sucursal Tres Cerritos',
      'Sucursal Jujuy'
    )
  );

COMMENT ON COLUMN users.sucursal IS
  'Sucursal asignada al usuario del equipo. NULL = sin restricción (legacy).';

CREATE INDEX IF NOT EXISTS idx_users_sucursal
  ON users (sucursal)
  WHERE sucursal IS NOT NULL;
