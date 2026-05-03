-- 1) updated_at por si falta la columna (trigger update_updated_at)
ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2) Unificar patentes equivalentes antes de cambiar formato (ej. "ABC123" y "ABC 123")
--    violate unique constraint). Se conserva el vehículo más antiguo, se mueven visitas
--    y opcionalmente se copia cliente_id si el ganador era null.

CREATE TEMP TABLE _pat_norm AS
SELECT
  id,
  regexp_replace(upper(trim(patente)), '[^A-Z0-9]', '', 'g') AS norm
FROM vehiculos
WHERE patente IS NOT NULL
  AND length(trim(patente)) > 0;

CREATE TEMP TABLE _pat_keepers AS
SELECT DISTINCT ON (p.norm)
  p.norm,
  v.id AS keeper_id
FROM vehiculos v
JOIN _pat_norm p ON p.id = v.id
WHERE length(p.norm) > 0
ORDER BY p.norm, v.created_at ASC NULLS LAST, v.id ASC;

CREATE TEMP TABLE _pat_losers AS
SELECT p.id AS loser_id,
       k.keeper_id
FROM _pat_norm p
JOIN _pat_keepers k ON k.norm = p.norm
WHERE p.id <> k.keeper_id;

UPDATE visitas_taller vt SET vehiculo_id = l.keeper_id
FROM _pat_losers l
WHERE vt.vehiculo_id = l.loser_id;

UPDATE vehiculos keeper SET cliente_id = loser.cliente_id
FROM vehiculos loser JOIN _pat_losers l ON loser.id = l.loser_id
WHERE keeper.id = l.keeper_id
  AND keeper.cliente_id IS NULL AND loser.cliente_id IS NOT NULL;

DELETE FROM vehiculos WHERE id IN (SELECT loser_id FROM _pat_losers);

DROP TABLE _pat_losers;
DROP TABLE _pat_keepers;
DROP TABLE _pat_norm;

-- 3) Patente canónica: sólo A–Z y 0–9 (sin espacios)
UPDATE vehiculos
SET patente = regexp_replace(upper(trim(patente)), '[^A-Z0-9]', '', 'g')
WHERE patente IS NOT NULL
  AND length(trim(patente)) > 0;
