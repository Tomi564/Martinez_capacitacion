import { AppError } from '../middleware/errorHandler';

export const PSI_PER_BAR = 14.5037738;
/** Máximo de la columna visitas_taller.presion_psi (numeric 6,2). */
export const MAX_PRESION_PSI = 9999.99;
export const MIN_PRESION_BAR = 0.5;
export const MAX_PRESION_BAR = 10;
/** Por debajo de esto se interpreta el valor como BAR; arriba, como PSI (envío del frontend). */
const BAR_VS_PSI_THRESHOLD = 15;

export function presionPsiFromBarInput(barRaw: unknown): number | null {
  if (barRaw == null || barRaw === '') return null;

  const bar = Number(String(barRaw).replace(',', '.').trim());
  if (!Number.isFinite(bar)) {
    throw new AppError('La presión en BAR no es válida', 400);
  }
  if (bar < MIN_PRESION_BAR || bar > MAX_PRESION_BAR) {
    throw new AppError(
      `La presión debe estar entre ${MIN_PRESION_BAR} y ${MAX_PRESION_BAR} BAR`,
      400
    );
  }

  const psi = Number((bar * PSI_PER_BAR).toFixed(1));
  if (psi > MAX_PRESION_PSI) {
    throw new AppError(
      `La presión supera el máximo permitido (${MAX_PRESION_BAR} BAR)`,
      400
    );
  }
  return psi;
}

/** Acepta PSI (app mecánico) o BAR (formularios que envían BAR). */
export function presionPsiFromBody(raw: unknown): number | null {
  if (raw == null || raw === '') return null;

  const n = Number(String(raw).replace(',', '.').trim());
  if (!Number.isFinite(n)) {
    throw new AppError('La presión no es válida', 400);
  }

  if (n <= BAR_VS_PSI_THRESHOLD) {
    return presionPsiFromBarInput(n);
  }

  if (n > MAX_PRESION_PSI) {
    throw new AppError(
      `La presión es demasiado alta. Revisá el valor (máx. ~${MAX_PRESION_BAR} BAR).`,
      400
    );
  }
  if (n < 7) {
    throw new AppError('La presión en PSI es demasiado baja para un neumático.', 400);
  }
  return Number(n.toFixed(1));
}
