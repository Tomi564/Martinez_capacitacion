/** Sucursales fijas del negocio (debe coincidir con users_sucursal_check en DB). */
export const SUCURSALES = [
  'Sucursal Chile',
  'Sucursal Sarmiento',
  'Sucursal Tres Cerritos',
  'Sucursal Jujuy',
] as const;

export type SucursalNombre = (typeof SUCURSALES)[number];

export function esSucursalValida(value: unknown): value is SucursalNombre {
  return typeof value === 'string' && (SUCURSALES as readonly string[]).includes(value);
}

/** Query admin opcional: vacío / "todas" = sin filtro. */
export function parseSucursalQueryAdmin(value: unknown): SucursalNombre | null {
  if (value == null || value === '' || value === 'todas' || value === 'all') {
    return null;
  }
  const s = String(value).trim();
  if (!esSucursalValida(s)) {
    return null;
  }
  return s;
}

export function parseSucursalRequerida(value: unknown): SucursalNombre {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!esSucursalValida(s)) {
    throw new Error('SUCURSAL_INVALIDA');
  }
  return s;
}
