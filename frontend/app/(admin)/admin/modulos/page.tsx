/**
 * admin/modulos/page.tsx — Gestión de módulos
 *
 * Permite al admin:
 *  - Ver todos los módulos con su estado
 *  - Crear nuevos módulos
 *  - Activar/desactivar módulos
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { Modulo } from '@/types';

interface NuevoModulo {
  titulo: string;
  descripcion: string;
  orden: number;
  duracion_min: number;
}

export default function AdminModulosPage() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState<NuevoModulo>({
    titulo: '',
    descripcion: '',
    orden: 1,
    duracion_min: 30,
  });

  const fetchModulos = async () => {
    try {
      const res = await apiClient.get<{ modulos: Modulo[] }>(
        '/admin/modulos'
      );
      setModulos(res.modulos);
    } catch (err) {
      setError('Error al cargar los módulos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModulos();
  }, []);

  const handleCrear = async () => {
    if (!form.titulo || !form.descripcion) {
      setCreateError('Título y descripción son requeridos');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      await apiClient.post('/admin/modulos', form);
      setShowModal(false);
      setForm({ titulo: '', descripcion: '', orden: modulos.length + 1, duracion_min: 30 });
      fetchModulos();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Error al crear el módulo'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActivo = async (modulo: Modulo) => {
    try {
      await apiClient.patch(`/admin/modulos/${modulo.id}`, {
        activo: !modulo.activo,
      });
      fetchModulos();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-6xl mx-auto">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Módulos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {modulos.length} módulos en el sistema
          </p>
        </div>
        <button
          onClick={() => {
            setForm({
              titulo: '',
              descripcion: '',
              orden: modulos.length + 1,
              duracion_min: 30,
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo módulo
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Lista de módulos */}
      <div className="flex flex-col gap-3">
        {modulos.map((modulo) => (
          <div
            key={modulo.id}
            className={`bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 ${
              !modulo.activo ? 'opacity-50' : ''
            }`}
          >
            {/* Número de orden */}
            <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">
              {modulo.orden}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900">
                  {modulo.titulo}
                </h3>
                {!modulo.activo && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                {modulo.descripcion}
              </p>
              <div className="flex gap-3 mt-1">
                <span className="text-xs text-gray-400">
                  ⏱ {modulo.duracion_min} min
                </span>
                {modulo.video_url && (
                  <span className="text-xs text-green-600">✓ Video</span>
                )}
                {modulo.pdf_url && (
                  <span className="text-xs text-green-600">✓ PDF</span>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col lg:flex-row items-end lg:items-center gap-1.5 flex-shrink-0">
              <Link href={`/admin/modulos/${modulo.id}`}>
                <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                  Editar
                </button>
              </Link>
              <button
                onClick={() => handleToggleActivo(modulo)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  modulo.activo
                    ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                    : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {modulo.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar el módulo "${modulo.titulo}"? Esta acción no se puede deshacer.`)) {
                    apiClient.delete(`/admin/modulos/${modulo.id}`)
                      .then(() => fetchModulos())
                      .catch((err) => console.error(err));
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {modulos.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-2xl mb-2">📚</p>
            <p className="text-gray-500 text-sm">No hay módulos aún</p>
          </div>
        )}
      </div>

      {/* Modal crear módulo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Nuevo módulo</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCreateError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{createError}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Introducción a los Neumáticos"
                  className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción del módulo..."
                  rows={3}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Orden</label>
                  <input
                    type="number"
                    min={1}
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
                    className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Duración (min)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.duracion_min}
                    onChange={(e) => setForm({ ...form, duracion_min: Number(e.target.value) })}
                    className="h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setCreateError(null);
                }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                disabled={isCreating}
                className="flex-1 py-3 bg-gray-900 text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear módulo'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}