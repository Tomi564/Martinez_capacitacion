/**
 * admin/reportes/page.tsx — Reportes y exportación
 *
 * Muestra:
 *  - Reporte de progreso general
 *  - Reporte de calificaciones QR
 *  - Botones de exportación CSV
 */

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface ReporteProgreso {
  vendedor: string;
  email: string;
  modulosAprobados: number;
  totalModulos: number;
  porcentaje: number;
  promedioNotas: number;
  totalIntentos: number;
  fechaUltimaActividad: string | null;
}

interface ReporteCalificaciones {
  vendedor: string;
  email: string;
  promedio: number;
  promedioVendedor: number;
  promedioEmpresa: number;
  totalCalificaciones: number;
  estrellas5: number;
  estrellas4: number;
  estrellas3: number;
  estrellas2: number;
  estrellas1: number;
  vendedor5: number;
  vendedor4: number;
  vendedor3: number;
  vendedor2: number;
  vendedor1: number;
  empresa5: number;
  empresa4: number;
  empresa3: number;
  empresa2: number;
  empresa1: number;
}

interface ReportesData {
  progreso: ReporteProgreso[];
  calificaciones: ReporteCalificaciones[];
}

export default function ReportesPage() {
  const [data, setData] = useState<ReportesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<'progreso' | 'calificaciones'>(
    'progreso'
  );

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        const res = await apiClient.get<ReportesData>('/admin/reportes');
        setData(res);
      } catch (err) {
        setError('Error al cargar los reportes');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportes();
  }, []);

  // Exportar a CSV
  const exportarCSV = (tipo: 'progreso' | 'calificaciones') => {
    const download = async () => {
      try {
        const authRaw = localStorage.getItem('martinez-auth');
        const token = authRaw ? JSON.parse(authRaw)?.state?.token : null;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${baseUrl}/admin/reportes/csv?tipo=${tipo}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error('No se pudo exportar el CSV');
        }

        const blob = await response.blob();
        const disposition = response.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="?([^"]+)"?/i);
        const filename = match?.[1] || `reporte-${tipo}.csv`;

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('[ReportesPage] Error exportando CSV', error);
        setError('No se pudo exportar el CSV');
      }
    };

    void download();
  };

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analíticas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Intentos, promedios y calificaciones del equipo
          </p>
        </div>
        <button
          onClick={() => exportarCSV(tabActiva)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {(['progreso', 'calificaciones'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tabActiva === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'progreso' ? 'Capacitación' : 'Calificaciones QR'}
          </button>
        ))}
      </div>

      {/* Tabla de progreso */}
      {tabActiva === 'progreso' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Vista mobile — cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {data?.progreso.map((row) => (
              <div key={row.email} className="px-4 py-3 flex flex-col gap-1">
                <p className="font-semibold text-gray-900 text-sm">{row.vendedor}</p>
                <p className="text-xs text-gray-400">{row.email}</p>
                <div className="flex gap-4 mt-1 flex-wrap">
                  <span className="text-xs text-gray-500">
                    Módulos: <strong className="text-gray-900">{row.modulosAprobados}/{row.totalModulos}</strong>
                  </span>
                  <span className="text-xs text-gray-500">
                    Promedio: <strong className="text-gray-900">{row.promedioNotas > 0 ? `${row.promedioNotas.toFixed(1)}%` : '—'}</strong>
                  </span>
                  <span className="text-xs text-gray-500">
                    Intentos: <strong className="text-gray-900">{row.totalIntentos}</strong>
                  </span>
                </div>
                {row.fechaUltimaActividad && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Última actividad: {new Date(row.fechaUltimaActividad).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Vista desktop — tabla completa */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendedor</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Módulos</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Promedio examen</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Intentos</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Última actividad</th>
                </tr>
              </thead>
              <tbody>
                {data?.progreso.map((row, index) => (
                  <tr key={row.email} className={index !== 0 ? 'border-t border-gray-100' : ''}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{row.vendedor}</p>
                      <p className="text-xs text-gray-400">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      <span className="font-semibold">{row.modulosAprobados}/{row.totalModulos}</span>
                      <span className="text-gray-400 text-xs ml-1">({row.porcentaje}%)</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${row.promedioNotas >= 70 ? 'text-green-700' : row.promedioNotas > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                        {row.promedioNotas > 0 ? `${row.promedioNotas.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${row.totalIntentos > row.totalModulos ? 'text-amber-700' : 'text-gray-900'}`}>
                        {row.totalIntentos}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {row.fechaUltimaActividad ? new Date(row.fechaUltimaActividad).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de calificaciones */}
      {tabActiva === 'calificaciones' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Vista mobile — cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {data?.calificaciones.map((row) => (
              <div key={row.email} className="px-4 py-3 flex flex-col gap-1">
                <p className="font-semibold text-gray-900 text-sm">{row.vendedor}</p>
                <p className="text-xs text-gray-400">{row.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-amber-400">★</span>
                  <span className="text-sm font-bold text-gray-900">
                    Vendedor {row.promedioVendedor > 0 ? row.promedioVendedor.toFixed(1) : '—'}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    · Empresa {row.promedioEmpresa > 0 ? row.promedioEmpresa.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs text-gray-400">
                    · {row.totalCalificaciones} calificaciones
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                  <span>Vend. ★★★★★ {row.vendedor5}</span>
                  <span>Emp. ★★★★★ {row.empresa5}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Vista desktop — tabla completa */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendedor</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Promedio vendedor</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Promedio empresa</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vend. ★★★★★</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Emp. ★★★★★</th>
                </tr>
              </thead>
              <tbody>
                {data?.calificaciones.map((row, index) => (
                  <tr key={row.email} className={index !== 0 ? 'border-t border-gray-100' : ''}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{row.vendedor}</p>
                      <p className="text-xs text-gray-400">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-amber-400 text-sm">★</span>
                        <span className="font-semibold text-gray-900">{row.promedioVendedor > 0 ? row.promedioVendedor.toFixed(1) : '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-amber-400 text-sm">★</span>
                        <span className="font-semibold text-gray-900">{row.promedioEmpresa > 0 ? row.promedioEmpresa.toFixed(1) : '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{row.totalCalificaciones}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{row.vendedor5}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{row.empresa5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}