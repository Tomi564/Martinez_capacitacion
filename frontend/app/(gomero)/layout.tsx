'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { suscribirPush } from '@/hooks/usePushNotifications';

const NAV_PRIMARY = [
  {
    href: '/gomero',
    label: 'Inicio',
    exactMatch: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/gomero/nueva-orden',
    label: 'Nueva orden',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
];

export default function GomeroLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout, nombreCompleto, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    if (user?.rol === 'mecanico') { router.replace('/mecanico'); return; }
    if (user?.rol !== 'gomero') { router.replace('/login'); return; }
  }, []);

  useEffect(() => {
    if (!mounted || user?.rol !== 'gomero') return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      suscribirPush();
    }
  }, [mounted, user?.rol]);

  if (!mounted || !isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <AppHeader
        subtitle="Gomería"
        title={nombreCompleto()}
        onLogout={logout}
        leading={pathname !== '/gomero' ? (
          <button aria-label="Volver" onClick={() => router.back()} className="p-1.5 rounded-md hover:bg-[#2F2F2F] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        ) : undefined}
      />

      <main className="flex-1 pb-6">
        {children}
      </main>

      <BottomNav pathname={pathname} primaryItems={[NAV_PRIMARY[0], NAV_PRIMARY[1]]} />
    </div>
  );
}
