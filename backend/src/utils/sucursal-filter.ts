import { supabase } from '../config/database';
import type { SucursalNombre } from '../constants/sucursales';

/** IDs de usuarios del equipo con la sucursal indicada (caché por request vía Map opcional). */
export async function idsUsuariosPorSucursal(sucursal: SucursalNombre): Promise<string[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('sucursal', sucursal)
    .in('rol', ['vendedor', 'gomero', 'mecanico']);

  if (error) return [];
  return (data || []).map((u) => u.id as string);
}

/** Sucursal actual en DB (no JWT). Admin → null. */
export async function sucursalUsuarioDesdeDb(
  userId: string,
  rol: string,
): Promise<string | null> {
  if (rol === 'admin') return null;

  const { data, error } = await supabase
    .from('users')
    .select('sucursal')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return (data.sucursal as string | null) ?? null;
}

/**
 * Filtro PostgREST para visitas_taller visibles por un mecánico con sucursal:
 * órdenes de gomeros de la sucursal + revisiones propias sin gomero (gomero_id null).
 */
export function orFiltroVisitasMecanicoConSucursal(
  mecanicoId: string,
  gomeroIds: string[],
): string {
  if (!gomeroIds.length) {
    return `and(gomero_id.is.null,mecanico_id.eq.${mecanicoId})`;
  }
  const inGomeros = gomeroIds.join(',');
  return `gomero_id.in.(${inGomeros}),and(gomero_id.is.null,mecanico_id.eq.${mecanicoId})`;
}

export async function idsGomerosPorSucursal(sucursal: SucursalNombre): Promise<string[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('sucursal', sucursal)
    .eq('rol', 'gomero');

  if (error) return [];
  return (data || []).map((u) => u.id as string);
}

/** Para filtrar visitas: gomero de la sucursal o mecánico de la sucursal. */
export async function idsVendedoresPorSucursal(sucursal: SucursalNombre): Promise<string[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('sucursal', sucursal)
    .eq('rol', 'vendedor');

  if (error) return [];
  return (data || []).map((u) => u.id as string);
}

/** true si la atención fue registrada por el vendedor indicado */
export async function atencionEsDelVendedor(
  atencionId: string,
  vendedorId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('atenciones')
    .select('id')
    .eq('id', atencionId)
    .eq('user_id', vendedorId)
    .maybeSingle();

  return !error && !!data;
}

/** true si la atención fue registrada por un vendedor de la sucursal indicada */
export async function atencionEsDeVendedoresSucursal(
  atencionId: string,
  sucursal: SucursalNombre,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('atenciones')
    .select('id, users!inner(sucursal, rol)')
    .eq('id', atencionId)
    .eq('users.sucursal', sucursal)
    .eq('users.rol', 'vendedor')
    .maybeSingle();

  return !error && !!data;
}

/** Sucursal del vendedor que registró la atención (null si no hay o sin sucursal). */
export async function sucursalDesdeAtencionId(atencionId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('atenciones')
    .select('users!inner(sucursal, rol)')
    .eq('id', atencionId)
    .maybeSingle();

  if (error || !data?.users) return null;
  const u = data.users as { sucursal?: string | null; rol?: string };
  if (u.rol !== 'vendedor') return null;
  return (u.sucursal as string | null) ?? null;
}

/**
 * IDs de órdenes del pool (gomero_id null) cuya atención es de un vendedor de la sucursal.
 * El pool abierto suele ser pequeño; evita filtrar visitas_taller con miles de atencion_id.
 */
export async function idsOrdenesPoolPorSucursal(sucursal: SucursalNombre): Promise<string[]> {
  const vendedorIds = await idsVendedoresPorSucursal(sucursal);
  if (!vendedorIds.length) return [];

  const { data: pool, error } = await supabase
    .from('visitas_taller')
    .select('id, atencion_id')
    .is('gomero_id', null)
    .not('atencion_id', 'is', null);

  if (error || !pool?.length) return [];

  const atencionIds = [
    ...new Set(pool.map((p) => p.atencion_id).filter(Boolean) as string[]),
  ];
  if (!atencionIds.length) return [];

  const { data: validAtenciones, error: aErr } = await supabase
    .from('atenciones')
    .select('id')
    .in('id', atencionIds)
    .in('user_id', vendedorIds);

  if (aErr || !validAtenciones?.length) return [];

  const validSet = new Set(validAtenciones.map((a) => a.id as string));
  return pool
    .filter((p) => p.atencion_id && validSet.has(p.atencion_id))
    .map((p) => p.id as string);
}

