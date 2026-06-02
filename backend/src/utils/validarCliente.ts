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

export function validarDatosCliente(input: ClienteInput): ClienteDatosValidados {
  const nombre = input.nombre?.trim() || '';
  const apellido = input.apellido?.trim() || '';
  const telefono = input.telefono?.trim() || '';
  const email = input.email?.trim() || '';

  if (!nombre || !apellido || !telefono) {
    throw new AppError('Nombre, apellido y teléfono del cliente son obligatorios', 400);
  }

  if (email && (!email.includes('@') || !email.includes('.'))) {
    throw new AppError('El mail del cliente no es válido', 400);
  }

  return { nombre, apellido, telefono, email: email || null };
}
