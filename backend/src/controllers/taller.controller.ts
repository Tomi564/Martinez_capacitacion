/**
 * taller.controller.ts — QR y calificaciones del taller
 */

import { Request, Response, NextFunction } from 'express';
import { tallerQRService } from '../services/taller-qr.service';
import { parseSucursalQueryAdmin } from '../constants/sucursales';
import { AuthRequest } from '../middleware/auth.middleware';

function ipCliente(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

export class TallerController {
  async getMiQR(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const rol = req.user!.rol;
      const result = await tallerQRService.getOrCreateQR(userId, rol);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getEncuesta(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = req.params.codigo as string;
      const result = await tallerQRService.getEmpleadoPublico(codigo);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async calificar(req: Request, res: Response, next: NextFunction) {
    try {
      const { codigo, estrellas, comentario } = req.body as {
        codigo?: string;
        estrellas?: number;
        comentario?: string | null;
      };

      if (!codigo?.trim()) {
        return res.status(400).json({ error: 'El código QR es requerido' });
      }
      if (!estrellas) {
        return res.status(400).json({ error: 'La valoración es requerida' });
      }

      const result = await tallerQRService.guardarCalificacion(
        codigo.trim(),
        Number(estrellas),
        comentario ?? null,
        ipCliente(req),
      );

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMisCalificaciones(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await tallerQRService.getMisCalificaciones(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getReporteAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filtroSucursal = parseSucursalQueryAdmin(req.query.sucursal);
      const result = await tallerQRService.getReporteAdmin(filtroSucursal);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const tallerController = new TallerController();
