/**
 * modulos.service.ts — Lógica de negocio de módulos
 *
 * Responsabilidades:
 *  - Obtener módulos con el estado de progreso del vendedor
 *  - Obtener detalle de un módulo específico
 *  - Inicializar el progreso cuando se crea un usuario nuevo
 */

import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class ModulosService {
  private async ensureProgresoRows(userId: string, modulos: Array<{ id: string; orden: number }>) {
    const { data: progresos, error: progresoError } = await supabase
      .from('progreso')
      .select('modulo_id')
      .eq('user_id', userId);

    if (progresoError) throw new AppError('Error al obtener el progreso', 500);

    const existentes = new Set((progresos || []).map((p) => p.modulo_id));
    const faltantes = modulos.filter((m) => !existentes.has(m.id));
    if (faltantes.length === 0) return;

    const registros = faltantes.map((m) => ({
      user_id: userId,
      modulo_id: m.id,
      estado: m.orden === 1 ? 'disponible' : 'bloqueado',
      intentos: 0,
      mejor_nota: 0,
    }));

    const { error: insertError } = await supabase.from('progreso').insert(registros);
    if (insertError) throw new AppError('Error al inicializar progreso faltante', 500);
  }

  /**
   * Obtiene todos los módulos activos con el estado de progreso
   * del vendedor autenticado.
   *
   * Si el vendedor no tiene registro de progreso para un módulo
   * (caso raro), lo trata como bloqueado.
   */
  async getModulosConProgreso(userId: string) {
    // 1. Obtener todos los módulos activos ordenados
    const { data: modulos, error: modulosError } = await supabase
      .from('modulos')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (modulosError) {
      throw new AppError('Error al obtener los módulos', 500);
    }

    if (!modulos?.length) return { modulos: [] };

    // Autorrepara vendedores históricos que no tengan filas en progreso
    // o que tengan filas faltantes por módulos nuevos.
    await this.ensureProgresoRows(
      userId,
      modulos.map((m) => ({ id: m.id, orden: m.orden }))
    );

    // 2. Obtener el progreso del vendedor para todos los módulos
    const { data: progresos, error: progresoError } = await supabase
      .from('progreso')
      .select('*')
      .eq('user_id', userId);

    if (progresoError) {
      throw new AppError('Error al obtener el progreso', 500);
    }

    // 3. Crear mapa de progreso por modulo_id para lookup O(1)
    const progresoMap = new Map((progresos || []).map((p) => [p.modulo_id, p]));

    // 3.b Reparar inconsistencias históricas:
    // si existe intento aprobado pero el progreso no está en "aprobado".
    const moduloIds = modulos.map((m) => m.id);
    const { data: intentosAprobados, error: intentosErr } = await supabase
      .from('intentos_examen')
      .select('modulo_id, nota')
      .eq('user_id', userId)
      .eq('aprobado', true)
      .in('modulo_id', moduloIds);
    if (intentosErr) throw new AppError('Error al verificar intentos aprobados', 500);

    const mejorNotaAprobada = new Map<string, number>();
    for (const intento of intentosAprobados || []) {
      const actual = mejorNotaAprobada.get(intento.modulo_id) || 0;
      const nota = Number(intento.nota || 0);
      if (nota > actual) mejorNotaAprobada.set(intento.modulo_id, nota);
    }

    for (const [moduloId, notaAprobada] of mejorNotaAprobada.entries()) {
      const progreso = progresoMap.get(moduloId);
      if (!progreso) continue;
      if (progreso.estado === 'aprobado') continue;

      const patch = {
        estado: 'aprobado',
        completado_at: progreso.completado_at || new Date().toISOString(),
        mejor_nota: Math.max(Number(progreso.mejor_nota || 0), notaAprobada),
      };
      const { error: syncErr } = await supabase
        .from('progreso')
        .update(patch)
        .eq('user_id', userId)
        .eq('modulo_id', moduloId);
      if (syncErr) throw new AppError('Error al sincronizar progreso aprobado', 500);

      progresoMap.set(moduloId, { ...progreso, ...patch });
    }

    // 4. Combinar módulos con su progreso
    const modulosConProgreso = modulos.map((modulo) => {
      const progreso = progresoMap.get(modulo.id);
      return {
        ...modulo,
        estado: progreso?.estado || 'bloqueado',
        mejor_nota: progreso?.mejor_nota || null,
        intentos: progreso?.intentos || 0,
        completado_at: progreso?.completado_at || null,
      };
    });

    return { modulos: modulosConProgreso };
  }

  /**
   * Obtiene el detalle de un módulo específico con el progreso
   * del vendedor autenticado.
   */
  async getModuloById(moduloId: string, userId: string) {
    // Obtener módulo
    const { data: modulo, error: moduloError } = await supabase
      .from('modulos')
      .select('*')
      .eq('id', moduloId)
      .eq('activo', true)
      .single();

    if (moduloError || !modulo) {
      throw new AppError('Módulo no encontrado', 404);
    }

    // Obtener progreso del vendedor para este módulo
    const { data: progreso } = await supabase
      .from('progreso')
      .select('*')
      .eq('user_id', userId)
      .eq('modulo_id', moduloId)
      .single();

    let progresoFinal = progreso;
    if (progreso && progreso.estado !== 'aprobado') {
      const { data: intentoAprobado } = await supabase
        .from('intentos_examen')
        .select('nota')
        .eq('user_id', userId)
        .eq('modulo_id', moduloId)
        .eq('aprobado', true)
        .order('nota', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (intentoAprobado) {
        const patch = {
          estado: 'aprobado',
          completado_at: progreso.completado_at || new Date().toISOString(),
          mejor_nota: Math.max(Number(progreso.mejor_nota || 0), Number(intentoAprobado.nota || 0)),
        };
        await supabase.from('progreso').update(patch).eq('user_id', userId).eq('modulo_id', moduloId);
        progresoFinal = { ...progreso, ...patch };
      }
    }

    return {
      modulo: {
        ...modulo,
        estado: progresoFinal?.estado || 'bloqueado',
        mejor_nota: progresoFinal?.mejor_nota || null,
        intentos: progresoFinal?.intentos || 0,
        completado_at: progresoFinal?.completado_at || null,
      },
    };
  }

  /**
   * Inicializa el progreso de un vendedor para todos los módulos.
   * Se llama cuando se crea un usuario nuevo.
   *
   * Regla: el primer módulo empieza como 'disponible',
   * el resto como 'bloqueado'.
   */
  async inicializarProgreso(userId: string) {
    // Obtener todos los módulos activos
    const { data: modulos, error } = await supabase
      .from('modulos')
      .select('id, orden')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw new Error('Error al obtener módulos para inicializar progreso');
    if (!modulos?.length) return;

    // Crear registros de progreso
    const registros = modulos.map((modulo) => ({
      user_id: userId,
      modulo_id: modulo.id,
      estado: modulo.orden === 1 ? 'disponible' : 'bloqueado',
      intentos: 0,
      mejor_nota: 0,
    }));

    const { error: insertError } = await supabase
      .from('progreso')
      .insert(registros);

    if (insertError) throw new Error('Error al inicializar progreso del vendedor');
  }
}

export const modulosService = new ModulosService();