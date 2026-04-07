/**
 * admin/modulos/[id]/page.tsx — Edición detallada de un módulo
 *
 * Permite al admin:
 *  - Editar título, descripción, duración
 *  - Ver y agregar preguntas del banco de examen
 *  - Subir video y PDF (URLs por ahora)
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { Modulo, Pregunta, OpcionPregunta } from '@/types';

interface PreguntaCompleta extends Pregunta {
  respuesta_correcta: string;
  explicacion: string | null;
}

interface ModuloDetalle extends Modulo {
  preguntas: PreguntaCompleta[];
}

interface NuevaPregunta {
  enunciado: string;
  opciones: OpcionPregunta[];
  respuesta_correcta: string;
  explicacion: string;
}

const OPCIONES_INICIALES: OpcionPregunta[] = [
  { id: 'a', texto: '' },
  { id: 'b', texto: '' },
  { id: 'c', texto: '' },
  { id: 'd', texto: '' },
];

export default function ModuloEditPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = params.id as string;

  const [modulo, setModulo] = useState<ModuloDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form de edición del módulo
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    contenido: '',
    duracion_min: 30,
    video_url: '',
    pdf_url: '',
  });

  // Form de nueva pregunta
  const [showPreguntaModal, setShowPreguntaModal] = useState(false);
  const [nuevaPregunta, setNuevaPregunta] = useState<NuevaPregunta>({
    enunciado: '',
    opciones: OPCIONES_INICIALES,
    respuesta_correcta: '',
    explicacion: '',
  });
  const [isCreatingPregunta, setIsCreatingPregunta] = useState(false);
  const [preguntaError, setPreguntaError] = useState<string | null>(null);

  const fetchModulo = async () => {
    try {
      const res = await apiClient.get<{ modulo: ModuloDetalle }>(
        `/admin/modulos/${moduloId}`
      );
      setModulo(res.modulo);
      setForm({
        titulo: res.modulo.titulo,
        descripcion: res.modulo.descripcion || '',
        contenido: res.modulo.contenido || '',
        duracion_min: res.modulo.duracion_min,
        video_url: res.modulo.video_url || '',
        pdf_url: res.modulo.pdf_url || '',
      });
    } catch (err) {
      setError('Error al cargar el módulo');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModulo();
  }, [moduloId]);

  const handleGuardar = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await apiClient.patch(`/admin/modulos/${moduloId}`, {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        contenido: form.contenido.trim() || null,
        duracion_min: Number(form.duracion_min),
        video_url: form.video_url.trim() || null,
        pdf_url: form.pdf_url.trim() || null,
      });
      setSuccessMsg('Módulo guardado correctamente');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al guardar el módulo'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCrearPregunta = async () => {
    if (!nuevaPregunta.enunciado.trim()) {
      setPreguntaError('El enunciado es requerido');
      return;
    }

    const opcionesValidas = nuevaPregunta.opciones.filter(
      (o) => o.texto.trim()
    );
    if (opcionesValidas.length < 2) {
      setPreguntaError('Necesitás al menos 2 opciones');
      return;
    }

    if (!nuevaPregunta.respuesta_correcta) {
      setPreguntaError('Seleccioná la respuesta correcta');
      return;
    }

    setIsCreatingPregunta(true);
    setPreguntaError(null);

    try {
      await apiClient.post(`/admin/modulos/${moduloId}/preguntas`, {
        enunciado: nuevaPregunta.enunciado.trim(),
        opciones: nuevaPregunta.opciones.filter((o) => o.texto.trim()),
        respuesta_correcta: nuevaPregunta.respuesta_correcta,
        explicacion: nuevaPregunta.explicacion.trim() || null,
      });

      setShowPreguntaModal(false);
      setNuevaPregunta({
        enunciado: '',
        opciones: OPCIONES_INICIALES.map((o) => ({ ...o, texto: '' })),
        respuesta_correcta: '',
        explicacion: '',
      });
      fetchModulo();
    } catch (err) {
      setPreguntaError(
        err instanceof Error ? err.message : 'Error al crear la pregunta'
      );
    } finally {
      setIsCreatingPregunta(false);
    }
  };

  const handleEliminarPregunta = async (preguntaId: string) => {
    if (!confirm('¿Eliminar esta pregunta? Esta acción no se puede deshacer.')) return;
    try {
      await apiClient.delete(`/admin/modulos/${moduloId}/preguntas/${preguntaId}`);
      fetchModulo();
    } catch {
      setError('Error al eliminar la pregunta');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!modulo) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">Módulo no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Módulo {modulo.orden} — {modulo.titulo}
          </h1>
          <p className="text-sm text-gray-500">
            {modulo.preguntas?.length || 0} preguntas en el banco
          </p>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-600">{successMsg}</p>
        </div>
      )}

      {/* Formulario de edición */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-base font-bold text-gray-900">
          Información del módulo
        </h2>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={3}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Material de estudio
              <span className="text-gray-400 font-normal ml-1">(el vendedor lo lee antes del examen)</span>
            </label>
            <textarea
              value={form.contenido}
              onChange={(e) => setForm({ ...form, contenido: e.target.value })}
              rows={12}
              placeholder="Escribí aquí el contenido del módulo: conceptos clave, procedimientos, información importante para el examen..."
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Duración (minutos)
            </label>
            <input
              type="number"
              min={1}
              value={form.duracion_min}
              onChange={(e) =>
                setForm({ ...form, duracion_min: Number(e.target.value) })
              }
              className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 w-32"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              URL del video
            </label>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://..."
              className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              URL del PDF
            </label>
            <input
              type="url"
              value={form.pdf_url}
              onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
              placeholder="https://..."
              className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        <button
          onClick={handleGuardar}
          disabled={isSaving}
          className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>

      {/* Banco de preguntas */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            Banco de preguntas
          </h2>
          <button
            onClick={() => setShowPreguntaModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar pregunta
          </button>
        </div>

        {modulo.preguntas?.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-2xl mb-2">❓</p>
            <p className="text-gray-500 text-sm">
              No hay preguntas en este módulo aún
            </p>
          </div>
        )}

        {modulo.preguntas?.map((pregunta, index) => (
          <div
            key={pregunta.id}
            className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-sm font-medium text-gray-900">
                  {pregunta.enunciado}
                </p>
              </div>
              <button
                onClick={() => handleEliminarPregunta(pregunta.id)}
                className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 flex-shrink-0"
              >
                Eliminar
              </button>
            </div>

            {/* Opciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 ml-9">
              {pregunta.opciones.map((opcion) => (
                <div
                  key={opcion.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    opcion.id === pregunta.respuesta_correcta
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <span className="font-bold uppercase text-xs w-4">
                    {opcion.id}
                  </span>
                  <span>{opcion.texto}</span>
                  {opcion.id === pregunta.respuesta_correcta && (
                    <span className="ml-auto text-green-600 text-xs font-semibold">
                      ✓ Correcta
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Explicación */}
            {pregunta.explicacion && (
              <div className="ml-9 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs text-amber-700 leading-relaxed">
                  💡 <span className="font-semibold">Explicación:</span> {pregunta.explicacion}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal nueva pregunta */}
      {showPreguntaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Nueva pregunta
              </h2>
              <button
                onClick={() => {
                  setShowPreguntaModal(false);
                  setPreguntaError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {preguntaError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{preguntaError}</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Enunciado */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Enunciado de la pregunta
                </label>
                <textarea
                  value={nuevaPregunta.enunciado}
                  onChange={(e) =>
                    setNuevaPregunta({
                      ...nuevaPregunta,
                      enunciado: e.target.value,
                    })
                  }
                  placeholder="¿Cuál es...?"
                  rows={2}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>

              {/* Opciones */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Opciones de respuesta
                </label>
                {nuevaPregunta.opciones.map((opcion) => (
                  <div key={opcion.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="respuesta_correcta"
                      value={opcion.id}
                      checked={nuevaPregunta.respuesta_correcta === opcion.id}
                      onChange={() =>
                        setNuevaPregunta({
                          ...nuevaPregunta,
                          respuesta_correcta: opcion.id,
                        })
                      }
                      className="w-4 h-4 accent-gray-900"
                    />
                    <span className="text-xs font-bold text-gray-500 uppercase w-4">
                      {opcion.id}
                    </span>
                    <input
                      type="text"
                      value={opcion.texto}
                      onChange={(e) => {
                        const nuevasOpciones = nuevaPregunta.opciones.map(
                          (o) =>
                            o.id === opcion.id
                              ? { ...o, texto: e.target.value }
                              : o
                        );
                        setNuevaPregunta({
                          ...nuevaPregunta,
                          opciones: nuevasOpciones,
                        });
                      }}
                      placeholder={`Opción ${opcion.id.toUpperCase()}`}
                      className="flex-1 h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-400">
                  Seleccioná el radio de la respuesta correcta
                </p>
              </div>

              {/* Explicación */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Explicación de la respuesta correcta
                  <span className="text-gray-400 font-normal ml-1">(opcional pero recomendado)</span>
                </label>
                <textarea
                  value={nuevaPregunta.explicacion}
                  onChange={(e) =>
                    setNuevaPregunta({
                      ...nuevaPregunta,
                      explicacion: e.target.value,
                    })
                  }
                  placeholder="Ej: La banda de rodadura es la parte del neumático que entra en contacto directo con el suelo, por eso es la más importante para la tracción y el frenado."
                  rows={2}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setShowPreguntaModal(false);
                  setPreguntaError(null);
                }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearPregunta}
                disabled={isCreatingPregunta}
                className="flex-1 py-3 bg-gray-900 text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreatingPregunta ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear pregunta'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}