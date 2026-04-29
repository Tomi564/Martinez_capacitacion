-- =====================================================
-- 017_add_mecanico_role_and_rls.sql
-- Agrega rol mecanico en users + políticas RLS para taller
-- =====================================================

begin;

-- -----------------------------------------------------
-- users.rol: incluir mecanico
-- -----------------------------------------------------

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'users_rol_check'
  ) then
    alter table users drop constraint users_rol_check;
  end if;
end $$;

alter table users
  add constraint users_rol_check
  check (rol in ('vendedor', 'admin', 'mecanico'));

-- -----------------------------------------------------
-- Helpers RLS por rol
-- -----------------------------------------------------

create or replace function is_mecanico()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from users u
    where u.id = auth.uid()
      and u.rol = 'mecanico'
      and u.activo = true
  );
$$;

create or replace function is_admin_or_mecanico()
returns boolean
language sql
stable
as $$
  select is_admin() or is_mecanico();
$$;

-- -----------------------------------------------------
-- RLS taller: mecánico/admin
-- -----------------------------------------------------

-- clientes
drop policy if exists admin_all_clientes on clientes;
drop policy if exists mecanico_admin_clientes_all on clientes;
create policy mecanico_admin_clientes_all on clientes
  for all
  using (is_admin_or_mecanico())
  with check (is_admin_or_mecanico());

-- vehiculos
drop policy if exists admin_all_vehiculos on vehiculos;
drop policy if exists mecanico_admin_vehiculos_all on vehiculos;
create policy mecanico_admin_vehiculos_all on vehiculos
  for all
  using (is_admin_or_mecanico())
  with check (is_admin_or_mecanico());

-- visitas_taller
drop policy if exists admin_all_visitas_taller on visitas_taller;
drop policy if exists mecanico_visitas_select on visitas_taller;
drop policy if exists mecanico_visitas_insert on visitas_taller;
drop policy if exists mecanico_visitas_update on visitas_taller;
drop policy if exists admin_visitas_all on visitas_taller;

create policy admin_visitas_all on visitas_taller
  for all
  using (is_admin())
  with check (is_admin());

create policy mecanico_visitas_select on visitas_taller
  for select
  using (auth.uid() = mecanico_id or is_admin());

create policy mecanico_visitas_insert on visitas_taller
  for insert
  with check ((auth.uid() = mecanico_id and is_mecanico()) or is_admin());

create policy mecanico_visitas_update on visitas_taller
  for update
  using (auth.uid() = mecanico_id or is_admin())
  with check (auth.uid() = mecanico_id or is_admin());

-- checklist_items
drop policy if exists admin_all_checklist_items on checklist_items;
drop policy if exists mecanico_admin_checklist_items_select on checklist_items;
drop policy if exists admin_checklist_items_write on checklist_items;

create policy mecanico_admin_checklist_items_select on checklist_items
  for select
  using (is_admin_or_mecanico());

create policy admin_checklist_items_write on checklist_items
  for all
  using (is_admin())
  with check (is_admin());

-- checklist_respuestas
drop policy if exists admin_all_checklist_respuestas on checklist_respuestas;
drop policy if exists mecanico_checklist_respuestas_select on checklist_respuestas;
drop policy if exists mecanico_checklist_respuestas_write on checklist_respuestas;
drop policy if exists admin_checklist_respuestas_all on checklist_respuestas;

create policy admin_checklist_respuestas_all on checklist_respuestas
  for all
  using (is_admin())
  with check (is_admin());

create policy mecanico_checklist_respuestas_select on checklist_respuestas
  for select
  using (
    exists (
      select 1
      from visitas_taller v
      where v.id = checklist_respuestas.visita_id
        and (v.mecanico_id = auth.uid() or is_admin())
    )
  );

create policy mecanico_checklist_respuestas_write on checklist_respuestas
  for all
  using (
    exists (
      select 1
      from visitas_taller v
      where v.id = checklist_respuestas.visita_id
        and (v.mecanico_id = auth.uid() or is_admin())
    )
  )
  with check (
    exists (
      select 1
      from visitas_taller v
      where v.id = checklist_respuestas.visita_id
        and (v.mecanico_id = auth.uid() or is_admin())
    )
  );

commit;
