/**
 * presupuesto-visita.service.ts — PDF de presupuesto desde visitas_taller
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { generarPresupuestoOrdenPdf } from '../pdf/presupuesto-orden.pdf';
import {
  mapVisitaAPresupuestoPdf,
  nombreArchivoPresupuesto,
  VISITA_PRESUPUESTO_SELECT,
  type VisitaRow,
} from './presupuesto-visita.mapper';

function firstOrNull<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

function normalizarVisitaRow(raw: Record<string, unknown>): VisitaRow {
  const vehiculosRaw = firstOrNull(raw.vehiculos as VisitaRow['vehiculos'] | VisitaRow['vehiculos'][]);
  let vehiculos = vehiculosRaw;
  if (vehiculos && vehiculos.clientes) {
    vehiculos = {
      ...vehiculos,
      clientes: firstOrNull(
        vehiculos.clientes as NonNullable<VisitaRow['vehiculos']>['clientes'] | NonNullable<VisitaRow['vehiculos']>['clientes'][]
      ),
    };
  }
  return { ...(raw as VisitaRow), vehiculos };
}

export class PresupuestoVisitaService {
  async generarPdfPorVisitaId(visitaId: string): Promise<{ buffer: Buffer; filename: string }> {
    const { data, error } = await supabase
      .from('visitas_taller')
      .select(VISITA_PRESUPUESTO_SELECT)
      .eq('id', visitaId)
      .maybeSingle();

    if (error) {
      console.error('[PresupuestoVisitaService] Error al cargar visita', { visitaId, error });
      throw new AppError('Error al obtener la visita', 500);
    }
    if (!data) {
      throw new AppError('Visita no encontrada', 404);
    }

    const row = normalizarVisitaRow(data as Record<string, unknown>);
    const pdfData = mapVisitaAPresupuestoPdf(row);
    const buffer = await generarPresupuestoOrdenPdf(pdfData);
    const filename = nombreArchivoPresupuesto(pdfData.vehiculo.patente, pdfData.orden.fecha);

    return { buffer, filename };
  }
}

export const presupuestoVisitaService = new PresupuestoVisitaService();
