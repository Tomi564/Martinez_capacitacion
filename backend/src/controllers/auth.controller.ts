/**
 * auth.controller.ts — Manejo de requests HTTP de autenticación
 *
 * El controller es delgado a propósito:
 *  1. Valida que el request tenga los datos necesarios
 *  2. Llama al service con esos datos
 *  3. Responde con el resultado
 *
 * Toda la lógica de negocio vive en auth.service.ts
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  /**
   * POST /api/auth/login
   * Body: { email: string, password: string }
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Validación básica de campos requeridos
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email y contraseña son requeridos',
        });
      }

      // Validación básica de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'El formato del email no es válido',
        });
      }

      // Delegar la lógica al service
      const result = await authService.login(email, password);

      return res.status(200).json(result);
    } catch (error) {
      // Pasar el error al errorHandler global
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Header: Authorization: Bearer <token>
   * Retorna los datos actualizados del usuario autenticado
   */
  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // req.user fue adjuntado por authMiddleware
      const userId = req.user!.id;

      const user = await authService.getMe(userId);

      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * El logout en JWT es stateless — el token expira solo.
   * Este endpoint existe para que el frontend tenga un lugar
   * donde llamar y poder limpiar su estado local de forma ordenada.
   * En el futuro se puede agregar una blacklist de tokens acá.
   */
  async logout(_req: Request, res: Response) {
    return res.status(200).json({
      message: 'Sesión cerrada correctamente',
    });
  }
}

// Instancia única del controller
export const authController = new AuthController();