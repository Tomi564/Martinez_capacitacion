'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { formatPatenteArDisplay, normalizePatenteAr } from '@/lib/patente';
import { usePatenteSugerencias } from '@/hooks/usePatenteSugerencias';
import { useSpeechInput } from '@/hooks/useSpeechInput';

interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  medida_rueda: string | null;
  clientes: { id: string; nombre: string; apellido: string; telefono: string | null; email: string | null } | null;
}

type EstadoDiagnostico = 'buen_estado' | 'desgaste_medio' | 'reemplazo_urgente';
type WizardStep = 1 | 2 | 3;
type DictadoTarget = 'observaciones' | 'recomendacion';

interface WizardForm {
  patente: string;
  marca: string;
  modelo: string;
  anio: string;
  medida_rueda: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  motivo: string;
  observaciones: string;
  estado_neumaticos: '' | EstadoDiagnostico;
  estado_frenos: '' | EstadoDiagnostico;
  presion_psi: string;
  recomendacion: string;
}

const DRAFT_KEY = 'mecanico_nueva_visita_wizard_draft_v1';

const FORM_INICIAL: WizardForm = {
  patente: '',
  marca: '',
  modelo: '',
  anio: '',
  medida_rueda: '',
  nombre: '',
  apellido: '',
  telefono: '',
  email: '',
  motivo: '',
  observaciones: '',
  estado_neumaticos: '',
  estado_frenos: '',
  presion_psi: '',
  recomendacion: '',
};

export default function NuevaVisita() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<WizardForm>(FORM_INICIAL);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);
  const { sugerencias, setSugerencias, isBuscandoSugerencias } = usePatenteSugerencias(form.patente);
  const { isSupported: speechDisponible, isListening, startDictation } = useSpeechInput();
  const [isBuscandoExacto, setIsBuscandoExacto] = useState(false);
  const [dictadoTarget, setDictadoTarget] = useState<DictadoTarget | null>(null);
  const [isGuardando, setIsGuardando] = useState(false);
  const [error, setError] = useState('');

  const setField =
    (key: keyof WizardForm) =>
    (value: string) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  const aplicarVehiculo = (v: Vehiculo) => {
    setVehiculoSeleccionado(v);
    const patenteCanon = normalizePatenteAr(v.patente || '');
    setForm((prev) => ({
      ...prev,
      patente: patenteCanon ? formatPatenteArDisplay(patenteCanon) : '',
      marca: v.marca || '',
      modelo: v.modelo || '',
      anio: v.anio ? String(v.anio) : '',
      medida_rueda: v.medida_rueda || '',
      nombre: v.clientes?.nombre || '',
      apellido: v.clientes?.apellido || '',
      telefono: v.clientes?.telefono || '',
      email: v.clientes?.email || '',
    }));
  };

  const limpiarVehiculoSeleccionadoSiCorresponde = (nextPatente?: string) => {
    if (!vehiculoSeleccionado) return;
    const siguiente = normalizePatenteAr(nextPatente ?? form.patente);
    const actual = normalizePatenteAr(vehiculoSeleccionado.patente || '');
    if (siguiente !== actual) {
      setVehiculoSeleccionado(null);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        form?: WizardForm;
        step?: WizardStep;
        vehiculoSeleccionado?: Vehiculo | null;
      };
      if (draft.form) setForm((prev) => ({ ...prev, ...draft.form }));
      if (draft.step && [1, 2, 3].includes(draft.step)) setStep(draft.step);
      if (draft.vehiculoSeleccionado?.id) setVehiculoSeleccionado(draft.vehiculoSeleccionado);
    } catch (draftError) {
      console.error('[NuevaVisitaWizard] Error leyendo borrador local', draftError);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          form,
          step,
          vehiculoSeleccionado,
        })
      );
    } catch (draftError) {
      console.error('[NuevaVisitaWizard] Error guardando borrador local', draftError);
    }
  }, [form, step, vehiculoSeleccionado]);

  const buscarPorPatenteExacta = async () => {
    const patenteCanon = normalizePatenteAr(form.patente);
    if (!patenteCanon) return;
    setError('');
    setIsBuscandoExacto(true);
    try {
      const res = await apiClient.get<{ vehiculo: Vehiculo | null }>(
        `/mecanico/vehiculos/buscar/${encodeURIComponent(patenteCanon)}`,
      );
      if (!res.vehiculo) {
        setVehiculoSeleccionado(null);
        setError('No encontramos esa patente. Podés completar los datos y crearla como vehículo nuevo.');
        return;
      }
      aplicarVehiculo(res.vehiculo);
      setSugerencias([]);
    } catch (searchError) {
      console.error('[NuevaVisitaWizard] Error en búsqueda exacta de patente', searchError);
      setError('Error al buscar la patente. Intentá de nuevo.');
    } finally {
      setIsBuscandoExacto(false);
    }
  };

  const iniciarDictado = (target: DictadoTarget) => {
    setDictadoTarget(target);
    startDictation((texto) => {
      if (target === 'observaciones') {
        setField('observaciones')(form.observaciones ? `${form.observaciones} ${texto}` : texto);
      } else {
        setField('recomendacion')(form.recomendacion ? `${form.recomendacion} ${texto}` : texto);
      }
      setDictadoTarget(null);
    });
  };

  useEffect(() => {
    if (!isListening) setDictadoTarget(null);
  }, [isListening]);

  const validarPaso1 = () => {
    if (!normalizePatenteAr(form.patente)) {
      setError('Ingresá la patente para continuar.');
      return false;
    }
    if (!vehiculoSeleccionado && (!form.marca.trim() || !form.modelo.trim())) {
      setError('Si el vehículo no está vinculado, completá marca y modelo.');
      return false;
    }
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Completá nombre y apellido del titular del vehículo.');
      return false;
    }
    if (!form.telefono.trim()) {
      setError('Ingresá un teléfono de contacto del cliente.');
      return false;
    }
    return true;
  };

  const irSiguiente = () => {
    setError('');
    if (step === 1) {
      if (!validarPaso1()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
    }
  };

  const irAnterior = () => {
    setError('');
    if (step === 1) return;
    setStep((prev) => (prev - 1) as WizardStep);
  };

  const confirmarYGuardar = async () => {
    if (!validarPaso1()) {
      setStep(1);
      return;
    }

    setError('');
    setIsGuardando(true);
    try {
      let vehiculoId = vehiculoSeleccionado?.id;

      if (vehiculoSeleccionado?.id && !vehiculoSeleccionado.clientes) {
        await apiClient.patch(`/mecanico/vehiculos/${vehiculoSeleccionado.id}`, {
          cliente: {
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            telefono: form.telefono.trim() || null,
            email: form.email.trim() || null,
          },
        });
      }

      if (!vehiculoId) {
        const vRes = await apiClient.post<{ vehiculo: { id: string } }>('/mecanico/vehiculos', {
          patente: normalizePatenteAr(form.patente),
          marca: form.marca.trim(),
          modelo: form.modelo.trim(),
          anio: form.anio ? Number(form.anio) : null,
          medida_rueda: form.medida_rueda.trim() || null,
          cliente: {
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            telefono: form.telefono.trim() || null,
            email: form.email.trim() || null,
          },
        });
        vehiculoId = vRes.vehiculo.id;
      }

      const visRes = await apiClient.post<{ visita: { id: string } }>('/mecanico/visitas', {
        vehiculo_id: vehiculoId,
        motivo: form.motivo.trim() || null,
        observaciones: form.observaciones.trim() || null,
        estado_neumaticos: form.estado_neumaticos || null,
        estado_frenos: form.estado_frenos || null,
        presion_psi: form.presion_psi ? Number(form.presion_psi) : null,
        recomendacion: form.recomendacion.trim() || null,
      });

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(DRAFT_KEY);
      }
      router.replace(`/mecanico/visitas/${visRes.visita.id}`);
    } catch (saveError) {
      console.error('[NuevaVisitaWizard] Error al confirmar y guardar visita', saveError);
      setError('No pudimos guardar la visita. Revisá los datos e intentá de nuevo.');
      setIsGuardando(false);
    }
  };

  const progreso = useMemo(() => (step / 3) * 100, [step]);

  return (
    <div className="px-4 py-5 pb-40 max-w-lg mx-auto flex flex-col gap-4 overflow-x-hidden">
      <header className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nueva visita</p>
          <p className="text-sm font-semibold text-gray-800">Paso {step} de 3</p>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-[#C8102E] rounded-full transition-all duration-300" style={{ width: `${progreso}%` }} />
        </div>
      </header>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <Section title="Identificación del vehículo">
            <div className="px-4 py-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Patente</label>
              <div className="relative mt-2">
                <div className="flex gap-2">
                  <input
                    value={form.patente}
                    onChange={(e) => {
                      const nextPatente = e.target.value.toUpperCase();
                      setField('patente')(nextPatente);
                      limpiarVehiculoSeleccionadoSiCorresponde(nextPatente);
                      setError('');
                    }}
                    onBlur={() => {
                      const canon = normalizePatenteAr(form.patente);
                      if (canon) setField('patente')(formatPatenteArDisplay(canon));
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && buscarPorPatenteExacta()}
                    placeholder="Ej: AC 797 HP"
                    maxLength={12}
                    className="flex-1 min-w-0 h-14 px-4 bg-white border-2 border-gray-200 rounded-2xl text-2xl font-black tracking-wider text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#C8102E] uppercase"
                  />
                  <button
                    onClick={buscarPorPatenteExacta}
                    disabled={isBuscandoExacto || !form.patente.trim()}
                    className="h-14 px-4 shrink-0 bg-[#1F1F1F] text-white rounded-2xl disabled:opacity-40 active:scale-95 transition-transform text-sm font-semibold"
                  >
                    {isBuscandoExacto ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>

                {(isBuscandoSugerencias || sugerencias.length > 0) && (
                  <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {isBuscandoSugerencias && (
                      <p className="px-3 py-2 text-xs text-gray-500">Buscando sugerencias...</p>
                    )}
                    {!isBuscandoSugerencias &&
                      sugerencias.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            aplicarVehiculo(s);
                            setSugerencias([]);
                            setError('');
                          }}
                          className="w-full text-left px-3 py-2 border-t border-gray-100 first:border-t-0 hover:bg-gray-50"
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {s.patente} · {s.marca} {s.modelo} {s.anio ? `(${s.anio})` : ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            {s.clientes ? `${s.clientes.nombre} ${s.clientes.apellido}` : 'Sin cliente vinculado'}
                          </p>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {vehiculoSeleccionado && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Vehículo vinculado</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}
                  </p>
                  <p className="text-xs text-gray-500">
                    {vehiculoSeleccionado.clientes
                      ? `${vehiculoSeleccionado.clientes.nombre} ${vehiculoSeleccionado.clientes.apellido}`
                      : 'Sin cliente vinculado'}
                  </p>
                </div>
              )}
            </div>
          </Section>

          <Section title="Datos del vehículo">
            <Row label="Marca *">
              <Input placeholder="Toyota" value={form.marca} onChange={(e) => setField('marca')(e.target.value)} />
            </Row>
            <Row label="Modelo *">
              <Input placeholder="Corolla" value={form.modelo} onChange={(e) => setField('modelo')(e.target.value)} />
            </Row>
            <Row label="Año">
              <Input placeholder="2020" type="number" value={form.anio} onChange={(e) => setField('anio')(e.target.value)} />
            </Row>
            <Row label="Medida rueda">
              <Input
                placeholder="195/65 R15"
                value={form.medida_rueda}
                onChange={(e) => setField('medida_rueda')(e.target.value)}
              />
            </Row>
          </Section>

          <Section title="Titular del vehículo">
            <Row label="Nombre *">
              <Input placeholder="Juan" value={form.nombre} onChange={(e) => setField('nombre')(e.target.value)} />
            </Row>
            <Row label="Apellido *">
              <Input placeholder="García" value={form.apellido} onChange={(e) => setField('apellido')(e.target.value)} />
            </Row>
            <Row label="Teléfono *">
              <Input placeholder="3874000000" type="tel" value={form.telefono} onChange={(e) => setField('telefono')(e.target.value)} />
            </Row>
            <Row label="Email">
              <Input placeholder="juan@email.com" type="email" value={form.email} onChange={(e) => setField('email')(e.target.value)} />
            </Row>
          </Section>

          <Section title="Motivo de la visita">
            <div className="px-4 py-3">
              <Input
                placeholder="Ej: control general, cambio de neumáticos..."
                value={form.motivo}
                onChange={(e) => setField('motivo')(e.target.value)}
              />
            </div>
          </Section>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <Section title="Diagnóstico (opcional)">
            <div className="px-4 py-3">
              <DiagnosticoSection
                estadoNeumaticos={form.estado_neumaticos || null}
                setEstadoNeumaticos={(v) => setForm((f) => ({ ...f, estado_neumaticos: v || '' }))}
                estadoFrenos={form.estado_frenos || null}
                setEstadoFrenos={(v) => setForm((f) => ({ ...f, estado_frenos: v || '' }))}
                presionPsi={form.presion_psi}
                setPresionPsi={(v) => setForm((f) => ({ ...f, presion_psi: v }))}
                recomendacion={form.recomendacion}
                setRecomendacion={(v) => setForm((f) => ({ ...f, recomendacion: v }))}
              />
            </div>
          </Section>

          <Section title="Observaciones">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-500">Observaciones del mecánico</label>
                {speechDisponible && (
                  <button
                    onClick={() => iniciarDictado('observaciones')}
                    className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-700"
                  >
                    {dictadoTarget === 'observaciones' ? 'Dictando...' : 'Micrófono'}
                  </button>
                )}
              </div>
              <textarea
                value={form.observaciones}
                onChange={(e) => setField('observaciones')(e.target.value)}
                placeholder="Ej: ruido en freno delantero, se detecta desgaste irregular..."
                rows={4}
                className="w-full text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 bg-white shadow-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E] resize-none"
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-500">Recomendación para el cliente</label>
                {speechDisponible && (
                  <button
                    onClick={() => iniciarDictado('recomendacion')}
                    className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-700"
                  >
                    {dictadoTarget === 'recomendacion' ? 'Dictando...' : 'Micrófono'}
                  </button>
                )}
              </div>
              <textarea
                value={form.recomendacion}
                onChange={(e) => setField('recomendacion')(e.target.value)}
                placeholder="Ej: conviene alineación y revisar pastillas en 15 días..."
                rows={4}
                className="w-full text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 bg-white shadow-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E] resize-none"
              />
            </div>
          </Section>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <ResumenSection
            title="Identificación"
            onEdit={() => setStep(1)}
            lines={[
              ['Patente', form.patente || 'Sin completar'],
              ['Vehículo', `${form.marca || '-'} ${form.modelo || '-'}`],
              ['Año', form.anio || 'Sin dato'],
              ['Medida rueda', form.medida_rueda || 'Sin dato'],
              ['Cliente', `${form.nombre || ''} ${form.apellido || ''}`.trim() || 'Sin cliente'],
              ['Contacto', form.telefono || form.email || 'Sin contacto'],
              ['Motivo', form.motivo || 'Sin motivo'],
            ]}
          />

          <ResumenSection
            title="Diagnóstico"
            onEdit={() => setStep(2)}
            lines={[
              ['Estado neumáticos', labelEstado(form.estado_neumaticos)],
              ['Estado frenos', labelEstado(form.estado_frenos)],
              ['Presión PSI', form.presion_psi || 'Sin dato'],
              ['Observaciones', form.observaciones || 'Sin observaciones'],
              ['Recomendación', form.recomendacion || 'Sin recomendación'],
            ]}
          />
        </div>
      )}

      <footer className="fixed left-0 right-0 bottom-16 z-30 bg-white border-t border-gray-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={irAnterior}
              className="h-12 px-5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-base active:scale-95 transition-transform"
            >
              Anterior
            </button>
          )}

          {step < 3 && (
            <button
              onClick={irSiguiente}
              className="flex-1 h-12 rounded-xl bg-[#C8102E] text-white font-bold text-base active:scale-95 transition-transform"
            >
              {step === 2 ? 'Saltar / Siguiente' : 'Siguiente'}
            </button>
          )}

          {step === 3 && (
            <button
              onClick={confirmarYGuardar}
              disabled={isGuardando}
              className="flex-1 h-12 rounded-xl bg-[#C8102E] text-white font-bold text-base active:scale-95 transition-transform disabled:opacity-50"
            >
              {isGuardando ? 'Guardando...' : 'Confirmar y guardar'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function labelEstado(value: '' | EstadoDiagnostico) {
  if (!value) return 'Sin evaluar';
  if (value === 'buen_estado') return 'Buen estado';
  if (value === 'desgaste_medio') return 'Desgaste medio';
  return 'Reemplazo urgente';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

function ResumenSection({
  title,
  onEdit,
  lines,
}: {
  title: string;
  onEdit: () => void;
  lines: Array<[string, string]>;
}) {
  return (
    <Section title={title}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Resumen</p>
        <button onClick={onEdit} className="text-xs font-semibold text-[#C8102E]">
          Editar
        </button>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">
        {lines.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3">
            <p className="text-xs text-gray-500 shrink-0">{label}</p>
            <p className="text-sm text-right text-gray-800">{value}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function DiagnosticoSection({
  estadoNeumaticos,
  setEstadoNeumaticos,
  estadoFrenos,
  setEstadoFrenos,
  presionPsi,
  setPresionPsi,
  recomendacion,
  setRecomendacion,
}: {
  estadoNeumaticos: EstadoDiagnostico | null;
  setEstadoNeumaticos: (v: EstadoDiagnostico | null) => void;
  estadoFrenos: EstadoDiagnostico | null;
  setEstadoFrenos: (v: EstadoDiagnostico | null) => void;
  presionPsi: string;
  setPresionPsi: (v: string) => void;
  recomendacion: string;
  setRecomendacion: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diagnóstico (opcional)</p>

      <SelectorDiagnostico
        titulo="Estado de neumáticos"
        value={estadoNeumaticos}
        onChange={setEstadoNeumaticos}
      />
      <SelectorDiagnostico
        titulo="Estado de frenos"
        value={estadoFrenos}
        onChange={setEstadoFrenos}
      />

      <div>
        <label className="text-sm text-gray-500">Presión (PSI)</label>
        <input
          type="number"
          value={presionPsi}
          onChange={(e) => setPresionPsi(e.target.value)}
          placeholder="Ej: 32"
          className="mt-1 w-full h-10 px-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-500">Recomendación</label>
        </div>
        <textarea
          value={recomendacion}
          onChange={(e) => setRecomendacion(e.target.value)}
          placeholder="Ej: conviene alineación y control de pastillas en 15 días..."
          rows={3}
          className="w-full text-sm text-gray-900 placeholder-gray-400 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C8102E] resize-none"
        />
      </div>
    </div>
  );
}

function SelectorDiagnostico({
  titulo,
  value,
  onChange,
}: {
  titulo: string;
  value: EstadoDiagnostico | null;
  onChange: (v: EstadoDiagnostico | null) => void;
}) {
  const opciones: { id: EstadoDiagnostico; label: string }[] = [
    { id: 'buen_estado', label: 'Buen estado' },
    { id: 'desgaste_medio', label: 'Desgaste medio' },
    { id: 'reemplazo_urgente', label: 'Reemplazo urgente' },
  ];

  return (
    <div>
      <p className="text-sm text-gray-500 mb-1.5">{titulo}</p>
      <div className="grid grid-cols-1 gap-2">
        {opciones.map((op) => (
          <button
            key={op.id}
            onClick={() => onChange(value === op.id ? null : op.id)}
            className={`w-full text-left px-3 py-3 rounded-xl border text-sm font-medium ${
              value === op.id
                ? 'border-[#C8102E] bg-red-50 text-[#C8102E]'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center px-4 py-3 gap-3">
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function Input({ placeholder, type = 'text', value, onChange }: {
  placeholder: string; type?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-gray-300 bg-white text-base text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/35 focus:border-[#C8102E]"
    />
  );
}
