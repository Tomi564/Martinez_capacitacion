import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { preguntasDiariasService } from '../services/preguntas-diarias.service';

export class PreguntasDiariasController {
  async getEstado(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await preguntasDiariasService.getEstadoVendedor(userId);
      return res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  async responder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const preguntaId = req.params.preguntaId as string;
      const opcion_id = (req.body as { opcion_id?: string })?.opcion_id;
      const result = await preguntasDiariasService.responderVendedor(userId, preguntaId, opcion_id || '');
      return res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }
}

export const preguntasDiariasController = new PreguntasDiariasController();
