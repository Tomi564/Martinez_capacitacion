/**

 * auth.middleware.ts — Verificación de JWT y guards de roles

 *

 * Dos exports principales:

 *  - authMiddleware: verifica que el token JWT sea válido y agrega

 *    el usuario al objeto request para que los controllers lo usen

 *  - requireRole: factory que genera un middleware que verifica

 *    que el usuario tenga el rol necesario para acceder a la ruta

 *

 * Uso en rutas:

 *  router.get('/mi-ruta', authMiddleware, controller)

 *  router.get('/admin/ruta', authMiddleware, requireRole('admin'), controller)

 */



import { Request, Response, NextFunction } from 'express';

import jwt from 'jsonwebtoken';

import { supabase } from '../config/database';



// Extendemos el tipo Request de Express para agregar el usuario

// Esto permite acceder a req.user en cualquier controller con tipado correcto

export interface AuthRequest extends Request {

  user?: {

    id: string;

    email: string;

    rol: 'vendedor' | 'admin' | 'mecanico' | 'gomero';

    nombre: string;

    apellido: string;

    sucursal?: string | null;

  };

}



/**

 * Verifica el JWT del header Authorization.

 * Si es válido, adjunta el payload decodificado a req.user.

 * La sucursal se lee siempre desde la DB (el JWT puede estar desactualizado).

 */

export const authMiddleware = async (

  req: AuthRequest,

  res: Response,

  next: NextFunction,

) => {

  const authHeader = req.headers.authorization;



  if (!authHeader?.startsWith('Bearer ')) {

    return res.status(401).json({

      error: 'Token de acceso requerido',

    });

  }



  const token = authHeader.split(' ')[1];



  try {

    const decoded = jwt.verify(

      token,

      process.env.JWT_SECRET!,

    ) as NonNullable<AuthRequest['user']>;



    req.user = { ...decoded };



    const { data: row } = await supabase

      .from('users')

      .select('sucursal, rol')

      .eq('id', decoded.id)

      .maybeSingle();



    if (row) {

      req.user.sucursal =

        row.rol === 'admin' ? null : (row.sucursal as string | null) ?? null;

    }



    next();

  } catch (error) {

    if (error instanceof jwt.TokenExpiredError) {

      return res.status(401).json({ error: 'El token expiró. Iniciá sesión nuevamente.' });

    }



    if (error instanceof jwt.JsonWebTokenError) {

      return res.status(401).json({ error: 'Token inválido.' });

    }



    return res.status(401).json({ error: 'Error de autenticación.' });

  }

};



/**

 * Factory de middleware de roles.

 * Acepta uno o más roles válidos para la ruta.

 */

export const requireRole = (...roles: Array<'vendedor' | 'admin' | 'mecanico' | 'gomero'>) => {

  return (req: AuthRequest, res: Response, next: NextFunction) => {

    if (!req.user) {

      return res.status(401).json({ error: 'No autenticado.' });

    }



    if (!roles.includes(req.user.rol)) {

      return res.status(403).json({

        error: 'No tenés permisos para esta acción.',

      });

    }



    next();

  };

};


