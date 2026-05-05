import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { preguntasDiariasController } from '../controllers/preguntas-diarias.controller';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('vendedor'));

router.get('/estado', preguntasDiariasController.getEstado.bind(preguntasDiariasController));
router.post(
  '/:preguntaId/responder',
  preguntasDiariasController.responder.bind(preguntasDiariasController)
);

export default router;
