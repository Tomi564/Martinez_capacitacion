'use client';

import { estimarRangoEtario } from '@/lib/estimarRangoEtario';
import { cn } from '@/lib/utils';

interface BadgeRangoEtarioProps {
  dni?: string | null;
  className?: string;
}

/** Badge sutil de rango etario estimado; no se renderiza sin DNI válido. */
export function BadgeRangoEtario({ dni, className }: BadgeRangoEtarioProps) {
  if (!dni?.trim()) return null;
  const rango = estimarRangoEtario(dni);
  if (!rango) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-snug',
        rango.color,
        className
      )}
      title="Estimación aproximada según número de DNI"
    >
      {rango.label}
    </span>
  );
}
