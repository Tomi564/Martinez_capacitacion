/**
 * Insignias.tsx — Sistema de insignias digitales por módulo aprobado
 *
 * Cada módulo tiene una insignia única que se desbloquea al aprobarlo.
 * Las insignias bloqueadas se muestran en gris con candado.
 */

'use client';

import type { ModuloConProgreso } from '@/types';

// Configuración visual de cada insignia por orden de módulo
const INSIGNIAS_CONFIG: Record<number, {
  icono: string;
  nombre: string;
  color: string;
  bg: string;
  border: string;
}> = {
  1:  { icono: '🏁', nombre: 'Bienvenida',    color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  2:  { icono: '🔧', nombre: 'Producto',       color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  3:  { icono: '⚙️', nombre: 'Servicios',      color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200' },
  4:  { icono: '💡', nombre: 'Venta',          color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  5:  { icono: '🎯', nombre: 'Cliente',        color: 'text-pink-700',   bg: 'bg-pink-50',   border: 'border-pink-200' },
  6:  { icono: '🛡️', nombre: 'Objeciones',    color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  7:  { icono: '📱', nombre: 'Digital',        color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  8:  { icono: '📊', nombre: 'Estadísticas',   color: 'text-cyan-700',   bg: 'bg-cyan-50',   border: 'border-cyan-200' },
  9:  { icono: '⭐', nombre: 'Calidad',        color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  10: { icono: '🏆', nombre: 'Certificación',  color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
};

interface InsigniasProps {
  modulos: ModuloConProgreso[];
}

export function Insignias({ modulos }: InsigniasProps) {
  const aprobados = modulos.filter(m => m.estado === 'aprobado').length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Mis insignias
        </p>
        <p className="text-xs text-gray-400">
          {aprobados} de {modulos.length} desbloqueadas
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {modulos
          .sort((a, b) => a.orden - b.orden)
          .map((modulo) => {
            const config = INSIGNIAS_CONFIG[modulo.orden] || {
              icono: '📚',
              nombre: `Módulo ${modulo.orden}`,
              color: 'text-gray-700',
              bg: 'bg-gray-50',
              border: 'border-gray-200',
            };

            const desbloqueada = modulo.estado === 'aprobado';

            return (
              <div
                key={modulo.id}
                className="flex flex-col items-center gap-1"
              >
                <div className={`
                  w-14 h-14 rounded-2xl border-2 flex items-center justify-center
                  transition-all duration-300
                  ${desbloqueada
                    ? `${config.bg} ${config.border} shadow-sm`
                    : 'bg-gray-100 border-gray-200 opacity-40'
                  }
                `}>
                  {desbloqueada ? (
                    <span className="text-2xl">{config.icono}</span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                </div>
                <p className={`text-xs text-center leading-tight font-medium ${
                  desbloqueada ? config.color : 'text-gray-400'
                }`}>
                  {config.nombre}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
}
