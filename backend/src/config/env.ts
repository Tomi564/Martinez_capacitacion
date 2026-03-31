/**
 * env.ts — Validación de variables de entorno
 *
 * Se importa primero en server.ts para que el proceso muera
 * inmediatamente en startup si falta alguna variable crítica.
 * Es mucho mejor fallar al arrancar que fallar en medio de un request.
 */

import dotenv from 'dotenv';

// Cargar el archivo .env
dotenv.config();

// Lista de variables que DEBEN existir para que el backend funcione
const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'FRONTEND_URL',
] as const;

// Verificar que todas existen
const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error('❌ Faltan variables de entorno obligatorias:');
  missingVars.forEach((key) => console.error(`   - ${key}`));
  console.error('   Revisá el archivo .env en la raíz del backend.');
  process.exit(1); // Matar el proceso — no arrancar con config incompleta
}

console.log('✅ Variables de entorno cargadas correctamente');