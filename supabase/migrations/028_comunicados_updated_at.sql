-- La tabla comunicados pudo crearse sin updated_at (CREATE TABLE IF NOT EXISTS no agrega columnas).
-- El trigger tr_comunicados_updated_at falla con: record "new" has no field "updated_at".

alter table public.comunicados
  add column if not exists updated_at timestamptz not null default now();

-- Alinear filas existentes con created_at cuando el default de ADD COLUMN no aplique en todas las versiones.
update public.comunicados
set updated_at = created_at
where updated_at is distinct from created_at
  and created_at is not null;
