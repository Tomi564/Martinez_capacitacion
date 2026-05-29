-- RPC: métricas de velocidad de capacitación por vendedor (panel admin / Analíticas).
-- Requiere columna progreso.iniciado_at (migración 032).

CREATE OR REPLACE FUNCTION public.admin_velocidad_capacitacion()
RETURNS TABLE (
  user_id uuid,
  nombre text,
  apellido text,
  promedio_duracion_examen_seg numeric,
  tiempo_total_programa_dias numeric,
  modulo_mas_rapido text,
  modulo_mas_lento text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH total_modulos AS (
    SELECT count(*)::bigint AS n
    FROM modulos
    WHERE activo = true
  ),
  promedio_examen AS (
    SELECT
      ie.user_id,
      round(avg(ie.duracion_seg)::numeric, 0) AS promedio_duracion_examen_seg
    FROM intentos_examen ie
    WHERE ie.aprobado = true
      AND ie.duracion_seg IS NOT NULL
      AND ie.duracion_seg > 0
    GROUP BY ie.user_id
  ),
  aprobados_por_user AS (
    SELECT
      p.user_id,
      count(*)::bigint AS n_aprobados
    FROM progreso p
    WHERE p.estado = 'aprobado'
      AND p.completado_at IS NOT NULL
    GROUP BY p.user_id
  ),
  programa_completo AS (
    SELECT a.user_id
    FROM aprobados_por_user a
    CROSS JOIN total_modulos t
    WHERE t.n > 0
      AND a.n_aprobados >= t.n
  ),
  tiempo_programa AS (
    SELECT
      p.user_id,
      round(
        (extract(epoch FROM (max(p.completado_at) - min(p.completado_at))) / 86400.0)::numeric,
        1
      ) AS tiempo_total_programa_dias
    FROM progreso p
    INNER JOIN programa_completo pc ON pc.user_id = p.user_id
    WHERE p.estado = 'aprobado'
      AND p.completado_at IS NOT NULL
    GROUP BY p.user_id
  ),
  duraciones_modulo AS (
    SELECT
      p.user_id,
      m.orden,
      m.titulo,
      (extract(epoch FROM (p.completado_at - p.iniciado_at)) / 86400.0)::numeric AS dias
    FROM progreso p
    INNER JOIN modulos m ON m.id = p.modulo_id AND m.activo = true
    WHERE p.estado = 'aprobado'
      AND p.iniciado_at IS NOT NULL
      AND p.completado_at IS NOT NULL
      AND p.completado_at >= p.iniciado_at
  ),
  ranked AS (
    SELECT
      d.user_id,
      d.orden,
      d.titulo,
      d.dias,
      row_number() OVER (PARTITION BY d.user_id ORDER BY d.dias ASC, d.orden ASC) AS rn_asc,
      row_number() OVER (PARTITION BY d.user_id ORDER BY d.dias DESC, d.orden DESC) AS rn_desc
    FROM duraciones_modulo d
  ),
  modulo_rapido AS (
    SELECT
      r.user_id,
      format('M%s · %s (%s días)', r.orden, r.titulo, round(r.dias, 1))::text AS modulo_mas_rapido
    FROM ranked r
    WHERE r.rn_asc = 1
  ),
  modulo_lento AS (
    SELECT
      r.user_id,
      format('M%s · %s (%s días)', r.orden, r.titulo, round(r.dias, 1))::text AS modulo_mas_lento
    FROM ranked r
    WHERE r.rn_desc = 1
  )
  SELECT
    u.id AS user_id,
    u.nombre::text,
    u.apellido::text,
    pe.promedio_duracion_examen_seg,
    tp.tiempo_total_programa_dias,
    mr.modulo_mas_rapido,
    ml.modulo_mas_lento
  FROM users u
  LEFT JOIN promedio_examen pe ON pe.user_id = u.id
  LEFT JOIN tiempo_programa tp ON tp.user_id = u.id
  LEFT JOIN modulo_rapido mr ON mr.user_id = u.id
  LEFT JOIN modulo_lento ml ON ml.user_id = u.id
  WHERE u.rol = 'vendedor'
  ORDER BY u.apellido ASC, u.nombre ASC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_velocidad_capacitacion() TO authenticated;

COMMENT ON FUNCTION public.admin_velocidad_capacitacion() IS
  'Velocidad de capacitación por vendedor: promedio de examen, tiempo total del programa, módulo más rápido/lento.';
