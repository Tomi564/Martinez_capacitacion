/**
 * supabase.ts — Cliente de Supabase para el frontend
 *
 * Este cliente usa la ANON KEY (no la service role key).
 * Con RLS activo, cada usuario solo puede ver sus propios datos.
 *
 * ¿Cuándo usamos este cliente y cuándo usamos apiClient?
 *  - apiClient → para toda la lógica de negocio (login, exámenes, progreso)
 *  - supabase  → para Realtime (notificaciones en vivo) y Storage (videos/PDFs)
 *
 * La lógica crítica siempre pasa por el backend Express,
 * nunca directo a Supabase desde el frontend.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase. Revisá el archivo .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Desactivamos la auth de Supabase en el frontend
    // porque manejamos la autenticación con nuestro propio JWT
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});