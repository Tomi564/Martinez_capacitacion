/**
 * admin/ventas/page.tsx — Panel de atenciones registradas por vendedores
 *
 * Muestra todas las atenciones con filtros por vendedor y resultado.
 */

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Atencion {
  id: string;
  canal: string;
  resultado: string;
  producto: string | null;
  monto: number | null;
  observaciones: string | null;
  created_at: string;
  users: {
    nombre: string;
    apellido: string;
    email: string;
  } | null;
}

const RESULTADO_LABEL: Record<string, string> = {
  venta:          'Venta cerrada',
  sin_venta:      'Sin venta',
  en_seguimiento: 'Pendiente',
};

const RESULTADO_STYLE: Record<string, string> = {
  venta:          'bg-green-100 text-green-700',
  sin_venta:      'bg-red-100 text-red-600',
  en_seguimiento: 'bg-amber-100 text-amber-700',
};

const CANAL_LABEL: Record<string, string> = {
  whatsapp:  'WhatsApp',
  mercadolibre: 'Mercado Libre',
  instagram: 'Instagram',
  presencial:'Presencial',
  telefono:  'Teléfono',
  otro:      'Otro',
};

export default function VentasAdminPage() {
  const [atenciones, setAtenciones] = useState<Atencion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroVendedor, setFiltroVendedor] = useState('todos');
  const [filtroResultado, setFiltroResultado] = useState('todos');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get<{ atenciones: Atencion[] }>(
          '/atenciones/todas'
        );
        setAtenciones(res.atenciones);
      } catch {
        setError('Error al cargar las atenciones');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  // Lista de vendedores únicos para el filtro
  const vendedores = Array.from(
    new Map(
      atenciones
        .filter(a => a.users)
        .map(a => [
          a.users!.email,
          { email: a.users!.email, nombre: `${a.users!.nombre} ${a.users!.apellido}` },
        ])
    ).values()
  );

  const filtradas = atenciones.filter(a => {
    const matchVendedor = filtroVendedor === 'todos' || a.users?.email === filtroVendedor;
    const matchResultado = filtroResultado === 'todos' || a.resultado === filtroResultado;
    return matchVendedor && matchResultado;
  });

  const totalMonto = filtradas
    .filter(a => a.monto)
    .reduce((acc, a) => acc + (a.monto || 0), 0);

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
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-5xl mx-auto">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Atenciones registradas por el equipo de vendedores
        </p>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total registradas', value: filtradas.length, color: 'text-gray-900' },
          { label: 'Ventas cerradas',   value: filtradas.filter(a => a.resultado === 'venta').length,          color: 'text-green-600' },
          { label: 'Pendientes',        value: filtradas.filter(a => a.resultado === 'en_seguimiento').length,  color: 'text-amber-600' },
          {
            label: 'Monto total',
            value: totalMonto > 0
              ? `$${totalMonto.toLocaleString('es-AR')}`
              : '—',
            color: 'text-blue-600',
          },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Filtro vendedor */}
        <select
          value={filtroVendedor}
          onChange={e => setFiltroVendedor(e.target.value)}
          className="h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 flex-1"
        >
          <option value="todos">Todos los vendedores</option>
          {vendedores.map(v => (
            <option key={v.email} value={v.email}>{v.nombre}</option>
          ))}
        </select>

        {/* Filtro resultado */}
        <select
          value={filtroResultado}
          onChange={e => setFiltroResultado(e.target.value)}
          className="h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 sm:w-52"
        >
          <option value="todos">Todos los resultados</option>
          <option value="venta">Venta cerrada</option>
          <option value="en_seguimiento">Pendiente</option>
          <option value="sin_venta">Sin venta</option>
        </select>
      </div>

      {/* Lista — cards mobile, tabla desktop */}
      {filtradas.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">No hay atenciones con los filtros seleccionados</p>
        </div>
      ) : (
        <>
          {/* Cards — mobile */}
          <div className="flex flex-col gap-3 lg:hidden">
            {filtradas.map(a => (
              <div key={a.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {a.users ? `${a.users.nombre} ${a.users.apellido}` : '—'}
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${RESULTADO_STYLE[a.resultado] || 'bg-gray-100 text-gray-500'}`}>
                    {RESULTADO_LABEL[a.resultado] || a.resultado}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>{CANAL_LABEL[a.canal] || a.canal}</span>
                  {a.producto && <span>{a.producto}</span>}
                  {a.monto && <span className="text-green-600 font-semibold">${a.monto.toLocaleString('es-AR')}</span>}
                </div>
                {a.observaciones && (
                  <p className="text-xs text-gray-400 italic">{a.observaciones}</p>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(a.created_at).toLocaleDateString('es-AR', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>

          {/* Tabla — desktop */}
          <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendedor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Canal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Resultado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((a, i) => (
                  <tr key={a.id} className={i !== 0 ? 'border-t border-gray-100' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {a.users ? `${a.users.nombre} ${a.users.apellido}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{CANAL_LABEL[a.canal] || a.canal}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{a.producto || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RESULTADO_STYLE[a.resultado] || 'bg-gray-100 text-gray-500'}`}>
                        {RESULTADO_LABEL[a.resultado] || a.resultado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">
                      {a.monto ? `$${a.monto.toLocaleString('es-AR')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(a.created_at).toLocaleDateString('es-AR', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
