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
      const { estrellasVendedor, estrellasEmpresa, comentario, nombre, apellido, dni, contacto } = req.body;

      if (!estrellasVendedor || !estrellasEmpresa) {
        return res.status(400).json({
          error: 'Las dos valoraciones son requeridas',
        });
      }

      // Obtener IP del cliente para anti-spam
      const ipCliente =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket.remoteAddress ||
        'unknown';

      const participante = (nombre && apellido && dni && contacto)
        ? { nombre, apellido, dni, contacto }
        : undefined;

      const result = await qrService.guardarCalificacion(
        codigo,
        Number(estrellasVendedor),
        Number(estrellasEmpresa),
        comentario || null,
        ipCliente,
        participante
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

  /**
   * GET /api/qr/participantes
   * Lista de participantes del sorteo — solo admin
   */
  async getParticipantes(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;
      const result = await qrService.getParticipantesSorteo(limit, offset);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const qrController = new QRController();