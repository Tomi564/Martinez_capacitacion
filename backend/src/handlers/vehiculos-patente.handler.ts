import { Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { normalizePatenteAr } from '../utils/patente';
import type { AuthRequest } from '../middleware/auth.middleware';

export async function vehiculosSugerenciasHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const rawTrim = String(req.query.q || '').trim();
    if (rawTrim.length < 3 || !/[a-zA-Z0-9]/.test(rawTrim)) {
      return res.json({ vehiculos: [] });
    }

    const qTexto = rawTrim.toUpperCase();
    const qPatente = normalizePatenteAr(rawTrim);

    const orFilter =
      qPatente.length > 0
        ? `patente.ilike.%${qPatente}%,marca.ilike.%${qTexto}%,modelo.ilike.%${qTexto}%`
        : `marca.ilike.%${qTexto}%,modelo.ilike.%${qTexto}%`;

    const { data, error } = await supabase
      .from('vehiculos')
      .select(`id, patente, marca, modelo, anio, medida_rueda, clientes(id, nombre, apellido, telefono, email)`)
      .or(orFilter)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw new AppError('Error al buscar sugerencias de vehículos', 500);
    return res.json({ vehiculos: data || [] });
  } catch (e) {
    next(e);
  }
}

export async function vehiculosBuscarPatenteHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const param = req.params.patente;
    let rawPat = typeof param === 'string' ? param : Array.isArray(param) ? param[0] || '' : '';
    try {
      rawPat = decodeURIComponent(rawPat.replace(/\+/g, '%20'));
    } catch {
      /* vacío */
    }
    const patenteParam = normalizePatenteAr(rawPat);
    if (!patenteParam) throw new AppError('Patente vacía', 400);

    const { data, error } = await supabase
      .from('vehiculos')
      .select(`*, clientes(id, nombre, apellido, dni, telefono, email)`)
      .eq('patente', patenteParam)
      .maybeSingle();

    if (error) throw new AppError('Error al buscar', 500);
    return res.json({ vehiculo: data });
  } catch (e) {
    next(e);
  }
}
