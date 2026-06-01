'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { normalizePatenteAr, formatPatenteArDisplay } from '@/lib/patente';
import { usePatenteSugerencias } from '@/hooks/usePatenteSugerencias';
import { Button } from '@/components/ui/button';

interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  medida_rueda: string | null;
  clientes: { id: string; nombre: string; apellido: string; telefono: string | null; email: string | null } | null;
}

const DRAFT_KEY = 'mecanico_nueva_visita_draft_v3';

export default function NuevaVisita() {
  const router = useRouter();
  const [patente, setPatente] = useState('');
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [motivo, setMotivo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const { sugerencias, setSugerencias, isBuscandoSugerencias } = usePatenteSugerencias(patente);
  const patenteCanon = useMemo(() => normalizePatenteAr(patente), [patente]);

  const aplicarVehiculo = (v: Vehiculo) => {
    setVehiculo(v);
    setMarca(v.marca);
    setModelo(v.modelo);
    setNombre(v.clientes?.nombre || '');
    setApellido(v.clientes?.apellido || '');
    setTelefono(v.clientes?.telefono || '');
    setPatente(formatPatenteArDisplay(v.patente));
    setSugerencias([]);
  };

  const buscarExacto = async () => {
    if (patenteCanon.length < 6) {
      setMsg('Ingresá al menos 6 caracteres de patente.');
      return;
    }
    setMsg(null);
    setBuscando(true);
    try {
      const res = await apiClient.get<{ vehiculo: Vehiculo | null }>(
        `/mecanico/vehiculos/buscar/${encodeURIComponent(patenteCanon)}`,
      );
      if (res.vehiculo) aplicarVehiculo(res.vehiculo);
      else {
        setVehiculo(null);
        setMarca('');
        setModelo('');
        setNombre('');
        setApellido('');
        setTelefono('');
        setMsg('No encontramos la patente. Completá marca y modelo abajo.');
      }
    } catch {
      setMsg('Error al buscar la patente.');
    } finally {
      setBuscando(false);
    }
  };

  const crearVisita = async () => {
    setMsg(null);
    if (!patenteCanon || !marca.trim() || !modelo.trim()) {
      setMsg('Patente, marca y modelo son obligatorios.');
      return;
    }
    if (!nombre.trim() || !apellido.trim()) {
      setMsg('Nombre y apellido del cliente son obligatorios.');
      return;
    }

    setCreando(true);
    try {
      let vid = vehiculo?.id;
      if (!vid) {
        const vRes = await apiClient.post<{ vehiculo: { id: string } }>('/mecanico/vehiculos', {
          patente: patenteCanon,
          marca: marca.trim(),
          modelo: modelo.trim(),
          cliente: {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            telefono: telefono.trim() || null,
          },
        });
        vid = vRes.vehiculo.id;
      } else if (vehiculo) {
        const c = vehiculo.clientes;
        const cambioCliente =
          nombre.trim() !== (c?.nombre || '') ||
          apellido.trim() !== (c?.apellido || '') ||
          telefono.trim() !== (c?.telefono || '');
        if (c && cambioCliente) {
          await apiClient.patch(`/mecanico/vehiculos/${vid}`, {
            cliente: {
              nombre: nombre.trim(),
              apellido: apellido.trim(),
              telefono: telefono.trim() || null,
            },
          });
        }
      }

      const visRes = await apiClient.post<{ visita: { id: string } }>('/mecanico/visitas', {
        vehiculo_id: vid,
        motivo: motivo.trim() || null,
      });

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(DRAFT_KEY);
      }
      router.replace(`/mecanico/visitas/${visRes.visita.id}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'No se pudo crear la visita.');
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-5 pb-28">
      <h1 className="text-xl font-black text-gray-900">Nueva visita</h1>
      <p className="text-sm text-gray-500">
        Identificá el vehículo por patente. Después completás el presupuesto en el detalle.
      </p>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
        <label className="text-xs font-bold text-gray-500 uppercase">Patente</label>
        <input
          value={patente}
          onChange={(e) => {
            setPatente(e.target.value.toUpperCase());
            setMsg(null);
          }}
          onBlur={() => {
            if (patenteCanon) setPatente(formatPatenteArDisplay(patenteCanon));
          }}
          placeholder="AA123BB"
          className="w-full h-14 px-4 text-xl font-bold tracking-widest rounded-xl border border-gray-200 uppercase"
          autoCapitalize="characters"
        />
        {sugerencias.length > 0 && (
          <div className="flex flex-col gap-1">
            {sugerencias.map((s) => (
              <button
                key={s.id}
                type="button"
                className="text-left py-3 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm active:bg-gray-200"
                onClick={() => aplicarVehiculo(s)}
              >
                <span className="font-bold">{formatPatenteArDisplay(s.patente)}</span>{' '}
                <span className="text-gray-600">
                  {s.marca} {s.modelo}
                </span>
              </button>
            ))}
          </div>
        )}
        {(isBuscandoSugerencias || buscando) && <p className="text-xs text-gray-400">Buscando…</p>}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-xl font-bold"
          onClick={buscarExacto}
        >
          Buscar patente
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-500 uppercase">Datos del vehículo</p>
        <input
          placeholder="Marca"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base"
        />
        <input
          placeholder="Modelo"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-500 uppercase">Cliente</p>
        <input
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base"
        />
        <input
          placeholder="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base"
        />
        <input
          placeholder="Teléfono (opcional)"
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-500 uppercase">Motivo (opcional)</p>
        <input
          placeholder="Ej: control general, ruido en tren delantero…"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base"
        />
      </div>

      {msg && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{msg}</p>}

      <Button
        className="w-full h-14 rounded-2xl text-lg font-black"
        disabled={creando}
        onClick={crearVisita}
      >
        {creando ? 'Creando…' : 'Continuar al presupuesto'}
      </Button>
    </div>
  );
}
