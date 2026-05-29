-- 034_users_fk_visitas_mecanico_set_null.sql
-- Permite eliminar usuarios del equipo sin bloqueo por visitas_taller.mecanico_id.
--
-- Estado previo (016): mecanico_id NOT NULL + ON DELETE RESTRICT → impide DELETE en users.
-- 020 ya dejó mecanico_id nullable; esta migración alinea la FK con ON DELETE SET NULL.
--
-- Otras FK a users (referencia para operaciones):
--   CASCADE: progreso, intentos_examen, codigos_qr, calificaciones_qr (vendedor_id),
--            atenciones, objetivos, push_subscriptions, ranking_*,
--            asignaciones_pregunta_diaria, respuestas_pregunta_diaria, examenes_servidos
--   SET NULL: participantes_sorteo.vendedor_id, notificaciones_admin.user_id,
--            sugerencias_dev.user_id, visitas_taller.gomero_id, visitas_taller.updated_by_admin_id,
--            auditoria_operacional.usuario_id
--   RESTRICT (solo esta, hasta aplicar este archivo): visitas_taller.mecanico_id

ALTER TABLE public.visitas_taller
  ALTER COLUMN mecanico_id DROP NOT NULL;

ALTER TABLE public.visitas_taller
  DROP CONSTRAINT IF EXISTS visitas_taller_mecanico_id_fkey;

ALTER TABLE public.visitas_taller
  ADD CONSTRAINT visitas_taller_mecanico_id_fkey
  FOREIGN KEY (mecanico_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;
