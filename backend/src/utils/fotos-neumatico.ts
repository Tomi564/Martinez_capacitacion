import { AppError } from '../middleware/errorHandler';

export const MAX_FOTOS_NEUMATICO = 4;

export function parseFotosNeumaticoUrls(body: unknown): string[] | null | undefined {
  if (body === undefined) return undefined;
  if (body === null) return null;
  if (!Array.isArray(body)) {
    throw new AppError('fotos_neumatico_urls debe ser un array de imágenes', 400);
  }
  const urls = body.filter((u) => typeof u === 'string' && u.trim().length > 0) as string[];
  if (urls.length > MAX_FOTOS_NEUMATICO) {
    throw new AppError(`Máximo ${MAX_FOTOS_NEUMATICO} fotos por orden`, 400);
  }
  return urls.length ? urls : null;
}
