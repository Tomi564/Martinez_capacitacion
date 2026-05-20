/**
 * presupuesto-visita.controller.ts — Descarga PDF de presupuesto por visita
 */

import { Response, NextFunction } from 'express';
import { presupuestoVisitaService } from '../services/presupuesto-visita.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class PresupuestoVisitaController {
  async descargar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rawId = req.params.id;
      const visitaId = typeof rawId === 'string' ? rawId : rawId?.[0];
      if (!visitaId) {
        return res.status(400).json({ error: 'ID de visita inválido' });
      }

      const { buffer, filename } = await presupuestoVisitaService.generarPdfPorVisitaId(visitaId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export const presupuestoVisitaController = new PresupuestoVisitaController();
