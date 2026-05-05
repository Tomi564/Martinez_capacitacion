-- =====================================================
-- 020_gomero_orden_trabajo.sql
-- Rol gomero + orden de trabajo + RLS taller
-- orden_estado NULL = visitas previas al flujo gomero/mecánico
-- =====================================================

begin;

-- -----------------------------------------------------
-- 1) Rol gomero en users
-- -----------------------------------------------------

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'users_rol_check'
  ) then
    alter table users drop constraint users_rol_check;
  end if;
end $$;

alter table users
  add constraint users_rol_check
  check (rol in ('vendedor', 'admin', 'mecanico', 'gomero'));

-- -----------------------------------------------------
-- 2) Helpers RLS
-- -----------------------------------------------------

create or replace function is_gomero()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from users u
    where u.id = auth.uid()
      and u.rol = 'gomero'
      and u.activo = true
  );
$$;

create or replace function is_taller_staff()
returns boolean
language sql
stable
as $$
  select is_admin() or is_mecanico() or is_gomero();
$$;

-- -----------------------------------------------------
-- 3) visitas_taller
-- -----------------------------------------------------

alter table visitas_taller
  alter column mecanico_id drop not null;

alter table visitas_taller
  add column if not exists gomero_id uuid references users(id) on delete set null;

alter table visitas_taller
  add column if not exists orden_estado text;

alter table visitas_taller
  add column if not exists enviado_al_mecanico_at timestamptz;

alter table visitas_taller
  add column if not exists mecanico_tomo_at timestamptz;

alter table visitas_taller
  add column if not exists neumaticos_cambiados boolean;

alter table visitas_taller
  add column if not exists marca_neumatico text;

alter table visitas_taller
  add column if not exists medida_neumatico text;

alter table visitas_taller
  add column if not exists observaciones_gomero text;

alter table visitas_taller
  add column if not exists tren_delantero text;

alter table visitas_taller
  add column if not exists tren_alineado boolean;

alter table visitas_taller
  add column if not exists tren_balanceo boolean;

alter table visitas_taller
  add column if not exists amortiguadores_revisados boolean;

alter table visitas_taller
  add column if not exists auxilio_revisado boolean;

alter table visitas_taller
  add column if not exists presupuesto text;

alter table visitas_taller
  add column if not exists fotos_neumatico_urls text[];

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'visitas_taller_orden_estado_check'
  ) then
    alter table visitas_taller drop constraint visitas_taller_orden_estado_check;
  end if;
end $$;

alter table visitas_taller
  add constraint visitas_taller_orden_estado_check
  check (
    orden_estado is null
    or orden_estado in ('pendiente_gomero', 'pendiente_mecanico', 'finalizado', 'incompleto')
  );

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'visitas_taller_tren_delantero_check'
  ) then
    alter table visitas_taller drop constraint visitas_taller_tren_delantero_check;
  end if;
end $$;

alter table visitas_taller
  add constraint visitas_taller_tren_delantero_check
  check (tren_delantero is null or tren_delantero in ('x2', 'x4', 'no'));

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'visitas_taller_fotos_max_4'
  ) then
    alter table visitas_taller drop constraint visitas_taller_fotos_max_4;
  end if;
end $$;

alter table visitas_taller
  add constraint visitas_taller_fotos_max_4
  check (
    fotos_neumatico_urls is null
    or array_length(fotos_neumatico_urls, 1) is null
    or array_length(fotos_neumatico_urls, 1) <= 4
  );

create index if not exists idx_visitas_taller_orden_estado
  on visitas_taller (orden_estado);

create index if not exists idx_visitas_taller_enviado_mecanico
  on visitas_taller (enviado_al_mecanico_at)
  where orden_estado = 'pendiente_mecanico';

create index if not exists idx_visitas_taller_gomero_id
  on visitas_taller (gomero_id);

-- -----------------------------------------------------
-- 4) RLS clientes / vehículos
-- -----------------------------------------------------

