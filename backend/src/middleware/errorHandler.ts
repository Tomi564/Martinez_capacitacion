/**
 * errorHandler.ts — Middleware global de manejo de errores
 *
 * Captura cualquier error que se pase con next(error) desde
 * cualquier ruta o middleware del sistema.
 *
 * Por qué centralizar los errores acá:
 *  - Un solo lugar para loggear errores en producción
 *  - Respuestas de error consistentes en toda la API
 *  - El frontend siempre recibe el mismo formato { error: string }
 *  - En producción nunca se expone el stack trace al cliente
 */

import { Request, Response, NextFunction } from 'express';

// Clase base para errores operacionales conocidos
// (errores que nosotros lanzamos intencionalmente, no bugs)
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';

    // Necesario para que instanceof funcione correctamente con TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Errores comunes pre-construidos para usar en controllers y services
export const Errors = {
  notFound: (resource = 'Recurso') =>
    new AppError(`${resource} no encontrado`, 404),

  unauthorized: (msg = 'No autorizado') =>
    new AppError(msg, 401),

  forbidden: (msg = 'No tenés permisos para esta acción') =>
    new AppError(msg, 403),

  badRequest: (msg: string) =>
    new AppError(msg, 400),

  internal: (msg = 'Error interno del servidor') =>
    new AppError(msg, 500),
};

// El middleware de error tiene 4 parámetros — Express lo detecta por eso
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Error operacional conocido (lanzado por nosotros)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Error inesperado (bug, error de Supabase, etc.)
  // Loggeamos el detalle completo en el servidor
  console.error('❌ Error inesperado:', err);

  // Al cliente solo le mandamos un mensaje genérico
  // nunca el stack trace en producción
  return res.status(500).json({
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Error interno del servidor',
  });
};