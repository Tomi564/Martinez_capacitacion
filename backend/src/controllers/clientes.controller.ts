/**
 * clientes.controller.ts — Sugerencias y listados de clientes
 */

import { Response, NextFunction } from 'express';
import { clientesService } from '../services/clientes.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class ClientesController {
  /**
   * GET /api/clientes/sugerencias?q=
   */
  async sugerencias(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || '';
      const result = await clientesService.buscarSugerencias(q);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clientes/ventas
   * Admin: todos los vendedores. Vendedor: solo las propias.
   */
  async ventas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const vendedorId = user.rol === 'vendedor' ? user.id : undefined;
      const result = await clientesService.listarClientesVentas(vendedorId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const clientesController = new ClientesController();
