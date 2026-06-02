'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { PageState } from '@/components/ui/PageState';
import { Button } from '@/components/ui/button';
import { NumberWheelPicker } from '@/components/ui/NumberWheelPicker';

interface Orden {
  id: string;
  orden_estado: string | null;
  patente_pendiente?: string | null;
  km: number | null;
  presion_psi: number | null;
  neumaticos_cambiados: boolean | null;
  marca_neumatico: string | null;
  medida_neumatico: string | null;
  observaciones_gomero: string | null;
  vehiculos: {
    patente: string;
    marca: string;
    modelo: string;
    medida_rueda: string | null;
    clientes: { nombre: string; apellido: string; telefono?: string | null } | null;
  } | null;
  atenciones?: {
    clientes: { nombre: string; apellido: string; telefono?: string | null; email?: string | null } | null;
  } | null;
}

const marcasEjemplo = [
  'Pirelli',
  'Continental',
  'Dunlop',
  'Falken',
  'Corven',
  'Chao Yang',
  'Cargo Power',
  'Guestlake',
  'SEAT Agrícola',
  'Otras',
];
/** Solo dígitos, barras y letras típicas de medidas (ej. 195/65R15). */
function sanitizarMedidaNeumatico(texto: string): string {
  return texto.toUpperCase().replace(/[^0-9A-Z/]/g, '');
}

const KM_MIN = 0;
const KM_MAX = 400_000;
const KM_STEP = 1000;
const BAR_MIN = 1.5;
const BAR_MAX = 3.5;
const BAR_STEP = 0.1;

function snapKm(n: number) {
  return Math.round(Math.max(KM_MIN, Math.min(KM_MAX, n)) / KM_STEP) * KM_STEP;
}

const PSI_PER_BAR = 14.5037738;
function psiToBar(psi: number) {
  return psi / PSI_PER_BAR;
}
function barToPsi(bar: number) {
  return bar * PSI_PER_BAR;
}
function snapBar(n: number) {
  const clamped = Math.max(BAR_MIN, Math.min(BAR_MAX, n));
  return Math.round(clamped / BAR_STEP) * BAR_STEP;
}

