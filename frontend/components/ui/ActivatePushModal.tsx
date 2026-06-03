/**
 * ActivatePushModal.tsx — Modal para activar notificaciones push (estilo InstallPWA).
 * Aparece después de cerrar el modal PWA, si Notification.permission === 'default'.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { pushHabilitadoEnEntorno, suscribirPush } from '@/hooks/usePushNotifications';
import {
  dismissPushPromptThisSession,
  isPushPromptDismissedThisSession,
} from '@/lib/push-prompt-session';
import {
  isPwaModalCerradoSession,
  isPwaPromptPendingSession,
} from '@/lib/pwa-install-session';

const MSG_ERROR =
  'No se pudieron activar las notificaciones. Intentá de nuevo.';

export function ActivatePushModal() {
  const pendingPwaPrompt = useAuth((s) => s.pendingPwaPrompt);
  const pwaModalCerrado = useAuth((s) => s.pwaModalCerrado);
  const isAuthenticated = useAuth((s) => s.isAuthenticated());

  const [showModal, setShowModal] = useState(false);
  const [activando, setActivando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const devLogHecho = useRef(false);

  useEffect(() => setMounted(true), []);

  const pwaGateOpen =
    pwaModalCerrado ||
    isPwaModalCerradoSession() ||
    (!pendingPwaPrompt && !isPwaPromptPendingSession());

  useEffect(() => {
    if (!pushHabilitadoEnEntorno()) {
      if (!devLogHecho.current) {
        devLogHecho.current = true;
        console.info('Push notifications deshabilitadas en desarrollo');
      }
      setShowModal(false);
      return;
    }

    if (!mounted || !isAuthenticated || !pwaGateOpen) {
      setShowModal(false);
      return;
    }
    if (typeof Notification === 'undefined') {
      setShowModal(false);
      return;
    }
    if (Notification.permission === 'granted') {
      setShowModal(false);
      return;
    }
    if (Notification.permission === 'denied') {
      setShowModal(false);
      return;
    }
    if (isPushPromptDismissedThisSession()) {
      setShowModal(false);
      return;
    }
    setShowModal(true);
    setErrorMsg(null);
  }, [mounted, isAuthenticated, pwaGateOpen]);

  const handleActivar = async () => {
    setActivando(true);
    setErrorMsg(null);
    try {
      const ok = await suscribirPush();
      if (ok) {
        setShowModal(false);
        return;
      }
      setErrorMsg(MSG_ERROR);
    } catch {
      setErrorMsg(MSG_ERROR);
    } finally {
      setActivando(false);
    }
  };

  const handleDismiss = () => {
    dismissPushPromptThisSession();
    setErrorMsg(null);
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activar-push-titulo"
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-[#C8102E] rounded-xl flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h2 id="activar-push-titulo" className="text-lg font-bold text-gray-900">
              Activá las notificaciones
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Recibí alertas de ranking, comunicados y novedades importantes en tu celular.
            </p>
          </div>
        </div>

        {errorMsg && (
          <p role="alert" className="text-sm text-red-700 font-medium">
            {errorMsg}
          </p>
        )}

        {errorMsg ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={activando}
              className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => void handleActivar()}
              disabled={activando}
              className="flex-1 h-11 bg-[#C8102E] text-white rounded-xl text-sm font-semibold hover:bg-gray-900 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {activando ? 'Activando...' : 'Reintentar'}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={activando}
              className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Ahora no
            </button>
            <button
              type="button"
              onClick={() => void handleActivar()}
              disabled={activando}
              className="flex-1 h-11 bg-[#C8102E] text-white rounded-xl text-sm font-semibold hover:bg-gray-900 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {activando ? 'Activando...' : 'Activar notificaciones'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
