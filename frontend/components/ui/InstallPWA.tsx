/**
 * InstallPWA.tsx — Banner de instalación de la PWA
 *
 * Aparece automáticamente cuando el browser detecta que la app
 * puede instalarse y el usuario no la instaló todavía.
 *
 * En Android: usa el evento beforeinstallprompt de Chrome
 * En iOS: detecta Safari y muestra instrucciones manuales
 */

'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        (window.navigator as any).standalone === true);

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Verificar si el usuario ya cerró el banner antes
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    // Detectar iOS (Safari)
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOSDevice && isSafari) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // Android/Chrome: esperar el evento beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstalar = async () => {
    if (!promptEvent) return;

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setPromptEvent(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // No volver a mostrar por 7 días
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!showBanner || isInstalled) return null;

  // Banner para iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-gray-900">MN</span>
              </div>
              <div>
                <p className="font-bold text-sm">Instalá la app</p>
                <p className="text-xs text-gray-400">Accedé más rápido desde tu celular</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Instrucciones iOS */}
          <div className="flex flex-col gap-2">
            {[
              { step: '1', text: 'Tocá el botón compartir', icon: '□↑' },
              { step: '2', text: 'Seleccioná "Agregar a inicio"', icon: '+□' },
              { step: '3', text: 'Tocá "Agregar"', icon: '✓' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {item.step}
                </span>
                <span className="text-xs text-gray-300">{item.text}</span>
                <span className="ml-auto text-gray-400 text-xs font-mono">
                  {item.icon}
                </span>
              </div>
            ))}
          </div>

          {/* Flecha apuntando al botón de compartir */}
          <div className="flex justify-center mt-3">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <polyline points="19 12 12 19 5 12"/>
              </svg>
              Buscá este ícono en Safari
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Banner para Android/Chrome
  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-gray-900">MN</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Instalá la app</p>
            <p className="text-xs text-gray-400">
              Accedé más rápido sin abrir el browser
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 border border-gray-600 text-gray-300 font-semibold rounded-xl text-sm"
          >
            Ahora no
          </button>
          <button
            onClick={handleInstalar}
            className="flex-1 py-2.5 bg-white text-gray-900 font-bold rounded-xl text-sm active:scale-95 transition-transform"
          >
            Instalar ↓
          </button>
        </div>
      </div>
    </div>
  );
}