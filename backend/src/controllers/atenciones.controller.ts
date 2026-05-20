/**
 * atenciones.controller.ts — Manejo de requests HTTP de atenciones
 */

import { Response, NextFunction } from 'express';
import { atencionesService } from '../services/atenciones.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { validarDatosCliente } from '../utils/validarCliente';
import { validarProductoMontoPorResultado } from '../utils/validarAtencion';
import { mensajeResultadoInvalido, validarResultadoAtencion } from '../constants/atenciones';

function parseClienteBody(body: Record<string, unknown>) {
  const cliente = validarDatosCliente({
    nombre: body.cliente_nombre as string | undefined,
    apellido: body.cliente_apellido as string | undefined,
    telefono: body.cliente_telefono as string | undefined,
    email: body.cliente_email as string | undefined,
  });

  return {
    cliente_id: (body.cliente_id as string) || null,
    participante_qr_id: (body.participante_qr_id as string) || null,
    cliente,
  };
}

export class AtencionesController {
  /**
   * POST /api/atenciones
   */
  async crear(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { canal, resultado, producto, monto, observaciones } = req.body;

      if (!canal || !resultado) {
        return res.status(400).json({
          error: 'Canal y resultado son requeridos',
        });
      }

      const resultadoStr = String(resultado).trim();
      if (!validarResultadoAtencion(resultadoStr)) {
        return res.status(400).json({ error: mensajeResultadoInvalido(resultadoStr) });
      }

      const clienteFields = parseClienteBody(req.body);
      const { producto: productoVal, monto: montoVal } = validarProductoMontoPorResultado(
        resultadoStr,
        producto,
        monto
      );

      const result = await atencionesService.crear(userId, {
        canal,
        resultado: resultadoStr,
        producto: productoVal,
        monto: montoVal,
        observaciones,
        ...clienteFields,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/atenciones/:id
   */
  async actualizar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const rawId = req.params.id;
      const atencionId = typeof rawId === 'string' ? rawId : rawId?.[0];
      const { canal, resultado, producto, monto, observaciones } = req.body;

      if (!atencionId) {
        return res.status(400).json({ error: 'ID de atención inválido' });
      }

      if (!canal || !resultado) {
        return res.status(400).json({
          error: 'Canal y resultado son requeridos',
        });
      }

      const resultadoStr = String(resultado).trim();
      if (!validarResultadoAtencion(resultadoStr)) {
        return res.status(400).json({ error: mensajeResultadoInvalido(resultadoStr) });
      }

      const clienteFields = parseClienteBody(req.body);
      const { producto: productoVal, monto: montoVal } = validarProductoMontoPorResultado(
        resultadoStr,
        producto,
        monto
      );

      const result = await atencionesService.actualizar(userId, atencionId, {
        canal,
        resultado: resultadoStr,
        producto: productoVal,
        monto: montoVal,
        observaciones,
        ...clienteFields,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/atenciones/mias
   */
  async getMias(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await atencionesService.getMisAtenciones(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/atenciones/todas — solo admin
   */
  async getTodas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await atencionesService.getTodasAtenciones();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const atencionesController = new AtencionesController();
