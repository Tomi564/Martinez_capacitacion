export const PRESUPUESTO_GRUPOS = ['tren_delantero', 'tren_trasero', 'frenos', 'cubierta'] as const;

export type PresupuestoGrupoKey = (typeof PRESUPUESTO_GRUPOS)[number];

export const PRESUPUESTO_GRUPO_LABELS: Record<PresupuestoGrupoKey, string> = {
  tren_delantero: 'Tren delantero',
  tren_trasero: 'Tren trasero',
  frenos: 'Frenos',
  cubierta: 'Cubiertas',
};

export const PRESUPUESTO_ITEMS: Record<PresupuestoGrupoKey, readonly string[]> = {
  tren_delantero: [
    'Juego de Bujes',
    'Bujes Tensor',
    'Bujes Barra Estabiliz.',
    'Bieleta Barra Estabiliz.',
    'Rótulas',
    'Extremos de Dirección',
    'Axiales',
    'Caja de Dirección',
    'Guardapolvos de Dirección',
    'Junta de Homocinética',
    'Guardapolvos Junta Homoc.',
    'Rodamientos de Ruedas',
    'Semiejes',
    'Amortiguadores Delanteros',
    'Parrilla Superior',
    'Parrilla Inferior',
    'Barra Estabilizadora',
    'Cazoleta Amortiguador',
    'Crapodina Amortiguador',
    'Espirales',
    'Base Espireles',
    'Falso Brazo',
    'Brazo Pitman',
  ],
  tren_trasero: [
    'Amortiguadores Traseros',
    'Bujes Suspensión',
    'Parrillas',
    'Bujes Tensores',
    'Elásticos',
    'Bujes Barra Estabilizadora',
    'Espirales',
  ],
  frenos: [
    'Juego de Pastillas',
    'Rectificado de Discos',
    'Rectificado de Campanas',
    'Encintado de Patines',
    'Discos',
    'Cilindros',
    'Cubetas',
    'Guardapolvos',
    'Bomba de Frenos',
    'Reparación de Servo',
    'Líquido de Freno',
    'Mano de Obra',
  ],
  cubierta: [
    'Fate',
    'Continental',
    'Michelin',
    'General Tire',
    'BF Goodrich',
    'Cámaras',
    'Balanceos Autos',
    'Balanceos Cmta.',
    'Alineado',
    'Nitrógeno',
    'Antióxido',
    'Parches',
    'Seguros de Neumáticos',
    'Rotación',
    'Mano de Obra',
    'Varios',
    'Corrección de comba',
  ],
};

export type PresupuestoLineaState = {
  catalogoId: string;
  grupo: PresupuestoGrupoKey;
  etiqueta: string;
  marcado: boolean;
  cantidad: string;
  precio: string;
};

