-- Revisión manual de preguntas de desarrollo en exámenes.

ALTER TABLE public.intentos_examen
  ADD COLUMN IF NOT EXISTS revision_estado text
    CHECK (revision_estado IS NULL OR revision_estado IN ('pendiente', 'revisado', 'automatico'));

ALTER TABLE public.intentos_examen
  ADD COLUMN IF NOT EXISTS revision_admin_id uuid
    REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.intentos_examen
  ADD COLUMN IF NOT EXISTS revision_puntaje_ajustado jsonb;

ALTER TABLE public.intentos_examen
  ADD COLUMN IF NOT EXISTS revision_nota_final numeric(5, 2);

COMMENT ON COLUMN public.intentos_examen.revision_estado IS
  'pendiente: desarrollo con puntaje auto < 100% a revisar; revisado: corregido por admin; automatico: sin revisión manual.';

COMMENT ON COLUMN public.intentos_examen.revision_puntaje_ajustado IS
  'Mapa { pregunta_id: puntaje_manual } asignado por admin en preguntas de desarrollo.';

COMMENT ON COLUMN public.intentos_examen.revision_nota_final IS
  'Nota % recalculada tras revisión manual (revision_estado = revisado).';

CREATE INDEX IF NOT EXISTS idx_intentos_examen_revision_estado
  ON public.intentos_examen (revision_estado)
  WHERE revision_estado IS NOT NULL;

-- Intentos históricos sin revisión manual explícita.
UPDATE public.intentos_examen
SET revision_estado = 'automatico'
WHERE revision_estado IS NULL;