const ORDENES_GOMERO_SELECT = `*, vehiculos(patente, marca, modelo, clientes(nombre, apellido, telefono)),
  atenciones(id, user_id, clientes(nombre, apellido, telefono))`;

/** Listado mergeado: órdenes tomadas por gomeros de la sucursal + pool de vendedores de la sucursal. */
export async function listarOrdenesGomeroPorSucursal(params: {
  sucursal: SucursalNombre;
  gomeroIds: string[];
  limit: number;
  offset: number;
}): Promise<{ ordenes: unknown[]; total: number }> {
  const { sucursal, gomeroIds, limit, offset } = params;
  const byId = new Map<string, Record<string, unknown>>();

  if (gomeroIds.length) {
    const { data, error } = await supabase
      .from('visitas_taller')
      .select(ORDENES_GOMERO_SELECT)
      .in('gomero_id', gomeroIds);
    if (error) throw error;
    for (const row of data || []) {
      byId.set(row.id as string, row as Record<string, unknown>);
    }
  }

  const poolIds = await idsOrdenesPoolPorSucursal(sucursal);
  if (poolIds.length) {
    const { data, error } = await supabase
      .from('visitas_taller')
      .select(ORDENES_GOMERO_SELECT)
      .in('id', poolIds);
    if (error) throw error;
    for (const row of data || []) {
      byId.set(row.id as string, row as Record<string, unknown>);
    }
  }

  const merged = [...byId.values()].sort(
    (a, b) =>
      new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime(),
  );

  return {
    ordenes: merged.slice(offset, offset + limit),
    total: merged.length,
  };
}

export async function idsVehiculosConVisitasTallerPorSucursal(
  sucursal: SucursalNombre,
): Promise<string[]> {
  const vehiculoIds = new Set<string>();
  const gomeroIds = await idsGomerosPorSucursal(sucursal);

  if (gomeroIds.length) {
    const { data: visitas } = await supabase
      .from('visitas_taller')
      .select('vehiculo_id')
      .in('gomero_id', gomeroIds)
      .not('vehiculo_id', 'is', null);
    for (const v of visitas || []) {
      if (v.vehiculo_id) vehiculoIds.add(v.vehiculo_id as string);
    }
  }

  const vendedorIds = await idsVendedoresPorSucursal(sucursal);
  if (vendedorIds.length) {
    const { data: pool, error } = await supabase
      .from('visitas_taller')
      .select('vehiculo_id, atencion_id')
      .is('gomero_id', null)
      .not('atencion_id', 'is', null);
    if (!error && pool?.length) {
      const atencionIds = [
        ...new Set(pool.map((p) => p.atencion_id).filter(Boolean) as string[]),
      ];
      if (atencionIds.length) {
        const { data: validAtenciones } = await supabase
          .from('atenciones')
          .select('id')
          .in('id', atencionIds)
          .in('user_id', vendedorIds);
        const validSet = new Set((validAtenciones || []).map((a) => a.id as string));
        for (const p of pool) {
          if (p.vehiculo_id && p.atencion_id && validSet.has(p.atencion_id)) {
            vehiculoIds.add(p.vehiculo_id as string);
          }
        }
      }
    }
  }

  return [...vehiculoIds];
}

/** Vehículos con visitas cuya atención registró el vendedor (legacy sin sucursal). */
export async function idsVehiculosConVisitasTallerPorVendedor(vendedorId: string): Promise<string[]> {
  const { data: atenciones, error: aErr } = await supabase
    .from('atenciones')
    .select('id')
    .eq('user_id', vendedorId);

  if (aErr || !atenciones?.length) return [];

  const atencionIds = atenciones.map((a) => a.id as string);
  const { data: visitas, error: vErr } = await supabase
    .from('visitas_taller')
    .select('vehiculo_id')
    .in('atencion_id', atencionIds)
    .not('vehiculo_id', 'is', null);

  if (vErr || !visitas?.length) return [];

  return [
    ...new Set(visitas.map((v) => v.vehiculo_id).filter(Boolean) as string[]),
  ];
}

