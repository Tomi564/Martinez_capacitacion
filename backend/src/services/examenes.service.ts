/**
 * examenes.service.ts — Lógica de negocio de exámenes
 *
 * Esta es la parte más crítica del sistema.
 * Contiene las reglas de negocio de bloqueo y desbloqueo de módulos.
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const NOTA_MINIMA_APROBACION_DEFAULT = 80;

export class ExamenesService {
  /**
   * Obtiene preguntas aleatorias para un examen.
   * NUNCA incluye la respuesta_correcta en la respuesta.
   */
  async getPreguntasExamen(moduloId: string, userId: string) {
    // Verificar que el módulo esté disponible para este usuario
    const { data: progreso } = await supabase
      .from('progreso')
      .select('estado, intentos')
      .eq('user_id', userId)
      .eq('modulo_id', moduloId)
      .single();

    if (!progreso || progreso.estado === 'bloqueado') {
      throw new AppError(
        'Este módulo está bloqueado. Aprobá el anterior primero.',
        403
      );
    }

    // Verificar límite de intentos también al pedir preguntas
    const MAX_INTENTOS = 3;

    if ((progreso.intentos || 0) >= MAX_INTENTOS && progreso.estado !== 'aprobado') {
      throw new AppError(
        `Alcanzaste el límite de ${MAX_INTENTOS} intentos para este módulo. ` +
        `Contactá a tu supervisor para coordinar una sesión de apoyo presencial.`,
        403
      );
    }

    // Obtener preguntas activas del módulo — SIN respuesta_correcta
    const { data: preguntas, error } = await supabase
      .from('preguntas')
      .select('id, enunciado, opciones')
      .eq('modulo_id', moduloId)
      .eq('activo', true);

    if (error || !preguntas?.length) {
      throw new AppError(
        'No hay preguntas disponibles para este módulo',
        404
      );
    }

    // Mezclar preguntas aleatoriamente (Fisher-Yates shuffle)
    const shuffled = [...preguntas].sort(() => Math.random() - 0.5);

    // Máximo 10 preguntas por examen
    const preguntasExamen = shuffled.slice(0, 10);

    // Marcar el módulo como 'en_curso' si estaba 'disponible'
    if (progreso.estado === 'disponible') {
      await supabase
        .from('progreso')
        .update({ estado: 'en_curso' })
        .eq('user_id', userId)
        .eq('modulo_id', moduloId);
    }

    return { preguntas: preguntasExamen };
  }

  /**
   * Procesa el envío de un examen.
   *
   * Flujo:
   *  1. Verificar que el módulo esté disponible
   *  2. Obtener respuestas correctas de la DB
   *  3. Calcular nota
   *  4. Guardar intento
   *  5. Actualizar progreso
   *  6. Si aprobó, desbloquear el siguiente módulo
   */
  async submitExamen(
    userId: string,
    moduloId: string,
    respuestas: Record<string, string>,
    duracionSeg?: number
  ) {
    // 1. Verificar que el módulo no esté bloqueado
    const [{ data: progreso }, { data: moduloData }] = await Promise.all([
      supabase
        .from('progreso')
        .select('estado, mejor_nota, intentos')
        .eq('user_id', userId)
        .eq('modulo_id', moduloId)
        .single(),
      supabase
        .from('modulos')
        .select('porcentaje_aprobacion')
        .eq('id', moduloId)
        .single(),
    ]);

    if (!progreso || progreso.estado === 'bloqueado') {
      throw new AppError(
        'Este módulo está bloqueado. Aprobá el anterior primero.',
        403
      );
    }

    // Verificar límite de 3 intentos
    const MAX_INTENTOS = 3;

    if ((progreso.intentos || 0) >= MAX_INTENTOS && progreso.estado !== 'aprobado') {
      throw new AppError(
        `Alcanzaste el límite de ${MAX_INTENTOS} intentos para este módulo. ` +
        `Contactá a tu supervisor para coordinar una sesión de apoyo presencial.`,
        403
      );
    }

    // 2. Obtener respuestas correctas
    const preguntaIds = Object.keys(respuestas);

    const { data: preguntas, error: preguntasError } = await supabase
      .from('preguntas')
      .select('id, enunciado, opciones, respuesta_correcta, explicacion')
      .in('id', preguntaIds)
      .eq('modulo_id', moduloId)
      .eq('activo', true);

    if (preguntasError || !preguntas?.length) {
      throw new AppError('Error al validar las respuestas', 500);
    }

    // 3. Calcular nota
    const porcentajeAprobacion = (moduloData as any)?.porcentaje_aprobacion ?? NOTA_MINIMA_APROBACION_DEFAULT;
    const minimasCorrectas = Math.ceil(preguntas.length * porcentajeAprobacion / 100);
    const tolerancia = preguntas.length - minimasCorrectas;

    let correctas = 0;
    const retroalimentacion: {
      pregunta_id: string;
      correcta: boolean;
      respuesta_dada: string;
      respuesta_correcta: string;
      explicacion: string | null;
    }[] = [];

    for (const pregunta of preguntas) {
      const esCorrecta = respuestas[pregunta.id] === pregunta.respuesta_correcta;
      if (esCorrecta) correctas++;

      retroalimentacion.push({
        pregunta_id: pregunta.id,
        correcta: esCorrecta,
        respuesta_dada: respuestas[pregunta.id] || '',
        respuesta_correcta: pregunta.respuesta_correcta,
        explicacion: null, // se asigna abajo según tolerancia
      });
    }

    const errores = preguntas.length - correctas;
    const nota = (correctas / preguntas.length) * 100;
    const aprobado = correctas >= minimasCorrectas;

    // Mostrar explicación solo si los errores están dentro de la tolerancia
    const mostrarExplicacion = errores > 0 && errores <= tolerancia;
    if (mostrarExplicacion) {
      for (let i = 0; i < retroalimentacion.length; i++) {
        if (!retroalimentacion[i].correcta) {
          retroalimentacion[i].explicacion = (preguntas[i] as any).explicacion || null;
        }
      }
    }

    // 4. Guardar el intento siempre, independientemente del resultado
    await supabase.from('intentos_examen').insert({
      user_id: userId,
      modulo_id: moduloId,
      respuestas,
      nota,
      aprobado,
      duracion_seg: duracionSeg || null,
    });

    // 5. Actualizar progreso
    const nuevaMejorNota = Math.max(nota, progreso.mejor_nota || 0);

    await supabase
      .from('progreso')
      .update({
        estado: aprobado ? 'aprobado' : 'en_curso',
        intentos: (progreso.intentos || 0) + 1,
        mejor_nota: nuevaMejorNota,
        ultimo_intento: new Date().toISOString(),
        completado_at: aprobado ? new Date().toISOString() : null,
      })
      .eq('user_id', userId)
      .eq('modulo_id', moduloId);

    // 6. Si aprobó, desbloquear el siguiente módulo
    let siguienteModuloDesbloqueado = false;
    if (aprobado) {
      siguienteModuloDesbloqueado = await this.desbloquearSiguiente(
        userId,
        moduloId
      );
      // Si no hay siguiente módulo = completó toda la capacitación
      if (!siguienteModuloDesbloqueado) {
        await this.notificarAdminCapacitacionCompleta(userId).catch(() => {});
      }
    }

    // 7. Si no aprobó y alcanzó el límite de intentos, notificar al admin
    const nuevosIntentos = (progreso.intentos || 0) + 1;
    if (!aprobado && nuevosIntentos >= MAX_INTENTOS) {
      await this.notificarAdminLimiteIntentos(userId, moduloId);
    }

    return {
      nota,
      aprobado,
      respuestasCorrectas: correctas,
      totalPreguntas: preguntas.length,
      siguienteModuloDesbloqueado,
      capacitacionCompleta: aprobado && !siguienteModuloDesbloqueado,
      retroalimentacion,
      mensaje: aprobado
        ? `¡Aprobaste con ${nota.toFixed(1)}%! ${
            siguienteModuloDesbloqueado
              ? 'Se desbloqueó el siguiente módulo.'
              : '¡Completaste todos los módulos!'
          }`
        : `Obtuviste ${nota.toFixed(1)}%. Necesitás ${porcentajeAprobacion}% para aprobar. ¡Podés volver a intentarlo!`,
    };
  }

  /**
   * Desbloquea el siguiente módulo en la secuencia.
   * Retorna true si había un módulo siguiente para desbloquear.
   */
  private async desbloquearSiguiente(
    userId: string,
    moduloActualId: string
  ): Promise<boolean> {
    // Obtener el orden del módulo actual
    const { data: moduloActual } = await supabase
      .from('modulos')
      .select('orden')
      .eq('id', moduloActualId)
      .single();

    if (!moduloActual) return false;

    // Buscar el siguiente módulo en la secuencia
    const { data: siguienteModulo } = await supabase
      .from('modulos')
      .select('id')
      .eq('activo', true)
      .eq('orden', moduloActual.orden + 1)
      .single();

    if (!siguienteModulo) return false;

    // Desbloquear el siguiente módulo
    const { error } = await supabase
      .from('progreso')
      .update({ estado: 'disponible' })
      .eq('user_id', userId)
      .eq('modulo_id', siguienteModulo.id);

    return !error;
  }

  /**
   * Notifica al admin cuando un vendedor alcanza el límite de intentos.
   */
  private async notificarAdminLimiteIntentos(userId: string, moduloId: string) {
    const { data: vendedor } = await supabase
      .from('users')
      .select('nombre, apellido, email')
      .eq('id', userId)
      .single();

    const { data: modulo } = await supabase
      .from('modulos')
      .select('titulo, orden')
      .eq('id', moduloId)
      .single();

    if (!vendedor || !modulo) return;

    await supabase.from('notificaciones_admin').insert({
      tipo: 'limite_intentos',
      titulo: `${vendedor.nombre} ${vendedor.apellido} necesita apoyo`,
      mensaje: `${vendedor.nombre} ${vendedor.apellido} (${vendedor.email}) alcanzó el límite de 3 intentos en el Módulo ${modulo.orden}: "${modulo.titulo}". Se recomienda coordinar una sesión de apoyo presencial.`,
      user_id: userId,
      modulo_id: moduloId,
      leida: false,
    });
  }

  private async notificarAdminCapacitacionCompleta(userId: string) {
    const { data: vendedor } = await supabase
      .from('users')
      .select('nombre, apellido, email')
      .eq('id', userId)
      .single();

    if (!vendedor) return;

    const nombre = `${vendedor.nombre} ${vendedor.apellido}`;

    // Notificación en panel admin
    await supabase.from('notificaciones_admin').insert({
      tipo: 'capacitacion_completa',
      titulo: `🎓 ${nombre} completó la capacitación`,
      mensaje: `${nombre} (${vendedor.email}) aprobó todos los módulos. Coordiná la entrega del premio.`,
      user_id: userId,
      leida: false,
    });

    // Push a todos los admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('rol', 'admin')
      .eq('activo', true);

    if (!admins?.length) return;

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', admins.map((a: { id: string }) => a.id));

    if (!subs?.length) return;

    const webpush = await import('web-push');
    const payload = JSON.stringify({
      title: `🎓 ${nombre} completó la capacitación`,
      body: 'Aprobó todos los módulos. Coordiná la entrega del premio.',
    });

    await Promise.allSettled(
      subs.map((s: { subscription: string }) =>
        webpush.default.sendNotification(
          typeof s.subscription === 'string' ? JSON.parse(s.subscription) : s.subscription,
          payload
        )
      )
    );
  }

  /**
   * Obtiene el historial de intentos de un vendedor en un módulo.
   */
  async getHistorial(userId: string, moduloId: string) {
    const { data, error } = await supabase
      .from('intentos_examen')
      .select('id, nota, aprobado, duracion_seg, created_at')
      .eq('user_id', userId)
      .eq('modulo_id', moduloId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Error al obtener el historial', 500);
    }

    return { historial: data || [] };
  }
}

export const examenesService = new ExamenesService();