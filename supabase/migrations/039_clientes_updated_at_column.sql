-- Reparación idempotente si 038 falló a mitad (trigger sin columna updated_at).
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.clientes
SET updated_at = COALESCE(updated_at, now())
WHERE updated_at IS NULL;
