-- Amplía los valores permitidos de atenciones.canal para alinear con el formulario del vendedor.
-- Antes: presencial, whatsapp, mercadolibre
-- Después: + instagram, otro, telefono

-- Si el nombre del constraint difiere en tu instancia, verificá con:
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.atenciones'::regclass AND contype = 'c';

ALTER TABLE public.atenciones
  DROP CONSTRAINT IF EXISTS atenciones_canal_check;

ALTER TABLE public.atenciones
  ADD CONSTRAINT atenciones_canal_check
  CHECK (
    canal IN (
      'presencial',
      'whatsapp',
      'mercadolibre',
      'instagram',
      'otro',
      'telefono'
    )
  );

COMMENT ON COLUMN public.atenciones.canal IS
  'Canal de contacto: presencial, whatsapp, mercadolibre, instagram, otro, telefono';
