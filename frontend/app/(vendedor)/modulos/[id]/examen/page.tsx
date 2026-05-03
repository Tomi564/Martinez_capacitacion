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

import { useParams, useRouter } from 'next/navigation';
import { CelebracionAprobado } from '@/components/ui/CelebracionAprobado';
import { BadgeCheck, GraduationCap, Lightbulb, LockOpen, Timer } from 'lucide-react';
import { useExamen } from '@/hooks/useExamen';

/** Separa el enunciado en bloques legibles (párrafos o incisos a) b) c)). */
function fragmentosEnunciado(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  const porParrafos = t.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (porParrafos.length > 1) return porParrafos;
  const porInciso = t.split(/(?=[a-z]\)\s)/i).map((s) => s.trim()).filter(Boolean);
  return porInciso.length > 0 ? porInciso : [t];
}

export default function ExamenPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = params.id as string;
  const {
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
  } = useExamen(moduloId);

  const tieneRespuestaActual =
    typeof respuestaActual === 'string' && respuestaActual.trim().length > 0;

  // Formatear timer MM:SS
  const formatTiempo = (seg: number) => {
    const m = Math.floor(seg / 60).toString().padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
          className="w-full py-3 bg-[#C8102E] text-white rounded-xl font-semibold"
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
        <div className="grid grid-cols-4 gap-3">
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
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {resultado.puntajeObtenido != null && resultado.puntajeTotal != null
                ? `${resultado.puntajeObtenido}/${resultado.puntajeTotal}`
                : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Puntaje</p>
          </div>
        </div>

        {/* Nota mínima requerida */}
        {!resultado.aprobado && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-700 text-center">
              {resultado.mostrarRetroalimentacionDetallada === false
                ? 'No alcanzaste el mínimo para aprobar. Repasá el contenido completo del módulo antes del próximo intento.'
                : `No alcanzaste la nota mínima. Necesitás ${
                    resultado.puntajeMinimoAprobacion != null
                      ? `${resultado.puntajeMinimoAprobacion} puntos`
                      : 'el mínimo'
                  } para aprobar.`}
            </p>
          </div>
        )}

        {/* Capacitación completa — ir al certificado */}
        {resultado.capacitacionCompleta && (
          <div className="bg-[#1F1F1F] rounded-xl p-5 flex flex-col items-center gap-3 text-center">
            <GraduationCap className="w-7 h-7 text-white" />
            <p className="text-white font-bold text-base">¡Completaste toda la capacitación!</p>
            <p className="text-gray-400 text-sm">Tu certificado está listo. El equipo va a coordinar tu premio.</p>
            <button
              onClick={() => router.push('/modulos/certificado')}
              className="mt-1 px-6 py-2.5 bg-[#C8102E] text-white font-bold rounded-xl text-sm active:scale-95 transition-transform"
            >
              Ver mi certificado
            </button>
          </div>
        )}

        {/* Siguiente módulo desbloqueado */}
        {resultado.siguienteModuloDesbloqueado && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700 text-center flex items-center justify-center gap-1">
              <LockOpen className="w-4 h-4" />
              ¡Se desbloqueó el siguiente módulo!
            </p>
          </div>
        )}

        {/* Retroalimentación por pregunta */}
        {resultado.retroalimentacion && resultado.retroalimentacion.length > 0 && resultado.mostrarRetroalimentacionDetallada !== false && (
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
                          {item.tipo === 'desarrollo'
                            ? (item.respuesta_dada || 'Sin respuesta')
                            : (pregunta?.opciones.find(o => o.id === item.respuesta_dada)?.texto || item.respuesta_dada)}
                        </strong>
                      </p>
                      {item.tipo !== 'desarrollo' && (
                        <p className="text-xs text-green-700">
                          Correcta: <strong>
                            {pregunta?.opciones.find(o => o.id === item.respuesta_correcta)?.texto || item.respuesta_correcta}
                          </strong>
                        </p>
                      )}
                      {(item.puntaje_obtenido != null && item.puntaje_maximo != null) && (
                        <p className="text-xs text-gray-600">
                          Puntaje obtenido: <strong>{item.puntaje_obtenido}/{item.puntaje_maximo}</strong>
                        </p>
                      )}
                      {item.explicacion && (
                        <div className="mt-1 p-2.5 bg-white rounded-xl border border-red-100">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            <span className="inline-flex items-center gap-1">
                              <Lightbulb className="w-3.5 h-3.5" />
                              {item.explicacion}
                            </span>
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

        {!resultado.aprobado && resultado.mostrarRetroalimentacionDetallada === false && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700 text-center">
              Superaste el margen de error permitido para este examen. Esta vez no se muestra retroalimentación detallada.
              Repasá el módulo completo y volvé a intentarlo.
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/modulos')}
            className="w-full py-3 bg-[#C8102E] text-white font-semibold rounded-xl"
          >
            Ver todos los módulos
          </button>

          {!resultado.aprobado && (
            <button
              onClick={reintentar}
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

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">

      {/* Header del examen */}
      <div className="px-4 py-4 bg-white border-b border-gray-100 sticky top-[52px] z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">
            Pregunta {preguntaActual + 1} de {preguntas.length}
          </span>
          <span className="text-sm font-mono text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Timer className="w-4 h-4" />
              {formatTiempo(segundos)}
            </span>
          </span>
        </div>

        {/* Barra de progreso del examen */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-300"
            style={{
              width: `${((preguntaActual + 1) / preguntas.length) * 100}%`,
            }}
          />
        </div>

        {/* Indicadores (solo lectura: no se puede saltar ni volver atrás) */}
        <div className="flex gap-1.5 mt-3" role="list" aria-label="Progreso del examen">
          {preguntas.map((p, i) => (
            <div
              key={p.id}
              role="listitem"
              title={respuestas[p.id] ? 'Respondida' : i === preguntaActual ? 'Actual' : 'Pendiente'}
              className={`flex-1 h-2 rounded-full transition-colors ${
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
      <div className="flex-1 px-4 py-8">
        <div className="flex flex-col gap-5 mb-8">
          {pregunta?.enunciado
            ? fragmentosEnunciado(pregunta.enunciado).map((bloque, idx) => (
                <p key={idx} className="text-lg font-bold text-gray-900 leading-relaxed">
                  {bloque}
                </p>
              ))
            : null}
        </div>

        {/* Opciones / Desarrollo */}
        {pregunta?.tipo === 'desarrollo' ? (
          <div className="flex flex-col gap-3 mt-2">
            <label className="text-sm font-semibold text-gray-700">
              Tu respuesta (desarrollo)
            </label>
            <textarea
              value={respuestaActual || ''}
              onChange={(e) => seleccionarOpcion(e.target.value)}
              placeholder="Escribí tu respuesta con tus palabras..."
              rows={8}
              className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#C8102E] resize-none min-h-[11rem]"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pregunta?.opciones.map((opcion) => {
              const seleccionada = respuestaActual === opcion.id;
              return (
                <button
                  key={opcion.id}
                  type="button"
                  onClick={() => seleccionarOpcion(opcion.id)}
                  className={`
                    w-full text-left px-4 py-4 rounded-2xl border-2 transition-all
                    active:scale-[0.99]
                    ${seleccionada
                      ? 'border-gray-900 bg-[#C8102E] text-white'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className={`
                      w-7 h-7 rounded-full border-2 flex items-center justify-center
                      text-xs font-bold flex-shrink-0 mt-0.5
                      ${seleccionada
                        ? 'border-white text-white'
                        : 'border-gray-300 text-gray-500'
                      }
                    `}>
                      {opcion.id.toUpperCase()}
                    </span>
                    <span className="text-sm leading-relaxed pt-0.5">{opcion.texto}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navegación y envío */}
      <div className="px-4 py-5 bg-white border-t border-gray-100 pb-24">
        <div className="mb-4">
          {preguntaActual < preguntas.length - 1 ? (
            <button
              type="button"
              onClick={siguientePregunta}
              disabled={!tieneRespuestaActual}
              className="w-full py-3.5 rounded-2xl font-semibold text-base bg-gray-900 text-white active:scale-[0.99] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          ) : (
            <p className="text-center text-sm text-gray-500 leading-relaxed px-1">
              Última pregunta. Cuando todas estén respondidas, enviá el examen abajo.
            </p>
          )}
          {preguntaActual < preguntas.length - 1 && !tieneRespuestaActual && (
            <p className="text-xs text-center text-amber-700 mt-2 font-medium">
              Respondé esta pregunta para continuar.
            </p>
          )}
        </div>

        {/* Contador de respondidas */}
        <p className="text-xs text-center text-gray-400 mb-3">
          {preguntasRespondidas} de {preguntas.length} respondidas
        </p>

        {/* Botón enviar — solo activo cuando todas están respondidas */}
        <button
          onClick={submitExamen}
          disabled={!todasRespondidas || estado === 'enviando'}
          className="w-full py-4 bg-[#C8102E] text-white font-bold rounded-2xl disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          {estado === 'enviando' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            <span className="inline-flex items-center gap-1">
              Enviar examen {todasRespondidas ? <BadgeCheck className="w-4 h-4" /> : `(${preguntasRespondidas}/${preguntas.length})`}
            </span>
          )}
        </button>
      </div>

    </div>
  );
}