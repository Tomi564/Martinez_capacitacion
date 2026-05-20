-- =====================================================
-- Preguntas diarias: vincular cada pregunta a un módulo
-- El pool del vendedor filtra por módulos con progreso.estado = 'aprobado'.
-- modulo_id NULL = sin asignar (legacy); el admin las asigna desde el panel.
-- =====================================================

alter table preguntas_diarias
  add column if not exists modulo_id uuid references modulos (id) on delete set null;

comment on column preguntas_diarias.modulo_id is
  'Módulo de capacitación al que pertenece la pregunta. NULL = pendiente de asignación (datos legacy).';

-- Consultas del pool: módulos aprobados + categoría + activo
create index if not exists idx_preguntas_diarias_modulo_categoria_activo
  on preguntas_diarias (modulo_id, categoria, activo)
  where activo = true;

-- Listado admin por módulo
create index if not exists idx_preguntas_diarias_modulo_id
  on preguntas_diarias (modulo_id)
  where modulo_id is not null;
