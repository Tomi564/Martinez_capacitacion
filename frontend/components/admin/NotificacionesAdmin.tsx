/**
 * NotificacionesAdmin.tsx — Panel de alertas para el admin
 * Muestra vendedores que alcanzaron el límite de intentos
 */

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  users: { nombre: string; apellido: string; email: string } | null;
  modulos: { titulo: string; orden: number } | null;
}

export function NotificacionesAdmin() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotificaciones = async () => {
    try {
      const res = await apiClient.get<{ notificaciones: Notificacion[] }>(
        '/admin/notificaciones'
      );
      setNotificaciones(res.notificaciones.filter(n => !n.leida));
    } catch (error) {
      console.error('[NotificacionesAdmin] Error cargando notificaciones', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const handleLeer = async (id: string) => {
    try {
      await apiClient.patch(`/admin/notificaciones/${id}/leer`, {});
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error(`[NotificacionesAdmin] Error marcando notificación ${id} como leída`, error);
    }
  };

  const handleLeerTodas = async () => {
    try {
      await apiClient.patch('/admin/notificaciones/leer-todas', {});
      setNotificaciones([]);
    } catch (error) {
      console.error('[NotificacionesAdmin] Error marcando todas como leídas', error);
    }
  };

  if (isLoading || notificaciones.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Alertas — {notificaciones.length} {notificaciones.length === 1 ? 'vendedor' : 'vendedores'} necesitan apoyo
          </p>
        </div>
        <button
          onClick={handleLeerTodas}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Marcar todas como leídas
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {notificaciones.map((n) => (
          <div
            key={n.id}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800">{n.titulo}</p>
              <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{n.mensaje}</p>
              <p className="text-xs text-red-400 mt-1">
                {new Date(n.created_at).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <button
              onClick={() => handleLeer(n.id)}
              className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
