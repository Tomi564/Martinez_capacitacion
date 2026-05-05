'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { PageState } from '@/components/ui/PageState';
import { FileText } from 'lucide-react';

interface ChecklistItem { id: string; descripcion: string; orden: number; }
interface Respuesta { item_id: string; estado: string; nota: string | null; }
interface Visita {
  id: string; estado: string; motivo: string | null; observaciones: string | null;
  km: number | null; diagnostico_enviado: boolean; created_at: string;
  vehiculos: {
    patente: string; marca: string; modelo: string; anio: number | null; medida_rueda: string | null;
    clientes: { nombre: string; apellido: string; email: string | null; telefono: string | null } | null;
  } | null;
}

const ESTADO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  ok:      { label: '✓ OK',       color: 'text-green-700', bg: 'bg-green-50' },
  revisar: { label: '⚠ Revisar',  color: 'text-amber-700', bg: 'bg-amber-50' },
  urgente: { label: '🔴 Urgente', color: 'text-red-700',   bg: 'bg-red-50' },
};

export default function VisitaAdminDetalle() {
  const { id } = useParams<{ id: string }>();
  const [visita, setVisita] = useState<Visita | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const cargarVisita = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const r = await apiClient.get<{ visita: Visita; items: ChecklistItem[]; respuestas: Respuesta[] }>(`/mecanico/visitas/${id}`);
        setVisita(r.visita);
        setItems(r.items);
        const map: Record<string, Respuesta> = {};
        r.respuestas.forEach(rr => { map[rr.item_id] = rr; });
        setRespuestas(map);
    } catch (error) {
      console.error('[VisitaAdminDetalle] Error cargando visita', error);
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
      <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto">
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
  const respondidos = items.filter(i => respuestas[i.id]);
  const urgentes = respondidos.filter(i => respuestas[i.id]?.estado === 'urgente');
  const revisar = respondidos.filter(i => respuestas[i.id]?.estado === 'revisar');

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-5 max-w-2xl mx-auto pb-10">

      <Link
        href={`/admin/clientes/informe/${id}`}
        className="inline-flex items-center gap-2 self-start rounded-xl border border-[#C8102E]/30 bg-[#C8102E]/5 px-4 py-3 text-sm font-bold text-[#C8102E] active:scale-[0.99] transition-transform"
      >
        <FileText className="w-4 h-4" />
        Ver informe completo (gomero + mecánico)
      </Link>

      {/* Cabecera */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-black text-gray-900 tracking-widest">{v?.patente}</p>
            <p className="text-gray-600 font-medium">{v?.marca} {v?.modelo}{v?.anio && ` · ${v.anio}`}</p>
            {v?.medida_rueda && <p className="text-sm text-gray-400">Rueda: {v.medida_rueda}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{new Date(visita.created_at).toLocaleDateString('es-AR')}</p>
            {visita.km && <p className="text-xs text-gray-500 mt-0.5">{visita.km.toLocaleString()} km</p>}
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
          {urgentes.length > 0 && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">{urgentes.length} urgente{urgentes.length > 1 ? 's' : ''}</span>}
          {revisar.length > 0 && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{revisar.length} a revisar</span>}
          {visita.diagnostico_enviado && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">✓ Diagnóstico enviado</span>}
        </div>
      </div>

      {/* Checklist */}
      {respondidos.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Checklist ({respondidos.length}/{items.length} ítems)</p>
          <div className="flex flex-col gap-2">
            {items.map(item => {
              const r = respuestas[item.id];
              if (!r) return null;
              const cfg = ESTADO_CFG[r.estado];
              return (
                <div key={item.id} className={`rounded-xl px-4 py-3 flex items-start justify-between gap-3 ${cfg?.bg || 'bg-gray-50'}`}>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.descripcion}</p>
                    {r.nota && <p className="text-xs text-gray-500 mt-0.5 italic">{r.nota}</p>}
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${cfg?.color || 'text-gray-600'}`}>{cfg?.label || r.estado}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Observaciones */}
      {visita.observaciones && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Observaciones del mecánico</p>
          <p className="text-sm text-gray-700 leading-relaxed">{visita.observaciones}</p>
        </div>
      )}
    </div>
  );
}
