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
import { apiClient } from '@/lib/api';
import type { User, LoginResponse } from '@/types';

interface AuthState {
  // Estado
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
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

          set({
            token: response.token,
            user: response.user as User,
            isLoading: false,
            error: null,
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
        apiClient.post('/auth/logout').catch(() => {});

        set({
          user: null,
          token: null,
          error: null,
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
          set({ user: response.user });
        } catch {
          // Si falla (token expirado), hacer logout
          get().logout();
        }
      },

      // ─────────────────────────────────────────────────────
      // Limpiar mensaje de error
      // ─────────────────────────────────────────────────────
      clearError: () => set({ error: null }),

      // ─────────────────────────────────────────────────────
      // Guards de rol
      // ─────────────────────────────────────────────────────
      isAdmin: () => get().user?.rol === 'admin',

      isVendedor: () => get().user?.rol === 'vendedor',

      isAuthenticated: () => !!get().token && !!get().user,

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