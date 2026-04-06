/**
 * VendedoresInactivos.tsx — Alerta de vendedores sin actividad
 * Muestra vendedores que llevan más de 3 días sin avanzar
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface VendedorInactivo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  dias_inactivo: number | null;
  ultimo_intento: string | null;
}

export function VendedoresInactivos() {
  const [inactivos, setInactivos] = useState<VendedorInactivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInactivos = async () => {
      try {
        const res = await apiClient.get<{ inactivos: VendedorInactivo[] }>(
          '/admin/inactivos'
        );
        setInactivos(res.inactivos);
      } catch {
      } finally {
        setIsLoading(false);
      }
    };

    fetchInactivos();
  }, []);

  if (isLoading || inactivos.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Sin actividad — {inactivos.length}{' '}
          {inactivos.length === 1 ? 'vendedor' : 'vendedores'} inactivos
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {inactivos.map((v) => (
          <Link key={v.id} href={`/admin/vendedores/${v.id}`}>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform">
              {/* Avatar */}
              <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-sm font-bold text-amber-800 flex-shrink-0">
                {v.nombre.charAt(0)}{v.apellido.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  {v.nombre} {v.apellido}
                </p>
                <p className="text-xs text-amber-700 truncate">{v.email}</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {v.ultimo_intento
                    ? `Último acceso hace ${v.dias_inactivo} días`
                    : 'Nunca ingresó al programa'}
                </p>
              </div>

              {/* Días badge */}
              <div className="flex-shrink-0 text-center">
                {v.ultimo_intento ? (
                  <>
                    <p className="text-2xl font-black text-amber-600">
                      {v.dias_inactivo}
                    </p>
                    <p className="text-xs text-amber-500">días</p>
                  </>
                ) : (
                  <p className="text-xs font-semibold text-amber-600 text-center">
                    Sin<br/>inicio
                  </p>
                )}
              </div>

              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