export default function OrdenGomeroDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [orden, setOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [neumaticosCambiados, setNeumaticosCambiados] = useState<boolean | null>(null);
  const [km, setKm] = useState(0);
  const [marca, setMarca] = useState('');
  const [medida, setMedida] = useState('');
  const [presionBar, setPresionBar] = useState(2.2);
  const [obs, setObs] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [modeloVehiculo, setModeloVehiculo] = useState('');

  const cargar = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await apiClient.get<{ orden: Orden }>(`/gomero/ordenes/${id}`);
      const o = res.orden;
      setOrden(o);
      if (o.neumaticos_cambiados != null) setNeumaticosCambiados(o.neumaticos_cambiados);
      setKm(snapKm(o.km ?? 0));
      setMarca(o.marca_neumatico || '');
      setMedida(o.medida_neumatico || '');
      setPresionBar(
        snapBar(o.presion_psi != null ? psiToBar(o.presion_psi) : 2.2)
      );
      setObs(o.observaciones_gomero || '');
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const necesitaCompletarVehiculo = !!orden?.patente_pendiente && !orden?.vehiculos;

  const guardarVehiculoPendiente = async (): Promise<boolean> => {
    if (!modeloVehiculo.trim()) {
      setMsg('Completá el modelo del vehículo.');
      return false;
    }
    setGuardando(true);
    setMsg(null);
    try {
      await apiClient.patch(`/gomero/ordenes/${id}`, {
        vehiculo_modelo: modeloVehiculo.trim(),
      });
      await cargar();
      setMsg('Vehículo registrado.');
      return true;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al guardar el vehículo');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const guardar = async (): Promise<boolean> => {
    if (necesitaCompletarVehiculo) {
      setMsg('Primero completá los datos del vehículo.');
      return false;
    }
    if (neumaticosCambiados == null) {
      setMsg('Indicá si se cambiaron los neumáticos.');
      return false;
    }
    if (!marca) {
      setMsg('Elegí una marca de neumático.');
      return false;
    }
    if (!neumaticosCambiados && !medida) {
      setMsg('Sin cambio de neumáticos, la medida es obligatoria.');
      return false;
    }
    setMsg(null);
    setGuardando(true);
    try {
      await apiClient.patch(`/gomero/ordenes/${id}`, {
        neumaticos_cambiados: neumaticosCambiados,
        km: km || null,
        marca_neumatico: marca,
        medida_neumatico: neumaticosCambiados ? null : medida,
        presion_psi: Number((barToPsi(presionBar)).toFixed(1)),
        observaciones_gomero: obs.trim() || null,
      });
      setMsg('Guardado.');
      return true;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al guardar');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const enviarMecanico = async () => {
    setMsg(null);
    const ok = await guardar();
    if (!ok) return;
    setEnviando(true);
    try {
      await apiClient.post(`/gomero/ordenes/${id}/enviar-mecanico`, {});
      setMsg('Enviado al mecánico.');
      setTimeout(() => router.push('/gomero'), 1200);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al enviar');
    } finally {
      setEnviando(false);
    }
  };

  if (loading || loadError || !orden) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto">
        <PageState
          state={loading ? 'loading' : 'error'}
          onRetry={cargar}
          emptyMessage="Orden no encontrada."
        />
      </div>
    );
  }

  if (orden.orden_estado !== 'pendiente_gomero') {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto text-center">
        <p className="text-gray-600 mb-4">Esta orden ya fue enviada o está cerrada.</p>
        <Button onClick={() => router.push('/gomero')}>Volver al inicio</Button>
      </div>
    );
  }

  const v = orden.vehiculos;
  const cliente = v?.clientes || orden.atenciones?.clientes || null;
  const patenteDisplay = v?.patente || orden.patente_pendiente || '—';

  return (
    <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-5 pb-32">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-3xl font-black tracking-widest">{patenteDisplay}</p>
        {v && <p className="text-gray-600 font-medium mt-1">{v.marca} {v.modelo}</p>}
        {cliente && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase">Cliente</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {cliente.nombre} {cliente.apellido}
            </p>
            {cliente.telefono && <p className="text-sm text-gray-600">{cliente.telefono}</p>}
          </div>
        )}
      </div>

      {necesitaCompletarVehiculo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-amber-900 uppercase">Completar vehículo</p>
          <p className="text-sm text-amber-950">
            Esta orden viene del vendedor. Cargá el modelo para continuar.
          </p>
          <input
            placeholder="Modelo"
            value={modeloVehiculo}
            onChange={(e) => setModeloVehiculo(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-amber-200 bg-white"
          />
          <Button className="w-full h-12 rounded-xl font-bold" disabled={guardando} onClick={guardarVehiculoPendiente}>
            {guardando ? 'Guardando…' : 'Guardar vehículo'}
          </Button>
        </div>
      )}

      {!necesitaCompletarVehiculo && (
      <>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">¿Se cambiaron los neumáticos?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setNeumaticosCambiados(true)}
            className={`h-16 rounded-2xl text-lg font-black border-2 transition-all ${
              neumaticosCambiados === true ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => setNeumaticosCambiados(false)}
            className={`h-16 rounded-2xl text-lg font-black border-2 transition-all ${
              neumaticosCambiados === false ? 'bg-[#1F1F1F] border-[#1F1F1F] text-white' : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            No
          </button>
        </div>
      </div>

      {neumaticosCambiados != null && (
        <>
          <NumberWheelPicker
            label="Kilometraje"
            min={KM_MIN}
            max={KM_MAX}
            step={KM_STEP}
            value={km}
            onChange={(v) => setKm(snapKm(v))}
            suffix="km"
          />

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Marca neumático</p>
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="w-full h-14 px-3 text-base font-medium rounded-xl border border-gray-200 bg-white"
            >
              <option value="">Elegir…</option>
              {marcasEjemplo.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {!neumaticosCambiados && (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Medida</p>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  value={medida}
                  onChange={(e) => setMedida(sanitizarMedidaNeumatico(e.target.value))}
                  placeholder="Ej: 195/65R15"
                  className="w-full h-14 px-3 text-base font-medium rounded-xl border border-gray-200 bg-white uppercase tracking-wide"
                />
              </div>
              <NumberWheelPicker
                label="Presión"
                min={BAR_MIN}
                max={BAR_MAX}
                step={BAR_STEP}
                value={presionBar}
                onChange={(v) => setPresionBar(snapBar(v))}
                suffix="BAR"
              />
            </>
          )}

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Observaciones (opcional)</p>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-base"
              placeholder="Algo puntual…"
            />
          </div>
        </>
      )}

      <div className="flex flex-col gap-3">
        <Button
          className="h-14 rounded-2xl text-base font-black"
          variant="outline"
          disabled={guardando}
          onClick={guardar}
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button
          className="h-16 rounded-2xl text-lg font-black"
          disabled={enviando || neumaticosCambiados == null}
          onClick={enviarMecanico}
        >
          {enviando ? 'Enviando…' : 'Enviar al mecánico'}
        </Button>
      </div>
      </>
      )}

      {msg && (
        <p className={`text-sm rounded-xl px-4 py-3 ${msg === 'Guardado.' || msg.includes('Enviado') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </p>
      )}

    </div>
  );
}
