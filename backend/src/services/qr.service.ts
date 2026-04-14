/**
 * qr.service.ts — Lógica de negocio del sistema QR
 *
 * Responsabilidades:
 *  - Generar código QR único por vendedor
 *  - Obtener datos públicos del vendedor para la encuesta
 *  - Guardar calificaciones de clientes
 *  - Obtener resumen de calificaciones
 */

import { randomBytes } from 'crypto';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class QRService {
  /**
   * Obtiene o crea el código QR de un vendedor.
   * Si ya tiene uno, lo retorna. Si no, lo genera.
   */
  async getOrCreateQR(userId: string) {
    // Buscar QR existente
    const { data: qrExistente } = await supabase
      .from('qr_codigos')
      .select('codigo')
      .eq('user_id', userId)
      .eq('activo', true)
      .single();

    if (qrExistente) {
      return { codigo: qrExistente.codigo };
    }

    // Generar código único: "mneu-" + 8 caracteres aleatorios
    const codigo = `mneu-${this.generarCodigo(8)}`;

    const { error } = await supabase.from('qr_codigos').insert({
      user_id: userId,
      codigo,
      activo: true,
    });

    if (error) {
      throw new AppError('Error al generar el código QR', 500);
    }

    return { codigo };
  }

  /**
   * Obtiene los datos públicos del vendedor para mostrar en la encuesta.
   * Esta info es pública — no requiere autenticación.
   */
  async getVendedorPublico(codigo: string) {
    // Buscar el QR y el vendedor asociado
    const { data: qr, error: qrError } = await supabase
      .from('qr_codigos')
      .select('user_id')
      .eq('codigo', codigo)
      .eq('activo', true)
      .single();

    if (qrError || !qr) {
      throw new AppError('Código QR inválido o inactivo', 404);
    }

    // Obtener datos básicos del vendedor
    const { data: vendedor, error: vendedorError } = await supabase
      .from('users')
      .select('nombre, apellido')
      .eq('id', qr.user_id)
      .eq('activo', true)
      .single();

    if (vendedorError || !vendedor) {
      throw new AppError('Vendedor no encontrado', 404);
    }

    // Obtener resumen de calificaciones
    const resumen = await this.getResumenCalificaciones(qr.user_id);

    return {
      nombre: vendedor.nombre,
      apellido: vendedor.apellido,
      promedio: resumen.promedio,
      totalCalificaciones: resumen.total,
    };
  }

  /**
   * Guarda una calificación de un cliente.
   * Control básico anti-spam por IP.
   */
  async guardarCalificacion(
    codigo: string,
    estrellas: number,
    comentario: string | null,
    ipCliente: string,
    participante?: { nombre: string; apellido: string; dni: string; contacto: string }
  ) {
    // Validar estrellas
    if (estrellas < 1 || estrellas > 5) {
      throw new AppError('Las estrellas deben ser entre 1 y 5', 400);
    }

    // Obtener el vendedor por código QR
    const { data: qr, error: qrError } = await supabase
      .from('qr_codigos')
      .select('user_id')
      .eq('codigo', codigo)
      .eq('activo', true)
      .single();

    if (qrError || !qr) {
      throw new AppError('Código QR inválido', 404);
    }

    // Control anti-spam: misma IP no puede calificar al mismo vendedor
    // más de una vez por hora
    const unaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: calificacionReciente } = await supabase
      .from('calificaciones_qr')
      .select('id')
      .eq('vendedor_id', qr.user_id)
      .eq('ip_cliente', ipCliente)
      .gte('created_at', unaHoraAtras)
      .single();

    if (calificacionReciente) {
      throw new AppError(
        'Ya calificaste a este vendedor recientemente. Podés volver a calificar en una hora.',
        429
      );
    }

    // Guardar calificación
    const { error } = await supabase.from('calificaciones_qr').insert({
      vendedor_id: qr.user_id,
      estrellas,
      comentario: comentario || null,
      ip_cliente: ipCliente,
    });

    if (error) {
      throw new AppError('Error al guardar la calificación', 500);
    }

    // Guardar datos del participante para el sorteo (si los proporcionó)
    if (participante?.nombre && participante?.apellido && participante?.dni && participante?.contacto) {
      await supabase.from('participantes_sorteo').insert({
        nombre: participante.nombre.trim(),
        apellido: participante.apellido.trim(),
        dni: participante.dni.trim(),
        contacto: participante.contacto.trim(),
        vendedor_id: qr.user_id,
      });
    }

    return { mensaje: '¡Gracias por tu calificación!' };
  }

  async getParticipantesSorteo() {
    const { data, error } = await supabase
      .from('participantes_sorteo')
      .select(`
        id, nombre, apellido, dni, contacto, created_at,
        vendedor:users!vendedor_id(nombre, apellido)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Error al obtener participantes', 500);
    return data || [];
  }

  /**
   * Obtiene el resumen de calificaciones de un vendedor.
   */
  async getMisCalificaciones(userId: string) {
    return this.getResumenCalificaciones(userId);
  }

  /**
   * Calcula el resumen de calificaciones de un vendedor.
   * Retorna promedio, total y distribución por estrellas.
   */
  private async getResumenCalificaciones(userId: string) {
    const { data: calificaciones, error } = await supabase
      .from('calificaciones_qr')
      .select('estrellas')
      .eq('vendedor_id', userId);

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

    // Distribución por cantidad de estrellas
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

  /**
   * Genera un string aleatorio de N caracteres.
   * Usa solo caracteres alfanuméricos en minúsculas para URLs limpias.
   */
  private generarCodigo(longitud: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = randomBytes(longitud);
    return Array.from(bytes)
      .map((b) => chars[b % chars.length])
      .join('');
  }
}

export const qrService = new QRService();