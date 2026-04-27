'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface Visita {
  id: string; estado: string; motivo: string | null; observaciones: string | null;
  km: number | null; diagnostico_enviado: boolean; created_at: string;
}
interface Vehiculo {
  id: string; patente: string; marca: string; modelo: string; anio: number | null;
  clientes: { nombre: string; apellido: string; telefono: string | null; email: string | null } | null;
  visitas_taller: Visita[];
}
interface Participante {
  id: string; nombre: string; apellido: string; dni: string; contacto: string; created_at: string;
  vendedor: { nombre: string; apellido: string } | null;
}

const ESTADO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  en_espera:   { label: 'En espera',   color: 'text-amber-700',  bg: 'bg-amber-100' },
  en_revision: { label: 'En revisión', color: 'text-blue-700',   bg: 'bg-blue-100' },
  listo:       { label: 'Listo',       color: 'text-green-700',  bg: 'bg-green-100' },
  entregado:   { label: 'Entregado',   color: 'text-gray-600',   bg: 'bg-gray-100' },
};

export default function ClientesVendedorPage() {
  const router = useRouter();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [tab, setTab] = useState<'taller' | 'qr'>('taller');

  useEffect(() => {
    Promise.all([
      apiClient.get<{ vehiculos: Vehiculo[] }>('/mecanico/clientes'),
      apiClient.get<{ participantes: Participante[] }>('/qr/participantes'),
    ]).then(([vRes, pRes]) => {
      setVehiculos(vRes.vehiculos);
      setParticipantes(pRes.participantes);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const filtradosVehiculos = vehiculos.filter(v => {
    const q = busqueda.toLowerCase();
    const c = v.clientes;
    return v.patente.toLowerCase().includes(q) || v.marca.toLowerCase().includes(q) ||
      (c?.nombre || '').toLowerCase().includes(q) || (c?.apellido || '').toLowerCase().includes(q) ||
      (c?.telefono || '').includes(q);
  });

  const filtradosParticipantes = participantes.filter(p => {
    const q = busqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || p.apellido.toLowerCase().includes(q) ||
      p.dni.includes(q) || p.contacto.toLowerCase().includes(q);
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="px-4 py-5 pb-24 flex flex-col gap-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-500">Taller y QR de calificación</p>
      </div>

      <input
        type="text" value={busqueda} onChange={e => { setBusqueda(e.target.value); setExpandido(null); }}
        placeholder="Buscar por nombre, patente, DNI..."
        className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
      />

      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button onClick={() => setTab('taller')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'taller' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          Taller ({filtradosVehiculos.length})
        </button>
        <button onClick={() => setTab('qr')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'qr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          QR ({filtradosParticipantes.length})
        </button>
      </div>

      {tab === 'taller' && (
        filtradosVehiculos.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">🚗</p>
            <p className="text-gray-500 text-sm">{busqueda ? 'Sin resultados' : 'Sin vehículos registrados'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtradosVehiculos.map(v => {
              const abierto = expandido === v.id;
              const c = v.clientes;
              const visitasOrdenadas = [...v.visitas_taller].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              return (
                <div key={v.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <button onClick={() => setExpandido(abierto ? null : v.id)} className="w-full p-4 text-left flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 tracking-wider">{v.patente}</p>
                      <p className="text-sm text-gray-600">{v.marca} {v.modelo}{v.anio && ` · ${v.anio}`}</p>
                      {c ? <p className="text-xs text-gray-500 mt-0.5">{c.nombre} {c.apellido}{c.telefono && ` · ${c.telefono}`}</p>
                         : <p className="text-xs text-gray-300 mt-0.5">Sin cliente</p>}
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">{v.visitas_taller.length} {v.visitas_taller.length === 1 ? 'visita' : 'visitas'}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform ${abierto ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {abierto && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3 flex flex-col gap-2">
                      {c?.email && <p className="text-xs text-gray-400">{c.email}</p>}
                      {visitasOrdenadas.length === 0 ? (
                        <p className="text-xs text-gray-300">Sin visitas</p>
                      ) : visitasOrdenadas.map(visita => {
                        const est = ESTADO_LABEL[visita.estado];
                        return (
                          <div key={visita.id} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{new Date(visita.created_at).toLocaleDateString('es-AR')}</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${est?.bg || 'bg-gray-100'} ${est?.color || 'text-gray-600'}`}>{est?.label || visita.estado}</span>
                            </div>
                            {visita.motivo && <p className="text-xs text-gray-600">Motivo: {visita.motivo}</p>}
                            {visita.km && <p className="text-xs text-gray-400">{visita.km.toLocaleString()} km</p>}
                            {visita.observaciones && <p className="text-xs text-gray-500 italic border-t border-gray-200 pt-1.5">{visita.observaciones}</p>}
                            {visita.diagnostico_enviado && <span className="text-xs text-blue-600 font-medium">✓ Diagnóstico enviado</span>}
                            <button onClick={() => router.push(`/clientes/visita/${visita.id}`)} className="text-xs text-[#C8102E] font-bold text-left">Ver checklist →</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'qr' && (
        filtradosParticipantes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">📱</p>
            <p className="text-gray-500 text-sm">{busqueda ? 'Sin resultados' : 'Sin participantes del QR'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtradosParticipantes.map(p => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{p.nombre} {p.apellido}</p>
                    <p className="text-xs text-gray-500">DNI: {p.dni}</p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{new Date(p.created_at).toLocaleDateString('es-AR')}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">{p.contacto}</p>
                  {p.vendedor && <p className="text-xs text-gray-400">vía {p.vendedor.nombre} {p.vendedor.apellido}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
