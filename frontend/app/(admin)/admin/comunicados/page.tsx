'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Comunicado {
  id: string;
  titulo: string;
  contenido: string;
  activo: boolean;
  created_at: string;
  programado_para?: string | null;
}

interface NotificacionRanking {
  id: string;
  tipo: 'te_superaron' | 'subiste_posicion' | 'cierre_semanal' | 'reinicio_lunes';
  titulo: string;
  cuerpo: string;
  created_at: string;
  users?: { nombre: string; apellido: string } | null;
}

export default function ComunicadosPage() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [notificacionesRanking, setNotificacionesRanking] = useState<NotificacionRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Comunicado | null>(null);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [programadoLocal, setProgramadoLocal] = useState(''); // datetime-local vacío = publicar ya
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [comunicadoAEliminar, setComunicadoAEliminar] = useState<Comunicado | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const fetchComunicados = async () => {
    try {
      const [res, logsRes] = await Promise.all([
        apiClient.get<{ comunicados: Comunicado[] }>('/admin/comunicados'),
        apiClient.get<{ notificaciones: NotificacionRanking[] }>('/admin/notificaciones-ranking?limit=40'),
      ]);
      setComunicados(res.comunicados);
      setNotificacionesRanking(logsRes.notificaciones || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchComunicados(); }, []);

  const cerrarFormulario = () => {
    setShowForm(false);
    setEditando(null);
    setTitulo('');
    setContenido('');
    setProgramadoLocal('');
  };

  const abrirNuevo = () => {
    setEditando(null);
    setTitulo('');
    setContenido('');
    setProgramadoLocal('');
    setShowForm(true);
  };

  const abrirEditar = (c: Comunicado) => {
    setEditando(c);
    setTitulo(c.titulo);
    setContenido(c.contenido);
    if (c.programado_para) {
      const d = new Date(c.programado_para);
      const pad = (n: number) => String(n).padStart(2, '0');
      setProgramadoLocal(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
      );
    } else {
      setProgramadoLocal('');
    }
    setShowForm(true);
  };

  const handleGuardar = async () => {
    if (!titulo.trim() || !contenido.trim()) return;
    setGuardando(true);
    setMsg(null);

    let programadoIso: string | null = null;
    if (programadoLocal.trim()) {
      const cuando = new Date(programadoLocal);
      if (Number.isNaN(cuando.getTime())) {
        setMsg({ tipo: 'error', texto: 'La fecha programada no es válida.' });
        setGuardando(false);
        return;
      }
      programadoIso = cuando.toISOString();
    }

    try {
      if (editando) {
        const body: Record<string, unknown> = { titulo, contenido };
        if (!editando.activo) {
          body.programado_para = programadoIso;
        }
        await apiClient.patch(`/admin/comunicados/${editando.id}`, body);
        setMsg({ tipo: 'ok', texto: 'Comunicado actualizado' });
      } else {
        if (programadoIso && new Date(programadoIso).getTime() > Date.now()) {
          await apiClient.post('/admin/comunicados', { titulo, contenido, programado_para: programadoIso });
          setMsg({ tipo: 'ok', texto: 'Comunicado programado correctamente' });
        } else {
          await apiClient.post('/admin/comunicados', { titulo, contenido });
          setMsg({ tipo: 'ok', texto: 'Comunicado publicado y enviado a todos los vendedores' });
        }
      }
      cerrarFormulario();
      fetchComunicados();
      setTimeout(() => setMsg(null), 4000);
    } catch {
      setMsg({ tipo: 'error', texto: editando ? 'Error al guardar cambios' : 'Error al publicar el comunicado' });
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    const c = comunicadoAEliminar;
    if (!c) return;
    setEliminando(true);
    setMsg(null);
    try {
      await apiClient.delete(`/admin/comunicados/${c.id}`);
      setComunicadoAEliminar(null);
      setMsg({ tipo: 'ok', texto: 'Comunicado eliminado' });
      fetchComunicados();
      setTimeout(() => setMsg(null), 4000);
    } catch {
      setMsg({ tipo: 'error', texto: 'No se pudo eliminar el comunicado' });
    } finally {
      setEliminando(false);
    }
  };

  const handleToggle = async (id: string, activo: boolean) => {
    await apiClient.patch(`/admin/comunicados/${id}`, { activo: !activo });
    await fetchComunicados();
  };

  const textoProgramacion = (iso: string | null | undefined) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          onClick={abrirNuevo}
          className="flex items-center gap-2 h-10 px-4 bg-[#C8102E] text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <p className="text-sm text-red-50 mt-1 whitespace-pre-wrap">{c.contenido}</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0 items-stretch">
              <button
                type="button"
                onClick={() => abrirEditar(c)}
                className="text-xs px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-colors font-medium"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setComunicadoAEliminar(c)}
                className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
              >
                Eliminar
              </button>
              <button
                type="button"
                onClick={() => handleToggle(c.id, c.activo)}
                className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
              >
                Desactivar
              </button>
            </div>
          </div>
          <p className="text-xs text-red-100/90">
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
              <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.contenido}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(c.created_at).toLocaleDateString('es-AR', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                  {c.programado_para && new Date(c.programado_para).getTime() > Date.now() && (
                    <p className="text-xs font-medium text-amber-700 mt-1">
                      Programado para {textoProgramacion(c.programado_para)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-stretch shrink-0">
                  <button
                    type="button"
                    onClick={() => abrirEditar(c)}
                    className="text-xs px-3 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setComunicadoAEliminar(c)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                  >
                    Eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(c.id, c.activo)}
                    className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                  >
                    Reactivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notificaciones de ranking enviadas */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Notificaciones de ranking enviadas
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-3">
          {notificacionesRanking.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Todavía no se enviaron notificaciones de ranking
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {notificacionesRanking.map((n) => (
                <div key={n.id} className="rounded-xl border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-900">{n.titulo}</p>
                  <p className="text-sm text-gray-700 mt-0.5">{n.cuerpo}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {n.users?.nombre ? `${n.users.nombre} ${n.users.apellido} · ` : ''}
                    {new Date(n.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {comunicados.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-3xl mb-2">📣</p>
          <p className="font-semibold text-gray-700">Sin comunicados aún</p>
          <p className="text-sm text-gray-400 mt-1">Creá el primero para comunicarle algo al equipo</p>
        </div>
      )}

      {/* Modal nuevo / editar */}
      {(showForm) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editando ? 'Editar comunicado' : 'Nuevo comunicado'}</h2>
              <button aria-label="Cerrar formulario" onClick={cerrarFormulario} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {editando?.activo
                ? 'Los cambios se aplican de inmediato al banner de inicio.'
                : editando
                  ? 'Podés cambiar texto o la fecha programada antes de que se publique.'
                  : 'Al publicar ahora, reemplaza al comunicado activo. Si definís fecha, se publicará solo y sin notificar hasta esa hora (revisión minuto a minuto por el servidor).'}
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

            {(!editando || !editando.activo) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Publicar el (opcional)</label>
                <input
                  type="datetime-local"
                  value={programadoLocal}
                  onChange={e => setProgramadoLocal(e.target.value)}
                  className="h-11 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
                <p className="text-xs text-gray-400">Vacío = publicación inmediata (si es nuevo).</p>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={cerrarFormulario} className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando || !titulo.trim() || !contenido.trim()}
                className="flex-1 h-11 bg-[#C8102E] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : editando ? 'Guardar' : (programadoLocal && new Date(programadoLocal).getTime() > Date.now() ? 'Programar' : 'Publicar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación eliminar (no usar alert del navegador) */}
      {comunicadoAEliminar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="eliminar-comunicado-titulo"
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl flex flex-col gap-4"
          >
            <h2 id="eliminar-comunicado-titulo" className="text-lg font-bold text-gray-900">
              ¿Eliminar este comunicado?
            </h2>
            <p className="text-sm text-gray-600">
              Se borrará <span className="font-semibold text-gray-900">«{comunicadoAEliminar.titulo}»</span> del historial.
              Los vendedores dejarán de verlo si estaba activo. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setComunicadoAEliminar(null)}
                disabled={eliminando}
                className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="flex-1 h-11 bg-[#C8102E] text-white rounded-xl text-sm font-semibold hover:bg-gray-900 disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
