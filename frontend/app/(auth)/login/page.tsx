/**
 * login/page.tsx — Pantalla de login
 *
 * Diseño mobile-first: ocupa toda la pantalla del celular.
 * Inputs grandes (min 44px) para touch.
 * Feedback visual claro en estados de carga y error.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated, isAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(isAdmin() ? '/admin' : '/dashboard');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
      // Login exitoso — redirigir según rol
      router.replace(isAdmin() ? '/admin' : '/dashboard');
    } catch {
      // El error ya está en el store, no hace falta manejarlo acá
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Header con branding */}
      <div className="bg-gray-900 text-white px-6 pt-16 pb-12">
        <div className="max-w-sm mx-auto">
          {/* Logo / ícono */}
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl">🔧</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">
            Martínez Neumáticos
          </h1>
          <p className="text-gray-400 text-sm">
            Sistema de capacitación
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-sm mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Iniciar sesión
          </h2>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                autoCapitalize="none"
                required
                disabled={isLoading}
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  className="w-full h-12 px-4 pr-12 bg-white border border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                />
                {/* Toggle mostrar/ocultar contraseña */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    // Ojo cerrado
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    // Ojo abierto
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-12 bg-gray-900 text-white font-semibold rounded-xl mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>

          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            ¿Problemas para acceder? Contactá al administrador.
          </p>
        </div>
      </div>

    </div>
  );
}