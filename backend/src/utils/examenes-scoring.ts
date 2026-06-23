/**
 * Reglas de puntuación compartidas entre submit y revisión manual de exámenes.
 */

export type TipoPreguntaExamen = 'opcion_unica' | 'verdadero_falso' | 'caso_practico' | 'desarrollo';

export interface PreguntaCalificable {
  id: string;
  tipo: TipoPreguntaExamen;
  puntaje: number;
  respuesta_correcta: string;
}

export function normalizarTextoExamen(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function puntuarDesarrollo(
  respuesta: string,
  clave: string,
  puntajeMaximo: number,
): { puntaje: number; ratio: number } {
  const respuestaNorm = normalizarTextoExamen(respuesta);
  const keywords = clave
    .split('|')
    .map((k) => normalizarTextoExamen(k))
    .filter(Boolean);

  if (!keywords.length || !respuestaNorm) {
    return { puntaje: 0, ratio: 0 };
  }

  const hits = keywords.filter((k) => respuestaNorm.includes(k)).length;
  const ratio = hits / keywords.length;

  if (ratio >= 0.6) return { puntaje: puntajeMaximo, ratio };
  if (ratio >= 0.35) return { puntaje: Number((puntajeMaximo * 0.5).toFixed(2)), ratio };
  return { puntaje: 0, ratio: 0 };
}

/** true si la pregunta de desarrollo no alcanzó el 100% del puntaje (requiere revisión manual). */
export function desarrolloRequiereRevision(puntajeObtenido: number, puntajeMaximo: number): boolean {
  return puntajeObtenido < puntajeMaximo;
}

export function puntosPreguntaAutomaticos(
  pregunta: PreguntaCalificable,
  respuestaDada: string,
): number {
  if (pregunta.tipo === 'desarrollo') {
    return puntuarDesarrollo(
      respuestaDada,
      String(pregunta.respuesta_correcta || ''),
      pregunta.puntaje,
    ).puntaje;
  }
  return respuestaDada === pregunta.respuesta_correcta ? pregunta.puntaje : 0;
}

export function calcularNotaDesdePuntos(puntajeObtenido: number, puntajeTotal: number): number {
  if (puntajeTotal <= 0) return 0;
  return Number(((puntajeObtenido / puntajeTotal) * 100).toFixed(2));
}

export function normalizarTipoPregunta(tipo: unknown): TipoPreguntaExamen {
  const t = String(tipo || 'opcion_unica');
  if (
    t === 'verdadero_falso' ||
    t === 'caso_practico' ||
    t === 'desarrollo' ||
    t === 'opcion_unica'
  ) {
    return t;
  }
  return 'opcion_unica';
}
