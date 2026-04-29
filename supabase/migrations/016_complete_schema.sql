-- =====================================================
-- 016_complete_schema.sql
-- Completa el schema usado por backend (tablas, FKs, índices, triggers y RLS)
-- =====================================================

begin;

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------
-- Ajustes de tablas existentes para compatibilidad backend
-- -----------------------------------------------------

alter table if exists modulos
  add column if not exists porcentaje_aprobacion numeric(5,2) not null default 80;

alter table if exists preguntas
  add column if not exists explicacion text;

alter table if exists calificaciones_qr
  add column if not exists estrellas_vendedor integer,
  add column if not exists estrellas_empresa integer;

update calificaciones_qr
set estrellas_vendedor = coalesce(estrellas_vendedor, estrellas),
    estrellas_empresa = coalesce(estrellas_empresa, estrellas)
where estrellas_vendedor is null
   or estrellas_empresa is null;

alter table if exists calificaciones_qr
  alter column estrellas_vendedor set not null,
  alter column estrellas_empresa set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'calificaciones_qr_estrellas_vendedor_check'
  ) then
    alter table calificaciones_qr
      add constraint calificaciones_qr_estrellas_vendedor_check
      check (estrellas_vendedor between 1 and 5);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'calificaciones_qr_estrellas_empresa_check'
  ) then
    alter table calificaciones_qr
      add constraint calificaciones_qr_estrellas_empresa_check
      check (estrellas_empresa between 1 and 5);
  end if;
end $$;

-- -----------------------------------------------------
-- Tablas faltantes usadas por backend
-- -----------------------------------------------------

