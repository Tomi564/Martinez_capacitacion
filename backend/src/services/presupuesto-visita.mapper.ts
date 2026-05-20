/**
 * Mapeo visitas_taller → PresupuestoOrdenData para el PDF.
 */

import type { ItemTrenPresupuesto, PresupuestoOrdenData } from '../pdf/presupuesto-orden.types';

const PSI_PER_BAR = 14.5037738;

export const VISITA_PRESUPUESTO_SELECT = `
  id,
  created_at,
  km,
  presion_psi,
  neumaticos_cambiados,
  marca_neumatico,
  medida_neumatico,
  observaciones_gomero,
  tren_delantero,
  tren_alineado,
  tren_balanceo,
  amortiguadores_revisados,
  auxilio_revisado,
  presupuesto,
  observaciones,
  motivo,
  vehiculos (
    patente,
    marca,
    modelo,
    anio,
    medida_rueda,
    clientes (nombre, apellido, email, telefono)
  )
`;

export type VisitaRow = {
  id: string;
  created_at: string;
  km: number | null;
  presion_psi: number | null;
  neumaticos_cambiados: boolean | null;
  marca_neumatico: string | null;
  medida_neumatico: string | null;
  observaciones_gomero: string | null;
  tren_delantero: string | null;
  tren_alineado: boolean | null;
  tren_balanceo: boolean | null;
  amortiguadores_revisados: boolean | null;
  auxilio_revisado: boolean | null;
  presupuesto: string | null;
  observaciones: string | null;
  motivo: string | null;
  vehiculos: {
    patente: string;
    marca: string;
    modelo: string;
    anio: number | null;
    medida_rueda: string | null;
    clientes: {
      nombre: string;
      apellido: string;
      email: string | null;
      telefono: string | null;
    } | null;
  } | null;
};

function parseNumeroAr(texto: string): number {
  const limpio = texto.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(limpio);
  return Number.isFinite(n) ? n : 0;
}

/** Extrae el total del texto libre del mecánico. */
export function parseTotalDesdePresupuesto(texto: string | null | undefined): number {
  const t = (texto || '').trim();
  if (!t) return 0;

  const totalExplicito = t.match(
    /total(?:\s+general)?\s*[:\s]*\$?\s*([\d.,]+)/i
  );
  if (totalExplicito) {
    const n = parseNumeroAr(totalExplicito[1]);
    if (n > 0) return Math.round(n);
  }

  const montos = [...t.matchAll(/\$\s*([\d.,]+)/g)].map((m) => parseNumeroAr(m[1]));
  if (montos.length) return Math.round(Math.max(...montos));

  const numeros = [...t.matchAll(/(?<!\d)(\d{1,3}(?:\.\d{3})+|\d{4,})(?!\d)/g)].map((m) =>
    parseNumeroAr(m[1])
  );
  if (numeros.length) return Math.round(Math.max(...numeros));

  return 0;
}

function psiToBarTxt(psi: number | null | undefined): string {
  if (psi == null || Number.isNaN(psi)) return '—';
  const bar = psi / PSI_PER_BAR;
  return `${bar.toLocaleString('es-AR', { maximumFractionDigits: 1 })} BAR`;
}

function itemTren(etiqueta: string, aplica: boolean): ItemTrenPresupuesto {
  return { etiqueta, aplica, precio: null };
}

function normalizarAlcance(v: string | null | undefined): 'x2' | 'x4' | 'no' | null {
  if (v === 'x2' || v === 'x4' || v === 'no') return v;
  return null;
}

function armarObservaciones(row: VisitaRow): string {
  const partes: string[] = [];
  if (row.motivo?.trim()) partes.push(`Motivo de visita: ${row.motivo.trim()}`);
  if (row.presupuesto?.trim()) partes.push(`Detalle del presupuesto:\n${row.presupuesto.trim()}`);
  if (row.observaciones_gomero?.trim()) partes.push(`Gomero: ${row.observaciones_gomero.trim()}`);
  if (row.observaciones?.trim()) partes.push(row.observaciones.trim());
  return partes.join('\n\n') || '—';
}

function numeroOrden(row: VisitaRow): string {
  const d = new Date(row.created_at);
  const ymd = d.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '');
  const corto = row.id.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `OR-${ymd}-${corto}`;
}

export function mapVisitaAPresupuestoPdf(row: VisitaRow): PresupuestoOrdenData {
  const v = row.vehiculos;
  const c = v?.clientes;
  const alcance = normalizarAlcance(row.tren_delantero);
  const medida = row.medida_neumatico?.trim() || v?.medida_rueda?.trim() || '';

  return {
    empresa: {
      nombre: process.env.MARTINEZ_EMPRESA_NOMBRE || 'Martínez Neumáticos',
      direccion:
        process.env.MARTINEZ_EMPRESA_DIRECCION ||
        'Consultar dirección en sucursal',
      telefono: process.env.MARTINEZ_EMPRESA_TELEFONO || '',
      logoPath: process.env.MARTINEZ_LOGO_PATH || undefined,
    },
    orden: {
      numero: numeroOrden(row),
      fecha: new Date(row.created_at),
    },
    cliente: {
      nombre: c?.nombre || '',
      apellido: c?.apellido || '',
      domicilio: '',
      telefono: c?.telefono?.trim() || '',
    },
    vehiculo: {
      patente: v?.patente || '—',
      marca: v?.marca || '',
      modelo: v?.modelo || '',
    },
    trenDelantero: {
      alcance,
      alineado: itemTren('Alineación', row.tren_alineado === true),
      balanceo: itemTren('Balanceo', row.tren_balanceo === true),
      amortiguadores: itemTren('Amortiguadores revisados', row.amortiguadores_revisados === true),
      auxilio: itemTren('Auxilio revisado', row.auxilio_revisado === true),
    },
    cubiertas: {
      marca: row.marca_neumatico?.trim() || '—',
      medida: medida || '—',
      presionBar: psiToBarTxt(row.presion_psi),
      kilometraje: row.km != null ? `${row.km.toLocaleString('es-AR')} km` : '—',
      neumaticosCambiados: row.neumaticos_cambiados,
    },
    totalGeneral: parseTotalDesdePresupuesto(row.presupuesto),
    observaciones: armarObservaciones(row),
    firmaMecanico: 'Martínez Neumáticos — Taller',
  };
}

export function nombreArchivoPresupuesto(patente: string, fecha: Date): string {
  const pat = patente.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'SIN-PATENTE';
  const f = fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '-');
  return `presupuesto-${pat}-${f}.pdf`;
}
