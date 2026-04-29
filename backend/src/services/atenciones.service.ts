/**
 * atenciones.service.ts — Lógica de negocio de atenciones al cliente
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { procesarCambioRankingPorVenta } from './ranking-notificaciones.service';

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

export class AtencionesService {
  /**
   * Registra una nueva atención del vendedor.
   */
  async crear(
    userId: string,
    data: {
      canal: string;
      resultado: string;
      producto?: string;
      monto?: number;
      observaciones?: string;
    }
  ) {
    const { error } = await supabase.from('atenciones').insert({
      user_id: userId,
      canal: data.canal,
      resultado: data.resultado,
      producto: data.producto || null,
      monto: data.monto || null,
      observaciones: data.observaciones || null,
    });

    if (error) throw new AppError('Error al registrar la atención', 500);

    // Chequear hitos de objetivo si fue una venta cerrada
    if (data.resultado === 'venta_cerrada') {
      this.checkObjetivoHito(userId).catch((error) => {
        console.error('[AtencionesService] Error verificando hitos de objetivo', { userId, error });
      });
      procesarCambioRankingPorVenta().catch((error) => {
        console.error('[AtencionesService] Error procesando cambio de ranking por venta', { userId, error });
      });
    }

    return { mensaje: 'Atención registrada correctamente' };
  }

  /**
   * Historial y estadísticas del vendedor.
   */
  async getMisAtenciones(userId: string) {
    const { data, error } = await supabase
      .from('atenciones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Error al obtener las atenciones', 500);

    const atenciones = data || [];

    const total = atenciones.length;
    const ventas = atenciones.filter((a) => a.resultado === 'venta_cerrada').length;
    const noVentas = atenciones.filter((a) => a.resultado === 'no_venta').length;
    const pendientes = atenciones.filter((a) => a.resultado === 'pendiente').length;
    const montoTotal = atenciones
      .filter((a) => a.monto)
      .reduce((acc, a) => acc + (a.monto || 0), 0);
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

    // Obtener objetivo del mes
    const { data: objetivo } = await supabase
      .from('objetivos')
      .select('meta_ventas')
      .eq('user_id', userId)
      .eq('mes', mes)
      .eq('anio', anio)
      .maybeSingle();

    if (!objetivo?.meta_ventas || objetivo.meta_ventas === 0) return;

    // Contar ventas del mes
    const inicioMes = new Date(anio, mes - 1, 1).toISOString();
    const { count } = await supabase
      .from('atenciones')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('resultado', 'venta_cerrada')
      .gte('created_at', inicioMes);

    const ventasActuales = count || 0;
    const pct = Math.round((ventasActuales / objetivo.meta_ventas) * 100);

    // Obtener nombre del vendedor
    const { data: vendedor } = await supabase
      .from('users')
      .select('nombre, apellido')
      .eq('id', userId)
      .single();

    const nombre = vendedor ? `${vendedor.nombre} ${vendedor.apellido}` : 'Un vendedor';

    // Notificar en hitos exactos
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
        users (nombre, apellido, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Error al obtener las atenciones', 500);

    return { atenciones: data || [] };
  }
}

export const atencionesService = new AtencionesService();
