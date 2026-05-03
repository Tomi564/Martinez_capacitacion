'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { PageState } from '@/components/ui/PageState';

interface Visita {
  id: string;
  estado: string;
  estado_visita?: 'abierta' | 'cerrada' | null;
  motivo: string | null;
  observaciones: string | null;
  estado_neumaticos?: 'buen_estado' | 'desgaste_medio' | 'reemplazo_urgente' | null;
  estado_frenos?: 'buen_estado' | 'desgaste_medio' | 'reemplazo_urgente' | null;
  presion_psi?: number | null;
  recomendacion?: string | null;
  updated_by_admin_at?: string | null;
  diagnostico_enviado: boolean;
  vehiculos: {
    patente: string; marca: string; modelo: string; anio: number | null; medida_rueda: string | null;
    clientes: { nombre: string; apellido: string; email: string | null; telefono: string | null } | null;
  } | null;
}

interface ChecklistItem {
  id: string;
  descripcion: string;
  orden: number;
}

interface Respuesta {
  item_id: string;
  estado: 'ok' | 'revisar' | 'urgente' | null;
  nota: string | null;
}

type EstadoItem = 'ok' | 'revisar' | 'urgente';

export default function VisitaDetallePage() {
  const { id } = useParams<{ id: string }>();

  const [visita, setVisita] = useState<Visita | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta>>({});
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);
  const [isEntregando, setIsEntregando] = useState(false);
  const [estadoNeumaticos, setEstadoNeumaticos] = useState<Visita['estado_neumaticos']>(null);
  const [estadoFrenos, setEstadoFrenos] = useState<Visita['estado_frenos']>(null);
  const [presionPsi, setPresionPsi] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [loadError, setLoadError] = useState(false);

  const cargar = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await apiClient.get<{ visita: Visita; items: ChecklistItem[]; respuestas: Respuesta[] }>(`/mecanico/visitas/${id}`);
      setVisita(res.visita);
      setItems(res.items);
      setObservaciones(res.visita.observaciones || '');
      setEstadoNeumaticos(res.visita.estado_neumaticos || null);
      setEstadoFrenos(res.visita.estado_frenos || null);
      setPresionPsi(res.visita.presion_psi != null ? String(res.visita.presion_psi) : '');
      setRecomendacion(res.visita.recomendacion || '');
      const map: Record<string, Respuesta> = {};
      res.respuestas.forEach((r) => { map[r.item_id] = r; });
      setRespuestas(map);
    } catch (error) {
      console.error('[VisitaDetallePage] Error cargando detalle de visita', error);
      setLoadError(true);
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const setEstado = (itemId: string, estado: EstadoItem) => {
    setRespuestas((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], item_id: itemId, estado, nota: prev[itemId]?.nota || null },
    }));
  };

  const setNota = (itemId: string, nota: string) => {
    setRespuestas((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], item_id: itemId, nota: nota || null, estado: prev[itemId]?.estado || null },
    }));
  };

  const guardar = async () => {
    setIsSaving(true);
    setMsg(null);
    try {
      const presionRaw = presionPsi.replace(',', '.').trim();
      const presionNum = presionRaw ? Number(presionRaw) : null;
      const presionPsiBody = presionNum != null && Number.isFinite(presionNum) ? presionNum : null;

      const rows = Object.values(respuestas).filter((r) => r.estado).map((r) => ({
        item_id: r.item_id, estado: r.estado!, nota: r.nota || undefined,
      }));

      await apiClient.patch(`/mecanico/visitas/${id}`, {
        observaciones: observaciones.trim() || null,
        estado_neumaticos: estadoNeumaticos || null,
        estado_frenos: estadoFrenos || null,
        presion_psi: presionPsiBody,
        recomendacion: recomendacion.trim() || null,
      });
      if (rows.length) {
        await apiClient.post(`/mecanico/visitas/${id}/checklist`, { respuestas: rows });
      }
      setMsg({ tipo: 'ok', texto: 'Guardado correctamente' });
    } catch (error) {
      console.error('[VisitaDetallePage] Error guardando checklist/diagnóstico', error);
      const detalle = error instanceof Error ? error.message : '';
      setMsg({
        tipo: 'error',
        texto: detalle ? `Error al guardar: ${detalle}` : 'Error al guardar',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const enviarDiagnostico = async () => {
    setIsEnviando(true);
    setMsg(null);
    try {
      await guardar();
      await apiClient.post(`/mecanico/visitas/${id}/diagnostico`, {});
      setVisita((v) => v ? { ...v, diagnostico_enviado: true, estado: 'listo' } : v);
      setMsg({ tipo: 'ok', texto: 'Diagnóstico enviado por email' });
    } catch (e: any) {
      console.error('[VisitaDetallePage] Error enviando diagnóstico', e);
      setMsg({ tipo: 'error', texto: e?.message || 'Error al enviar diagnóstico' });
    } finally {
      setIsEnviando(false);
    }
  };

  const cambiarEstadoVisita = async (nuevoEstado: 'abierta' | 'cerrada') => {
    setIsEntregando(true);
    try {
      await apiClient.patch(`/mecanico/visitas/${id}`, { estado_visita: nuevoEstado });
      setVisita((v) => v ? { ...v, estado_visita: nuevoEstado } : v);
      setMsg({ tipo: 'ok', texto: `Visita ${nuevoEstado === 'cerrada' ? 'cerrada' : 'abierta'} correctamente` });
    } catch (error) {
      console.error('[VisitaDetallePage] Error cambiando estado de visita', error);
      setMsg({ tipo: 'error', texto: 'Error al actualizar estado' });
    } finally {
      setIsEntregando(false);
    }
  };

  if (isLoading || loadError || !visita) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto">
        <PageState
          state={isLoading ? 'loading' : loadError ? 'error' : 'empty'}
          onRetry={cargar}
          emptyMessage="Visita no encontrada."
        />
      </div>
    );
  }

  const vehiculo = visita.vehiculos;
  const cliente = vehiculo?.clientes;
  const entregado = visita.estado === 'entregado' || visita.estado_visita === 'cerrada';
  const completado = items.length > 0 && items.every((i) => respuestas[i.id]?.estado);

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-32 flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-3xl font-black text-gray-900 tracking-widest">{vehiculo?.patente}</p>
        <p className="text-gray-600 font-medium mt-0.5">{vehiculo?.marca} {vehiculo?.modelo} {vehiculo?.anio && `· ${vehiculo.anio}`}</p>
        {vehiculo?.medida_rueda && <p className="text-sm text-gray-400 mt-0.5">Rueda: {vehiculo.medida_rueda}</p>}
        {cliente && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="font-bold text-gray-800">{cliente.nombre} {cliente.apellido}</p>
            {cliente.telefono && <p className="text-sm text-gray-500">{cliente.telefono}</p>}
            {cliente.email && <p className="text-sm text-gray-400">{cliente.email}</p>}
          </div>
        )}
        {visita.motivo && <p className="text-sm text-gray-500 mt-2 italic">"{visita.motivo}"</p>}
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${entregado ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'}`}>
            {entregado ? 'Cerrada' : 'Abierta'}
          </span>
          {visita.updated_by_admin_at && (
            <span className="text-xs text-gray-500">
              Editado por admin el {new Date(visita.updated_by_admin_at).toLocaleString('es-AR')}
            </span>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Checklist de revisión</p>
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const r = respuestas[item.id];
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                  <p className="font-bold text-gray-900 mb-3">{item.descripcion}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <EstadoBtn activo={r?.estado === 'ok'} onClick={() => setEstado(item.id, 'ok')} color="green" label="✓ OK" disabled={entregado} />
                    <EstadoBtn activo={r?.estado === 'revisar'} onClick={() => setEstado(item.id, 'revisar')} color="amber" label="⚠ Revisar" disabled={entregado} />
                    <EstadoBtn activo={r?.estado === 'urgente'} onClick={() => setEstado(item.id, 'urgente')} color="red" label="🔴 Urgente" disabled={entregado} />
                  </div>
                  {(r?.estado === 'revisar' || r?.estado === 'urgente') && (
                    <input
                      placeholder="Observación (opcional)"
                      value={r?.nota || ''}
                      onChange={(e) => setNota(item.id, e.target.value)}
                      disabled={entregado}
                      className="mt-2 w-full h-9 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C8102E] placeholder-gray-300 disabled:opacity-50"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Observaciones generales</label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          disabled={entregado}
          placeholder="Notas adicionales para la clientela o el taller..."
          rows={3}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] resize-none disabled:opacity-50"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diagnóstico</p>
        <Selector titulo="Estado de neumáticos" value={estadoNeumaticos} onChange={setEstadoNeumaticos} disabled={entregado} />
        <Selector titulo="Estado de frenos" value={estadoFrenos} onChange={setEstadoFrenos} disabled={entregado} />
        <div>
          <label className="text-sm text-gray-500">Presión (PSI)</label>
          <input type="number" disabled={entregado} value={presionPsi} onChange={(e) => setPresionPsi(e.target.value)} className="mt-1 w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]" />
        </div>
        <div>
          <label className="text-sm text-gray-500">Recomendación</label>
          <textarea rows={3} disabled={entregado} value={recomendacion} onChange={(e) => setRecomendacion(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] resize-none" />
        </div>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg.texto}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {!entregado && (
          <>
            <button onClick={guardar} disabled={isSaving} className="w-full py-4 bg-[#1F1F1F] text-white font-bold text-base rounded-2xl active:scale-95 transition-transform disabled:opacity-50">
              {isSaving ? 'Guardando...' : 'Guardar checklist'}
            </button>

            {cliente?.email && (
              <button
                onClick={enviarDiagnostico}
                disabled={isEnviando || !completado || visita.diagnostico_enviado}
                className="w-full py-4 bg-blue-600 text-white font-bold text-base rounded-2xl active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isEnviando ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
                ) : visita.diagnostico_enviado ? (
                  '✓ Diagnóstico enviado'
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    Enviar diagnóstico por email
                  </>
                )}
              </button>
            )}
            {!cliente?.email && (
              <p className="text-xs text-gray-400 text-center">La clientela no tiene email registrado, así que no se puede enviar diagnóstico.</p>
            )}
          </>
        )}

        <button
          onClick={() => cambiarEstadoVisita(entregado ? 'abierta' : 'cerrada')}
          disabled={isEntregando}
          className="w-full py-4 bg-[#C8102E] text-white font-extrabold text-lg rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
        >
          {isEntregando ? 'Procesando...' : entregado ? 'Reabrir visita' : 'Cerrar visita'}
        </button>
      </div>
    </div>
  );
}

function EstadoBtn({ activo, onClick, color, label, disabled }: {
  activo: boolean; onClick: () => void; color: 'green' | 'amber' | 'red'; label: string; disabled: boolean;
}) {
  const base = 'py-3 rounded-xl text-sm font-bold active:scale-95 transition-all border-2 disabled:opacity-40';
  const styles = {
    green: activo ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-green-200 text-green-700',
    amber: activo ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-amber-200 text-amber-700',
    red: activo ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'bg-white border-red-200 text-red-700',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[color]}`}>
      {label}
    </button>
  );
}

function Selector({
  titulo,
  value,
  onChange,
  disabled,
}: {
  titulo: string;
  value: 'buen_estado' | 'desgaste_medio' | 'reemplazo_urgente' | null | undefined;
  onChange: (v: 'buen_estado' | 'desgaste_medio' | 'reemplazo_urgente' | null) => void;
  disabled: boolean;
}) {
  const opciones: Array<{ id: 'buen_estado' | 'desgaste_medio' | 'reemplazo_urgente'; label: string }> = [
    { id: 'buen_estado', label: 'Buen estado' },
    { id: 'desgaste_medio', label: 'Desgaste medio' },
    { id: 'reemplazo_urgente', label: 'Reemplazo urgente' },
  ];

  return (
    <div>
      <p className="text-sm text-gray-500 mb-1.5">{titulo}</p>
      <div className="grid grid-cols-1 gap-2">
        {opciones.map((op) => (
          <button
            key={op.id}
            disabled={disabled}
            onClick={() => onChange(value === op.id ? null : op.id)}
            className={`w-full text-left px-3 py-3 rounded-xl border text-sm font-medium ${
              value === op.id
                ? 'border-[#C8102E] bg-red-50 text-[#C8102E]'
                : 'border-gray-200 bg-white text-gray-700'
            } disabled:opacity-50`}
          >
            {op.label}
          </button>
        ))}
      </div>
    </div>
  );
}
