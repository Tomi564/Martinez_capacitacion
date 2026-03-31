/**
 * auth.service.ts — Lógica de negocio de autenticación
 *
 * Por qué separar service de controller:
 *  - El controller solo maneja HTTP (request/response)
 *  - El service contiene la lógica pura, testeable sin HTTP
 *  - Si mañana agregamos autenticación por Google, reutilizamos el service
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Payload que se guarda dentro del JWT
// Debe ser mínimo — el JWT viaja en cada request
interface JWTPayload {
  id: string;
  email: string;
  rol: 'vendedor' | 'admin';
  nombre: string;
  apellido: string;
}

interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    rol: 'vendedor' | 'admin';
    nombre: string;
    apellido: string;
    avatar_url: string | null;
  };
}

export class AuthService {
  /**
   * Login de usuario con email y contraseña.
   * Retorna el JWT y los datos del usuario si las credenciales son correctas.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    // 1. Buscar el usuario por email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, rol, nombre, apellido, avatar_url, activo')
      .eq('email', email.toLowerCase().trim())
      .single();

    // Usamos el mismo mensaje para "no existe" y "contraseña incorrecta"
    // para no dar pistas sobre qué emails están registrados
    if (error || !user) {
      throw new AppError('Email o contraseña incorrectos', 401);
    }

    // 2. Verificar que la cuenta está activa
    if (!user.activo) {
      throw new AppError('Tu cuenta está desactivada. Contactá al administrador.', 403);
    }

    // 3. Comparar la contraseña con el hash guardado en la DB
    const passwordValida = await bcrypt.compare(password, user.password_hash);

    if (!passwordValida) {
      throw new AppError('Email o contraseña incorrectos', 401);
    }

    // 4. Generar el JWT con los datos mínimos necesarios
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      apellido: user.apellido,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        nombre: user.nombre,
        apellido: user.apellido,
        avatar_url: user.avatar_url,
      },
    };
  }

  /**
   * Retorna los datos del usuario autenticado.
   * Lo usa el endpoint GET /auth/me para que el frontend
   * pueda refrescar los datos del usuario sin re-loguear.
   */
  async getMe(userId: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, rol, nombre, apellido, avatar_url, activo, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return user;
  }

  /**
   * Hashea una contraseña en texto plano.
   * Se usa al crear usuarios desde el panel admin.
   * saltRounds = 12 es el balance recomendado entre seguridad y velocidad.
   */
  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 12);
  }
}

// Exportamos una instancia única (singleton)
// así no creamos una nueva instancia en cada request
export const authService = new AuthService();