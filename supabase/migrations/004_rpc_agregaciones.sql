-- 004_rpc_agregaciones.sql
-- RPC de agregaciones para reducir overfetching y cómputo en memoria.

-- 1) Dashboard: aprobados, promedio y última actividad por vendedor
create or replace function public.admin_dashboard_resumen()
returns table (
  id uuid,
  nombre text,
  apellido text,
  email text,
  modulos_aprobados bigint,
  promedio_notas numeric,
  ultima_actividad timestamptz,
  total_modulos bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with total_mod as (
    select count(*)::bigint as total_modulos
    from modulos
    where activo = true
  ),
  prog_aprobado as (
    select
      p.user_id,
      count(*)::bigint as modulos_aprobados,
      avg(nullif(p.mejor_nota, 0))::numeric as promedio_notas,
      max(p.ultimo_intento) as ultima_actividad
    from progreso p
    where p.estado = 'aprobado'
    group by p.user_id
  )
  select
    u.id,
    u.nombre::text,
    u.apellido::text,
    u.email::text,
    coalesce(pa.modulos_aprobados, 0)::bigint as modulos_aprobados,
    coalesce(pa.promedio_notas, 0)::numeric as promedio_notas,
    pa.ultima_actividad,
    tm.total_modulos
  from users u
  cross join total_mod tm
  left join prog_aprobado pa on pa.user_id = u.id
  where u.rol = 'vendedor' and u.activo = true
  order by u.apellido asc, u.nombre asc;
$$;

grant execute on function public.admin_dashboard_resumen() to authenticated;

-- 2) Reportes: progreso por vendedor
create or replace function public.admin_reportes_progreso()
returns table (
  nombre text,
  apellido text,
  email text,
  modulos_aprobados bigint,
  total_modulos bigint,
  porcentaje integer,
  promedio_notas numeric,
  total_intentos bigint,
  fecha_ultima_actividad timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with total_mod as (
    select count(*)::bigint as total_modulos
    from modulos
    where activo = true
  ),
  prog_agg as (
    select
      p.user_id,
      count(*) filter (where p.estado = 'aprobado')::bigint as modulos_aprobados,
      avg(nullif(p.mejor_nota, 0)) filter (where p.estado = 'aprobado')::numeric as promedio_notas,
      coalesce(sum(coalesce(p.intentos, 0)), 0)::bigint as total_intentos,
      max(p.ultimo_intento) as fecha_ultima_actividad
    from progreso p
    group by p.user_id
  )
  select
    u.nombre::text,
    u.apellido::text,
    u.email::text,
    coalesce(pa.modulos_aprobados, 0)::bigint as modulos_aprobados,
    tm.total_modulos,
    case
      when tm.total_modulos > 0
        then round((coalesce(pa.modulos_aprobados, 0)::numeric / tm.total_modulos::numeric) * 100)::int
      else 0
    end as porcentaje,
    coalesce(pa.promedio_notas, 0)::numeric as promedio_notas,
    coalesce(pa.total_intentos, 0)::bigint as total_intentos,
    pa.fecha_ultima_actividad
  from users u
  cross join total_mod tm
  left join prog_agg pa on pa.user_id = u.id
  where u.rol = 'vendedor'
  order by u.apellido asc, u.nombre asc;
$$;

grant execute on function public.admin_reportes_progreso() to authenticated;

-- 3) Reportes: distribución de calificaciones por vendedor
create or replace function public.admin_reportes_calificaciones()
returns table (
  nombre text,
  apellido text,
  email text,
  promedio numeric,
  promedio_vendedor numeric,
  promedio_empresa numeric,
  total_calificaciones bigint,
  estrellas5 bigint,
  estrellas4 bigint,
  estrellas3 bigint,
  estrellas2 bigint,
  estrellas1 bigint,
  vendedor5 bigint,
  vendedor4 bigint,
  vendedor3 bigint,
  vendedor2 bigint,
  vendedor1 bigint,
  empresa5 bigint,
  empresa4 bigint,
  empresa3 bigint,
  empresa2 bigint,
  empresa1 bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with c as (
    select
      vendedor_id,
      coalesce(estrellas, 0) as e_general,
      coalesce(estrellas_vendedor, estrellas) as e_vendedor,
      coalesce(estrellas_empresa, estrellas) as e_empresa
    from calificaciones_qr
  ),
  c_agg as (
    select
      vendedor_id,
      count(*)::bigint as total_calificaciones,
      avg(e_vendedor)::numeric as promedio,
      avg(e_vendedor)::numeric as promedio_vendedor,
      avg(e_empresa)::numeric as promedio_empresa,
      count(*) filter (where e_general = 5)::bigint as estrellas5,
      count(*) filter (where e_general = 4)::bigint as estrellas4,
      count(*) filter (where e_general = 3)::bigint as estrellas3,
      count(*) filter (where e_general = 2)::bigint as estrellas2,
      count(*) filter (where e_general = 1)::bigint as estrellas1,
      count(*) filter (where e_vendedor = 5)::bigint as vendedor5,
      count(*) filter (where e_vendedor = 4)::bigint as vendedor4,
      count(*) filter (where e_vendedor = 3)::bigint as vendedor3,
      count(*) filter (where e_vendedor = 2)::bigint as vendedor2,
      count(*) filter (where e_vendedor = 1)::bigint as vendedor1,
      count(*) filter (where e_empresa = 5)::bigint as empresa5,
      count(*) filter (where e_empresa = 4)::bigint as empresa4,
      count(*) filter (where e_empresa = 3)::bigint as empresa3,
      count(*) filter (where e_empresa = 2)::bigint as empresa2,
      count(*) filter (where e_empresa = 1)::bigint as empresa1
    from c
    group by vendedor_id
  )
  select
    u.nombre::text,
    u.apellido::text,
    u.email::text,
    coalesce(a.promedio, 0)::numeric as promedio,
    coalesce(a.promedio_vendedor, 0)::numeric as promedio_vendedor,
    coalesce(a.promedio_empresa, 0)::numeric as promedio_empresa,
    coalesce(a.total_calificaciones, 0)::bigint as total_calificaciones,
    coalesce(a.estrellas5, 0)::bigint as estrellas5,
    coalesce(a.estrellas4, 0)::bigint as estrellas4,
    coalesce(a.estrellas3, 0)::bigint as estrellas3,
    coalesce(a.estrellas2, 0)::bigint as estrellas2,
    coalesce(a.estrellas1, 0)::bigint as estrellas1,
    coalesce(a.vendedor5, 0)::bigint as vendedor5,
    coalesce(a.vendedor4, 0)::bigint as vendedor4,
    coalesce(a.vendedor3, 0)::bigint as vendedor3,
    coalesce(a.vendedor2, 0)::bigint as vendedor2,
    coalesce(a.vendedor1, 0)::bigint as vendedor1,
    coalesce(a.empresa5, 0)::bigint as empresa5,
    coalesce(a.empresa4, 0)::bigint as empresa4,
    coalesce(a.empresa3, 0)::bigint as empresa3,
    coalesce(a.empresa2, 0)::bigint as empresa2,
    coalesce(a.empresa1, 0)::bigint as empresa1
  from users u
  left join c_agg a on a.vendedor_id = u.id
  where u.rol = 'vendedor'
  order by u.apellido asc, u.nombre asc;
$$;

grant execute on function public.admin_reportes_calificaciones() to authenticated;

-- 4) Estadísticas: ventas por semana (últimas N semanas)
create or replace function public.admin_estadisticas_ventas_por_semana(p_weeks integer default 8)
returns table (
  semana text,
  ventas bigint,
  monto numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select greatest(1, least(coalesce(p_weeks, 8), 52))::int as weeks
  ),
  weeks as (
    select
      gs as week_start,
      (gs + interval '6 days') as week_end
    from bounds b
    cross join generate_series(
      date_trunc('week', now()) - ((b.weeks - 1) * interval '1 week'),
      date_trunc('week', now()),
      interval '1 week'
    ) gs
  ),
  sales as (
    select
      date_trunc('week', a.created_at) as wk,
      count(*)::bigint as ventas,
      coalesce(sum(coalesce(a.monto, 0)), 0)::numeric as monto
    from atenciones a
    where a.resultado = 'venta_cerrada'
    group by 1
  )
  select
    to_char(w.week_start, 'DD/MM') as semana,
    coalesce(s.ventas, 0)::bigint as ventas,
    coalesce(s.monto, 0)::numeric as monto
  from weeks w
  left join sales s on s.wk = date_trunc('week', w.week_start)
  order by w.week_start asc;
