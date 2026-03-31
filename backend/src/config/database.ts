/**
 * database.ts — Cliente de Supabase para el backend
 *
 * Usamos la SERVICE_ROLE_KEY (no la anon key) porque este cliente
 * corre en el servidor y necesita acceso completo a la base de datos,
 * saltándose el Row Level Security cuando sea necesario.
 *
 * IMPORTANTE: Esta key nunca debe llegar al frontend.
 * El frontend usa su propia anon key con RLS activo.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Las variables ya fueron validadas en env.ts, el ! es seguro acá
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // En el backend no necesitamos persistir sesiones
    // Cada request se autentica con el JWT propio del sistema
    autoRefreshToken: false,
    persistSession: false,
  },
});