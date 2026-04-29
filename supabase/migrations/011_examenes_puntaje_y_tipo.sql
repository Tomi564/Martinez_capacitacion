-- =====================================================
-- 011_examenes_puntaje_y_tipo.sql
-- Extiende preguntas para soportar:
-- - tipo de pregunta (incluye desarrollo)
-- - puntaje por pregunta
-- =====================================================

begin;

alter table public.preguntas
  add column if not exists tipo text
  check (tipo in ('opcion_unica', 'verdadero_falso', 'caso_practico', 'desarrollo'));

alter table public.preguntas
  add column if not exists puntaje numeric(6,2);

update public.preguntas
set tipo = coalesce(tipo, 'opcion_unica');

update public.preguntas
set puntaje = coalesce(puntaje, 1);

alter table public.preguntas
  alter column tipo set default 'opcion_unica';

alter table public.preguntas
  alter column tipo set not null;

alter table public.preguntas
  alter column puntaje set default 1;

alter table public.preguntas
  alter column puntaje set not null;

create index if not exists idx_preguntas_tipo on public.preguntas(tipo);

commit;

