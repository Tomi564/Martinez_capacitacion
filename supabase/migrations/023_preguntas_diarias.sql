-- =====================================================
-- Preguntas diarias (refuerzo post-capacitación)
-- Dominio aparte del banco preguntas(modulo_id).
-- fecha = día calendario en la TZ que use la API (recomendado: America/Argentina/Buenos_Aires).
-- Trigger updated_at: usa update_updated_at() (001 / 016).
-- =====================================================

-- Tipos de pregunta para el ABM
create table if not exists preguntas_diarias (
  id                  uuid primary key default gen_random_uuid(),
  enunciado           text not null,
  categoria           text not null check (categoria in ('ventas', 'producto')),
  opciones            jsonb not null,
  respuesta_correcta  text not null,
  explicacion         text,
  activo              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint preguntas_diarias_opciones_object check (jsonb_typeof(opciones) = 'array')
);

create index if not exists idx_preguntas_diarias_categoria_activo
  on preguntas_diarias (categoria, activo);

-- Par (ventas + producto) fijo por usuario y día
create table if not exists asignaciones_pregunta_diaria (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references users (id) on delete cascade,
  fecha                  date not null,
  pregunta_ventas_id     uuid not null references preguntas_diarias (id) on delete restrict,
  pregunta_producto_id   uuid not null references preguntas_diarias (id) on delete restrict,
  created_at             timestamptz not null default now(),
  unique (user_id, fecha),
  constraint asignaciones_misma_fila_distinta check (pregunta_ventas_id <> pregunta_producto_id)
);

create index if not exists idx_asignaciones_pregunta_diaria_user_fecha
  on asignaciones_pregunta_diaria (user_id, fecha desc);

-- Una respuesta por pregunta por usuario por día calendario
create table if not exists respuestas_pregunta_diaria (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references users (id) on delete cascade,
  pregunta_diaria_id   uuid not null references preguntas_diarias (id) on delete restrict,
  fecha                date not null,
  opcion_elegida       text not null,
  es_correcta          boolean not null,
  created_at           timestamptz not null default now(),
  unique (user_id, pregunta_diaria_id, fecha)
);

create index if not exists idx_respuestas_pregunta_diaria_user_fecha
  on respuestas_pregunta_diaria (user_id, fecha desc);

create index if not exists idx_respuestas_pregunta_diaria_pregunta
  on respuestas_pregunta_diaria (pregunta_diaria_id);

create index if not exists idx_respuestas_pregunta_diaria_created
  on respuestas_pregunta_diaria (created_at desc);

drop trigger if exists tr_preguntas_diarias_updated_at on preguntas_diarias;
create trigger tr_preguntas_diarias_updated_at
  before update on preguntas_diarias
  for each row execute function update_updated_at();

-- RLS (alinear con 002_rls_policies.sql)
alter table preguntas_diarias enable row level security;
alter table asignaciones_pregunta_diaria enable row level security;
alter table respuestas_pregunta_diaria enable row level security;

create policy "admin_gestiona_preguntas_diarias"
  on preguntas_diarias for all
  using (exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin'));

create policy "admin_ve_asignaciones_pregunta_diaria"
  on asignaciones_pregunta_diaria for all
  using (exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin'));

create policy "admin_ve_respuestas_pregunta_diaria"
  on respuestas_pregunta_diaria for all
  using (exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin'));

create policy "vendedor_ve_sus_asignaciones_diarias"
  on asignaciones_pregunta_diaria for select
  using (user_id = auth.uid());

create policy "vendedor_ve_sus_respuestas_diarias"
  on respuestas_pregunta_diaria for select
  using (user_id = auth.uid());

create policy "vendedor_inserta_sus_respuestas_diarias"
  on respuestas_pregunta_diaria for insert
  with check (user_id = auth.uid());
