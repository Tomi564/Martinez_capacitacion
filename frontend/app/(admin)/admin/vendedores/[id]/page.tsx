/**
 * admin/vendedores/[id]/page.tsx — Detalle de un vendedor
 *
 * Muestra:
 *  - Datos del vendedor
 *  - Progreso detallado por módulo
 *  - Historial de intentos
 *  - Calificaciones QR recibidas
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface VendedorDetalle {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
  created_at: string;
  progreso: {
    modulo_id: string;
    modulo_titulo: string;
    modulo_orden: number;
    estado: string;
    mejor_nota: number;
    intentos: number;
    completado_at: string | null;
  }[];
  calificaciones: {
    promedio: number;
    total: number;
    distribucion: Record<number, number>;
  };
}

export default function VendedorDetallePage() {
  const params = useParams();
  const router = useRouter();
  const vendedorId = params.id as string;

  const [vendedor, setVendedor] = useState<VendedorDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendedor = async () => {
      try {
        const res = await apiClient.get<{ vendedor: VendedorDetalle }>(
          `/admin/vendedores/${vendedorId}`
        );
        setVendedor(res.vendedor);
      } catch (err) {
        setError('Error al cargar el vendedor');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendedor();
  }, [vendedorId]);

  const handleToggleActivo = async () => {
    if (!vendedor) return;
    try {
      await apiClient.patch(`/admin/vendedores/${vendedorId}`, {
        activo: !vendedor.activo,
      });
      setVendedor({ ...vendedor, activo: !vendedor.activo });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !vendedor) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error || 'Vendedor no encontrado'}</p>
        </div>
      </div>
    );
  }

  const aprobados = vendedor.progreso.filter(
    (p) => p.estado === 'aprobado'
  ).length;
  const total = vendedor.progreso.length;
  const porcentaje = total > 0 ? Math.round((aprobados / total) * 100) : 0;

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {vendedor.nombre} {vendedor.apellido}
        </h1>
      </div>

      {/* Tarjeta de perfil */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-lg font-bold">
              {vendedor.nombre.charAt(0)}{vendedor.apellido.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">
                {vendedor.nombre} {vendedor.apellido}
              </p>
              <p className="text-sm text-gray-500">{vendedor.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Registrado el{' '}
                {new Date(vendedor.created_at).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleActivo}
            className={`text-sm px-4 py-2 rounded-xl border font-medium transition-colors flex-shrink-0 ${
              vendedor.activo
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}
          >
            {vendedor.activo ? 'Desactivar' : 'Activar'}
          </button>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{porcentaje}%</p>
            <p className="text-xs text-gray-500 mt-0.5">Completado</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {aprobados}/{total}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Módulos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {vendedor.calificaciones.promedio > 0
                ? vendedor.calificaciones.promedio.toFixed(1)
                : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Calificación</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progreso por módulo */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Progreso por módulo
        </p>
        <div className="flex flex-col gap-2">
          {vendedor.progreso
            .sort((a, b) => a.modulo_orden - b.modulo_orden)
            .map((p) => (
              <div
                key={p.modulo_id}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                {/* Indicador de estado */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${p.estado === 'aprobado'
                    ? 'bg-green-100 text-green-600'
                    : p.estado === 'en_curso'
                    ? 'bg-amber-100 text-amber-600'
                    : p.estado === 'disponible'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  {p.estado === 'aprobado' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : p.estado === 'bloqueado' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{p.modulo_orden}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {p.modulo_titulo}
                  </p>
                  <div className="flex gap-3 mt-0.5">
                    {p.intentos > 0 && (
                      <span className="text-xs text-gray-400">
                        {p.intentos} {p.intentos === 1 ? 'intento' : 'intentos'}
                      </span>
                    )}
                    {p.completado_at && (
                      <span className="text-xs text-gray-400">
                        Aprobado el{' '}
                        {new Date(p.completado_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nota */}
                {p.mejor_nota > 0 && (
                  <span className={`text-sm font-bold flex-shrink-0 ${
                    p.estado === 'aprobado' ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {p.mejor_nota.toFixed(1)}%
                  </span>
                )}

                {/* Badge estado */}
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                  p.estado === 'aprobado'
                    ? 'bg-green-100 text-green-700'
                    : p.estado === 'en_curso'
                    ? 'bg-amber-100 text-amber-700'
                    : p.estado === 'disponible'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {p.estado === 'aprobado' ? 'Aprobado'
                    : p.estado === 'en_curso' ? 'En curso'
                    : p.estado === 'disponible' ? 'Disponible'
                    : 'Bloqueado'}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Calificaciones QR */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Calificaciones recibidas
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          {vendedor.calificaciones.total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Sin calificaciones aún
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">
                  {vendedor.calificaciones.promedio.toFixed(1)}
                </p>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= Math.round(vendedor.calificaciones.promedio)
                          ? 'text-amber-400'
                          : 'text-gray-200'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {vendedor.calificaciones.total} calificaciones
                </p>
              </div>

              <div className="flex-1 flex flex-col gap-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const cantidad =
                    vendedor.calificaciones.distribucion[star] || 0;
                  const pct =
                    vendedor.calificaciones.total > 0
                      ? (cantidad / vendedor.calificaciones.total) * 100
                      : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3">{star}</span>
                      <span className="text-amber-400 text-xs">★</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-4 text-right">
                        {cantidad}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}