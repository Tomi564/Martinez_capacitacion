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
  presion_psi?: number | null;
  updated_by_admin_at?: string | null;
  diagnostico_enviado: boolean;
  orden_estado?: string | null;
  neumaticos_cambiados?: boolean | null;
  km?: number | null;
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
  const [presionPsi, setPresionPsi] = useState('');
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [trenDelantero, setTrenDelantero] = useState<'x2' | 'x4' | 'no' | null>(null);
  const [trenAlineado, setTrenAlineado] = useState(false);
  const [trenBalanceo, setTrenBalanceo] = useState(false);
  const [amortiguadores, setAmortiguadores] = useState<boolean | null>(null);
  const [auxilio, setAuxilio] = useState<boolean | null>(null);
  const [presupuesto, setPresupuesto] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [finalizando, setFinalizando] = useState(false);

  const cargar = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await apiClient.get<{ visita: Visita; items: ChecklistItem[]; respuestas: Respuesta[] }>(`/mecanico/visitas/${id}`);
      setVisita(res.visita);
      setItems(res.items);
      setObservaciones(res.visita.observaciones || '');
      setPresionPsi(res.visita.presion_psi != null ? String(res.visita.presion_psi) : '');
      setTrenDelantero(
        res.visita.tren_delantero === 'x2' || res.visita.tren_delantero === 'x4' || res.visita.tren_delantero === 'no'
          ? res.visita.tren_delantero
          : null
      );
      setTrenAlineado(!!res.visita.tren_alineado);
      setTrenBalanceo(!!res.visita.tren_balanceo);
      if (res.visita.amortiguadores_revisados != null) setAmortiguadores(!!res.visita.amortiguadores_revisados);
      if (res.visita.auxilio_revisado != null) setAuxilio(!!res.visita.auxilio_revisado);
      setPresupuesto(res.visita.presupuesto || '');
      setFotos(Array.isArray(res.visita.fotos_neumatico_urls) ? res.visita.fotos_neumatico_urls : []);
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

  const guardar = async (): Promise<boolean> => {
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
        presion_psi: presionPsiBody,
        tren_delantero: trenDelantero,
        tren_alineado: trenAlineado,
        tren_balanceo: trenBalanceo,
        amortiguadores_revisados: amortiguadores,
        auxilio_revisado: auxilio,
        presupuesto: presupuesto.trim() || null,
        fotos_neumatico_urls: fotos.length ? fotos : null,
      });
      if (rows.length) {
        await apiClient.post(`/mecanico/visitas/${id}/checklist`, { respuestas: rows });
      }
      setMsg({ tipo: 'ok', texto: 'Guardado correctamente' });
      return true;
    } catch (error) {
      console.error('[VisitaDetallePage] Error guardando checklist/diagnóstico', error);
      const detalle = error instanceof Error ? error.message : '';
      setMsg({
        tipo: 'error',
        texto: detalle ? `Error al guardar: ${detalle}` : 'Error al guardar',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const enviarDiagnostico = async () => {
    setIsEnviando(true);
    setMsg(null);
    try {
      const ok = await guardar();
      if (!ok) return;
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

  const agregarFotos = (files: FileList | null) => {
    if (!files?.length) return;
    const toma = Array.from(files).filter((f) => f.type.startsWith('image/'));
    toma.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const r = String(reader.result || '');
        if (!r) return;
        setFotos((prev) => (prev.length >= 4 ? prev : [...prev, r]));
      };
      reader.readAsDataURL(file);
    });
  };

  const finalizarOrden = async () => {
    setFinalizando(true);
    setMsg(null);
    try {
      const ok = await guardar();
      if (!ok) return;
      await apiClient.patch(`/mecanico/visitas/${id}`, { orden_estado: 'finalizado' });
      setVisita((v) => (v ? { ...v, orden_estado: 'finalizado' } : v));
      setMsg({ tipo: 'ok', texto: 'Orden finalizada. Se notificó a vendedores y administración.' });
    } catch (e: unknown) {
      setMsg({
        tipo: 'error',
        texto: e instanceof Error ? e.message : 'No se pudo finalizar',
      });
    } finally {
      setFinalizando(false);
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
  const ordenCerrada =
    visita.orden_estado === 'finalizado' ||
    visita.orden_estado === 'incompleto';
  const entregado =
    visita.estado === 'entregado' || visita.estado_visita === 'cerrada' || ordenCerrada;
  const completado = items.length > 0 && items.every((i) => respuestas[i.id]?.estado);
  const mostrarParteGomero =
    visita.neumaticos_cambiados != null ||
    visita.marca_neumatico ||
    visita.observaciones_gomero;

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
        {visita.orden_estado && (
          <p className="text-xs font-semibold text-[#C8102E] mt-2">Estado orden: {visita.orden_estado}</p>
        )}
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

      {mostrarParteGomero && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Parte gomería</p>
          <ul className="text-sm text-amber-950 space-y-1">
            {visita.neumaticos_cambiados != null && (
              <li>Neumáticos cambiados: {visita.neumaticos_cambiados ? 'Sí' : 'No'}</li>
            )}
            {visita.km != null && <li>Km: {visita.km}</li>}
            {visita.marca_neumatico && <li>Marca: {visita.marca_neumatico}</li>}
            {!visita.neumaticos_cambiados && visita.medida_neumatico && (
              <li>Medida: {visita.medida_neumatico}</li>
            )}
            {visita.observaciones_gomero && <li>Obs.: {visita.observaciones_gomero}</li>}
          </ul>
        </div>
      )}

      {!entregado && (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tren delantero</p>
          <div className="grid grid-cols-3 gap-2">
            {(['x2', 'x4', 'no'] as const).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setTrenDelantero(op)}
                className={`py-4 rounded-2xl font-black text-sm border-2 ${
                  trenDelantero === op ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                {op === 'no' ? 'No' : op.toUpperCase()}
              </button>
            ))}
          </div>
          {(trenDelantero === 'x2' || trenDelantero === 'x4') && (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-base font-bold">
                <input type="checkbox" checked={trenAlineado} onChange={(e) => setTrenAlineado(e.target.checked)} className="w-6 h-6 rounded" />
                Alineado
              </label>
              <label className="flex items-center gap-2 text-base font-bold">
                <input type="checkbox" checked={trenBalanceo} onChange={(e) => setTrenBalanceo(e.target.checked)} className="w-6 h-6 rounded" />
                Balanceo
              </label>
            </div>
          )}

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amortiguadores revisados</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAmortiguadores(true)}
              className={`h-14 rounded-2xl font-black ${amortiguadores === true ? 'bg-green-600 text-white' : 'bg-white border-2 border-gray-200'}`}
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => setAmortiguadores(false)}
              className={`h-14 rounded-2xl font-black ${amortiguadores === false ? 'bg-gray-800 text-white' : 'bg-white border-2 border-gray-200'}`}
            >
              No
            </button>
          </div>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Auxilio revisado</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAuxilio(true)}
              className={`h-14 rounded-2xl font-black ${auxilio === true ? 'bg-green-600 text-white' : 'bg-white border-2 border-gray-200'}`}
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => setAuxilio(false)}
              className={`h-14 rounded-2xl font-black ${auxilio === false ? 'bg-gray-800 text-white' : 'bg-white border-2 border-gray-200'}`}
            >
              No
            </button>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Fotos del neumático (máx. 4)</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="w-full text-sm"
              onChange={(e) => agregarFotos(e.target.files)}
            />
            <p className="text-xs text-gray-400 mt-1">{fotos.length}/4 guardadas (en este dispositivo)</p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Presupuesto</p>
            <textarea
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-base"
              placeholder="Texto libre…"
            />
          </div>
        </div>
      )}

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

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Presión de neumáticos</p>
        <label className="text-sm text-gray-500">Presión (PSI)</label>
        <input
          type="number"
          disabled={entregado}
          value={presionPsi}
          onChange={(e) => setPresionPsi(e.target.value)}
          className="mt-1 w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
        />
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

            {visita.orden_estado === 'pendiente_mecanico' && (
              <button
                onClick={finalizarOrden}
                disabled={finalizando}
                className="w-full py-4 bg-[#16a34a] text-white font-black text-base rounded-2xl active:scale-95 transition-transform disabled:opacity-40"
              >
                {finalizando ? 'Finalizando…' : 'Finalizar orden'}
              </button>
            )}

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
