-- =====================================================
-- 001_initial_schema.sql
-- Schema inicial de la base de datos
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- Extensión para generar UUIDs automáticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────
-- TABLA: users
-- Vendedores y administradores del sistema
-- ─────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  apellido      TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('vendedor', 'admin')),
  activo        BOOLEAN DEFAULT true,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- TABLA: modulos
-- Unidades de capacitación en orden secuencial
-- ─────────────────────────────────────────────────────
CREATE TABLE modulos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo        TEXT NOT NULL,
  descripcion   TEXT,
  orden         INTEGER NOT NULL UNIQUE,
  video_url     TEXT,
  pdf_url       TEXT,
  duracion_min  INTEGER DEFAULT 30,
  activo        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- TABLA: preguntas
-- Banco de preguntas por módulo
-- opciones es JSONB: [{ "id": "a", "texto": "..." }, ...]
-- ─────────────────────────────────────────────────────
CREATE TABLE preguntas (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modulo_id          UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  enunciado          TEXT NOT NULL,
  opciones           JSONB NOT NULL,
  respuesta_correcta TEXT NOT NULL,
  activo             BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- TABLA: progreso
-- Estado de cada vendedor en cada módulo
-- Un registro por combinación usuario+módulo
-- ─────────────────────────────────────────────────────
CREATE TABLE progreso (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  modulo_id      UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  estado         TEXT NOT NULL CHECK (estado IN ('bloqueado', 'disponible', 'en_curso', 'aprobado')),
  intentos       INTEGER DEFAULT 0,
  mejor_nota     DECIMAL(5,2) DEFAULT 0,
  ultimo_intento TIMESTAMPTZ,
  completado_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, modulo_id)
);

-- ─────────────────────────────────────────────────────
-- TABLA: intentos_examen
-- Historial completo de cada intento de examen
-- ─────────────────────────────────────────────────────
CREATE TABLE intentos_examen (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  modulo_id    UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  respuestas   JSONB NOT NULL,
  nota         DECIMAL(5,2) NOT NULL,
  aprobado     BOOLEAN NOT NULL,
  duracion_seg INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- TABLA: qr_codigos
-- Código QR único por vendedor
-- ─────────────────────────────────────────────────────
CREATE TABLE qr_codigos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  codigo     TEXT NOT NULL UNIQUE,
  activo     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- TABLA: calificaciones_qr
-- Evaluaciones anónimas de clientes a vendedores
-- ─────────────────────────────────────────────────────
CREATE TABLE calificaciones_qr (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendedor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  estrellas   INTEGER NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario  TEXT,
  ip_cliente  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- ÍNDICES para performance en queries frecuentes
-- ─────────────────────────────────────────────────────
CREATE INDEX idx_progreso_user_id       ON progreso(user_id);
CREATE INDEX idx_progreso_modulo_id     ON progreso(modulo_id);
CREATE INDEX idx_intentos_user_id       ON intentos_examen(user_id);
CREATE INDEX idx_intentos_modulo_id     ON intentos_examen(modulo_id);
CREATE INDEX idx_calificaciones_vendedor ON calificaciones_qr(vendedor_id);
CREATE INDEX idx_preguntas_modulo       ON preguntas(modulo_id);

-- ─────────────────────────────────────────────────────
-- FUNCIÓN + TRIGGERS: updated_at automático
-- Actualiza el campo updated_at cada vez que se modifica un registro
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_modulos_updated_at
  BEFORE UPDATE ON modulos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_progreso_updated_at
  BEFORE UPDATE ON progreso
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();