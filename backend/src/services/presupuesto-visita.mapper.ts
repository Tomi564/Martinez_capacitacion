/**
 * Mapeo visitas_taller → PresupuestoOrdenData para el PDF.
 */

import type {
  PresupuestoLegacyMecanico,
  PresupuestoOrdenData,
  PresupuestoSeccionPdf,
} from '../pdf/presupuesto-orden.types';
import {
  agruparLineasPorSeccion,
  subtotalLinea,
  sumarTotalLineas,
  tienePresupuestoNuevo,
  type PresupuestoLineaDto,
} from './presupuesto-lineas.service';

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
  operario_responsable,
  observaciones,
  motivo,
  patente_pendiente,
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
  operario_responsable?: string | null;
  observaciones: string | null;
  motivo: string | null;
  patente_pendiente?: string | null;
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

export function parseTotalDesdePresupuesto(texto: string | null | undefined): number {
  const t = (texto || '').trim();
  if (!t) return 0;

  const totalExplicito = t.match(/total(?:\s+general)?\s*[:\s]*\$?\s*([\d.,]+)/i);
  if (totalExplicito) {
    const n = parseNumeroAr(totalExplicito[1]);
    if (n > 0) return Math.round(n);
  }

  const montos = [...t.matchAll(/\$\s*([\d.,]+)/g)].map((m) => parseNumeroAr(m[1]));
  if (montos.length) return Math.round(Math.max(...montos));

  return 0;
}

function psiToBarTxt(psi: number | null | undefined): string {
  if (psi == null || Number.isNaN(psi)) return '—';
  const bar = psi / PSI_PER_BAR;
  return `${bar.toLocaleString('es-AR', { maximumFractionDigits: 1 })} BAR`;
}

function trenDelanteroTxt(v: string | null | undefined): string {
  if (v === 'x2') return '2 ruedas';
  if (v === 'x4') return '4 ruedas';
  if (v === 'no') return 'No aplica';
  return '—';
}

function armarObservaciones(row: VisitaRow, usaNuevo: boolean): string {
  const partes: string[] = [];
  if (row.motivo?.trim()) partes.push(`Motivo de visita: ${row.motivo.trim()}`);
  if (!usaNuevo && row.presupuesto?.trim()) {
    partes.push(`Detalle del presupuesto:\n${row.presupuesto.trim()}`);
  }
  if (row.observaciones?.trim()) partes.push(row.observaciones.trim());
  return partes.join('\n\n') || '—';
}

function legacyDesdeVisita(row: VisitaRow): PresupuestoLegacyMecanico {
  return {
    trenDelantero: trenDelanteroTxt(row.tren_delantero),
    alineado: row.tren_alineado,
    balanceo: row.tren_balanceo,
    amortiguadores: row.amortiguadores_revisados,
    auxilio: row.auxilio_revisado,
    presupuestoTexto: row.presupuesto?.trim() || null,
  };
}

function seccionesDesdeLineas(lineas: PresupuestoLineaDto[]): PresupuestoSeccionPdf[] {
  return agruparLineasPorSeccion(lineas).map((sec) => ({
    titulo: sec.titulo,
    subtotal: Math.round(sec.subtotal),
    lineas: sec.items.map((l) => ({
      etiqueta: l.etiqueta,
      cantidad: l.cantidad || 1,
      precioUnitario: Math.round(l.precio || 0),
      subtotal: Math.round(subtotalLinea(l)),
    })),
  }));
}

function numeroOrden(row: VisitaRow): string {
  const d = new Date(row.created_at);
  const ymd = d
    .toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '');
  const corto = row.id.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `OR-${ymd}-${corto}`;
}

export function mapVisitaAPresupuestoPdf(
  row: VisitaRow,
  lineas: PresupuestoLineaDto[] = [],
): PresupuestoOrdenData {
  const v = row.vehiculos;
  const c = v?.clientes;
  const medida = row.medida_neumatico?.trim() || v?.medida_rueda?.trim() || '';
  const usaNuevo = tienePresupuestoNuevo(lineas);
  const secciones = usaNuevo ? seccionesDesdeLineas(lineas) : [];
  const totalLineas = sumarTotalLineas(lineas);

  return {
    empresa: {
      nombre: process.env.MARTINEZ_EMPRESA_NOMBRE || 'Martínez Neumáticos',
      direccion: process.env.MARTINEZ_EMPRESA_DIRECCION || 'Consultar dirección en sucursal',
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
      telefono: c?.telefono?.trim() || '',
    },
    vehiculo: {
      patente: v?.patente || row.patente_pendiente?.trim() || '—',
      marca: v?.marca || '',
      modelo: v?.modelo || '',
    },
    gomero: {
      marca: row.marca_neumatico?.trim() || '—',
      medida: medida || '—',
      presionBar: psiToBarTxt(row.presion_psi),
      kilometraje: row.km != null ? `${row.km.toLocaleString('es-AR')} km` : '—',
      neumaticosCambiados: row.neumaticos_cambiados,
    },
    usaChecklistNuevo: usaNuevo,
    secciones,
    legacy: usaNuevo ? undefined : legacyDesdeVisita(row),
    totalGeneral:
      usaNuevo && totalLineas > 0
        ? Math.round(totalLineas)
        : parseTotalDesdePresupuesto(row.presupuesto),
    operarioResponsable: row.operario_responsable?.trim() || '',
    observaciones: armarObservaciones(row, usaNuevo),
    firmaMecanico: row.operario_responsable?.trim() || 'Martínez Neumáticos — Taller',
  };
}

export function nombreArchivoPresupuesto(patente: string, fecha: Date): string {
  const pat = patente.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'SIN-PATENTE';
  const f = fecha
    .toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .replace(/\//g, '-');
  return `presupuesto-${pat}-${f}.pdf`;
}
