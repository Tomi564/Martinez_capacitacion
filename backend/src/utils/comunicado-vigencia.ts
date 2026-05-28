export const COMUNICADO_VIGENCIA_DIAS = 30;

/** ISO date: comunicados con created_at anterior no se consideran vigentes. */
export function limiteVigenciaComunicadoIso(): string {
  const limite = new Date();
  limite.setDate(limite.getDate() - COMUNICADO_VIGENCIA_DIAS);
  return limite.toISOString();
}

export function esComunicadoVigente(createdAt: string): boolean {
  return new Date(createdAt).getTime() >= new Date(limiteVigenciaComunicadoIso()).getTime();
}
