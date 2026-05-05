-- Marca si ya se envió la alerta push de +2h sin tomar la orden (evita spam).
alter table visitas_taller
  add column if not exists alerta_sin_mecanico_2h_enviada_at timestamptz;
