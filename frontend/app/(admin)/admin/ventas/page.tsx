/**
 * admin/ventas/page.tsx — Panel de atenciones registradas por vendedores
 *
 * Muestra todas las atenciones con filtros por vendedor y resultado.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api';
import { ConfirmarEliminacionModal } from '@/components/admin/ConfirmarEliminacionModal';

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
  venta_cerrada:  'Venta cerrada',
  no_venta:       'Sin venta',
  pendiente:      'Pendiente',
};

const RESULTADO_STYLE: Record<string, string> = {
  venta_cerrada:  'bg-green-100 text-green-700',
  no_venta:       'bg-red-100 text-red-600',
  pendiente:      'bg-amber-100 text-amber-700',
};

const CANAL_LABEL: Record<string, string> = {
  whatsapp:  'WhatsApp',
  mercadolibre: 'Mercado Libre',
  instagram: 'Instagram',
  presencial:'Presencial',
  telefono:  'Teléfono',
  otro:      'Otro',
};

function BotonEliminar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="text-xs px-2.5 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium shrink-0"
    >
      Eliminar
    </button>
  );
}

export default function VentasAdminPage() {
  const [atenciones, setAtenciones] = useState<Atencion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroVendedor, setFiltroVendedor] = useState('todos');
  const [filtroResultado, setFiltroResultado] = useState('todos');
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [atencionAEliminar, setAtencionAEliminar] = useState<Atencion | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarAtenciones = useCallback(async () => {
    try {
      const res = await apiClient.get<{ atenciones: Atencion[] }>('/atenciones/todas');
      setAtenciones(res.atenciones);
      setError(null);
    } catch {
      setError('Error al cargar las atenciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarAtenciones();
  }, [cargarAtenciones]);

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

  const confirmarEliminar = async () => {
    const a = atencionAEliminar;
    if (!a) return;
    setEliminando(true);
    setMsg(null);
    try {
      await apiClient.delete(`/admin/atenciones/${a.id}`);
      setAtencionAEliminar(null);
      setMsg({ tipo: 'ok', texto: 'Atención eliminada' });
      await cargarAtenciones();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      const texto =
        err instanceof ApiError
          ? err.message
          : 'No se pudo eliminar la atención';
      setMsg({ tipo: 'error', texto });
    } finally {
      setEliminando(false);
    }
  };

  const descripcionAtencion = (a: Atencion) => {
    const vendedor = a.users ? `${a.users.nombre} ${a.users.apellido}` : 'sin vendedor';
    const fecha = new Date(a.created_at).toLocaleDateString('es-AR', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    return (
      <>
        Se borrará la atención del <span className="font-semibold text-gray-900">{vendedor}</span>
        {' '}({CANAL_LABEL[a.canal] || a.canal}, {RESULTADO_LABEL[a.resultado] || a.resultado}, {fecha}).
        {a.producto && (
          <span className="block mt-1 text-gray-500">Producto: {a.producto}</span>
        )}
      </>
    );
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
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-5xl mx-auto">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Atenciones registradas por el equipo de vendedores
        </p>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm ${
          msg.tipo === 'ok'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {msg.texto}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: 'Total registradas', value: filtradas.length, accent: 'bg-gray-900', color: 'text-gray-900' },
          {
            label: 'Ventas cerradas',
            value: filtradas.filter(a => a.resultado === 'venta_cerrada').length,
            accent: 'bg-green-600',
            color: 'text-green-600',
          },
          {
            label: 'Pendientes',
            value: filtradas.filter(a => a.resultado === 'pendiente').length,
            accent: 'bg-amber-500',
            color: 'text-amber-600',
          },
          {
            label: 'Monto total',
            value: totalMonto > 0 ? `$${totalMonto.toLocaleString('es-AR')}` : '—',
            accent: 'bg-blue-600',
            color: 'text-blue-600',
          },
        ] as const).map(stat => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 border border-gray-200/90"
          >
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${stat.accent}`} aria-hidden />
            <p className={`text-2xl font-bold tracking-tight pl-2 ${stat.color}`}>{stat.value}</p>
            <p className="text-xs font-medium text-gray-600 mt-1 pl-2">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filtroVendedor}
          onChange={e => setFiltroVendedor(e.target.value)}
          className="h-10 min-h-10 w-full sm:flex-1 min-w-0 px-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
        >
          <option value="todos">Todos los vendedores</option>
          {vendedores.map(v => (
            <option key={v.email} value={v.email}>{v.nombre}</option>
          ))}
        </select>

        <select
          value={filtroResultado}
          onChange={e => setFiltroResultado(e.target.value)}
          className="h-10 min-h-10 w-full sm:flex-1 min-w-0 px-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
        >
          <option value="todos">Todos los resultados</option>
          <option value="venta_cerrada">Venta cerrada</option>
          <option value="pendiente">Pendiente</option>
          <option value="no_venta">Sin venta</option>
        </select>
      </div>

      {filtradas.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">No hay atenciones con los filtros seleccionados</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:hidden">
            {filtradas.map(a => (
              <div key={a.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm ring-1 ring-gray-900/5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {a.users ? `${a.users.nombre} ${a.users.apellido}` : '—'}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RESULTADO_STYLE[a.resultado] || 'bg-gray-100 text-gray-500'}`}>
                      {RESULTADO_LABEL[a.resultado] || a.resultado}
                    </span>
                    <BotonEliminar onClick={() => setAtencionAEliminar(a)} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span>{CANAL_LABEL[a.canal] || a.canal}</span>
                  {a.producto && <span>{a.producto}</span>}
                  {a.monto && <span className="text-green-600 font-semibold">${a.monto.toLocaleString('es-AR')}</span>}
                </div>
                {a.observaciones && (
                  <p className="text-xs text-gray-700 italic">{a.observaciones}</p>
                )}
                <p className="text-xs text-gray-500">
                  {new Date(a.created_at).toLocaleDateString('es-AR', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>

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
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide" />
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
                    <td className="px-4 py-3 text-right">
                      <BotonEliminar onClick={() => setAtencionAEliminar(a)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmarEliminacionModal
        open={!!atencionAEliminar}
        titulo="¿Eliminar esta atención?"
        descripcion={atencionAEliminar ? descripcionAtencion(atencionAEliminar) : null}
        eliminando={eliminando}
        onCancelar={() => setAtencionAEliminar(null)}
        onConfirmar={confirmarEliminar}
        idTitulo="eliminar-atencion-titulo"
      />
    </div>
  );
}
