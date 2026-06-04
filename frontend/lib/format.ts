/** Formato compacto de montos en ARS para KPIs y gráficos. */
export function formatMonto(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
  return `$${val.toLocaleString('es-AR')}`;
}
