-- 036_calificaciones_taller.sql
-- QR y calificaciones del taller (gomeros y mecánicos).
-- NO EJECUTAR hasta confirmación del equipo.

-- ─────────────────────────────────────────────────────
-- QR del taller (separado del QR de vendedores)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qr_taller_codigos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  codigo     TEXT NOT NULL UNIQUE,
  activo     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_taller_codigos_user_id ON qr_taller_codigos(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_taller_codigos_codigo ON qr_taller_codigos(codigo);

COMMENT ON TABLE qr_taller_codigos IS 'Código QR personal de gomeros y mecánicos (distinto al de vendedores).';

-- ─────────────────────────────────────────────────────
-- Calificaciones del taller
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calificaciones_taller (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rol          TEXT NOT NULL CHECK (rol IN ('gomero', 'mecanico')),
  estrellas    SMALLINT NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario   TEXT,
  ip_cliente   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calificaciones_taller_empleado_id
  ON calificaciones_taller(empleado_id);

CREATE INDEX IF NOT EXISTS idx_calificaciones_taller_created_at
  ON calificaciones_taller(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calificaciones_taller_rol
  ON calificaciones_taller(rol);

COMMENT ON TABLE calificaciones_taller IS 'Valoraciones anónimas de clientes al personal del taller (gomero/mecánico).';

-- RLS (opcional; el backend usa service role)
ALTER TABLE qr_taller_codigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones_taller ENABLE ROW LEVEL SECURITY;
