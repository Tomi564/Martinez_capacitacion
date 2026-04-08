'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Sugerencia {
  id: string;
  texto: string;
  estado: 'pendiente' | 'visto' | 'en_progreso' | 'listo';
  created_at: string;
}

const ESTADO_CONFIG: Record<Sugerencia['estado'], { label: string; color: string }> = {
  pendiente:   { label: 'Pendiente',    color: 'bg-gray-100 text-gray-600' },
  visto:       { label: 'Visto',        color: 'bg-blue-100 text-blue-700' },
  en_progreso: { label: 'En progreso',  color: 'bg-amber-100 text-amber-700' },
  listo:       { label: 'Listo',        color: 'bg-green-100 text-green-700' },
};

export default function SugerenciasPage() {
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSugerencias = async () => {
    try {
      const res = await apiClient.get<{ sugerencias: Sugerencia[] }>('/admin/sugerencias');
      setSugerencias(res.sugerencias);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSugerencias();
  }, []);

  const handleEnviar = async () => {
    if (!texto.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      await apiClient.post('/admin/sugerencias', { texto });
      setTexto('');
      fetchSugerencias();
    } catch {
      setError('Error al guardar la sugerencia');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (id: string, estado: Sugerencia['estado']) => {
    await apiClient.patch(`/admin/sugerencias/${id}`, { estado });
    setSugerencias((prev) => prev.map((s) => s.id === id ? { ...s, estado } : s));
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta sugerencia?')) return;
    await apiClient.delete(`/admin/sugerencias/${id}`);
    setSugerencias((prev) => prev.filter((s) => s.id !== id));
  };

  const pendientes = sugerencias.filter((s) => s.estado !== 'listo');
  const listos = sugerencias.filter((s) => s.estado === 'listo');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-2xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-gray-900">Sugerencias al desarrollador</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Escribí acá lo que querés cambiar o mejorar en la app
        </p>
      </div>

      {/* Nueva sugerencia */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
        <label className="text-sm font-semibold text-gray-900">Nueva sugerencia</label>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ej: Quiero que la pantalla de ventas muestre el total del día más grande..."
          rows={4}
          className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none placeholder:text-gray-400"
        />
        <button
          onClick={handleEnviar}
          disabled={!texto.trim() || guardando}
          className="self-end px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center gap-2"
        >
          {guardando ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar sugerencia'
          )}
        </button>
      </div>

      {/* Lista activas */}
      {pendientes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-gray-700">
            Activas ({pendientes.length})
          </h2>
          {pendientes.map((s) => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800 leading-relaxed flex-1">{s.texto}</p>
                <button
                  onClick={() => handleEliminar(s.id)}
                  className="text-gray-400 hover:text-red-500 shrink-0 mt-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {new Date(s.created_at).toLocaleDateString('es-AR')}
                </p>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_CONFIG[s.estado].color}`}>
                  {ESTADO_CONFIG[s.estado].label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista listos */}
      {listos.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-gray-400">
            Implementadas ({listos.length})
          </h2>
          {listos.map((s) => (
            <div key={s.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 opacity-60">
              <p className="text-sm text-gray-600 leading-relaxed line-through">{s.texto}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {new Date(s.created_at).toLocaleDateString('es-AR')}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                    Listo
                  </span>
                  <button
                    onClick={() => handleEliminar(s.id)}
                    className="text-gray-300 hover:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sugerencias.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-2">💡</p>
          <p className="text-gray-500 text-sm">Todavía no hay sugerencias</p>
        </div>
      )}

    </div>
  );
}
