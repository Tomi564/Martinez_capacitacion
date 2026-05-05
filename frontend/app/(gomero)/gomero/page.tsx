'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface OrdenRow {
  id: string;
  orden_estado: string | null;
  created_at: string;
  vehiculos: { patente: string; marca: string; modelo: string } | null;
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente_gomero: 'Pendiente (gomería)',
  pendiente_mecanico: 'En taller',
  finalizado: 'Finalizada',
  incompleto: 'Incompleta',
};

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
        <p className="text-gray-500 text-center py-10">Todavía no cargaste ninguna orden.</p>
      )}

      <div className="flex flex-col gap-3">
        {ordenes.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => router.push(`/gomero/orden/${o.id}`)}
            className="w-full text-left bg-white rounded-2xl border border-gray-200 p-4 active:scale-[0.99] transition-transform"
          >
            <p className="text-2xl font-black tracking-widest text-gray-900">{o.vehiculos?.patente}</p>
            <p className="text-gray-600 font-medium">{o.vehiculos?.marca} {o.vehiculos?.modelo}</p>
            <p className="text-xs text-gray-400 mt-2">
              {ESTADO_LABEL[o.orden_estado || ''] || o.orden_estado || '—'} ·{' '}
              {new Date(o.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
