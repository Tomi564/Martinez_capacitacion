/**
 * progreso.service.ts — Lógica de niveles y gamificación
 *
 * Calcula el nivel actual del vendedor según su progreso
 * y el historial de calificaciones QR.
 *
 * Niveles:
 *  Aprendiz    → aprobó módulos 1 a 3
 *  Vendedor    → aprobó módulos 1 a 6 con promedio ≥80%
 *  Profesional → aprobó los 10 módulos
 *  Élite       → Profesional + calificación QR ≥4.5 por 3 meses consecutivos
 */

import { supabase } from '../config/database';

export type NivelVendedor = 'sin_inicio' | 'aprendiz' | 'vendedor' | 'profesional' | 'elite';

export interface InfoNivel {
  nivel: NivelVendedor;
  label: string;
  descripcion: string;
  color: string;
  modulosRequeridos: number;
  modulosAprobados: number;
  progresoPorcentaje: number;
  siguienteNivel: string | null;
  requisiteSiguiente: string | null;
}

export class ProgresoService {
  /**
   * Calcula el nivel actual del vendedor.
   */
  async getNivel(userId: string): Promise<InfoNivel> {
    // Obtener progreso (incluye estados históricos que pudieron quedar inconsistentes)
    const { data: progresos } = await supabase
      .from('progreso')
      .select(`
        estado,
        mejor_nota,
        completado_at,
        modulo_id,
        modulos (orden)
      `)
      .eq('user_id', userId);

    const { data: intentosAprobados } = await supabase
      .from('intentos_examen')
      .select('modulo_id')
      .eq('user_id', userId)
      .eq('aprobado', true);
    const modulosConIntentoAprobado = new Set((intentosAprobados || []).map((i: any) => i.modulo_id));

    const aprobados = (progresos || [])
      .filter((p: any) => p.estado === 'aprobado' || !!p.completado_at || modulosConIntentoAprobado.has(p.modulo_id))
      .map((p: any) => ({
      orden: p.modulos?.orden || 0,
      nota: p.mejor_nota || 0,
      }));

    const totalAprobados = aprobados.length;

    // Obtener total de módulos activos
    const { data: modulos } = await supabase
      .from('modulos')
      .select('id')
      .eq('activo', true);

    const totalModulos = modulos?.length || 10;

    // Verificar aprobación por rangos
    const aproboPrimeros3 = aprobados.filter(m => m.orden <= 3).length === 3;
    const aproboPrimeros6 = aprobados.filter(m => m.orden <= 6).length === 6;
    const aproboTodos = totalAprobados >= totalModulos;

    // Promedio de notas de módulos 1-6
    const notas16 = aprobados.filter(m => m.orden <= 6).map(m => m.nota);
    const promedio16 = notas16.length > 0
      ? notas16.reduce((a, b) => a + b, 0) / notas16.length
      : 0;

    // Verificar élite: calificación QR ≥4.5 por 3 meses consecutivos
    const esElite = await this.verificarElite(userId);

    // Determinar nivel
    let nivel: NivelVendedor = 'sin_inicio';
    if (esElite) nivel = 'elite';
    else if (aproboTodos) nivel = 'profesional';
    else if (aproboPrimeros6 && promedio16 >= 80) nivel = 'vendedor';
    else if (aproboPrimeros3) nivel = 'aprendiz';

    return this.buildInfoNivel(nivel, totalAprobados, totalModulos);
  }

  /**
   * Verifica si el vendedor califica como Élite.
   * Requiere calificación QR promedio ≥4.5 durante 3 meses consecutivos
   * y haber completado todos los módulos.
   */
  private async verificarElite(userId: string): Promise<boolean> {
    // Primero verificar que completó todos los módulos
    const { data: modulos } = await supabase
      .from('modulos')
      .select('id')
      .eq('activo', true);

    const { data: aprobados } = await supabase
      .from('progreso')
      .select('id')
      .eq('user_id', userId)
      .eq('estado', 'aprobado');

    if ((aprobados?.length || 0) < (modulos?.length || 10)) return false;

    // Verificar calificaciones de los últimos 3 meses
    const hace3Meses = new Date();
    hace3Meses.setMonth(hace3Meses.getMonth() - 3);

    const { data: calificaciones } = await supabase
      .from('calificaciones_qr')
      .select('estrellas, created_at')
      .eq('vendedor_id', userId)
      .gte('created_at', hace3Meses.toISOString())
      .order('created_at', { ascending: true });

    if (!calificaciones || calificaciones.length < 10) return false;

    // Verificar promedio por cada uno de los 3 meses
    const mesesConBuenPromedio = [0, 1, 2].filter(mesesAtras => {
      const inicio = new Date();
      inicio.setMonth(inicio.getMonth() - mesesAtras - 1);
      const fin = new Date();
      fin.setMonth(fin.getMonth() - mesesAtras);

      const calsMes = calificaciones.filter(c => {
        const fecha = new Date(c.created_at);
        return fecha >= inicio && fecha < fin;
      });

      if (calsMes.length === 0) return false;

      const promedio = calsMes.reduce((a, c) => a + c.estrellas, 0) / calsMes.length;
      return promedio >= 4.5;
    });

    return mesesConBuenPromedio.length === 3;
  }

  /**
   * Construye el objeto InfoNivel con labels y metadatos.
   */
  private buildInfoNivel(
    nivel: NivelVendedor,
    modulosAprobados: number,
    totalModulos: number
  ): InfoNivel {
    const configs: Record<NivelVendedor, Omit<InfoNivel, 'modulosAprobados' | 'progresoPorcentaje' | 'modulosRequeridos'>> = {
      sin_inicio: {
        nivel: 'sin_inicio',
        label: 'Sin inicio',
        descripcion: 'Todavía no completaste ningún módulo',
        color: 'gray',
        siguienteNivel: 'Aprendiz',
        requisiteSiguiente: 'Aprobá los primeros 3 módulos',
      },
      aprendiz: {
        nivel: 'aprendiz',
        label: 'Aprendiz',
        descripcion: 'Completaste los módulos base del programa',
        color: 'blue',
        siguienteNivel: 'Vendedor',
        requisiteSiguiente: 'Aprobá los módulos 4 al 6 con promedio ≥80%',
      },
      vendedor: {
        nivel: 'vendedor',
        label: 'Vendedor',
        descripcion: 'Dominás las técnicas de venta y el producto',
        color: 'amber',
        siguienteNivel: 'Profesional',
        requisiteSiguiente: 'Aprobá los 10 módulos del programa',
      },
      profesional: {
        nivel: 'profesional',
        label: 'Profesional',
        descripcion: 'Completaste el programa completo de capacitación',
        color: 'green',
        siguienteNivel: 'Élite',
        requisiteSiguiente: 'Mantené calificación ≥4.5/5 por 3 meses consecutivos',
      },
      elite: {
        nivel: 'elite',
        label: 'Élite ★',
        descripcion: 'Sos parte del equipo de alto rendimiento de Martínez',
        color: 'purple',
        siguienteNivel: null,
        requisiteSiguiente: null,
      },
    };

    const modulosRequeridos: Record<NivelVendedor, number> = {
      sin_inicio: 3,
      aprendiz: 6,
      vendedor: totalModulos,
      profesional: totalModulos,
      elite: totalModulos,
    };

    return {
      ...configs[nivel],
      modulosAprobados,
      modulosRequeridos: modulosRequeridos[nivel],
      progresoPorcentaje: totalModulos > 0
        ? Math.round((modulosAprobados / totalModulos) * 100)
        : 0,
    };
  }
}

export const progresoService = new ProgresoService();
