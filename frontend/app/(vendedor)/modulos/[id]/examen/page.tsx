/**
 * examen/page.tsx — Página del examen
 *
 * Estados de la página:
 *  1. Cargando preguntas
 *  2. Respondiendo (muestra preguntas una por una)
 *  3. Enviando respuestas
 *  4. Resultado (aprobado o desaprobado)
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { Pregunta, RespuestasExamen, ResultadoExamen, RetroalimentacionPregunta } from '@/types';
import { CelebracionAprobado } from '@/components/ui/CelebracionAprobado';

type EstadoExamen = 'cargando' | 'respondiendo' | 'enviando' | 'resultado';

export default function ExamenPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = params.id as string;

  const [estado, setEstado] = useState<EstadoExamen>('cargando');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestasExamen>({});
  const [resultado, setResultado] = useState<ResultadoExamen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarCelebracion, setMostrarCelebracion] = useState(false);

  // Timer en segundos
  const [segundos, setSegundos] = useState(0);

  // Cargar preguntas al montar
  useEffect(() => {
    const fetchPreguntas = async () => {
      try {
        const res = await apiClient.get<{ preguntas: Pregunta[] }>(
          `/examenes/${moduloId}/preguntas`
        );
        setPreguntas(res.preguntas);
        setEstado('respondiendo');
      } catch (err) {
        setError('Error al cargar el examen. Intentá de nuevo.');
        console.error(err);
      }
    };

    fetchPreguntas();
  }, [moduloId]);

  // Timer — corre mientras el vendedor responde
  useEffect(() => {
    if (estado !== 'respondiendo') return;

    const interval = setInterval(() => {
      setSegundos((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [estado]);

  // Formatear timer MM:SS
  const formatTiempo = (seg: number) => {
    const m = Math.floor(seg / 60).toString().padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Seleccionar una opción
  const seleccionarOpcion = (opcionId: string) => {
    const pregunta = preguntas[preguntaActual];
    setRespuestas((prev) => ({
      ...prev,
      [pregunta.id]: opcionId,
    }));
  };

  // Ir a la siguiente pregunta
  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual((p) => p + 1);
    }
  };

  // Ir a la pregunta anterior
  const anteriorPregunta = () => {
    if (preguntaActual > 0) {
      setPreguntaActual((p) => p - 1);
    }
  };

  // Enviar examen
  const submitExamen = useCallback(async () => {
    setEstado('enviando');
    try {
      const res = await apiClient.post<ResultadoExamen>(
        `/examenes/${moduloId}/submit`,
        { respuestas, duracion_seg: segundos }
      );
      setResultado(res);
      if (res.aprobado) setMostrarCelebracion(true);
      setEstado('resultado');
    } catch (err) {
      setError('Error al enviar el examen. Intentá de nuevo.');
      setEstado('respondiendo');
      console.error(err);
    }
  }, [moduloId, respuestas, segundos]);

  const preguntasRespondidas = Object.keys(respuestas).length;
  const todasRespondidas = preguntasRespondidas === preguntas.length;
  const respuestaActual = preguntas[preguntaActual]
    ? respuestas[preguntas[preguntaActual].id]
    : null;

  // ─── ESTADOS DE PANTALLA ───────────────────────────

  if (estado === 'cargando') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Preparando el examen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold"
        >
          Volver al módulo
        </button>
      </div>
    );
  }

  // ─── RESULTADO ─────────────────────────────────────

  if (estado === 'resultado' && resultado) {
    return (
      <>
      {/* Celebración */}
      {mostrarCelebracion && (
        <CelebracionAprobado
          nota={resultado.nota}
          moduloTitulo="Módulo completado"
          siguienteDesbloqueado={resultado.siguienteModuloDesbloqueado}
          onComplete={() => setMostrarCelebracion(false)}
        />
      )}
      <div className="px-4 py-8 max-w-lg mx-auto flex flex-col gap-6">

        {/* Ícono de resultado */}
        <div className="text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            resultado.aprobado ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {resultado.aprobado ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            )}
          </div>

          <h1 className={`text-2xl font-bold ${
            resultado.aprobado ? 'text-green-700' : 'text-red-700'
          }`}>
            {resultado.aprobado ? '¡Aprobaste!' : 'No aprobaste'}
          </h1>

          <p className="text-gray-500 text-sm mt-1">{resultado.mensaje}</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${
              resultado.aprobado ? 'text-green-600' : 'text-red-600'
            }`}>
              {resultado.nota.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Tu nota</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {resultado.respuestasCorrectas}/{resultado.totalPreguntas}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Correctas</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatTiempo(segundos)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Tiempo</p>
          </div>
        </div>

        {/* Nota mínima requerida */}
        {!resultado.aprobado && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-700 text-center">
              Necesitás <strong>80%</strong> para aprobar.
              Te faltaron <strong>{(80 - resultado.nota).toFixed(1)}%</strong> más.
              ¡Podés volver a intentarlo!
            </p>
          </div>
        )}

        {/* Siguiente módulo desbloqueado */}
        {resultado.siguienteModuloDesbloqueado && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700 text-center">
              🔓 ¡Se desbloqueó el siguiente módulo!
            </p>
          </div>
        )}

        {/* Retroalimentación por pregunta */}
        {resultado.retroalimentacion && resultado.retroalimentacion.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Revisión de respuestas
            </p>
            {resultado.retroalimentacion.map((item, index) => {
              const pregunta = preguntas.find(p => p.id === item.pregunta_id);
              return (
                <div
                  key={item.pregunta_id}
                  className={`rounded-2xl p-4 border ${
                    item.correcta
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      item.correcta ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {item.correcta ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                    </span>
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {pregunta?.enunciado || `Pregunta ${index + 1}`}
                    </p>
                  </div>

                  {!item.correcta && (
                    <div className="ml-7 flex flex-col gap-1.5">
                      <p className="text-xs text-red-600">
                        Tu respuesta: <strong>
                          {pregunta?.opciones.find(o => o.id === item.respuesta_dada)?.texto || item.respuesta_dada}
                        </strong>
                      </p>
                      <p className="text-xs text-green-700">
                        Correcta: <strong>
                          {pregunta?.opciones.find(o => o.id === item.respuesta_correcta)?.texto || item.respuesta_correcta}
                        </strong>
                      </p>
                      {item.explicacion && (
                        <div className="mt-1 p-2.5 bg-white rounded-xl border border-red-100">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            💡 {item.explicacion}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/modulos')}
            className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl"
          >
            Ver todos los módulos
          </button>

          {!resultado.aprobado && (
            <button
              onClick={() => {
                setEstado('cargando');
                setRespuestas({});
                setPreguntaActual(0);
                setSegundos(0);
                setResultado(null);
                // Recargar preguntas
                apiClient
                  .get<{ preguntas: Pregunta[] }>(`/examenes/${moduloId}/preguntas`)
                  .then((res) => {
                    setPreguntas(res.preguntas);
                    setEstado('respondiendo');
                  })
                  .catch(() => setError('Error al recargar el examen.'));
              }}
              className="w-full py-3 border-2 border-gray-900 text-gray-900 font-semibold rounded-xl"
            >
              Volver a intentar
            </button>
          )}
        </div>

      </div>
      </>
    );
  }

  // ─── EXAMEN EN CURSO ────────────────────────────────

  const pregunta = preguntas[preguntaActual];

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">

      {/* Header del examen */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 sticky top-[52px] z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900">
            Pregunta {preguntaActual + 1} de {preguntas.length}
          </span>
          <span className="text-sm font-mono text-gray-500">
            ⏱ {formatTiempo(segundos)}
          </span>
        </div>

        {/* Barra de progreso del examen */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-300"
            style={{
              width: `${((preguntaActual + 1) / preguntas.length) * 100}%`,
            }}
          />
        </div>

        {/* Indicadores de preguntas respondidas */}
        <div className="flex gap-1 mt-2">
          {preguntas.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setPreguntaActual(i)}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                respuestas[p.id]
                  ? 'bg-green-500'
                  : i === preguntaActual
                  ? 'bg-gray-900'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Pregunta */}
      <div className="flex-1 px-4 py-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 leading-snug">
          {pregunta?.enunciado}
        </h2>

        {/* Opciones */}
        <div className="flex flex-col gap-3">
          {pregunta?.opciones.map((opcion) => {
            const seleccionada = respuestaActual === opcion.id;
            return (
              <button
                key={opcion.id}
                onClick={() => seleccionarOpcion(opcion.id)}
                className={`
                  w-full text-left px-4 py-4 rounded-2xl border-2 transition-all
                  active:scale-95
                  ${seleccionada
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`
                    w-7 h-7 rounded-full border-2 flex items-center justify-center
                    text-xs font-bold flex-shrink-0
                    ${seleccionada
                      ? 'border-white text-white'
                      : 'border-gray-300 text-gray-500'
                    }
                  `}>
                    {opcion.id.toUpperCase()}
                  </span>
                  <span className="text-sm leading-snug">{opcion.texto}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navegación y envío */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 pb-24">
        <div className="flex gap-3 mb-3">
          <button
            onClick={anteriorPregunta}
            disabled={preguntaActual === 0}
            className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl disabled:opacity-30 active:scale-95 transition-transform"
          >
            ← Anterior
          </button>
          <button
            onClick={siguientePregunta}
            disabled={preguntaActual === preguntas.length - 1}
            className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl disabled:opacity-30 active:scale-95 transition-transform"
          >
            Siguiente →
          </button>
        </div>

        {/* Contador de respondidas */}
        <p className="text-xs text-center text-gray-400 mb-3">
          {preguntasRespondidas} de {preguntas.length} respondidas
        </p>

        {/* Botón enviar — solo activo cuando todas están respondidas */}
        <button
          onClick={submitExamen}
          disabled={!todasRespondidas || estado === 'enviando'}
          className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          {estado === 'enviando' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            `Enviar examen ${todasRespondidas ? '✓' : `(${preguntasRespondidas}/${preguntas.length})`}`
          )}
        </button>
      </div>

    </div>
  );
}