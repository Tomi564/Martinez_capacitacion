/**
 * index.ts — Tipos TypeScript compartidos en todo el frontend
 *
 * Centralizar los tipos evita inconsistencias entre componentes.
 * Si el backend cambia un campo, se actualiza acá y TypeScript
 * marca todos los lugares que necesitan actualizarse.
 */

// ─────────────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────────────

export type Rol = 'vendedor' | 'admin';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  activo: boolean;
  avatar_url: string | null;
  created_at: string;
}

// Lo que devuelve el endpoint de login
export interface LoginResponse {
  token: string;
  user: Omit<User, 'activo' | 'created_at'>;
}

// ─────────────────────────────────────────────────────
// MÓDULOS
// ─────────────────────────────────────────────────────

export type EstadoModulo = 'bloqueado' | 'disponible' | 'en_curso' | 'aprobado';

export interface Modulo {
  id: string;
  titulo: string;
  descripcion: string;
  contenido: string | null;
  orden: number;
  video_url: string | null;
  pdf_url: string | null;
  duracion_min: number;
  activo: boolean;
  created_at: string;
}

// Módulo con el estado de progreso del vendedor incluido
export interface ModuloConProgreso extends Modulo {
  estado: EstadoModulo;
  mejor_nota: number | null;
  intentos: number;
  completado_at: string | null;
}

// ─────────────────────────────────────────────────────
// EXÁMENES
// ─────────────────────────────────────────────────────

export interface OpcionPregunta {
  id: string;
  texto: string;
}

export interface Pregunta {
  id: string;
  enunciado: string;
  opciones: OpcionPregunta[];
  // respuesta_correcta NUNCA viene del backend al frontend
}

// Respuestas que el vendedor envía al backend
// { pregunta_id: opcion_id_elegida }
export type RespuestasExamen = Record<string, string>;

export interface RetroalimentacionPregunta {
  pregunta_id: string;
  correcta: boolean;
  respuesta_dada: string;
  respuesta_correcta: string;
  explicacion: string | null;
}

export interface ResultadoExamen {
  nota: number;
  aprobado: boolean;
  respuestasCorrectas: number;
  totalPreguntas: number;
  siguienteModuloDesbloqueado: boolean;
  capacitacionCompleta?: boolean;
  retroalimentacion: RetroalimentacionPregunta[];
  mensaje: string;
}

export interface IntentoExamen {
  id: string;
  modulo_id: string;
  nota: number;
  aprobado: boolean;
  duracion_seg: number | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────
// PROGRESO
// ─────────────────────────────────────────────────────

export interface Progreso {
  id: string;
  user_id: string;
  modulo_id: string;
  estado: EstadoModulo;
  intentos: number;
  mejor_nota: number;
  ultimo_intento: string | null;
  completado_at: string | null;
}

// Resumen de progreso general del vendedor
export interface ResumenProgreso {
  totalModulos: number;
  modulosAprobados: number;
  modulosDisponibles: number;
  modulosBloqueados: number;
  promedioNotas: number;
  porcentajeCompletado: number;
}

// ─────────────────────────────────────────────────────
// SISTEMA QR
// ─────────────────────────────────────────────────────

export interface QRCodigo {
  id: string;
  user_id: string;
  codigo: string;
  activo: boolean;
  created_at: string;
}

export interface CalificacionQR {
  id: string;
  vendedor_id: string;
  estrellas: number;
  comentario: string | null;
  created_at: string;
}

export interface ResumenCalificaciones {
  promedio: number;
  total: number;
  distribucion: Record<number, number>; // { 1: 2, 2: 3, 3: 5, 4: 10, 5: 20 }
}

// ─────────────────────────────────────────────────────
// RESPUESTAS GENÉRICAS DE LA API
// ─────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}

// Wrapper genérico para respuestas paginadas (futuro)
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}