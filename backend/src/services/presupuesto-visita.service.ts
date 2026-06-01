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
import { listarLineasVisita } from './presupuesto-lineas.service';
import {
  guardarLineasVisita,
  prepararLineasParaGuardar,
  type PresupuestoLineaInput,
} from './presupuesto-lineas.service';

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
  async assertVendedorAccesoVisita(visitaId: string): Promise<void> {
    const { data: visita, error } = await supabase
      .from('visitas_taller')
      .select('id, vehiculos(cliente_id, clientes(id))')
      .eq('id', visitaId)
      .maybeSingle();

    if (error) throw new AppError('Error al verificar acceso', 500);
    if (!visita) throw new AppError('Visita no encontrada', 404);

    const veh = visita.vehiculos as {
      cliente_id?: string | null;
      clientes?: { id?: string } | null;
    } | null;

    if (!veh?.cliente_id || !veh.clientes) {
      throw new AppError('No autorizado', 403);
    }
  }

  async guardarPresupuestoVendedor(visitaId: string, rawLineas: PresupuestoLineaInput[]) {
    await this.assertVendedorAccesoVisita(visitaId);

    const existentes = await listarLineasVisita(visitaId);
    const idsMarcadosMecanico = new Set(
      existentes.filter((l) => l.marcado).map((l) => l.item_catalogo_id),
    );

    if (!idsMarcadosMecanico.size) {
      throw new AppError('No hay ítems marcados por el mecánico en esta orden', 400);
    }

    const lineasResueltas = await prepararLineasParaGuardar(rawLineas);
    for (const l of lineasResueltas) {
      if (!idsMarcadosMecanico.has(l.item_catalogo_id)) {
        throw new AppError('Solo podés cargar precios de ítems marcados por el mecánico', 400);
      }
      if (l.precio == null || l.precio <= 0) {
        throw new AppError('Todos los ítems deben tener un precio mayor a cero', 400);
      }
    }

    if (lineasResueltas.length !== idsMarcadosMecanico.size) {
      throw new AppError('Faltan precios para ítems marcados por el mecánico', 400);
    }

    await guardarLineasVisita(visitaId, lineasResueltas);
    return listarLineasVisita(visitaId);
  }

  async generarPdfPorVisitaId(
    visitaId: string,
    opts?: { verificarVendedor?: boolean },
  ): Promise<{ buffer: Buffer; filename: string }> {
    if (opts?.verificarVendedor) {
      await this.assertVendedorAccesoVisita(visitaId);
    }
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
    let lineas: Awaited<ReturnType<typeof listarLineasVisita>> = [];
    try {
      lineas = await listarLineasVisita(visitaId);
    } catch {
      /* migración pendiente */
    }
    const pdfData = mapVisitaAPresupuestoPdf(row, lineas);
    const buffer = await generarPresupuestoOrdenPdf(pdfData);
    const filename = nombreArchivoPresupuesto(pdfData.vehiculo.patente, pdfData.orden.fecha);

    return { buffer, filename };
  }
}

export const presupuestoVisitaService = new PresupuestoVisitaService();
