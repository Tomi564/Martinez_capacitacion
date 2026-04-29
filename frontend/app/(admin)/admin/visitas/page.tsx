'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface Visita {
  id: string;
  created_at: string;
  estado_visita: 'abierta' | 'cerrada' | null;
  motivo: string | null;
  vehiculos: { patente: string; marca: string; modelo: string; clientes: { nombre: string; apellido: string } | null } | null;
  users: { id: string; nombre: string; apellido: string } | null;
}

export default function AdminVisitasPage() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [mecanicos, setMecanicos] = useState<Array<{ id: string; nombre: string; apellido: string }>>([]);
  const [fecha, setFecha] = useState('');
  const [mecanicoId, setMecanicoId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (fecha) params.set('fecha', fecha);
      if (mecanicoId) params.set('mecanico_id', mecanicoId);

      const visRes = await apiClient.get<{ visitas: Visita[] }>(`/admin/visitas${params.toString() ? `?${params}` : ''}`);
      setVisitas(visRes.visitas || []);
      const unico = new Map<string, { id: string; nombre: string; apellido: string }>();
      (visRes.visitas || []).forEach((v) => {
        if (v.users?.id) unico.set(v.users.id, v.users);
      });
      setMecanicos(Array.from(unico.values()));
    } catch {
      setError('No se pudieron cargar las visitas.');
      setVisitas([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visitas</h1>
        <p className="text-sm text-gray-500 mt-1">Gestioná visitas de todos los mecánicos</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="h-10 px-3 border border-gray-200 rounded-xl text-sm"
        />
        <select
          value={mecanicoId}
          onChange={(e) => setMecanicoId(e.target.value)}
          className="h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="">Todos los mecánicos</option>
          {mecanicos.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
          ))}
        </select>
        <button onClick={cargar} className="h-10 bg-[#C8102E] text-white rounded-xl text-sm font-semibold">
          Filtrar
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando visitas...</p>
      ) : visitas.length === 0 ? (
        <p className="text-sm text-gray-500">No hay visitas para el filtro seleccionado.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {visitas.map((v) => (
            <Link key={v.id} href={`/admin/visitas/${v.id}`}>
              <div className="bg-white border border-gray-200 rounded-xl p-4 active:scale-[0.99] transition-transform">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {v.vehiculos?.patente || 'Sin patente'} · {v.vehiculos?.marca} {v.vehiculos?.modelo}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mecánico: {v.users ? `${v.users.nombre} ${v.users.apellido}` : '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Cliente: {v.vehiculos?.clientes ? `${v.vehiculos.clientes.nombre} ${v.vehiculos.clientes.apellido}` : 'Sin cliente'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${v.estado_visita === 'cerrada' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                      {v.estado_visita === 'cerrada' ? 'Cerrada' : 'Abierta'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(v.created_at).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
