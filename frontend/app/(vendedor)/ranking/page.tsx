'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

interface RankingEntry {
  id: string;
  nombre: string;
  cantidadVentas: number;
}

interface Semana {
  inicio: string;
  fin: string;
  estado: 'activa' | 'cerrada';
}

const MEDALLAS = ['🥇', '🥈', '🥉'];

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export default function RankingPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [semana, setSemana] = useState<Semana | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const cargarRanking = async (opts?: { conSpinnerInicial?: boolean }) => {
    if (opts?.conSpinnerInicial) setIsLoading(true);
    try {
      const res = await apiClient.get<{ ranking: RankingEntry[]; semana: Semana }>('/ranking/semanal');
      setRanking(res.ranking);
      setSemana(res.semana);
      setLoadError(null);
    } catch (err) {
      console.error('[Ranking] Error cargando ranking semanal', err);
      const mensaje =
        err instanceof Error && err.message
          ? err.message
          : 'No pudimos cargar el ranking. Revisá la conexión y reintentá.';
      setLoadError(mensaje);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void cargarRanking({ conSpinnerInicial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial
  }, []);

  const reintentar = async () => {
    setRetrying(true);
    try {
      await cargarRanking();
    } finally {
      setRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const miPosicion = ranking.findIndex(r => r.id === user?.id);
  const miEntry = miPosicion >= 0 ? ranking[miPosicion] : null;
  const maxVentas = ranking[0]?.cantidadVentas || 1;

  return (
    <div className="px-4 py-6 flex flex-col gap-5 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ranking semanal</h1>
          {semana && (
            <p className="text-sm text-gray-500 mt-0.5">
              {formatFecha(semana.inicio)} — {formatFecha(semana.fin)}
            </p>
          )}
        </div>
        {semana && (
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
            semana.estado === 'activa'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {semana.estado === 'activa' ? '● En curso' : '✓ Cerrada'}
          </span>
        )}
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-3"
        >
          <p className="text-sm text-red-800 font-medium">No pudimos cargar el ranking</p>
          <p className="text-sm text-red-700">{loadError}</p>
          <button
            type="button"
            onClick={() => void reintentar()}
            disabled={retrying}
            className="self-start px-4 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {retrying ? 'Cargando...' : 'Reintentar'}
          </button>
        </div>
      )}

      {/* Mi posición destacada */}
      {!loadError && miEntry && (
        <div className="bg-[#C8102E] text-white rounded-2xl p-4 flex items-center gap-4">
          <div className="text-3xl font-black w-12 text-center shrink-0">
            {miPosicion < 3 ? MEDALLAS[miPosicion] : `#${miPosicion + 1}`}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-50/95">Tu posición esta semana</p>
            <p className="font-bold truncate">{miEntry.nombre}</p>
            <div className="flex gap-3 mt-1 text-xs text-red-50/95">
              <span>🛒 {miEntry.cantidadVentas} {miEntry.cantidadVentas === 1 ? 'venta' : 'ventas'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista completa */}
      <div className="flex flex-col gap-2">
        {!loadError && ranking.map((entry, i) => {
          const esMio = entry.id === user?.id;
          const pct = maxVentas > 0 ? Math.round((entry.cantidadVentas / maxVentas) * 100) : 0;

          return (
            <div
              key={entry.id}
              className={`rounded-2xl p-4 flex items-center gap-3 ${
                esMio
                  ? 'bg-[#C8102E] text-white border-2 border-gray-700'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {/* Posición */}
              <div className={`w-8 text-center shrink-0 ${esMio ? 'text-white' : 'text-gray-400'}`}>
                {i < 3
                  ? <span className="text-xl">{MEDALLAS[i]}</span>
                  : <span className="text-sm font-bold">#{i + 1}</span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${esMio ? 'text-white' : 'text-gray-900'}`}>
                  {entry.nombre}{esMio && <span className="text-xs font-normal opacity-60 ml-1">(vos)</span>}
                </p>

                {/* Barra de progreso relativa al líder */}
                <div className={`w-full h-1.5 rounded-full mt-1.5 overflow-hidden ${esMio ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${esMio ? 'bg-white' : 'bg-gray-900'}`}
                    style={{ width: `${Math.max(pct, entry.cantidadVentas > 0 ? 4 : 0)}%` }}
                  />
                </div>

                <p className={`text-xs mt-1 ${esMio ? 'text-red-50/95' : 'text-gray-500'}`}>
                  {entry.cantidadVentas === 0
                    ? 'Sin ventas aún'
                    : `${entry.cantidadVentas} ${entry.cantidadVentas === 1 ? 'venta' : 'ventas'}`
                  }
                </p>
              </div>

              {/* Número de ventas */}
              <div className={`text-right shrink-0 ${esMio ? 'text-white' : 'text-gray-900'}`}>
                <p className="text-2xl font-black">{entry.cantidadVentas}</p>
                <p className={`text-xs ${esMio ? 'text-red-50/95' : 'text-gray-400'}`}>ventas</p>
              </div>
            </div>
          );
        })}
        {!loadError && ranking.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">
            Todavía no hay datos de ventas esta semana.
          </p>
        )}
      </div>

      {semana?.estado === 'cerrada' && (
        <p className="text-xs text-center text-gray-400">
          El ranking se reinicia el lunes a las 00:00 hs
        </p>
      )}

    </div>
  );
}
