/**
 * Revisión manual de intentos de examen (preguntas de desarrollo).
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { sendPushToUserIds } from './push-send.service';
import {
  calcularNotaDesdePuntos,
  desarrolloRequiereRevision,
  normalizarTipoPregunta,
  puntosPreguntaAutomaticos,
  puntuarDesarrollo,
  type PreguntaCalificable,
} from '../utils/examenes-scoring';

const NOTA_MINIMA_APROBACION_DEFAULT = 80;
type RevisionEstado = 'pendiente' | 'revisado' | 'automatico';

type IntentoRow = {
  id: string;
  user_id: string;
  modulo_id: string;
  respuestas: Record<string, string>;
  nota: number;
  aprobado: boolean;
  created_at: string;
  revision_estado: RevisionEstado | null;
  revision_nota_final: number | null;
  revision_puntaje_ajustado: Record<string, number> | null;
  users: { nombre: string; apellido: string } | null;
  modulos: { titulo: string; orden: number; porcentaje_aprobacion: number | null } | null;
};

function clampPuntaje(valor: number, maximo: number): number {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 0;
  return Math.min(maximo, Math.max(0, Number(n.toFixed(2))));
}

async function desbloquearSiguienteModulo(userId: string, moduloActualId: string): Promise<boolean> {
  const { data: moduloActual } = await supabase
    .from('modulos')
    .select('orden')
    .eq('id', moduloActualId)
    .maybeSingle();
  if (!moduloActual) return false;

  const { data: siguienteModulo } = await supabase
    .from('modulos')
    .select('id')
    .eq('activo', true)
    .eq('orden', moduloActual.orden + 1)
    .maybeSingle();
  if (!siguienteModulo) return false;

  const { error } = await supabase
    .from('progreso')
    .update({ estado: 'disponible' })
    .eq('user_id', userId)
    .eq('modulo_id', siguienteModulo.id);
  return !error;
}

async function aplicarProgresoSiAprobado(
  userId: string,
  moduloId: string,
  nota: number,
  aprobado: boolean,
): Promise<{ siguienteModuloDesbloqueado: boolean }> {
  if (!aprobado) return { siguienteModuloDesbloqueado: false };

  const { data: progreso } = await supabase
    .from('progreso')
    .select('estado, mejor_nota, completado_at')
    .eq('user_id', userId)
    .eq('modulo_id', moduloId)
    .maybeSingle();

  if (!progreso) return { siguienteModuloDesbloqueado: false };

  const yaEstabaAprobado = progreso.estado === 'aprobado';
  const nuevaMejorNota = Math.max(Number(progreso.mejor_nota || 0), nota);

  const progresoPatch: Record<string, unknown> = {
    mejor_nota: nuevaMejorNota,
    ultimo_intento: new Date().toISOString(),
    estado: 'aprobado',
  };
  if (!yaEstabaAprobado || !progreso.completado_at) {
    progresoPatch.completado_at = new Date().toISOString();
  }

  await supabase.from('progreso').update(progresoPatch).eq('user_id', userId).eq('modulo_id', moduloId);

  let siguienteModuloDesbloqueado = false;
  if (!yaEstabaAprobado) {
    siguienteModuloDesbloqueado = await desbloquearSiguienteModulo(userId, moduloId);
  }

  return { siguienteModuloDesbloqueado };
}

export class ExamenesRevisionService {
  async listarIntentosRevision(estado: RevisionEstado = 'pendiente') {
    const { data, error } = await supabase
      .from('intentos_examen')
      .select(
        `
        id,
        user_id,
        modulo_id,
        respuestas,
        nota,
        aprobado,
        created_at,
        revision_estado,
        revision_nota_final,
        revision_puntaje_ajustado,
        users!intentos_examen_user_id_fkey (nombre, apellido),
        modulos (titulo, orden, porcentaje_aprobacion)
      `,
      )
      .eq('revision_estado', estado)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Error al listar intentos de examen', 500);

    const intentos = await Promise.all(
      ((data || []) as unknown as IntentoRow[]).map((row) => this.enriquecerIntento(row)),
    );

    return { intentos };
  }

  private async enriquecerIntento(row: IntentoRow) {
    const respuestas =
      row.respuestas && typeof row.respuestas === 'object' ? row.respuestas : {};
    const preguntaIds = Object.keys(respuestas);

    if (!preguntaIds.length) {
      return {
        id: row.id,
        vendedor: row.users
          ? { nombre: row.users.nombre, apellido: row.users.apellido }
          : { nombre: '', apellido: '' },
        modulo: row.modulos
          ? {
              id: row.modulo_id,
              titulo: row.modulos.titulo,
              orden: row.modulos.orden,
              porcentaje_aprobacion: row.modulos.porcentaje_aprobacion ?? NOTA_MINIMA_APROBACION_DEFAULT,
            }
          : null,
        fecha: row.created_at,
        nota_automatica: Number(row.nota),
        revision_nota_final: row.revision_nota_final != null ? Number(row.revision_nota_final) : null,
        revision_estado: row.revision_estado,
        puntaje_total: 0,
        puntaje_obtenido_automatico: 0,
        puntaje_obtenido_sin_desarrollo: 0,
        puntaje_minimo_aprobacion: 0,
        preguntas_desarrollo: [] as Array<{
          pregunta_id: string;
          enunciado: string;
          puntaje_maximo: number;
          puntaje_automatico: number;
          respuesta_vendedor: string;
        }>,
      };
    }

    const { data: preguntas, error } = await supabase
      .from('preguntas')
      .select('id, enunciado, respuesta_correcta, tipo, puntaje')
      .in('id', preguntaIds)
      .eq('modulo_id', row.modulo_id);

    if (error) throw new AppError('Error al cargar preguntas del intento', 500);

    const preguntasMeta: PreguntaCalificable[] = (preguntas || []).map((p) => ({
      id: p.id as string,
      tipo: normalizarTipoPregunta(p.tipo),
      puntaje: Number(p.puntaje ?? 1),
      respuesta_correcta: String(p.respuesta_correcta || ''),
    }));

    let puntajeTotal = 0;
    let puntajeAutomatico = 0;
    let puntajeSinDesarrollo = 0;
    const preguntasDesarrollo: Array<{
      pregunta_id: string;
      enunciado: string;
      puntaje_maximo: number;
      puntaje_automatico: number;
      respuesta_vendedor: string;
    }> = [];

    for (const p of preguntasMeta) {
      const respuesta = String(respuestas[p.id] || '');
      const puntosAuto = puntosPreguntaAutomaticos(p, respuesta);
      puntajeTotal += p.puntaje;
      puntajeAutomatico += puntosAuto;

      if (p.tipo === 'desarrollo') {
        const preguntaRow = (preguntas || []).find((x) => x.id === p.id);
        preguntasDesarrollo.push({
          pregunta_id: p.id,
          enunciado: String(preguntaRow?.enunciado || ''),
          puntaje_maximo: p.puntaje,
          puntaje_automatico: puntosAuto,
          respuesta_vendedor: respuesta,
        });
      } else {
        puntajeSinDesarrollo += puntosAuto;
      }
    }

    const porcentajeAprobacion =
      row.modulos?.porcentaje_aprobacion ?? NOTA_MINIMA_APROBACION_DEFAULT;
    const puntajeMinimo = Number(((puntajeTotal * porcentajeAprobacion) / 100).toFixed(2));

    return {
      id: row.id,
      vendedor: row.users
        ? { nombre: row.users.nombre, apellido: row.users.apellido }
        : { nombre: '', apellido: '' },
      modulo: row.modulos
        ? {
            id: row.modulo_id,
            titulo: row.modulos.titulo,
            orden: row.modulos.orden,
            porcentaje_aprobacion: porcentajeAprobacion,
          }
        : null,
      fecha: row.created_at,
      nota_automatica: Number(row.nota),
      revision_nota_final: row.revision_nota_final != null ? Number(row.revision_nota_final) : null,
      revision_estado: row.revision_estado,
      revision_puntaje_ajustado: row.revision_puntaje_ajustado,
      puntaje_total: Number(puntajeTotal.toFixed(2)),
      puntaje_obtenido_automatico: Number(puntajeAutomatico.toFixed(2)),
      puntaje_obtenido_sin_desarrollo: Number(puntajeSinDesarrollo.toFixed(2)),
      puntaje_minimo_aprobacion: puntajeMinimo,
      preguntas_desarrollo: preguntasDesarrollo,
    };
  }

  async revisarIntento(
    adminId: string,
    intentoId: string,
    puntajePorPregunta: Record<string, number>,
  ) {
    const { data: intento, error } = await supabase
      .from('intentos_examen')
      .select('id, user_id, modulo_id, respuestas, nota, aprobado, revision_estado')
      .eq('id', intentoId)
      .maybeSingle();

    if (error || !intento) throw new AppError('Intento de examen no encontrado', 404);
    if (intento.revision_estado !== 'pendiente') {
      throw new AppError('Este intento no está pendiente de revisión', 400);
    }

    const respuestas = (intento.respuestas || {}) as Record<string, string>;
    const preguntaIds = Object.keys(respuestas);
    if (!preguntaIds.length) throw new AppError('El intento no tiene respuestas', 400);

    const [{ data: preguntas }, { data: modulo }] = await Promise.all([
      supabase
        .from('preguntas')
        .select('id, respuesta_correcta, tipo, puntaje')
        .in('id', preguntaIds)
        .eq('modulo_id', intento.modulo_id),
      supabase
        .from('modulos')
        .select('porcentaje_aprobacion')
        .eq('id', intento.modulo_id)
        .maybeSingle(),
    ]);

    if (!preguntas?.length) throw new AppError('No se encontraron preguntas del intento', 500);

    const preguntasMeta: PreguntaCalificable[] = preguntas.map((p) => ({
      id: p.id as string,
      tipo: normalizarTipoPregunta(p.tipo),
      puntaje: Number(p.puntaje ?? 1),
      respuesta_correcta: String(p.respuesta_correcta || ''),
    }));

    const desarrolloIds = preguntasMeta.filter((p) => p.tipo === 'desarrollo').map((p) => p.id);
    for (const pid of desarrolloIds) {
      if (puntajePorPregunta[pid] === undefined) {
        throw new AppError('Debés asignar puntaje a todas las preguntas de desarrollo', 400);
      }
    }

    let puntajeTotal = 0;
    let puntajeObtenido = 0;
    const revisionPuntajeAjustado: Record<string, number> = {};

    for (const p of preguntasMeta) {
      puntajeTotal += p.puntaje;
      const respuesta = String(respuestas[p.id] || '');

      if (p.tipo === 'desarrollo') {
        const manual = clampPuntaje(puntajePorPregunta[p.id], p.puntaje);
        revisionPuntajeAjustado[p.id] = manual;
        puntajeObtenido += manual;
      } else {
        puntajeObtenido += puntosPreguntaAutomaticos(p, respuesta);
      }
    }

    const porcentajeAprobacion = modulo?.porcentaje_aprobacion ?? NOTA_MINIMA_APROBACION_DEFAULT;
    const puntajeMinimo = Number(((puntajeTotal * porcentajeAprobacion) / 100).toFixed(2));
    const revisionNotaFinal = calcularNotaDesdePuntos(puntajeObtenido, puntajeTotal);
    const aprobado = puntajeObtenido >= puntajeMinimo;

    const { error: updErr } = await supabase
      .from('intentos_examen')
      .update({
        nota: revisionNotaFinal,
        aprobado,
        revision_estado: 'revisado',
        revision_admin_id: adminId,
        revision_puntaje_ajustado: revisionPuntajeAjustado,
        revision_nota_final: revisionNotaFinal,
      })
      .eq('id', intentoId);

    if (updErr) throw new AppError('Error al guardar la revisión', 500);

    const { siguienteModuloDesbloqueado } = await aplicarProgresoSiAprobado(
      intento.user_id,
      intento.modulo_id,
      revisionNotaFinal,
      aprobado,
    );

    return {
      mensaje: 'Revisión guardada correctamente',
      nota: revisionNotaFinal,
      aprobado,
      siguiente_modulo_desbloqueado: siguienteModuloDesbloqueado,
    };
  }

  /** Notifica admins cuando un intento queda pendiente de revisión manual. */
  async notificarAdminsRevisionPendiente(vendedorId: string, moduloId: string): Promise<void> {
    const [{ data: vendedor }, { data: modulo }] = await Promise.all([
      supabase.from('users').select('nombre, apellido').eq('id', vendedorId).maybeSingle(),
      supabase.from('modulos').select('titulo').eq('id', moduloId).maybeSingle(),
    ]);
    if (!vendedor || !modulo) return;

    const nombre = `${vendedor.nombre} ${vendedor.apellido}`.trim();
    const titulo = 'Revisión de examen pendiente';
    const mensaje = `${nombre} completó el examen de ${modulo.titulo} y tiene una respuesta de desarrollo para revisar.`;

    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('rol', 'admin')
      .eq('activo', true);

    if (!admins?.length) return;

    await supabase.from('notificaciones_admin').insert({
      tipo: 'revision_examen_pendiente',
      titulo,
      mensaje,
      user_id: vendedorId,
      modulo_id: moduloId,
      leida: false,
    });

    await sendPushToUserIds(
      admins.map((a) => a.id as string),
      titulo,
      mensaje,
    );
  }
}

export const examenesRevisionService = new ExamenesRevisionService();

/** Usado desde submitExamen para decidir revision_estado. */
export function evaluarRevisionEstadoDesarrollo(
  preguntas: PreguntaCalificable[],
  respuestas: Record<string, string>,
): RevisionEstado {
  let hayDesarrollo = false;
  for (const p of preguntas) {
    if (p.tipo !== 'desarrollo') continue;
    hayDesarrollo = true;
    const respuesta = String(respuestas[p.id] || '');
    const auto = puntuarDesarrollo(respuesta, p.respuesta_correcta, p.puntaje).puntaje;
    if (desarrolloRequiereRevision(auto, p.puntaje)) {
      return 'pendiente';
    }
  }
  return hayDesarrollo ? 'automatico' : 'automatico';
}
