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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Clock3, Lock, PlayCircle, RotateCcw } from 'lucide-react';

interface ModuloCardProps {
  modulo: ModuloConProgreso;
}

const ESTADO_CONFIG = {
  bloqueado: { label: 'Bloqueado', badgeVariant: 'danger' as const, ctaText: null },
  disponible: { label: 'Disponible', badgeVariant: 'warning' as const, ctaText: 'Empezar' },
  en_curso: { label: 'En curso', badgeVariant: 'warning' as const, ctaText: 'Continuar' },
  aprobado: { label: 'Completado', badgeVariant: 'success' as const, ctaText: 'Repasar' },
};

function EstadoIcon({ estado }: { estado: ModuloConProgreso['estado'] }) {
  if (estado === 'bloqueado') return <Lock className="w-4 h-4 text-gray-500" />;
  if (estado === 'aprobado') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  if (estado === 'en_curso') return <RotateCcw className="w-4 h-4 text-amber-600" />;
  return <PlayCircle className="w-4 h-4 text-amber-600" />;
}

export function ModuloCard({ modulo }: ModuloCardProps) {
  const config = ESTADO_CONFIG[modulo.estado];
  const bloqueado = modulo.estado === 'bloqueado';

  const CardInner = (
    <Card className={`${bloqueado ? 'opacity-65' : 'active:scale-[0.99] transition-transform'} rounded-xl`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Módulo {modulo.orden}
          </span>
          <div className="flex items-center gap-2">
            <EstadoIcon estado={modulo.estado} />
            <Badge variant={config.badgeVariant}>{config.label}</Badge>
          </div>
        </div>
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-2">{modulo.titulo}</h3>

        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {modulo.descripcion}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock3 className="w-3.5 h-3.5" />
            {modulo.duracion_min} min
          </span>

          {modulo.intentos > 0 && (
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" />
              {modulo.intentos} {modulo.intentos === 1 ? 'intento' : 'intentos'}
            </span>
          )}

          {modulo.estado === 'aprobado' && modulo.mejor_nota !== null && (
            <span className="flex items-center gap-1 text-green-600 font-semibold ml-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {modulo.mejor_nota.toFixed(1)}%
            </span>
          )}
        </div>

        {config.ctaText && modulo.intentos < 3 && (
          <Button className="w-full mt-4">
            {config.ctaText} →
          </Button>
        )}

        {modulo.estado !== 'aprobado' && modulo.intentos >= 3 && (
          <div className="mt-4 py-2.5 px-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700 text-center font-medium flex items-center justify-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Límite de intentos, contactá a tu supervisor
            </p>
          </div>
        )}

        {bloqueado && (
          <p className="mt-3 text-xs text-gray-400 text-center">
            Aprobá el módulo anterior para desbloquear
          </p>
        )}
      </CardContent>
    </Card>
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