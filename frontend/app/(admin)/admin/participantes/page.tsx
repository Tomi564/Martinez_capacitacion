'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Participante {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  contacto: string;
  created_at: string;
  vendedor: { nombre: string; apellido: string } | null;
}

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get<{ participantes: Participante[] }>('/qr/participantes');
        setParticipantes(res.participantes);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const filtrados = participantes.filter((p) => {
    const q = busqueda.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.apellido.toLowerCase().includes(q) ||
      p.dni.includes(q) ||
      p.contacto.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-4xl mx-auto">

      <div>
        <h1 className="text-xl font-bold text-gray-900">Base de participantes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Clientes que dejaron sus datos al calificar un vendedor
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{participantes.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">participantes totales</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {new Set(participantes.map((p) => p.dni)).size}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">DNIs únicos</p>
        </div>
      </div>

      {/* Buscador */}
      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, DNI o contacto..."
        className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
      />

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-2xl mb-2">👥</p>
          <p className="text-gray-500 text-sm">
            {busqueda ? 'Sin resultados para esa búsqueda' : 'Aún no hay participantes registrados'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {p.nombre} {p.apellido}
                  </p>
                  <p className="text-xs text-gray-500">DNI: {p.dni}</p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">
                  {new Date(p.created_at).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">{p.contacto}</p>
                {p.vendedor && (
                  <p className="text-xs text-gray-400">
                    vía {p.vendedor.nombre} {p.vendedor.apellido}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
