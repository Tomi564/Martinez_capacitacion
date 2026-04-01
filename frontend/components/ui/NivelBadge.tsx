/**
 * NivelBadge.tsx — Badge visual del nivel del vendedor
 */

'use client';

const COLORES: Record<string, {
  bg: string; text: string; border: string; icon: string;
}> = {
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-200',   icon: '○' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   icon: '◆' },
  amber:  { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200',  icon: '▲' },
  green:  { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  icon: '★' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', icon: '♛' },
};

export interface InfoNivel {
  nivel: string;
  label: string;
  descripcion: string;
  color: string;
  modulosRequeridos: number;
  modulosAprobados: number;
  progresoPorcentaje: number;
  siguienteNivel: string | null;
  requisiteSiguiente: string | null;
}

interface NivelBadgeProps {
  info: InfoNivel;
  size?: 'sm' | 'md' | 'lg';
}

export function NivelBadge({ info, size = 'md' }: NivelBadgeProps) {
  const colores = COLORES[info.color] || COLORES.gray;

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${colores.bg} ${colores.text} ${colores.border}`}>
        <span>{colores.icon}</span>
        {info.label}
      </span>
    );
  }

  return (
    <div className={`rounded-2xl border-2 p-4 ${colores.bg} ${colores.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-2xl ${colores.text}`}>{colores.icon}</span>
          <div>
            <p className={`font-bold text-base ${colores.text}`}>{info.label}</p>
            <p className={`text-xs ${colores.text} opacity-80`}>{info.descripcion}</p>
          </div>
        </div>
        <span className={`text-2xl font-bold ${colores.text}`}>
          {info.progresoPorcentaje}%
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            info.color === 'purple' ? 'bg-purple-500' :
            info.color === 'green'  ? 'bg-green-500'  :
            info.color === 'amber'  ? 'bg-amber-500'  :
            info.color === 'blue'   ? 'bg-blue-500'   :
            'bg-gray-400'
          }`}
          style={{ width: `${info.progresoPorcentaje}%` }}
        />
      </div>

      {/* Siguiente nivel */}
      {info.siguienteNivel && (
        <p className={`text-xs ${colores.text} opacity-70`}>
          Siguiente: <strong>{info.siguienteNivel}</strong> — {info.requisiteSiguiente}
        </p>
      )}
    </div>
  );
}
