/**
 * useAuth.ts — Store global de autenticación con Zustand
 *
 * Maneja el estado de sesión en toda la app:
 *  - Guardar/limpiar el token JWT
 *  - Datos del usuario logueado
 *  - Login y logout
 *  - Guards de rol (isAdmin, isVendedor)
 *
 * Por qué Zustand con persist:
 *  - El token sobrevive el refresh de página (localStorage)
 *  - Sin Context ni prop drilling — cualquier componente accede directo
 *  - Solo re-renderiza los componentes que usan el estado que cambió
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiError, apiClient, bindAuthTokenSource } from '@/lib/api';
import { resetPwaInstallSession } from '@/lib/pwa-install-session';
import type { User, LoginResponse } from '@/types';

interface AuthState {
  // Estado
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  /** True cuando /auth/me devolvió 401 — el layout vendedor muestra aviso y redirige al login */
  sessionExpiredBanner: boolean;
  /** True tras login exitoso — InstallPWA muestra el modal una vez por sesión */
  pendingPwaPrompt: boolean;

  // Acciones
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  clearSessionExpiredBanner: () => void;
  clearPendingPwaPrompt: () => void;
  refreshUser: () => Promise<void>;

  // Guards
  isAdmin: () => boolean;
  isVendedor: () => boolean;
  isAuthenticated: () => boolean;

  // Nombre completo del usuario
  nombreCompleto: () => string;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      // ─────────────────────────────────────────────────────
      // Estado inicial
      // ─────────────────────────────────────────────────────
      user: null,
      token: null,
      isLoading: false,
      error: null,
      sessionExpiredBanner: false,
      pendingPwaPrompt: false,

      // ─────────────────────────────────────────────────────
      // Login: llama al backend y guarda token + user
      // ─────────────────────────────────────────────────────
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<LoginResponse>('/auth/login', {
            email,
            password,
          });

          // Persistir de inmediato para evitar carreras al redirigir:
          // algunas vistas hacen requests apenas montan y leen el token desde localStorage.
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'martinez-auth',
              JSON.stringify({
                state: {
                  token: response.token,
                  user: response.user,
                },
                version: 0,
              })
            );
          }

          resetPwaInstallSession();
          set({
            token: response.token,
            user: response.user as User,
            isLoading: false,
            error: null,
            sessionExpiredBanner: false,
            pendingPwaPrompt: true,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error
              ? error.message
              : 'Error al iniciar sesión',
          });
          // Re-throw para que el componente de login pueda reaccionar
          throw error;
        }
      },

      // ─────────────────────────────────────────────────────
      // Logout: limpia el estado y redirige al login
      // ─────────────────────────────────────────────────────
      logout: () => {
        // Llamada al backend de forma silenciosa (sin await)
        // para que el logout sea instantáneo en la UI
        apiClient.post('/auth/logout').catch((error) => {
          console.error('[useAuth.logout] Error cerrando sesión en backend', error);
        });

        if (typeof window !== 'undefined') {
          localStorage.removeItem('martinez-auth');
        }

        set({
          user: null,
          token: null,
          error: null,
          sessionExpiredBanner: false,
          pendingPwaPrompt: false,
        });

        // Redirigir al login
        window.location.href = '/login';
      },

      // ─────────────────────────────────────────────────────
      // Refresca los datos del usuario desde el backend
      // Útil al volver a abrir la app después de un tiempo
      // ─────────────────────────────────────────────────────
      refreshUser: async () => {
        try {
          const response = await apiClient.get<{ user: User }>('/auth/me');
          set({ user: response.user, error: null });
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            console.error('[useAuth.refreshUser] Sesión inválida o expirada', error);
            set({
              token: null,
              user: null,
              error: null,
              sessionExpiredBanner: true,
            });
            return;
          }
          console.error('[useAuth.refreshUser] Error refrescando usuario', error);
          set({
            error:
              'No pudimos actualizar tus datos. Revisá tu conexión e intentá de nuevo.',
          });
        }
      },

      // ─────────────────────────────────────────────────────
      // Limpiar mensaje de error
      // ─────────────────────────────────────────────────────
      clearError: () => set({ error: null }),

      clearSessionExpiredBanner: () => set({ sessionExpiredBanner: false }),

      clearPendingPwaPrompt: () => set({ pendingPwaPrompt: false }),

      // ─────────────────────────────────────────────────────
      // Guards de rol
      // ─────────────────────────────────────────────────────
      isAdmin: () => get().user?.rol === 'admin',

      isVendedor: () => get().user?.rol === 'vendedor',

      isAuthenticated: () => {
        const { token, user } = get();
        if (!token || !user) return false;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp && Date.now() / 1000 > payload.exp) {
            get().logout();
            return false;
          }
        } catch (error) {
          console.error('[useAuth.isAuthenticated] Error leyendo token JWT', error);
          set({ error: 'No pudimos validar tu sesión. Iniciá sesión nuevamente.' });
        }
        return true;
      },

      // ─────────────────────────────────────────────────────
      // Helpers
      // ─────────────────────────────────────────────────────
      nombreCompleto: () => {
        const user = get().user;
        if (!user) return '';
        return `${user.nombre} ${user.apellido}`;
      },
    }),

    {
      name: 'martinez-auth', // key en localStorage
      // Solo persistir token y user, no el estado de loading/error
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

bindAuthTokenSource(() => useAuth.getState().token);