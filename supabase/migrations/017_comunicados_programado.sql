-- Permite programar comunicados para una fecha/hora futura (activación automática por cron en backend).
alter table comunicados add column if not exists programado_para timestamptz;

create index if not exists idx_comunicados_programado_pendientes
  on comunicados (programado_para asc)
  where activo = false and programado_para is not null;
