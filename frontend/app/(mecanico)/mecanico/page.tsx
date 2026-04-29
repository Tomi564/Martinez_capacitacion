'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, ChevronDown, PlusCircle, Wrench } from 'lucide-react';

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
        <ChevronDown className={`w-4 h-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <div className="flex flex-col gap-2 mt-1">
          {entregadas.map(v => {
            const cliente = v.vehiculos?.clientes;
            return (
              <button
                key={v.id}
                onClick={() => router.push(`/mecanico/visitas/${v.id}`)}
                className="w-full bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-4 active:scale-[0.99] transition-transform text-left opacity-60"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-700 text-base">{v.vehiculos?.patente}</p>
                  <p className="text-sm text-gray-400 truncate">{v.vehiculos?.marca} {v.vehiculos?.modelo}</p>
                  {cliente && <p className="text-xs text-gray-400">{cliente.nombre} {cliente.apellido}</p>}
                </div>
                <Badge variant="muted">Entregado</Badge>
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
  const [historial, setHistorial] = useState<Visita[]>([]);
  const [totalHistorial, setTotalHistorial] = useState(0);
  const [historialOffset, setHistorialOffset] = useState(0);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  const [errorHoy, setErrorHoy] = useState<string | null>(null);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);

  const fetchVisitas = async () => {
    setErrorHoy(null);
    try {
      const res = await apiClient.get<{ visitas: Visita[] }>('/mecanico/visitas');
      setVisitas(res.visitas);
    } catch {
      setErrorHoy('No se pudieron cargar las visitas de hoy.');
      setVisitas([]);
    }
    finally { setIsLoading(false); }
  };

  const fetchHistorial = async (offset = 0, append = false) => {
    setErrorHistorial(null);
    setIsLoadingHistorial(true);
    try {
      const res = await apiClient.get<{ visitas: Visita[]; total: number; limit: number; offset: number }>(
        `/mecanico/visitas/historial?limit=20&offset=${offset}`
      );
      setHistorial((prev) => (append ? [...prev, ...(res.visitas || [])] : (res.visitas || [])));
      setTotalHistorial(res.total || 0);
      setHistorialOffset(offset);
    } catch {
      setErrorHistorial('No se pudo cargar el historial de visitas.');
      if (!append) setHistorial([]);
    } finally {
      setIsLoadingHistorial(false);
    }
  };

  useEffect(() => { fetchVisitas(); }, []);
  useEffect(() => {
    if (historialAbierto && historial.length === 0 && !isLoadingHistorial) {
      fetchHistorial(0, false);
    }
  }, [historialAbierto]);

  const activas = visitas.filter(v => v.estado !== 'entregado');
  const entregadas = visitas.filter(v => v.estado === 'entregado');

  return (
    <div className="px-4 py-5 flex flex-col gap-5 max-w-lg mx-auto pb-24">

      {/* Botón principal */}
      <button
        onClick={() => router.push('/mecanico/nueva-visita')}
        className="w-full py-4 bg-[#C8102E] text-white font-bold text-base rounded-xl active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-5 h-5" />
        Nueva visita
      </button>

      {/* Visitas de hoy */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-base">Hoy — {activas.length} {activas.length === 1 ? 'visita' : 'visitas'}</h2>
          <Button onClick={fetchVisitas} variant="ghost" className="h-8 px-2 text-xs">Actualizar</Button>
        </div>

        {errorHoy && (
          <Card className="rounded-xl border-red-200 bg-red-50 mb-3">
            <CardContent className="p-3">
              <p className="text-sm text-red-700">{errorHoy}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3 py-2">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : activas.length === 0 ? (
          <Card className="rounded-xl text-center">
            <CardContent className="p-8">
            <Wrench className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Sin visitas hoy</p>
            <p className="text-gray-400 text-xs mt-1">Tocá "Nueva visita" para empezar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {activas.map(v => {
              const cfg = ESTADO_CONFIG[v.estado] || ESTADO_CONFIG.en_espera;
              const cliente = v.vehiculos?.clientes;
              return (
                <button
                  key={v.id}
                  onClick={() => router.push(`/mecanico/visitas/${v.id}`)}
                  className="w-full bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-4 active:scale-[0.99] transition-transform text-left"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-gray-500" />
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

      {/* Historial */}
      <div>
        <button
          onClick={() => setHistorialAbierto((v) => !v)}
          className="w-full flex items-center justify-between text-sm text-gray-600 px-1 py-2"
          aria-label="Mostrar historial de visitas"
        >
          <span className="font-semibold">Historial</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${historialAbierto ? 'rotate-180' : ''}`} />
        </button>

        {historialAbierto && (
          <div className="mt-2 flex flex-col gap-2">
            {errorHistorial && (
              <Card className="rounded-xl border-red-200 bg-red-50">
                <CardContent className="p-3">
                  <p className="text-sm text-red-700">{errorHistorial}</p>
                </CardContent>
              </Card>
            )}

            {isLoadingHistorial && historial.length === 0 ? (
              <>
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </>
            ) : historial.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">No hay visitas históricas.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {historial.map((v) => {
                  const cfg = ESTADO_CONFIG[v.estado] || ESTADO_CONFIG.en_espera;
                  const cliente = v.vehiculos?.clientes;
                  return (
                    <button
                      key={v.id}
                      onClick={() => router.push(`/mecanico/visitas/${v.id}`)}
                      className="w-full bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-4 active:scale-[0.99] transition-transform text-left"
                    >
                      <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{v.vehiculos?.patente || 'Sin patente'}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {v.vehiculos?.marca} {v.vehiculos?.modelo}
                          {cliente ? ` · ${cliente.nombre} ${cliente.apellido}` : ''}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(v.created_at).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}

                {historial.length < totalHistorial && (
                  <Button
                    variant="outline"
                    onClick={() => fetchHistorial(historialOffset + 20, true)}
                    disabled={isLoadingHistorial}
                    className="w-full"
                  >
                    {isLoadingHistorial ? 'Cargando...' : 'Cargar más'}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
