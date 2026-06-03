import { supabase } from '../config/database';
import type { SucursalNombre } from '../constants/sucursales';
import { atencionEsDeVendedoresSucursal, idsGomerosPorSucursal } from './sucursal-filter';

export type OrdenGomeroAccessRow = {
  id: string;
  gomero_id: string | null;
  atencion_id?: string | null;
};

export async function gomeroPuedeAccederOrden(
  row: OrdenGomeroAccessRow,
  userId: string,
  rol: string,
  opts?: { gomeroIdsMismaSucursal?: string[]; sucursal?: string | null },
): Promise<boolean> {
  if (rol === 'admin') return true;
  if (row.gomero_id === userId) return true;
  if (
    opts?.gomeroIdsMismaSucursal?.length &&
    row.gomero_id &&
    opts.gomeroIdsMismaSucursal.includes(row.gomero_id)
  ) {
    return true;
  }
  if (!row.gomero_id && row.atencion_id) {
    if (!opts?.sucursal) return false;
    return atencionEsDeVendedoresSucursal(row.atencion_id, opts.sucursal as SucursalNombre);
  }
  return false;
}

/** Toma órdenes del vendedor sin gomero asignado. */
export async function tomarOrdenGomeroSiLibre(ordenId: string, userId: string, rol: string) {
  if (rol === 'admin') return;
  const { data: row } = await supabase
    .from('visitas_taller')
    .select('id, gomero_id, atencion_id')
    .eq('id', ordenId)
    .maybeSingle();
  if (!row?.atencion_id || row.gomero_id) return;
  await supabase.from('visitas_taller').update({ gomero_id: userId }).eq('id', ordenId);
}

export async function gomeroIdsMismaSucursalSiAplica(
  sucursal: string | null | undefined,
): Promise<string[] | null> {
  if (!sucursal) return null;
  return idsGomerosPorSucursal(sucursal as SucursalNombre);
}

export function mecanicoPuedeAccederVisita(
  visita: { mecanico_id?: string | null; gomero_id?: string | null; orden_estado?: string | null },
  userId: string,
  rol: string,
  opts?: { sucursal?: string | null; gomeroIdsMismaSucursal?: string[] },
): boolean {
  if (rol === 'admin') return true;

  // Legacy: sin sucursal asignada — solo visitas donde ya es el mecánico asignado
  if (!opts?.sucursal) {
    return visita.mecanico_id != null && String(visita.mecanico_id) === String(userId);
  }

  const gomeroIds = opts.gomeroIdsMismaSucursal ?? [];

  if (visita.gomero_id && gomeroIds.includes(String(visita.gomero_id))) {
    return true;
  }

  // Revisión creada por el mecánico (sin flujo gomero)
  if (!visita.gomero_id && visita.mecanico_id && String(visita.mecanico_id) === String(userId)) {
    return true;
  }

  return false;
}

/** true si el mecánico puede tomar una orden pendiente de otro mecánico de la misma sucursal */
export function mecanicoPuedeTomarOrdenPendiente(
  visita: { gomero_id?: string | null; orden_estado?: string | null; mecanico_id?: string | null },
  userId: string,
  gomeroIdsMismaSucursal: string[],
): boolean {
  const esPendiente =
    visita.orden_estado === 'pendiente_mecanico' || visita.orden_estado == null;
  if (!esPendiente || !visita.gomero_id) return false;
  if (!gomeroIdsMismaSucursal.includes(String(visita.gomero_id))) return false;
  return String(visita.mecanico_id) !== String(userId);
}
