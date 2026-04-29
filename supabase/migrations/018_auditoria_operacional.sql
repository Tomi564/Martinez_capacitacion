-- 018_auditoria_operacional.sql
-- Tabla y función de auditoría operacional para acciones sensibles.

create table if not exists public.auditoria_operacional (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.users(id) on delete set null,
  rol text not null,
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_auditoria_operacional_created_at
  on public.auditoria_operacional(created_at desc);

create index if not exists idx_auditoria_operacional_rol_accion
  on public.auditoria_operacional(rol, accion);

create index if not exists idx_auditoria_operacional_entidad
  on public.auditoria_operacional(entidad, entidad_id);

alter table public.auditoria_operacional enable row level security;

-- Solo admin autenticado puede leer.
drop policy if exists "auditoria_admin_select" on public.auditoria_operacional;
create policy "auditoria_admin_select"
on public.auditoria_operacional
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.rol = 'admin'
      and u.activo = true
  )
);

-- Sin políticas de escritura: nadie escribe directo sobre la tabla.
-- Para reforzar, se revocan permisos DML para roles de cliente.
revoke insert, update, delete on public.auditoria_operacional from anon, authenticated;

create or replace function public.registrar_auditoria_operacional(
  p_usuario_id uuid,
  p_rol text,
  p_accion text,
  p_entidad text,
  p_entidad_id uuid default null,
  p_datos_anteriores jsonb default null,
  p_datos_nuevos jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.auditoria_operacional (
    usuario_id,
    rol,
    accion,
    entidad,
    entidad_id,
    datos_anteriores,
    datos_nuevos
  )
  values (
    p_usuario_id,
    coalesce(nullif(trim(p_rol), ''), 'desconocido'),
    coalesce(nullif(trim(p_accion), ''), 'sin_accion'),
    coalesce(nullif(trim(p_entidad), ''), 'sin_entidad'),
    p_entidad_id,
    p_datos_anteriores,
    p_datos_nuevos
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.registrar_auditoria_operacional(uuid, text, text, text, uuid, jsonb, jsonb) from public;
grant execute on function public.registrar_auditoria_operacional(uuid, text, text, text, uuid, jsonb, jsonb) to authenticated;
