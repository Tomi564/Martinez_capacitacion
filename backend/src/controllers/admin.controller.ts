/**
 * admin.controller.ts — Manejo de requests HTTP del panel admin
 */

import { Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AdminController {
  private escapeCsvCell(value: unknown): string {
    const str = value == null ? '' : String(value);
    return `"${str.replace(/"/g, '""')}"`;
  }

  private toCsv(headers: string[], rows: Array<Array<unknown>>): string {
    const lines = [
      headers.map((h) => this.escapeCsvCell(h)).join(','),
      ...rows.map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(',')),
    ];
    return `\uFEFF${lines.join('\n')}`;
  }

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
   * GET /api/admin/auditoria
   * Historial de acciones en el panel (filtros opcionales por query).
   */
  async getAuditoria(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const desde = (req.query.desde as string) || '';
      const hasta = (req.query.hasta as string) || '';
      const rol = (req.query.rol as string) || '';
      const accion = (req.query.accion as string) || '';
      const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const result = await adminService.listAuditoriaOperacional({
        desde,
        hasta,
        rol,
        accion,
        limit,
        offset,
      });
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

      const result = await adminService.updateVendedor(vendedorId, { activo }, {
        id: req.user!.id,
        rol: req.user!.rol,
      });
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
      const { titulo, descripcion, duracion_min, activo, video_url, pdf_url, nota_aprobacion, porcentaje_aprobacion } = req.body;

      const data: Record<string, unknown> = {};
      if (titulo !== undefined)                data.titulo                = titulo;
      if (descripcion !== undefined)           data.descripcion           = descripcion;
      if (duracion_min !== undefined)          data.duracion_min          = Number(duracion_min);
      if (activo !== undefined)                data.activo                = activo;
      if (video_url !== undefined)             data.video_url             = video_url;
      if (pdf_url !== undefined)               data.pdf_url               = pdf_url;
      if (nota_aprobacion !== undefined)       data.nota_aprobacion       = nota_aprobacion || null;
      if (porcentaje_aprobacion !== undefined) data.porcentaje_aprobacion = Number(porcentaje_aprobacion) || 80;

      const result = await adminService.updateModulo(moduloId, data, {
        id: req.user!.id,
        rol: req.user!.rol,
      });
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
   * GET /api/admin/reportes/csv?tipo=progreso|calificaciones
   * Exporta CSV listo para descargar.
   */
  async getReportesCsv(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tipo = String(req.query.tipo || 'progreso');
      if (tipo !== 'progreso' && tipo !== 'calificaciones') {
        return res.status(400).json({ error: 'tipo debe ser progreso o calificaciones' });
      }

      const result = await adminService.getReportes();
      const hoy = new Date().toISOString().split('T')[0];

      if (tipo === 'progreso') {
        const headers = [
          'Vendedor',
          'Email',
          'Modulos aprobados',
          'Total modulos',
          'Porcentaje',
          'Promedio notas',
          'Total intentos',
          'Ultima actividad',
        ];
        const rows = result.progreso.map((r) => [
          r.vendedor,
          r.email,
          r.modulosAprobados,
          r.totalModulos,
          `${r.porcentaje}%`,
          r.promedioNotas > 0 ? `${r.promedioNotas.toFixed(1)}%` : '—',
          r.totalIntentos,
          r.fechaUltimaActividad ? new Date(r.fechaUltimaActividad).toLocaleDateString('es-AR') : '—',
        ]);

        const csv = this.toCsv(headers, rows);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="reporte-progreso-${hoy}.csv"`);
        return res.status(200).send(csv);
      }

      const headers = [
        'Vendedor',
        'Email',
        'Promedio vendedor',
        'Promedio empresa',
        'Total calificaciones',
        'Vendedor 5',
        'Vendedor 4',
        'Vendedor 3',
        'Vendedor 2',
        'Vendedor 1',
        'Empresa 5',
        'Empresa 4',
        'Empresa 3',
        'Empresa 2',
        'Empresa 1',
      ];
      const rows = result.calificaciones.map((r) => [
        r.vendedor,
        r.email,
        r.promedioVendedor.toFixed(1),
        r.promedioEmpresa.toFixed(1),
        r.totalCalificaciones,
        r.vendedor5,
        r.vendedor4,
        r.vendedor3,
        r.vendedor2,
        r.vendedor1,
        r.empresa5,
        r.empresa4,
        r.empresa3,
        r.empresa2,
        r.empresa1,
      ]);
      const csv = this.toCsv(headers, rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-calificaciones-${hoy}.csv"`);
      return res.status(200).send(csv);
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
      const { enunciado, opciones, respuesta_correcta, explicacion, tipo, puntaje } = req.body;

      if (!enunciado || !opciones || !respuesta_correcta) {
        return res.status(400).json({
          error: 'Enunciado, opciones y respuesta correcta son requeridos',
        });
      }

      const result = await adminService.crearPregunta(moduloId, {
        enunciado,
        opciones,
        respuesta_correcta,
        explicacion,
        tipo,
        puntaje: puntaje != null ? Number(puntaje) : undefined,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/modulos/:id/preguntas/:preguntaId
   * Actualiza una pregunta
   */
  async updatePregunta(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const preguntaId = req.params.preguntaId as string;
      const {
        activo,
        enunciado,
        opciones,
        respuesta_correcta,
        explicacion,
        tipo,
        puntaje,
      } = req.body;

      const payload: Record<string, unknown> = {};
      if (activo !== undefined) payload.activo = activo;
      if (enunciado !== undefined) payload.enunciado = enunciado;
      if (opciones !== undefined) payload.opciones = opciones;
      if (respuesta_correcta !== undefined) payload.respuesta_correcta = respuesta_correcta;
      if (explicacion !== undefined) payload.explicacion = explicacion || null;
      if (tipo !== undefined) payload.tipo = tipo;
      if (puntaje !== undefined) payload.puntaje = Number(puntaje);

      const result = await adminService.updatePregunta(preguntaId, payload);
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
   * PATCH /api/admin/vendedores/:id/reset-password
   */
  async resetPasswordVendedor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vendedorId = req.params.id as string;
      const { nuevaContrasena } = req.body;

      if (!nuevaContrasena || nuevaContrasena.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const result = await adminService.resetPasswordVendedor(vendedorId, nuevaContrasena);
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
      const result = await adminService.eliminarVendedor(vendedorId, {
        id: req.user!.id,
        rol: req.user!.rol,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/vendedores/:id/reset-progreso
   */
  async resetProgresoVendedor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vendedorId = req.params.id as string;
      const result = await adminService.resetProgresoVendedor(vendedorId);
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