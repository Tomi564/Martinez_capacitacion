'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

interface RankingEntry {
  id: string;
  nombre: string;
  modulosAprobados: number;
  totalModulos: number;
  tasaConversion: number;
  totalAtenciones: number;
  promedioQR: number;
  totalCalificaciones: number;
  promedioExamenes: number;
}

const MEDALLAS = ['🥇', '🥈', '🥉'];

export default function RankingPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get<{ ranking: RankingEntry[] }>('/ranking')
      .then(res => setRanking(res.ranking))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const miPosicion = ranking.findIndex(r => r.id === user?.id);

  return (
    <div className="px-4 py-6 flex flex-col gap-6 max-w-lg mx-auto">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ranking</h1>
        <p className="text-sm text-gray-500 mt-1">Tabla de posiciones del equipo</p>
      </div>

      {/* Mi posición destacada */}
      {miPosicion >= 0 && (
        <div className="bg-gray-900 text-white rounded-2xl p-4 flex items-center gap-4">
          <div className="text-3xl font-black w-12 text-center">
            {miPosicion < 3 ? MEDALLAS[miPosicion] : `#${miPosicion + 1}`}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Tu posición</p>
            <p className="font-bold">{ranking[miPosicion].nombre}</p>
            <div className="flex gap-3 mt-1 text-xs text-gray-300">
              <span>{ranking[miPosicion].modulosAprobados}/{ranking[miPosicion].totalModulos} módulos</span>
              <span>{ranking[miPosicion].tasaConversion}% conversión</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista completa */}
      <div className="flex flex-col gap-2">
        {ranking.map((entry, i) => {
          const esMio = entry.id === user?.id;
          const pct = entry.totalModulos > 0
            ? Math.round((entry.modulosAprobados / entry.totalModulos) * 100)
            : 0;

          return (
            <div
              key={entry.id}
              className={`rounded-2xl p-4 flex items-center gap-3 ${
                esMio
                  ? 'bg-gray-900 text-white border-2 border-gray-700'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {/* Posición */}
              <div className={`w-8 text-center font-black text-lg shrink-0 ${esMio ? 'text-white' : 'text-gray-400'}`}>
                {i < 3 ? MEDALLAS[i] : <span className="text-sm font-bold">#{i + 1}</span>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${esMio ? 'text-white' : 'text-gray-900'}`}>
                  {entry.nombre} {esMio && <span className="text-xs font-normal opacity-70">(vos)</span>}
                </p>

                {/* Barra de módulos */}
                <div className={`w-full h-1.5 rounded-full mt-1.5 overflow-hidden ${esMio ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${esMio ? 'bg-white' : 'bg-gray-900'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className={`flex gap-3 mt-1 text-xs ${esMio ? 'text-gray-300' : 'text-gray-400'}`}>
                  <span>{entry.modulosAprobados}/{entry.totalModulos} mód.</span>
                  {entry.tasaConversion > 0 && <span>{entry.tasaConversion}% conv.</span>}
                  {entry.promedioQR > 0 && <span>★ {entry.promedioQR}</span>}
                </div>
              </div>

              {/* Porcentaje */}
              <div className={`text-right shrink-0 ${esMio ? 'text-white' : 'text-gray-900'}`}>
                <p className="text-lg font-black">{pct}%</p>
              </div>
            </div>
          );
        })}
      </div>

      {ranking.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-3xl mb-2">🏆</p>
          <p className="font-semibold text-gray-700">Sin datos aún</p>
          <p className="text-sm text-gray-400 mt-1">El ranking se construye a medida que el equipo avanza</p>
        </div>
      )}

    </div>
  );
}
