'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  medida_rueda: string | null;
  clientes: { id: string; nombre: string; apellido: string; telefono: string | null; email: string | null } | null;
}

type Modo = 'buscar' | 'registrar';
type Resultado = 'idle' | 'encontrado' | 'no_encontrado';

export default function NuevaVisita() {
  const router = useRouter();

  const [modo, setModo] = useState<Modo>('buscar');

  // ── Modo buscar ──
  const [patenteBusqueda, setPatenteBusqueda] = useState('');
  const [resultado, setResultado] = useState<Resultado>('idle');
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [motivo, setMotivo] = useState('');
  const [isBuscando, setIsBuscando] = useState(false);
  const [isIniciando, setIsIniciando] = useState(false);

  // ── Modo registrar ──
  const [form, setForm] = useState({
    patente: '', marca: '', modelo: '', anio: '', medida_rueda: '',
    nombre: '', apellido: '', telefono: '', email: '',
    motivo: '',
  });
  const [isRegistrando, setIsRegistrando] = useState(false);

  const [error, setError] = useState('');

  const buscar = async () => {
    const p = patenteBusqueda.trim().toUpperCase();
    if (!p) return;
    setError('');
    setIsBuscando(true);
    try {
      const res = await apiClient.get<{ vehiculo: Vehiculo | null }>(`/mecanico/vehiculos/buscar/${p}`);
      if (res.vehiculo) {
        setVehiculo(res.vehiculo);
        setResultado('encontrado');
      } else {
        setResultado('no_encontrado');
      }
    } catch {
      setError('Error al buscar. Intentá de nuevo.');
    } finally {
      setIsBuscando(false);
    }
  };

  const iniciarVisita = async () => {
    if (!vehiculo) return;
    setError('');
    setIsIniciando(true);
    try {
      const res = await apiClient.post<{ visita: { id: string } }>('/mecanico/visitas', {
        vehiculo_id: vehiculo.id,
        motivo: motivo.trim() || null,
      });
      router.replace(`/mecanico/visita/${res.visita.id}`);
    } catch {
      setError('Error al iniciar la visita.');
      setIsIniciando(false);
    }
  };

  const abrirRegistro = (patentePrellenada = '') => {
    setForm(f => ({ ...f, patente: patentePrellenada }));
    setModo('registrar');
    setError('');
  };

  const registrarYIniciar = async () => {
    if (!form.patente.trim()) { setError('La patente es obligatoria.'); return; }
    if (!form.marca.trim() || !form.modelo.trim()) { setError('Marca y modelo son obligatorios.'); return; }
    setError('');
    setIsRegistrando(true);
    try {
      const vRes = await apiClient.post<{ vehiculo: { id: string } }>('/mecanico/vehiculos', {
        patente: form.patente.trim().toUpperCase(),
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        anio: form.anio ? Number(form.anio) : null,
        medida_rueda: form.medida_rueda.trim() || null,
        cliente: (form.nombre.trim() || form.apellido.trim()) ? {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          telefono: form.telefono.trim() || null,
          email: form.email.trim() || null,
        } : undefined,
      });
      const visRes = await apiClient.post<{ visita: { id: string } }>('/mecanico/visitas', {
        vehiculo_id: vRes.vehiculo.id,
        motivo: form.motivo.trim() || null,
      });
      router.replace(`/mecanico/visita/${visRes.visita.id}`);
    } catch {
      setError('Error al registrar. Revisá los datos.');
      setIsRegistrando(false);
    }
  };

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  // ══════════════════════════════════════════
  // MODO BUSCAR
  // ══════════════════════════════════════════
  if (modo === 'buscar') {
    return (
      <div className="px-4 py-5 pb-28 flex flex-col gap-4 overflow-x-hidden">

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Patente del vehículo</label>
          <div className="flex gap-2 mt-2">
            <input
              value={patenteBusqueda}
              onChange={e => { setPatenteBusqueda(e.target.value.toUpperCase()); setResultado('idle'); setVehiculo(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="Ej: ABC123"
              maxLength={8}
              className="flex-1 min-w-0 h-14 px-4 bg-white border-2 border-gray-200 rounded-2xl text-2xl font-black tracking-wider text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#C8102E] uppercase"
            />
            <button
              onClick={buscar}
              disabled={isBuscando || !patenteBusqueda.trim()}
              className="h-14 w-14 shrink-0 bg-[#1F1F1F] text-white rounded-2xl disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center"
            >
              {isBuscando
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                : <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              }
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        {/* Vehículo encontrado */}
        {resultado === 'encontrado' && vehiculo && (
          <div className="flex flex-col gap-3">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Vehículo encontrado</p>
                  <p className="text-2xl font-black text-gray-900">{vehiculo.patente}</p>
                  <p className="text-gray-600 font-medium">{vehiculo.marca} {vehiculo.modelo}{vehiculo.anio && ` · ${vehiculo.anio}`}</p>
                  {vehiculo.medida_rueda && <p className="text-sm text-gray-400 mt-0.5">Rueda: {vehiculo.medida_rueda}</p>}
                </div>
                <span className="text-green-500 text-xl font-black">✓</span>
              </div>
              {vehiculo.clientes && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="font-bold text-gray-800">{vehiculo.clientes.nombre} {vehiculo.clientes.apellido}</p>
                  {vehiculo.clientes.telefono && <p className="text-sm text-gray-500">{vehiculo.clientes.telefono}</p>}
                  {vehiculo.clientes.email && <p className="text-sm text-gray-400">{vehiculo.clientes.email}</p>}
                </div>
              )}
            </div>
            <input
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Motivo de la visita (opcional)"
              className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
            <button
              onClick={iniciarVisita}
              disabled={isIniciando}
              className="w-full py-5 bg-[#C8102E] text-white font-extrabold text-lg rounded-2xl active:scale-95 transition-transform shadow-lg shadow-red-200 disabled:opacity-50"
            >
              {isIniciando ? 'Iniciando...' : 'Iniciar visita'}
            </button>
          </div>
        )}

        {/* No encontrado */}
        {resultado === 'no_encontrado' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="font-bold text-amber-800">Patente no registrada</p>
            <p className="text-sm text-amber-600 mt-0.5">"{patenteBusqueda}" no está en el sistema.</p>
          </div>
        )}

        {/* Separador + botón registrar — siempre visible */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-px bg-gray-200"/>
          <span className="text-xs text-gray-400 shrink-0">¿Vehículo nuevo?</span>
          <div className="flex-1 h-px bg-gray-200"/>
        </div>
        <button
          onClick={() => abrirRegistro(resultado === 'no_encontrado' ? patenteBusqueda : '')}
          className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold text-base rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Registrar vehículo nuevo
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // MODO REGISTRAR
  // ══════════════════════════════════════════
  return (
    <div className="px-4 py-5 pb-28 flex flex-col gap-4 overflow-x-hidden">

      <Section title="Patente">
        <div className="px-4 py-3">
          <input
            value={form.patente}
            onChange={e => setForm(f => ({ ...f, patente: e.target.value.toUpperCase() }))}
            placeholder="Ej: ABC123"
            maxLength={8}
            className="w-full text-3xl font-black tracking-wider text-gray-900 placeholder-gray-300 focus:outline-none bg-transparent uppercase"
          />
        </div>
      </Section>

      <Section title="Datos del vehículo">
        <Row label="Marca *"><Input placeholder="Toyota" value={form.marca} onChange={setField('marca')} /></Row>
        <Row label="Modelo *"><Input placeholder="Corolla" value={form.modelo} onChange={setField('modelo')} /></Row>
        <Row label="Año"><Input placeholder="2020" type="number" value={form.anio} onChange={setField('anio')} /></Row>
        <Row label="Medida rueda"><Input placeholder="195/65 R15" value={form.medida_rueda} onChange={setField('medida_rueda')} /></Row>
      </Section>

      <Section title="Cliente (opcional)">
        <Row label="Nombre"><Input placeholder="Juan" value={form.nombre} onChange={setField('nombre')} /></Row>
        <Row label="Apellido"><Input placeholder="García" value={form.apellido} onChange={setField('apellido')} /></Row>
        <Row label="Teléfono"><Input placeholder="3874000000" type="tel" value={form.telefono} onChange={setField('telefono')} /></Row>
        <Row label="Email"><Input placeholder="juan@email.com" type="email" value={form.email} onChange={setField('email')} /></Row>
      </Section>

      <Section title="Visita">
        <Row label="Motivo"><Input placeholder="Cambio de neumáticos..." value={form.motivo} onChange={setField('motivo')} /></Row>
      </Section>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      <button
        onClick={registrarYIniciar}
        disabled={isRegistrando}
        className="w-full py-5 bg-[#C8102E] text-white font-extrabold text-lg rounded-2xl active:scale-95 transition-transform shadow-lg shadow-red-200 disabled:opacity-50"
      >
        {isRegistrando ? 'Registrando...' : 'Registrar e iniciar visita'}
      </button>

      <button
        onClick={() => { setModo('buscar'); setError(''); setResultado('idle'); }}
        className="text-sm text-gray-400 text-center py-1"
      >
        ← Volver a buscar
      </button>
    </div>
  );
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
      className="flex-1 min-w-0 h-10 text-base text-gray-900 placeholder-gray-300 focus:outline-none bg-transparent"
    />
  );
}