/** Key estable para React y actualizaciones (UUID del catálogo o grupo+etiqueta). */
export function lineaKey(linea: PresupuestoLineaState): string {
  if (linea.catalogoId) return linea.catalogoId;
  return `${linea.grupo}:${linea.etiqueta}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function esIdCatalogo(id: string): boolean {
  return UUID_RE.test(id);
}

export function emptyPresupuestoState(): PresupuestoLineaState[] {
  const lines: PresupuestoLineaState[] = [];
  for (const grupo of PRESUPUESTO_GRUPOS) {
    for (const etiqueta of PRESUPUESTO_ITEMS[grupo]) {
      lines.push({
        catalogoId: `${grupo}:${etiqueta}`,
        grupo,
        etiqueta,
        marcado: false,
        cantidad: '1',
        precio: '',
      });
    }
  }
  return lines;
}

export function parsePrecioInput(raw: string): number {
  const limpio = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(limpio);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Precio del mecánico: vacío → null; 0 es válido. El vendedor define precios finales. */
export function precioLineaParaApi(raw: string): number | null {
  if (!raw.trim()) return null;
  return parsePrecioInput(raw);
}

export function subtotalGrupo(lineas: PresupuestoLineaState[]): number {
  return lineas
    .filter((l) => l.marcado && l.precio.trim() !== '')
    .reduce(
      (sum, l) =>
        sum + parsePrecioInput(l.precio) * (Math.max(0, parsePrecioInput(l.cantidad)) || 1),
      0,
    );
}

export function lineaMarcadaSinPrecio(l: PresupuestoLineaState): boolean {
  return l.marcado && !l.precio.trim();
}

export function etiquetaMontoChecklist(lineas: PresupuestoLineaState[], monto: number): string {
  const marcados = lineas.filter((l) => l.marcado);
  if (!marcados.length) return formatPesosAr(0);
  if (marcados.every((l) => !l.precio.trim())) return 'Sin precio';
  return formatPesosAr(monto);
}

export function totalGeneral(lineas: PresupuestoLineaState[]): number {
  return PRESUPUESTO_GRUPOS.reduce(
    (sum, g) => sum + subtotalGrupo(lineas.filter((l) => l.grupo === g)),
    0,
  );
}

export function formatPesosAr(n: number): string {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

export type CatalogoItemApi = {
  id: string;
  grupo: PresupuestoGrupoKey;
  etiqueta: string;
  orden: number;
};

export type LineaGuardadaApi = {
  item_catalogo_id: string;
  marcado: boolean;
  cantidad: number;
  precio: number | null;
};

export function mergeCatalogoConLineas(
  catalogo: CatalogoItemApi[],
  guardadas: LineaGuardadaApi[],
): PresupuestoLineaState[] {
  const porId = new Map(guardadas.map((g) => [g.item_catalogo_id, g]));
  return catalogo
    .slice()
    .sort((a, b) => a.grupo.localeCompare(b.grupo) || a.orden - b.orden)
    .map((c) => {
      const g = porId.get(c.id);
      return {
        catalogoId: c.id,
        grupo: c.grupo,
        etiqueta: c.etiqueta,
        marcado: !!g?.marcado,
        cantidad: g?.cantidad != null ? String(g.cantidad) : '1',
        precio: g?.precio != null ? String(Math.round(g.precio)) : '',
      };
    });
}

export type PresupuestoLineaInforme = {
  item_catalogo_id: string;
  grupo: PresupuestoGrupoKey | string;
  etiqueta: string;
  orden: number;
  marcado: boolean;
  cantidad: number;
  precio: number | null;
};

export function subtotalLineaInforme(l: PresupuestoLineaInforme): number {
  if (!l.marcado || l.precio == null) return 0;
  return (l.precio || 0) * (l.cantidad || 1);
}

export function tienePresupuestoNuevoInforme(lineas: PresupuestoLineaInforme[]): boolean {
  return lineas.some((l) => l.marcado && l.precio != null);
}

export function agruparLineasInforme(lineas: PresupuestoLineaInforme[]) {
  const porGrupo = new Map<string, PresupuestoLineaInforme[]>();
  for (const l of lineas) {
    if (!l.marcado || l.precio == null) continue;
    const arr = porGrupo.get(l.grupo) || [];
    arr.push(l);
    porGrupo.set(l.grupo, arr);
  }

  return PRESUPUESTO_GRUPOS.map((grupo) => {
    const items = (porGrupo.get(grupo) || []).sort((a, b) => a.orden - b.orden);
    if (!items.length) return null;
    const subtotal = items.reduce((s, l) => s + subtotalLineaInforme(l), 0);
    return {
      grupo,
      titulo: PRESUPUESTO_GRUPO_LABELS[grupo],
      items,
      subtotal,
    };
  }).filter((s): s is NonNullable<typeof s> => s != null);
}

/** Ítems marcados por el mecánico (precio opcional hasta que el vendedor lo cargue). */
export function agruparLineasMarcadasInforme(lineas: PresupuestoLineaInforme[]) {
  const porGrupo = new Map<string, PresupuestoLineaInforme[]>();
  for (const l of lineas) {
    if (!l.marcado) continue;
    const arr = porGrupo.get(l.grupo) || [];
    arr.push(l);
    porGrupo.set(l.grupo, arr);
  }

  return PRESUPUESTO_GRUPOS.map((grupo) => {
    const items = (porGrupo.get(grupo) || []).sort((a, b) => a.orden - b.orden);
    if (!items.length) return null;
    const subtotal = items.reduce((s, l) => s + subtotalLineaInforme(l), 0);
    return {
      grupo,
      titulo: PRESUPUESTO_GRUPO_LABELS[grupo],
      items,
      subtotal,
    };
  }).filter((s): s is NonNullable<typeof s> => s != null);
}

export function tieneItemsMarcadosInforme(lineas: PresupuestoLineaInforme[]): boolean {
  return lineas.some((l) => l.marcado);
}

export function totalPresupuestoInforme(lineas: PresupuestoLineaInforme[]): number {
  return lineas.filter((l) => l.marcado).reduce((s, l) => s + subtotalLineaInforme(l), 0);
}

export function lineasMarcadasParaApi(
  lineas: PresupuestoLineaInforme[],
  precios: Record<string, string>,
) {
  return lineas
    .filter((l) => l.marcado)
    .map((l) => ({
      item_catalogo_id: l.item_catalogo_id,
      grupo: l.grupo,
      etiqueta: l.etiqueta,
      marcado: true,
      cantidad: l.cantidad || 1,
      precio: precioLineaParaApi(precios[l.item_catalogo_id] ?? String(l.precio ?? '')),
    }));
}

export function lineasParaApi(lineas: PresupuestoLineaState[]) {
  return lineas
    .filter((l) => l.marcado)
    .map((l) => ({
      item_catalogo_id: esIdCatalogo(l.catalogoId) ? l.catalogoId : lineaKey(l),
      grupo: l.grupo,
      etiqueta: l.etiqueta,
      marcado: true,
      cantidad: parsePrecioInput(l.cantidad) || 1,
      precio: precioLineaParaApi(l.precio),
    }));
}
