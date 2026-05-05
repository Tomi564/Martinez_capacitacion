/**
 * Preguntas diarias post-capacitación (ventas + producto por día).
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { fechaLocalArgentinaISO } from '../utils/fecha-argentina';
import { modulosService } from './modulos.service';

export type CategoriaPreguntaDiaria = 'ventas' | 'producto';

export interface OpcionDiaria {
  id: string;
  texto: string;
}

function parseOpciones(raw: unknown): OpcionDiaria[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (o): o is OpcionDiaria =>
      !!o &&
      typeof o === 'object' &&
      typeof (o as OpcionDiaria).id === 'string' &&
      typeof (o as OpcionDiaria).texto === 'string'
  );
}

const MSJ_COMPLETADO =
  '✅ Ya respondiste las preguntas de hoy. ¡Volvé mañana!';

export class PreguntasDiariasService {
  private normalizeOpcionId(id: string): string {
    return String(id || '').trim().toLowerCase();
  }

  private opcionesContienenId(opciones: OpcionDiaria[], opcionId: string): boolean {
    const want = this.normalizeOpcionId(opcionId);
    return opciones.some((o) => this.normalizeOpcionId(o.id) === want);
  }

  private opcionCorrectaCoincide(stored: string, elegida: string): boolean {
    return this.normalizeOpcionId(stored) === this.normalizeOpcionId(elegida);
  }

  /** IDs activos por categoría (para sorteo). */
  private async idsActivosPorCategoria(cat: CategoriaPreguntaDiaria): Promise<string[]> {
    const { data, error } = await supabase
      .from('preguntas_diarias')
      .select('id')
      .eq('categoria', cat)
      .eq('activo', true);
    if (error) throw new AppError('Error al obtener preguntas diarias', 500);
    return (data || []).map((r) => r.id as string);
  }

  /** Obtiene o crea la asignación del día (desempata condición única con relectura). */
  private async obtenerOCrearAsignacion(userId: string, fecha: string) {
    const { data: existente } = await supabase
      .from('asignaciones_pregunta_diaria')
      .select('*')
      .eq('user_id', userId)
      .eq('fecha', fecha)
      .maybeSingle();

    if (existente) return existente;

    const ventasIds = await this.idsActivosPorCategoria('ventas');
    const productoIds = await this.idsActivosPorCategoria('producto');
    if (!ventasIds.length || !productoIds.length) {
      throw new AppError(
        'No hay preguntas diarias activas suficientes (necesitás al menos una de ventas y una de producto).',
        503
      );
    }

    const pv = ventasIds[Math.floor(Math.random() * ventasIds.length)];
    const pp = productoIds[Math.floor(Math.random() * productoIds.length)];

    const ins = await supabase
      .from('asignaciones_pregunta_diaria')
      .insert({
        user_id: userId,
        fecha,
        pregunta_ventas_id: pv,
        pregunta_producto_id: pp,
      })
      .select('*')
      .single();

    if (ins.error) {
      const code = (ins.error as { code?: string }).code;
      if (code === '23505') {
        const { data: retry } = await supabase
          .from('asignaciones_pregunta_diaria')
          .select('*')
          .eq('user_id', userId)
          .eq('fecha', fecha)
          .single();
        if (retry) return retry;
      }
      throw new AppError('Error al asignar preguntas del día', 500);
    }

    return ins.data;
  }

  async getEstadoVendedor(userId: string) {
    const ok = await modulosService.capacitacionCompleta(userId);
    if (!ok) {
      return { eligible: false as const };
    }

    const fecha = fechaLocalArgentinaISO();

    const { data: respuestasHoy, error: errResp } = await supabase
      .from('respuestas_pregunta_diaria')
      .select('pregunta_diaria_id, opcion_elegida, es_correcta')
      .eq('user_id', userId)
      .eq('fecha', fecha);

    if (errResp) throw new AppError('Error al leer respuestas del día', 500);

    const asignacion = await this.obtenerOCrearAsignacion(userId, fecha);
    const idsHoy = new Set([asignacion.pregunta_ventas_id, asignacion.pregunta_producto_id]);
    const respuestasDelPar = (respuestasHoy || []).filter((r) =>
      idsHoy.has(r.pregunta_diaria_id)
    );

    if (respuestasDelPar.length >= 2) {
      return {
        eligible: true as const,
        fecha,
        completado: true as const,
        mensaje: MSJ_COMPLETADO,
      };
    }

    const preguntaIds = [asignacion.pregunta_ventas_id, asignacion.pregunta_producto_id];
    const { data: preguntasRows, error: errP } = await supabase
      .from('preguntas_diarias')
      .select('*')
      .in('id', preguntaIds);
    if (errP || !preguntasRows?.length) {
      throw new AppError('Error al cargar preguntas asignadas', 500);
    }

    const mapPregunta = new Map(preguntasRows.map((p) => [p.id as string, p]));
    const respMap = new Map(
      (respuestasHoy || []).map((r) => [r.pregunta_diaria_id as string, r])
    );

    const armarItem = (pid: string, categoria: CategoriaPreguntaDiaria) => {
      const row = mapPregunta.get(pid);
      if (!row) {
        throw new AppError('Pregunta asignada no encontrada', 500);
      }
      const opciones = parseOpciones(row.opciones);
      const resp = respMap.get(pid);

      if (resp) {
        return {
          id: pid,
          categoria,
          enunciado: row.enunciado as string,
          opciones,
          estado: 'respondida' as const,
          feedback: {
            correcto: resp.es_correcta === true,
            opcionElegida: resp.opcion_elegida as string,
            respuestaCorrecta: row.respuesta_correcta as string,
            explicacion: (row.explicacion as string | null) ?? null,
          },
        };
      }

      return {
        id: pid,
        categoria,
        enunciado: row.enunciado as string,
        opciones,
        estado: 'pendiente' as const,
      };
    };

    const items = [
      armarItem(asignacion.pregunta_ventas_id, 'ventas'),
      armarItem(asignacion.pregunta_producto_id, 'producto'),
    ];

    return {
      eligible: true as const,
      fecha,
      completado: false as const,
      items,
    };
  }

  async responderVendedor(userId: string, preguntaId: string, opcionIdRaw: string) {
    const opcion_id = String(opcionIdRaw || '').trim();
    if (!opcion_id) throw new AppError('opcion_id es requerido', 400);

    const ok = await modulosService.capacitacionCompleta(userId);
    if (!ok) throw new AppError('No tenés acceso a las preguntas diarias', 403);

    const fecha = fechaLocalArgentinaISO();

    const asignacion = await this.obtenerOCrearAsignacion(userId, fecha);
    const permitidas = new Set([
      asignacion.pregunta_ventas_id,
      asignacion.pregunta_producto_id,
    ]);
    if (!permitidas.has(preguntaId)) {
      throw new AppError('Esta pregunta no corresponde a tu asignación de hoy', 403);
    }

    const { data: ya } = await supabase
      .from('respuestas_pregunta_diaria')
      .select('id')
      .eq('user_id', userId)
      .eq('pregunta_diaria_id', preguntaId)
      .eq('fecha', fecha)
      .maybeSingle();

    if (ya) throw new AppError('Ya respondiste esta pregunta hoy', 409);

    const { data: pregunta, error } = await supabase
      .from('preguntas_diarias')
      .select('*')
      .eq('id', preguntaId)
      .single();

    if (error || !pregunta) throw new AppError('Pregunta no encontrada', 404);
    if (!pregunta.activo) throw new AppError('La pregunta no está activa', 400);

    const opciones = parseOpciones(pregunta.opciones);
    if (!this.opcionesContienenId(opciones, opcion_id)) {
      throw new AppError('La opción elegida no es válida', 400);
    }

    const correcto = this.opcionCorrectaCoincide(
      String(pregunta.respuesta_correcta),
      opcion_id
    );

    const ins = await supabase.from('respuestas_pregunta_diaria').insert({
      user_id: userId,
      pregunta_diaria_id: preguntaId,
      fecha,
      opcion_elegida: opcion_id,
      es_correcta: correcto,
    });

    if (ins.error) {
      const code = (ins.error as { code?: string }).code;
      if (code === '23505') {
        throw new AppError('Ya respondiste esta pregunta hoy', 409);
      }
      throw new AppError('Error al guardar la respuesta', 500);
    }

    return {
      correcto,
      respuesta_correcta: String(pregunta.respuesta_correcta),
      explicacion: (pregunta.explicacion as string | null) ?? null,
    };
  }

  // ─── Admin ─────────────────────────────────────────────────

  async listPreguntasAdmin() {
    const { data, error } = await supabase
      .from('preguntas_diarias')
      .select('*')
      .order('categoria', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw new AppError('Error al listar preguntas diarias', 500);
    return { preguntas: data || [] };
  }

  async getPreguntaAdmin(id: string) {
    const { data, error } = await supabase
      .from('preguntas_diarias')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new AppError('Pregunta no encontrada', 404);
    return { pregunta: data };
  }

  async createPreguntaAdmin(body: {
    enunciado: string;
    categoria: CategoriaPreguntaDiaria;
    opciones: OpcionDiaria[];
    respuesta_correcta: string;
    explicacion?: string | null;
    activo?: boolean;
  }) {
    const enunciado = String(body.enunciado || '').trim();
    if (!enunciado) throw new AppError('Enunciado requerido', 400);
    if (body.categoria !== 'ventas' && body.categoria !== 'producto') {
      throw new AppError('Categoría inválida', 400);
    }
    const opciones = parseOpciones(body.opciones);
    if (opciones.length < 2) throw new AppError('Al menos 2 opciones', 400);
    const rc = String(body.respuesta_correcta || '').trim();
    if (!this.opcionesContienenId(opciones, rc)) {
      throw new AppError('respuesta_correcta debe coincidir con el id de una opción', 400);
    }

    const { data, error } = await supabase
      .from('preguntas_diarias')
      .insert({
        enunciado,
        categoria: body.categoria,
        opciones,
        respuesta_correcta: rc,
        explicacion: body.explicacion?.trim() || null,
        activo: body.activo !== false,
      })
      .select('*')
      .single();

    if (error) throw new AppError('Error al crear pregunta diaria', 500);
    return { pregunta: data };
  }

  async updatePreguntaAdmin(
    id: string,
    body: Partial<{
      enunciado: string;
      categoria: CategoriaPreguntaDiaria;
      opciones: OpcionDiaria[];
      respuesta_correcta: string;
      explicacion: string | null;
      activo: boolean;
    }>
  ) {
    const { data: actual, error: errAct } = await supabase
      .from('preguntas_diarias')
      .select('*')
      .eq('id', id)
      .single();
    if (errAct || !actual) throw new AppError('Pregunta no encontrada', 404);

    const enunciado =
      body.enunciado !== undefined ? String(body.enunciado).trim() : String(actual.enunciado || '');
    const categoria =
      body.categoria !== undefined ? body.categoria : (actual.categoria as CategoriaPreguntaDiaria);
    if (categoria !== 'ventas' && categoria !== 'producto') throw new AppError('Categoría inválida', 400);

    const opciones =
      body.opciones !== undefined ? parseOpciones(body.opciones) : parseOpciones(actual.opciones);
    const respuesta_correcta =
      body.respuesta_correcta !== undefined
        ? String(body.respuesta_correcta).trim()
        : String(actual.respuesta_correcta || '');
    const explicacion =
      body.explicacion !== undefined ? body.explicacion : (actual.explicacion as string | null);
    const activo = body.activo !== undefined ? body.activo : (actual.activo === true);

    if (!enunciado.trim()) throw new AppError('Enunciado requerido', 400);
    if (opciones.length < 2) throw new AppError('Al menos 2 opciones', 400);
    if (!this.opcionesContienenId(opciones, respuesta_correcta)) {
      throw new AppError('respuesta_correcta debe coincidir con el id de una opción', 400);
    }

    const { data, error } = await supabase
      .from('preguntas_diarias')
      .update({
        enunciado,
        categoria,
        opciones,
        respuesta_correcta,
        explicacion: explicacion ?? null,
        activo,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new AppError('Error al actualizar pregunta diaria', 500);
    return { pregunta: data };
  }

  async listRespuestasAdmin(q: {
    vendedor_id?: string;
    fecha?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    limit?: number;
    offset?: number;
  }) {
    const rawLimit = Number(q.limit);
    const rawOff = Number(q.offset);
    const limit = Math.max(1, Math.min(200, Number.isFinite(rawLimit) ? rawLimit : 50));
    const offset = Math.max(0, Number.isFinite(rawOff) ? rawOff : 0);

    let query = supabase
      .from('respuestas_pregunta_diaria')
      .select(
        `
        id,
        fecha,
        opcion_elegida,
        es_correcta,
        created_at,
        user_id,
        pregunta_diaria_id,
        users ( nombre, apellido, email ),
        preguntas_diarias ( enunciado, categoria )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (q.vendedor_id) query = query.eq('user_id', q.vendedor_id);
    if (q.fecha) query = query.eq('fecha', q.fecha);
    if (q.fecha_desde) query = query.gte('fecha', q.fecha_desde);
    if (q.fecha_hasta) query = query.lte('fecha', q.fecha_hasta);

    const { data, error, count } = await query;
    if (error) throw new AppError('Error al listar respuestas diarias', 500);

    return {
      respuestas: data || [],
      total: count ?? 0,
      limit,
      offset,
    };
  }
}

export const preguntasDiariasService = new PreguntasDiariasService();
