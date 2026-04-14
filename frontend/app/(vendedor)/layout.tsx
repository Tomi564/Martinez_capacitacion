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
];

export default function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, nombreCompleto, logout, refreshUser } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Guard: redirigir si no está autenticado o es admin
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    if (isAdmin()) {
      router.replace('/admin');
      return;
    }
    // Verificar que el token siga siendo válido en el servidor
    refreshUser();
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !isAuthenticated()) return null;

  const isActive = (item: { href: string; exactMatch: boolean }) =>
    item.exactMatch
      ? pathname === item.href
      : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header superior */}
      <header className="bg-[#C8102E] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-xs text-red-200">Bienvenido</p>
          <p className="text-sm font-bold truncate max-w-[200px]">
            {nombreCompleto()}
          </p>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-[#A30D25] transition-colors"
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
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20">

        {/* Overlay */}
        <div
          onClick={() => setSheetOpen(false)}
          className={`fixed inset-0 bg-black transition-opacity duration-300 ${
            sheetOpen ? 'opacity-40 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Sheet de ítems secundarios */}
        <div
          className={`absolute bottom-full left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
            sheetOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-6 py-2">
            Navegación
          </p>
          <div className="grid grid-cols-2 gap-2 px-4 pb-6 pt-1">
            {NAV_SECONDARY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSheetOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-colors active:scale-95 ${
                  isActive(item)
                    ? 'bg-[#C8102E] text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Barra inferior fija */}
        <div className="relative bg-white border-t border-gray-200 grid grid-cols-3 items-center py-2">

          {/* Inicio — izquierda */}
          {NAV_PRIMARY.slice(0, 1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 transition-colors ${
                isActive(item) ? 'text-[#C8102E]' : 'text-gray-400'
              }`}
            >
              {item.icon}
              <span className={`text-xs ${isActive(item) ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          ))}

          {/* FAB central */}
          <button
            onClick={() => setSheetOpen((v) => !v)}
            className={`relative -top-5 mx-auto w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-90 ${
              sheetOpen
                ? 'bg-[#A30D25] shadow-red-400'
                : NAV_SECONDARY.some((item) => isActive(item))
                ? 'bg-[#A30D25] shadow-red-300'
                : 'bg-[#C8102E] shadow-red-300'
            }`}
            aria-label="Más opciones"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-6 h-6 text-white transition-transform duration-300 ${sheetOpen ? 'rotate-45' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>

          {/* Módulos — derecha */}
          {NAV_PRIMARY.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 transition-colors ${
                isActive(item) ? 'text-[#C8102E]' : 'text-gray-400'
              }`}
            >
              {item.icon}
              <span className={`text-xs ${isActive(item) ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          ))}

        </div>
      </nav>

      <InstallPWA />
    </div>
  );
}