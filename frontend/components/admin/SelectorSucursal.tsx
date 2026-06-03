'use client';

import { SUCURSALES } from '@/lib/sucursales';

type Modo = 'filtro' | 'requerido' | 'opcional';

export function SelectorSucursal({
  value,
  onChange,
  modo = 'filtro',
  label = 'Sucursal',
  id = 'selector-sucursal',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  modo?: Modo;
  label?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
      >
        {modo === 'filtro' && <option value="">Todas las sucursales</option>}
        {modo === 'requerido' && (
          <option value="" disabled>
            Seleccioná una sucursal
          </option>
        )}
        {modo === 'opcional' && <option value="">Sin sucursal asignada</option>}
        {SUCURSALES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
