/**
 * Validación de producto y monto según resultado de la atención.
 */

import { AppError } from '../middleware/errorHandler';

export function validarProductoMontoPorResultado(
  resultado: string,
  producto: unknown,
  monto: unknown
): { producto: string | null; monto: number | null } {
  const productoStr = typeof producto === 'string' ? producto.trim() : '';
  const montoRaw = monto !== undefined && monto !== null && monto !== '' ? Number(monto) : null;

  if (resultado === 'venta_cerrada') {
    if (!productoStr) {
      throw new AppError('El producto vendido es obligatorio cuando la atención es venta cerrada', 400);
    }
    if (montoRaw === null || Number.isNaN(montoRaw) || montoRaw <= 0) {
      throw new AppError('El monto es obligatorio y debe ser mayor a 0 en una venta cerrada', 400);
    }
    return { producto: productoStr, monto: montoRaw };
  }

  return {
    producto: productoStr || null,
    monto: montoRaw !== null && !Number.isNaN(montoRaw) && montoRaw > 0 ? montoRaw : null,
  };
}
