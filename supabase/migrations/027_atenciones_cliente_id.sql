-- Vincula atenciones de venta con un cliente de la tabla clientes (opcional).

ALTER TABLE public.atenciones
  ADD COLUMN IF NOT EXISTS cliente_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.atenciones'::regclass
      AND conname = 'atenciones_cliente_id_fkey'
  ) THEN
    ALTER TABLE public.atenciones
      ADD CONSTRAINT atenciones_cliente_id_fkey
      FOREIGN KEY (cliente_id)
      REFERENCES public.clientes(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_atenciones_cliente_id
  ON public.atenciones(cliente_id)
  WHERE cliente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_atenciones_cliente_created_at
  ON public.atenciones(cliente_id, created_at DESC)
  WHERE cliente_id IS NOT NULL;

COMMENT ON COLUMN public.atenciones.cliente_id IS
  'Cliente asociado a la atención (tabla clientes). NULL si no se cargaron datos de cliente.';
