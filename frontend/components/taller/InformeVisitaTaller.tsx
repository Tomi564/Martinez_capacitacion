'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { PageState } from '@/components/ui/PageState';
import { Badge } from '@/components/ui/badge';

export interface InformeVisita {
  id: string;
  estado: string;
  estado_visita?: string | null;
  orden_estado?: string | null;
  motivo: string | null;
  observaciones: string | null;
  km: number | null;
  presion_psi?: number | null;
  neumaticos_cambiados?: boolean | null;
  marca_neumatico?: string | null;
  medida_neumatico?: string | null;
  observaciones_gomero?: string | null;
  tren_delantero?: string | null;
  tren_alineado?: boolean | null;
  tren_balanceo?: boolean | null;
  amortiguadores_revisados?: boolean | null;
  auxilio_revisado?: boolean | null;
  presupuesto?: string | null;
  fotos_neumatico_urls?: string[] | null;
  created_at: string;
  updated_at?: string | null;
  enviado_al_mecanico_at?: string | null;
  mecanico_tomo_at?: string | null;
  vehiculos: {
    patente: string;
    marca: string;
    modelo: string;
    anio: number | null;
    medida_rueda: string | null;
    clientes: { nombre: string; apellido: string; email: string | null; telefono: string | null } | null;
  } | null;
}

const ORDEN_BADGE: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'muted' | 'danger' }> = {
  pendiente_gomero: { label: 'Pendiente gomero', variant: 'warning' },
  pendiente_mecanico: { label: 'Pendiente mecánico', variant: 'warning' },
  finalizado: { label: 'Finalizado', variant: 'success' },
  incompleto: { label: 'Incompleto', variant: 'muted' },
};

function fmt(ts: string | null | undefined) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function boolTxt(v: boolean | null | undefined) {
  if (v === true) return 'Sí';
  if (v === false) return 'No';
  return '—';
}

function trenTxt(v: string | null | undefined) {
  if (v === 'x2') return '2 ruedas';
  if (v === 'x4') return '4 ruedas';
  if (v === 'no') return 'No';
  return '—';
}

const PSI_PER_BAR = 14.5037738;
function psiToBar(psi: number) {
  return psi / PSI_PER_BAR;
}