create table if not exists clientes (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  apellido text not null,
  dni text,
  telefono text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_clientes_dni_unique
  on clientes (dni)
  where dni is not null;

create table if not exists vehiculos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete set null,
  patente text not null,
  marca text not null,
  modelo text not null,
  anio integer,
  medida_rueda text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_vehiculos_patente_unique
  on vehiculos (upper(patente));
create index if not exists idx_vehiculos_cliente_id on vehiculos(cliente_id);
create index if not exists idx_vehiculos_created_at on vehiculos(created_at desc);

create table if not exists visitas_taller (
  id uuid primary key default uuid_generate_v4(),
  vehiculo_id uuid not null references vehiculos(id) on delete cascade,
  mecanico_id uuid not null references users(id) on delete restrict,
  estado text not null default 'en_revision' check (estado in ('en_revision', 'listo', 'entregado')),
  estado_visita text not null default 'abierta' check (estado_visita in ('abierta', 'cerrada')),
  motivo text,
  observaciones text,
  km integer,
  estado_neumaticos text,
  estado_frenos text,
  presion_psi numeric(6,2),
  recomendacion text,
  diagnostico_enviado boolean not null default false,
  updated_by_admin_at timestamptz,
  updated_by_admin_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visitas_taller_mecanico_id on visitas_taller(mecanico_id);
create index if not exists idx_visitas_taller_vehiculo_id on visitas_taller(vehiculo_id);
create index if not exists idx_visitas_taller_created_at on visitas_taller(created_at desc);
create index if not exists idx_visitas_taller_estado on visitas_taller(estado, estado_visita);

create table if not exists checklist_items (
  id uuid primary key default uuid_generate_v4(),
  descripcion text not null,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_checklist_items_orden_unique
  on checklist_items (orden);

create table if not exists checklist_respuestas (
  id uuid primary key default uuid_generate_v4(),
  visita_id uuid not null references visitas_taller(id) on delete cascade,
  item_id uuid not null references checklist_items(id) on delete cascade,
  estado text not null check (estado in ('ok', 'revisar', 'urgente')),
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_checklist_respuestas_unique
  on checklist_respuestas (visita_id, item_id);
create index if not exists idx_checklist_respuestas_visita_id on checklist_respuestas(visita_id);

create table if not exists atenciones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  canal text not null check (canal in ('presencial', 'whatsapp', 'mercadolibre')),
  resultado text not null check (resultado in ('venta_cerrada', 'no_venta', 'pendiente')),
  producto text,
  monto numeric(12,2),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_atenciones_user_id on atenciones(user_id);
create index if not exists idx_atenciones_resultado_created_at on atenciones(resultado, created_at desc);
create index if not exists idx_atenciones_created_at on atenciones(created_at desc);

create table if not exists objetivos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  mes integer not null check (mes between 1 and 12),
  anio integer not null check (anio between 2000 and 2100),
  meta_ventas integer not null default 0 check (meta_ventas >= 0),
  meta_conversion numeric(5,2) not null default 0 check (meta_conversion >= 0 and meta_conversion <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, mes, anio)
);

create index if not exists idx_objetivos_user_id on objetivos(user_id);
create index if not exists idx_objetivos_mes_anio on objetivos(mes, anio);

create table if not exists productos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  marca text not null,
  descripcion text,
  codigo text,
  precio numeric(12,2),
  stock integer not null default 0,
  activo boolean not null default true,
  imagen_url text,
  medida text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_productos_activo_marca_nombre on productos(activo, marca, nombre);
create unique index if not exists idx_productos_codigo_unique
  on productos(codigo)
  where codigo is not null;

create table if not exists comunicados (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  contenido text not null,
  activo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comunicados_activo_created_at on comunicados(activo, created_at desc);

create table if not exists notificaciones_admin (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null,
  titulo text not null,
  mensaje text not null,
  user_id uuid references users(id) on delete set null,
  modulo_id uuid references modulos(id) on delete set null,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notificaciones_admin_leida_created on notificaciones_admin(leida, created_at desc);
create index if not exists idx_notificaciones_admin_user_id on notificaciones_admin(user_id);

create table if not exists sugerencias_dev (
  id uuid primary key default uuid_generate_v4(),
  texto text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'visto', 'en_progreso', 'listo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sugerencias_dev_estado_created on sugerencias_dev(estado, created_at desc);

create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);

create table if not exists participantes_sorteo (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  apellido text not null,
  dni text not null,
  contacto text not null,
  vendedor_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_participantes_sorteo_dni_unique on participantes_sorteo(dni);
create index if not exists idx_participantes_sorteo_vendedor_id on participantes_sorteo(vendedor_id);

create table if not exists ranking_notificaciones_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  tipo text not null check (tipo in ('te_superaron', 'subiste_posicion', 'cierre_semanal', 'reinicio_lunes')),
  titulo text not null,
  cuerpo text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ranking_notif_user_created on ranking_notificaciones_log(user_id, created_at desc);
create index if not exists idx_ranking_notif_tipo_created on ranking_notificaciones_log(tipo, created_at desc);

create table if not exists ranking_estado_semanal (
  id uuid primary key default uuid_generate_v4(),
  semana_inicio date not null,
  user_id uuid not null references users(id) on delete cascade,
  posicion integer not null check (posicion > 0),
  ventas integer not null default 0 check (ventas >= 0),
  monto numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(semana_inicio, user_id)
);

create index if not exists idx_ranking_estado_semana on ranking_estado_semanal(semana_inicio);

-- -----------------------------------------------------
-- Trigger updated_at para tablas nuevas y existentes ampliadas
-- -----------------------------------------------------

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_clientes_updated_at on clientes;
create trigger tr_clientes_updated_at
before update on clientes
for each row execute function update_updated_at();

drop trigger if exists tr_vehiculos_updated_at on vehiculos;
create trigger tr_vehiculos_updated_at
before update on vehiculos
for each row execute function update_updated_at();

drop trigger if exists tr_visitas_taller_updated_at on visitas_taller;
create trigger tr_visitas_taller_updated_at
before update on visitas_taller
for each row execute function update_updated_at();

drop trigger if exists tr_checklist_items_updated_at on checklist_items;
create trigger tr_checklist_items_updated_at
before update on checklist_items
for each row execute function update_updated_at();

drop trigger if exists tr_checklist_respuestas_updated_at on checklist_respuestas;
create trigger tr_checklist_respuestas_updated_at
before update on checklist_respuestas
for each row execute function update_updated_at();

drop trigger if exists tr_atenciones_updated_at on atenciones;
create trigger tr_atenciones_updated_at
before update on atenciones
for each row execute function update_updated_at();

drop trigger if exists tr_objetivos_updated_at on objetivos;
create trigger tr_objetivos_updated_at
before update on objetivos
for each row execute function update_updated_at();

drop trigger if exists tr_productos_updated_at on productos;
create trigger tr_productos_updated_at
before update on productos
for each row execute function update_updated_at();

drop trigger if exists tr_comunicados_updated_at on comunicados;
create trigger tr_comunicados_updated_at
before update on comunicados
for each row execute function update_updated_at();

drop trigger if exists tr_sugerencias_dev_updated_at on sugerencias_dev;
create trigger tr_sugerencias_dev_updated_at
before update on sugerencias_dev
for each row execute function update_updated_at();

drop trigger if exists tr_push_subscriptions_updated_at on push_subscriptions;
create trigger tr_push_subscriptions_updated_at
before update on push_subscriptions
for each row execute function update_updated_at();

drop trigger if exists tr_participantes_sorteo_updated_at on participantes_sorteo;
create trigger tr_participantes_sorteo_updated_at
before update on participantes_sorteo
for each row execute function update_updated_at();

drop trigger if exists tr_ranking_estado_semanal_updated_at on ranking_estado_semanal;
create trigger tr_ranking_estado_semanal_updated_at
before update on ranking_estado_semanal
for each row execute function update_updated_at();

-- -----------------------------------------------------
-- RLS: habilitación tablas nuevas
-- -----------------------------------------------------

alter table clientes enable row level security;
alter table vehiculos enable row level security;
alter table visitas_taller enable row level security;
alter table checklist_items enable row level security;
alter table checklist_respuestas enable row level security;
alter table atenciones enable row level security;
alter table objetivos enable row level security;
alter table productos enable row level security;
alter table comunicados enable row level security;
alter table notificaciones_admin enable row level security;
alter table sugerencias_dev enable row level security;
alter table push_subscriptions enable row level security;
alter table participantes_sorteo enable row level security;
alter table ranking_notificaciones_log enable row level security;
alter table ranking_estado_semanal enable row level security;

-- -----------------------------------------------------
-- RLS helper
-- -----------------------------------------------------

create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from users u
    where u.id = auth.uid()
      and u.rol = 'admin'
      and u.activo = true
  );
$$;

-- -----------------------------------------------------
-- RLS policies nuevas (base)
-- -----------------------------------------------------

drop policy if exists admin_all_clientes on clientes;
create policy admin_all_clientes on clientes
  for all using (is_admin()) with check (is_admin());

drop policy if exists admin_all_vehiculos on vehiculos;
create policy admin_all_vehiculos on vehiculos
  for all using (is_admin()) with check (is_admin());

drop policy if exists admin_all_visitas_taller on visitas_taller;
create policy admin_all_visitas_taller on visitas_taller
  for all using (is_admin()) with check (is_admin());

drop policy if exists admin_all_checklist_items on checklist_items;
create policy admin_all_checklist_items on checklist_items
  for all using (is_admin()) with check (is_admin());

drop policy if exists admin_all_checklist_respuestas on checklist_respuestas;
create policy admin_all_checklist_respuestas on checklist_respuestas
  for all using (is_admin()) with check (is_admin());

drop policy if exists vendedor_admin_atenciones_select on atenciones;
create policy vendedor_admin_atenciones_select on atenciones
  for select using (is_admin() or auth.uid() = user_id);

drop policy if exists vendedor_admin_atenciones_insert on atenciones;
create policy vendedor_admin_atenciones_insert on atenciones
  for insert with check (is_admin() or auth.uid() = user_id);

drop policy if exists vendedor_admin_atenciones_update on atenciones;
create policy vendedor_admin_atenciones_update on atenciones
  for update using (is_admin() or auth.uid() = user_id)
  with check (is_admin() or auth.uid() = user_id);

drop policy if exists admin_objetivos_all on objetivos;
create policy admin_objetivos_all on objetivos
  for all using (is_admin()) with check (is_admin());

drop policy if exists vendedor_objetivos_select on objetivos;
create policy vendedor_objetivos_select on objetivos
  for select using (auth.uid() = user_id or is_admin());

drop policy if exists productos_select_auth on productos;
create policy productos_select_auth on productos
  for select using (auth.uid() is not null);

drop policy if exists productos_admin_write on productos;
create policy productos_admin_write on productos
  for all using (is_admin()) with check (is_admin());

drop policy if exists comunicados_select_auth on comunicados;
create policy comunicados_select_auth on comunicados
  for select using (auth.uid() is not null);

drop policy if exists comunicados_admin_write on comunicados;
create policy comunicados_admin_write on comunicados
  for all using (is_admin()) with check (is_admin());

drop policy if exists notificaciones_admin_select on notificaciones_admin;
create policy notificaciones_admin_select on notificaciones_admin
  for select using (is_admin());

drop policy if exists notificaciones_admin_write on notificaciones_admin;
create policy notificaciones_admin_write on notificaciones_admin
  for all using (is_admin()) with check (is_admin());

drop policy if exists sugerencias_admin_all on sugerencias_dev;
create policy sugerencias_admin_all on sugerencias_dev
  for all using (is_admin()) with check (is_admin());

drop policy if exists push_subscription_own on push_subscriptions;
create policy push_subscription_own on push_subscriptions
  for all
  using (is_admin() or auth.uid() = user_id)
  with check (is_admin() or auth.uid() = user_id);

drop policy if exists participantes_admin_select on participantes_sorteo;
create policy participantes_admin_select on participantes_sorteo
  for select using (is_admin());

drop policy if exists participantes_public_insert on participantes_sorteo;
create policy participantes_public_insert on participantes_sorteo
  for insert with check (true);

drop policy if exists ranking_log_admin_select on ranking_notificaciones_log;
create policy ranking_log_admin_select on ranking_notificaciones_log
  for select using (is_admin());

drop policy if exists ranking_log_system_insert on ranking_notificaciones_log;
create policy ranking_log_system_insert on ranking_notificaciones_log
  for insert with check (auth.uid() is not null or is_admin());

drop policy if exists ranking_estado_admin_select on ranking_estado_semanal;
create policy ranking_estado_admin_select on ranking_estado_semanal
  for select using (is_admin());

drop policy if exists ranking_estado_admin_write on ranking_estado_semanal;
create policy ranking_estado_admin_write on ranking_estado_semanal
  for all using (is_admin()) with check (is_admin());

commit;
