/**
 * InstallPWA.tsx — Modal de instalación de la PWA
 *
 * Se muestra al iniciar sesión (login exitoso) si la app no está instalada.
 * iOS Safari: instrucciones manuales. Android/Chrome: beforeinstallprompt nativo.
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  dismissPwaInstallThisSession,
  isPwaInstallDismissedThisSession,
  isPwaModalCerradoSession,
  isPwaPromptPendingSession,
} from '@/lib/pwa-install-session';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isAppStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function detectIOSSafari(): boolean {
  const isIOSDevice =
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return isIOSDevice && isSafari;
}

export function InstallPWA() {
  const pendingPwaPrompt = useAuth((s) => s.pendingPwaPrompt);
  const clearPendingPwaPrompt = useAuth((s) => s.clearPendingPwaPrompt);
  const markPwaModalCerrado = useAuth((s) => s.markPwaModalCerrado);

  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    localStorage.removeItem('pwa-banner-dismissed');
  }, []);

  useEffect(() => {
    if (isAppStandalone()) {
      setIsInstalled(true);
      markPwaModalCerrado();
      clearPendingPwaPrompt();
      return;
    }

    if (detectIOSSafari()) {
      setIsIOS(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [clearPendingPwaPrompt, markPwaModalCerrado]);

  useEffect(() => {
    if (!pendingPwaPrompt && !isPwaPromptPendingSession()) {
      setShowModal(false);
      return;
    }
    if (isInstalled || isPwaInstallDismissedThisSession() || isPwaModalCerradoSession()) {
      setShowModal(false);
      return;
    }

    if (isIOS) {
      setShowModal(true);
      return;
    }

    if (promptEvent) {
      setShowModal(true);
      return;
    }

    setShowModal(false);
  }, [pendingPwaPrompt, isInstalled, isIOS, promptEvent]);

  /** Sin modal PWA posible: liberar gate para el modal push */
  useEffect(() => {
    const pwaPending = pendingPwaPrompt || isPwaPromptPendingSession();
    if (!pwaPending || isInstalled) return;

    if (isPwaInstallDismissedThisSession()) {
      markPwaModalCerrado();
      clearPendingPwaPrompt();
      return;
    }

    if (isIOS || promptEvent) return;

    const id = window.setTimeout(() => {
      markPwaModalCerrado();
      clearPendingPwaPrompt();
    }, 2500);

    return () => window.clearTimeout(id);
  }, [
    pendingPwaPrompt,
    isInstalled,
    isIOS,
    promptEvent,
    markPwaModalCerrado,
    clearPendingPwaPrompt,
  ]);

  const cerrarModal = () => {
    setShowModal(false);
    clearPendingPwaPrompt();
    markPwaModalCerrado();
  };

  const handleInstalar = async () => {
    if (!promptEvent) return;

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setPromptEvent(null);
    cerrarModal();
  };

  const handleDismiss = () => {
    dismissPwaInstallThisSession();
    cerrarModal();
  };

  if (!showModal || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="instalar-pwa-titulo"
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">MN</span>
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h2 id="instalar-pwa-titulo" className="text-lg font-bold text-gray-900">
              Instalá la app
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Accedé más rápido desde tu celular, como una app nativa.
            </p>
          </div>
        </div>

        {isIOS ? (
          <>
            <div className="flex flex-col gap-2.5 bg-gray-50 rounded-xl p-4">
              {[
                { step: '1', text: 'Tocá el botón compartir en Safari' },
                { step: '2', text: 'Seleccioná «Agregar a inicio»' },
                { step: '3', text: 'Tocá «Agregar»' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {item.step}
                  </span>
                  <span className="text-sm text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Buscá el ícono de compartir en la barra inferior de Safari.
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full h-11 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Ahora no
            </button>
          </>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Ahora no
            </button>
            <button
              type="button"
              onClick={handleInstalar}
              className="flex-1 h-11 bg-[#C8102E] text-white rounded-xl text-sm font-semibold hover:bg-gray-900 active:scale-[0.98] transition-transform"
            >
              Instalar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
