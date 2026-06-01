-- Catálogo de ítems del presupuesto interno (hoja física Martínez Neumáticos).
-- Líneas por visita en visita_presupuesto_lineas.

create table if not exists presupuesto_item_catalogo (
  id uuid primary key default gen_random_uuid(),
  grupo text not null check (grupo in ('tren_delantero', 'tren_trasero', 'frenos', 'cubierta')),
  orden smallint not null,
  etiqueta text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (grupo, orden)
);

create index if not exists idx_presupuesto_item_catalogo_grupo on presupuesto_item_catalogo (grupo, activo);

create table if not exists visita_presupuesto_lineas (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid not null references visitas_taller(id) on delete cascade,
  item_catalogo_id uuid not null references presupuesto_item_catalogo(id) on delete restrict,
  marcado boolean not null default false,
  cantidad numeric(10,2) not null default 1 check (cantidad >= 0),
  precio numeric(12,2) check (precio is null or precio >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (visita_id, item_catalogo_id)
);

create index if not exists idx_visita_presupuesto_lineas_visita on visita_presupuesto_lineas (visita_id);

alter table visitas_taller
  add column if not exists operario_responsable text;

comment on column visitas_taller.operario_responsable is 'Nombre del operario/mecánico responsable del presupuesto.';

comment on table presupuesto_item_catalogo is 'Catálogo fijo de ítems de la hoja de presupuesto interno.';
comment on table visita_presupuesto_lineas is 'Ítems marcados y precios por visita de taller.';

-- Seed catálogo (idempotente por grupo+orden)
insert into presupuesto_item_catalogo (grupo, orden, etiqueta) values
  ('tren_delantero', 1, 'Juego de Bujes'),
  ('tren_delantero', 2, 'Bujes Tensor'),
  ('tren_delantero', 3, 'Bujes Barra Estabiliz.'),
  ('tren_delantero', 4, 'Bieleta Barra Estabiliz.'),
  ('tren_delantero', 5, 'Rótulas'),
  ('tren_delantero', 6, 'Extremos de Dirección'),
  ('tren_delantero', 7, 'Axiales'),
  ('tren_delantero', 8, 'Caja de Dirección'),
  ('tren_delantero', 9, 'Guardapolvos de Dirección'),
  ('tren_delantero', 10, 'Junta de Homocinética'),
  ('tren_delantero', 11, 'Guardapolvos Junta Homoc.'),
  ('tren_delantero', 12, 'Rodamientos de Ruedas'),
  ('tren_delantero', 13, 'Semiejes'),
  ('tren_delantero', 14, 'Amortiguadores Delanteros'),
  ('tren_delantero', 15, 'Parrilla Superior'),
  ('tren_delantero', 16, 'Parrilla Inferior'),
  ('tren_delantero', 17, 'Barra Estabilizadora'),
  ('tren_delantero', 18, 'Cazoleta Amortiguador'),
  ('tren_delantero', 19, 'Crapodina Amortiguador'),
  ('tren_delantero', 20, 'Espirales'),
  ('tren_delantero', 21, 'Base Espireles'),
  ('tren_delantero', 22, 'Falso Brazo'),
  ('tren_delantero', 23, 'Brazo Pitman'),
  ('tren_trasero', 1, 'Amortiguadores Traseros'),
  ('tren_trasero', 2, 'Bujes Suspensión'),
  ('tren_trasero', 3, 'Parrillas'),
  ('tren_trasero', 4, 'Bujes Tensores'),
  ('tren_trasero', 5, 'Elásticos'),
  ('tren_trasero', 6, 'Bujes Barra Estabilizadora'),
  ('tren_trasero', 7, 'Espirales'),
  ('frenos', 1, 'Juego de Pastillas'),
  ('frenos', 2, 'Rectificado de Discos'),
  ('frenos', 3, 'Rectificado de Campanas'),
  ('frenos', 4, 'Encintado de Patines'),
  ('frenos', 5, 'Discos'),
  ('frenos', 6, 'Cilindros'),
  ('frenos', 7, 'Cubetas'),
  ('frenos', 8, 'Guardapolvos'),
  ('frenos', 9, 'Bomba de Frenos'),
  ('frenos', 10, 'Reparación de Servo'),
  ('frenos', 11, 'Líquido de Freno'),
  ('frenos', 12, 'Mano de Obra'),
  ('cubierta', 1, 'Fate'),
  ('cubierta', 2, 'Continental'),
  ('cubierta', 3, 'Michelin'),
  ('cubierta', 4, 'General Tire'),
  ('cubierta', 5, 'BF Goodrich'),
  ('cubierta', 6, 'Cámaras'),
  ('cubierta', 7, 'Balanceos Autos'),
  ('cubierta', 8, 'Balanceos Cmta.'),
  ('cubierta', 9, 'Alineado'),
  ('cubierta', 10, 'Nitrógeno'),
  ('cubierta', 11, 'Antióxido'),
  ('cubierta', 12, 'Parches'),
  ('cubierta', 13, 'Seguros de Neumáticos'),
  ('cubierta', 14, 'Rotación'),
  ('cubierta', 15, 'Mano de Obra'),
  ('cubierta', 16, 'Varios'),
  ('cubierta', 17, 'Corrección de comba')
on conflict (grupo, orden) do update set etiqueta = excluded.etiqueta, activo = true;