export function InformeVisitaTaller({ visitaId }: { visitaId: string }) {
  const [visita, setVisita] = useState<InformeVisita | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cargar = async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await apiClient.get<{ visita: InformeVisita }>(
        `/mecanico/visitas/${visitaId}`
      );
      setVisita(r.visita);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [visitaId]);

  if (loading || error || !visita) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto lg:max-w-3xl">
        <PageState
          state={loading ? 'loading' : error ? 'error' : 'empty'}
          onRetry={cargar}
          emptyMessage="No se encontró la visita."
        />
      </div>
    );
  }

  const v = visita.vehiculos;
  const c = v?.clientes;
  const ordenCfg = visita.orden_estado ? ORDEN_BADGE[visita.orden_estado] : null;
  const fotos = Array.isArray(visita.fotos_neumatico_urls) ? visita.fotos_neumatico_urls : [];
  const tieneParteGomero =
    visita.neumaticos_cambiados != null ||
    visita.km != null ||
    !!visita.marca_neumatico ||
    !!visita.medida_neumatico ||
    visita.presion_psi != null ||
    !!visita.observaciones_gomero;
  const ordenCerrada = visita.orden_estado === 'finalizado' || visita.orden_estado === 'incompleto';

  return (
    <div className="px-4 py-5 pb-24 flex flex-col gap-5 max-w-lg mx-auto lg:max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Informe de orden</span>
        {ordenCfg ? (
          <Badge variant={ordenCfg.variant}>{ordenCfg.label}</Badge>
        ) : (
          <Badge variant="muted">Sin estado de orden</Badge>
        )}
        {!ordenCerrada && (
          <Badge variant={visita.estado === 'entregado' ? 'muted' : 'default'}>
            {visita.estado.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Vehículo y cliente</p>
        <p className="text-3xl font-black tracking-widest text-gray-900">{v?.patente}</p>
        <p className="text-gray-700 font-medium mt-1">
          {v?.marca} {v?.modelo}
          {v?.anio ? ` · ${v.anio}` : ''}
        </p>
        {v?.medida_rueda && <p className="text-sm text-gray-500 mt-1">Medida rueda: {v.medida_rueda}</p>}
        {c && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="font-bold text-gray-900">
              {c.nombre} {c.apellido}
            </p>
            {c.telefono && <p className="text-sm text-gray-600">{c.telefono}</p>}
            {c.email && <p className="text-sm text-gray-500">{c.email}</p>}
          </div>
        )}
      </section>

      {tieneParteGomero && (
        <section className="rounded-2xl border-2 border-amber-200 bg-amber-50/40 p-4">
          <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3">Parte del gomero</p>
          <ul className="text-sm text-gray-800 space-y-2">
            <li>
              <span className="text-gray-500">Neumáticos cambiados:</span>{' '}
              {visita.neumaticos_cambiados === true ? 'Sí' : visita.neumaticos_cambiados === false ? 'No' : '—'}
            </li>
            <li>
              <span className="text-gray-500">Kilometraje:</span>{' '}
              {visita.km != null ? `${visita.km.toLocaleString('es-AR')} km` : '—'}
            </li>
            <li>
              <span className="text-gray-500">Marca:</span> {visita.marca_neumatico || '—'}
            </li>
            <li>
              <span className="text-gray-500">Medida:</span> {visita.medida_neumatico || '—'}
            </li>
            <li>
              <span className="text-gray-500">Presión:</span>{' '}
              {visita.presion_psi != null ? `${psiToBar(visita.presion_psi).toLocaleString('es-AR', { maximumFractionDigits: 1 })} BAR` : '—'}
            </li>
            {visita.observaciones_gomero && (
              <li className="pt-2 border-t border-amber-200/80">
                <span className="text-gray-500 block mb-1">Observaciones</span>
                <span className="text-gray-800 whitespace-pre-wrap">{visita.observaciones_gomero}</span>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Parte del mecánico</p>
        <ul className="text-sm text-gray-800 space-y-2">
          <li>
            <span className="text-gray-500">Tren delantero:</span> {trenTxt(visita.tren_delantero)}
          </li>
          <li>
            <span className="text-gray-500">Alineado:</span> {boolTxt(visita.tren_alineado)}
          </li>
          <li>
            <span className="text-gray-500">Balanceo:</span> {boolTxt(visita.tren_balanceo)}
          </li>
          <li>
            <span className="text-gray-500">Amortiguadores:</span> {boolTxt(visita.amortiguadores_revisados)}
          </li>
          <li>
            <span className="text-gray-500">Auxilio:</span> {boolTxt(visita.auxilio_revisado)}
          </li>
          <li>
            <span className="text-gray-500">Presupuesto:</span>{' '}
            {visita.presupuesto?.trim() ? (
              <span className="whitespace-pre-wrap">{visita.presupuesto}</span>
            ) : (
              '—'
            )}
          </li>
          {visita.observaciones && (
            <li className="pt-2 border-t border-gray-100">
              <span className="text-gray-500 block mb-1">Observaciones generales</span>
              <span className="whitespace-pre-wrap">{visita.observaciones}</span>
            </li>
          )}
          {visita.motivo && (
            <li>
              <span className="text-gray-500">Motivo visita:</span> {visita.motivo}
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Fotos</p>
        {fotos.length === 0 ? (
          <p className="text-sm text-gray-500">Sin fotos cargadas.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fotos.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Etapas y horarios</p>
        <ul className="text-sm space-y-2">
          <li className="flex justify-between gap-3">
            <span className="text-gray-500">Visita creada</span>
            <span className="font-medium text-gray-900 text-right">{fmt(visita.created_at)}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-gray-500">Enviada al mecánico</span>
            <span className="font-medium text-gray-900 text-right">{fmt(visita.enviado_al_mecanico_at)}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-gray-500">Mecánico tomó la orden</span>
            <span className="font-medium text-gray-900 text-right">{fmt(visita.mecanico_tomo_at)}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-gray-500">Última actualización</span>
            <span className="font-medium text-gray-900 text-right">{fmt(visita.updated_at)}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
