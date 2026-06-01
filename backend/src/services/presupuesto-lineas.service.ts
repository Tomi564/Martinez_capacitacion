import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PresupuestoLineaInput = {
  item_catalogo_id?: string | null;
  grupo?: string | null;
  etiqueta?: string | null;
  marcado: boolean;
  cantidad?: number | null;
  precio?: number | null;
};

export type PresupuestoLineaInputResuelto = {
  item_catalogo_id: string;
  marcado: boolean;
  cantidad?: number | null;
  precio?: number | null;
};

export type PresupuestoLineaDto = {
  id: string;
  item_catalogo_id: string;
  grupo: string;
  etiqueta: string;
  orden: number;
  marcado: boolean;
  cantidad: number;
  precio: number | null;
};

export async function listarCatalogoPresupuesto() {
  const { data, error } = await supabase
    .from('presupuesto_item_catalogo')
    .select('id, grupo, orden, etiqueta')
    .eq('activo', true)
    .order('grupo')
    .order('orden');
  if (error) throw new AppError('Error al cargar catálogo de presupuesto', 500);
  return data || [];
}

export async function listarLineasVisita(visitaId: string): Promise<PresupuestoLineaDto[]> {
  const { data, error } = await supabase
    .from('visita_presupuesto_lineas')
    .select(
      `id, item_catalogo_id, marcado, cantidad, precio,
       presupuesto_item_catalogo ( grupo, etiqueta, orden )`,
    )
    .eq('visita_id', visitaId);
  if (error) throw new AppError('Error al cargar presupuesto de la visita', 500);

  return (data || []).map((row) => {
    const rawCat = row.presupuesto_item_catalogo;
    const cat = (Array.isArray(rawCat) ? rawCat[0] : rawCat) as {
      grupo: string;
      etiqueta: string;
      orden: number;
    } | null;
    return {
      id: row.id,
      item_catalogo_id: row.item_catalogo_id,
      grupo: cat?.grupo || '',
      etiqueta: cat?.etiqueta || '',
      orden: cat?.orden ?? 0,
      marcado: !!row.marcado,
      cantidad: Number(row.cantidad ?? 1),
      precio: row.precio != null ? Number(row.precio) : null,
    };
  });
}

export async function prepararLineasParaGuardar(
  raw: PresupuestoLineaInput[],
): Promise<PresupuestoLineaInputResuelto[]> {
  const catalogo = await listarCatalogoPresupuesto();
  if (!catalogo.length) {
    throw new AppError(
      'El catálogo de presupuesto no está en la base. Ejecutá supabase/migrations/034_presupuesto_checklist.sql y recargá la página.',
      503,
    );
  }

  const porClave = new Map<string, string>(
    catalogo.map((c) => [`${c.grupo}:${c.etiqueta}`, c.id]),
  );

  const resueltas: PresupuestoLineaInputResuelto[] = [];

  for (const l of raw) {
    if (!l.marcado) continue;

    let id = l.item_catalogo_id?.trim() || '';
    if (!UUID_RE.test(id)) {
      const clave =
        l.grupo && l.etiqueta
          ? `${l.grupo}:${l.etiqueta}`
          : id.includes(':')
            ? id
            : '';
      if (clave) id = porClave.get(clave) || '';
    }

    if (!UUID_RE.test(id)) continue;

    resueltas.push({
      item_catalogo_id: id,
      marcado: true,
      cantidad: l.cantidad != null && l.cantidad >= 0 ? l.cantidad : 1,
      precio: l.precio != null && l.precio >= 0 ? l.precio : null,
    });
  }

  return resueltas;
}

export async function guardarLineasVisita(
  visitaId: string,
  lineas: PresupuestoLineaInputResuelto[],
) {
  const { error: delError } = await supabase
    .from('visita_presupuesto_lineas')
    .delete()
    .eq('visita_id', visitaId);
  if (delError) throw new AppError('Error al actualizar presupuesto', 500);

  const marcadas = lineas.filter((l) => l.marcado && l.item_catalogo_id);
  if (!marcadas.length) return;

  const rows = marcadas.map((l) => ({
    visita_id: visitaId,
    item_catalogo_id: l.item_catalogo_id,
    marcado: true,
    cantidad: l.cantidad != null && l.cantidad >= 0 ? l.cantidad : 1,
    precio: l.precio != null && l.precio >= 0 ? l.precio : null,
    updated_at: new Date().toISOString(),
  }));

  const { error: insError } = await supabase.from('visita_presupuesto_lineas').insert(rows);
  if (insError) throw new AppError('Error al guardar ítems del presupuesto', 500);
}

const GRUPO_TITULOS: Record<string, string> = {
  tren_delantero: 'TREN DELANTERO',
  tren_trasero: 'TREN TRASERO',
  frenos: 'FRENOS',
  cubierta: 'CUBIERTAS',
};

export function textoResumenPresupuesto(lineas: PresupuestoLineaDto[], operario?: string | null): string {
  const marcadas = lineas
    .filter((l) => l.marcado && l.precio != null)
    .sort((a, b) => a.grupo.localeCompare(b.grupo) || a.orden - b.orden);

  const partes: string[] = [];
  let grupoActual = '';
  for (const l of marcadas) {
    if (l.grupo !== grupoActual) {
      grupoActual = l.grupo;
      partes.push(`\n${GRUPO_TITULOS[l.grupo] || l.grupo.toUpperCase()}`);
    }
    const cant = l.cantidad > 1 ? ` x${l.cantidad}` : '';
    partes.push(`- ${l.etiqueta}${cant}: $${Math.round(l.precio || 0).toLocaleString('es-AR')}`);
  }

  const total = sumarTotalLineas(lineas);
  if (operario?.trim()) partes.push(`\nOperario responsable: ${operario.trim()}`);
  partes.push(`\nTOTAL GENERAL: $${Math.round(total).toLocaleString('es-AR')}`);
  return partes.join('\n').trim();
}

export function sumarTotalLineas(lineas: PresupuestoLineaDto[]): number {
  return lineas
    .filter((l) => l.marcado && l.precio != null)
    .reduce((sum, l) => sum + (l.precio || 0) * (l.cantidad || 1), 0);
}

export function tienePresupuestoNuevo(lineas: PresupuestoLineaDto[]): boolean {
  return lineas.some((l) => l.marcado && l.precio != null);
}

export function subtotalLinea(l: PresupuestoLineaDto): number {
  if (!l.marcado || l.precio == null) return 0;
  return (l.precio || 0) * (l.cantidad || 1);
}

export function agruparLineasPorSeccion(lineas: PresupuestoLineaDto[]) {
  const ordenGrupos = ['tren_delantero', 'tren_trasero', 'frenos', 'cubierta'];
  const porGrupo = new Map<string, PresupuestoLineaDto[]>();

  for (const l of lineas) {
    if (!l.marcado || l.precio == null) continue;
    const arr = porGrupo.get(l.grupo) || [];
    arr.push(l);
    porGrupo.set(l.grupo, arr);
  }

  return ordenGrupos
    .map((grupo) => {
      const items = (porGrupo.get(grupo) || []).sort((a, b) => a.orden - b.orden);
      if (!items.length) return null;
      return {
        grupo,
        titulo: GRUPO_TITULOS[grupo] || grupo.toUpperCase(),
        items,
        subtotal: items.reduce((s, l) => s + subtotalLinea(l), 0),
      };
    })
    .filter((s): s is NonNullable<typeof s> => s != null);
}
