/**
 * admin/page.tsx — Dashboard principal del administrador
 *
 * Muestra:
 *  - Métricas globales (vendedores, módulos aprobados, promedio)
 *  - Tabla de progreso de todos los vendedores
 *  - Últimas calificaciones QR recibidas
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { NotificacionesAdmin } from '@/components/admin/NotificacionesAdmin';
import { VendedoresInactivos } from '@/components/admin/VendedoresInactivos';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClienteIcon, ModuloIcon, RankingIcon } from '@/components/ui/icons';

interface RankingEntry {
  id: string;
  nombre: string;
  totalVentas: number;
  totalAtenciones: number;
  montoTotal: number;
  tasaConversion: number;
}

interface VendedorResumen {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  modulosAprobados: number;
  totalModulos: number;
  promedioNotas: number;
  ultimaActividad: string | null;
}

interface DashboardAdminData {
  totalVendedores: number;
  totalModulos: number;
  vendedoresCompletos: number;
  promedioGeneral: number;
  vendedores: VendedorResumen[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardAdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);

  const alertaCritica = (() => {
    if (!data?.vendedores?.length) return null;

    const ahora = new Date();
    const vendedorConPromedioBajo = data.vendedores.find(
      (v) => v.promedioNotas > 0 && v.promedioNotas < 60
    );
    if (vendedorConPromedioBajo) {
      return {
        titulo: 'Alerta de rendimiento',
        descripcion: `${vendedorConPromedioBajo.nombre} ${vendedorConPromedioBajo.apellido} tiene promedio bajo (${vendedorConPromedioBajo.promedioNotas.toFixed(1)}%).`,
      };
    }

    const vendedorInactivoConPendientes = data.vendedores.find((v) => {
      if (!v.ultimaActividad || v.modulosAprobados >= v.totalModulos) return false;
      const ultimaActividad = new Date(v.ultimaActividad);
      const diffDias = (ahora.getTime() - ultimaActividad.getTime()) / (1000 * 60 * 60 * 24);
      return diffDias > 7;
    });

    if (vendedorInactivoConPendientes) {
      return {
        titulo: 'Alerta de seguimiento',
        descripcion: `${vendedorInactivoConPendientes.nombre} ${vendedorInactivoConPendientes.apellido} lleva más de 7 días sin completar módulos pendientes.`,
      };
    }

    return null;
  })();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, rankRes] = await Promise.all([
          apiClient.get<DashboardAdminData>('/admin/dashboard'),
          apiClient.get<{ stats: RankingEntry[] }>('/ranking/historico'),
        ]);
        setData(dashRes);
        setRanking(rankRes.stats.slice(0, 5));
      } catch (err) {
        setError('Error al cargar el dashboard');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 lg:px-8 py-6 flex flex-col gap-4 max-w-6xl mx-auto">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
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
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-6xl mx-auto">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resumen general del sistema de capacitación
        </p>
      </div>

      {/* First fold: KPI principal */}
      <Card className="rounded-xl bg-white">
        <CardContent>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            KPI principal
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {data?.promedioGeneral ? `${data.promedioGeneral.toFixed(1)}%` : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Promedio general del equipo</p>
        </CardContent>
      </Card>

      {/* First fold: alerta crítica */}
      {alertaCritica ? (
        <Card className="rounded-xl border-amber-200 bg-amber-50">
          <CardContent>
            <p className="text-sm font-semibold text-amber-900">{alertaCritica.titulo}</p>
            <p className="text-sm text-amber-800 mt-1">{alertaCritica.descripcion}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl border-green-200 bg-green-50">
          <CardContent>
            <p className="text-sm font-semibold text-green-800">
              No hay alertas críticas en este momento.
            </p>
          </CardContent>
        </Card>
      )}

      {/* First fold: accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/admin/vendedores', icon: ClienteIcon, label: 'Vendedores', sub: 'Creá, editá y desactivá' },
          { href: '/admin/reportes', icon: RankingIcon, label: 'Reportes', sub: 'Progreso y calificaciones' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="h-full">
            <Card
              className="text-white rounded-xl h-full active:scale-[0.99] transition-transform"
              style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}
            >
              <CardContent className="flex flex-col gap-2">
              <item.icon className="w-5 h-5" />
              <p className="font-semibold mt-2 text-sm">{item.label}</p>
              <p className="text-xs text-white/90 mt-0.5">{item.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Debajo del fold */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Más detalles
        </p>
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          {
            label: 'Vendedores',
            value: data?.totalVendedores || 0,
            color: 'text-gray-900',
          },
          {
            label: 'Módulos',
            value: data?.totalModulos || 0,
            color: 'text-gray-900',
          },
          {
            label: 'Completaron todo',
            value: data?.vendedoresCompletos || 0,
            color: 'text-green-600',
          },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white rounded-xl">
            <CardContent>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link href="/admin/modulos" className="block">
        <Card className="rounded-xl active:scale-[0.99] transition-transform">
          <CardContent className="flex items-center gap-3">
            <ModuloIcon className="w-5 h-5 text-[#C8102E]" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Módulos</p>
              <p className="text-xs text-gray-500">Contenido y preguntas</p>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Tabla de progreso de vendedores */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Progreso por vendedor
          </p>
          <Link
            href="/admin/vendedores"
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            Ver todos →
          </Link>
        </div>

        <Card className="overflow-hidden rounded-xl">
          {/* Header de tabla — solo desktop */}
          <div className="hidden lg:grid grid-cols-5 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span className="col-span-2">Vendedor</span>
            <span className="text-center">Módulos</span>
            <span className="text-center">Promedio</span>
            <span className="text-center">Estado</span>
          </div>

          {/* Filas */}
          {data?.vendedores.map((vendedor, index) => {
            const porcentaje =
              vendedor.totalModulos > 0
                ? Math.round(
                    (vendedor.modulosAprobados / vendedor.totalModulos) * 100
                  )
                : 0;

            return (
              <Link
                key={vendedor.id}
                href={`/admin/vendedores/${vendedor.id}`}
              >
                <div
                  className={`px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    index !== 0 ? 'border-t border-gray-100' : ''
                  }`}
                >
                  {/* Avatar */}
                  <Avatar className="w-9 h-9">
                    <AvatarFallback>
                      {vendedor.nombre.charAt(0)}{vendedor.apellido.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Nombre y email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {vendedor.nombre} {vendedor.apellido}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {vendedor.email}
                    </p>
                  </div>

                  {/* Progreso */}
                  <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
                    {/* Módulos */}
                    <div className="text-center w-20">
                      <p className="text-sm font-semibold text-gray-900">
                        {vendedor.modulosAprobados}/{vendedor.totalModulos}
                      </p>
                      <Progress value={porcentaje} className="w-full mt-1 h-1" indicatorClassName="bg-gray-900" />
                    </div>

                    {/* Promedio */}
                    <div className="text-center w-20">
                      <p className="text-sm font-semibold text-gray-900">
                        {vendedor.promedioNotas > 0
                          ? `${vendedor.promedioNotas.toFixed(1)}%`
                          : '—'}
                      </p>
                    </div>

                    {/* Badge de estado */}
                    <div className="w-24 text-center">
                      <Badge variant={porcentaje === 100 ? 'success' : porcentaje > 0 ? 'warning' : 'muted'}>
                        {porcentaje === 100 ? 'Completo' : porcentaje > 0 ? 'En progreso' : 'Sin iniciar'}
                      </Badge>
                    </div>
                  </div>

                  {/* Mobile: solo porcentaje */}
                  <div className="lg:hidden flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {porcentaje}%
                    </p>
                    <p className="text-xs text-gray-400">
                      {vendedor.modulosAprobados}/{vendedor.totalModulos}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Sin vendedores */}
          {data?.vendedores.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-400 text-sm">
                No hay vendedores registrados aún
              </p>
              <Link href="/admin/vendedores">
                <Button className="mt-3">Agregar vendedor</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Ranking top 5 */}
      {ranking.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Top del equipo
          </p>
          <Card className="overflow-hidden rounded-xl">
            {ranking.map((entry, i) => {
              const MEDALLAS = ['#1', '#2', '#3'];
              const maxVentas = ranking[0]?.totalVentas || 1;
              const pct = Math.round((entry.totalVentas / maxVentas) * 100);
              return (
                <div key={entry.id} className={`px-4 py-3 flex items-center gap-3 ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                  <Badge
                    variant={i < 3 ? 'default' : 'muted'}
                    className={`w-9 justify-center px-0 py-1 text-xs font-medium ${
                      i === 0 ? 'bg-[#FFF7CC] text-[#7A5A00]' : i < 3 ? 'text-red-800' : 'text-gray-700'
                    }`}
                  >
                    {i < 3 ? MEDALLAS[i] : `#${i + 1}`}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{entry.nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={pct} className="flex-1 h-1.5" indicatorClassName="bg-gray-900" />
                      <span className="text-xs text-gray-400 shrink-0">{entry.totalVentas} ventas</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {entry.tasaConversion > 0 && (
                      <p className="text-xs text-gray-500">{entry.tasaConversion}% conv.</p>
                    )}
                    {entry.montoTotal > 0 && (
                      <p className="text-xs text-green-600">${entry.montoTotal.toLocaleString('es-AR')}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Notificaciones — vendedores que necesitan apoyo */}
      <NotificacionesAdmin />

      {/* Vendedores inactivos */}
      <VendedoresInactivos />

    </div>
  );
}