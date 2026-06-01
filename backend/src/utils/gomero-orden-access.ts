import { supabase } from '../config/database';

export type OrdenGomeroAccessRow = {
  id: string;
  gomero_id: string | null;
  atencion_id?: string | null;
};

export function gomeroPuedeAccederOrden(
  row: OrdenGomeroAccessRow,
  userId: string,
  rol: string,
): boolean {
  if (rol === 'admin') return true;
  if (row.gomero_id === userId) return true;
  if (!row.gomero_id && row.atencion_id) return true;
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