const VISITA_PATENTE_PENDIENTE_SELECT = `
  id, estado, orden_estado, motivo, observaciones, km, diagnostico_enviado, created_at,
  gomero_id, atencion_id, patente_pendiente,
  atenciones(id, user_id, clientes(id, nombre, apellido, dni, telefono, email))
`;

/** OT del pool sin vehículo (patente_pendiente) para el tab Taller del vendedor/admin. */
export async function entradasPatentePendienteTabTaller(params: {
  sucursal?: SucursalNombre | null;
  vendedorId?: string;
}): Promise<Record<string, unknown>[]> {
  const { sucursal, vendedorId } = params;

  const { data: visitas, error } = await supabase
    .from('visitas_taller')
    .select(VISITA_PATENTE_PENDIENTE_SELECT)
    .is('vehiculo_id', null)
    .not('patente_pendiente', 'is', null)
    .not('atencion_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error || !visitas?.length) return [];

  let filtradas = visitas as Array<Record<string, unknown>>;

  if (vendedorId && !sucursal) {
    filtradas = await filtrarVisitasTallerPorAtencionVendedor(
      filtradas as VisitaTallerSucursalRow[],
      vendedorId,
    );
  } else if (sucursal) {
    filtradas = await filtrarVisitasTallerPorSucursal(
      filtradas as VisitaTallerSucursalRow[],
      sucursal,
    );
  }

  return filtradas.map((visita) => {
    const atencionRaw = visita.atenciones as
      | { user_id?: string; clientes?: Record<string, unknown> | null }
      | { user_id?: string; clientes?: Record<string, unknown> | null }[]
      | null;
    const atencion = Array.isArray(atencionRaw) ? atencionRaw[0] : atencionRaw;
    const clientes = atencion?.clientes ?? null;
    const visitaId = visita.id as string;
    const patente = String(visita.patente_pendiente || '').trim();

    const visitaNested = {
      id: visitaId,
      estado: visita.estado,
      orden_estado: visita.orden_estado,
      motivo: visita.motivo,
      observaciones: visita.observaciones,
      km: visita.km,
      diagnostico_enviado: visita.diagnostico_enviado,
      created_at: visita.created_at,
      gomero_id: visita.gomero_id,
      atencion_id: visita.atencion_id,
    };

    return {
      id: `pendiente-${visitaId}`,
      patente,
      marca: '',
      modelo: '',
      anio: null,
      medida_rueda: null,
      created_at: visita.created_at,
      clientes,
      visitas_taller: [visitaNested],
      es_patente_pendiente: true,
      ...(vendedorId
        ? { es_cliente_propio: atencion?.user_id === vendedorId }
        : {}),
    };
  });
}

export type VisitaTallerSucursalRow = {
  gomero_id?: string | null;
  atencion_id?: string | null;
};

/** Deja visitas de gomeros de la sucursal + pool (atención de vendedor de la sucursal). */
export async function filtrarVisitasTallerPorSucursal<T extends VisitaTallerSucursalRow>(
  visitas: T[],
  sucursal: SucursalNombre,
): Promise<T[]> {
  const gomeroIds = await idsGomerosPorSucursal(sucursal);
  const gomeroSet = new Set(gomeroIds);

  const poolAtencionIds = [
    ...new Set(
      visitas
        .filter((v) => !v.gomero_id && v.atencion_id)
        .map((v) => v.atencion_id as string),
    ),
  ];

  let validAtencionSet = new Set<string>();
  if (poolAtencionIds.length) {
    const vendedorIds = await idsVendedoresPorSucursal(sucursal);
    if (vendedorIds.length) {
      const { data } = await supabase
        .from('atenciones')
        .select('id')
        .in('id', poolAtencionIds)
        .in('user_id', vendedorIds);
      validAtencionSet = new Set((data || []).map((a) => a.id as string));
    }
  }

  return visitas.filter((vt) => {
    if (vt.gomero_id && gomeroSet.has(vt.gomero_id)) return true;
    if (!vt.gomero_id && vt.atencion_id && validAtencionSet.has(vt.atencion_id)) return true;
    return false;
  });
}

/** Solo visitas con atención propia del vendedor (legacy sin sucursal). */
export async function filtrarVisitasTallerPorAtencionVendedor<T extends VisitaTallerSucursalRow>(
  visitas: T[],
  vendedorId: string,
): Promise<T[]> {
  const atencionIds = [
    ...new Set(
      visitas.map((v) => v.atencion_id).filter(Boolean) as string[],
    ),
  ];
  if (!atencionIds.length) return [];

  const { data, error } = await supabase
    .from('atenciones')
    .select('id')
    .in('id', atencionIds)
    .eq('user_id', vendedorId);

  if (error || !data?.length) return [];

  const validSet = new Set(data.map((a) => a.id as string));
  return visitas.filter((v) => v.atencion_id && validSet.has(v.atencion_id));
}

/** Sucursal inferida desde gomero, atención o mecánico de la visita. */
export async function sucursalDesdeVisitaTaller(visita: {
  gomero_id?: string | null;
  atencion_id?: string | null;
  mecanico_id?: string | null;
}): Promise<string | null> {
  if (visita.gomero_id) {
    const { data } = await supabase
      .from('users')
      .select('sucursal')
      .eq('id', visita.gomero_id)
      .maybeSingle();
    if (data?.sucursal) return data.sucursal as string;
  }
  if (visita.atencion_id) {
    const s = await sucursalDesdeAtencionId(visita.atencion_id);
    if (s) return s;
  }
  if (visita.mecanico_id) {
    const { data } = await supabase
      .from('users')
      .select('sucursal')
      .eq('id', visita.mecanico_id)
      .maybeSingle();
    if (data?.sucursal) return data.sucursal as string;
  }
  return null;
}

/** Vendedores/admins de la sucursal de la visita + vendedor de la atención si aplica. */
export async function idsUsuariosNotificarVisitaFinalizada(visita: {
  gomero_id?: string | null;
  atencion_id?: string | null;
  mecanico_id?: string | null;
}): Promise<string[]> {
  const ids = new Set<string>();
  const sucursal = await sucursalDesdeVisitaTaller(visita);

  if (sucursal) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .in('rol', ['vendedor', 'admin'])
      .eq('activo', true)
      .eq('sucursal', sucursal);
    for (const u of data || []) ids.add(u.id as string);
  }

  if (visita.atencion_id) {
    const { data: atencion } = await supabase
      .from('atenciones')
      .select('user_id')
      .eq('id', visita.atencion_id)
      .maybeSingle();
    if (atencion?.user_id) ids.add(atencion.user_id as string);
  }

  return [...ids];
}

