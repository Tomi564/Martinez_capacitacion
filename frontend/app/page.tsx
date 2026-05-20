/**
 * page.tsx — Página raíz de la aplicación
 *
 * No muestra contenido propio.
 * Solo redirige según el estado de autenticación:
 *  - Sin sesión → /login
 *  - Por rol → /admin | /mecanico | /gomero | /dashboard (vendedor)
 *
 * Por qué lo hacemos acá y no en middleware.ts:
 *  El middleware de Next.js corre en el edge y no tiene acceso
 *  a localStorage donde Zustand guarda el token.
 *  Esta página corre en el cliente y sí puede leerlo.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function RootPage() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);

  useEffect(() => {
    const { isAuthenticated } = useAuth.getState();

    if (!token || !user) {
      router.replace('/login');
      return;
    }

    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    switch (user.rol) {
      case 'admin':
        router.replace('/admin');
        break;
      case 'mecanico':
        router.replace('/mecanico');
        break;
      case 'gomero':
        router.replace('/gomero');
        break;
      default:
        router.replace('/dashboard');
    }
  }, [router, token, user]);

  // Pantalla de carga mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}