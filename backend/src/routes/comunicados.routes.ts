/**
 * comunicados.routes.ts — Comunicados del admin hacia vendedores
 *
 * GET  /api/comunicados        — comunicado activo actual (vendedor + admin)
 */

import { Router } from 'express';
import { supabase } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// GET /api/comunicados — devuelve el comunicado activo más reciente
router.get('/', async (_req, res, next) => {
  try {
    const { data } = await supabase
      .from('comunicados')
      .select('id, titulo, contenido, created_at')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return res.status(200).json({ comunicado: data || null });
  } catch (error) {
    next(error);
  }
});

export default router;
