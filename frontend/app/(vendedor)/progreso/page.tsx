/**
 * progreso/page.tsx — Panel de progreso personal del vendedor
 *
 * Muestra:
 *  - Resumen general (% completado, módulos aprobados)
 *  - Historial detallado por módulo
 *  - Mejor nota y cantidad de intentos por módulo
 */

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { ModuloConProgreso } from '@/types';
import { Insignias } from '@/components/ui/Insignias';

export default function ProgresoPage() {
  const [modulos, setModulos] = useState<ModuloConProgreso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgreso = async () => {
      try {
        const res = await apiClient.get<{ modulos: ModuloConProgreso[] }>(
          '/modulos'
        );
        setModulos(res.modulos);
      } catch (err) {
        setError('Error al cargar el progreso');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgreso();
  }, []);

  // Calcular estadísticas
  const stats = {
    total: modulos.length,
    aprobados: modulos.filter((m) => m.estado === 'aprobado').length,
    enCurso: modulos.filter((m) => m.estado === 'en_curso').length,
    bloqueados: modulos.filter((m) => m.estado === 'bloqueado').length,
    promedioNotas:
      modulos.filter((m) => m.mejor_nota && m.mejor_nota > 0).length > 0
        ? modulos
            .filter((m) => m.mejor_nota && m.mejor_nota > 0)
            .reduce((acc, m) => acc + (m.mejor_nota || 0), 0) /
          modulos.filter((m) => m.mejor_nota && m.mejor_nota > 0).length
        : 0,
    totalIntentos: modulos.reduce((acc, m) => acc + m.intentos, 0),
  };

  const porcentaje =
    stats.total > 0 ? Math.round((stats.aprobados / stats.total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 flex flex-col gap-6 max-w-lg mx-auto">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi progreso</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tu avance en la capacitación
        </p>
      </div>

      {/* Tarjeta principal de progreso */}
      <div className="bg-[#C8102E] text-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400">Completado</p>
            <p className="text-4xl font-bold mt-0.5">{porcentaje}%</p>
          </div>

          {/* Círculo de progreso visual */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke="#374151"
                strokeWidth="6"
              />
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - porcentaje / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {stats.aprobados}/{stats.total}
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {/* Stats en grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-green-600">{stats.aprobados}</p>
          <p className="text-xs text-gray-500 mt-0.5">Módulos aprobados</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-gray-900">
            {stats.promedioNotas > 0 ? `${stats.promedioNotas.toFixed(1)}%` : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Promedio de notas</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-gray-900">{stats.totalIntentos}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total de intentos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-amber-500">{stats.enCurso}</p>
          <p className="text-xs text-gray-500 mt-0.5">En curso</p>
        </div>
      </div>

      {/* Insignias */}
      {modulos.length > 0 && (
        <Insignias modulos={modulos} />
      )}

      {/* Detalle por módulo */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Detalle por módulo
        </p>
        <div className="flex flex-col gap-2">
          {modulos.map((modulo) => (
            <div
              key={modulo.id}
              className="bg-white border border-gray-200 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                {/* Indicador de estado */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  flex-shrink-0 mt-0.5
                  ${modulo.estado === 'aprobado'
                    ? 'bg-green-100 text-green-600'
                    : modulo.estado === 'en_curso'
                    ? 'bg-amber-100 text-amber-600'
                    : modulo.estado === 'disponible'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  {modulo.estado === 'aprobado' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : modulo.estado === 'bloqueado' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{modulo.orden}</span>
                  )}
                </div>

                {/* Info del módulo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {modulo.titulo}
                    </p>
                    {modulo.mejor_nota !== null && modulo.mejor_nota > 0 && (
                      <span className={`text-sm font-bold flex-shrink-0 ${
                        modulo.estado === 'aprobado'
                          ? 'text-green-600'
                          : 'text-amber-600'
                      }`}>
                        {modulo.mejor_nota.toFixed(1)}%
                      </span>
                    )}
                  </div>

                  {/* Barra de nota */}
                  {modulo.mejor_nota !== null && modulo.mejor_nota > 0 && (
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          modulo.estado === 'aprobado'
                            ? 'bg-green-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${modulo.mejor_nota}%` }}
                      />
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="flex gap-3 mt-1.5">
                    {modulo.intentos > 0 && (
                      <span className="text-xs text-gray-400">
                        {modulo.intentos}{' '}
                        {modulo.intentos === 1 ? 'intento' : 'intentos'}
                      </span>
                    )}
                    {modulo.completado_at && (
                      <span className="text-xs text-gray-400">
                        Aprobado el{' '}
                        {new Date(modulo.completado_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                    {modulo.estado === 'bloqueado' && (
                      <span className="text-xs text-gray-400">
                        Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}