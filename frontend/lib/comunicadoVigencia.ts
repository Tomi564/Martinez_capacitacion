export const COMUNICADO_VIGENCIA_DIAS = 30;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function esComunicadoVigente(createdAt: string): boolean {
  const edad = Date.now() - new Date(createdAt).getTime();
  return edad <= COMUNICADO_VIGENCIA_DIAS * MS_POR_DIA;
}
