/**
 * admin/reportes/page.tsx — Reportes y exportación
 *
 * Muestra:
 *  - Reporte de progreso general
 *  - Reporte de calificaciones QR
 *  - Botones de exportación CSV
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api';
import { ConfirmarEliminacionModal } from '@/components/admin/ConfirmarEliminacionModal';
import { SelectorSucursal } from '@/components/admin/SelectorSucursal';
import { appendSucursalQuery } from '@/lib/sucursales';
import { TabRevisionExamenes } from '@/components/admin/TabRevisionExamenes';

interface CalificacionQrDetalle {
  id: string;
  estrellas_vendedor: number;
  estrellas_empresa: number;
  comentario: string | null;
  created_at: string;
  users: { nombre: string; apellido: string; email: string } | null;
}

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

interface VendedorBloqueado {
  vendedorId: string;
  vendedorNombre: string;
  vendedorEmail: string;
  moduloId: string;
  moduloTitulo: string;
  moduloOrden: number;
  intentos: number;
  estado: string;
}

interface VelocidadCapacitacion {
  userId: string;
  vendedor: string;
  promedioExamenMinutos: number | null;
  tiempoTotalProgramaDias: number | null;
  moduloMasRapido: string | null;
  moduloMasLento: string | null;
}

interface ReporteTallerEmpleado {
  empleado_id: string;
  nombre: string;
  apellido: string;
  rol: 'gomero' | 'mecanico';
  rolLabel: string;
  promedio: number;
  total: number;
  comentarios: {
    id: string;
    estrellas: number;
    comentario: string | null;
    created_at: string;
  }[];
}

type TabAnaliticas = 'progreso' | 'calificaciones' | 'bloqueados' | 'velocidad' | 'taller' | 'revision';

type VelocidadSortKey =
  | 'vendedor'
  | 'promedioExamenMinutos'
  | 'moduloMasRapido'
  | 'moduloMasLento'
  | 'tiempoTotalProgramaDias';

const TAB_LABELS: Record<TabAnaliticas, string> = {
  progreso: 'Capacitación',
  calificaciones: 'Calificaciones QR',
  bloqueados: 'Bloqueados',
  velocidad: 'Velocidad',
  taller: 'Taller',
  revision: 'Revisión pendiente',
};

function compareVelocidad(
  a: VelocidadCapacitacion,
  b: VelocidadCapacitacion,
  key: VelocidadSortKey,
  dir: 'asc' | 'desc'
): number {
  const mul = dir === 'asc' ? 1 : -1;
  if (key === 'vendedor') {
    return mul * a.vendedor.localeCompare(b.vendedor, 'es');
  }
  if (key === 'moduloMasRapido' || key === 'moduloMasLento') {
    const av = a[key] ?? '';
    const bv = b[key] ?? '';
    if (!av && !bv) return 0;
    if (!av) return 1;
    if (!bv) return -1;
    return mul * av.localeCompare(bv, 'es');
  }
  const av = a[key];
  const bv = b[key];
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  return mul * (av - bv);
}

export default function ReportesPage() {
  const [data, setData] = useState<ReportesData | null>(null);
  const [vendedoresBloqueados, setVendedoresBloqueados] = useState<VendedorBloqueado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorReportes, setErrorReportes] = useState<string | null>(null);
  const [errorBloqueados, setErrorBloqueados] = useState<string | null>(null);
  const [csvExportError, setCsvExportError] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<TabAnaliticas>('progreso');
  const [resetKey, setResetKey] = useState<string | null>(null);
  const [velocidad, setVelocidad] = useState<VelocidadCapacitacion[]>([]);
  const [isLoadingVelocidad, setIsLoadingVelocidad] = useState(false);
  const [errorVelocidad, setErrorVelocidad] = useState<string | null>(null);
  const [velocidadSortKey, setVelocidadSortKey] = useState<VelocidadSortKey>('vendedor');
  const [velocidadSortDir, setVelocidadSortDir] = useState<'asc' | 'desc'>('asc');
  const [calificacionesDetalle, setCalificacionesDetalle] = useState<CalificacionQrDetalle[]>([]);
  const [isLoadingCalificacionesDetalle, setIsLoadingCalificacionesDetalle] = useState(false);
  const [calificacionAEliminar, setCalificacionAEliminar] = useState<CalificacionQrDetalle | null>(null);
  const [eliminandoCalificacion, setEliminandoCalificacion] = useState(false);
  const [msgEliminar, setMsgEliminar] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [tallerEmpleados, setTallerEmpleados] = useState<ReporteTallerEmpleado[]>([]);
  const [isLoadingTaller, setIsLoadingTaller] = useState(false);
  const [errorTaller, setErrorTaller] = useState<string | null>(null);
  const [filtroSucursal, setFiltroSucursal] = useState('');

  const loadBloqueados = useCallback(async () => {
    const res = await apiClient.get<{ vendedoresBloqueados: VendedorBloqueado[] }>(
      '/admin/vendedores-bloqueados'
    );
    setVendedoresBloqueados(res.vendedoresBloqueados);
  }, []);

  const loadVelocidad = useCallback(async () => {
    setIsLoadingVelocidad(true);
    setErrorVelocidad(null);
    try {
      const res = await apiClient.get<{ velocidad: VelocidadCapacitacion[] }>(
        appendSucursalQuery('/admin/reportes/velocidad', filtroSucursal),
      );
      setVelocidad(res.velocidad || []);
    } catch (err) {
      console.error('[ReportesPage] Error cargando velocidad', err);
      setErrorVelocidad(
        'No se pudo cargar la velocidad de capacitación. Verificá que la función admin_velocidad_capacitacion esté aplicada en Supabase.'
      );
      setVelocidad([]);
    } finally {
      setIsLoadingVelocidad(false);
    }
  }, [filtroSucursal]);

  const loadCalificacionesDetalle = useCallback(async () => {
    setIsLoadingCalificacionesDetalle(true);
    try {
      const res = await apiClient.get<{ calificaciones: CalificacionQrDetalle[] }>(
        appendSucursalQuery('/admin/calificaciones-qr?limit=100', filtroSucursal),
      );
      setCalificacionesDetalle(res.calificaciones || []);
    } catch (err) {
      console.error('[ReportesPage] Error cargando calificaciones QR', err);
      setCalificacionesDetalle([]);
    } finally {
      setIsLoadingCalificacionesDetalle(false);
    }
  }, [filtroSucursal]);

  const loadTaller = useCallback(async () => {
    setIsLoadingTaller(true);
    setErrorTaller(null);
    try {
      const res = await apiClient.get<{ empleados: ReporteTallerEmpleado[] }>(
        appendSucursalQuery('/admin/calificaciones-taller', filtroSucursal),
      );
      setTallerEmpleados(res.empleados || []);
    } catch (err) {
      console.error('[ReportesPage] Error cargando calificaciones taller', err);
      setErrorTaller(
        'No se pudieron cargar las calificaciones del taller. Verificá que la migración 036 esté aplicada en Supabase.',
      );
      setTallerEmpleados([]);
    } finally {
      setIsLoadingTaller(false);
    }
  }, [filtroSucursal]);

  useEffect(() => {
    if (tabActiva === 'velocidad') {
      void loadVelocidad();
    }
    if (tabActiva === 'calificaciones') {
      void loadCalificacionesDetalle();
    }
    if (tabActiva === 'taller') {
      void loadTaller();
    }
  }, [tabActiva, filtroSucursal, loadVelocidad, loadCalificacionesDetalle, loadTaller]);

  const fetchReportesRefresh = useCallback(async () => {
    try {
      const reportesRes = await apiClient.get<ReportesData>(
        appendSucursalQuery('/admin/reportes', filtroSucursal),
      );
      setData(reportesRes);
    } catch {
      /* el resumen agregado puede quedar desactualizado hasta recargar */
    }
  }, [filtroSucursal]);

  const confirmarEliminarCalificacion = async () => {
    const c = calificacionAEliminar;
    if (!c) return;
    setEliminandoCalificacion(true);
    setMsgEliminar(null);
    try {
      await apiClient.delete(`/admin/calificaciones-qr/${c.id}`);
      setCalificacionAEliminar(null);
      setMsgEliminar({ tipo: 'ok', texto: 'Calificación eliminada' });
      await Promise.all([loadCalificacionesDetalle(), fetchReportesRefresh()]);
      setTimeout(() => setMsgEliminar(null), 4000);
    } catch (err) {
      const texto =
        err instanceof ApiError ? err.message : 'No se pudo eliminar la calificación';
      setMsgEliminar({ tipo: 'error', texto });
    } finally {
      setEliminandoCalificacion(false);
    }
  };

  const velocidadOrdenada = useMemo(
    () =>
      [...velocidad].sort((a, b) =>
        compareVelocidad(a, b, velocidadSortKey, velocidadSortDir)
      ),
    [velocidad, velocidadSortKey, velocidadSortDir]
  );

  const toggleVelocidadSort = (key: VelocidadSortKey) => {
    if (velocidadSortKey === key) {
      setVelocidadSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setVelocidadSortKey(key);
      setVelocidadSortDir(key === 'vendedor' ? 'asc' : 'desc');
    }
  };

  const sortIndicator = (key: VelocidadSortKey) => {
    if (velocidadSortKey !== key) return ' ↕';
    return velocidadSortDir === 'asc' ? ' ↑' : ' ↓';
  };

  useEffect(() => {
    const fetchReportes = async () => {
      setIsLoading(true);
      setErrorReportes(null);
      setErrorBloqueados(null);

      const reqReportes = apiClient
        .get<ReportesData>(appendSucursalQuery('/admin/reportes', filtroSucursal))
        .then((reportesRes) => setData(reportesRes))
        .catch((err) => {
          console.error('[ReportesPage] Error cargando reportes', err);
          setErrorReportes(
            'No se pudieron cargar capacitación ni calificaciones. Podés reintentar desde acá o revisar la conexión.'
          );
        });

      const reqBloqueados = loadBloqueados().catch((err) => {
        console.error('[ReportesPage] Error cargando bloqueados', err);
        setErrorBloqueados('No se pudo cargar la lista de vendedores bloqueados.');
      });

      await Promise.all([reqReportes, reqBloqueados]);
      setIsLoading(false);
    };

    void fetchReportes();
  }, [loadBloqueados, filtroSucursal]);

  const handleResetIntentos = async (item: VendedorBloqueado) => {
    const confirmar = window.confirm(
      `¿Permitir un nuevo intento a ${item.vendedorNombre} en "${item.moduloTitulo}"?\n\n` +
        `Se reiniciará el contador de intentos a 0 y el módulo quedará disponible.`
    );
    if (!confirmar) return;

    const key = `${item.vendedorId}:${item.moduloId}`;
    setResetKey(key);
    try {
      await apiClient.post(
        `/admin/vendedores/${item.vendedorId}/modulos/${item.moduloId}/reset-intentos`,
        {}
      );
      await loadBloqueados();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al resetear los intentos');
    } finally {
      setResetKey(null);
    }
  };

  // Exportar a CSV
  const exportarCSV = (tipo: 'progreso' | 'calificaciones') => {
    const download = async () => {
      setCsvExportError(null);
      try {
        const authRaw = localStorage.getItem('martinez-auth');
        const token = authRaw ? JSON.parse(authRaw)?.state?.token : null;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const csvUrl = appendSucursalQuery(
          `${baseUrl}/admin/reportes/csv?tipo=${tipo}`,
          filtroSucursal,
        );
        const response = await fetch(csvUrl, {
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
        setCsvExportError('No se pudo exportar el CSV');
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

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-6xl mx-auto">

      {csvExportError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" role="alert">
          {csvExportError}
        </div>
      )}

      {msgEliminar && (
        <div
          className={`p-3 rounded-xl text-sm ${
            msgEliminar.tipo === 'ok'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
        >
          {msgEliminar.texto}
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analíticas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Intentos, promedios y calificaciones del equipo
          </p>
        </div>
        <SelectorSucursal
          modo="filtro"
          value={filtroSucursal}
          onChange={setFiltroSucursal}
          className="sm:w-56"
        />
        {tabActiva !== 'bloqueados' && tabActiva !== 'velocidad' && tabActiva !== 'taller' && tabActiva !== 'revision' && (
        <button
          onClick={() => exportarCSV(tabActiva as 'progreso' | 'calificaciones')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar CSV
        </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {(['progreso', 'calificaciones', 'bloqueados', 'velocidad', 'taller', 'revision'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tabActiva === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABELS[tab]}
            {tab === 'bloqueados' && vendedoresBloqueados.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                {vendedoresBloqueados.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla de progreso */}
      {tabActiva === 'progreso' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {errorReportes && (
            <div className="p-4 bg-amber-50 border-b border-amber-100 text-sm text-amber-900" role="alert">
              {errorReportes}
            </div>
          )}
          {/* Vista mobile — cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {(data?.progreso ?? []).map((row) => (
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
                {(data?.progreso ?? []).map((row, index) => (
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

      {/* Velocidad de capacitación */}
      {tabActiva === 'velocidad' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {errorVelocidad && (
            <div className="p-4 bg-amber-50 border-b border-amber-100 text-sm text-amber-900" role="alert">
              {errorVelocidad}
            </div>
          )}
          <p className="px-4 pt-4 text-xs text-gray-500">
            Tiempo de examen: promedio de intentos aprobados. Módulos rápido/lento: desde la primera apertura
            hasta la aprobación (requiere <code className="text-gray-600">iniciado_at</code>). Programa completo:
            todos los módulos activos aprobados.
          </p>
          {isLoadingVelocidad ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="lg:hidden divide-y divide-gray-100 mt-2">
                {velocidadOrdenada.map((row) => (
                  <div key={row.userId} className="px-4 py-3 flex flex-col gap-1.5">
                    <Link
                      href={`/admin/vendedores/${row.userId}`}
                      className="font-semibold text-gray-900 text-sm hover:underline"
                    >
                      {row.vendedor}
                    </Link>
                    <p className="text-xs text-gray-500">
                      Examen (prom.):{' '}
                      <strong className="text-gray-800">
                        {row.promedioExamenMinutos != null ? `${row.promedioExamenMinutos} min` : '—'}
                      </strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      Programa:{' '}
                      <strong className="text-gray-800">
                        {row.tiempoTotalProgramaDias != null
                          ? `${row.tiempoTotalProgramaDias} días`
                          : '—'}
                      </strong>
                    </p>
                    {row.moduloMasRapido && (
                      <p className="text-xs text-green-700">↑ {row.moduloMasRapido}</p>
                    )}
                    {row.moduloMasLento && (
                      <p className="text-xs text-amber-800">↓ {row.moduloMasLento}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="hidden lg:block overflow-x-auto mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleVelocidadSort('vendedor')}
                          className="text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800"
                        >
                          Vendedor{sortIndicator('vendedor')}
                        </button>
                      </th>
                      <th className="text-center px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleVelocidadSort('promedioExamenMinutos')}
                          className="text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800"
                        >
                          Examen (prom.){sortIndicator('promedioExamenMinutos')}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleVelocidadSort('moduloMasRapido')}
                          className="text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800"
                        >
                          Más rápido{sortIndicator('moduloMasRapido')}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleVelocidadSort('moduloMasLento')}
                          className="text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800"
                        >
                          Más lento{sortIndicator('moduloMasLento')}
                        </button>
                      </th>
                      <th className="text-center px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleVelocidadSort('tiempoTotalProgramaDias')}
                          className="text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800"
                        >
                          Programa completo{sortIndicator('tiempoTotalProgramaDias')}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {velocidadOrdenada.map((row, index) => (
                      <tr
                        key={row.userId}
                        className={index !== 0 ? 'border-t border-gray-100' : ''}
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/vendedores/${row.userId}`}
                            className="font-semibold text-gray-900 hover:underline"
                          >
                            {row.vendedor}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {row.promedioExamenMinutos != null
                            ? `${row.promedioExamenMinutos} min`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px]">
                          {row.moduloMasRapido ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px]">
                          {row.moduloMasLento ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {row.tiempoTotalProgramaDias != null
                            ? `${row.tiempoTotalProgramaDias} días`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Vendedores bloqueados */}
      {tabActiva === 'bloqueados' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          {errorBloqueados && (
            <div className="p-3 mb-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900" role="alert">
              {errorBloqueados}
            </div>
          )}
          <p className="text-xs text-gray-500 mb-4">
            Vendedores que agotaron los 3 intentos en un módulo sin aprobar. Podés habilitar un nuevo intento desde acá.
          </p>
          {vendedoresBloqueados.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No hay vendedores bloqueados por intentos en este momento.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {vendedoresBloqueados.map((item) => {
                const rowKey = `${item.vendedorId}:${item.moduloId}`;
                return (
                  <div
                    key={rowKey}
                    className="border border-gray-100 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/vendedores/${item.vendedorId}`}
                        className="text-sm font-semibold text-gray-900 hover:underline"
                      >
                        {item.vendedorNombre}
                      </Link>
                      <p className="text-xs text-gray-500 truncate">{item.vendedorEmail}</p>
                      <p className="text-sm text-gray-700 mt-1">
                        Módulo {item.moduloOrden}: {item.moduloTitulo}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                        {item.intentos} intentos
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResetIntentos(item)}
                        disabled={resetKey === rowKey}
                        className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#C8102E] text-white disabled:opacity-50 active:scale-95 transition-transform"
                      >
                        {resetKey === rowKey ? 'Procesando...' : 'Permitir nuevo intento'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tabla de calificaciones */}
      {tabActiva === 'calificaciones' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {errorReportes && (
            <div className="p-4 bg-amber-50 border-b border-amber-100 text-sm text-amber-900" role="alert">
              {errorReportes}
            </div>
          )}
          {/* Vista mobile — cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {(data?.calificaciones ?? []).map((row) => (
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
                {(data?.calificaciones ?? []).map((row, index) => (
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

      {tabActiva === 'calificaciones' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Valoraciones individuales</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Podés eliminar calificaciones de prueba. Los promedios de arriba se actualizan al borrar.
            </p>
          </div>
          {isLoadingCalificacionesDetalle ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : calificacionesDetalle.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay calificaciones registradas.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {calificacionesDetalle.map((c) => {
                const vendedor = c.users
                  ? `${c.users.nombre} ${c.users.apellido}`
                  : 'Vendedor desconocido';
                return (
                  <div
                    key={c.id}
                    className="px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 overflow-hidden"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 break-words">{vendedor}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Vendedor {c.estrellas_vendedor}★ · Empresa {c.estrellas_empresa}★ ·{' '}
                        {new Date(c.created_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {c.comentario && (
                        <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">{c.comentario}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCalificacionAEliminar(c)}
                      className="text-xs px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium shrink-0 self-end sm:self-center whitespace-nowrap"
                    >
                      Eliminar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tabActiva === 'taller' && (
        <div className="flex flex-col gap-4">
          {errorTaller && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900" role="alert">
              {errorTaller}
            </div>
          )}

          {isLoadingTaller ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tallerEmpleados.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-400">No hay empleados del taller o aún no recibieron calificaciones.</p>
            </div>
          ) : (
            tallerEmpleados.map((e) => (
              <div key={e.empleado_id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {e.nombre} {e.apellido}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{e.rolLabel}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 text-sm">★</span>
                      <span className="text-lg font-bold text-gray-900">
                        {e.total > 0 ? e.promedio.toFixed(1) : '—'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {e.total} {e.total === 1 ? 'calificación' : 'calificaciones'}
                    </span>
                  </div>
                </div>

                {e.comentarios.length === 0 ? (
                  <p className="text-sm text-gray-400 px-4 py-6 text-center">Sin comentarios aún.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {e.comentarios.map((c) => (
                      <div key={c.id} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-900">{c.estrellas}★</span>
                          <span className="text-xs text-gray-400">
                            {new Date(c.created_at).toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {c.comentario ? (
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{c.comentario}</p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1 italic">Sin comentario</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tabActiva === 'revision' && <TabRevisionExamenes />}

      <ConfirmarEliminacionModal
        open={!!calificacionAEliminar}
        titulo="¿Eliminar esta calificación QR?"
        descripcion={
          calificacionAEliminar ? (
            <>
              Se borrará la valoración de{' '}
              <span className="font-semibold text-gray-900">
                {calificacionAEliminar.users
                  ? `${calificacionAEliminar.users.nombre} ${calificacionAEliminar.users.apellido}`
                  : 'vendedor'}
              </span>{' '}
              ({calificacionAEliminar.estrellas_vendedor}★ vendedor,{' '}
              {calificacionAEliminar.estrellas_empresa}★ empresa).
            </>
          ) : null
        }
        eliminando={eliminandoCalificacion}
        onCancelar={() => setCalificacionAEliminar(null)}
        onConfirmar={confirmarEliminarCalificacion}
        idTitulo="eliminar-calificacion-titulo"
      />

    </div>
  );
}