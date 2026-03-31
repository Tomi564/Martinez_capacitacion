-- =====================================================
-- 002_rls_policies.sql
-- Políticas de Row Level Security (RLS)
-- Ejecutar DESPUÉS de 001_initial_schema.sql
--
-- RLS es la segunda línea de defensa:
-- aunque alguien consiga conectarse a Supabase directamente,
-- solo puede ver los datos que le corresponden.
-- =====================================================

-- Activar RLS en todas las tablas sensibles
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso           ENABLE ROW LEVEL SECURITY;
ALTER TABLE intentos_examen    ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones_qr  ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codigos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE preguntas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos            ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────
-- POLÍTICAS: users
-- ─────────────────────────────────────────────────────

-- Un usuario solo puede ver su propio perfil
CREATE POLICY "usuario_ve_su_perfil"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Solo admins pueden ver todos los usuarios
CREATE POLICY "admin_ve_todos_los_usuarios"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Solo admins pueden crear usuarios
CREATE POLICY "admin_crea_usuarios"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Solo admins pueden modificar usuarios
CREATE POLICY "admin_modifica_usuarios"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────
-- POLÍTICAS: modulos
-- ─────────────────────────────────────────────────────

-- Todos los usuarios autenticados pueden ver módulos activos
CREATE POLICY "usuarios_ven_modulos_activos"
  ON modulos FOR SELECT
  USING (activo = true AND auth.uid() IS NOT NULL);

-- Solo admins pueden crear, editar y desactivar módulos
CREATE POLICY "admin_gestiona_modulos"
  ON modulos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────
-- POLÍTICAS: preguntas
-- ─────────────────────────────────────────────────────

-- Los vendedores pueden ver preguntas activas
-- PERO el backend nunca envía la respuesta_correcta al frontend
CREATE POLICY "usuarios_ven_preguntas_activas"
  ON preguntas FOR SELECT
  USING (activo = true AND auth.uid() IS NOT NULL);

-- Solo admins gestionan el banco de preguntas
CREATE POLICY "admin_gestiona_preguntas"
  ON preguntas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────
-- POLÍTICAS: progreso
-- ─────────────────────────────────────────────────────

-- Un vendedor solo ve su propio progreso
CREATE POLICY "vendedor_ve_su_progreso"
  ON progreso FOR SELECT
  USING (auth.uid() = user_id);

-- Un vendedor solo puede modificar su propio progreso
CREATE POLICY "vendedor_modifica_su_progreso"
  ON progreso FOR UPDATE
  USING (auth.uid() = user_id);

-- El sistema puede insertar progreso para cualquier usuario
-- (cuando se crea un usuario nuevo, se inicializa su progreso)
CREATE POLICY "sistema_inserta_progreso"
  ON progreso FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admin ve y gestiona todo el progreso
CREATE POLICY "admin_gestiona_progreso"
  ON progreso FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────
-- POLÍTICAS: intentos_examen
-- ─────────────────────────────────────────────────────

-- Un vendedor solo ve su propio historial de intentos
CREATE POLICY "vendedor_ve_sus_intentos"
  ON intentos_examen FOR SELECT
  USING (auth.uid() = user_id);

-- Un vendedor solo puede insertar sus propios intentos
CREATE POLICY "vendedor_inserta_sus_intentos"
  ON intentos_examen FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin ve todos los intentos
CREATE POLICY "admin_ve_todos_los_intentos"
  ON intentos_examen FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────
-- POLÍTICAS: qr_codigos
-- ─────────────────────────────────────────────────────

-- Un vendedor solo ve su propio código QR
CREATE POLICY "vendedor_ve_su_qr"
  ON qr_codigos FOR SELECT
  USING (auth.uid() = user_id);

-- El sistema puede insertar QR para cualquier usuario
CREATE POLICY "sistema_inserta_qr"
  ON qr_codigos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admin ve todos los QR
CREATE POLICY "admin_ve_todos_los_qr"
  ON qr_codigos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────
-- POLÍTICAS: calificaciones_qr
-- ─────────────────────────────────────────────────────

-- Cualquiera puede insertar una calificación (clientes sin cuenta)
-- El control de spam se hace por IP en el backend
CREATE POLICY "publico_puede_calificar"
  ON calificaciones_qr FOR INSERT
  WITH CHECK (true);

-- Un vendedor solo ve las calificaciones que recibió
CREATE POLICY "vendedor_ve_sus_calificaciones"
  ON calificaciones_qr FOR SELECT
  USING (auth.uid() = vendedor_id);

-- Admin ve todas las calificaciones
CREATE POLICY "admin_ve_todas_las_calificaciones"
  ON calificaciones_qr FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );