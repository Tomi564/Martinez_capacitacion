'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EventoAuditoria {
  id: string;
  usuario_id: string | null;
  rol: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  datos_anteriores: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
  created_at: string;
  users?: { nombre?: string; apellido?: string; email?: string } | null;
}

interface AuditoriaResponse {
  eventos: EventoAuditoria[];
  total: number;
  limit: number;
  offset: number;
}

const ACCIONES = [
  '',
  'editar_vendedor',
  'desactivar_vendedor',
  'editar_visita',
  'cerrar_visita',
  'publicar_comunicado',
  'programar_comunicado',
  'editar_comunicado',
  'eliminar_comunicado',
  'editar_modulo',
];

const ROLES = ['', 'admin', 'vendedor', 'mecanico'];

const ORDEN_CAMPOS = [
  'titulo',
  'contenido',
  'activo',
  'programado_para',
  'created_at',
  'updated_at',
  'id',
];

function labelAccion(accion: string) {
  const map: Record<string, string> = {
    editar_vendedor: 'Cambió datos de un vendedor',
    desactivar_vendedor: 'Desactivó un vendedor',
    editar_visita: 'Editó una visita de taller',
    cerrar_visita: 'Cerró una visita de taller',
    publicar_comunicado: 'Publicó un comunicado al inicio de vendedores',
    programar_comunicado: 'Programó un comunicado para más tarde',
    editar_comunicado: 'Modificó un comunicado',
    eliminar_comunicado: 'Eliminó un comunicado',
    editar_modulo: 'Editó un módulo de capacitación',
  };
  return map[accion] || accion.replace(/_/g, ' ');
}

function labelEntidad(entidad: string) {
  const map: Record<string, string> = {
    comunicado: 'Comunicado para el equipo',
    comunicados: 'Comunicado para el equipo',
    visita: 'Visita en taller',
    visitas_taller: 'Visita en taller',
    modulo: 'Módulo de capacitación',
    modulos: 'Módulo de capacitación',
    usuario: 'Usuario',
    users: 'Usuario',
  };
  return map[entidad] || entidad;
}

function labelCampo(key: string) {
  const map: Record<string, string> = {
    id: 'Código interno (referencia)',
    activo: 'Estaba visible en el inicio',
    titulo: 'Título',
    contenido: 'Texto del mensaje',
    created_at: 'Fecha de creación',
    updated_at: 'Última modificación',
    programado_para: 'Publicación programada para',
  };
  return map[key] || key.replace(/_/g, ' ');
}

function cortarUuid(id: string | null | undefined) {
  if (!id || id.length < 12) return id || '';
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

function esIsoFecha(val: unknown) {
  return typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val);
}

function formatValor(value: unknown, key?: string): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  const s = String(value).trim();
  if (!s) return '—';

  const k = key || '';
  if (esIsoFecha(value) || k.endsWith('_at') || k === 'programado_para') {
    try {
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString('es-AR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      /* fall through */
    }
  }
  return s;
}

function sonIguales(a: unknown, b: unknown) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function ordenarClaves(keys: string[]) {
  return [...new Set(keys)].sort((a, b) => {
    const ia = ORDEN_CAMPOS.indexOf(a);
    const ib = ORDEN_CAMPOS.indexOf(b);
    const sa = ia === -1 ? 999 : ia;
    const sb = ib === -1 ? 999 : ib;
    if (sa !== sb) return sa - sb;
    return a.localeCompare(b);
  });
}

/** Texto corto para la tarjeta: sin jargon de base de datos. */
function resumenTarjeta(evento: EventoAuditoria): string {
  const prev = evento.datos_anteriores;
  const next = evento.datos_nuevos;

  if (evento.entidad === 'comunicado' || evento.accion.includes('comunicado')) {
    const tAnt = typeof prev?.titulo === 'string' ? prev.titulo : null;
    const tNue = typeof next?.titulo === 'string' ? next.titulo : null;
    if (evento.accion === 'eliminar_comunicado' && tAnt) {
      return `Se quitó el aviso «${tAnt}»; los vendedores ya no lo verán si estaba en el inicio.`;
    }
    if (evento.accion === 'publicar_comunicado' && tNue) {
      return `Nuevo aviso visible: «${tNue}».`;
    }
    if (evento.accion === 'programar_comunicado' && tNue) {
      return `Programó el aviso «${tNue}» para publicarse después.`;
    }
    if (evento.accion === 'editar_comunicado') {
      if (tAnt && tNue && tAnt !== tNue) return `Actualizó el comunicado (antes «${tAnt}»).`;
      if (tNue) return `Modificó el comunicado «${tNue}».`;
      if (tAnt) return `Modificó el comunicado «${tAnt}».`;
    }
  }

  if (evento.entidad_id) {
    return `Referencia: ${cortarUuid(evento.entidad_id)} (solo uso interno).`;
  }
  return labelEntidad(evento.entidad);
}

function clavesRelevantes(evento: EventoAuditoria) {
  return ordenarClaves([
    ...Object.keys(evento.datos_anteriores || {}),
    ...Object.keys(evento.datos_nuevos || {}),
  ]);
}

