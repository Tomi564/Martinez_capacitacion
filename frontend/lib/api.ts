/**
 * api.ts — Cliente HTTP para comunicarse con el backend Express
 *
 * Por qué no usamos fetch directamente en los componentes:
 *  - Un solo lugar para configurar la URL base, headers y manejo de errores
 *  - Si el backend cambia de URL, se cambia acá y listo
 *  - Intercepta automáticamente el token JWT del store de auth
 *  - Manejo consistente de errores en toda la app
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Obtiene el token JWT guardado en localStorage.
 * Zustand persist lo guarda bajo la key 'martinez-auth'.
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null; // SSR guard

  try {
    const stored = localStorage.getItem('martinez-auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.token || null;
  } catch (error) {
    console.error('[api.getToken] Error leyendo token de localStorage', error);
    return null;
  }
}

/**
 * Función base que wrappea fetch con:
 *  - URL base del backend
 *  - Headers de Content-Type y Authorization automáticos
 *  - Manejo de errores HTTP consistente
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Agregar el token si existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si la respuesta no es OK, extraemos el mensaje de error del backend
  if (!response.ok) {
    // 401 = token expirado o inválido → limpiar sesión y redirigir al login
    if (response.status === 401) {
      try {
        localStorage.removeItem('martinez-auth');
      } catch (error) {
        console.error('[api.request] Error limpiando sesión tras 401', error);
      }
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Error ${response.status}: ${response.statusText}`
    );
  }

  // 204 No Content — no hay body para parsear
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Cliente de API con métodos HTTP tipados.
 * Uso:
 *  const data = await apiClient.get<TipoRespuesta>('/modulos')
 *  const result = await apiClient.post<TipoRespuesta>('/auth/login', { email, password })
 */
export const apiClient = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};