/**
 * Misma regla que frontend/lib/patente.ts: canónica sin separadores.
 */

export function normalizePatenteAr(raw: string): string {
  if (!raw) return '';
  return raw
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}
