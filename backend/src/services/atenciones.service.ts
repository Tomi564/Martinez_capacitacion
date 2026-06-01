/**
 * atenciones.service.ts — Lógica de negocio de atenciones al cliente
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { validarCanalAtencion, mensajeCanalInvalido } from '../constants/atenciones';
import { clientesService, type ClienteInput } from './clientes.service';
import { procesarCambioRankingPorVenta } from './ranking-notificaciones.service';
import {
  crearOrdenDesdeAtencion,
  debeCrearOrdenGomero,
  resolverPatenteAtencion,
  type PatenteAtencionInput,
} from './orden-desde-atencion.service';

/** Envía push a todos los admins activos */
async function notificarAdmins(titulo: string, cuerpo: string) {
  try {
    const vapidConfigured = !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;
    if (!vapidConfigured) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webpush = require('web-push') as typeof import('web-push');
    webpush.setVapidDetails(
      'mailto:admin@martinez.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );

    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('rol', 'admin')
      .eq('activo', true);

    if (!admins?.length) return;

    const adminIds = admins.map((a) => a.id);

    const { data: suscripciones } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', adminIds);

    if (!suscripciones?.length) return;

    const payload = JSON.stringify({ titulo, cuerpo });

    await Promise.allSettled(
      suscripciones.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
        } catch {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      })
    );
  } catch {
    // Silencioso — las notificaciones no deben romper el flujo principal
  }
}

function mapErrorSupabaseAtencion(error: { code?: string; message?: string }): AppError {
  if (error.code === '23514') {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('canal')) {
      return new AppError(
        'Canal no válido. Si usás Teléfono u otros canales nuevos, aplicá la migración 026 en Supabase.',
        400
      );
    }
    if (msg.includes('resultado')) {
      return new AppError('Resultado de atención no válido.', 400);
    }
    return new AppError(
      'Datos inválidos para la atención. Verificá el canal y el resultado seleccionados.',
      400
    );
  }
  if (error.code === '23503') {
    return new AppError('Referencia inválida (cliente o usuario).', 400);
  }
  return new AppError(error.message || 'Error al guardar la atención', 500);
}

export interface AtencionPayload {
  canal: string;
  resultado: string;
  producto?: string | null;
  monto?: number | null;
  observaciones?: string;
  cliente_id?: string | null;
  cliente: ClienteInput;
  participante_qr_id?: string | null;
  vehiculo_id?: string | null;
  patente?: string | null;
  patente_manual?: string | null;
}

async function atencionYaTieneOrden(atencionId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('visitas_taller')
    .select('id', { count: 'exact', head: true })
    .eq('atencion_id', atencionId);
  if (error) return false;
  return (count || 0) > 0;
}

async function sincronizarOrdenGomero(
  atencionId: string,
  clienteId: string,
  resultado: string,
  patente: PatenteAtencionInput,
  observaciones?: string | null,
) {
  if (!debeCrearOrdenGomero(resultado, patente)) return;
  if (await atencionYaTieneOrden(atencionId)) return;

  const resuelta = await resolverPatenteAtencion(patente);
  await crearOrdenDesdeAtencion({
    atencionId,
    clienteId,
    vehiculoId: resuelta.vehiculo_id,
    patentePendiente: resuelta.patente_manual,
    motivo: observaciones,
  });
}

export class AtencionesService {
  private assertCanal(canal: string) {
    if (!validarCanalAtencion(canal)) {
      throw new AppError(mensajeCanalInvalido(canal), 400);
    }
  }

  /**
   * Registra una nueva atención del vendedor.
   */
  async crear(userId: string, data: AtencionPayload) {
    this.assertCanal(data.canal);

    const clienteId = await clientesService.resolverClienteParaAtencion({
      cliente_id: data.cliente_id,
      cliente: data.cliente,
      participante_qr_id: data.participante_qr_id,
    });

    const patenteInput: PatenteAtencionInput = {
      vehiculo_id: data.vehiculo_id,
      patente: data.patente,
      patente_manual: data.patente_manual,
    };
    const patenteRes = debeCrearOrdenGomero(data.resultado, patenteInput)
      ? await resolverPatenteAtencion(patenteInput)
      : { vehiculo_id: null, patente_manual: null, patente_canon: null };

    const { data: inserted, error } = await supabase
      .from('atenciones')
      .insert({
        user_id: userId,
        canal: data.canal,
        resultado: data.resultado,
        producto: data.producto || null,
        monto: data.monto ?? null,
        observaciones: data.observaciones || null,
        cliente_id: clienteId,
        vehiculo_id: patenteRes.vehiculo_id,
        patente_manual: patenteRes.patente_manual,
      })
      .select('id')
      .single();

    if (error) throw mapErrorSupabaseAtencion(error);

    await sincronizarOrdenGomero(
      inserted.id,
      clienteId,
      data.resultado,
      patenteInput,
      data.observaciones,
    ).catch((err) => {
      console.error('[AtencionesService] Error creando orden para gomero', err);
    });

    if (data.resultado === 'venta_cerrada') {
      this.checkObjetivoHito(userId).catch((err) => {
        console.error('[AtencionesService] Error verificando hitos de objetivo', { userId, err });
      });
      procesarCambioRankingPorVenta().catch((err) => {
        console.error('[AtencionesService] Error procesando cambio de ranking por venta', { userId, err });
      });
    }

    return { mensaje: 'Atención registrada correctamente' };
  }

