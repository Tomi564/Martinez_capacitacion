-- Persistencia de la sesión de examen (orden de preguntas para validar submit tras restart/deploy).
-- El backend usa service role; sin políticas RLS pensadas para cliente anon/authenticated.

create table if not exists examenes_servidos (
  user_id       uuid not null references users (id) on delete cascade,
  modulo_id     uuid not null references modulos (id) on delete cascade,
  pregunta_ids  uuid[] not null,
  updated_at    timestamptz not null default now(),
  primary key (user_id, modulo_id)
);

create index if not exists idx_examenes_servidos_updated_at
  on examenes_servidos (updated_at desc);

comment on table examenes_servidos is
  'IDs de preguntas del último GET /examenes/:modulo/preguntas por usuario+módulo; se borra tras submit OK.';
