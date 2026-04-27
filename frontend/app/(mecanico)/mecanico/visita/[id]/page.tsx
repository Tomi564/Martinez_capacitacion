'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface Visita {
  id: string;
  estado: string;
  motivo: string | null;
  observaciones: string | null;
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

export default function VisitaDetalle() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [visita, setVisita] = useState<Visita | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta>>({});
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);
  const [isEntregando, setIsEntregando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiClient.get<{ visita: Visita; items: ChecklistItem[]; respuestas: Respuesta[] }>(`/mecanico/visitas/${id}`);
        setVisita(res.visita);
        setItems(res.items);
        setObservaciones(res.visita.observaciones || '');
        const map: Record<string, Respuesta> = {};
        res.respuestas.forEach(r => { map[r.item_id] = r; });
        setRespuestas(map);
      } catch {}
      finally { setIsLoading(false); }
    };
    cargar();
  }, [id]);

  const setEstado = (itemId: string, estado: EstadoItem) => {
    setRespuestas(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], item_id: itemId, estado, nota: prev[itemId]?.nota || null },
    }));
  };

  const setNota = (itemId: string, nota: string) => {
    setRespuestas(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], item_id: itemId, nota: nota || null, estado: prev[itemId]?.estado || null },
    }));
  };

  const guardar = async () => {
    setIsSaving(true);
    setMsg(null);
    try {
      const rows = Object.values(respuestas).filter(r => r.estado).map(r => ({
        item_id: r.item_id, estado: r.estado!, nota: r.nota || undefined,
      }));
      if (rows.length) {
        await apiClient.post(`/mecanico/visitas/${id}/checklist`, { respuestas: rows });
      }
      await apiClient.patch(`/mecanico/visitas/${id}`, { observaciones: observaciones.trim() || null });
      setMsg({ tipo: 'ok', texto: 'Guardado correctamente' });
    } catch {
      setMsg({ tipo: 'error', texto: 'Error al guardar' });
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
      setVisita(v => v ? { ...v, diagnostico_enviado: true, estado: 'listo' } : v);
      setMsg({ tipo: 'ok', texto: 'Diagnóstico enviado por email' });
    } catch (e: any) {
      setMsg({ tipo: 'error', texto: e?.message || 'Error al enviar diagnóstico' });
    } finally {
      setIsEnviando(false);
    }
  };

  const marcarEntregado = async () => {
    setIsEntregando(true);
    try {
      await apiClient.patch(`/mecanico/visitas/${id}`, { estado: 'entregado' });
      router.replace('/mecanico');
    } catch {
      setMsg({ tipo: 'error', texto: 'Error al actualizar estado' });
      setIsEntregando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (!visita) {
    return <p className="text-center py-10 text-gray-400">Visita no encontrada</p>;
  }

  const vehiculo = visita.vehiculos;
  const cliente = vehiculo?.clientes;
  const entregado = visita.estado === 'entregado';
  const completado = items.length > 0 && items.every(i => respuestas[i.id]?.estado);

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-32 flex flex-col gap-5">

      {/* Cabecera del vehículo */}
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
      </div>

      {/* Checklist */}
      {items.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Checklist de revisión</p>
          <div className="flex flex-col gap-3">
            {items.map(item => {
              const r = respuestas[item.id];
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                  <p className="font-bold text-gray-900 mb-3">{item.descripcion}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <EstadoBtn
                      activo={r?.estado === 'ok'}
                      onClick={() => setEstado(item.id, 'ok')}
                      color="green"
                      label="✓ OK"
                      disabled={entregado}
                    />
                    <EstadoBtn
                      activo={r?.estado === 'revisar'}
                      onClick={() => setEstado(item.id, 'revisar')}
                      color="amber"
                      label="⚠ Revisar"
                      disabled={entregado}
                    />
                    <EstadoBtn
                      activo={r?.estado === 'urgente'}
                      onClick={() => setEstado(item.id, 'urgente')}
                      color="red"
                      label="🔴 Urgente"
                      disabled={entregado}
                    />
                  </div>
                  {(r?.estado === 'revisar' || r?.estado === 'urgente') && (
                    <input
                      placeholder="Observación (opcional)"
                      value={r?.nota || ''}
                      onChange={e => setNota(item.id, e.target.value)}
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

      {/* Observaciones generales */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Observaciones generales</label>
        <textarea
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          disabled={entregado}
          placeholder="Notas adicionales para el cliente o el taller..."
          rows={3}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E] resize-none disabled:opacity-50"
        />
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg.texto}
        </div>
      )}

      {!entregado && (
        <div className="flex flex-col gap-3">
          {/* Guardar */}
          <button
            onClick={guardar}
            disabled={isSaving}
            className="w-full py-4 bg-[#1F1F1F] text-white font-bold text-base rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar checklist'}
          </button>

          {/* Enviar diagnóstico */}
          {cliente?.email && (
            <button
              onClick={enviarDiagnostico}
              disabled={isEnviando || !completado || visita.diagnostico_enviado}
              className="w-full py-4 bg-blue-600 text-white font-bold text-base rounded-2xl active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isEnviando ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Enviando...</>
              ) : visita.diagnostico_enviado ? (
                '✓ Diagnóstico enviado'
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Enviar diagnóstico por email
                </>
              )}
            </button>
          )}
          {!cliente?.email && (
            <p className="text-xs text-gray-400 text-center">El cliente no tiene email — no se puede enviar diagnóstico</p>
          )}

          {/* Marcar como entregado */}
          <button
            onClick={marcarEntregado}
            disabled={isEntregando}
            className="w-full py-4 bg-[#C8102E] text-white font-extrabold text-lg rounded-2xl active:scale-95 transition-transform shadow-lg shadow-red-200 disabled:opacity-50"
          >
            {isEntregando ? 'Procesando...' : 'Marcar como entregado'}
          </button>
        </div>
      )}

      {entregado && (
        <div className="bg-gray-100 rounded-2xl p-5 text-center">
          <p className="text-2xl mb-1">✓</p>
          <p className="font-bold text-gray-700">Vehículo entregado</p>
        </div>
      )}
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
