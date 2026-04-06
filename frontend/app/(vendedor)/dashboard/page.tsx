/**
 * dashboard/page.tsx — Dashboard principal del vendedor
 *
 * Muestra:
 *  - Saludo personalizado
 *  - Resumen de progreso (módulos aprobados / total)
 *  - Acceso rápido al módulo actual
 *  - Últimas calificaciones QR recibidas
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import type { ModuloConProgreso, ResumenCalificaciones } from '@/types';
import { NivelBadge, type InfoNivel } from '@/components/ui/NivelBadge';
import { Insignias } from '@/components/ui/Insignias';

interface DashboardData {
  modulos: ModuloConProgreso[];
  calificaciones: ResumenCalificaciones;
  nivel: InfoNivel;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [modulosRes, calificacionesRes, nivelRes] = await Promise.all([
          apiClient.get<{ modulos: ModuloConProgreso[] }>('/modulos'),
          apiClient.get<ResumenCalificaciones>('/qr/mis-calificaciones'),
          apiClient.get<InfoNivel>('/modulos/mi-nivel'),
        ]);

        setData({
          modulos: modulosRes.modulos,
          calificaciones: calificacionesRes,
          nivel: nivelRes,
        });
      } catch (err) {
        setError('Error al cargar el dashboard');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Calcular resumen de progreso
  const resumen = data ? {
    total: data.modulos.length,
    aprobados: data.modulos.filter(m => m.estado === 'aprobado').length,
    disponible: data.modulos.find(m => m.estado === 'disponible' || m.estado === 'en_curso'),
  } : null;

  const porcentaje = resumen
    ? Math.round((resumen.aprobados / resumen.total) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 flex flex-col gap-6 max-w-lg mx-auto">

      {/* Saludo */}
      <div>
        <p className="text-sm text-gray-500">
          {(() => {
            const h = new Date().getHours();
            if (h >= 6 && h < 13) return 'Buenos días,';
            if (h >= 13 && h < 20) return 'Buenas tardes,';
            return 'Buenas noches,';
          })()}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.nombre} 👋
        </h1>
      </div>

      {/* Nivel actual */}
      {data?.nivel && (
        <NivelBadge info={data.nivel} size="md" />
      )}

      {/* Tarjeta de progreso general */}
      <div className="bg-gray-900 text-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400">Tu progreso</p>
            <p className="text-3xl font-bold mt-0.5">{porcentaje}%</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{resumen?.aprobados}</p>
            <p className="text-sm text-gray-400">
              de {resumen?.total} módulos
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        {/* Estado de módulos */}
        <div className="flex gap-4 mt-4 text-xs">
          <span className="text-green-400">
            ✓ {resumen?.aprobados} aprobados
          </span>
          <span className="text-gray-400">
            ○ {(resumen?.total ?? 0) - (resumen?.aprobados ?? 0)} restantes
          </span>
        </div>
      </div>

      {/* Módulo actual — acción principal */}
      {resumen?.disponible && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Continuar capacitación
          </p>
          <Link href={`/modulos/${resumen.disponible.id}`}>
            <div className="bg-white border-2 border-gray-900 rounded-2xl p-4 active:scale-95 transition-transform">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">
                  Módulo {resumen.disponible.orden}
                </span>
                {resumen.disponible.estado === 'en_curso' && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    En curso
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">
                {resumen.disponible.titulo}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {resumen.disponible.descripcion}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">
                  ⏱ {resumen.disponible.duracion_min} min
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  Ir al módulo →
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Todos los módulos completados */}
      {resumen && resumen.aprobados === resumen.total && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-bold text-green-800">
            ¡Capacitación completada!
          </p>
          <p className="text-sm text-green-600 mt-1">
            Aprobaste todos los módulos
          </p>
        </div>
      )}

      {/* Calificaciones QR */}
      {data && data.calificaciones.total > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Mis calificaciones
          </p>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-gray-900">
                {data.calificaciones.promedio.toFixed(1)}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= Math.round(data.calificaciones.promedio)
                          ? 'text-amber-400'
                          : 'text-gray-200'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {data.calificaciones.total} calificaciones
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insignias */}
      {data && data.modulos.length > 0 && (
        <Insignias modulos={data.modulos} />
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/modulos">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 active:scale-95 transition-transform">
            <span className="text-2xl">📚</span>
            <p className="font-semibold text-gray-900 mt-2 text-sm">
              Ver módulos
            </p>
          </div>
        </Link>
        <Link href="/mi-qr">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 active:scale-95 transition-transform">
            <span className="text-2xl">📱</span>
            <p className="font-semibold text-gray-900 mt-2 text-sm">
              Mi código QR
            </p>
          </div>
        </Link>
      </div>

    </div>
  );
}