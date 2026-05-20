'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { BadgeRangoEtario } from '@/components/clientes/BadgeRangoEtario';
import { PageState } from '@/components/ui/PageState';

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
}

export function TabVentasClientes({ busqueda, showVendedor = false }: TabVentasClientesProps) {
  const [clientes, setClientes] = useState<ClienteVenta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);

  const cargar = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await apiClient.get<{ clientes: ClienteVenta[] }>('/clientes/ventas');
      setClientes(res.clientes);
    } catch (err) {
      console.error('[TabVentasClientes] Error cargando ventas', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

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
                <button
                  type="button"
                  onClick={() => setExpandido(abierto ? null : c.id)}
                  className="w-full p-4 text-left flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
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
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform ${abierto ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
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
    </PageState>
  );
}
