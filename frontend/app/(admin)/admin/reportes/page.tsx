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
  totalCalificaciones: number;
  estrellas5: number;
  estrellas4: number;
  estrellas3: number;
  estrellas2: number;
  estrellas1: number;
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
    if (!data) return;

    let headers: string[];
    let rows: string[][];

    if (tipo === 'progreso') {
      headers = [
        'Vendedor',
        'Email',
        'Módulos aprobados',
        'Total módulos',
        'Porcentaje',
        'Promedio notas',
        'Total intentos',
        'Última actividad',
      ];
      rows = data.progreso.map((r) => [
        r.vendedor,
        r.email,
        r.modulosAprobados.toString(),
        r.totalModulos.toString(),
        `${r.porcentaje}%`,
        r.promedioNotas > 0 ? `${r.promedioNotas.toFixed(1)}%` : '—',
        r.totalIntentos.toString(),
        r.fechaUltimaActividad
          ? new Date(r.fechaUltimaActividad).toLocaleDateString('es-AR')
          : '—',
      ]);
    } else {
      headers = [
        'Vendedor',
        'Email',
        'Promedio',
        'Total calificaciones',
        '5 estrellas',
        '4 estrellas',
        '3 estrellas',
        '2 estrellas',
        '1 estrella',
      ];
      rows = data.calificaciones.map((r) => [
        r.vendedor,
        r.email,
        r.promedio.toFixed(1),
        r.totalCalificaciones.toString(),
        r.estrellas5.toString(),
        r.estrellas4.toString(),
        r.estrellas3.toString(),
        r.estrellas2.toString(),
        r.estrellas1.toString(),
      ]);
    }

    // Construir CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Descargar
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${tipo}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Exportá los datos en formato CSV
          </p>
        </div>
        <button
          onClick={() => exportarCSV(tabActiva)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform"
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
            {tab === 'progreso' ? 'Progreso' : 'Calificaciones'}
          </button>
        ))}
      </div>

      {/* Tabla de progreso */}
      {tabActiva === 'progreso' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Vendedor
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Módulos
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Progreso
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Promedio
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Intentos
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Última actividad
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.progreso.map((row, index) => (
                <tr
                  key={row.email}
                  className={index !== 0 ? 'border-t border-gray-100' : ''}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{row.vendedor}</p>
                    <p className="text-xs text-gray-400">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {row.modulosAprobados}/{row.totalModulos}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-gray-900 rounded-full"
                          style={{ width: `${row.porcentaje}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">
                        {row.porcentaje}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {row.promedioNotas > 0
                      ? `${row.promedioNotas.toFixed(1)}%`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {row.totalIntentos}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">
                    {row.fechaUltimaActividad
                      ? new Date(row.fechaUltimaActividad).toLocaleDateString(
                          'es-AR',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )
                      : '—'}
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
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Vendedor
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Promedio
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  ★★★★★
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  ★★★★
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  ★★★
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  ★★
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  ★
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.calificaciones.map((row, index) => (
                <tr
                  key={row.email}
                  className={index !== 0 ? 'border-t border-gray-100' : ''}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{row.vendedor}</p>
                    <p className="text-xs text-gray-400">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-amber-400 text-sm">★</span>
                      <span className="font-semibold text-gray-900">
                        {row.promedio > 0 ? row.promedio.toFixed(1) : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {row.totalCalificaciones}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {row.estrellas5}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {row.estrellas4}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {row.estrellas3}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {row.estrellas2}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {row.estrellas1}
                  </td>
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