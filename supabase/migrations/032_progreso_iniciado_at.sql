-- Primera apertura del módulo (estudio antes del examen).
-- Aplicar antes de 033_admin_velocidad_capacitacion.sql

ALTER TABLE progreso
  ADD COLUMN IF NOT EXISTS iniciado_at TIMESTAMPTZ;

COMMENT ON COLUMN progreso.iniciado_at IS
  'Primera vez que el vendedor abrió el módulo (disponible o en_curso). NULL si nunca lo abrió.';

CREATE INDEX IF NOT EXISTS idx_progreso_iniciado_at
  ON progreso (user_id, modulo_id)
  WHERE iniciado_at IS NOT NULL;
