/** Misma regla que backend/src/utils/validarCliente.ts */
const EMAIL_FORMATO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailClienteEsValido(email: string): boolean {
  if (/\s/.test(email) || email.includes('..')) {
    return false;
  }
  return EMAIL_FORMATO_REGEX.test(email);
}
