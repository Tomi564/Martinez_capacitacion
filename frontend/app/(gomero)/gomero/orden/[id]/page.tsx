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
    clientes: { nombre: string; apellido: string } | null;
  } | null;
}

const marcasEjemplo = ['Bridgestone', 'Pirelli', 'Michelin', 'Fate', 'Goodyear', 'Otros'];
const medidasEjemplo = ['175/70 R13', '185/65 R14', '195/55 R15', '205/55 R16'];
const KM_MIN = 0;
const KM_MAX = 400_000;
const KM_STEP = 1000;
const PSI_MIN = 18;
const PSI_MAX = 55;
const PSI_STEP = 1;

function snapKm(n: number) {
  return Math.round(Math.max(KM_MIN, Math.min(KM_MAX, n)) / KM_STEP) * KM_STEP;
}
function snapPsi(n: number) {
  return Math.round(Math.max(PSI_MIN, Math.min(PSI_MAX, n)) / PSI_STEP) * PSI_STEP;
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
  const [presion, setPresion] = useState(32);
  const [obs, setObs] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
      setPresion(snapPsi(o.presion_psi != null ? Math.round(o.presion_psi) : 32));
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

  const guardar = async (): Promise<boolean> => {
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
        presion_psi: presion,
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

  return (
    <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-5 pb-32">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-3xl font-black tracking-widest">{v?.patente}</p>
        <p className="text-gray-600 font-medium mt-1">{v?.marca} {v?.modelo}</p>
        {v?.clientes && (
          <p className="text-sm text-gray-500 mt-2">{v.clientes.nombre} {v.clientes.apellido}</p>
        )}
      </div>

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
                <select
                  value={medida}
                  onChange={(e) => setMedida(e.target.value)}
                  className="w-full h-14 px-3 text-base font-medium rounded-xl border border-gray-200 bg-white"
                >
                  <option value="">Elegir…</option>
                  {medidasEjemplo.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <NumberWheelPicker
                label="Presión"
                min={PSI_MIN}
                max={PSI_MAX}
                step={PSI_STEP}
                value={presion}
                onChange={(v) => setPresion(snapPsi(v))}
                suffix="PSI"
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

      {msg && (
        <p className={`text-sm rounded-xl px-4 py-3 ${msg === 'Guardado.' || msg.includes('Enviado') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </p>
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
    </div>
  );
}
