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
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { InstallPWA } from '@/components/ui/InstallPWA';

// Ítems de la navegación inferior
const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/modulos',
    label: 'Módulos',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    href: '/progreso',
    label: 'Progreso',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/mi-qr',
    label: 'Mi QR',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <rect x="14" y="14" width="3" height="3"/>
        <rect x="19" y="14" width="2" height="2"/>
        <rect x="14" y="19" width="2" height="2"/>
        <rect x="18" y="18" width="3" height="3"/>
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
  const { isAuthenticated, isAdmin, nombreCompleto, logout } = useAuth();

  // Guard: redirigir si no está autenticado o es admin
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    if (isAdmin()) {
      router.replace('/admin');
    }
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header superior */}
      <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-xs text-gray-400">Bienvenido</p>
          <p className="text-sm font-semibold truncate max-w-[200px]">
            {nombreCompleto()}
          </p>
        </div>

        {/* Botón logout */}
        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Cerrar sesión"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </header>

      {/* Contenido principal */}
      {/* pb-20 para que el contenido no quede tapado por el bottom nav */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-[60px] ${
                  isActive
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {item.icon(isActive)}
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-normal'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
          <InstallPWA />
    </div>
  );
}