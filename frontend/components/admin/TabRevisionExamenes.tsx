'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api';

type RevisionEstadoFiltro = 'pendiente' | 'revisado';

interface PreguntaDesarrolloRevision {
  pregunta_id: string;
  enunciado: string;
  puntaje_maximo: number;
  puntaje_automatico: number;
  respuesta_vendedor: string;
}

export interface IntentoRevisionExamen {
  id: string;
  vendedor: { nombre: string; apellido: string };
  modulo: {
    id: string;
    titulo: string;
    orden: number;
    porcentaje_aprobacion: number;
  } | null;
  fecha: string;
  nota_automatica: number;
  revision_nota_final: number | null;
  revision_estado: string | null;
  revision_puntaje_ajustado?: Record<string, number> | null;
  puntaje_total: number;
  puntaje_obtenido_automatico: number;
  puntaje_obtenido_sin_desarrollo: number;
  puntaje_minimo_aprobacion: number;
  preguntas_desarrollo: PreguntaDesarrolloRevision[];
}

function nombreVendedor(v: { nombre: string; apellido: string }) {
  return `${v.nombre} ${v.apellido}`.trim();
}

function calcularNotaFinal(
  intento: IntentoRevisionExamen,
  puntajesManuales: Record<string, number>,
): number {
  if (!intento.puntaje_total) return 0;
  const puntosDesarrollo = intento.preguntas_desarrollo.reduce(
    (acc, p) => acc + (puntajesManuales[p.pregunta_id] ?? p.puntaje_automatico),
    0,
  );
  const total = intento.puntaje_obtenido_sin_desarrollo + puntosDesarrollo;
  return Number(((total / intento.puntaje_total) * 100).toFixed(2));
}

