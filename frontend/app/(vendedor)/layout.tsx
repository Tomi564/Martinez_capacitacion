/**
 * (vendedor)/layout.tsx — Layout con navegación mobile para vendedores
 *
 * Todas las rutas del vendedor (dashboard, módulos, progreso, mi-qr)
 * comparten este layout que incluye:
 *  - Header superior con nombre del usuario
 *  - Bottom navigation bar (navegación con el pulgar en mobile)
 *  - Guard de autenticación y rol
 *
 * Por qué Bottom Nav y no sidebar:
 *  En mobile el pulgar llega naturalmente al fondo de la pantalla.
 *  El 95% del uso será desde celular, así que optimizamos para eso.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { InstallPWA } from '@/components/ui/InstallPWA';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';

// Ítems siempre visibles
const NAV_PRIMARY = [
  {
    href: '/dashboard',
    label: 'Inicio',
    exactMatch: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/modulos',
    label: 'Módulos',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
];

// Ítems en el sheet expandible
const NAV_SECONDARY = [
  {
    href: '/progreso',
    label: 'Progreso',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/mi-qr',
    label: 'Mi QR',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <rect x="14" y="14" width="3" height="3"/>
        <rect x="18" y="18" width="3" height="3"/>
      </svg>
    ),
  },
  {
    href: '/atenciones',
    label: 'Ventas',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/>
        <line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    href: '/stock',
    label: 'Catálogo',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: '/ranking',
    label: 'Ranking',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
  {
    href: '/clientes',
    label: 'Clientes',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

export default function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, user, nombreCompleto, logout, refreshUser } = useAuth();

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    if (isAdmin()) { router.replace('/admin'); return; }
    if (user?.rol === 'mecanico') { router.replace('/mecanico'); return; }
    if (user?.rol === 'gomero') { router.replace('/gomero'); return; }
    // Verificar que el token siga siendo válido en el servidor
    refreshUser();
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <AppHeader
        subtitle="Bienvenido"
        title={nombreCompleto()}
        onLogout={logout}
      />

      {/* Contenido principal */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      <BottomNav
        pathname={pathname}
        primaryItems={[NAV_PRIMARY[0], NAV_PRIMARY[1]]}
        fabItems={NAV_SECONDARY}
        fabGridColumns={2}
      />

      <InstallPWA />
    </div>
  );
}