'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Comunicado {
  id: string;
  titulo: string;
  contenido: string;
  activo: boolean;
  created_at: string;
}

export default function ComunicadosPage() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const fetchComunicados = async () => {
    try {
      const res = await apiClient.get<{ comunicados: Comunicado[] }>('/admin/comunicados');
      setComunicados(res.comunicados);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchComunicados(); }, []);

  const handleGuardar = async () => {
    if (!titulo.trim() || !contenido.trim()) return;
    setGuardando(true);
    setMsg(null);
    try {
      await apiClient.post('/admin/comunicados', { titulo, contenido });
      setTitulo('');
      setContenido('');
      setShowForm(false);
      setMsg({ tipo: 'ok', texto: 'Comunicado publicado y enviado a todos los vendedores' });
      fetchComunicados();
      setTimeout(() => setMsg(null), 4000);
    } catch {
      setMsg({ tipo: 'error', texto: 'Error al publicar el comunicado' });
    } finally {
      setGuardando(false);
    }
  };

  const handleToggle = async (id: string, activo: boolean) => {
    await apiClient.patch(`/admin/comunicados/${id}`, { activo: !activo });
    setComunicados(prev => prev.map(c => c.id === id ? { ...c, activo: !activo } : c));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-3xl mx-auto">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicados</h1>
          <p className="text-sm text-gray-500 mt-1">
            El comunicado activo aparece como banner en el inicio de cada vendedor
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 h-10 px-4 bg-[#C8102E] text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm ${
          msg.tipo === 'ok'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {msg.texto}
        </div>
      )}

      {/* Activo destacado */}
      {comunicados.filter(c => c.activo).map(c => (
        <div key={c.id} className="bg-[#C8102E] text-white rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Activo ahora</span>
              </div>
              <p className="font-bold text-lg">{c.titulo}</p>
              <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{c.contenido}</p>
            </div>
            <button
              onClick={() => handleToggle(c.id, c.activo)}
              className="shrink-0 text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
            >
              Desactivar
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Publicado el {new Date(c.created_at).toLocaleDateString('es-AR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      ))}

      {/* Historial */}
      {comunicados.filter(c => !c.activo).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Historial</p>
          <div className="flex flex-col gap-2">
            {comunicados.filter(c => !c.activo).map(c => (
              <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.contenido}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(c.created_at).toLocaleDateString('es-AR', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(c.id, c.activo)}
                  className="shrink-0 text-xs px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                >
                  Reactivar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {comunicados.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-3xl mb-2">📣</p>
          <p className="font-semibold text-gray-700">Sin comunicados aún</p>
          <p className="text-sm text-gray-400 mt-1">Creá el primero para comunicarle algo al equipo</p>
        </div>
      )}

      {/* Modal nuevo comunicado */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Nuevo comunicado</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Al publicar, este comunicado reemplazará al activo actual y aparecerá en el inicio de todos los vendedores.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ej: Llegan Michelin el viernes"
                className="h-11 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Contenido</label>
              <textarea
                value={contenido}
                onChange={e => setContenido(e.target.value)}
                placeholder="Ej: El viernes 10 a las 9hs llega el camión con Michelin Pilot. Coordiná con depósito."
                rows={4}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !titulo.trim() || !contenido.trim()}
                className="flex-1 h-11 bg-[#C8102E] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {guardando ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
