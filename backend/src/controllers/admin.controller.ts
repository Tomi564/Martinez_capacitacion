/**
 * admin.controller.ts — Manejo de requests HTTP del panel admin
 */

import { Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AdminController {
  /**
   * GET /api/admin/dashboard
   * Métricas globales del sistema
   */
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getDashboard();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/vendedores
   * Lista todos los vendedores con su progreso
   */
  async getVendedores(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getVendedores();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/vendedores
   * Crea un nuevo vendedor
   * Body: { nombre, apellido, email, password }
   */
  async crearVendedor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { nombre, apellido, email, password } = req.body;

      if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({
          error: 'Todos los campos son requeridos',
        });
      }

      const result = await adminService.crearVendedor({
        nombre,
        apellido,
        email,
        password,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/vendedores/:id
   * Actualiza un vendedor (activo/inactivo)
   */
  async updateVendedor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vendedorId = req.params.id as string;
      const { activo } = req.body;

      const result = await adminService.updateVendedor(vendedorId, { activo });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/modulos
   * Lista todos los módulos (activos e inactivos)
   */
  async getModulos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getModulos();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/modulos
   * Crea un nuevo módulo
   * Body: { titulo, descripcion, orden, duracion_min }
   */
  async crearModulo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { titulo, descripcion, orden, duracion_min } = req.body;

      if (!titulo || !descripcion || !orden) {
        return res.status(400).json({
          error: 'Título, descripción y orden son requeridos',
        });
      }

      const result = await adminService.crearModulo({
        titulo,
        descripcion,
        orden: Number(orden),
        duracion_min: Number(duracion_min) || 30,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/modulos/:id
   * Actualiza un módulo
   */
  async updateModulo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const moduloId = req.params.id as string;
      const data = req.body;

      const result = await adminService.updateModulo(moduloId, data);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/reportes
   * Reportes completos de progreso y calificaciones
   */
  async getReportes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getReportes();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/modulos/:id
   * Obtiene un módulo con todas sus preguntas
   */
  async getModuloById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const moduloId = req.params.id as string;
      const result = await adminService.getModuloById(moduloId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/modulos/:id/preguntas
   * Crea una nueva pregunta en el banco del módulo
   */
  async crearPregunta(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const moduloId = req.params.id as string;
      const { enunciado, opciones, respuesta_correcta } = req.body;

      if (!enunciado || !opciones || !respuesta_correcta) {
        return res.status(400).json({
          error: 'Enunciado, opciones y respuesta correcta son requeridos',
        });
      }

      const result = await adminService.crearPregunta(moduloId, {
        enunciado,
        opciones,
        respuesta_correcta,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/modulos/:id/preguntas/:preguntaId
   * Actualiza una pregunta (activo/inactivo)
   */
  async updatePregunta(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const preguntaId = req.params.preguntaId as string;
      const { activo } = req.body;

      const result = await adminService.updatePregunta(preguntaId, { activo });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/vendedores/:id
   * Detalle completo de un vendedor
   */
  async getVendedorById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vendedorId = req.params.id as string;
      const result = await adminService.getVendedorById(vendedorId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/vendedores/:id
   */
  async eliminarVendedor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vendedorId = req.params.id as string;
      const result = await adminService.eliminarVendedor(vendedorId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/modulos/:id
   */
  async eliminarModulo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const moduloId = req.params.id as string;
      const result = await adminService.eliminarModulo(moduloId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();