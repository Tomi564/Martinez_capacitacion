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
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-6xl mx-auto">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resumen general del sistema de capacitación
        </p>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Vendedores',
            value: data?.totalVendedores || 0,
            color: 'text-gray-900',
            bg: 'bg-white',
          },
          {
            label: 'Módulos',
            value: data?.totalModulos || 0,
            color: 'text-gray-900',
            bg: 'bg-white',
          },
          {
            label: 'Completaron todo',
            value: data?.vendedoresCompletos || 0,
            color: 'text-green-600',
            bg: 'bg-white',
          },
          {
            label: 'Promedio general',
            value: data?.promedioGeneral
              ? `${data.promedioGeneral.toFixed(1)}%`
              : '—',
            color: 'text-blue-600',
            bg: 'bg-white',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} border border-gray-200 rounded-2xl p-4`}
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { href: '/admin/vendedores', emoji: '👥', label: 'Vendedores', sub: 'Crear, editar, desactivar' },
          { href: '/admin/modulos',    emoji: '📚', label: 'Módulos',    sub: 'Contenido y preguntas' },
          { href: '/admin/reportes',   emoji: '📊', label: 'Reportes',   sub: 'Progreso y calificaciones' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="h-full">
            <div className="bg-[#C8102E] text-white rounded-2xl p-4 h-full active:scale-95 transition-transform flex flex-col">
              <span className="text-2xl">{item.emoji}</span>
              <p className="font-semibold mt-2 text-sm">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
            </div>
          </Link>
        ))}
      </div>

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

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
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
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                    {vendedor.nombre.charAt(0)}{vendedor.apellido.charAt(0)}
                  </div>

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
                      <div className="w-full h-1 bg-gray-100 rounded-full mt-1">
                        <div
                          className="h-full bg-gray-900 rounded-full"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
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
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        porcentaje === 100
                          ? 'bg-green-100 text-green-700'
                          : porcentaje > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {porcentaje === 100
                          ? '✓ Completo'
                          : porcentaje > 0
                          ? 'En progreso'
                          : 'Sin iniciar'}
                      </span>
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
                <button className="mt-3 px-4 py-2 bg-[#C8102E] text-white text-sm rounded-xl">
                  Agregar vendedor
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Ranking top 5 */}
      {ranking.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Top del equipo
          </p>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {ranking.map((entry, i) => {
              const MEDALLAS = ['🥇', '🥈', '🥉'];
              const maxVentas = ranking[0]?.totalVentas || 1;
              const pct = Math.round((entry.totalVentas / maxVentas) * 100);
              return (
                <div key={entry.id} className={`px-4 py-3 flex items-center gap-3 ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                  <span className="text-lg w-7 text-center shrink-0">
                    {i < 3 ? MEDALLAS[i] : <span className="text-sm font-bold text-gray-400">#{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{entry.nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-900 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
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
          </div>
        </div>
      )}

      {/* Notificaciones — vendedores que necesitan apoyo */}
      <NotificacionesAdmin />

      {/* Vendedores inactivos */}
      <VendedoresInactivos />

    </div>
  );
}