export function TabRevisionExamenes() {
  const [filtroEstado, setFiltroEstado] = useState<RevisionEstadoFiltro>('pendiente');
  const [intentos, setIntentos] = useState<IntentoRevisionExamen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<IntentoRevisionExamen | null>(null);
  const [puntajesManuales, setPuntajesManuales] = useState<Record<string, number>>({});
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const cargarIntentos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ intentos: IntentoRevisionExamen[] }>(
        `/admin/examenes/pendientes?estado=${filtroEstado}`,
      );
      setIntentos(res.intentos || []);
    } catch (err) {
      console.error('[TabRevisionExamenes] Error cargando intentos', err);
      setError('No se pudieron cargar los intentos de examen.');
      setIntentos([]);
    } finally {
      setIsLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    void cargarIntentos();
    setSeleccionado(null);
  }, [cargarIntentos]);

  const abrirIntento = (intento: IntentoRevisionExamen) => {
    setSeleccionado(intento);
    setMsg(null);
    const iniciales: Record<string, number> = {};
    for (const p of intento.preguntas_desarrollo) {
      if (filtroEstado === 'revisado' && intento.revision_puntaje_ajustado?.[p.pregunta_id] != null) {
        iniciales[p.pregunta_id] = intento.revision_puntaje_ajustado[p.pregunta_id];
      } else {
        iniciales[p.pregunta_id] = p.puntaje_automatico;
      }
    }
    setPuntajesManuales(iniciales);
  };

  const notaFinalPreview = useMemo(() => {
    if (!seleccionado) return null;
    return calcularNotaFinal(seleccionado, puntajesManuales);
  }, [seleccionado, puntajesManuales]);

  const aprobadoPreview = useMemo(() => {
    if (!seleccionado || notaFinalPreview == null) return false;
    const puntosDesarrollo = seleccionado.preguntas_desarrollo.reduce(
      (acc, p) => acc + (puntajesManuales[p.pregunta_id] ?? p.puntaje_automatico),
      0,
    );
    const totalPuntos = seleccionado.puntaje_obtenido_sin_desarrollo + puntosDesarrollo;
    return totalPuntos >= seleccionado.puntaje_minimo_aprobacion;
  }, [seleccionado, puntajesManuales, notaFinalPreview]);

  const guardarRevision = async () => {
    if (!seleccionado || filtroEstado !== 'pendiente') return;
    setGuardando(true);
    setMsg(null);
    try {
      await apiClient.patch(`/admin/examenes/${seleccionado.id}/revisar`, {
        puntaje_por_pregunta: puntajesManuales,
      });
      setMsg({ tipo: 'ok', texto: 'Revisión guardada correctamente' });
      setSeleccionado(null);
      await cargarIntentos();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      const texto = err instanceof ApiError ? err.message : 'No se pudo guardar la revisión';
      setMsg({ tipo: 'error', texto });
    } finally {
      setGuardando(false);
    }
  };

  const actualizarPuntaje = (preguntaId: string, valor: number, maximo: number) => {
    const clamped = Math.min(maximo, Math.max(0, Number(valor.toFixed(2))));
    setPuntajesManuales((prev) => ({ ...prev, [preguntaId]: clamped }));
  };

  return (
    <div className="flex flex-col gap-4">
      {msg && (
        <div
          className={`p-3 rounded-xl text-sm ${
            msg.tipo === 'ok'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
        >
          {msg.texto}
        </div>
      )}

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {(['pendiente', 'revisado'] as const).map((est) => (
          <button
            key={est}
            type="button"
            onClick={() => setFiltroEstado(est)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroEstado === est
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {est === 'pendiente' ? 'Pendientes' : 'Revisados'}
            {est === 'pendiente' && intentos.length > 0 && filtroEstado === 'pendiente' && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                {intentos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">
              {filtroEstado === 'pendiente' ? 'Revisión pendiente' : 'Intentos revisados'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Exámenes con respuestas de desarrollo que requieren o recibieron corrección manual.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : intentos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">
              {filtroEstado === 'pendiente'
                ? 'No hay exámenes pendientes de revisión.'
                : 'No hay exámenes revisados todavía.'}
            </p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {intentos.map((intento) => {
                const activo = seleccionado?.id === intento.id;
                const nota =
                  filtroEstado === 'revisado' && intento.revision_nota_final != null
                    ? intento.revision_nota_final
                    : intento.nota_automatica;
                return (
                  <button
                    key={intento.id}
                    type="button"
                    onClick={() => abrirIntento(intento)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      activo ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {nombreVendedor(intento.vendedor)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {intento.modulo
                        ? `Módulo ${intento.modulo.orden}: ${intento.modulo.titulo}`
                        : 'Módulo desconocido'}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                      <span>
                        Nota {filtroEstado === 'revisado' ? 'final' : 'automática'}:{' '}
                        <strong className="text-gray-800">{nota.toFixed(1)}%</strong>
                      </span>
                      <span>
                        {new Date(intento.fecha).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden lg:sticky lg:top-4">
          {!seleccionado ? (
            <div className="px-4 py-16 text-center text-sm text-gray-400">
              Seleccioná un intento para ver las respuestas de desarrollo.
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">
                  {nombreVendedor(seleccionado.vendedor)}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {seleccionado.modulo?.titulo ?? 'Módulo'} · Nota automática{' '}
                  {seleccionado.nota_automatica.toFixed(1)}%
                </p>
              </div>

              <div className="p-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                {seleccionado.preguntas_desarrollo.map((p) => (
                  <div key={p.pregunta_id} className="border border-gray-100 rounded-xl p-3">
                    <p className="text-sm font-semibold text-gray-900">{p.enunciado}</p>
                    <div className="mt-2 p-2.5 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 mb-1">Respuesta del vendedor</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{p.respuesta_vendedor || '—'}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Puntaje automático:{' '}
                      <strong className="text-gray-800">
                        {p.puntaje_automatico} / {p.puntaje_maximo}
                      </strong>
                    </p>

                    {filtroEstado === 'pendiente' && (
                      <div className="mt-3">
                        <label className="text-xs font-medium text-gray-600 block mb-1">
                          Puntaje manual (0 – {p.puntaje_maximo})
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={p.puntaje_maximo}
                            step={0.5}
                            value={puntajesManuales[p.pregunta_id] ?? p.puntaje_automatico}
                            onChange={(e) =>
                              actualizarPuntaje(p.pregunta_id, Number(e.target.value), p.puntaje_maximo)
                            }
                            className="flex-1 accent-[#C8102E]"
                          />
                          <input
                            type="number"
                            min={0}
                            max={p.puntaje_maximo}
                            step={0.5}
                            value={puntajesManuales[p.pregunta_id] ?? p.puntaje_automatico}
                            onChange={(e) =>
                              actualizarPuntaje(p.pregunta_id, Number(e.target.value), p.puntaje_maximo)
                            }
                            className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1 text-center"
                          />
                        </div>
                      </div>
                    )}

                    {filtroEstado === 'revisado' && seleccionado.revision_puntaje_ajustado && (
                      <p className="text-xs text-green-700 mt-2">
                        Puntaje asignado:{' '}
                        <strong>
                          {seleccionado.revision_puntaje_ajustado[p.pregunta_id] ?? '—'} / {p.puntaje_maximo}
                        </strong>
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">Nota final</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(filtroEstado === 'revisado' && seleccionado.revision_nota_final != null
                      ? seleccionado.revision_nota_final
                      : notaFinalPreview ?? seleccionado.nota_automatica
                    ).toFixed(1)}
                    %
                    {filtroEstado === 'pendiente' && (
                      <span
                        className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          aprobadoPreview
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {aprobadoPreview ? 'Aprobaría' : 'No aprobaría'}
                      </span>
                    )}
                  </p>
                </div>
                {filtroEstado === 'pendiente' && (
                  <button
                    type="button"
                    onClick={() => void guardarRevision()}
                    disabled={guardando}
                    className="px-4 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    {guardando ? 'Guardando...' : 'Guardar revisión'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
