/**
 * qr.controller.ts — Manejo de requests HTTP del sistema QR
 */

import { Request, Response, NextFunction } from 'express';
import { qrService } from '../services/qr.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class QRController {
  /**
   * GET /api/qr/mio
   * Obtiene o crea el código QR del vendedor autenticado
   */
  async getMiQR(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await qrService.getOrCreateQR(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/qr/encuesta/:codigo
   * Datos públicos del vendedor para la encuesta — sin autenticación
   */
  async getEncuesta(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = req.params.codigo as string;
      const result = await qrService.getVendedorPublico(codigo);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/qr/calificar/:codigo
   * Guarda la calificación del cliente — sin autenticación
   * Body: { estrellas: number, comentario?: string }
   */
  async calificar(req: Request, res: Response, next: NextFunction) {
    try {
      const codigo = req.params.codigo as string;
      const { estrellas, comentario } = req.body;

      if (!estrellas) {
        return res.status(400).json({
          error: 'Las estrellas son requeridas',
        });
      }

      // Obtener IP del cliente para anti-spam
      const ipCliente =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket.remoteAddress ||
        'unknown';

      const result = await qrService.guardarCalificacion(
        codigo,
        Number(estrellas),
        comentario || null,
        ipCliente
      );

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/qr/mis-calificaciones
   * Resumen de calificaciones del vendedor autenticado
   */
  async getMisCalificaciones(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id;
      const result = await qrService.getMisCalificaciones(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const qrController = new QRController();