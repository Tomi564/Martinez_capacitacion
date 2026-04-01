/**
 * ModuloCard.tsx — Tarjeta visual de un módulo
 *
 * Estados visuales claros:
 *  - Bloqueado: grisado, candado, no clickeable
 *  - Disponible: borde azul, botón "Empezar"
 *  - En curso: borde amber, botón "Continuar"
 *  - Aprobado: borde verde, nota visible, botón "Repasar"
 */

'use client';

import Link from 'next/link';
import type { ModuloConProgreso } from '@/types';

interface ModuloCardProps {
  modulo: ModuloConProgreso;
}

// Configuración visual por estado
const ESTADO_CONFIG = {
  bloqueado: {
    headerBg: 'bg-gray-200',
    borderClass: 'border-gray-200',
    badgeBg: 'bg-gray-100 text-gray-500',
    label: 'Bloqueado',
    ctaText: null,
    ctaBg: '',
  },
  disponible: {
    headerBg: 'bg-blue-500',
    borderClass: 'border-blue-200',
    badgeBg: 'bg-blue-50 text-blue-700',
    label: 'Disponible',
    ctaText: 'Empezar',
    ctaBg: 'bg-blue-600 hover:bg-blue-700',
  },
  en_curso: {
    headerBg: 'bg-amber-500',
    borderClass: 'border-amber-200',
    badgeBg: 'bg-amber-50 text-amber-700',
    label: 'En curso',
    ctaText: 'Continuar',
    ctaBg: 'bg-amber-500 hover:bg-amber-600',
  },
  aprobado: {
    headerBg: 'bg-green-500',
    borderClass: 'border-green-200',
    badgeBg: 'bg-green-50 text-green-700',
    label: 'Aprobado',
    ctaText: 'Repasar',
    ctaBg: 'bg-green-600 hover:bg-green-700',
  },
};

// Íconos SVG por estado
function EstadoIcon({ estado }: { estado: ModuloConProgreso['estado'] }) {
  if (estado === 'bloqueado') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    );
  }
  if (estado === 'aprobado') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    );
  }
  if (estado === 'en_curso') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
}

export function ModuloCard({ modulo }: ModuloCardProps) {
  const config = ESTADO_CONFIG[modulo.estado];
  const bloqueado = modulo.estado === 'bloqueado';

  const CardInner = (
    <div
      className={`
        bg-white rounded-2xl border-2 overflow-hidden
        ${config.borderClass}
        ${bloqueado ? 'opacity-60 cursor-not-allowed' : 'active:scale-95 transition-transform'}
      `}
    >
      {/* Header de color según estado */}
      <div className={`${config.headerBg} px-4 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-white text-xs font-bold uppercase tracking-wide">
            Módulo {modulo.orden}
          </span>
        </div>
        <div className="text-white">
          <EstadoIcon estado={modulo.estado} />
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 py-4">
        {/* Título y badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-900 text-base leading-tight flex-1">
            {modulo.titulo}
          </h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${config.badgeBg}`}>
            {config.label}
          </span>
        </div>

        {/* Descripción */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {modulo.descripcion}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {/* Duración */}
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {modulo.duracion_min} min
          </span>

          {/* Intentos si ya rindió */}
          {modulo.intentos > 0 && (
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              {modulo.intentos} {modulo.intentos === 1 ? 'intento' : 'intentos'}
            </span>
          )}

          {/* Mejor nota si aprobó */}
          {modulo.estado === 'aprobado' && modulo.mejor_nota !== null && (
            <span className="flex items-center gap-1 text-green-600 font-semibold ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {modulo.mejor_nota.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Botón CTA */}
        {config.ctaText && modulo.intentos < 3 && (
          <button
            className={`
              w-full mt-4 py-2.5 rounded-xl text-white text-sm font-semibold
              transition-colors ${config.ctaBg}
            `}
          >
            {config.ctaText} →
          </button>
        )}

        {/* Bloqueado por intentos */}
        {modulo.estado !== 'aprobado' && modulo.intentos >= 3 && (
          <div className="mt-4 py-2.5 px-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-red-600 text-center font-medium">
              ⚠ Límite de intentos — contactá a tu supervisor
            </p>
          </div>
        )}

        {/* Mensaje bloqueado */}
        {bloqueado && (
          <p className="mt-3 text-xs text-gray-400 text-center">
            Aprobá el módulo anterior para desbloquear
          </p>
        )}
      </div>
    </div>
  );

  // Si está bloqueado no es clickeable
  if (bloqueado) {
    return CardInner;
  }

  return (
    <Link href={`/modulos/${modulo.id}`}>
      {CardInner}
    </Link>
  );
}