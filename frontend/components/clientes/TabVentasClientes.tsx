'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api';
import { appendSucursalQuery } from '@/lib/sucursales';
import { BadgeRangoEtario } from '@/components/clientes/BadgeRangoEtario';
import { PageState } from '@/components/ui/PageState';
import { ConfirmarEliminacionModal } from '@/components/admin/ConfirmarEliminacionModal';

interface AtencionVenta {
  id: string;
  canal: string;
  resultado: string;
  producto: string | null;
  monto: number | null;
  created_at: string;
  vendedor: string | null;
}

interface ClienteVenta {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  telefono: string | null;
  email: string | null;
  total_atenciones: number;
  ultima_atencion: string | null;
  atenciones: AtencionVenta[];
}

const CANAL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  mercadolibre: 'Mercado Libre',
  instagram: 'Instagram',
  presencial: 'Presencial',
  telefono: 'Teléfono',
  otro: 'Otro',
};

const RESULTADO_LABEL: Record<string, string> = {
  venta_cerrada: 'Venta cerrada',
  no_venta: 'Sin venta',
  pendiente: 'Pendiente',
};

interface TabVentasClientesProps {
  busqueda: string;
  showVendedor?: boolean;
  /** Filtro admin por sucursal (query ?sucursal=). */
  sucursal?: string;
  /** Base API sin prefijo /api — ej. `/clientes` (vendedor) o `/admin/clientes` (admin). */
  clientesApiBase?: string;
  onMensaje?: (msg: { tipo: 'ok' | 'error'; texto: string }) => void;
}

export function TabVentasClientes({
  busqueda,
  showVendedor = false,
  sucursal = '',
  clientesApiBase = '/clientes',
  onMensaje,
}: TabVentasClientesProps) {
  const [clientes, setClientes] = useState<ClienteVenta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [clienteAEliminar, setClienteAEliminar] = useState<ClienteVenta | null>(null);
  const [advertencia, setAdvertencia] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await apiClient.get<{ clientes: ClienteVenta[] }>(
        appendSucursalQuery('/clientes/ventas', sucursal),
      );
      setClientes(res.clientes);
    } catch (err) {
      console.error('[TabVentasClientes] Error cargando ventas', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [sucursal]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirEliminar = async (c: ClienteVenta) => {
    setAdvertencia(null);
    setClienteAEliminar(c);
    try {
      const res = await apiClient.get<{ vehiculos: number; atenciones: number; visitas: number }>(
        `${clientesApiBase}/${c.id}/dependencias`
      );
      const partes: string[] = [];
      if (res.vehiculos > 0) partes.push(`${res.vehiculos} vehículo${res.vehiculos === 1 ? '' : 's'}`);
      if (res.atenciones > 0) partes.push(`${res.atenciones} atención${res.atenciones === 1 ? '' : 'es'}`);
      if (res.visitas > 0) partes.push(`${res.visitas} visita${res.visitas === 1 ? '' : 's'} en taller`);
      if (partes.length > 0) {
        setAdvertencia(
          `Este cliente tiene datos asociados: ${partes.join(', ')}. Al eliminarlo, los vehículos quedarán sin titular y las atenciones sin vínculo al cliente.`
        );
      }
    } catch {
      if (c.total_atenciones > 0) {
        setAdvertencia(
          `Este cliente tiene ${c.total_atenciones} atención${c.total_atenciones === 1 ? '' : 'es'} registrada${c.total_atenciones === 1 ? '' : 's'}.`
        );
      }
    }
  };

  const confirmarEliminar = async () => {
    const c = clienteAEliminar;
    if (!c) return;
    setEliminando(true);
    try {
      await apiClient.delete(`${clientesApiBase}/${c.id}`);
      setClienteAEliminar(null);
      setAdvertencia(null);
      onMensaje?.({ tipo: 'ok', texto: 'Cliente eliminado' });
      await cargar();
    } catch (err) {
      const texto =
        err instanceof ApiError ? err.message : 'No se pudo eliminar el cliente';
      onMensaje?.({ tipo: 'error', texto });
    } finally {
      setEliminando(false);
    }
  };

  const filtrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase();
    const full = `${c.nombre} ${c.apellido}`.toLowerCase();
    return (
      full.includes(q) ||
      (c.telefono || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.dni || '').includes(q)
    );
  });

  return (
    <PageState state={isLoading ? 'loading' : hasError ? 'error' : 'content'} onRetry={cargar}>
      <PageState
        state={filtrados.length === 0 ? 'empty' : 'content'}
        emptyMessage={
          busqueda
            ? 'Sin resultados para esa búsqueda.'
            : 'Aún no hay clientes vinculados a atenciones.'
        }
      >
        <div className="flex flex-col gap-3">
          {filtrados.map((c) => {
            const abierto = expandido === c.id;
            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="w-full p-4 flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandido(abierto ? null : c.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-900">
                        {c.nombre} {c.apellido}
                      </p>
                      <BadgeRangoEtario dni={c.dni} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[c.telefono, c.email, c.dni ? `DNI ${c.dni}` : null]
                        .filter(Boolean)
                        .join(' · ') || 'Sin contacto'}
                    </p>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {c.total_atenciones} {c.total_atenciones === 1 ? 'atención' : 'atenciones'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void abrirEliminar(c)}
                    className="text-xs px-2.5 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium shrink-0"
                  >
                    Eliminar
                  </button>
                </div>
                {abierto && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 flex flex-col gap-2">
                    {c.atenciones.map((a) => (
                      <div key={a.id} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(a.created_at).toLocaleDateString('es-AR')}
                          </span>
                          <span className="text-xs font-medium text-gray-700">
                            {RESULTADO_LABEL[a.resultado] || a.resultado}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {CANAL_LABEL[a.canal] || a.canal}
                          {a.producto ? ` · ${a.producto}` : ''}
                          {a.monto ? ` · $${a.monto.toLocaleString('es-AR')}` : ''}
                        </p>
                        {showVendedor && a.vendedor && (
                          <p className="text-xs text-gray-400">Vendedor: {a.vendedor}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PageState>

      <ConfirmarEliminacionModal
        open={!!clienteAEliminar}
        titulo="¿Eliminar este cliente?"
        descripcion={
          clienteAEliminar ? (
            <>
              Se borrará a{' '}
              <span className="font-semibold text-gray-900">
                {clienteAEliminar.nombre} {clienteAEliminar.apellido}
              </span>
              {clienteAEliminar.dni ? ` (DNI ${clienteAEliminar.dni})` : ''}.
            </>
          ) : null
        }
        advertencia={advertencia}
        eliminando={eliminando}
        onCancelar={() => {
          setClienteAEliminar(null);
          setAdvertencia(null);
        }}
        onConfirmar={confirmarEliminar}
        idTitulo="eliminar-cliente-ventas-titulo"
      />
    </PageState>
  );
}
