-- Patente opcional en atenciones del vendedor + órdenes de taller vinculadas.
-- Ejecutar manualmente en Supabase cuando confirmen.

-- ─── Atenciones ───────────────────────────────────────────────────────────────
alter table public.atenciones
  add column if not exists vehiculo_id uuid references public.vehiculos(id) on delete set null,
  add column if not exists patente_manual text;

create index if not exists idx_atenciones_vehiculo_id
  on public.atenciones(vehiculo_id)
  where vehiculo_id is not null;

comment on column public.atenciones.vehiculo_id is
  'Vehículo existente seleccionado por patente al registrar la atención.';
comment on column public.atenciones.patente_manual is
  'Patente ingresada cuando el vehículo aún no está en el sistema; el gomero completa el alta.';

-- ─── Órdenes de taller (visitas_taller) ─────────────────────────────────────
alter table public.visitas_taller
  add column if not exists atencion_id uuid references public.atenciones(id) on delete set null,
  add column if not exists patente_pendiente text;

-- Permite orden desde atención sin vehículo cargado aún
alter table public.visitas_taller
  alter column vehiculo_id drop not null;

create index if not exists idx_visitas_taller_atencion_id
  on public.visitas_taller(atencion_id)
  where atencion_id is not null;

comment on column public.visitas_taller.atencion_id is
  'Atención de venta que originó esta orden (vendedor).';
comment on column public.visitas_taller.patente_pendiente is
  'Patente cuando vehiculo_id es null; el gomero completa marca/modelo al tomar la orden.';