drop policy if exists mecanico_admin_clientes_all on clientes;
drop policy if exists taller_staff_clientes_all on clientes;
create policy taller_staff_clientes_all on clientes
  for all
  using (is_taller_staff())
  with check (is_taller_staff());

drop policy if exists mecanico_admin_vehiculos_all on vehiculos;
drop policy if exists taller_staff_vehiculos_all on vehiculos;
create policy taller_staff_vehiculos_all on vehiculos
  for all
  using (is_taller_staff())
  with check (is_taller_staff());

-- -----------------------------------------------------
-- 5) RLS visitas_taller
-- -----------------------------------------------------

drop policy if exists admin_visitas_all on visitas_taller;
drop policy if exists mecanico_visitas_select on visitas_taller;
drop policy if exists mecanico_visitas_insert on visitas_taller;
drop policy if exists mecanico_visitas_update on visitas_taller;
drop policy if exists taller_visitas_select on visitas_taller;
drop policy if exists taller_visitas_insert on visitas_taller;
drop policy if exists taller_visitas_update on visitas_taller;

create policy admin_visitas_all on visitas_taller
  for all
  using (is_admin())
  with check (is_admin());

create policy taller_visitas_select on visitas_taller
  for select
  using (
    is_admin()
    or auth.uid() = gomero_id
    or (mecanico_id is not null and auth.uid() = mecanico_id)
  );

create policy taller_visitas_insert on visitas_taller
  for insert
  with check (
    is_admin()
    or (is_gomero() and auth.uid() = gomero_id)
    or (is_mecanico() and mecanico_id is not null and auth.uid() = mecanico_id)
  );

create policy taller_visitas_update on visitas_taller
  for update
  using (
    is_admin()
    or auth.uid() = gomero_id
    or (mecanico_id is not null and auth.uid() = mecanico_id)
  )
  with check (
    is_admin()
    or auth.uid() = gomero_id
    or (mecanico_id is not null and auth.uid() = mecanico_id)
  );

-- -----------------------------------------------------
-- 6) checklist_respuestas
-- -----------------------------------------------------

drop policy if exists admin_checklist_respuestas_all on checklist_respuestas;
drop policy if exists mecanico_checklist_respuestas_select on checklist_respuestas;
drop policy if exists mecanico_checklist_respuestas_write on checklist_respuestas;
drop policy if exists taller_checklist_respuestas_select on checklist_respuestas;
drop policy if exists taller_checklist_respuestas_write on checklist_respuestas;

create policy admin_checklist_respuestas_all on checklist_respuestas
  for all
  using (is_admin())
  with check (is_admin());

create policy taller_checklist_respuestas_select on checklist_respuestas
  for select
  using (
    exists (
      select 1
      from visitas_taller v
      where v.id = checklist_respuestas.visita_id
        and (
          is_admin()
          or (v.mecanico_id is not null and v.mecanico_id = auth.uid())
        )
    )
  );

create policy taller_checklist_respuestas_write on checklist_respuestas
  for all
  using (
    exists (
      select 1
      from visitas_taller v
      where v.id = checklist_respuestas.visita_id
        and (
          is_admin()
          or (v.mecanico_id is not null and v.mecanico_id = auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1
      from visitas_taller v
      where v.id = checklist_respuestas.visita_id
        and (
          is_admin()
          or (v.mecanico_id is not null and v.mecanico_id = auth.uid())
        )
    )
  );

-- -----------------------------------------------------
-- 7) checklist_items (lectura staff taller)
-- -----------------------------------------------------

drop policy if exists admin_checklist_items_write on checklist_items;
drop policy if exists mecanico_admin_checklist_items_select on checklist_items;
drop policy if exists taller_checklist_items_select on checklist_items;

create policy taller_checklist_items_select on checklist_items
  for select
  using (is_taller_staff());

create policy admin_checklist_items_write on checklist_items
  for all
  using (is_admin())
  with check (is_admin());

commit;
