/**
 * Validación de datos de cliente (atenciones).
 */

import { AppError } from '../middleware/errorHandler';
import type { ClienteInput } from '../services/clientes.service';

export interface ClienteDatosValidados {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string | null;
}

/** Formato básico: local@dominio.tld, sin espacios. */
const EMAIL_FORMATO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailClienteEsValido(email: string): boolean {
  if (/\s/.test(email) || email.includes('..')) {
    return false;
  }
  return EMAIL_FORMATO_REGEX.test(email);
}

export function validarDatosCliente(input: ClienteInput): ClienteDatosValidados {
  const nombre = input.nombre?.trim() || '';
  const apellido = input.apellido?.trim() || '';
  const telefono = input.telefono?.trim() || '';
  const email = input.email?.trim() || '';

  if (!nombre || !apellido || !telefono) {
    throw new AppError('Nombre, apellido y teléfono del cliente son obligatorios', 400);
  }

  if (email && !emailClienteEsValido(email)) {
    throw new AppError('El mail del cliente no es válido', 400);
  }

  return { nombre, apellido, telefono, email: email || null };
}
