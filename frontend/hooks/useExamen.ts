'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, apiClient } from '@/lib/api';
import type { Pregunta, RespuestasExamen, ResultadoExamen } from '@/types';

export type EstadoExamen = 'cargando' | 'error_carga' | 'respondiendo' | 'enviando' | 'resultado';

export function useExamen(moduloId: string) {
  const [estado, setEstado] = useState<EstadoExamen>('cargando');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestasExamen>({});
  const [resultado, setResultado] = useState<ResultadoExamen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarCelebracion, setMostrarCelebracion] = useState(false);
  const [segundos, setSegundos] = useState(0);

  const cargarPreguntas = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get<{ preguntas: Pregunta[] }>(`/examenes/${moduloId}/preguntas`);
      setPreguntas(res.preguntas);
      setEstado('respondiendo');
    } catch (err) {
      setError('Error al cargar el examen. Intentá de nuevo.');
      setEstado('error_carga');
      console.error('[useExamen] Error cargando preguntas', err);
    }
  }, [moduloId]);

  useEffect(() => {
    cargarPreguntas();
  }, [cargarPreguntas]);

  useEffect(() => {
    if (estado !== 'respondiendo') return;
    const interval = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [estado]);

  const seleccionarOpcion = (opcionId: string) => {
    const pregunta = preguntas[preguntaActual];
    if (!pregunta) return;
    setRespuestas((prev) => ({ ...prev, [pregunta.id]: opcionId }));
  };

  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) setPreguntaActual((p) => p + 1);
  };

  const submitExamen = useCallback(async () => {
    setEstado('enviando');
    try {
      const res = await apiClient.post<ResultadoExamen>(`/examenes/${moduloId}/submit`, {
        respuestas,
        duracion_seg: segundos,
      });
      setResultado(res);
      if (res.aprobado) setMostrarCelebracion(true);
      setEstado('resultado');
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 503
          ? err.message
          : 'Error al enviar el examen. Intentá de nuevo.';
      setError(msg);
      setEstado('respondiendo');
      console.error('[useExamen] Error enviando examen', err);
    }
  }, [moduloId, respuestas, segundos]);

  const reintentar = async () => {
    setEstado('cargando');
    setError(null);
    setRespuestas({});
    setPreguntaActual(0);
    setSegundos(0);
    setResultado(null);
    await cargarPreguntas();
  };

  const preguntasRespondidas = useMemo(
    () =>
      preguntas.filter((p) => {
        const r = respuestas[p.id];
        return typeof r === 'string' && r.trim().length > 0;
      }).length,
    [preguntas, respuestas]
  );
  const todasRespondidas = preguntas.length > 0 && preguntasRespondidas === preguntas.length;
  const respuestaActual = preguntas[preguntaActual] ? respuestas[preguntas[preguntaActual].id] : null;
  const pregunta = preguntas[preguntaActual];

  return {
    estado,
    preguntas,
    preguntaActual,
    respuestas,
    resultado,
    error,
    mostrarCelebracion,
    setMostrarCelebracion,
    segundos,
    preguntasRespondidas,
    todasRespondidas,
    respuestaActual,
    pregunta,
    seleccionarOpcion,
    siguientePregunta,
    submitExamen,
    reintentar,
  };
}
