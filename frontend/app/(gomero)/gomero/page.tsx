'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgeOrdenEstado } from '@/components/taller/BadgeOrdenEstado';

interface OrdenRow {
  id: string;
  orden_estado: string | null;
  created_at: string;
  patente_pendiente?: string | null;
  vehiculos: {
    patente: string;
    marca: string;
    modelo: string;
    clientes: { nombre: string; apellido: string; telefono?: string | null } | null;
  } | null;
  atenciones?: {
    clientes: { nombre: string; apellido: string; telefono?: string | null } | null;
  } | null;
}

export default function GomeroHomePage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<OrdenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const res = await apiClient.get<{ ordenes: OrdenRow[] }>('/gomero/ordenes');
        setOrdenes(res.ordenes || []);
      } catch {
        setError('No se pudieron cargar las órdenes.');
        setOrdenes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black text-gray-900">Mis órdenes</h1>
        <Button className="rounded-xl font-bold" onClick={() => router.push('/gomero/nueva-orden')}>
          Nueva
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      {!loading && ordenes.length === 0 && !error && (
        <p className="text-gray-500 text-center py-10">Todavía no hay órdenes pendientes.</p>
      )}

      <div className="flex flex-col gap-3">
        {ordenes.map((o) => {
          const patente = o.vehiculos?.patente || o.patente_pendiente || '—';
          const cliente =
            o.vehiculos?.clientes || o.atenciones?.clientes || null;
          const esDesdeVendedor = !!o.atenciones && !o.vehiculos;

          return (
            <button
              key={o.id}
              type="button"
              onClick={() => router.push(`/gomero/orden/${o.id}`)}
              className="w-full text-left bg-white rounded-2xl border border-gray-200 p-4 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-2xl font-black tracking-widest text-gray-900">{patente}</p>
                {esDesdeVendedor && (
                  <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-800 px-2 py-1 rounded-full shrink-0">
                    Vendedor
                  </span>
                )}
              </div>
              {o.vehiculos && (
                <p className="text-gray-600 font-medium">
                  {o.vehiculos.marca} {o.vehiculos.modelo}
                </p>
              )}
              {cliente && (
                <p className="text-sm text-gray-600 mt-1">
                  {cliente.nombre} {cliente.apellido}
                  {cliente.telefono ? ` · ${cliente.telefono}` : ''}
                </p>
              )}
              {!o.vehiculos && o.patente_pendiente && (
                <p className="text-xs text-amber-800 mt-1">Completar datos del vehículo</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <BadgeOrdenEstado ordenEstado={o.orden_estado} />
                <span className="text-xs text-gray-400">
                  {new Date(o.created_at).toLocaleString('es-AR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
