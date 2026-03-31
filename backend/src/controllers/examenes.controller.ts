/**
 * examenes.controller.ts — Manejo de requests HTTP de exámenes
 */

import { Response, NextFunction } from 'express';
import { examenesService } from '../services/examenes.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class ExamenesController {
  /**
   * GET /api/examenes/:moduloId/preguntas
   * Retorna preguntas aleatorias para el examen — sin respuestas correctas
   */
  async getPreguntas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const moduloId = req.params.moduloId as string;

      const result = await examenesService.getPreguntasExamen(
        moduloId,
        userId
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/examenes/:moduloId/submit
   * Recibe las respuestas, calcula la nota y desbloquea el siguiente módulo si aprueba
   * Body: { respuestas: Record<string, string>, duracion_seg?: number }
   */
  async submitExamen(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const moduloId = req.params.moduloId as string;
      const { respuestas, duracion_seg } = req.body;

      // Validar que vengan respuestas
      if (!respuestas || typeof respuestas !== 'object') {
        return res.status(400).json({
          error: 'Las respuestas son requeridas',
        });
      }

      if (Object.keys(respuestas).length === 0) {
        return res.status(400).json({
          error: 'Debe responder al menos una pregunta',
        });
      }

      const result = await examenesService.submitExamen(
        userId,
        moduloId,
        respuestas,
        duracion_seg
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/examenes/:moduloId/historial
   * Retorna el historial de intentos del vendedor en un módulo
   */
  async getHistorial(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const moduloId = req.params.moduloId as string;

      const result = await examenesService.getHistorial(userId, moduloId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const examenesController = new ExamenesController();