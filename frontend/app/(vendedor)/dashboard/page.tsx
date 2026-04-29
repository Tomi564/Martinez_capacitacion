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
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Megaphone } from 'lucide-react';
import { ModuloIcon, QrIcon } from '@/components/ui/icons';

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

  const porcentaje = resumen && resumen.total > 0
    ? Math.round((resumen.aprobados / resumen.total) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="px-4 py-6 flex flex-col gap-4 max-w-lg mx-auto">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="danger" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
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
        <h1 className="text-2xl font-bold text-gray-900">{user?.nombre}</h1>
      </div>

      {/* First fold: nivel actual */}
      {data?.nivel && <NivelBadge info={data.nivel} size="md" />}

      {/* First fold: CTA principal */}
      {resumen?.disponible && (
        <Link href={`/modulos/${resumen.disponible.id}`}>
          <Card className="rounded-2xl border-2 border-gray-900 active:scale-95 transition-transform">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">Módulo {resumen.disponible.orden}</span>
                {resumen.disponible.estado === 'en_curso' && <Badge variant="warning">En curso</Badge>}
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                {resumen.disponible.estado === 'en_curso' ? 'Continuar módulo' : 'Empezar módulo'}
              </h2>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{resumen.disponible.titulo}</p>
              <p className="text-xs text-gray-400 mt-2">⏱ {resumen.disponible.duracion_min} min</p>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Debajo del fold */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Más información</p>
      </div>

      {/* Banner de comunicado activo */}
      {comunicado && (
        <Card className="bg-amber-50 border-amber-200 rounded-xl">
          <CardContent>
            <div className="flex items-start gap-3">
              <Megaphone className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-amber-900">{comunicado.titulo}</p>
                <p className="text-sm text-amber-800 mt-0.5 whitespace-pre-wrap">{comunicado.contenido}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progreso y objetivo */}
      <div className="bg-[#C8102E] text-white rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Capacitación</p>
            <p className="text-sm font-bold">
              {resumen?.aprobados} / {resumen?.total} módulos
            </p>
          </div>
          <Progress value={porcentaje} className="h-2 bg-red-900/30" indicatorClassName="bg-white" />
          <p className="text-xs text-gray-400 mt-1.5">{porcentaje}% completado</p>
        </div>

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

      {/* Todos los módulos completados */}
      {resumen && resumen.aprobados === resumen.total && (
        <Card className="bg-green-50 border-green-200 rounded-xl text-center">
          <CardContent className="p-5">
          <p className="font-bold text-green-800">
            ¡Capacitación completada!
          </p>
          <p className="text-sm text-green-600 mt-1">
            Aprobaste todos los módulos
          </p>
          </CardContent>
        </Card>
      )}

      {/* Calificaciones QR */}
      {data && data.calificaciones.total > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Mis calificaciones
          </p>
          <Card className="rounded-xl">
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insignias */}
      {data && data.modulos.length > 0 && (
        <Insignias modulos={data.modulos} />
      )}

      {/* Activar notificaciones push */}
      {pushPermiso === 'default' && (
        <Button
          onClick={async () => {
            const ok = await suscribirPush();
            setPushPermiso(ok ? 'granted' : 'denied');
          }}
          variant="outline"
          className="w-full justify-start rounded-xl"
        >
          <Bell className="w-5 h-5 text-gray-500" />
          <div className="text-left">
            <p className="font-semibold">Activar notificaciones</p>
            <p className="text-xs text-gray-400">Recibí avisos de comunicados y novedades</p>
          </div>
        </Button>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/modulos">
          <Card className="rounded-xl p-4 active:scale-[0.99] transition-transform">
            <ModuloIcon className="w-5 h-5 text-[#C8102E]" />
            <p className="font-semibold text-gray-900 mt-2 text-sm">
              Ver módulos
            </p>
          </Card>
        </Link>
        <Link href="/mi-qr">
          <Card className="rounded-xl p-4 active:scale-[0.99] transition-transform">
            <QrIcon className="w-5 h-5 text-[#C8102E]" />
            <p className="font-semibold text-gray-900 mt-2 text-sm">
              Mi código QR
            </p>
          </Card>
        </Link>
      </div>

    </div>
  );
}