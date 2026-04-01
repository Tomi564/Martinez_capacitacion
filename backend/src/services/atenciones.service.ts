/**
 * atenciones.service.ts — Lógica de negocio de atenciones al cliente
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';

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

    const stats = {
      total: atenciones.length,
      ventas: atenciones.filter((a) => a.resultado === 'venta').length,
      enSeguimiento: atenciones.filter((a) => a.resultado === 'en_seguimiento').length,
      sinVenta: atenciones.filter((a) => a.resultado === 'sin_venta').length,
      montoTotal: atenciones
        .filter((a) => a.monto)
        .reduce((acc, a) => acc + (a.monto || 0), 0),
    };

    return { atenciones, stats };
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
