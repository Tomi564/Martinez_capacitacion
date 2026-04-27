/**
 * (admin)/layout.tsx — Layout del panel de administración
 *
 * Diferencias con el layout de vendedor:
 *  - Sidebar lateral en desktop (≥1024px)
 *  - Bottom nav en mobile (igual que vendedor)
 *  - Guard: solo admins pueden acceder
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { InstallPWA } from '@/components/ui/InstallPWA';
import { apiClient } from '@/lib/api';

// Ítems siempre visibles en el nav inferior (mobile)
const NAV_PRIMARY = [
  {
    href: '/admin',
    label: 'Panel',
    exactMatch: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/admin/ventas',
    label: 'Ventas',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
];

// Ítems en el sheet expandible (botón central)
const NAV_SECONDARY = [
  {
    href: '/admin/vendedores',
    label: 'Vendedores',
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
  {
    href: '/admin/modulos',
    label: 'Módulos',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    href: '/admin/reportes',
    label: 'Analíticas',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: '/admin/niveles',
    label: 'Niveles',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
  {
    href: '/admin/stock',
    label: 'Stock',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    href: '/admin/comunicados',
    label: 'Comunicados',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/>
        <path d="M9 17v1a3 3 0 0 0 6 0v-1"/>
      </svg>
    ),
  },
  {
    href: '/admin/clientes',
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
  {
    href: '/admin/participantes',
    label: 'Participantes',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8"/>
        <path d="M12 17v4"/>
      </svg>
    ),
  },
  {
    href: '/admin/sugerencias',
    label: 'Sugerencias',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    href: '/admin/estadisticas',
    label: 'Estadísticas',
    exactMatch: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

// Todos los ítems juntos para el sidebar desktop
const NAV_ITEMS = [...NAV_PRIMARY.slice(0, 1), ...NAV_SECONDARY, ...NAV_PRIMARY.slice(1)];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, nombreCompleto, logout, refreshUser } = useAuth();
  const [notificaciones, setNotificaciones] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Guard: solo admins
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    const u = useAuth.getState().user;
    if (!isAdmin()) {
      router.replace(u?.rol === 'mecanico' ? '/mecanico' : '/dashboard');
      return;
    }
    // Verificar que el token siga siendo válido en el servidor
    refreshUser();
  }, []);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const res = await apiClient.get<{ noLeidas: number }>(
          '/admin/notificaciones'
        );
        setNotificaciones(res.noLeidas);
      } catch {}
    };
    fetchNotificaciones();
    // Revisar cada 2 minutos
    const interval = setInterval(fetchNotificaciones, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !isAuthenticated() || !isAdmin()) return null;

  const isActive = (item: typeof NAV_ITEMS[0]) =>
    item.exactMatch
      ? pathname === item.href
      : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar — visible en desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#1F1F1F] text-white fixed inset-y-0 left-0 z-20">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#2F2F2F]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow">
              <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
                <circle cx="16" cy="16" r="13" fill="#C8102E"/>
                <circle cx="16" cy="16" r="5" fill="white"/>
                <circle cx="16" cy="16" r="2" fill="#C8102E"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight">Martínez</p>
              <p className="text-xs text-red-200">Panel Admin</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(item)
                  ? 'bg-white text-[#C8102E] font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#2F2F2F]'
              }`}
            >
              {item.icon}
              {item.label}
              {/* Badge de notificaciones en Dashboard */}
              {item.href === '/admin' && notificaciones > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {notificaciones > 9 ? '9+' : notificaciones}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Usuario y logout */}
        <div className="px-3 py-4 border-t border-[#2F2F2F]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-[#2F2F2F] rounded-full flex items-center justify-center text-xs font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{nombreCompleto()}</p>
              <p className="text-xs text-gray-400">Administrador</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-[#2F2F2F] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 lg:ml-64 flex flex-col w-0 min-w-0 overflow-x-hidden">

        {/* Header mobile */}
        <header className="lg:hidden bg-[#1F1F1F] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔧</span>
            <p className="text-sm font-bold">Panel Admin</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </header>

        {/* Página */}
        <main className="flex-1 pb-20 lg:pb-0 overflow-x-hidden">
          {children}
        </main>

        {/* Bottom nav — solo mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20">

          {/* Overlay oscuro al abrir el sheet */}
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
            {/* Handle visual */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-6 py-2">
              Navegación
            </p>
            <div className="grid grid-cols-3 gap-1 px-4 pb-6 pt-1">
              {NAV_SECONDARY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-4 rounded-2xl transition-colors active:scale-95 ${
                    isActive(item)
                      ? 'bg-[#C8102E] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Barra inferior fija */}
          <div className="relative bg-white border-t border-gray-200 grid grid-cols-3 items-center py-2">

            {/* Ítem izquierdo — Dashboard */}
            {NAV_PRIMARY.slice(0, 1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors ${
                  isActive(item) ? 'text-[#C8102E]' : 'text-gray-400'
                }`}
              >
                {item.icon}
                <span className={`text-xs ${isActive(item) ? 'font-semibold' : 'font-normal'}`}>
                  {item.label}
                </span>
                {/* Badge de notificaciones */}
                {item.href === '/admin' && notificaciones > 0 && (
                  <span className="absolute top-2 ml-4 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {notificaciones > 9 ? '9+' : notificaciones}
                  </span>
                )}
              </Link>
            ))}

            {/* Botón central FAB */}
            <button
              onClick={() => setSheetOpen((v) => !v)}
              className={`relative -top-5 mx-auto w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-90 ${
                sheetOpen
                  ? 'bg-[#C8102E] shadow-red-400'
                  : NAV_SECONDARY.some((item) => isActive(item))
                  ? 'bg-[#C8102E] shadow-red-300'
                  : 'bg-[#1F1F1F] shadow-gray-400'
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

            {/* Ítem derecho — Ventas */}
            {NAV_PRIMARY.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors ${
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

      </div>
      <InstallPWA />
    </div>
  );
}