/** Canales alineados con atenciones_canal_check (migración 026). */
export const CANALES_ATENCION_VALIDOS = [
  'presencial',
  'whatsapp',
  'mercadolibre',
  'instagram',
  'otro',
  'telefono',
] as const;

export type CanalAtencion = (typeof CANALES_ATENCION_VALIDOS)[number];

export function validarCanalAtencion(canal: string): canal is CanalAtencion {
  return (CANALES_ATENCION_VALIDOS as readonly string[]).includes(canal);
}

export function mensajeCanalInvalido(canal: string): string {
  return `Canal "${canal}" no es válido. Opciones: ${CANALES_ATENCION_VALIDOS.join(', ')}.`;
}

/** Resultados alineados con check `resultado` en tabla atenciones. */
export const RESULTADOS_ATENCION_VALIDOS = [
  'venta_cerrada',
  'no_venta',
  'pendiente',
] as const;

export type ResultadoAtencion = (typeof RESULTADOS_ATENCION_VALIDOS)[number];

export function validarResultadoAtencion(resultado: string): resultado is ResultadoAtencion {
  return (RESULTADOS_ATENCION_VALIDOS as readonly string[]).includes(resultado);
}

export function mensajeResultadoInvalido(resultado: string): string {
  return `Resultado "${resultado}" no es válido. Usá uno de: ${RESULTADOS_ATENCION_VALIDOS.join(', ')}.`;
}
