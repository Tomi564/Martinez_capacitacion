-- =====================================================
-- 022_seed_gomero_prueba.sql
-- Usuario GOMERO de prueba (desarrollo)
-- Ejecutar DESPUÉS de 020 (rol gomero en users_rol_check)
--
-- Email: gomero@martinez.com
-- Password: Gomero1234!
-- Hash bcrypt saltRounds: 12 (mismo criterio que 003_seed_data.sql)
-- =====================================================

INSERT INTO users (
  id,
  email,
  password_hash,
  nombre,
  apellido,
  rol,
  activo
) VALUES (
  uuid_generate_v4(),
  'gomero@martinez.com',
  '$2b$12$5H6rRDrjhtBJc2RMifPCYOtZ5bguogPILOVNxKWyMdSgDnHEtNgYO', -- Gomero1234!
  'Carlos',
  'Gómez',
  'gomero',
  true
)
ON CONFLICT (email) DO NOTHING;
