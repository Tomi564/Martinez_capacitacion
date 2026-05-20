/**
 * Estimación aproximada de rango etario según número de DNI argentino.
 * Referencia histórica de asignación de números; no reemplaza fecha de nacimiento.
 */

export interface RangoEtarioEstimado {
  label: string;
  /** Clases Tailwind (fondo + texto) alineadas al sistema de badges */
  color: string;
}

function parseNumeroDni(dni: string): number | null {
  const digits = dni.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

export function estimarRangoEtario(dni: string): RangoEtarioEstimado | null {
  const n = parseNumeroDni(dni);
  if (n === null) return null;

  if (n <= 9_999_999) {
    return { label: 'Mayor de 55 años aprox', color: 'bg-gray-100 text-gray-600' };
  }
  if (n <= 19_999_999) {
    return { label: 'Entre 50 y 65 años aprox', color: 'bg-[#FDECEF] text-[#C8102E]' };
  }
  if (n <= 29_999_999) {
    return { label: 'Entre 40 y 50 años aprox', color: 'bg-gray-100 text-gray-700' };
  }
  if (n <= 39_999_999) {
    return { label: 'Entre 27 y 40 años aprox', color: 'bg-green-100 text-green-700' };
  }
  if (n <= 49_999_999) {
    return { label: 'Entre 15 y 27 años aprox', color: 'bg-amber-100 text-amber-700' };
  }
  return { label: 'Menor de 15 años aprox', color: 'bg-red-100 text-red-700' };
}
