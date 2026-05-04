/**
 * atenciones.controller.ts — Manejo de requests HTTP de atenciones
 */

import { Response, NextFunction } from 'express';
import { atencionesService } from '../services/atenciones.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AtencionesController {
  /**
   * POST /api/atenciones
   * Registra una nueva atención
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

      const result = await atencionesService.crear(userId, {
        canal,
        resultado,
        producto,
        monto: monto ? Number(monto) : undefined,
        observaciones,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/atenciones/:id
   * Edita una atención existente del vendedor
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

      const result = await atencionesService.actualizar(userId, atencionId, {
        canal,
        resultado,
        producto,
        monto: monto ? Number(monto) : undefined,
        observaciones,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/atenciones/mias
   * Historial y estadísticas del vendedor
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
   * GET /api/atenciones/todas
   * Todas las atenciones — solo admin
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
