/**
 * Patentes AR: se guardan y comparan en forma canónica (mayúsculas, solo A–Z y 0–9).
 * El usuario puede escribir con espacios o sin ellos; antes de API y al mostrar datos
 * se normaliza o se formatea para lectura Mercosur cuando aplica.
 */

export function normalizePatenteAr(raw: string): string {
  if (!raw) return '';
  return raw
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** Formato legible: Mercosur AA 123 BB o formato viejo AAA 123. */
export function formatPatenteArDisplay(canonical: string): string {
  const n = normalizePatenteAr(canonical);
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(n)) {
    return `${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)}`;
  }
  if (/^[A-Z]{3}\d{3}$/.test(n)) {
    return `${n.slice(0, 3)} ${n.slice(3, 6)}`;
  }
  return n;
}