  /**
   * Actualiza una atención existente del vendedor.
   */
  async actualizar(userId: string, atencionId: string, data: AtencionPayload) {
    this.assertCanal(data.canal);

    const clienteId = await clientesService.resolverClienteParaAtencion({
      cliente_id: data.cliente_id,
      cliente: data.cliente,
      participante_qr_id: data.participante_qr_id,
    });

    const patenteInput: PatenteAtencionInput = {
      vehiculo_id: data.vehiculo_id,
      patente: data.patente,
      patente_manual: data.patente_manual,
    };
    const patenteRes = debeCrearOrdenGomero(data.resultado, patenteInput)
      ? await resolverPatenteAtencion(patenteInput)
      : { vehiculo_id: null, patente_manual: null, patente_canon: null };

    const { data: updated, error } = await supabase
      .from('atenciones')
      .update({
        canal: data.canal,
        resultado: data.resultado,
        producto: data.producto || null,
        monto: data.monto ?? null,
        observaciones: data.observaciones || null,
        cliente_id: clienteId,
        vehiculo_id: patenteRes.vehiculo_id,
        patente_manual: patenteRes.patente_manual,
      })
      .eq('id', atencionId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) throw mapErrorSupabaseAtencion(error);
    if (!updated) throw new AppError('Atención no encontrada', 404);

    await sincronizarOrdenGomero(
      atencionId,
      clienteId,
      data.resultado,
      patenteInput,
      data.observaciones,
    ).catch((err) => {
      console.error('[AtencionesService] Error creando orden para gomero (update)', err);
    });

    return { mensaje: 'Atención actualizada correctamente' };
  }

  /**
   * Historial y estadísticas del vendedor.
   */
  async getMisAtenciones(userId: string) {
    const { data, error } = await supabase
      .from('atenciones')
      .select(
        `
        *,
        clientes (
          id,
          nombre,
          apellido,
          telefono,
          email
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Error al obtener las atenciones', 500);

    const atenciones = data || [];

    const total = atenciones.length;
    const ventas = atenciones.filter((a) => a.resultado === 'venta_cerrada').length;
    const noVentas = atenciones.filter((a) => a.resultado === 'no_venta').length;
    const pendientes = atenciones.filter((a) => a.resultado === 'pendiente').length;
    const montoTotal = atenciones
      .filter((a) => a.resultado === 'venta_cerrada' && a.monto != null)
      .reduce((acc, a) => acc + Number(a.monto || 0), 0);
    const tasaConversion = total > 0 ? Math.round((ventas / total) * 100) : 0;

    const stats = { total, ventas, noVentas, pendientes, montoTotal, tasaConversion };

    return { atenciones, stats };
  }

  /**
   * Verifica si el vendedor cruzó un hito de objetivo (50% o 100%)
   * y notifica a los admins por push.
   */
  private async checkObjetivoHito(userId: string) {
    const ahora = new Date();
    const mes = ahora.getMonth() + 1;
    const anio = ahora.getFullYear();

    const { data: objetivo } = await supabase
      .from('objetivos')
      .select('meta_ventas')
      .eq('user_id', userId)
      .eq('mes', mes)
      .eq('anio', anio)
      .maybeSingle();

    if (!objetivo?.meta_ventas || objetivo.meta_ventas === 0) return;

    const inicioMes = new Date(anio, mes - 1, 1).toISOString();
    const { count } = await supabase
      .from('atenciones')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('resultado', 'venta_cerrada')
      .gte('created_at', inicioMes);

    const ventasActuales = count || 0;
    const pct = Math.round((ventasActuales / objetivo.meta_ventas) * 100);

    const { data: vendedor } = await supabase
      .from('users')
      .select('nombre, apellido')
      .eq('id', userId)
      .single();

    const nombre = vendedor ? `${vendedor.nombre} ${vendedor.apellido}` : 'Un vendedor';

    if (ventasActuales === objetivo.meta_ventas) {
      await notificarAdmins(
        '🏆 Objetivo cumplido',
        `${nombre} alcanzó su objetivo de ${objetivo.meta_ventas} ventas este mes.`
      );
    } else if (pct === 50) {
      await notificarAdmins(
        '📈 Objetivo al 50%',
        `${nombre} llegó a la mitad de su objetivo mensual (${ventasActuales}/${objetivo.meta_ventas} ventas).`
      );
    }
  }

  /**
   * Todas las atenciones — solo admin.
   */
  async getTodasAtenciones() {
    const { data, error } = await supabase
      .from('atenciones')
      .select(`
        *,
        users (nombre, apellido, email),
        clientes (id, nombre, apellido, telefono, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Error al obtener las atenciones', 500);

    return { atenciones: data || [] };
  }
}

export const atencionesService = new AtencionesService();
