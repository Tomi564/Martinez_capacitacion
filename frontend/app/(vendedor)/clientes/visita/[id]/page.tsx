'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { PageState } from '@/components/ui/PageState';
import { ArrowLeft, FileText } from 'lucide-react';

interface Visita {
  id: string; estado: string; motivo: string | null; observaciones: string | null;
  km: number | null; diagnostico_enviado: boolean; created_at: string;
  vehiculos: {
    patente: string; marca: string; modelo: string; anio: number | null; medida_rueda: string | null;
    clientes: { nombre: string; apellido: string; email: string | null; telefono: string | null } | null;
  } | null;
}

export default function VisitaVendedorDetalle() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [visita, setVisita] = useState<Visita | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const cargarVisita = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const r = await apiClient.get<{ visita: Visita }>(`/mecanico/visitas/${id}`);
      setVisita(r.visita);
    } catch (error) {
      console.error('[VisitaVendedorDetalle] Error cargando visita', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarVisita();
  }, [id]);

  if (isLoading || hasError || !visita) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto">
        <PageState
          state={isLoading ? 'loading' : hasError ? 'error' : 'empty'}
          onRetry={cargarVisita}
          emptyMessage="Visita no encontrada."
        />
      </div>
    );
  }

  const v = visita.vehiculos;
  const c = v?.clientes;

  return (
    <div className="px-4 py-5 pb-24 flex flex-col gap-5 max-w-lg mx-auto">
      <button
        onClick={() => router.back()}
        className="self-start inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <Link
        href={`/clientes/informe/${id}`}
        className="inline-flex items-center gap-2 self-start rounded-xl border border-[#C8102E]/30 bg-[#C8102E]/5 px-4 py-3 text-sm font-bold text-[#C8102E] active:scale-[0.99] transition-transform"
      >
        <FileText className="w-4 h-4" />
        Ver informe completo
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-black text-gray-900 tracking-widest">{v?.patente}</p>
            <p className="text-gray-600 font-medium">{v?.marca} {v?.modelo}{v?.anio && ` · ${v.anio}`}</p>
            {v?.medida_rueda && <p className="text-sm text-gray-400">Rueda: {v.medida_rueda}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{new Date(visita.created_at).toLocaleDateString('es-AR')}</p>
            {visita.km && <p className="text-xs text-gray-500">{visita.km.toLocaleString()} km</p>}
          </div>
        </div>
        {c && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="font-bold text-gray-800">{c.nombre} {c.apellido}</p>
            {c.telefono && <p className="text-sm text-gray-500">{c.telefono}</p>}
            {c.email && <p className="text-sm text-gray-400">{c.email}</p>}
          </div>
        )}
        {visita.motivo && <p className="text-sm text-gray-500 mt-2 italic">"{visita.motivo}"</p>}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {visita.diagnostico_enviado && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">✓ Diagnóstico enviado</span>}
        </div>
      </div>

      {visita.observaciones && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Observaciones del mecánico</p>
          <p className="text-sm text-gray-700 leading-relaxed">{visita.observaciones}</p>
        </div>
      )}
    </div>
  );
}
