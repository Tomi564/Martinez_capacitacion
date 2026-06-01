'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export interface VehiculoSugerido {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  medida_rueda: string | null;
  clientes: { id: string; nombre: string; apellido: string; telefono: string | null; email: string | null } | null;
}

export type PatenteApiBase = '/gomero' | '/mecanico' | '/vendedor';

function resolverApiBase(explicit?: PatenteApiBase): PatenteApiBase {
  if (explicit) return explicit;
  if (typeof window === 'undefined') return '/mecanico';
  if (window.location.pathname.startsWith('/gomero')) return '/gomero';
  if (window.location.pathname.startsWith('/vendedor') || window.location.pathname.startsWith('/atenciones')) {
    return '/vendedor';
  }
  return '/mecanico';
}

export function usePatenteSugerencias(
  query: string,
  debounceMs = 300,
  apiBase?: PatenteApiBase,
) {
  const [sugerencias, setSugerencias] = useState<VehiculoSugerido[]>([]);
  const [isBuscandoSugerencias, setIsBuscandoSugerencias] = useState(false);

  useEffect(() => {
    const q = query.trim().toUpperCase();
    if (q.length < 3) {
      setSugerencias([]);
      return;
    }

    const base = resolverApiBase(apiBase);
    const timeoutId = setTimeout(async () => {
      setIsBuscandoSugerencias(true);
      try {
        const res = await apiClient.get<{ vehiculos: VehiculoSugerido[] }>(
          `${base}/vehiculos/sugerencias?q=${encodeURIComponent(q)}`,
        );
        setSugerencias(res.vehiculos || []);
      } catch (error) {
        console.error('[usePatenteSugerencias] Error buscando sugerencias', error);
        setSugerencias([]);
      } finally {
        setIsBuscandoSugerencias(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, apiBase]);

  return {
    sugerencias,
    setSugerencias,
    isBuscandoSugerencias,
  };
}
