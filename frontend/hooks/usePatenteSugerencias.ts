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

export function usePatenteSugerencias(query: string, debounceMs = 300) {
  const [sugerencias, setSugerencias] = useState<VehiculoSugerido[]>([]);
  const [isBuscandoSugerencias, setIsBuscandoSugerencias] = useState(false);

  useEffect(() => {
    const q = query.trim().toUpperCase();
    if (q.length < 3) {
      setSugerencias([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsBuscandoSugerencias(true);
      try {
        const base =
          typeof window !== 'undefined' && window.location.pathname.startsWith('/gomero')
            ? '/gomero'
            : '/mecanico';
        const res = await apiClient.get<{ vehiculos: VehiculoSugerido[] }>(
          `${base}/vehiculos/sugerencias?q=${encodeURIComponent(q)}`
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
  }, [query, debounceMs]);

  return {
    sugerencias,
    setSugerencias,
    isBuscandoSugerencias,
  };
}