$$;

grant execute on function public.admin_estadisticas_ventas_por_semana(integer) to authenticated;

-- 5) Estadísticas: monto por mes (últimos N meses)
create or replace function public.admin_estadisticas_monto_por_mes(p_months integer default 6)
returns table (
  mes text,
  monto numeric,
  ventas bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select greatest(1, least(coalesce(p_months, 6), 24))::int as months
  ),
  months as (
    select gs as month_start
    from bounds b
    cross join generate_series(
      date_trunc('month', now()) - ((b.months - 1) * interval '1 month'),
      date_trunc('month', now()),
      interval '1 month'
    ) gs
  ),
  sales as (
    select
      date_trunc('month', a.created_at) as m,
      count(*)::bigint as ventas,
      coalesce(sum(coalesce(a.monto, 0)), 0)::numeric as monto
    from atenciones a
    where a.resultado = 'venta_cerrada'
    group by 1
  )
  select
    to_char(m.month_start, 'Mon') as mes,
    coalesce(s.monto, 0)::numeric as monto,
    coalesce(s.ventas, 0)::bigint as ventas
  from months m
  left join sales s on s.m = m.month_start
  order by m.month_start asc;
$$;

grant execute on function public.admin_estadisticas_monto_por_mes(integer) to authenticated;

-- 6) Notificaciones: conteo de no leídas
create or replace function public.admin_notificaciones_no_leidas_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from notificaciones_admin
  where leida = false;
$$;

grant execute on function public.admin_notificaciones_no_leidas_count() to authenticated;
