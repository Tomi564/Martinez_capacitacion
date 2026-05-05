'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type {
  PreguntaDiariaEstadoItem,
  PreguntasDiariasEstadoRespuesta,
  OpcionPregunta,
} from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

function fragmentosEnunciado(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  const porParrafos = t.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (porParrafos.length > 1) return porParrafos;
  const porInciso = t.split(/(?=[a-z]\)\s)/i).map((s) => s.trim()).filter(Boolean);
  return porInciso.length > 0 ? porInciso : [t];
}

const CAT_LABEL: Record<string, string> = {
  ventas: 'Ventas',
  producto: 'Producto',
};

function textoOpcion(opts: OpcionPregunta[], id: string): string {
  const o = opts.find((x) => String(x.id).toLowerCase() === String(id).toLowerCase());
  return o?.texto || id;
}

export function PreguntasDiariasDashboard() {
  const [data, setData] = useState<PreguntasDiariasEstadoRespuesta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const res = await apiClient.get<PreguntasDiariasEstadoRespuesta>('/preguntas-diarias/estado');
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las preguntas diarias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const responder = async (preguntaId: string, opcionId: string) => {
    setEnviandoId(preguntaId);
    setError(null);
    try {
      await apiClient.post(`/preguntas-diarias/${preguntaId}/responder`, { opcion_id: opcionId });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar la respuesta.');
    } finally {
      setEnviandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-56 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data || !data.eligible) return null;

  if (data.completado) {
    return (
      <Card className="rounded-2xl border-green-200 bg-green-50/90">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-green-900 leading-snug">{data.mensaje}</p>
          <p className="text-xs text-green-700 mt-2">Zona horaria: Argentina (Buenos Aires)</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preguntas del día</p>
        <p className="text-sm text-gray-600 mt-1">
          Dos preguntas rápidas — una de ventas y una de producto. Feedback al instante.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
      )}

      {data.items.map((item) => (
        <TarjetaPreguntaDiaria
          key={item.id}
          item={item}
          disabled={enviandoId !== null}
          enviando={enviandoId === item.id}
          onElegir={(opcionId) => responder(item.id, opcionId)}
        />
      ))}
    </div>
  );
}

function TarjetaPreguntaDiaria({
  item,
  disabled,
  enviando,
  onElegir,
}: {
  item: PreguntaDiariaEstadoItem;
  disabled: boolean;
  enviando: boolean;
  onElegir: (opcionId: string) => void;
}) {
  const respondida = item.estado === 'respondida';

  return (
    <Card className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="muted">{CAT_LABEL[item.categoria] || item.categoria}</Badge>
          {respondida && (
            <Badge variant={item.feedback.correcto ? 'success' : 'danger'}>
              {item.feedback.correcto ? 'Correcto' : 'Incorrecto'}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {fragmentosEnunciado(item.enunciado).map((bloque, idx) => (
            <p key={idx} className="text-base font-bold text-gray-900 leading-relaxed">
              {bloque}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {item.opciones.map((opcion) => {
            const seleccionada =
              respondida &&
              String(opcion.id).toLowerCase() === String(item.feedback.opcionElegida).toLowerCase();
            const esCorrecta =
              respondida &&
              String(opcion.id).toLowerCase() === String(item.feedback.respuestaCorrecta).toLowerCase();
            let clase =
              'w-full text-left px-4 py-4 rounded-2xl border-2 transition-all active:scale-[0.99] ';
            if (respondida) {
              if (esCorrecta) clase += 'border-green-600 bg-green-50 text-gray-900';
              else if (seleccionada) clase += 'border-red-500 bg-red-50 text-gray-900';
              else clase += 'border-gray-100 bg-gray-50 text-gray-400';
            } else {
              clase +=
                'border-gray-200 bg-white text-gray-900 hover:border-gray-400 disabled:opacity-45 disabled:cursor-not-allowed';
            }

            return (
              <button
                key={opcion.id}
                type="button"
                disabled={disabled || respondida || enviando}
                onClick={() => onElegir(opcion.id)}
                className={clase}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      respondida && esCorrecta
                        ? 'border-green-700 text-green-800'
                        : respondida && seleccionada
                          ? 'border-red-600 text-red-700'
                          : respondida
                            ? 'border-gray-200 text-gray-400'
                            : 'border-gray-300 text-gray-500'
                    }`}
                  >
                    {String(opcion.id).toUpperCase()}
                  </span>
                  <span className="text-sm leading-relaxed pt-0.5">{opcion.texto}</span>
                </div>
              </button>
            );
          })}
        </div>

        {respondida && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              item.feedback.correcto ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900'
            }`}
          >
            {!item.feedback.correcto && (
              <p className="font-semibold mb-1">
                La opción correcta era{' '}
                <span className="tabular-nums">{String(item.feedback.respuestaCorrecta).toUpperCase()}</span>
                {' — '}
                {textoOpcion(item.opciones, item.feedback.respuestaCorrecta)}
              </p>
            )}
            {item.feedback.explicacion ? (
              <p className="leading-relaxed whitespace-pre-wrap">{item.feedback.explicacion}</p>
            ) : (
              !item.feedback.correcto && <p className="text-amber-800/90">Repasá el concepto en los módulos.</p>
            )}
          </div>
        )}

        {enviando && (
          <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
            Guardando…
          </p>
        )}
      </CardContent>
    </Card>
  );
}
