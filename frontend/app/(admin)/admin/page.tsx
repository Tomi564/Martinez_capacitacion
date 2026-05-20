/**
 * admin/page.tsx — Dashboard principal del administrador
 *
 * Muestra:
 *  - Métricas globales (vendedores, módulos aprobados, nota promedio de exámenes en pts)
 *  - Tabla de progreso de todos los vendedores
 *  - Últimas calificaciones QR recibidas
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
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

interface CalificacionBaja7d {
  vendedorId: string;
  nombre: string;
  apellido: string;
  estrellas: number;
}

interface DashboardAdminData {
  totalVendedores: number;
  totalModulos: number;
  vendedoresCompletos: number;
  promedioGeneral: number;
  vendedores: VendedorResumen[];
  calificacionesBajas7d?: CalificacionBaja7d[];
}

interface AlertaCritica {
  id: string;
  titulo: string;
  descripcion: string;
}

function buildAlertasCriticas(data: DashboardAdminData | null): AlertaCritica[] {
  if (!data) return [];

  const alertas: AlertaCritica[] = [];
  const ahora = new Date();

  for (const c of data.calificacionesBajas7d ?? []) {
    alertas.push({
      id: `calificacion-baja-${c.vendedorId}`,
      titulo: 'Calificación baja',
      descripcion: `${c.nombre} ${c.apellido} recibió una calificación baja de ${c.estrellas} estrellas`,
    });
  }

  for (const v of data.vendedores) {
    if (v.promedioNotas > 0 && v.promedioNotas < 60) {
      alertas.push({
        id: `rendimiento-${v.id}`,
        titulo: 'Alerta de rendimiento (notas)',
        descripcion: `${v.nombre} ${v.apellido} tiene nota promedio baja (${v.promedioNotas.toFixed(1)} pts).`,
      });
    }
  }

  for (const v of data.vendedores) {
    if (!v.ultimaActividad || v.modulosAprobados >= v.totalModulos) continue;
    const ultimaActividad = new Date(v.ultimaActividad);
    const diffDias = (ahora.getTime() - ultimaActividad.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDias > 7) {
      alertas.push({
        id: `seguimiento-${v.id}`,
        titulo: 'Alerta de seguimiento',
        descripcion: `${v.nombre} ${v.apellido} lleva más de 7 días sin completar módulos pendientes.`,
      });
    }
  }

  return alertas;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardAdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorDashboard, setErrorDashboard] = useState<string | null>(null);
  const [errorRanking, setErrorRanking] = useState<string | null>(null);
  const [errorOrdenesRetrasadas, setErrorOrdenesRetrasadas] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [ordenesMecanicoRetrasadas, setOrdenesMecanicoRetrasadas] = useState<number>(0);

  const alertasCriticas = useMemo(() => buildAlertasCriticas(data), [data]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      setErrorDashboard(null);
      setErrorRanking(null);
      setErrorOrdenesRetrasadas(null);

      const reqDashboard = apiClient
        .get<DashboardAdminData>('/admin/dashboard')
        .then((dashRes) => setData(dashRes))
        .catch((err) => {
          console.error('[AdminDashboard] /admin/dashboard', err);
          setErrorDashboard('No se pudo cargar el resumen del panel. El resto de las secciones puede seguir disponible.');
          setData(null);
        });

      const reqRanking = apiClient
        .get<{ stats: RankingEntry[] }>('/ranking/historico')
        .then((rankRes) => {
          setRanking((rankRes.stats || []).slice(0, 5));
        })
        .catch((err) => {
          console.error('[AdminDashboard] /ranking/historico', err);
          setErrorRanking('No se pudo cargar el ranking histórico del equipo.');
          setRanking([]);
        });

      const reqRetrasadas = apiClient
        .get<{ count: number }>('/admin/taller/ordenes-mecanico-retrasadas-count')
        .then((retrasadasRes) => {
          setOrdenesMecanicoRetrasadas(typeof retrasadasRes.count === 'number' ? retrasadasRes.count : 0);
        })
        .catch((err) => {
          console.error('[AdminDashboard] ordenes-mecanico-retrasadas-count', err);
          setErrorOrdenesRetrasadas('No se pudo cargar el conteo de órdenes retrasadas.');
          setOrdenesMecanicoRetrasadas(0);
        });

      await Promise.all([reqDashboard, reqRanking, reqRetrasadas]);
      setIsLoading(false);
    };

    void fetchDashboard();
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

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-6xl mx-auto">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resumen general del sistema de capacitación
        </p>
      </div>

      {errorDashboard && (
        <Card className="rounded-xl border-amber-200 bg-amber-50">
          <CardContent className="py-3">
            <p className="text-sm text-amber-900">{errorDashboard}</p>
          </CardContent>
        </Card>
      )}

      {errorRanking && (
        <Card className="rounded-xl border-amber-200 bg-amber-50">
          <CardContent className="py-3">
            <p className="text-sm text-amber-900">{errorRanking}</p>
          </CardContent>
        </Card>
      )}

      {errorOrdenesRetrasadas && (
        <Card className="rounded-xl border-amber-200 bg-amber-50">
          <CardContent className="py-3">
            <p className="text-sm text-amber-900">{errorOrdenesRetrasadas}</p>
          </CardContent>
        </Card>
      )}

      {/* First fold: KPI principal */}
      <Card className="rounded-xl bg-white">
        <CardContent>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            KPI principal
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {data?.promedioGeneral ? `${data.promedioGeneral.toFixed(1)} pts` : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Nota promedio del equipo (exámenes)</p>
        </CardContent>
      </Card>

      {/* Taller: órdenes del gomero sin tomar (+2 h) */}
      <Link href="/admin/clientes" className="block active:scale-[0.99] transition-transform">
        <Card
          className={`rounded-xl border-2 ${
            ordenesMecanicoRetrasadas > 0
              ? 'border-red-300 bg-red-50'
              : 'border-gray-100 bg-gray-50/80'
          }`}
        >
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className={`text-sm font-bold ${ordenesMecanicoRetrasadas > 0 ? 'text-red-900' : 'text-gray-700'}`}>
                Órdenes taller sin mecánico (+2 h)
              </p>
              <p className={`text-xs mt-1 leading-snug ${ordenesMecanicoRetrasadas > 0 ? 'text-red-800/90' : 'text-gray-500'}`}>
                {ordenesMecanicoRetrasadas > 0
                  ? 'Pendiente mecánico, enviadas hace más de dos horas sin “tomar”. Ir a clientes / visitas.'
                  : 'Ninguna orden supera el umbral en este momento.'}
              </p>
            </div>
            <span
              className={`text-3xl font-black tabular-nums shrink-0 min-w-[2.5rem] text-center ${
                ordenesMecanicoRetrasadas > 0 ? 'text-red-700' : 'text-gray-400'
              }`}
              aria-live="polite"
            >
              {ordenesMecanicoRetrasadas}
            </span>
          </CardContent>
        </Card>
      </Link>

      {alertasCriticas.length > 0 && (
        <Card className="rounded-xl border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
              Alertas críticas
            </p>
            <ul className="flex flex-col gap-3">
              {alertasCriticas.map((alerta) => (
                <li
                  key={alerta.id}
                  className="border-t border-amber-200/80 first:border-t-0 first:pt-0 pt-3"
                >
                  <p className="text-sm font-semibold text-amber-900">{alerta.titulo}</p>
                  <p className="text-sm text-amber-800 mt-0.5">{alerta.descripcion}</p>
                </li>
              ))}
            </ul>
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
            <span className="text-center">Nota prom.</span>
            <span className="text-center">Estado</span>
          </div>

          {/* Filas */}
          {data && (data.vendedores ?? []).map((vendedor, index) => {
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

                    {/* Nota promedio exámenes (puntos, no %) */}
                    <div className="text-center w-20">
                      <p className="text-sm font-semibold text-gray-900">
                        {vendedor.promedioNotas > 0
                          ? `${vendedor.promedioNotas.toFixed(1)} pts`
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
          {data && (data.vendedores ?? []).length === 0 && (
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