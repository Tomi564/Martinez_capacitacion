/**
 * Número destino para sugerencias por WhatsApp.
 * Formato esperado: código país + número, sin + ni espacios.
 * Ejemplo: 5493871234567
 */
export const WHATSAPP_SUGERENCIAS = (process.env.WHATSAPP_SUGERENCIAS || '').trim();

