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
  'eliminar_comunicado',
  'editar_modulo',
];

const ROLES = ['', 'admin', 'vendedor', 'mecanico'];

function labelAccion(accion: string) {
  const map: Record<string, string> = {
    editar_vendedor: 'Editó vendedor',
    desactivar_vendedor: 'Desactivó vendedor',
    editar_visita: 'Editó visita',
    cerrar_visita: 'Cerró visita',
    publicar_comunicado: 'Publicó comunicado',
    eliminar_comunicado: 'Eliminó comunicado',
    editar_modulo: 'Editó módulo',
  };
  return map[accion] || accion;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  if (String(value).trim() === '') return '—';
  return String(value);
}

function sonIguales(a: unknown, b: unknown) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
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
        <p className="text-sm text-gray-500 mt-1">Trazabilidad de cambios sensibles del panel admin</p>
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
              <Card key={evento.id} className="rounded-2xl">
                <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{labelAccion(evento.accion)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {autorNombre} ({evento.rol}) · {evento.users?.email || 'sin email'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(evento.created_at).toLocaleString('es-AR')}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Entidad: <span className="font-medium">{evento.entidad}</span>
                  {evento.entidad_id ? ` · ID: ${evento.entidad_id}` : ''}
                </p>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => setEventoSeleccionado(evento)}
                  >
                    Ver cambios
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
          <div className="w-full sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Ver cambios</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {labelAccion(eventoSeleccionado.accion)} · {new Date(eventoSeleccionado.created_at).toLocaleString('es-AR')}
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

            <div className="overflow-y-auto px-4 py-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Antes</div>
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Después</div>
              </div>

              <div className="flex flex-col gap-2">
                {Array.from(
                  new Set([
                    ...Object.keys(eventoSeleccionado.datos_anteriores || {}),
                    ...Object.keys(eventoSeleccionado.datos_nuevos || {}),
                  ])
                ).map((key) => {
                  const antes = eventoSeleccionado.datos_anteriores?.[key];
                  const despues = eventoSeleccionado.datos_nuevos?.[key];
                  const cambio = !sonIguales(antes, despues);
                  return (
                    <div key={key} className="border border-gray-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{key}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className={`rounded-lg border px-2.5 py-2 text-xs ${
                          cambio ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}>
                          {formatValue(antes)}
                        </div>
                        <div className={`rounded-lg border px-2.5 py-2 text-xs ${
                          cambio ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}>
                          {formatValue(despues)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {Object.keys(eventoSeleccionado.datos_anteriores || {}).length === 0 &&
                  Object.keys(eventoSeleccionado.datos_nuevos || {}).length === 0 && (
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-sm text-gray-500">No hay datos de cambios para este evento.</p>
                    </div>
                  )}
              </div>
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
