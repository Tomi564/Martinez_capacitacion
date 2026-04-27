'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface Visita {
  id: string;
  estado: string;
  motivo: string | null;
  created_at: string;
  vehiculos: { patente: string; marca: string; modelo: string; clientes: { nombre: string; apellido: string } | null } | null;
}

function EntregadosList({ entregadas, router }: { entregadas: Visita[]; router: ReturnType<typeof import('next/navigation').useRouter> }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="mt-4">
      <button
        onClick={() => setAbierto(a => !a)}
        className="w-full flex items-center justify-between text-sm text-gray-400 px-1 py-2"
      >
        <span>{entregadas.length} {entregadas.length === 1 ? 'vehículo entregado' : 'vehículos entregados'} hoy</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${abierto ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {abierto && (
        <div className="flex flex-col gap-2 mt-1">
          {entregadas.map(v => {
            const cliente = v.vehiculos?.clientes;
            return (
              <button
                key={v.id}
                onClick={() => router.push(`/mecanico/visita/${v.id}`)}
                className="w-full bg-white rounded-2xl p-4 border border-gray-200 flex items-center gap-4 active:scale-95 transition-transform text-left shadow-sm opacity-60"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-700 text-base">{v.vehiculos?.patente}</p>
                  <p className="text-sm text-gray-400 truncate">{v.vehiculos?.marca} {v.vehiculos?.modelo}</p>
                  {cliente && <p className="text-xs text-gray-400">{cliente.nombre} {cliente.apellido}</p>}
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0 bg-gray-100 text-gray-500">Entregado</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  en_espera:   { label: 'En espera',   color: 'text-amber-700',  bg: 'bg-amber-100' },
  en_revision: { label: 'En revisión', color: 'text-blue-700',   bg: 'bg-blue-100' },
  listo:       { label: 'Listo',       color: 'text-green-700',  bg: 'bg-green-100' },
  entregado:   { label: 'Entregado',   color: 'text-gray-600',   bg: 'bg-gray-100' },
};

export default function MecanicoHome() {
  const router = useRouter();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVisitas = async () => {
    try {
      const res = await apiClient.get<{ visitas: Visita[] }>('/mecanico/visitas');
      setVisitas(res.visitas);
    } catch {}
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchVisitas(); }, []);

  const activas = visitas.filter(v => v.estado !== 'entregado');
  const entregadas = visitas.filter(v => v.estado === 'entregado');

  return (
    <div className="px-4 py-5 flex flex-col gap-5 max-w-lg mx-auto pb-24">

      {/* Botón principal */}
      <button
        onClick={() => router.push('/mecanico/nueva-visita')}
        className="w-full py-5 bg-[#C8102E] text-white font-extrabold text-lg rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 shadow-lg shadow-red-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        Nueva visita
      </button>

      {/* Visitas de hoy */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-base">Hoy — {activas.length} {activas.length === 1 ? 'visita' : 'visitas'}</h2>
          <button onClick={fetchVisitas} className="text-xs text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-200">Actualizar</button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : activas.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <p className="text-3xl mb-2">🔧</p>
            <p className="text-gray-500 text-sm">Sin visitas hoy</p>
            <p className="text-gray-400 text-xs mt-1">Tocá "Nueva visita" para empezar</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activas.map(v => {
              const cfg = ESTADO_CONFIG[v.estado] || ESTADO_CONFIG.en_espera;
              const cliente = v.vehiculos?.clientes;
              return (
                <button
                  key={v.id}
                  onClick={() => router.push(`/mecanico/visita/${v.id}`)}
                  className="w-full bg-white rounded-2xl p-4 border border-gray-200 flex items-center gap-4 active:scale-95 transition-transform text-left shadow-sm"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/>
                      <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base">{v.vehiculos?.patente}</p>
                    <p className="text-sm text-gray-500 truncate">{v.vehiculos?.marca} {v.vehiculos?.modelo}</p>
                    {cliente && <p className="text-xs text-gray-400">{cliente.nombre} {cliente.apellido}</p>}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Entregados */}
        {entregadas.length > 0 && <EntregadosList entregadas={entregadas} router={router} />}
      </div>
    </div>
  );
}
