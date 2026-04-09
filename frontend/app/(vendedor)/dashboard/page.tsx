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
import { suscribirPush } from '@/hooks/usePushNotifications';

interface Comunicado {
  id: string;
  titulo: string;
  contenido: string;
  created_at: string;
}

interface Objetivo {
  meta_ventas: number;
  meta_conversion: number;
}

interface ProgresoObjetivo {
  ventas: number;
  total: number;
  tasaConversion: number;
}

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
  const [comunicado, setComunicado] = useState<Comunicado | null>(null);
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null);
  const [progresoObjetivo, setProgresoObjetivo] = useState<ProgresoObjetivo | null>(null);
  const [pushPermiso, setPushPermiso] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermiso(Notification.permission);
      if (Notification.permission === 'granted') suscribirPush();
    }
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [modulosRes, calificacionesRes, nivelRes, comunicadoRes, objetivoRes] = await Promise.all([
          apiClient.get<{ modulos: ModuloConProgreso[] }>('/modulos'),
          apiClient.get<ResumenCalificaciones>('/qr/mis-calificaciones'),
          apiClient.get<InfoNivel>('/modulos/mi-nivel'),
          apiClient.get<{ comunicado: Comunicado | null }>('/comunicados'),
          apiClient.get<{ objetivo: Objetivo | null; progreso: ProgresoObjetivo }>('/objetivos/actual'),
        ]);

        setData({
          modulos: modulosRes.modulos,
          calificaciones: calificacionesRes,
          nivel: nivelRes,
        });
        setComunicado(comunicadoRes.comunicado);
        setObjetivo(objetivoRes.objetivo);
        setProgresoObjetivo(objetivoRes.progreso);
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

      {/* Banner de comunicado activo */}
      {comunicado && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">📣</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-900">{comunicado.titulo}</p>
              <p className="text-sm text-amber-800 mt-0.5 whitespace-pre-wrap">{comunicado.contenido}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nivel actual */}
      {data?.nivel && (
        <NivelBadge info={data.nivel} size="md" />
      )}

      {/* Tarjeta de progreso unificada */}
      <div className="bg-gray-900 text-white rounded-2xl p-5 flex flex-col gap-4">
        {/* Módulos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Capacitación</p>
            <p className="text-sm font-bold">
              {resumen?.aprobados} / {resumen?.total} módulos
            </p>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{porcentaje}% completado</p>
        </div>

        {/* Objetivo del mes — integrado si existe */}
        {objetivo && progresoObjetivo && (objetivo.meta_ventas > 0 || objetivo.meta_conversion > 0) && (
          <div className="border-t border-gray-700 pt-4 flex flex-col gap-3">
            <p className="text-sm text-gray-400">Objetivo del mes</p>
            {objetivo.meta_ventas > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300">Ventas cerradas</span>
                  <span className="text-xs font-bold text-white">
                    {progresoObjetivo.ventas} / {objetivo.meta_ventas}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progresoObjetivo.ventas >= objetivo.meta_ventas ? 'bg-green-400' : 'bg-white'
                    }`}
                    style={{ width: `${Math.min(100, Math.round((progresoObjetivo.ventas / objetivo.meta_ventas) * 100))}%` }}
                  />
                </div>
              </div>
            )}
            {objetivo.meta_conversion > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300">Tasa de conversión</span>
                  <span className="text-xs font-bold text-white">
                    {progresoObjetivo.tasaConversion}% / {objetivo.meta_conversion}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progresoObjetivo.tasaConversion >= objetivo.meta_conversion ? 'bg-green-400' : 'bg-white'
                    }`}
                    style={{ width: `${Math.min(100, Math.round((progresoObjetivo.tasaConversion / objetivo.meta_conversion) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
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

      {/* Activar notificaciones push */}
      {pushPermiso === 'default' && (
        <button
          onClick={async () => {
            const ok = await suscribirPush();
            setPushPermiso(ok ? 'granted' : 'denied');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">🔔</span>
          <div className="text-left">
            <p className="font-semibold">Activar notificaciones</p>
            <p className="text-xs text-gray-400">Recibí avisos de comunicados y novedades</p>
          </div>
        </button>
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