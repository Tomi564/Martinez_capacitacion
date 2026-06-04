/** Agregaciones de atenciones (equivalente a RPCs admin cuando hay filtro por sucursal). */

type AtencionVenta = {
  resultado: string;
  monto: number | null;
  created_at: string;
};

function inicioSemanaLunes(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function agregarVentasPorSemana(
  atenciones: AtencionVenta[],
  weeks = 8,
): { semana: string; ventas: number; monto: number }[] {
  const ventasCerradas = atenciones.filter((a) => a.resultado === 'venta_cerrada');
  const base = inicioSemanaLunes(new Date());
  const resultado: { semana: string; ventas: number; monto: number }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(base);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const enSemana = ventasCerradas.filter((a) => {
      const d = new Date(a.created_at);
      return d >= weekStart && d <= weekEnd;
    });

    resultado.push({
      semana: `${pad2(weekStart.getDate())}/${pad2(weekStart.getMonth() + 1)}`,
      ventas: enSemana.length,
      monto: enSemana.reduce((acc, a) => acc + (a.monto || 0), 0),
    });
  }

  return resultado;
}

export function agregarMontoPorMes(
  atenciones: AtencionVenta[],
  months = 6,
): { mes: string; monto: number; ventas: number }[] {
  const ventasCerradas = atenciones.filter((a) => a.resultado === 'venta_cerrada');
  const ahora = new Date();
  const resultado: { mes: string; monto: number; ventas: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

    const enMes = ventasCerradas.filter((a) => {
      const d = new Date(a.created_at);
      return d >= monthStart && d <= monthEnd;
    });

    resultado.push({
      mes: monthStart.toLocaleString('en-US', { month: 'short' }),
      monto: enMes.reduce((acc, a) => acc + (a.monto || 0), 0),
      ventas: enMes.length,
    });
  }

  return resultado;
}

/** Series vacías alineadas con las RPC (8 semanas / 6 meses). */
export function ventasPorSemanaVacias(weeks = 8) {
  return agregarVentasPorSemana([], weeks);
}

export function montoPorMesVacios(months = 6) {
  return agregarMontoPorMes([], months);
}
