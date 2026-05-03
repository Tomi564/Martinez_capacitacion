/**
 * examenes.service.ts — Lógica de negocio de exámenes
 *
 * Esta es la parte más crítica del sistema.
 * Contiene las reglas de negocio de bloqueo y desbloqueo de módulos.
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const NOTA_MINIMA_APROBACION_DEFAULT = 80;
type TipoPregunta = 'opcion_unica' | 'verdadero_falso' | 'caso_practico' | 'desarrollo';
const examenesServidos = new Map<string, string[]>();

function normalizarTexto(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function puntuarDesarrollo(respuesta: string, clave: string, puntajeMaximo: number) {
  const respuestaNorm = normalizarTexto(respuesta);
  const keywords = clave
    .split('|')
    .map((k) => normalizarTexto(k))
    .filter(Boolean);

  if (!keywords.length || !respuestaNorm) {
    return { puntaje: 0, ratio: 0 };
  }

  const hits = keywords.filter((k) => respuestaNorm.includes(k)).length;
  const ratio = hits / keywords.length;

  if (ratio >= 0.6) return { puntaje: puntajeMaximo, ratio };
  if (ratio >= 0.35) return { puntaje: Number((puntajeMaximo * 0.5).toFixed(2)), ratio };
  return { puntaje: 0, ratio };
}

export class ExamenesService {
  private getExamenKey(userId: string, moduloId: string) {
    return `${userId}:${moduloId}`;
  }
  /**
   * Obtiene todas las preguntas activas del módulo en orden fijo (created_at ASC,
   * igual que el listado del editor admin). NUNCA incluye respuesta_correcta.
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
    // Compatibilidad: si la BD aún no tiene tipo/puntaje, reintenta con el select básico.
    let preguntas: any[] | null = null;
    let error: any = null;
    const primerIntento = await supabase
      .from('preguntas')
      .select('id, enunciado, opciones, tipo, puntaje')
      .eq('modulo_id', moduloId)
      .eq('activo', true)
      .order('created_at', { ascending: true });
    if (primerIntento.error) {
      const fallback = await supabase
        .from('preguntas')
        .select('id, enunciado, opciones')
        .eq('modulo_id', moduloId)
        .eq('activo', true)
        .order('created_at', { ascending: true });
      preguntas = fallback.data as any[] | null;
      error = fallback.error;
    } else {
      preguntas = primerIntento.data as any[] | null;
    }

    if (error || !preguntas?.length) {
      throw new AppError(
        'No hay preguntas disponibles para este módulo',
        404
      );
    }

    const preguntasExamen = preguntas;
    examenesServidos.set(
      this.getExamenKey(userId, moduloId),
      preguntasExamen.map((p: any) => p.id)
    );

    // Marcar el módulo como 'en_curso' si estaba 'disponible'
    if (progreso.estado === 'disponible') {
      await supabase
        .from('progreso')
        .update({ estado: 'en_curso' })
        .eq('user_id', userId)
        .eq('modulo_id', moduloId);
    }

    return {
      preguntas: preguntasExamen.map((p) => ({
        ...p,
        tipo: (p.tipo as TipoPregunta | undefined) || 'opcion_unica',
        puntaje: Number(p.puntaje ?? 1),
      })),
    };
  }

  /**
   * Procesa el envío de un examen.
   *
   * Flujo:
   *  1. Verificar que el módulo esté disponible
   *  2. Obtener respuestas correctas de la DB
   *  3. Calcular nota
   *  4. Guardar intento
   *  5. Actualizar progreso (si ya estaba aprobado y desaprueba un reintento, sigue aprobado)
   *  6. Si aprobó este intento, desbloquear el siguiente módulo
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
        .select('estado, mejor_nota, intentos, completado_at')
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

    // 2. Validar que estén respondidas todas las preguntas del examen servido
    const examKey = this.getExamenKey(userId, moduloId);
    const preguntaIdsEsperadas = examenesServidos.get(examKey) || [];
    if (!preguntaIdsEsperadas.length) {
      throw new AppError('Debés responder todas las preguntas antes de enviar', 400);
    }

    const respuestasNormalizadas = Object.fromEntries(
      Object.entries(respuestas || {}).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : ''])
    ) as Record<string, string>;

    const idsRespondidas = Object.keys(respuestasNormalizadas).filter(
      (id) => typeof respuestasNormalizadas[id] === 'string' && respuestasNormalizadas[id].length > 0
    );
    const idsEsperadasSet = new Set(preguntaIdsEsperadas);
    const faltanPreguntas = preguntaIdsEsperadas.some((id) => !idsRespondidas.includes(id));
    const hayIdsExtra = idsRespondidas.some((id) => !idsEsperadasSet.has(id));
    if (faltanPreguntas || hayIdsExtra || idsRespondidas.length !== preguntaIdsEsperadas.length) {
      throw new AppError('Debés responder todas las preguntas antes de enviar', 400);
    }

    // 3. Obtener respuestas correctas
    const preguntaIds = preguntaIdsEsperadas;

    let preguntas: any[] | null = null;
    let preguntasError: any = null;
    const preguntasConNuevoSchema = await supabase
      .from('preguntas')
      .select('id, enunciado, opciones, respuesta_correcta, explicacion, tipo, puntaje')
      .in('id', preguntaIds)
      .eq('modulo_id', moduloId)
      .eq('activo', true);
    if (preguntasConNuevoSchema.error) {
      const fallback = await supabase
        .from('preguntas')
        .select('id, enunciado, opciones, respuesta_correcta, explicacion')
        .in('id', preguntaIds)
        .eq('modulo_id', moduloId)
        .eq('activo', true);
      preguntas = fallback.data as any[] | null;
      preguntasError = fallback.error;
    } else {
      preguntas = preguntasConNuevoSchema.data as any[] | null;
    }

    if (preguntasError || !preguntas?.length) {
      throw new AppError('Error al validar las respuestas', 500);
    }

    // 4. Calcular nota
    const porcentajeAprobacion = (moduloData as any)?.porcentaje_aprobacion ?? NOTA_MINIMA_APROBACION_DEFAULT;
    const preguntasConMeta = (preguntas || []).map((p: any) => ({
      ...p,
      tipo: (p.tipo as TipoPregunta | undefined) || 'opcion_unica',
      puntaje: Number(p.puntaje ?? 1),
    }));
    const puntajeTotal = preguntasConMeta.reduce((acc, p) => acc + p.puntaje, 0);
    const puntajeMinimoAprobacion = Number(
      ((puntajeTotal * porcentajeAprobacion) / 100).toFixed(2)
    );
    const toleranciaPuntos = Number((puntajeTotal - puntajeMinimoAprobacion).toFixed(2));

    let correctas = 0; // compat para UI
    let puntajeObtenido = 0;
    const retroalimentacion: {
      pregunta_id: string;
      correcta: boolean;
      respuesta_dada: string;
      respuesta_correcta: string;
      explicacion: string | null;
      puntaje_obtenido?: number;
      puntaje_maximo?: number;
      tipo?: TipoPregunta;
    }[] = [];

    for (const pregunta of preguntasConMeta) {
      const respuestaDada = respuestasNormalizadas[pregunta.id] || '';
      let esCorrecta = false;
      let puntosPregunta = 0;

      if (pregunta.tipo === 'desarrollo') {
        const desarrollo = puntuarDesarrollo(
          respuestaDada,
          String(pregunta.respuesta_correcta || ''),
          pregunta.puntaje
        );
        puntosPregunta = desarrollo.puntaje;
        esCorrecta = puntosPregunta >= pregunta.puntaje;
      } else {
        esCorrecta = respuestaDada === pregunta.respuesta_correcta;
        puntosPregunta = esCorrecta ? pregunta.puntaje : 0;
      }
      if (esCorrecta) correctas++;
      puntajeObtenido += puntosPregunta;

      retroalimentacion.push({
        pregunta_id: pregunta.id,
        correcta: esCorrecta,
        respuesta_dada: respuestaDada,
        respuesta_correcta: pregunta.respuesta_correcta,
        explicacion: null, // se asigna abajo según tolerancia
        puntaje_obtenido: Number(puntosPregunta.toFixed(2)),
        puntaje_maximo: pregunta.puntaje,
        tipo: pregunta.tipo,
      });
    }

    const puntajePerdido = Number((puntajeTotal - puntajeObtenido).toFixed(2));
    const nota = puntajeTotal > 0 ? (puntajeObtenido / puntajeTotal) * 100 : 0;
    const aprobado = puntajeObtenido >= puntajeMinimoAprobacion;

    // Mostrar retroalimentación detallada solo si el vendedor falló
    // dentro de la tolerancia del módulo. Si supera la tolerancia,
    // no se muestra feedback pregunta por pregunta para forzar repaso.
    const mostrarRetroalimentacionDetallada =
      puntajePerdido > 0 && puntajePerdido <= toleranciaPuntos;
    if (mostrarRetroalimentacionDetallada) {
      for (let i = 0; i < retroalimentacion.length; i++) {
        if (!retroalimentacion[i].correcta) {
          retroalimentacion[i].explicacion = (preguntasConMeta[i] as any).explicacion || null;
        }
      }
    }

    // 5. Guardar el intento siempre, independientemente del resultado
    await supabase.from('intentos_examen').insert({
      user_id: userId,
      modulo_id: moduloId,
      respuestas: respuestasNormalizadas,
      nota,
      aprobado,
      duracion_seg: duracionSeg || null,
    });

    // 6. Actualizar progreso
    const nuevaMejorNota = Math.max(nota, progreso.mejor_nota || 0);
    const intentosAntes = progreso.intentos || 0;
    const nuevosIntentos = intentosAntes + 1;
    const yaEstabaAprobado = progreso.estado === 'aprobado';

    const progresoPatch: Record<string, unknown> = {
      intentos: nuevosIntentos,
      mejor_nota: nuevaMejorNota,
      ultimo_intento: new Date().toISOString(),
    };

    if (aprobado) {
      progresoPatch.estado = 'aprobado';
      progresoPatch.completado_at = new Date().toISOString();
    } else if (yaEstabaAprobado) {
      // Reintento solo para mejorar nota: no se pierde la aprobación ni se afectan módulos siguientes
      progresoPatch.estado = 'aprobado';
      // completado_at se mantiene (no se envía)
    } else {
      progresoPatch.estado = 'en_curso';
      progresoPatch.completado_at = null;
    }

    await supabase.from('progreso').update(progresoPatch).eq('user_id', userId).eq('modulo_id', moduloId);

    // 7. Si aprobó, desbloquear el siguiente módulo
    let siguienteModuloDesbloqueado = false;
    if (aprobado) {
      siguienteModuloDesbloqueado = await this.desbloquearSiguiente(
        userId,
        moduloId
      );
      // Si no hay siguiente módulo = completó toda la capacitación
      if (!siguienteModuloDesbloqueado) {
        await this.notificarAdminCapacitacionCompleta(userId).catch((error) => {
          console.error('[ExamenesService] Error notificando capacitación completa', { userId, error });
        });
      }
    }

    // 8. Si no aprobó (nunca había aprobado) y alcanzó el límite de intentos, notificar al admin
    if (!aprobado && nuevosIntentos >= MAX_INTENTOS && !yaEstabaAprobado) {
      await this.notificarAdminLimiteIntentos(userId, moduloId);
    }
    examenesServidos.delete(examKey);

    return {
      nota,
      aprobado,
      respuestasCorrectas: correctas,
      totalPreguntas: preguntas.length,
      puntajeObtenido: Number(puntajeObtenido.toFixed(2)),
      puntajeTotal: Number(puntajeTotal.toFixed(2)),
      puntajeMinimoAprobacion,
      siguienteModuloDesbloqueado,
      capacitacionCompleta: aprobado && !siguienteModuloDesbloqueado,
      retroalimentacion,
      mostrarRetroalimentacionDetallada,
      mensaje: aprobado
        ? `¡Aprobaste con ${nota.toFixed(1)}%! ${
            siguienteModuloDesbloqueado
              ? 'Se desbloqueó el siguiente módulo.'
              : '¡Completaste todos los módulos!'
          }`
        : mostrarRetroalimentacionDetallada
        ? `Obtuviste ${nota.toFixed(1)}%. Necesitás ${porcentajeAprobacion}% para aprobar. ¡Podés volver a intentarlo!`
        : `No alcanzaste el mínimo para aprobar. Repasá el contenido completo del módulo y volvé a intentarlo.`,
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
      .select('endpoint, p256dh, auth')
      .in('user_id', admins.map((a: { id: string }) => a.id));

    if (!subs?.length) return;

    const webpush = await import('web-push');
    webpush.default.setVapidDetails(
      'mailto:admin@martinez.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
    const payload = JSON.stringify({
      title: `🎓 ${nombre} completó la capacitación`,
      body: 'Aprobó todos los módulos. Coordiná la entrega del premio.',
    });

    await Promise.allSettled(
      subs.map((s: { endpoint: string; p256dh: string; auth: string }) =>
        webpush.default.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
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