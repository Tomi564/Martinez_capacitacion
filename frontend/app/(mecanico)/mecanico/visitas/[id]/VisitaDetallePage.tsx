'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { PageState } from '@/components/ui/PageState';
import { BadgeOrdenEstado } from '@/components/taller/BadgeOrdenEstado';
import { PresupuestoChecklistForm } from '@/components/taller/PresupuestoChecklistForm';
import {
  type CatalogoItemApi,
  type LineaGuardadaApi,
  type PresupuestoLineaState,
  emptyPresupuestoState,
  lineasParaApi,
  mergeCatalogoConLineas,
} from '@/lib/presupuesto-checklist';

interface Visita {
  id: string;
  estado: string;
  estado_visita?: 'abierta' | 'cerrada' | null;
  motivo: string | null;
  observaciones: string | null;
  operario_responsable?: string | null;
  diagnostico_enviado: boolean;
  orden_estado?: string | null;
  neumaticos_cambiados?: boolean | null;
  km?: number | null;
  marca_neumatico?: string | null;
  medida_neumatico?: string | null;
  observaciones_gomero?: string | null;
  vehiculos: {
    patente: string;
    marca: string;
    modelo: string;
    anio: number | null;
    medida_rueda: string | null;
    clientes: { nombre: string; apellido: string; email: string | null; telefono: string | null } | null;
  } | null;
}

export default function VisitaDetallePage() {
  const { id } = useParams<{ id: string }>();

  const [visita, setVisita] = useState<Visita | null>(null);
  const [lineas, setLineas] = useState<PresupuestoLineaState[]>(emptyPresupuestoState());
  const [operario, setOperario] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);
  const [isEntregando, setIsEntregando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [catalogoPendiente, setCatalogoPendiente] = useState(false);

  const cargar = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await apiClient.get<{
        visita: Visita;
        presupuesto_catalogo?: CatalogoItemApi[];
        presupuesto_lineas?: LineaGuardadaApi[];
        presupuesto_ok?: boolean;
      }>(`/mecanico/visitas/${id}`);

      setVisita(res.visita);
      setObservaciones(res.visita.observaciones || '');
      setOperario(res.visita.operario_responsable || '');

      const catalogo = res.presupuesto_catalogo || [];
      const guardadas = (res.presupuesto_lineas || []).map((l) => ({
        item_catalogo_id: l.item_catalogo_id,
        marcado: l.marcado,
        cantidad: l.cantidad,
        precio: l.precio,
      }));

      const okCatalogo = res.presupuesto_ok !== false && catalogo.length > 0;
      setCatalogoPendiente(!okCatalogo);
      if (okCatalogo) {
        setLineas(mergeCatalogoConLineas(catalogo, guardadas));
      } else {
        setLineas(emptyPresupuestoState());
      }
    } catch (error) {
      console.error('[VisitaDetallePage] Error cargando detalle de visita', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const guardar = async (): Promise<boolean> => {
    setIsSaving(true);
    setMsg(null);
    try {
      const payloadLineas = lineasParaApi(lineas);

      await apiClient.patch(`/mecanico/visitas/${id}`, {
        observaciones: observaciones.trim() || null,
        operario_responsable: operario.trim() || null,
        presupuesto_lineas: payloadLineas,
      });
      setMsg({ tipo: 'ok', texto: 'Guardado correctamente' });
      return true;
    } catch (error) {
      console.error('[VisitaDetallePage] Error guardando presupuesto', error);
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
      setVisita((v) => (v ? { ...v, diagnostico_enviado: true, estado: 'listo' } : v));
      setMsg({ tipo: 'ok', texto: 'Diagnóstico enviado por email' });
    } catch (e: unknown) {
      console.error('[VisitaDetallePage] Error enviando diagnóstico', e);
      setMsg({
        tipo: 'error',
        texto: e instanceof Error ? e.message : 'Error al enviar diagnóstico',
      });
    } finally {
      setIsEnviando(false);
    }
  };

  const finalizarOrden = async () => {
    setFinalizando(true);
    setMsg(null);
    try {
      const ok = await guardar();
      if (!ok) return;
      await apiClient.patch(`/mecanico/visitas/${id}`, { orden_estado: 'finalizado', estado: 'listo' });
      setVisita((v) => (v ? { ...v, orden_estado: 'finalizado', estado: 'listo' } : v));
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
      setVisita((v) => (v ? { ...v, estado_visita: nuevoEstado } : v));
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
    visita.orden_estado === 'finalizado' || visita.orden_estado === 'incompleto';
  const entregado =
    visita.estado === 'entregado' || visita.estado_visita === 'cerrada' || ordenCerrada;
  const tienePresupuesto = lineas.some((l) => l.marcado);
  const mostrarParteGomero =
    visita.neumaticos_cambiados != null ||
    visita.marca_neumatico ||
    visita.observaciones_gomero;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-32 flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-3xl font-black text-gray-900 tracking-widest">{vehiculo?.patente}</p>
        <p className="text-gray-600 font-medium mt-0.5">
          {vehiculo?.marca} {vehiculo?.modelo} {vehiculo?.anio && `· ${vehiculo.anio}`}
        </p>
        {vehiculo?.medida_rueda && (
          <p className="text-sm text-gray-400 mt-0.5">Rueda: {vehiculo.medida_rueda}</p>
        )}
        {cliente && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="font-bold text-gray-800">
              {cliente.nombre} {cliente.apellido}
            </p>
            {cliente.telefono && <p className="text-sm text-gray-500">{cliente.telefono}</p>}
            {cliente.email && <p className="text-sm text-gray-400">{cliente.email}</p>}
          </div>
        )}
        {visita.motivo && (
          <p className="text-sm text-gray-500 mt-2 italic">&ldquo;{visita.motivo}&rdquo;</p>
        )}
        {visita.orden_estado && (
          <div className="mt-2">
            <BadgeOrdenEstado ordenEstado={visita.orden_estado} />
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              entregado ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {entregado ? 'Cerrada' : 'Abierta'}
          </span>
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

      {catalogoPendiente && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Catálogo de presupuesto no disponible</p>
          <p className="mt-1">
            Ejecutá en Supabase la migración{' '}
            <code className="text-xs bg-amber-100 px-1 rounded">034_presupuesto_checklist.sql</code>, recargá esta
            página y volvé a guardar.
          </p>
        </div>
      )}

      {!entregado ? (
        <PresupuestoChecklistForm
          lineas={lineas}
          onChange={setLineas}
          operario={operario}
          onOperarioChange={setOperario}
          observaciones={observaciones}
          onObservacionesChange={setObservaciones}
        />
      ) : (
        <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600">
          Esta visita está cerrada. Reabrila para editar el presupuesto.
        </div>
      )}

      {msg && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            msg.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {msg.texto}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {!entregado && (
          <>
            <button
              onClick={guardar}
              disabled={isSaving}
              className="w-full py-4 bg-[#1F1F1F] text-white font-bold text-base rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar presupuesto'}
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
                disabled={isEnviando || !tienePresupuesto || visita.diagnostico_enviado}
                className="w-full py-4 bg-blue-600 text-white font-bold text-base rounded-2xl active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isEnviando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : visita.diagnostico_enviado ? (
                  '✓ Diagnóstico enviado'
                ) : (
                  'Enviar diagnóstico por email'
                )}
              </button>
            )}
            {!cliente?.email && (
              <p className="text-xs text-gray-400 text-center">
                La clientela no tiene email registrado, así que no se puede enviar diagnóstico.
              </p>
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
