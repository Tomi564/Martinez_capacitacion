/** Debe coincidir con users_sucursal_check en Supabase. */
export const SUCURSALES = [
  'Sucursal Chile',
  'Sucursal Sarmiento',
  'Sucursal Tres Cerritos',
  'Sucursal Jujuy',
] as const;

export type SucursalNombre = (typeof SUCURSALES)[number];

export function sucursalQueryParam(value: string): string {
  if (!value) return '';
  return `sucursal=${encodeURIComponent(value)}`;
}

export function appendSucursalQuery(url: string, sucursalFiltro: string): string {
  if (!sucursalFiltro) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${sucursalQueryParam(sucursalFiltro)}`;
}
