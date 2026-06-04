'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { SelectorSucursal } from '@/components/admin/SelectorSucursal';
import { formatMonto } from '@/lib/format';
import { appendSucursalQuery } from '@/lib/sucursales';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Estadisticas {
  ventasPorSemana: { semana: string; ventas: number; monto: number }[];
  moduloStats: { modulo: string; titulo: string; aprobados: number; reprobados: number }[];
  conversionPorVendedor: { nombre: string; tasa: number; ventas: number; total: number }[];
  montoPorMes: { mes: string; monto: number; ventas: number }[];
}

export default function EstadisticasPage() {
  const [data, setData] = useState<Estadisticas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [filtroSucursal, setFiltroSucursal] = useState('');

  const cargar = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoading(true);
    try {
      const res = await apiClient.get<Estadisticas>(
        appendSucursalQuery('/admin/estadisticas', filtroSucursal),
      );
      setData(res);
      setLoadError(null);
    } catch (err) {
      console.error('[Estadisticas] Error cargando datos', err);
      const mensaje =
        err instanceof Error && err.message
          ? err.message
          : 'No pudimos cargar las estadísticas. Reintentá o revisá la conexión.';
      setLoadError(mensaje);
    } finally {
      if (!opts?.silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarga al cambiar sucursal
  }, [filtroSucursal]);

  const reintentar = async () => {
    setRetrying(true);
    try {
      await cargar({ silent: true });
    } finally {
      setRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
        <div
          role="alert"
          className="p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-4"
        >
          <div>
            <h1 className="text-xl font-bold text-gray-900">Estadísticas</h1>
            <p className="text-sm text-red-800 font-medium mt-2">No pudimos cargar los datos</p>
            <p className="text-sm text-red-700 mt-1">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => void reintentar()}
            disabled={retrying}
            className="self-start px-4 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {retrying ? 'Cargando...' : 'Reintentar'}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
        <p className="text-sm text-gray-600">No hay datos para mostrar.</p>
        <button
          type="button"
          onClick={() => void reintentar()}
          className="mt-3 px-4 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm font-semibold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const totalVentasHistorico = data.ventasPorSemana.reduce((acc, s) => acc + s.ventas, 0);
  const totalMontoHistorico = data.montoPorMes.reduce((acc, m) => acc + m.monto, 0);
  const totalAprobados = data.moduloStats.reduce((acc, m) => acc + m.aprobados, 0);

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-8 max-w-4xl mx-auto">

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Resumen de ventas, módulos y equipo</p>
        </div>
        <SelectorSucursal
          modo="filtro"
          value={filtroSucursal}
          onChange={setFiltroSucursal}
          className="sm:w-56"
        />
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{totalVentasHistorico}</p>
          <p className="text-xs text-gray-500 mt-0.5">ventas (8 sem.)</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-green-600">{formatMonto(totalMontoHistorico)}</p>
          <p className="text-xs text-gray-500 mt-0.5">facturado (6 meses)</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{totalAprobados}</p>
          <p className="text-xs text-gray-500 mt-0.5">módulos aprobados</p>
        </div>
      </div>

      {/* Ventas por semana */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Ventas por semana (últimas 8)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.ventasPorSemana} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(val) => [`${val} ventas`]}
            />
            <Line
              type="monotone"
              dataKey="ventas"
              stroke="#111827"
              strokeWidth={2.5}
              dot={{ fill: '#111827', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monto acumulado por mes */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Facturación mensual (últimos 6 meses)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.montoPorMes} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="montoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111827" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#111827" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatMonto} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(val) => [`$${Number(val).toLocaleString('es-AR')}`]}
            />
            <Area
              type="monotone"
              dataKey="monto"
              stroke="#111827"
              strokeWidth={2.5}
              fill="url(#montoGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Módulos: aprobados vs reprobados */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Módulos — aprobados vs intentos fallidos</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.moduloStats} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="modulo" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="aprobados" name="Aprobados" fill="#111827" radius={[4, 4, 0, 0]} />
            <Bar dataKey="reprobados" name="Fallidos" fill="#d1d5db" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversión por vendedor */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Tasa de conversión por vendedor</h2>
        {data.conversionPorVendedor.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin datos suficientes aún</p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.conversionPorVendedor.map((v) => (
              <div key={v.nombre}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">{v.nombre}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{v.ventas}/{v.total} ventas</span>
                    <span className="text-sm font-bold text-gray-900">{v.tasa}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 rounded-full transition-all duration-500"
                    style={{ width: `${v.tasa}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
