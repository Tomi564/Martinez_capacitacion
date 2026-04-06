/**
 * productos.routes.ts — Búsqueda y gestión de stock/productos
 *
 * GET  /api/productos          — búsqueda (vendedor + admin)
 * POST /api/productos          — crear producto (admin)
 * PATCH /api/productos/:id     — editar producto (admin)
 * DELETE /api/productos/:id    — desactivar producto (admin)
 * POST /api/productos/bulk     — carga masiva CSV (admin)
 */

import { Router } from 'express';
import { supabase } from '../config/database';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// ─── Búsqueda — vendedor + admin ────────────────────────────────────────────

// GET /api/productos?q=pirelli
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q as string || '').trim();

    let query = supabase
      .from('productos')
      .select('id, nombre, marca, descripcion, codigo, precio, stock')
      .eq('activo', true)
      .order('marca', { ascending: true })
      .order('nombre', { ascending: true })
      .limit(50);

    if (q) {
      query = query.or(`nombre.ilike.%${q}%,marca.ilike.%${q}%,codigo.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error('Error al buscar productos');

    return res.status(200).json({ productos: data || [] });
  } catch (error) {
    next(error);
  }
});

// ─── Gestión — solo admin ────────────────────────────────────────────────────

// POST /api/productos
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { nombre, marca, descripcion, codigo, precio, stock } = req.body;

    if (!nombre || !marca) {
      return res.status(400).json({ error: 'Nombre y marca son requeridos' });
    }

    const { data, error } = await supabase
      .from('productos')
      .insert({
        nombre: nombre.trim(),
        marca: marca.trim(),
        descripcion: descripcion?.trim() || null,
        codigo: codigo?.trim() || null,
        precio: precio != null ? Number(precio) : null,
        stock: stock != null ? Number(stock) : 0,
        activo: true,
      })
      .select()
      .single();

    if (error) throw new Error('Error al crear el producto');

    return res.status(201).json({ producto: data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/productos/:id
router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, marca, descripcion, codigo, precio, stock } = req.body;

    const updates: Record<string, unknown> = {};
    if (nombre !== undefined)      updates.nombre      = nombre.trim();
    if (marca !== undefined)       updates.marca       = marca.trim();
    if (descripcion !== undefined) updates.descripcion = descripcion?.trim() || null;
    if (codigo !== undefined)      updates.codigo      = codigo?.trim() || null;
    if (precio !== undefined)      updates.precio      = precio != null ? Number(precio) : null;
    if (stock !== undefined)       updates.stock       = Number(stock);

    const { error } = await supabase
      .from('productos')
      .update(updates)
      .eq('id', id);

    if (error) throw new Error('Error al actualizar el producto');

    return res.status(200).json({ mensaje: 'Producto actualizado' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/productos/:id — soft delete
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw new Error('Error al eliminar el producto');

    return res.status(200).json({ mensaje: 'Producto eliminado' });
  } catch (error) {
    next(error);
  }
});

// POST /api/productos/bulk — carga masiva desde CSV
// Body: { csv: string } donde csv es el contenido del archivo
router.post('/bulk', requireRole('admin'), async (req, res, next) => {
  try {
    const { csv } = req.body as { csv: string };

    if (!csv) {
      return res.status(400).json({ error: 'No se recibió contenido CSV' });
    }

    const lineas = csv.split('\n').map(l => l.trim()).filter(Boolean);
    if (lineas.length < 2) {
      return res.status(400).json({ error: 'El archivo debe tener al menos una fila de datos además del encabezado' });
    }

    // Parsear CSV respetando campos entre comillas
    const parsearLinea = (linea: string): string[] => {
      const campos: string[] = [];
      let actual = '';
      let dentroComillas = false;

      for (let i = 0; i < linea.length; i++) {
        const c = linea[i];
        if (c === '"') {
          dentroComillas = !dentroComillas;
        } else if (c === ',' && !dentroComillas) {
          campos.push(actual.trim());
          actual = '';
        } else {
          actual += c;
        }
      }
      campos.push(actual.trim());
      return campos;
    };

    // Saltar encabezado
    const filas = lineas.slice(1);
    const productos = filas.map(linea => {
      const [nombre, marca, descripcion, codigo, precio, stock] = parsearLinea(linea);
      return {
        nombre:      nombre || '',
        marca:       marca  || '',
        descripcion: descripcion || null,
        codigo:      codigo || null,
        precio:      precio ? Number(precio) : null,
        stock:       stock  ? Number(stock)  : 0,
        activo:      true,
      };
    }).filter(p => p.nombre && p.marca);

    if (!productos.length) {
      return res.status(400).json({ error: 'No se encontraron filas válidas (nombre y marca son requeridos)' });
    }

    const { error } = await supabase.from('productos').insert(productos);

    if (error) throw new Error('Error al insertar productos');

    return res.status(201).json({
      mensaje: `${productos.length} producto${productos.length !== 1 ? 's' : ''} importado${productos.length !== 1 ? 's' : ''} correctamente`,
      importados: productos.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
