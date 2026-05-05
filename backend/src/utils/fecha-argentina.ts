/**
 * Fecha calendario en America/Argentina/Buenos_Aires (YYYY-MM-DD).
 */

const TZ_AR = 'America/Argentina/Buenos_Aires';

export function fechaLocalArgentinaISO(reference: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_AR,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reference);

  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  if (!y || !m || !d) {
    throw new Error('fechaLocalArgentinaISO: formato inesperado');
  }
  return `${y}-${m}-${d}`;
}
