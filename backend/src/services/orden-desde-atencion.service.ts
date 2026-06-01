/**
 * Crea orden de taller (pendiente_gomero) cuando el vendedor registra patente en una atención.
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { normalizePatenteAr } from '../utils/patente';

const RESULTADOS_CON_ORDEN = new Set(['venta_cerrada', 'pendiente']);

export type PatenteAtencionInput = {
  vehiculo_id?: string | null;
  patente?: string | null;
  patente_manual?: string | null;
};

export type ResolverPatenteResult = {
  vehiculo_id: string | null;
  patente_manual: string | null;
  patente_canon: string | null;
};

export function debeCrearOrdenGomero(resultado: string, patente: PatenteAtencionInput): boolean {
  if (!RESULTADOS_CON_ORDEN.has(resultado)) return false;
  const canon = normalizarPatenteInput(patente);
  return !!(patente.vehiculo_id || canon);
}

function normalizarPatenteInput(input: PatenteAtencionInput): string | null {
  const raw = String(input.patente_manual || input.patente || '').trim();
  if (!raw) return null;
  return normalizePatenteAr(raw) || null;
}

/** Resuelve vehículo existente o deja solo patente_manual. */
export async function resolverPatenteAtencion(
  input: PatenteAtencionInput,
): Promise<ResolverPatenteResult> {
  if (input.vehiculo_id && /^[0-9a-f-]{36}$/i.test(input.vehiculo_id)) {
    const { data: v, error } = await supabase
      .from('vehiculos')
      .select('id, patente')
      .eq('id', input.vehiculo_id)
      .maybeSingle();
    if (error) throw new AppError('Error al validar el vehículo', 500);
    if (!v) throw new AppError('El vehículo seleccionado no existe', 400);
    return {
      vehiculo_id: v.id,
      patente_manual: null,
      patente_canon: v.patente,
    };
  }

  const canon = normalizarPatenteInput(input);
  if (!canon) {
    return { vehiculo_id: null, patente_manual: null, patente_canon: null };
  }

  const { data: existente, error: busqErr } = await supabase
    .from('vehiculos')
    .select('id, patente')
    .eq('patente', canon)
    .maybeSingle();
  if (busqErr) throw new AppError('Error al buscar la patente', 500);

  if (existente) {
    return {
      vehiculo_id: existente.id,
      patente_manual: null,
      patente_canon: existente.patente,
    };
  }

  return {
    vehiculo_id: null,
    patente_manual: canon,
    patente_canon: canon,
  };
}

export async function crearOrdenDesdeAtencion(params: {
  atencionId: string;
  clienteId: string;
  vehiculoId: string | null;
  patentePendiente: string | null;
  motivo?: string | null;
}) {
  const { atencionId, clienteId, vehiculoId, patentePendiente, motivo } = params;

  if (!vehiculoId && !patentePendiente) {
    throw new AppError('Se requiere vehículo o patente para crear la orden', 400);
  }

  if (vehiculoId) {
    const { data: veh, error: vErr } = await supabase
      .from('vehiculos')
      .select('id, cliente_id')
      .eq('id', vehiculoId)
      .maybeSingle();
    if (vErr || !veh) throw new AppError('Vehículo no encontrado', 400);

    if (!veh.cliente_id && clienteId) {
      await supabase.from('vehiculos').update({ cliente_id: clienteId }).eq('id', vehiculoId);
    }
  }

  const { data: orden, error } = await supabase
    .from('visitas_taller')
    .insert({
      vehiculo_id: vehiculoId,
      patente_pendiente: vehiculoId ? null : patentePendiente,
      atencion_id: atencionId,
      gomero_id: null,
      mecanico_id: null,
      orden_estado: 'pendiente_gomero',
      estado: 'en_revision',
      estado_visita: 'abierta',
      motivo: motivo?.trim() || 'Orden desde atención de venta',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[orden-desde-atencion] Error creando visita_taller', error);
    throw new AppError('No se pudo crear la orden para el gomero', 500);
  }

  return orden;
}