/** Vendedor con sucursal: misma regla que gomero/mecánico. Legacy (null) → solo atención propia. */
export async function vendedorPuedeAccederVisitaTaller(
  visita: VisitaTallerSucursalRow,
  sucursal: string | null | undefined,
  vendedorId: string,
): Promise<boolean> {
  if (!sucursal) {
    if (!visita.atencion_id) return false;
    return atencionEsDelVendedor(visita.atencion_id, vendedorId);
  }

  const sucursalNom = sucursal as SucursalNombre;
  const gomeroIds = await idsGomerosPorSucursal(sucursalNom);
  if (visita.gomero_id && gomeroIds.includes(visita.gomero_id)) return true;
  if (!visita.gomero_id && visita.atencion_id) {
    return atencionEsDeVendedoresSucursal(visita.atencion_id, sucursalNom);
  }
  return false;
}

export async function idsGomerosYMecanicosPorSucursal(sucursal: SucursalNombre): Promise<{
  gomeros: string[];
  mecanicos: string[];
}> {
  const { data, error } = await supabase
    .from('users')
    .select('id, rol')
    .eq('sucursal', sucursal)
    .in('rol', ['gomero', 'mecanico']);

  if (error) return { gomeros: [], mecanicos: [] };

  const gomeros: string[] = [];
  const mecanicos: string[] = [];
  for (const u of data || []) {
    if (u.rol === 'gomero') gomeros.push(u.id as string);
    else if (u.rol === 'mecanico') mecanicos.push(u.id as string);
  }
  return { gomeros, mecanicos };
}
