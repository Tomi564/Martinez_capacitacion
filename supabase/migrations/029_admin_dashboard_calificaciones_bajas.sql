-- Calificaciones QR bajas (1–2 estrellas al vendedor) en los últimos 7 días, para alertas del panel admin.

create or replace function public.admin_dashboard_calificaciones_bajas_7d()
returns table (
  vendedor_id uuid,
  nombre text,
  apellido text,
  estrellas integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id as vendedor_id,
    u.nombre::text,
    u.apellido::text,
    min(c.estrellas_vendedor)::integer as estrellas
  from calificaciones_qr c
  inner join users u on u.id = c.vendedor_id
  where c.created_at >= (now() - interval '7 days')
    and c.estrellas_vendedor between 1 and 2
    and u.rol = 'vendedor'
    and u.activo = true
  group by u.id, u.nombre, u.apellido
  order by min(c.estrellas_vendedor) asc, u.apellido asc, u.nombre asc;
$$;

grant execute on function public.admin_dashboard_calificaciones_bajas_7d() to authenticated;
