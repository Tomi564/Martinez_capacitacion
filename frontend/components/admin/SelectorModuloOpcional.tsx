'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { Modulo } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface SelectorModuloOpcionalProps {
  value: string;
  onChange: (moduloId: string) => void;
}

export function SelectorModuloOpcional({ value, onChange }: SelectorModuloOpcionalProps) {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<{ modulos: Modulo[] }>('/admin/modulos');
        const activos = (res.modulos || [])
          .filter((m) => m.activo !== false)
          .sort((a, b) => a.orden - b.orden);
        setModulos(activos);
      } catch {
        setModulos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <Skeleton className="h-12 w-full rounded-xl" />;
  }

  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase">Módulo (opcional)</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-12 rounded-xl border border-gray-200 px-3 text-base bg-white"
      >
        <option value="">Sin módulo asignado</option>
        {modulos.map((m) => (
          <option key={m.id} value={m.id}>
            {m.orden}. {m.titulo}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1.5 leading-snug">
        Las preguntas con módulo solo aparecen para vendedores que aprobaron ese módulo. Sin módulo:
        disponibles para todos los que tengan al menos un módulo aprobado (transición).
      </p>
    </div>
  );
}

