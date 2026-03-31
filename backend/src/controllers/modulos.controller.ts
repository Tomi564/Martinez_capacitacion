/**
 * modulos.controller.ts — Manejo de requests HTTP de módulos
 */

import { Response, NextFunction } from 'express';
import { modulosService } from '../services/modulos.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class ModulosController {
  /**
   * GET /api/modulos
   * Retorna todos los módulos con el estado de progreso del vendedor
   */
  async getModulos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await modulosService.getModulosConProgreso(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/modulos/:id
   * Retorna el detalle de un módulo con el progreso del vendedor
   */
  async getModuloById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const result = await modulosService.getModuloById(id, userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const modulosController = new ModulosController();