function esVistaEliminacion(evento: EventoAuditoria) {
  return (
    evento.accion === 'eliminar_comunicado' &&
    evento.datos_anteriores &&
    Object.keys(evento.datos_anteriores).length > 0 &&
    (!evento.datos_nuevos || Object.keys(evento.datos_nuevos).length === 0)
  );
}

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [rol, setRol] = useState('');
  const [accion, setAccion] = useState('');
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoAuditoria | null>(null);

  const cargar = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      params.set('offset', '0');
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      if (rol) params.set('rol', rol);
      if (accion) params.set('accion', accion);

      const res = await apiClient.get<AuditoriaResponse>(`/admin/auditoria?${params.toString()}`);
      setEventos(res.eventos || []);
      setTotal(res.total || 0);
    } catch {
      setError('No se pudo cargar la auditoría.');
      setEventos([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoría operacional</h1>
        <p className="text-sm text-gray-500 mt-1">Quién hizo qué y cuándo en el panel (texto resumido para revisión rápida).</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Rol</label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm bg-white"
          >
            {ROLES.map((r) => (
              <option key={r || 'all'} value={r}>
                {r ? r : 'Todos'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Acción</label>
          <select
            value={accion}
            onChange={(e) => setAccion(e.target.value)}
            className="mt-1 h-10 w-full px-3 border border-gray-200 rounded-xl text-sm bg-white"
          >
            {ACCIONES.map((a) => (
              <option key={a || 'all'} value={a}>
                {a ? labelAccion(a) : 'Todas'}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={cargar}
          className="sm:col-span-2 h-10 bg-[#C8102E] text-white rounded-xl text-sm font-semibold"
        >
          Filtrar
        </button>
      </div>

      <p className="text-xs text-gray-500">{total} eventos</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando eventos...</p>
      ) : eventos.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-500">No hay eventos para los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {eventos.map((evento) => {
            const autorNombre = evento.users
              ? `${evento.users.nombre || ''} ${evento.users.apellido || ''}`.trim()
              : 'Usuario desconocido';
            return (
              <Card key={evento.id} className="rounded-2xl border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{labelAccion(evento.accion)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {autorNombre} ({evento.rol})
                        {evento.users?.email ? ` · ${evento.users.email}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                      {new Date(evento.created_at).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-3 leading-snug">{resumenTarjeta(evento)}</p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      onClick={() => setEventoSeleccionado(evento)}
                    >
                      Ver detalle técnico
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {eventoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Detalle del evento</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {labelAccion(eventoSeleccionado.accion)} ·{' '}
                  {new Date(eventoSeleccionado.created_at).toLocaleString('es-AR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEventoSeleccionado(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4">
              {esVistaEliminacion(eventoSeleccionado) ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Así estaba configurado este comunicado <strong>antes</strong> de borrarlo. La columna “después” queda vacía
                    porque el registro ya no existe.
                  </p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                    {ordenarClaves(Object.keys(eventoSeleccionado.datos_anteriores || {}))
                      .filter((k) => k !== 'id')
                      .map((key) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:gap-3 sm:items-baseline border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                          <span className="text-xs font-semibold text-gray-600 shrink-0 sm:w-40">{labelCampo(key)}</span>
                          <span className="text-sm text-gray-900 break-words">{formatValor(eventoSeleccionado.datos_anteriores?.[key], key)}</span>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    Código interno solo para soporte:{' '}
                    {cortarUuid(
                      typeof eventoSeleccionado.datos_anteriores?.id === 'string'
                        ? (eventoSeleccionado.datos_anteriores.id as string)
                        : eventoSeleccionado.entidad_id ?? undefined,
                    )}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Comparación campo a campo (valores oscuros sobre fondo claro para buena lectura).
                  </p>
                  <div className="hidden md:grid grid-cols-2 gap-2 mb-2 text-xs font-semibold text-gray-600 px-1">
                    <span>Valor anterior</span>
                    <span>Valor nuevo</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {clavesRelevantes(eventoSeleccionado).map((key) => {
                      const antes = eventoSeleccionado.datos_anteriores?.[key];
                      const despues = eventoSeleccionado.datos_nuevos?.[key];
                      const cambio = !sonIguales(antes, despues);

                      const boxAntes =
                        'rounded-lg border px-3 py-2.5 text-sm leading-relaxed bg-slate-100 border-slate-300 text-slate-900 whitespace-pre-wrap break-words';
                      const boxDespuesIgual =
                        'rounded-lg border px-3 py-2.5 text-sm leading-relaxed bg-gray-50 border-gray-200 text-gray-700 whitespace-pre-wrap break-words';
                      const boxDespuesCambio =
                        'rounded-lg border px-3 py-2.5 text-sm leading-relaxed bg-emerald-50 border-emerald-300 text-emerald-950 whitespace-pre-wrap break-words';

                      return (
                        <div key={key} className="rounded-xl border border-gray-200 p-3 bg-white">
                          <p className="text-xs font-bold text-gray-800 mb-2">{labelCampo(key)}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <p className="md:hidden text-[10px] font-semibold text-gray-500 uppercase mb-1">Antes</p>
                              <div className={cambio ? `${boxAntes} ring-2 ring-amber-200` : boxAntes}>
                                {formatValor(antes, key)}
                              </div>
                            </div>
                            <div>
                              <p className="md:hidden text-[10px] font-semibold text-gray-500 uppercase mb-1">Después</p>
                              <div className={cambio ? boxDespuesCambio : boxDespuesIgual}>
                                {formatValor(despues, key)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {clavesRelevantes(eventoSeleccionado).length === 0 && (
                      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <p className="text-sm text-gray-600">No se guardaron datos detallados para este evento.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <Button type="button" variant="outline" className="w-full" onClick={() => setEventoSeleccionado(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
