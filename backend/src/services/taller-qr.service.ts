/**
 * taller-qr.service.ts — QR y calificaciones del taller (gomero / mecánico)
 */

import { randomBytes } from 'crypto';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';

type RolTaller = 'gomero' | 'mecanico';

function esRolTaller(rol: string | undefined): rol is RolTaller {
  return rol === 'gomero' || rol === 'mecanico';
}

export class TallerQRService {
  async getOrCreateQR(userId: string, rol: string) {
    if (!esRolTaller(rol)) {
      throw new AppError('Solo gomeros y mecánicos pueden tener QR de taller', 403);
    }

    const { data: qrExistente } = await supabase
      .from('qr_taller_codigos')
      .select('codigo')
      .eq('user_id', userId)
      .eq('activo', true)
      .maybeSingle();

    if (qrExistente) {
      return { codigo: qrExistente.codigo };
    }

    const codigo = `mtll-${this.generarCodigo(8)}`;

    const { error } = await supabase.from('qr_taller_codigos').insert({
      user_id: userId,
      codigo,
      activo: true,
    });

    if (error) {
      throw new AppError('Error al generar el código QR del taller', 500);
    }

    return { codigo };
  }

  async getEmpleadoPublico(codigo: string) {
    const { data: qr, error: qrError } = await supabase
      .from('qr_taller_codigos')
      .select('user_id')
      .eq('codigo', codigo)
      .eq('activo', true)
      .maybeSingle();

    if (qrError || !qr) {
      throw new AppError('Código QR inválido o inactivo', 404);
    }

    const { data: empleado, error: empleadoError } = await supabase
      .from('users')
      .select('nombre, apellido, rol')
      .eq('id', qr.user_id)
      .eq('activo', true)
      .maybeSingle();

    if (empleadoError || !empleado || !esRolTaller(empleado.rol)) {
      throw new AppError('Empleado del taller no encontrado', 404);
    }

    const resumen = await this.getResumenCalificaciones(qr.user_id);

    return {
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      rol: empleado.rol as RolTaller,
      rolLabel: empleado.rol === 'gomero' ? 'Gomero' : 'Mecánico',
      promedio: resumen.promedio,
      totalCalificaciones: resumen.total,
    };
  }

  async guardarCalificacion(
    codigo: string,
    estrellas: number,
    comentario: string | null,
    ipCliente: string,
  ) {
    if (estrellas < 1 || estrellas > 5) {
      throw new AppError('La valoración debe ser entre 1 y 5', 400);
    }

    const { data: qr, error: qrError } = await supabase
      .from('qr_taller_codigos')
      .select('user_id')
      .eq('codigo', codigo)
      .eq('activo', true)
      .maybeSingle();

    if (qrError || !qr) {
      throw new AppError('Código QR inválido', 404);
    }

    const { data: empleado, error: empleadoError } = await supabase
      .from('users')
      .select('id, rol')
      .eq('id', qr.user_id)
      .eq('activo', true)
      .maybeSingle();

    if (empleadoError || !empleado || !esRolTaller(empleado.rol)) {
      throw new AppError('Empleado del taller no encontrado', 404);
    }

    const unaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: calificacionReciente } = await supabase
      .from('calificaciones_taller')
      .select('id')
      .eq('empleado_id', qr.user_id)
      .eq('ip_cliente', ipCliente)
      .gte('created_at', unaHoraAtras)
      .maybeSingle();

    if (calificacionReciente) {
      throw new AppError(
        'Ya calificaste a este empleado recientemente. Podés volver a calificar en una hora.',
        429,
      );
    }

    const { error } = await supabase.from('calificaciones_taller').insert({
      empleado_id: empleado.id,
      rol: empleado.rol,
      estrellas,
      comentario: comentario?.trim() || null,
      ip_cliente: ipCliente,
    });

    if (error) {
      throw new AppError('Error al guardar la calificación', 500);
    }

    return { mensaje: 'Gracias por tu calificación' };
  }

  async getMisCalificaciones(userId: string) {
    return this.getResumenCalificaciones(userId);
  }

  async getReporteAdmin() {
    const { data: empleados, error: empError } = await supabase
      .from('users')
      .select('id, nombre, apellido, rol')
      .in('rol', ['gomero', 'mecanico'])
      .eq('activo', true)
      .order('nombre');

    if (empError) {
      throw new AppError('Error al cargar empleados del taller', 500);
    }

    const { data: calificaciones, error: calError } = await supabase
      .from('calificaciones_taller')
      .select('id, empleado_id, rol, estrellas, comentario, created_at')
      .order('created_at', { ascending: false });

    if (calError) {
      throw new AppError('Error al cargar calificaciones del taller', 500);
    }

    const porEmpleado = new Map<
      string,
      {
        empleado_id: string;
        nombre: string;
        apellido: string;
        rol: RolTaller;
        rolLabel: string;
        promedio: number;
        total: number;
        comentarios: {
          id: string;
          estrellas: number;
          comentario: string | null;
          created_at: string;
        }[];
      }
    >();

    for (const e of empleados || []) {
      if (!esRolTaller(e.rol)) continue;
      porEmpleado.set(e.id, {
        empleado_id: e.id,
        nombre: e.nombre,
        apellido: e.apellido,
        rol: e.rol,
        rolLabel: e.rol === 'gomero' ? 'Gomero' : 'Mecánico',
        promedio: 0,
        total: 0,
        comentarios: [],
      });
    }

    for (const c of calificaciones || []) {
      const bucket = porEmpleado.get(c.empleado_id);
      if (!bucket) continue;
      bucket.comentarios.push({
        id: c.id,
        estrellas: c.estrellas,
        comentario: c.comentario,
        created_at: c.created_at,
      });
    }

    const empleadosReporte = Array.from(porEmpleado.values())
      .map((e) => {
        const total = e.comentarios.length;
        const promedio =
          total > 0
            ? Math.round(
                (e.comentarios.reduce((s, c) => s + c.estrellas, 0) / total) * 10,
              ) / 10
            : 0;
        return {
          ...e,
          total,
          promedio,
          comentarios: e.comentarios.slice(0, 20),
        };
      })
      .sort((a, b) => b.promedio - a.promedio || b.total - a.total);

    return { empleados: empleadosReporte };
  }

  private async getResumenCalificaciones(userId: string) {
    const { data: calificaciones, error } = await supabase
      .from('calificaciones_taller')
      .select('estrellas')
      .eq('empleado_id', userId);

    if (error || !calificaciones?.length) {
      return {
        promedio: 0,
        total: 0,
        distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const total = calificaciones.length;
    const suma = calificaciones.reduce((acc, c) => acc + c.estrellas, 0);
    const promedio = suma / total;

    const distribucion: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    calificaciones.forEach((c) => {
      distribucion[c.estrellas] = (distribucion[c.estrellas] || 0) + 1;
    });

    return {
      promedio: Math.round(promedio * 10) / 10,
      total,
      distribucion,
    };
  }

  private generarCodigo(longitud: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = randomBytes(longitud);
    return Array.from(bytes)
      .map((b) => chars[b % chars.length])
      .join('');
  }
}

export const tallerQRService = new TallerQRService();
